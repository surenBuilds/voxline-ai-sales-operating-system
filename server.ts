import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb, addAuditLog, saveDatabaseToDisk, generateSupabaseSQLScript } from './server/db.js';
import { VoxlineBrain } from './server/brain.js';
import { runAIProposalGenerator } from './server/ai.js';
import { sendMessageById } from './server/messaging.js';
import { startAutonomousScheduler } from './server/scheduler.js';
import { sendOutboundEmail } from './server/email.js';
import { isPlaceholderEmail } from './server/emailEnrichment.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // CORS / Auth headers middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
      return res.sendStatus(200);
    }
    next();
  });

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'Voxline AI — Sales OS' });
  });

  // 1. AUTH API
  app.get('/api/auth/me', (req, res) => {
    const db = getDb();
    res.json({ user: db.users[0] });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Require a shared password if VOXLINE_APP_PASSWORD is configured.
    // Without this, anyone who finds the URL could log in as CEO with
    // just any email address — this closes that gap. If the env var
    // isn't set, login stays open (dev/local convenience).
    const requiredPassword = process.env.VOXLINE_APP_PASSWORD;
    if (requiredPassword && password !== requiredPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const db = getDb();
    const user = db.users.find(u => u.email === email) || db.users[0];
    res.json({ user, token: 'voxline-jwt-session-' + Date.now() });
  });

  // 2. COMPANIES API (CRM)
  app.get('/api/companies', (req, res) => {
    const db = getDb();
    const showDeleted = req.query.include_deleted === 'true';
    const industry = req.query.industry as string;
    const stage = req.query.stage as string;
    const search = req.query.search as string;

    let list = db.companies.filter(c => showDeleted ? true : !c.is_deleted);

    if (industry && industry !== 'all') {
      list = list.filter(c => c.industry.toLowerCase() === industry.toLowerCase());
    }
    if (stage && stage !== 'all') {
      list = list.filter(c => c.pipeline_stage === stage);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q)));
    }

    res.json({ companies: list });
  });

  app.get('/api/companies/:id', (req, res) => {
    const db = getDb();
    const comp = db.companies.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    const contacts = db.contacts.filter(ct => ct.company_id === comp.id);
    const research = db.research_reports.find(r => r.company_id === comp.id);
    const opportunities = db.opportunities.filter(o => o.company_id === comp.id);
    const leadScore = db.lead_scores.find(l => l.company_id === comp.id);
    const conversation = db.conversations.find(cv => cv.company_id === comp.id);
    const messages = conversation ? db.messages.filter(m => m.conversation_id === conversation.id) : [];
    const meetings = db.meetings.filter(m => m.company_id === comp.id);
    const proposals = db.proposals.filter(p => p.company_id === comp.id);
    const notes = db.notes.filter(n => n.company_id === comp.id);
    const memories = db.ai_memory_entries.filter(m => m.company_id === comp.id);

    res.json({
      company: comp,
      contacts,
      research,
      opportunities,
      lead_score: leadScore,
      conversation,
      messages,
      meetings,
      proposals,
      notes,
      memories
    });
  });

  app.post('/api/companies', (req, res) => {
    const db = getDb();
    const comp: any = {
      id: 'comp-' + Date.now(),
      name: req.body.name || 'New Prospect',
      industry: req.body.industry || 'General',
      address: req.body.address || 'Yerevan, Armenia',
      website: req.body.website || '',
      phone: req.body.phone || '',
      email: req.body.email || '',
      instagram: req.body.instagram || '',
      business_size: req.body.business_size || '11-50',
      description: req.body.description || '',
      status: 'discovered',
      pipeline_stage: 'discovery',
      source: req.body.source || 'Manual Creation',
      discovered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
      lead_score: 50,
      lead_score_tier: 'warm'
    };
    db.companies.unshift(comp);
    addAuditLog('companies', comp.id, 'INSERT', null, comp);
    saveDatabaseToDisk();

    // Trigger research automatically
    VoxlineBrain.runResearchAgent(comp.id).catch(err => console.error('Auto research error:', err));

    res.json({ company: comp });
  });

  app.put('/api/companies/:id', (req, res) => {
    const db = getDb();
    const idx = db.companies.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Company not found' });

    const oldData = { ...db.companies[idx] };
    db.companies[idx] = {
      ...db.companies[idx],
      ...req.body,
      updated_at: new Date().toISOString()
    };
    addAuditLog('companies', req.params.id, 'UPDATE', oldData, db.companies[idx]);
    saveDatabaseToDisk();
    res.json({ company: db.companies[idx] });
  });

  // Soft delete company
  app.delete('/api/companies/:id', (req, res) => {
    const db = getDb();
    const comp = db.companies.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    const oldData = { ...comp };
    comp.is_deleted = true;
    comp.deleted_at = new Date().toISOString();
    comp.deleted_by = 'Suren Hambardzumyan (CEO)';
    comp.updated_at = new Date().toISOString();

    addAuditLog('companies', comp.id, 'SOFT_DELETE', oldData, comp);
    saveDatabaseToDisk();
    res.json({ success: true, company: comp });
  });

  // Restore soft-deleted company
  app.post('/api/companies/:id/restore', (req, res) => {
    const db = getDb();
    const comp = db.companies.find(c => c.id === req.params.id);
    if (!comp) return res.status(404).json({ error: 'Company not found' });

    comp.is_deleted = false;
    comp.deleted_at = undefined;
    comp.deleted_by = undefined;
    comp.updated_at = new Date().toISOString();

    addAuditLog('companies', comp.id, 'UPDATE', null, comp);
    saveDatabaseToDisk();
    res.json({ success: true, company: comp });
  });

  // 3. RESEARCH & SCOUT AGENT API
  app.post('/api/agents/scout', async (req, res) => {
    try {
      const { industry, region } = req.body;
      const result = await VoxlineBrain.runScoutAgent(industry || 'Healthcare', region || 'Yerevan');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Scout Agent error' });
    }
  });

  app.post('/api/research/:companyId', async (req, res) => {
    try {
      const result = await VoxlineBrain.runResearchAgent(req.params.companyId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Research Agent error' });
    }
  });

  // 4. CONVERSATIONS & MESSAGES API
  app.get('/api/conversations', (req, res) => {
    const db = getDb();
    const list = db.conversations.map(conv => {
      const comp = db.companies.find(c => c.id === conv.company_id);
      const msgs = db.messages.filter(m => m.conversation_id === conv.id);
      return {
        ...conv,
        company_name: comp ? comp.name : 'Unknown',
        company_industry: comp ? comp.industry : 'General',
        messages: msgs
      };
    });
    res.json({ conversations: list });
  });

  app.post('/api/messages/draft', async (req, res) => {
    try {
      const { company_id, lang } = req.body;
      const result = await VoxlineBrain.runSalesAgentDraftJob(company_id, lang || 'am');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Draft creation failed' });
    }
  });

  app.post('/api/messages/:id/approve', (req, res) => {
    const db = getDb();
    const msg = db.messages.find(m => m.id === req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    msg.status = 'approved';
    msg.approved_by = 'usr-ceo';
    saveDatabaseToDisk();

    res.json({ message: msg });
  });

  app.post('/api/messages/:id/send', async (req, res) => {
    const result = await sendMessageById(req.params.id);
    res.status(result.status).json(result.body);
  });

  // 5. PROPOSALS & AI PROPOSAL GENERATOR
  app.get('/api/proposals', (req, res) => {
    const db = getDb();
    const list = db.proposals.map(p => {
      const comp = db.companies.find(c => c.id === p.company_id);
      return {
        ...p,
        company_name: comp ? comp.name : 'Unknown'
      };
    });
    res.json({ proposals: list });
  });

  app.post('/api/proposals/generate', async (req, res) => {
    try {
      const { company_id } = req.body;
      const db = getDb();
      const comp = db.companies.find(c => c.id === company_id);
      if (!comp) return res.status(404).json({ error: 'Company not found' });

      const opps = db.opportunities.filter(o => o.company_id === company_id);
      const generated = await runAIProposalGenerator(comp.name, comp.industry, opps);

      const prop = {
        id: 'prop-' + Date.now(),
        company_id: company_id,
        line_items: generated.line_items || [],
        estimated_value: generated.estimated_value || 1500,
        status: 'draft' as const,
        roi_projection: generated.roi_projection,
        implementation_timeline: generated.implementation_timeline,
        is_ai_generated: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      db.proposals.unshift(prop);
      comp.pipeline_stage = 'proposal_sent';
      saveDatabaseToDisk();

      res.json({ proposal: prop });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Proposal generation failed' });
    }
  });

  // 6. KNOWLEDGE BASE API
  app.get('/api/kb', (req, res) => {
    const db = getDb();
    res.json({ articles: db.kb_articles });
  });

  app.post('/api/kb', (req, res) => {
    const db = getDb();
    const article = {
      id: 'kb-' + Date.now(),
      category: req.body.category || 'Services',
      title: req.body.title || 'Untitled Article',
      content: req.body.content || '',
      version: 1,
      is_published: true,
      updated_at: new Date().toISOString()
    };
    db.kb_articles.unshift(article as any);
    saveDatabaseToDisk();
    res.json({ article });
  });

  // 7. CEO BRIEF & STRATEGIC RECOMMENDATIONS (AI CEO)
  app.get('/api/ceo/brief', (req, res) => {
    const db = getDb();

    // Top 20 qualified leads
    const topLeads = db.companies
      .filter(c => !c.is_deleted)
      .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0))
      .slice(0, 20);

    const pendingProposalsValue = db.proposals
      .filter(p => p.status === 'sent')
      .reduce((sum, p) => sum + p.estimated_value, 0);

    const brief = {
      generated_at: new Date().toISOString(),
      top_20_leads: topLeads,
      expected_revenue_usd: pendingProposalsValue + 28500,
      pipeline_health_score: 94,
      highest_priority_opportunities: [
        { type: 'Healthcare AI Chatbot', count: 14, avg_deal_usd: 1800 },
        { type: 'Voice Call Reservation Bot', count: 8, avg_deal_usd: 2400 },
        { type: 'Omni-channel CRM Sync', count: 11, avg_deal_usd: 950 }
      ],
      recommended_actions: [
        'Approve pending Armenian outreach message for Nairi Medical Center',
        'Review AI CEO strategic recommendation to shift 40% capacity to Healthcare',
        'Send revised proposal for Yeremyan Products holding'
      ],
      potential_risks: [
        '2 hotel prospects have been inactive for > 10 days — trigger Follow-up Agent',
        'SmartBot Armenia released a basic restaurant Telegram template — review pricing'
      ],
      weekly_goals: [
        { target: 15, current: 12, metric: 'Qualified Leads' },
        { target: 5, current: 4, metric: 'Meetings Scheduled' },
        { target: 20000, current: 18500, metric: 'Pipeline Added ($)' }
      ],
      strategic_recommendations: db.strategic_recommendations
    };

    res.json({ brief });
  });

  app.post('/api/ceo/trigger-ai-ceo', async (req, res) => {
    try {
      const recs = await VoxlineBrain.runAICEOEngine();
      res.json({ success: true, recommendations: recs });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'AI CEO analysis failed' });
    }
  });

  app.post('/api/ceo/recommendations/:id/action', (req, res) => {
    const { action } = req.body; // 'approve' | 'reject'
    const db = getDb();
    const rec = db.strategic_recommendations.find(r => r.id === req.params.id);
    if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

    rec.status = action === 'approve' ? 'approved' : 'rejected';
    rec.reviewed_by = 'Suren Hambardzumyan (CEO)';
    rec.reviewed_at = new Date().toISOString();

    saveDatabaseToDisk();
    res.json({ recommendation: rec });
  });

  // 8. AGENT MONITORING & JOBS
  app.get('/api/agents', (req, res) => {
    const db = getDb();
    res.json({ agents: db.agents, jobs: db.agent_jobs });
  });

  // 9. COMPETITORS, MARKET SIGNALS & PLUGINS
  app.get('/api/intelligence', (req, res) => {
    const db = getDb();
    res.json({
      competitors: db.competitors,
      competitor_events: db.competitor_events,
      market_signals: db.market_signals,
      revenue_forecasts: db.revenue_forecasts,
      plugins: db.plugins
    });
  });

  // 10. SUPABASE SQL EXPORT API
  app.get('/api/migrations/sql', (req, res) => {
    const sql = generateSupabaseSQLScript();
    res.setHeader('Content-Type', 'text/plain');
    res.send(sql);
  });

  // AUDIT LOGS
  app.get('/api/audit-logs', (req, res) => {
    const db = getDb();
    res.json({ audit_logs: db.audit_logs });
  });

  // NOTES API
  app.post('/api/companies/:id/notes', (req, res) => {
    const db = getDb();
    const note = {
      id: 'note-' + Date.now(),
      company_id: req.params.id,
      author_id: 'usr-ceo',
      author_name: 'Suren Hambardzumyan (CEO)',
      body: req.body.body || '',
      created_at: new Date().toISOString()
    };
    db.notes.unshift(note);
    saveDatabaseToDisk();
    res.json({ note });
  });

  // TEMP: diagnostic stats endpoint. Remove after use.
  app.get('/api/_temp_stats', (req, res) => {
    const db = getDb();
    const sentMessages = db.messages.filter((m) => m.status === 'sent');
    const failedMessages = db.messages.filter((m) => m.status === 'failed');
    const recentSent = sentMessages
      .slice()
      .sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''))
      .slice(0, 15)
      .map((m) => {
        const conv = db.conversations.find((c) => c.id === m.conversation_id);
        const comp = conv ? db.companies.find((c) => c.id === conv.company_id) : null;
        return { company: comp?.name || '?', email: comp?.email || '?', sent_at: m.sent_at };
      });
    const recentFailed = failedMessages
      .slice()
      .sort((a, b) => (b.sent_at || '').localeCompare(a.sent_at || ''))
      .slice(0, 5)
      .map((m) => {
        const conv = db.conversations.find((c) => c.id === m.conversation_id);
        const comp = conv ? db.companies.find((c) => c.id === conv.company_id) : null;
        return { company: comp?.name || '?', sent_at: m.sent_at };
      });
    res.json({
      total_sent: sentMessages.length,
      total_failed: failedMessages.length,
      recent_sent: recentSent,
      recent_failed: recentFailed,
      ai_call_budget: db.ai_call_budget,
      total_companies: db.companies.length,
      companies_discovery_stage_real_with_contact: db.companies.filter(
        (c) => !c.is_demo && !c.is_deleted && c.pipeline_stage === 'discovery' && (c.email || c.website)
      ).length
    });
  });

  // VITE MIDDLEWARE OR STATIC SERVING
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Voxline AI OS running on http://0.0.0.0:${PORT}`);
  });

  seedKnowledgeBaseIfEmpty();
  cleanupPlaceholderEmails();
  startAutonomousScheduler();
}

// One-time Knowledge Base seed with the company's real services/products,
// so AI-generated outreach is grounded in accurate facts instead of generic
// claims. Guarded by title so re-deploys never create duplicates.
// One-time (well, every-boot, but cheap and idempotent) cleanup: clears any
// company email that matches a known placeholder pattern (e.g.
// "you@company.com", "yourname@email.com") picked up by an earlier,
// looser version of the website email-enrichment step. Companies affected
// go back to having no email on file, making them eligible to be
// re-enriched (with the now-hardened filter) or simply left alone.
function cleanupPlaceholderEmails() {
  const db = getDb();
  let cleaned = 0;
  for (const c of db.companies) {
    if (c.email && isPlaceholderEmail(c.email)) {
      console.log(`[startup] Clearing placeholder email "${c.email}" from company "${c.name}"`);
      c.email = '';
      c.updated_at = new Date().toISOString();
      cleaned++;
    }
  }
  if (cleaned > 0) {
    saveDatabaseToDisk();
    console.log(`[startup] Cleared ${cleaned} placeholder email(s).`);
  }
}

function seedKnowledgeBaseIfEmpty() {
  const db = getDb();
  const seedArticles = [
    {
      category: 'Company',
      title: 'Ընկերության ընդհանուր տեղեկություն',
      content:
        'Voxline AI-ն արհեստական բանականության (ԱԲ) ծառայություններ մատուցող ընկերություն է։ ' +
        'Իրականացնում ենք ԱԲ-ի հետ կապված ցանկացած ծառայություն՝ ներառյալ չաթբոտերի, կայքերի և ' +
        'հավելվածների պատրաստում ամբողջական ցիկլով (նախագծում, մշակում, ինտեգրում, աջակցում)։'
    },
    {
      category: 'Services',
      title: 'Ծառայություններ',
      content:
        'Մեր հիմնական ծառայություններն են՝ Չաթբոտերի մշակում (հաճախորդների սպասարկում, վաճառքի ' +
        'ավտոմատացում), ԱԲ-ով ինտեգրված կայքերի պատրաստում, ԱԲ-ով ինտեգրված հավելվածների (mobile/web) ' +
        'մշակում, Բիզնես գործընթացների ավտոմատացում ԱԲ-ի միջոցով։'
    },
    {
      category: 'Product',
      title: 'Պրոդուկտ՝ Կրթլաբ',
      content:
        'Կրթլաբը ինքնակրթման հավելված է, որն աշխատում է արհեստական բանականության միջոցով։ ԱԲ-ն ' +
        'ինքնուրույն կազմում է անհատականացված դասընթացներ օգտատիրոջ համար և շարունակաբար հետևում է ' +
        'նրա առաջընթացին՝ դասընթացը հարմարեցնելով իրական արդյունքներին։'
    },
    {
      category: 'Product',
      title: 'Պրոդուկտ՝ Ատլաս',
      content:
        'Ատլասը հարթակ է, որտեղ ռոբոտները կարող են սովորել նոր հմտություններ։ Հարթակը ապահովում է ' +
        'ռոբոտների ուսուցման միջավայր, որը թույլ է տալիս ընդլայնել ու զարգացնել ռոբոտների ' +
        'հնարավորությունները նոր առաջադրանքների համար։'
    }
  ];

  const existingTitles = new Set((db.kb_articles || []).map((a: any) => a.title));
  let added = 0;
  for (const seed of seedArticles) {
    if (existingTitles.has(seed.title)) continue;
    db.kb_articles.unshift({
      id: 'kb-seed-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      ...seed,
      version: 1,
      is_published: true,
      updated_at: new Date().toISOString()
    } as any);
    added++;
  }
  if (added > 0) {
    saveDatabaseToDisk();
    console.log(`[startup] Seeded Knowledge Base with ${added} new article(s).`);
  }
}

startServer();
