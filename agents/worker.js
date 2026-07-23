import { claimNextJobSql, claimNextJobJson, completeJob, failJob, sweepStaleLocks } from '../api/_lib/agentJobManager.js';
import { getDb, saveDb } from '../api/_lib/dbAdapter.js';
import pg from 'pg';

const WORKER_ID = process.env.WORKER_ID || `worker-${Math.floor(Math.random()*1000)}`;
const POLL_INTERVAL_MS = Number(process.env.WORKER_POLL_MS || 2000);
const STALE_LOCK_SECONDS = Number(process.env.WORKER_STALE_SECONDS || 600);

let pgClient = null;
const ADAPTER = (process.env.DATABASE_ADAPTER || 'json').toLowerCase();

async function initPg() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('PG not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Worker will run in JSON mode.');
    return null;
  }
  const conn = new pg.Client({ connectionString: process.env.SUPABASE_URL, password: process.env.SUPABASE_SERVICE_ROLE_KEY });
  await conn.connect();
  return conn;
}

async function claimNextJobPg() {
  // runs atomic claim SQL; returns the claimed job record
  const res = await pgClient.query(claimNextJobSql, [WORKER_ID]);
  if (res.rows && res.rows.length > 0) return res.rows[0];
  return null;
}

async function runWorkerLoop() {
  if (ADAPTER === 'supabase') {
    pgClient = await initPg();
    if (!pgClient) {
      console.error('Supabase not configured. Exiting worker.');
      process.exit(1);
    }
  }

  console.log(`Worker ${WORKER_ID} starting (adapter=${ADAPTER})`);

  // periodic sweep for stale locks
  setInterval(() => {
    try {
      const reclaimed = sweepStaleLocks(STALE_LOCK_SECONDS);
      if (reclaimed) console.log(`Worker ${WORKER_ID} reclaimed ${reclaimed} stale locks`);
    } catch (err) {
      console.error('Error during stale lock sweep', err);
    }
  }, Math.max(30000, POLL_INTERVAL_MS));

  while (true) {
    try {
      let job = null;
      if (ADAPTER === 'supabase') {
        job = await claimNextJobPg();
      } else {
        job = claimNextJobJson(WORKER_ID);
      }

      if (!job) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }

      // capture owner for ownership checks
      const myLockOwner = job.lock_owner || WORKER_ID;

      console.log(`${new Date().toISOString()} Worker ${WORKER_ID} claimed job ${job.id} type=${job.job_type} owner=${myLockOwner}`);

      // dispatch to handler map
      try {
        const output = await dispatchJobHandler(job);
        // call completeJob with expectedOwner to avoid ownership race overwrites
        completeJob(job.id, output, myLockOwner);
        console.log(`${new Date().toISOString()} Worker ${WORKER_ID} completed job ${job.id}`);
      } catch (err) {
        console.error(`${new Date().toISOString()} Worker ${WORKER_ID} job ${job.id} failed:`, err.message || err);
        // compute exponential backoff base 60s
        const db = getDb();
        const j = db.agent_jobs.find((x) => x.id === job.id);
        const retryCount = (j && j.retry_count) ? j.retry_count : 1;
        const delay = Math.min(3600, Math.pow(2, retryCount || 1) * 60);
        // Use expectedOwner to ensure we don't stomp if job was reclaimed
        failJob(job.id, { message: err.message || String(err), detail: err.stack || null }, delay, myLockOwner);
      }
    } catch (err) {
      console.error('Worker loop error', err);
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

async function dispatchJobHandler(job) {
  // Minimal handler registry for smoke tests. Real handlers (discovery, research, outreach) live in agents/*.ts
  const type = job.job_type;
  if (type === 'discovery') return handlerDiscovery(job);
  if (type === 'research') return handlerResearch(job);
  if (type === 'noop_fail_once') return handlerFailOnce(job);
  if (type === 'noop_always_fail') return handlerAlwaysFail(job);
  return { message: `No handler for job_type=${type}` };
}

async function handlerDiscovery(job) {
  // Simulate discovery work: read input and add a company
  const db = getDb();
  const id = 'comp-test-' + Date.now();
  const company = { id, name: `Test Co ${Date.now()}`, industry: job.input.industry || 'Test', website: 'https://example.com', is_verified: false, source: 'worker-sim', discovered_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_deleted: false };
  db.companies.unshift(company);
  saveDb(db);
  return { created_company_id: id };
}

async function handlerResearch(job) {
  // Simulate research by adding a research report referencing company
  const db = getDb();
  const id = 'res-' + Date.now();
  const company_id = job.company_id || (job.input && job.input.company_id) || null;
  const report = { id, company_id, summary: 'Simulated research summary', website_quality: 'good', marketing_level: 'moderate', support_quality: 'manual', ai_opportunities: ['Opportunity 1'], automation_need_score: 75, version: 1, created_at: new Date().toISOString() };
  db.research_reports.unshift(report);
  saveDb(db);
  return { report_id: id };
}

let failCounts = {};
async function handlerFailOnce(job) {
  // Will fail the first two times, succeed third time for testing retry/backoff logic
  const key = job.id;
  failCounts[key] = (failCounts[key] || 0) + 1;
  if (failCounts[key] < 3) {
    throw new Error(`simulated transient failure attempt ${failCounts[key]}`);
  }
  return { message: `succeeded on attempt ${failCounts[key]}` };
}

async function handlerAlwaysFail(job) {
  throw new Error('simulated permanent failure');
}

// Start worker when executed directly
if (process.argv[1].endsWith('/agents/worker.js') || process.argv[1].endsWith('worker.js')) {
  runWorkerLoop();
}

export { runWorkerLoop };
