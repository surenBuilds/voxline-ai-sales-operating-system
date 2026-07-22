/**
 * Voxline AI — AI Business Operating System Types
 */

export type UserRole = 'ceo' | 'sales_manager' | 'employee' | 'admin' | 'read_only';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  avatar_url?: string;
}

export type CompanyStatus = 'discovered' | 'qualified' | 'contacted' | 'negotiating' | 'client' | 'unqualified' | 'archived';

export type PipelineStage = 'discovery' | 'research_completed' | 'qualified_lead' | 'outreach_drafted' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'closed_won' | 'closed_lost';

export interface CompanyContact {
  id: string;
  company_id: string;
  full_name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  address: string;
  website: string;
  phone: string;
  email: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  business_size: string; // e.g. '1-10', '11-50', '51-200', '200+'
  description: string;
  status: CompanyStatus;
  pipeline_stage: PipelineStage;
  source: string;
  assigned_to_user_id?: string;
  discovered_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  contacts?: CompanyContact[];
  lead_score?: number;
  lead_score_tier?: 'hot' | 'warm' | 'cold';
}

export interface ResearchReport {
  id: string;
  company_id: string;
  summary: string;
  website_quality: 'poor' | 'fair' | 'good' | 'excellent';
  marketing_level: 'basic' | 'moderate' | 'advanced';
  support_quality: 'manual' | 'semi-automated' | 'fully-automated';
  ai_opportunities: string[];
  automation_need_score: number; // 0-100
  version: number;
  created_at: string;
}

export interface Opportunity {
  id: string;
  company_id: string;
  gap_type: string; // e.g. 'Customer Support Delays', 'Manual Booking System', 'No AI Chatbot', 'Lead Leakage'
  description: string;
  recommended_service: string; // e.g. 'Voxline AI Chatbot', 'Voxline Voice Assistant', 'CRM Workflow Automation'
  priority: 'high' | 'medium' | 'low';
  estimated_monthly_value_usd: number;
  created_at: string;
}

export interface LeadScoreFactor {
  name: string;
  points: number;
  reason: string;
}

export interface LeadScore {
  id: string;
  company_id: string;
  score: number; // 0 - 100
  factors: LeadScoreFactor[];
  tier: 'hot' | 'warm' | 'cold';
  scored_at: string;
}

export type ChannelType = 'email' | 'whatsapp' | 'instagram' | 'voice' | 'linkedin';

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender: string;
  body: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'delivered' | 'failed' | 'rejected';
  ai_generated: boolean;
  approved_by?: string;
  sent_at: string;
  language?: 'am' | 'en' | 'ru';
}

export interface Conversation {
  id: string;
  company_id: string;
  channel: ChannelType;
  status: 'active' | 'paused' | 'closed' | 'escalated';
  assigned_agent_id?: string;
  requires_human_approval: boolean;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface Meeting {
  id: string;
  company_id: string;
  title: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  meeting_link?: string;
  attendees?: string[];
}

export interface ProposalLineItem {
  service_name: string;
  description: string;
  setup_fee_usd: number;
  monthly_recurring_usd: number;
}

export interface Proposal {
  id: string;
  company_id: string;
  line_items: ProposalLineItem[];
  estimated_value: number;
  status: 'draft' | 'pending_review' | 'sent' | 'accepted' | 'declined';
  pdf_url?: string;
  roi_projection?: string;
  implementation_timeline?: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface PipelineEvent {
  id: string;
  company_id: string;
  from_stage: PipelineStage;
  to_stage: PipelineStage;
  changed_by?: string;
  reason?: string;
  created_at: string;
}

export type AgentType = 'scout' | 'research' | 'opportunity' | 'qualification' | 'sales' | 'followup' | 'ceo_assistant' | 'ai_ceo' | 'competitor' | 'market';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: 'idle' | 'running' | 'paused' | 'error';
  config: Record<string, any>;
  last_run_at?: string;
}

export interface AgentJob {
  id: string;
  agent_id: string;
  company_id?: string;
  job_type: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'escalated';
  input: Record<string, any>;
  output?: Record<string, any>;
  retry_count: number;
  error?: string;
  created_at: string;
  completed_at?: string;
}

export interface KBArticle {
  id: string;
  category: 'Company' | 'Services' | 'Products' | 'Pricing' | 'FAQ' | 'Sales Scripts' | 'Case Studies' | 'Objection Handling' | 'Policies';
  title: string;
  content: string;
  version: number;
  is_published: boolean;
  updated_at: string;
}

export interface Note {
  id: string;
  company_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE';
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  actor_id?: string;
  actor_email?: string;
  created_at: string;
}

// Section 16 Advanced Intelligence Types
export interface StrategicRecommendation {
  id: string;
  category: 'outreach_focus' | 'pricing_strategy' | 'resource_allocation' | 'market_expansion';
  decision_text: string;
  data_source_ref: string;
  reasoning: string;
  expected_outcome: string;
  confidence_score: number; // 0 - 100
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_by_agent: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface Competitor {
  id: string;
  name: string;
  website: string;
  industry_focus: string;
  market: string;
  threat_level: 'low' | 'medium' | 'high';
  first_tracked_at: string;
}

export interface CompetitorEvent {
  id: string;
  competitor_id: string;
  event_type: 'new_service' | 'pricing_change' | 'hiring_surge' | 'marketing_campaign';
  description: string;
  source_url: string;
  detected_at: string;
}

export interface MarketSignal {
  id: string;
  signal_type: 'new_company_registration' | 'digital_ad_spend' | 'industry_growth' | 'tech_adoption';
  industry: string;
  region: string;
  value: number;
  growth_rate_pct: number;
  period_start: string;
  period_end: string;
  source: string;
}

export interface RevenueForecast {
  id: string;
  period: string; // e.g. '2026-Q3' or '2026-08'
  point_estimate_usd: number;
  low_estimate_usd: number;
  high_estimate_usd: number;
  weighted_pipeline_usd: number;
  confidence_score: number;
  model_id: string;
  generated_at: string;
}

export interface AIMemoryEntry {
  id: string;
  company_id: string;
  memory_type: 'rejection' | 'preference' | 'change_detected' | 'past_proposal' | 'key_decision';
  content: string;
  confidence: number;
  created_at: string;
}

export interface LearningExperiment {
  id: string;
  experiment_type: string;
  variant_a: string;
  variant_b: string;
  metric: string;
  sample_size_a: number;
  sample_size_b: number;
  result_a_pct: number;
  result_b_pct: number;
  significance_pct: number;
  status: 'running' | 'completed' | 'applied' | 'rejected';
  recommendation: string;
  created_at: string;
}

export interface PluginSystem {
  id: string;
  name: string;
  vendor: string;
  description: string;
  current_version: string;
  status: 'active' | 'disabled' | 'revoked';
  permissions: string[];
  installed_at: string;
}

export interface CEOBrief {
  generated_at: string;
  top_20_leads: Company[];
  expected_revenue_usd: number;
  pipeline_health_score: number;
  highest_priority_opportunities: { type: string; count: number; avg_deal_usd: number }[];
  recommended_actions: string[];
  potential_risks: string[];
  weekly_goals: { target: number; current: number; metric: string }[];
  strategic_recommendations: StrategicRecommendation[];
}
