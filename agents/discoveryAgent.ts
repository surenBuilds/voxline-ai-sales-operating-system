import { searchCompanies } from '../connectors/search/index.js';
import { getDb, saveDb } from '../api/_lib/dbAdapter.js';
import { computeIcpScore } from '../api/_lib/icpScorer.js';
import { Company } from '../src/types/index.js';

export async function runDiscoveryAgent(input) {
  // input: { industries, countries, companySizes, businessType, technologyUsage, growthSignals, targetProfile, maxResults, workspace_id, initiated_by }
  const db = getDb();
  const { industries = ['General'], countries = ['Armenia'], companySizes = [], maxResults = 10, workspace_id = null, initiated_by = 'system' } = input || {};

  const discovered: any[] = [];

  for (const industry of industries) {
    for (const country of countries) {
      const filters = { industry, country, companySizes, businessType: input.businessType, technologyUsage: input.technologyUsage, growthSignals: input.growthSignals, targetProfile: input.targetProfile };
      let candidates = [];
      try {
        candidates = await searchCompanies(filters);
      } catch (err) {
        console.error('searchCompanies error', err);
        candidates = [];
      }

      for (const c of candidates.slice(0, maxResults)) {
        // dedupe by website or name
        const exists = db.companies.find((x) => (x.website && c.website && x.website.toLowerCase() === c.website.toLowerCase()) || (x.name && c.name && x.name.toLowerCase() === c.name.toLowerCase()));
        if (exists) continue;

        // Only create verified leads when source_url exists
        const isVerified = Boolean(c.source_url);
        const sourceType = isVerified ? 'real_web' : 'ai_demo';

        const id = 'comp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        const company: Company = {
          id,
          name: c.name || `Unknown ${industry}`,
          industry: c.industry || industry,
          address: c.location || country,
          website: c.website || (c.source_url || ''),
          phone: c.phone || '',
          email: c.contact_info && c.contact_info.length ? (c.contact_info[0].email || '') : '',
          instagram: '',
          facebook: '',
          linkedin: c.linkedin || '',
          business_size: c.company_size || (companySizes[0] || '11-50'),
          description: c.description || '',
          status: 'discovered',
          pipeline_stage: 'discovery',
          source: isVerified ? (c.source_type || 'search_connector') : 'ai_demo',
          source_type: sourceType,
          is_verified: isVerified,
          verification_source: isVerified ? c.source_url : null,
          is_demo: !isVerified,
          assigned_to_user_id: null,
          discovered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false,
          lead_score: 0,
          lead_score_tier: 'cold',
          discovery_confidence: Math.round((c.confidence || 0.5) * 100),
          workspace_id
        };

        // ICP scoring
        const icp = computeIcpScore({ company, targetProfile: input.targetProfile });
        company.icp_score = icp.score;
        company.fit_reasons = icp.reasons;
        company.sales_priority = icp.priority;

        db.companies.unshift(company);

        // contact discovery (simple: use c.contact_info if available)
        if (Array.isArray(c.contact_info)) {
          for (const ci of c.contact_info) {
            const contactId = 'cnt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
            const contact = {
              id: contactId,
              company_id: id,
              full_name: ci.name || '',
              role: ci.role || ci.title || '',
              title: ci.title || ci.role || '',
              email: ci.email || '',
              phone: ci.phone || '',
              linkedin: ci.linkedin || '',
              is_primary: false,
              confidence: Math.round((ci.confidence || 0.6) * 100),
              contact_source: ci.source || (c.source_url || 'unknown'),
              is_verified: isVerified && Boolean(ci.email || ci.linkedin),
              is_demo: !isVerified,
              created_at: new Date().toISOString(),
              workspace_id
            };
            db.contacts.unshift(contact);
          }
        }

        discovered.push({ id: company.id, name: company.name, website: company.website, is_verified: company.is_verified, icp_score: company.icp_score });
        // audit log
        db.audit_logs.unshift({ id: 'alog-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), table_name: 'companies', record_id: company.id, action: 'INSERT', old_data: null, new_data: company, actor_id: initiated_by, actor_email: initiated_by, created_at: new Date().toISOString(), workspace_id });

        // limit overall if needed
        saveDb(db);
      }
    }
  }

  return { discovered_count: discovered.length, companies: discovered };
}
