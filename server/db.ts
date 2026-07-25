import {
  Company, CompanyContact, ResearchReport, Opportunity, LeadScore,
  Conversation, Message, Meeting, Proposal, PipelineEvent, Agent,
  AgentJob, KBArticle, Note, AuditLog, StrategicRecommendation,
  Competitor, CompetitorEvent, MarketSignal, RevenueForecast,
  AIMemoryEntry, LearningExperiment, PluginSystem, CEOBrief, User
} from '../src/types/index.js';
import fs from 'fs';
import path from 'path';

// Use the persistent volume mounted at /app/data in production (Railway),
// so data survives redeploys/restarts. Falls back to the working directory
// for local development where no volume is mounted.
const DATA_DIR = fs.existsSync('/app/data') ? '/app/data' : process.cwd();
const DATA_FILE = path.join(DATA_DIR, 'voxline_data.json');

// Memory state
export interface DatabaseState {
  users: User[];
  companies: Company[];
  contacts: CompanyContact[];
  research_reports: ResearchReport[];
  opportunities: Opportunity[];
  lead_scores: LeadScore[];
  conversations: Conversation[];
  messages: Message[];
  meetings: Meeting[];
  proposals: Proposal[];
  pipeline_events: PipelineEvent[];
  agents: Agent[];
  agent_jobs: AgentJob[];
  kb_articles: KBArticle[];
  notes: Note[];
  audit_logs: AuditLog[];
  strategic_recommendations: StrategicRecommendation[];
  competitors: Competitor[];
  competitor_events: CompetitorEvent[];
  market_signals: MarketSignal[];
  revenue_forecasts: RevenueForecast[];
  ai_memory_entries: AIMemoryEntry[];
  learning_experiments: LearningExperiment[];
  plugins: PluginSystem[];
  ai_call_budget: { date: string; count: number };
}

let db: DatabaseState = {
  users: [
    { id: 'usr-ceo', email: 'surenhambartsumyan7@gmail.com', full_name: 'Suren Hambardzumyan (CEO)', role: 'ceo', is_active: true },
    { id: 'usr-mgr', email: 'sales.manager@voxline.ai', full_name: 'Anahit Grigoryan (Sales Director)', role: 'sales_manager', is_active: true },
    { id: 'usr-emp', email: 'armen.petrosyan@voxline.ai', full_name: 'Armen Petrosyan (AE)', role: 'employee', is_active: true }
  ],
  companies: [],
  contacts: [],
  research_reports: [],
  opportunities: [],
  lead_scores: [],
  conversations: [],
  messages: [],
  meetings: [],
  proposals: [],
  pipeline_events: [],
  agents: [],
  agent_jobs: [],
  kb_articles: [],
  notes: [],
  audit_logs: [],
  strategic_recommendations: [],
  competitors: [],
  competitor_events: [],
  market_signals: [],
  revenue_forecasts: [],
  ai_memory_entries: [],
  learning_experiments: [],
  plugins: [],
  ai_call_budget: { date: '', count: 0 }
};

function seedDatabaseIfEmpty() {
  if (db.companies.length > 0) return;

  const now = new Date().toISOString();

  // Seed Knowledge Base
  db.kb_articles = [
    {
      id: 'kb-1',
      category: 'Services',
      title: 'Voxline AI Omni-channel Chatbots',
      content: '24/7 automated customer engagement for WhatsApp, Instagram, Telegram, and websites in Armenian, English, and Russian. Handles lead qualification, FAQ resolution, and appointment booking automatically.',
      version: 1,
      is_published: true,
      updated_at: now
    },
    {
      id: 'kb-2',
      category: 'Services',
      title: 'Voxline AI Voice Call Assistant',
      content: 'Natural sounding Armenian speech synthesis and voice recognition for call centers, appointment reminders, and automated inbound support. Compliant with telecom regulations.',
      version: 1,
      is_published: true,
      updated_at: now
    },
    {
      id: 'kb-3',
      category: 'Pricing',
      title: 'Standard Enterprise Tiering',
      content: 'Tier 1 (SMB): $300-$600/mo setup + $150/mo. Tier 2 (Mid-Market): $1,200-$2,500 setup + $450/mo. Tier 3 (Healthcare/Banking Enterprise): $5,000+ custom setup + $1,200/mo.',
      version: 1,
      is_published: true,
      updated_at: now
    },
    {
      id: 'kb-4',
      category: 'Sales Scripts',
      title: 'Armenian High-Value Outreach (B2B)',
      content: 'Բարև Ձեզ! [Company Name]-ի թիմի ուշադրությանն ենք ներկայացնում Voxline AI-ի ավտոմատացման համակարգը, որը թույլ է տալիս 3 անգամ արագացնել հաճախորդների սպասարկումը և բարձրացնել վաճառքները:',
      version: 1,
      is_published: true,
      updated_at: now
    },
    {
      id: 'kb-5',
      category: 'Objection Handling',
      title: 'Objection: "We already have a social media manager"',
      content: 'Voxline AI does not replace your manager—it equips them with instantaneous responses 24/7 so no inquiry after 8 PM is lost. Average response time drops from 45 minutes to 3 seconds.',
      version: 1,
      is_published: true,
      updated_at: now
    }
  ];

  // Seed Companies
  const sampleCompanies: Partial<Company>[] = [
    {
      id: 'comp-101',
      name: 'Nairi Medical Center',
      industry: 'Healthcare',
      address: 'Paronyan St 21, Yerevan, Armenia',
      website: 'https://nairimed.am',
      phone: '+374 10 537521',
      email: 'info@nairimed.am',
      instagram: '@nairi_medical_center',
      business_size: '51-200',
      description: 'Leading private multi-specialty medical clinic and diagnostic center in Yerevan.',
      status: 'qualified',
      pipeline_stage: 'outreach_drafted',
      source: 'Scout Agent — Healthcare Search',
      discovered_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: now,
      is_deleted: false,
      lead_score: 92,
      lead_score_tier: 'hot'
    },
    {
      id: 'comp-102',
      name: 'Ararat Hotel & Spa',
      industry: 'Hospitality',
      address: 'Grigor Lusavorich St 7, Yerevan',
      website: 'https://ararathotel.am',
      phone: '+374 10 590000',
      email: 'reservation@ararathotel.am',
      instagram: '@ararat_hotel_yerevan',
      business_size: '11-50',
      description: 'Boutique luxury hotel in central Yerevan with wellness spa and restaurant.',
      status: 'contacted',
      pipeline_stage: 'contacted',
      source: 'Scout Agent — Hotel Registry',
      discovered_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: now,
      is_deleted: false,
      lead_score: 84,
      lead_score_tier: 'hot'
    },
    {
      id: 'comp-103',
      name: 'Yeremyan Products / Seasons',
      industry: 'Food & Beverage',
      address: 'Teryan St 69, Yerevan',
      website: 'https://yeremyan.am',
      phone: '+374 11 500000',
      email: 'sales@yeremyan.am',
      instagram: '@seasons_yerevan',
      business_size: '200+',
      description: 'Major culinary, restaurant chain, and dairy production holding company in Armenia.',
      status: 'negotiating',
      pipeline_stage: 'proposal_sent',
      source: 'Manual Executive Prospecting',
      discovered_at: new Date(Date.now() - 86400000 * 12).toISOString(),
      updated_at: now,
      is_deleted: false,
      lead_score: 96,
      lead_score_tier: 'hot'
    },
    {
      id: 'comp-104',
      name: 'Evocabank CJSC',
      industry: 'Financial Services',
      address: 'Hanrapetutyan St 44, Yerevan',
      website: 'https://evoca.am',
      phone: '+374 10 270000',
      email: 'hello@evoca.am',
      instagram: '@evocabank',
      business_size: '200+',
      description: 'Innovative mobile-first commercial bank providing modern digital banking solutions.',
      status: 'discovered',
      pipeline_stage: 'research_completed',
      source: 'Scout Agent — Financial Registry',
      discovered_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: now,
      is_deleted: false,
      lead_score: 89,
      lead_score_tier: 'hot'
    },
    {
      id: 'comp-105',
      name: 'Tavern Yerevan / Burgery',
      industry: 'Restaurants',
      address: 'Amiryan St 5, Yerevan',
      website: 'https://tavernyerevan.am',
      phone: '+374 10 545545',
      email: 'contact@tavernyerevan.am',
      business_size: '51-200',
      description: 'Traditional Armenian restaurant chain with high daily table reservation traffic.',
      status: 'discovered',
      pipeline_stage: 'discovery',
      source: 'Scout Agent — Maps Search',
      discovered_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: now,
      is_deleted: false,
      lead_score: 65,
      lead_score_tier: 'warm'
    }
  ];

  db.companies = sampleCompanies as Company[];

  // Contacts
  db.contacts = [
    { id: 'cnt-1', company_id: 'comp-101', full_name: 'Dr. Armen Sargsyan', role: 'Head of Patient Experience', email: 'a.sargsyan@nairimed.am', phone: '+374 91 405060', is_primary: true },
    { id: 'cnt-2', company_id: 'comp-102', full_name: 'Lilit Hovhannisyan', role: 'General Manager', email: 'lilit@ararathotel.am', phone: '+374 93 112233', is_primary: true },
    { id: 'cnt-3', company_id: 'comp-103', full_name: 'David Yeremyan', role: 'Chief Commercial Officer', email: 'david.y@yeremyan.am', phone: '+374 99 887766', is_primary: true }
  ];

  // Research Reports
  db.research_reports = [
    {
      id: 'res-101',
      company_id: 'comp-101',
      summary: 'High volume of appointment requests on Instagram & website. Manual response delays average 35 minutes. Strong opportunity for appointment scheduling AI chatbot & WhatsApp integration.',
      website_quality: 'good',
      marketing_level: 'advanced',
      support_quality: 'manual',
      ai_opportunities: ['24/7 Medical Appointment Bot', 'WhatsApp Prescription Status AI', 'Automated Patient Feedback Survey'],
      automation_need_score: 95,
      version: 1,
      created_at: now
    },
    {
      id: 'res-102',
      company_id: 'comp-102',
      summary: 'High tourist inquiry rate in Russian & English after hours. No live chat widget on website.',
      website_quality: 'fair',
      marketing_level: 'moderate',
      support_quality: 'manual',
      ai_opportunities: ['Multilingual Concierge Bot', 'Automated Spa Reservation Voice Assistant'],
      automation_need_score: 82,
      version: 1,
      created_at: now
    }
  ];

  // Opportunities
  db.opportunities = [
    {
      id: 'opp-1',
      company_id: 'comp-101',
      gap_type: 'Manual Appointment Booking Delay',
      description: 'Patients wait up to 45 mins for Instagram DM confirmation.',
      recommended_service: 'Voxline AI Medical Concierge & WhatsApp Scheduler',
      priority: 'high',
      estimated_monthly_value_usd: 1500,
      created_at: now
    },
    {
      id: 'opp-2',
      company_id: 'comp-103',
      gap_type: 'High Call Volume After Hours',
      description: 'Centralized reservation desk receives 300+ missed calls per week during peak hours.',
      recommended_service: 'Voxline Voice Assistant for Table Reservations',
      priority: 'high',
      estimated_monthly_value_usd: 3500,
      created_at: now
    }
  ];

  // Lead Scores
  db.lead_scores = [
    {
      id: 'ls-101',
      company_id: 'comp-101',
      score: 92,
      factors: [
        { name: 'High Automation Need', points: 40, reason: 'Manual support response latency > 30 mins' },
        { name: 'Target Industry Fit', points: 30, reason: 'Healthcare conversion rate in Armenia is 32%' },
        { name: 'Digital Footprint Signal', points: 22, reason: 'Active Instagram ad campaigns with missing auto-responder' }
      ],
      tier: 'hot',
      scored_at: now
    }
  ];

  // Conversations & Messages
  const convId1 = 'conv-101';
  db.conversations = [
    {
      id: convId1,
      company_id: 'comp-101',
      channel: 'email',
      status: 'active',
      requires_human_approval: true,
      created_at: now,
      updated_at: now
    }
  ];

  db.messages = [
    {
      id: 'msg-1',
      conversation_id: convId1,
      direction: 'outbound',
      sender: 'Voxline Sales Agent (AI)',
      body: 'Բարև Ձեզ, Նաիրի Բժշկական Կենտրոնի թիմ! Նկատեցինք, որ Ձեր պացիենտները հաճախ գրանցման հարցումներ են ուղարկում սոցկայքերով։ Voxline AI-ի բժշկական ասիստենտը կարող է ավտոմատացնել հանդիպումների ամրագրումը 24/7:',
      status: 'pending_approval',
      ai_generated: true,
      sent_at: now,
      language: 'am'
    }
  ];

  // Proposals
  db.proposals = [
    {
      id: 'prop-103',
      company_id: 'comp-103',
      line_items: [
        { service_name: 'Voxline Voice Reservation Assistant', description: 'AI Voice bot handling up to 50 simultaneous inbound calls in Armenian.', setup_fee_usd: 2500, monthly_recurring_usd: 650 },
        { service_name: 'Custom CRM Integration (Yeremyan HQ)', description: 'Direct sync with restaurant POS and reservation software.', setup_fee_usd: 1500, monthly_recurring_usd: 200 }
      ],
      estimated_value: 4200,
      status: 'sent',
      roi_projection: 'Projected reduction in lost table reservations by 85%, generating ~$14,000/mo additional revenue.',
      implementation_timeline: '3 Weeks Deployment',
      is_ai_generated: true,
      created_at: now,
      updated_at: now
    }
  ];

  // Strategic Recommendations (AI CEO)
  db.strategic_recommendations = [
    {
      id: 'rec-1',
      category: 'outreach_focus',
      decision_text: 'Reallocate 40% of Scout & Sales Agent outreach capacity from Restaurants to Healthcare clinics.',
      data_source_ref: '30-day conversion logs (Healthcare 32% vs Restaurants 8%)',
      reasoning: 'Healthcare prospects show 4x higher meeting conversion rate due to urgent patient support bottlenecks.',
      expected_outcome: '+12 Qualified Meetings / month and +$18,000 pipeline additions.',
      confidence_score: 91,
      status: 'pending',
      created_by_agent: 'AI CEO (Voxline Brain)',
      created_at: now
    },
    {
      id: 'rec-2',
      category: 'pricing_strategy',
      decision_text: 'Introduce a specialized "Hotel Concierge AI" bundle priced at $490/mo.',
      data_source_ref: 'Hospitality opportunity gap analysis (n=18 hotel targets)',
      reasoning: 'Mid-sized Armenian boutique hotels consistently request combined Instagram DM + WhatsApp reservation automation.',
      expected_outcome: 'Shortens deal negotiation cycle from 18 days to 7 days.',
      confidence_score: 86,
      status: 'pending',
      created_by_agent: 'AI CEO (Voxline Brain)',
      created_at: now
    }
  ];

  // Competitors
  db.competitors = [
    { id: 'comp-1', name: 'SmartBot Armenia', website: 'https://smartbot.am', industry_focus: 'Rule-based Chatbots', market: 'Armenia', threat_level: 'medium', first_tracked_at: now },
    { id: 'comp-2', name: 'ArmAI Solutions', website: 'https://arm-ai.io', industry_focus: 'Custom AI Development', market: 'Armenia / CIS', threat_level: 'low', first_tracked_at: now }
  ];

  db.competitor_events = [
    { id: 'ce-1', competitor_id: 'comp-1', event_type: 'new_service', description: 'SmartBot announced basic Telegram bot template for restaurants.', source_url: 'https://smartbot.am/news', detected_at: now }
  ];

  // Market Signals
  db.market_signals = [
    { id: 'ms-1', signal_type: 'industry_growth', industry: 'Healthcare', region: 'Yerevan', value: 340, growth_rate_pct: 18.4, period_start: '2026-01-01', period_end: '2026-07-01', source: 'Armenia Business Register' },
    { id: 'ms-2', signal_type: 'tech_adoption', industry: 'Hospitality', region: 'Armenia', value: 120, growth_rate_pct: 24.2, period_start: '2026-01-01', period_end: '2026-07-01', source: 'Tourism Growth Index' }
  ];

  // Revenue Forecast
  db.revenue_forecasts = [
    {
      id: 'rf-2026-q3',
      period: '2026-Q3',
      point_estimate_usd: 28500,
      low_estimate_usd: 21000,
      high_estimate_usd: 36000,
      weighted_pipeline_usd: 27800,
      confidence_score: 88,
      model_id: 'mdl-v2-bayesian',
      generated_at: now
    }
  ];

  // Agents
  db.agents = [
    { id: 'ag-scout', name: 'Scout Agent', type: 'scout', status: 'idle', config: { auto_discover: true, search_regions: ['Yerevan', 'Gyumri'] } },
    { id: 'ag-research', name: 'Research Agent', type: 'research', status: 'idle', config: { deep_analysis: true } },
    { id: 'ag-opportunity', name: 'Opportunity Detector', type: 'opportunity', status: 'idle', config: { service_mapping: true } },
    { id: 'ag-qualification', name: 'Lead Qualification Agent', type: 'qualification', status: 'idle', config: { threshold_hot: 80 } },
    { id: 'ag-sales', name: 'Sales Agent (Armenian)', type: 'sales', status: 'idle', config: { default_lang: 'am', require_approval: true } },
    { id: 'ag-followup', name: 'Follow-up Cadence Agent', type: 'followup', status: 'idle', config: { cadence_days: [3, 7, 14] } },
    { id: 'ag-ceo', name: 'AI CEO (Strategic Advisor)', type: 'ai_ceo', status: 'idle', config: { analysis_frequency: 'daily' } }
  ];

  // Plugins
  db.plugins = [
    { id: 'plg-healthcare', name: 'Healthcare Intelligence Pack', vendor: 'Voxline Core', description: 'Specialized Armenian medical terminology and HIPAA/GDPR clinical workflow agents.', current_version: '1.2.0', status: 'active', permissions: ['read:medical_logs', 'write:proposals'], installed_at: now },
    { id: 'plg-voice', name: 'Voice Call Engine Foundation', vendor: 'Voxline Telecom', description: 'Telephony gateway API bridge for Armenian voice synthesis and PSTN call dispatching.', current_version: '2.0.1', status: 'active', permissions: ['manage:voice_channels'], installed_at: now }
  ];

  saveDatabaseToDisk();
}

export function loadDatabaseFromDisk(): DatabaseState {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded = JSON.parse(content);
      // Merge onto current in-memory defaults so any field added to the
      // schema after this data file was written doesn't come back
      // undefined (which would crash code that assumes it's an array).
      db = { ...db, ...loaded };
    } else {
      seedDatabaseIfEmpty();
    }
  } catch (err) {
    console.error('Error reading voxline_data.json:', err);
    seedDatabaseIfEmpty();
  }
  return db;
}

export function saveDatabaseToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving voxline_data.json:', err);
  }
}

// Getters & Mutators
export function getDb(): DatabaseState {
  return db;
}

export function addAuditLog(tableName: string, recordId: string, action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE', oldData?: any, newData?: any, actorEmail = 'surenhambartsumyan7@gmail.com') {
  const log: AuditLog = {
    id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    table_name: tableName,
    record_id: recordId,
    action: action,
    old_data: oldData,
    new_data: newData,
    actor_email: actorEmail,
    created_at: new Date().toISOString()
  };
  db.audit_logs.unshift(log);
  if (db.audit_logs.length > 200) db.audit_logs.pop();
  saveDatabaseToDisk();
}

// Generate complete Postgres/Supabase SQL Script for Exporting
export function generateSupabaseSQLScript(): string {
  return `-- ========================================================
-- VOXLINE AI SALES OPERATING SYSTEM — SUPABASE DDL & DML MIGRATION
-- Generated: ${new Date().toISOString()}
-- Target Database: PostgreSQL 15+ / Supabase
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('ceo', 'sales_manager', 'employee', 'admin', 'read_only')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  address TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  business_size TEXT DEFAULT '1-10',
  description TEXT,
  status TEXT CHECK (status IN ('discovered', 'qualified', 'contacted', 'negotiating', 'client', 'unqualified', 'archived')) DEFAULT 'discovered',
  pipeline_stage TEXT CHECK (pipeline_stage IN ('discovery', 'research_completed', 'qualified_lead', 'outreach_drafted', 'contacted', 'meeting_scheduled', 'proposal_sent', 'closed_won', 'closed_lost')) DEFAULT 'discovery',
  source TEXT,
  assigned_to_user_id UUID REFERENCES public.users(id),
  lead_score INT DEFAULT 0,
  lead_score_tier TEXT CHECK (lead_score_tier IN ('hot', 'warm', 'cold')),
  discovered_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);

-- Indexes for Companies
CREATE INDEX IF NOT EXISTS idx_companies_status_stage ON public.companies(status, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_lead_score ON public.companies(lead_score DESC);

-- 3. COMPANY CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false
);

-- 4. RESEARCH REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.research_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  website_quality TEXT CHECK (website_quality IN ('poor', 'fair', 'good', 'excellent')),
  marketing_level TEXT CHECK (marketing_level IN ('basic', 'moderate', 'advanced')),
  support_quality TEXT CHECK (support_quality IN ('manual', 'semi-automated', 'fully-automated')),
  ai_opportunities JSONB DEFAULT '[]'::jsonb,
  automation_need_score INT CHECK (automation_need_score BETWEEN 0 AND 100),
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  gap_type TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_service TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  estimated_monthly_value_usd NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. LEAD SCORES TABLE
CREATE TABLE IF NOT EXISTS public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 0 AND 100),
  factors JSONB DEFAULT '[]'::jsonb,
  tier TEXT CHECK (tier IN ('hot', 'warm', 'cold')),
  scored_at TIMESTAMPTZ DEFAULT now()
);

-- 7. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email', 'whatsapp', 'instagram', 'voice', 'linkedin')),
  status TEXT CHECK (status IN ('active', 'paused', 'closed', 'escalated')) DEFAULT 'active',
  assigned_agent_id TEXT,
  requires_human_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'delivered', 'failed', 'rejected')),
  ai_generated BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.users(id),
  sent_at TIMESTAMPTZ DEFAULT now(),
  language TEXT DEFAULT 'am'
);

-- 8. MEETINGS & PROPOSALS
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
  notes TEXT,
  meeting_link TEXT
);

CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_value NUMERIC(12,2) DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'pending_review', 'sent', 'accepted', 'declined')) DEFAULT 'draft',
  roi_projection TEXT,
  implementation_timeline TEXT,
  is_ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. KNOWLEDGE BASE & EMBEDDINGS
CREATE TABLE IF NOT EXISTS public.kb_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INT DEFAULT 1,
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kb_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.kb_articles(id) ON DELETE CASCADE,
  embedding vector(1536)
);

-- 10. SECTION 16 ADVANCED INTELLIGENCE TABLES
CREATE TABLE IF NOT EXISTS public.strategic_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  decision_text TEXT NOT NULL,
  data_source_ref TEXT,
  reasoning TEXT NOT NULL,
  expected_outcome TEXT,
  confidence_score INT CHECK (confidence_score BETWEEN 0 AND 100),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) DEFAULT 'pending',
  created_by_agent TEXT DEFAULT 'AI CEO',
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  industry_focus TEXT,
  market TEXT DEFAULT 'Armenia',
  threat_level TEXT CHECK (threat_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  first_tracked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.competitor_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  source_url TEXT,
  detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,
  industry TEXT NOT NULL,
  region TEXT DEFAULT 'Armenia',
  value NUMERIC(12,2),
  growth_rate_pct NUMERIC(5,2),
  period_start DATE,
  period_end DATE,
  source TEXT
);

CREATE TABLE IF NOT EXISTS public.revenue_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  point_estimate_usd NUMERIC(12,2) NOT NULL,
  low_estimate_usd NUMERIC(12,2) NOT NULL,
  high_estimate_usd NUMERIC(12,2) NOT NULL,
  weighted_pipeline_usd NUMERIC(12,2) NOT NULL,
  confidence_score INT DEFAULT 85,
  model_id TEXT,
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  actor_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Enable write access for authorized users" ON public.companies FOR ALL USING (true);

-- VOXLINE BRAIN INITIALIZED SUCCESSFULLY
`;
}

// Load initial database state
loadDatabaseFromDisk();
