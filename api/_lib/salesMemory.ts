import { getDb, saveDb } from '../_lib/dbAdapter.js';

export function getSalesMemory(companyId: string) {
  const db = getDb();
  return (db.ai_memory || []).filter((m: any) => m.company_id === companyId);
}

export function addSalesMemory(entry: { company_id: string; memory_type: string; content: string; confidence?: number; created_at?: string; workspace_id?: string }) {
  const db = getDb();
  const e = {
    id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    company_id: entry.company_id,
    memory_type: entry.memory_type,
    content: entry.content,
    confidence: entry.confidence || 80,
    created_at: entry.created_at || new Date().toISOString(),
    workspace_id: entry.workspace_id || null
  };
  db.ai_memory = db.ai_memory || [];
  db.ai_memory.unshift(e);
  if (db.ai_memory.length > 5000) db.ai_memory.pop();
  saveDb(db);
  return e;
}
