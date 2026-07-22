import { loadJsonDb, saveJsonDb, backupJsonDb } from './jsonAdapter.js';
import { DatabaseState } from '../../server/db.js';

const ADAPTER = (process.env.DATABASE_ADAPTER || 'json').toLowerCase();

let supabaseAdapter: any = null;
try {
  if (ADAPTER === 'supabase') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    supabaseAdapter = require('./supabaseAdapter.js');
  }
} catch (err) {
  // ignore
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
