import fs from 'fs';
import path from 'path';
import { DatabaseState } from '../../server/db.js';

const DATA_FILE = path.join(process.cwd(), 'voxline_data.json');

export function loadJsonDb(): DatabaseState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content) as DatabaseState;
    }
  } catch (err) {
    console.error('jsonAdapter: error reading data file', err);
  }
  // If file missing or error, fall back to empty DB loaded from server/db.ts seed (that module seeds during import)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { loadDatabaseFromDisk } = require('../../server/db.js');
  return loadDatabaseFromDisk();
}

export function saveJsonDb(state: DatabaseState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('jsonAdapter: error saving data file', err);
    throw err;
  }
}

export function backupJsonDb() {
  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(backupsDir, `voxline_data_${ts}.json`);
    if (fs.existsSync(DATA_FILE)) fs.copyFileSync(DATA_FILE, dest);
  } catch (err) {
    console.error('jsonAdapter: backup failed', err);
  }
}
