import { loadJsonDb, saveJsonDb, backupJsonDb } from './jsonAdapter.js';
import { DatabaseState } from '../../server/db.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ADAPTER = (process.env.DATABASE_ADAPTER || 'json').toLowerCase();

let supabaseAdapter: any = null;
if (ADAPTER === 'supabase') {
  try {
    // Use synchronous require via createRequire to load a CommonJS shim if present.
    supabaseAdapter = require('./supabaseAdapter.js');
    if (!supabaseAdapter || typeof supabaseAdapter.getDb !== 'function' || typeof supabaseAdapter.saveDb !== 'function') {
      throw new Error('supabaseAdapter.js must export getDb and saveDb functions');
    }
  } catch (err) {
    // Fail loudly — do not silently fall back to JSON when the adapter is explicitly requested
    throw new Error(`Failed to load supabaseAdapter.js for DATABASE_ADAPTER=supabase: ${err.message}`);
  }
}

export function getDb(): DatabaseState {
  if (ADAPTER === 'supabase' && supabaseAdapter && supabaseAdapter.getDb) {
    return supabaseAdapter.getDb();
  }
  return loadJsonDb();
}

export function saveDb(state: DatabaseState) {
  if (ADAPTER === 'supabase' && supabaseAdapter && supabaseAdapter.saveDb) {
    return supabaseAdapter.saveDb(state);
  }
  backupJsonDb();
  return saveJsonDb(state);
}

export function backupDb() {
  if (ADAPTER === 'supabase' && supabaseAdapter && supabaseAdapter.backupDb) {
    return supabaseAdapter.backupDb();
  }
  return backupJsonDb();
}
