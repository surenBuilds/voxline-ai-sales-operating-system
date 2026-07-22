import { getDb, saveDb } from '../api/_lib/dbAdapter.js';

export function createAgentJobRecord({ agent_id, job_type, company_id = null, input = {}, initiated_by = 'system', workspace_id = null }) {
  const db = getDb();
  const jobId = 'job-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  const job = {
    id: jobId,
    agent_id,
    company_id,
    job_type,
    status: 'queued',
    input,
    output: null,
    retry_count: 0,
    error: null,
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    initiated_by,
    workspace_id
  };
  db.agent_jobs.unshift(job);
  if (db.agent_jobs.length > 1000) db.agent_jobs.pop();
  saveDb(db);
  return job;
}

export async function runAgentJob(job, worker: (job: any) => Promise<any>) {
  const db = getDb();
  // Update to running
  const j = db.agent_jobs.find((x) => x.id === job.id);
  if (!j) throw new Error('Agent job not found');
  j.status = 'running';
  j.started_at = new Date().toISOString();
  saveDb(db);

  try {
    const output = await worker(job);
    j.status = 'success';
    j.output = output;
    j.completed_at = new Date().toISOString();
    saveDb(db);
    return j;
  } catch (err: any) {
    j.status = 'failed';
    j.error = {
      message: err.message || 'Unknown error',
      detail: err.stack || null
    };
    j.completed_at = new Date().toISOString();
    saveDb(db);
    throw err;
  }
}
