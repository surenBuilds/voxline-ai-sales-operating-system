import { getDb, addAuditLog, saveDatabaseToDisk } from './db.js';
import { runScoutAISearch, runResearchAI, runSalesAgentDraft, runAICEOAnalysis } from './ai.js';
import { buildMemoryContext } from './salesMemory.js';
import { findContactEmail } from './emailEnrichment.js';
import { searchCompanies } from '../connectors/search/index.js';
import { Company, AgentJob } from '../src/types/index.js';

// --- Free-tier Gemini quota guard ---
// Gemini's free tier has TWO limits that both matter here (seen in logs):
//   - ~20 requests/day (RPD)
//   - 5 requests/minute (RPM)
// Discovery can trigger many companies' worth of AI calls in a tight burst
// (research + draft, fired without waiting for each other), which blows
// through the per-minute limit even while under the daily cap. reserveAISlot()
// enforces both: a daily budget (persisted to disk via the db, so it
// survives restarts/redeploys — not just an in-memory counter) AND a
// minimum spacing between calls, via a promise chain so concurrent callers
// still get serialized automatically.
// Override with GEMINI_DAILY_AI_CALL_CAP / GEMINI_MIN_CALL_INTERVAL_MS.
let aiQueueTail: Promise<void> = Promise.resolve();

export async function reserveAISlot(): Promise<boolean> {
  const cap = Math.max(1, Number(process.env.GEMINI_DAILY_AI_CALL_CAP) || 16);
  const minIntervalMs = Math.max(1000, Number(process.env.GEMINI_MIN_CALL_INTERVAL_MS) || 13000); // ~5/min = 12s apart, +buffer

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  if (!db.ai_call_budget || db.ai_call_budget.date !== today) {
    db.ai_call_budget = { date: today, count: 0 };
  }
  if (db.ai_call_budget.count >= cap) return false;
  db.ai_call_budget.count++;
  saveDatabaseToDisk();

  // Chain onto the shared queue so calls started around the same time still
  // end up spaced out, regardless of which code path triggered them.
  const previous = aiQueueTail;
  let release: () => void = () => {};
  aiQueueTail = new Promise((resolve) => { release = resolve; });
  await previous;
  await new Promise((r) => setTimeout(r, minIntervalMs));
  release();
  return true;
}

export class VoxlineBrain {
  // 1. Trigger Scout Agent
  static async runScoutAgent(industry: string, region = 'Yerevan'): Promise<{ new_companies: Company[]; job: AgentJob }> {
    const db = getDb();
    const jobId = 'job-' + Date.now();
    const job: AgentJob = {
      id: jobId,
      agent_id: 'ag-scout',
      job_type: 'discover_companies',
      status: 'running',
      input: { industry, region },
      retry_count: 0,
      created_at: new Date().toISOString()
    };
    db.agent_jobs.unshift(job);

    try {
      // Prefer real, verifiable business data (Google Places etc.) when a connector is configured.
      const realCandidates = await searchCompanies({ industry, country: region, maxResults: 10 });
      const usingRealData = realCandidates.length > 0;

      // Only fall back to AI-generated demo leads when no real connector produced results,
      // and mark them unmistakably as demo/unverified so they're never confused with real prospects.
      // This fallback itself is a Gemini call, so it goes through the same
      // budget/spacing gate as research and draft calls.
      let results: any[] = [];
      if (usingRealData) {
        results = realCandidates.map(c => ({
          name: c.name || `Unknown ${industry}`,
          industry: c.industry || industry,
          website: c.website || '',
          phone: c.contact_info?.[0]?.phone || '',
          email: c.contact_info?.[0]?.email || '',
          instagram: '',
          business_size: c.company_size || '11-50',
          description: c.description || '',
          source_url: c.source_url
        }));
      } else if (await reserveAISlot()) {
        results = await runScoutAISearch(industry, region);
      } else {
        console.log(`[ScoutAgent] Daily AI call cap reached — skipping AI-demo fallback search for ${industry}/${region}.`);
      }

      const newCompanies: Company[] = [];

      for (const item of results as any[]) {
        // Check for duplicates by domain or name
        const exists = db.companies.find(c => c.name.toLowerCase() === item.name.toLowerCase() || (c.website && item.website && c.website.toLowerCase() === item.website.toLowerCase()));
        if (!exists) {
          const compId = 'comp-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
          const comp: Company = {
            id: compId,
            name: item.name,
            industry: item.industry || industry,
            address: `${region}, Armenia`,
            website: item.website || (usingRealData ? '' : `https://${item.name.toLowerCase().replace(/[^a-z]/g, '')}.am`),
            phone: item.phone || (usingRealData ? '' : '+374 10 000000'),
            email: item.email || (usingRealData ? '' : `contact@${item.name.toLowerCase().replace(/[^a-z]/g, '')}.am`),
            instagram: item.instagram || (usingRealData ? '' : `@${item.name.toLowerCase().replace(/[^a-z]/g, '')}`),
            business_size: item.business_size || '11-50',
            description: item.description || `Discovered company in ${industry}`,
            status: 'discovered',
            pipeline_stage: 'discovery',
            source: usingRealData ? 'Scout Agent — Google Places' : 'Scout Agent — AI Demo (unverified, no search connector configured)',
            source_type: usingRealData ? 'real_web' : 'ai_demo',
            is_verified: usingRealData,
            verification_source: usingRealData ? item.source_url : null,
            is_demo: !usingRealData,
            discovered_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: false,
            lead_score: 50,
            lead_score_tier: 'warm'
          };
          db.companies.unshift(comp);
          newCompanies.push(comp);
          addAuditLog('companies', compId, 'INSERT', null, comp);

          // Automatically trigger Research Agent — but only while we're
          // still within today's free-tier AI budget, and spaced out to
          // respect the per-minute rate limit too. Fire-and-forget so
          // discovery itself doesn't stall waiting for AI processing.
          (async () => {
            if (await reserveAISlot()) {
              this.runResearchAgent(compId).catch(err => console.error('Auto research error:', err));
            } else {
              console.log(`[ScoutAgent] Daily AI call cap reached — leaving "${comp.name}" in discovery stage for now.`);
            }
          })();
        }
      }

      job.status = 'success';
      job.output = { discovered_count: newCompanies.length, companies: newCompanies.map(c => ({ id: c.id, name: c.name })) };
      job.completed_at = new Date().toISOString();
      saveDatabaseToDisk();

      return { new_companies: newCompanies, job };
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Scout Agent failed';
      job.completed_at = new Date().toISOString();
      saveDatabaseToDisk();
      throw err;
    }
  }

  // 2. Trigger Research & Opportunity & Qualification Agent
  static async runResearchAgent(companyId: string): Promise<any> {
    const db = getDb();
    const company = db.companies.find(c => c.id === companyId);
    if (!company) throw new Error('Company not found');

    // Best-effort: if we discovered this company without an email (e.g. via Google Places),
    // try to find one from their website before we score/draft outreach for them.
    if (!company.email && company.website) {
      try {
        const found = await findContactEmail(company.website);
        if (found) {
          company.email = found;
          company.updated_at = new Date().toISOString();
        }
      } catch (err) {
        console.error('Email enrichment error:', err);
      }
    }

    const jobId = 'job-res-' + Date.now();
    const job: AgentJob = {
      id: jobId,
      agent_id: 'ag-research',
      company_id: companyId,
      job_type: 'deep_research_and_scoring',
      status: 'running',
      input: { company_id: companyId, company_name: company.name },
      retry_count: 0,
      created_at: new Date().toISOString()
    };
    db.agent_jobs.unshift(job);

    try {
      const research = await runResearchAI(company.name, company.industry, company.website, company.description);

      // Save Research Report
      const resId = 'res-' + Date.now();
      const report = {
        id: resId,
        company_id: companyId,
        summary: research.summary,
        website_quality: research.website_quality || 'fair',
        marketing_level: research.marketing_level || 'moderate',
        support_quality: research.support_quality || 'manual',
        ai_opportunities: research.ai_opportunities || [],
        automation_need_score: research.automation_need_score || 80,
        version: 1,
        created_at: new Date().toISOString()
      };
      db.research_reports.unshift(report);

      // Save Opportunities
      const opps = research.opportunities || [];
      for (const o of opps) {
        db.opportunities.unshift({
          id: 'opp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          company_id: companyId,
          gap_type: o.gap_type || 'Automation Gap',
          description: o.description || 'Manual process latency',
          recommended_service: o.recommended_service || 'Voxline AI Assistant',
          priority: o.priority || 'high',
          estimated_monthly_value_usd: o.estimated_monthly_value_usd || 1000,
          created_at: new Date().toISOString()
        });
      }

      // Calculate Lead Score & Factors
      const score = Math.min(100, Math.max(0, research.automation_need_score || 75));
      const tier = score >= 80 ? 'hot' : score >= 50 ? 'warm' : 'cold';

      company.lead_score = score;
      company.lead_score_tier = tier;
      company.status = 'qualified';
      company.pipeline_stage = 'research_completed';
      company.updated_at = new Date().toISOString();

      db.lead_scores.unshift({
        id: 'ls-' + Date.now(),
        company_id: companyId,
        score: score,
        factors: [
          { name: 'Automation Gap Score', points: Math.round(score * 0.5), reason: `${research.ai_opportunities.length || 2} AI gaps detected` },
          { name: 'Industry Alignment', points: 30, reason: `Target match for ${company.industry}` },
          { name: 'Digital Presence Signal', points: 20, reason: `Website quality: ${research.website_quality}` }
        ],
        tier: tier,
        scored_at: new Date().toISOString()
      });

      addAuditLog('companies', companyId, 'UPDATE', null, { pipeline_stage: company.pipeline_stage, lead_score: score });

      // Automatically trigger Sales Agent Draft if score >= 60 and we're
      // still within today's free-tier AI budget (spaced to respect the
      // per-minute limit too).
      if (score >= 60) {
        (async () => {
          if (await reserveAISlot()) {
            this.runSalesAgentDraftJob(companyId).catch(e => console.error('Sales draft error:', e));
          } else {
            console.log(`[ResearchAgent] Daily AI call cap reached — leaving company ${companyId} qualified but undrafted for now.`);
          }
        })();
      }

      job.status = 'success';
      job.output = { research_report_id: resId, score, tier, opportunities_found: opps.length };
      job.completed_at = new Date().toISOString();
      saveDatabaseToDisk();

      return { report, score, tier };
    } catch (err: any) {
      job.status = 'failed';
      job.error = err.message || 'Research agent error';
      job.completed_at = new Date().toISOString();
      saveDatabaseToDisk();
      throw err;
    }
  }

  // 3. Trigger Sales Agent Draft Job
  static async runSalesAgentDraftJob(companyId: string, lang = 'am'): Promise<any> {
    const db = getDb();
    const company = db.companies.find(c => c.id === companyId);
    if (!company) throw new Error('Company not found');

    const report = db.research_reports.find(r => r.company_id === companyId);
    const opps = db.opportunities.filter(o => o.company_id === companyId);
    const kbContext = db.kb_articles.map(k => `[${k.title}]: ${k.content}`).join('\n');
    // Closed-loop learning: fold in what we remember about this company (and
    // general lessons from other replies) so drafts reflect past outcomes
    // instead of starting from zero every time.
    const memoryContext = buildMemoryContext(companyId);
    const fullContext = memoryContext ? `${kbContext}\n\n${memoryContext}` : kbContext;

    const oppGaps = opps.map(o => o.recommended_service);
    const draftText = await runSalesAgentDraft(
      company.name,
      company.industry,
      report?.summary || company.description,
      oppGaps.length ? oppGaps : ['Voxline AI 24/7 Chatbot'],
      fullContext,
      lang
    );

    // Create or find Conversation
    let conv = db.conversations.find(c => c.company_id === companyId);
    if (!conv) {
      conv = {
        id: 'conv-' + Date.now(),
        company_id: companyId,
        channel: 'email',
        status: 'active',
        requires_human_approval: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.conversations.unshift(conv);
    }

    // Add Draft Message pending approval
    const msg = {
      id: 'msg-' + Date.now(),
      conversation_id: conv.id,
      direction: 'outbound' as const,
      sender: 'Voxline Sales Agent (AI)',
      body: draftText,
      status: 'pending_approval' as const,
      ai_generated: true,
      sent_at: new Date().toISOString(),
      language: lang as any
    };
    db.messages.unshift(msg);

    company.pipeline_stage = 'outreach_drafted';
    company.updated_at = new Date().toISOString();

    saveDatabaseToDisk();
    return { conversation: conv, message: msg };
  }

  // 4. Trigger AI CEO Analysis
  static async runAICEOEngine(): Promise<any> {
    const db = getDb();
    const metricsStr = `
Total Companies Discovered: ${db.companies.length}
Pipeline Stages Breakdown:
- Discovery: ${db.companies.filter(c => c.pipeline_stage === 'discovery').length}
- Research Completed: ${db.companies.filter(c => c.pipeline_stage === 'research_completed').length}
- Qualified Leads: ${db.companies.filter(c => c.pipeline_stage === 'qualified_lead').length}
- Outreach Drafted / Contacted: ${db.companies.filter(c => ['outreach_drafted', 'contacted'].includes(c.pipeline_stage)).length}
- Proposals Sent: ${db.companies.filter(c => c.pipeline_stage === 'proposal_sent').length}
- Closed Won: ${db.companies.filter(c => c.pipeline_stage === 'closed_won').length}

Top Industries in Database:
${Array.from(new Set(db.companies.map(c => c.industry))).map(ind => `- ${ind}: ${db.companies.filter(c => c.industry === ind).length} companies`).join('\n')}

Pending Proposals Value: $${db.proposals.filter(p => p.status === 'sent').reduce((acc, p) => acc + p.estimated_value, 0)}
`;

    const recommendations = await runAICEOAnalysis(metricsStr);

    for (const r of recommendations) {
      db.strategic_recommendations.unshift({
        id: 'rec-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        category: r.category || 'outreach_focus',
        decision_text: r.decision_text,
        data_source_ref: r.data_source_ref,
        reasoning: r.reasoning,
        expected_outcome: r.expected_outcome,
        confidence_score: r.confidence_score || 85,
        status: 'pending',
        created_by_agent: 'AI CEO (Voxline Brain)',
        created_at: new Date().toISOString()
      });
    }

    saveDatabaseToDisk();
    return db.strategic_recommendations;
  }
}
