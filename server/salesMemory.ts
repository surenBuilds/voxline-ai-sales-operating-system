import { getDb, saveDatabaseToDisk } from './db.js';
import { AIMemoryEntry } from '../src/types/index.js';

export function getSalesMemory(companyId: string): AIMemoryEntry[] {
  const db = getDb();
  return (db.ai_memory_entries || []).filter((m) => m.company_id === companyId);
}

// Recent memories across ALL companies, used as generalized "lessons learned"
// when drafting outreach to a company we haven't talked to before.
export function getRecentGlobalMemory(limit = 10): AIMemoryEntry[] {
  const db = getDb();
  return (db.ai_memory_entries || []).slice(0, limit);
}

export function addSalesMemory(entry: {
  company_id: string;
  memory_type: 'rejection' | 'preference' | 'change_detected' | 'past_proposal' | 'key_decision';
  content: string;
  confidence?: number;
}): AIMemoryEntry {
  const db = getDb();
  const e: AIMemoryEntry = {
    id: 'mem-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    company_id: entry.company_id,
    memory_type: entry.memory_type,
    content: entry.content,
    confidence: entry.confidence ?? 80,
    created_at: new Date().toISOString()
  };
  db.ai_memory_entries = db.ai_memory_entries || [];
  db.ai_memory_entries.unshift(e);
  if (db.ai_memory_entries.length > 5000) db.ai_memory_entries.pop();
  saveDatabaseToDisk();
  return e;
}

export function buildMemoryContext(companyId: string): string {
  const own = getSalesMemory(companyId);
  const global = getRecentGlobalMemory(10).filter((m) => m.company_id !== companyId);

  const parts: string[] = [];
  if (own.length) {
    parts.push(
      'Previous interactions with THIS company:\n' +
        own.map((m) => `- [${m.memory_type}] ${m.content}`).join('\n')
    );
  }
  if (global.length) {
    parts.push(
      'General lessons learned from other companies (use only if relevant, do not mention them by name):\n' +
        global.map((m) => `- [${m.memory_type}] ${m.content}`).join('\n')
    );
  }
  return parts.join('\n\n');
}
