import { getDb, saveDb } from './dbAdapter.js';
import { AgentJob } from '../../src/types/index.js';

/**
 * Agent Job Manager
 * - Provides helpers to enqueue jobs, claim jobs (JSON adapter safe), and complete/fail jobs.
 * - Includes SQL template (commented) for an atomic claim using Postgres `FOR UPDATE SKIP LOCKED`.
 *
 * Notes:
 * - JSON adapter is not concurrent-safe; the worker MUST be single-instance in local dev when using JSON.
 * - For production (Supabase/Postgres) use the provided SQL claim template in `claimNextJobSql()` executed via your DB client.
 */

export function createAgentJobRecord({ agent_id, job_type, company_id = null, input = {}, initiated_by = 'system', workspace_id = null, next_run_at = null, max_attempts = 3 }) {
  const db = getDb();
  const jobId = 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const job: AgentJob = {
    id: jobId,
    agent_id,
    company_id,
    job_type,
    status: 'queued',
    input,
    output: null,
    retry_count: 0,
    max_attempts,
    error: null,
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    initiated_by,
    workspace_id,
    next_run_at: next_run_at || new Date().toISOString(),
    lock_owner: null,
    locked_at: null
  };
  db.agent_jobs.unshift(job);
  if (db.agent_jobs.length > 5000) db.agent_jobs.pop();
  saveDb(db);
  return job;
}

// JSON-based claim (single-worker/dev only)
export function claimNextJobJson(workerId = 'worker-1') {
  const db = getDb();
  // find the next queued job which is due
  const now = new Date().toISOString();
  const idx = db.agent_jobs.findIndex((j) => j.status === 'queued' && (!j.next_run_at || j.next_run_at <= now));
  if (idx === -1) return null;
  const job = db.agent_jobs[idx];
  // Atomically update in memory
  job.status = 'running';
  job.lock_owner = workerId;
  job.locked_at = new Date().toISOString();
  job.retry_count = (job.retry_count || 0) + 1;
  job.started_at = job.started_at || new Date().toISOString();
  saveDb(db);
  return job;
}

/*
Postgres atomic claim SQL (use this with Supabase or a PG client). Example query to run atomically:

WITH cte AS (
  SELECT id FROM agent_jobs
  WHERE status = 'queued' AND (next_run_at IS NULL OR next_run_at <= now())
  ORDER BY next_run_at ASC NULLS FIRST
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE agent_jobs
SET status = 'running', lock_owner = $1, locked_at = now(), retry_count = COALESCE(retry_count,0)+1, started_at = COALESCE(started_at, now())
WHERE id IN (SELECT id FROM cte)
RETURNING *;

This ensures that under concurrent workers, only a single worker claims the row.
*/
export const claimNextJobSql = `-- use with a parameter for lock_owner
WITH cte AS (
  SELECT id FROM agent_jobs
  WHERE status = 'queued' AND (next_run_at IS NULL OR next_run_at <= now())
  ORDER BY next_run_at ASC NULLS FIRST
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
UPDATE agent_jobs
SET status = 'running', lock_owner = $1, locked_at = now(), retry_count = COALESCE(retry_count,0)+1, started_at = COALESCE(started_at, now())
WHERE id IN (SELECT id FROM cte)
RETURNING *;`;

export function completeJob(jobId, output = {}, expectedOwner = null) {
  const db = getDb();
  const j = db.agent_jobs.find((x) => x.id === jobId);
  if (!j) throw new Error('Agent job not found');
  // If expectedOwner provided, ensure caller still owns the lock
  if (expectedOwner && j.lock_owner && j.lock_owner !== expectedOwner) {
    console.warn(`completeJob: lock owner mismatch for ${jobId} (expected=${expectedOwner}, actual=${j.lock_owner}), skipping write`);
    return j;
  }
  j.status = 'success';
  j.output = output;
  j.completed_at = new Date().toISOString();
  j.lock_owner = null;
  j.locked_at = null;
  saveDb(db);
  return j;
}

export function failJob(jobId, errorObj: { message?: string; detail?: any } = {}, retryDelaySeconds = 60, expectedOwner = null) {
  const db = getDb();
  const j = db.agent_jobs.find((x) => x.id === jobId);
  if (!j) throw new Error('Agent job not found');
  // ownership check
  if (expectedOwner && j.lock_owner && j.lock_owner !== expectedOwner) {
    console.warn(`failJob: lock owner mismatch for ${jobId} (expected=${expectedOwner}, actual=${j.lock_owner}), skipping write`);
    return j;
  }
  j.error = { message: errorObj.message || 'Error', detail: errorObj.detail || null };
  j.completed_at = new Date().toISOString();
  j.lock_owner = null;
  j.locked_at = null;
  // Corrected dead-letter check: do NOT add +1 because retry_count is incremented at claim time
  if ((j.retry_count || 0) >= (j.max_attempts || 3)) {
    j.status = 'dead_letter';
  } else {
    // schedule retry
    j.status = 'queued';
    j.next_run_at = new Date(Date.now() + retryDelaySeconds * 1000).toISOString();
  }
  saveDb(db);
  return j;
}

// Sweep stale locks: any job stuck in 'running' with locked_at older than `staleSeconds` will be reset to queued
export function sweepStaleLocks(staleSeconds = 600) {
  const db = getDb();
  const threshold = new Date(Date.now() - staleSeconds * 1000).toISOString();
  let reclaimed = 0;
  for (const j of db.agent_jobs) {
    if (j.status === 'running' && j.locked_at && j.locked_at < threshold) {
      j.status = 'queued';
      j.lock_owner = null;
      j.locked_at = null;
      j.next_run_at = new Date().toISOString();
      reclaimed++;
    }
  }
  if (reclaimed > 0) saveDb(db);
  return reclaimed;
}

// Simple inline runner for compatibility (keeps previous behavior)
export async function runAgentJob(job, worker: (job: any) => Promise<any>) {
  const db = getDb();
  const j = db.agent_jobs.find((x) => x.id === job.id);
  if (!j) throw new Error('Agent job not found');
  j.status = 'running';
  j.started_at = new Date().toISOString();
  j.lock_owner = 'inline-runner';
  j.locked_at = new Date().toISOString();
  j.retry_count = (j.retry_count || 0) + 1;
  saveDb(db);

  try {
    const output = await worker(job);
    // use ownership-aware complete
    completeJob(job.id, output, 'inline-runner');
    return getDb().agent_jobs.find((x) => x.id === job.id);
  } catch (err: any) {
    // compute exponential backoff delay
    const delay = Math.min(3600, Math.pow(2, j.retry_count || 1) * 60);
    // delegate to failJob which handles retry_count/dead-letter logic
    failJob(job.id, { message: err.message || 'Unknown error', detail: err.stack || null }, delay, 'inline-runner');
    throw err;
  }
}
