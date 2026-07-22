import React, { useState } from 'react';
import {
  Building2, Globe, Phone, Mail, Sparkles,
  Bot, Send, CheckCircle2,
  FileText, Shield, ArrowRight
} from 'lucide-react';
import { Company, ResearchReport, Opportunity, LeadScore, Message, Proposal, Note } from '../types/index.js';

interface CompanyProfileModalProps {
  companyId: string;
  onClose: () => void;
  lang: 'am' | 'en';
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  companyId,
  onClose,
  lang
}) => {
  const [data, setData] = useState<{
    company?: Company;
    contacts?: any[];
    research?: ResearchReport;
    opportunities?: Opportunity[];
    lead_score?: LeadScore;
    messages?: Message[];
    proposals?: Proposal[];
    notes?: Note[];
    memories?: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'research' | 'conversation' | 'proposals' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);

  // Fetch company details
  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Fetch company details error:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDetails();
  }, [companyId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      await fetch(`/api/companies/${companyId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newNote })
      });
      setNewNote('');
      fetchDetails();
    } catch (err) {
      console.error('Add note error:', err);
    }
  };

  const handleRunDraftAI = async () => {
    setIsDrafting(true);
    try {
      await fetch('/api/messages/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, lang: 'am' })
      });
      fetchDetails();
      setActiveTab('conversation');
    } catch (err) {
      console.error('Draft error:', err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleApproveMsg = async (msgId: string) => {
    try {
      await fetch(`/api/messages/${msgId}/approve`, { method: 'POST' });
      fetchDetails();
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  const handleSendMsg = async (msgId: string) => {
    try {
      await fetch(`/api/messages/${msgId}/send`, { method: 'POST' });
      fetchDetails();
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  if (loading || !data?.company) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 animate-spin rounded-full mx-auto mb-4" />
          <p className="text-slate-300 text-sm">Loading Voxline 360° Company Profile...</p>
        </div>
      </div>
    );
  }

  const { company, research, opportunities, lead_score, messages, proposals, notes, memories } = data;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-6 flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
              {company.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-extrabold text-white">{company.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                  {company.industry}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-950 text-rose-400 border border-rose-800">
                  Score: {company.lead_score || 50} / 100
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-4">
                {company.website && <span className="flex items-center"><Globe className="w-3.5 h-3.5 mr-1" />{company.website}</span>}
                {company.phone && <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" />{company.phone}</span>}
                {company.email && <span className="flex items-center"><Mail className="w-3.5 h-3.5 mr-1" />{company.email}</span>}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 space-x-4 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition ${activeTab === 'overview' ? 'border-cyan-500 text-cyan-400 font-bold' : 'border-transparent hover:text-slate-200'}`}
          >
            360° Overview
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`py-3 border-b-2 transition ${activeTab === 'research' ? 'border-cyan-500 text-cyan-400 font-bold' : 'border-transparent hover:text-slate-200'}`}
          >
            AI Research & Opportunities ({opportunities?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('conversation')}
            className={`py-3 border-b-2 transition ${activeTab === 'conversation' ? 'border-cyan-500 text-cyan-400 font-bold' : 'border-transparent hover:text-slate-200'}`}
          >
            Sales Conversation ({messages?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`py-3 border-b-2 transition ${activeTab === 'proposals' ? 'border-cyan-500 text-cyan-400 font-bold' : 'border-transparent hover:text-slate-200'}`}
          >
            Proposals ({proposals?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition ${activeTab === 'notes' ? 'border-cyan-500 text-cyan-400 font-bold' : 'border-transparent hover:text-slate-200'}`}
          >
            Internal Notes ({notes?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols */}
              <div className="md:col-span-2 space-y-6">
                {/* Company Description */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Company Overview</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{company.description}</p>
                </div>

                {/* Lead Score Factors */}
                {lead_score && (
                  <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Voxline AI Score Factors ({lead_score.score} / 100)</span>
                    </h3>
                    <div className="space-y-2">
                      {lead_score.factors?.map((f, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 text-xs">
                          <div>
                            <div className="font-semibold text-slate-200">{f.name}</div>
                            <div className="text-[11px] text-slate-400">{f.reason}</div>
                          </div>
                          <span className="font-bold text-emerald-400">+{f.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Identified Opportunities */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Identified Voxline AI Opportunities</h3>
                  <div className="space-y-2.5">
                    {opportunities?.map((opp) => (
                      <div key={opp.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-700/60 flex items-start justify-between">
                        <div>
                          <div className="text-xs font-bold text-cyan-300">{opp.gap_type}</div>
                          <p className="text-xs text-slate-300 mt-0.5">{opp.description}</p>
                          <div className="mt-1.5 text-[11px] font-semibold text-emerald-400">
                            Recommended: {opp.recommended_service}
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          ${opp.estimated_monthly_value_usd}/mo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right 1 Col */}
              <div className="space-y-6">
                {/* Pipeline Status */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Pipeline Status</h3>
                  <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800 text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-4">
                    Stage: {company.pipeline_stage.replace('_', ' ')}
                  </div>

                  <button
                    onClick={handleRunDraftAI}
                    disabled={isDrafting}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2"
                  >
                    <Bot className="w-4 h-4" />
                    <span>{isDrafting ? 'Drafting...' : 'Draft Armenian Sales Message'}</span>
                  </button>
                </div>

                {/* AI Memory Entries */}
                <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span>Long-Term AI Memory</span>
                  </h3>
                  {memories && memories.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {memories.map((m, i) => (
                        <div key={i} className="p-2 rounded bg-slate-900/60 text-slate-300">
                          {m.content}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No prior objections or memory records logged.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'research' && research && (
            <div className="space-y-6">
              <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-6">
                <h3 className="text-base font-bold text-white mb-3">Research Agent Executive Summary</h3>
                <p className="text-xs text-slate-200 leading-relaxed">{research.summary}</p>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 uppercase">Website Quality</div>
                    <div className="font-bold text-sm text-cyan-400 capitalize mt-1">{research.website_quality}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 uppercase">Marketing Maturity</div>
                    <div className="font-bold text-sm text-blue-400 capitalize mt-1">{research.marketing_level}</div>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <div className="text-[11px] text-slate-400 uppercase">Support Quality</div>
                    <div className="font-bold text-sm text-amber-400 capitalize mt-1">{research.support_quality}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversation' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 min-h-[300px]">
                {messages && messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border max-w-2xl text-xs space-y-2 ${
                        msg.direction === 'outbound'
                          ? 'bg-blue-950/40 border-blue-800/60 ml-auto'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-cyan-400">{msg.sender}</span>
                        <span>{new Date(msg.sent_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{msg.body}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            msg.status === 'sent'
                              ? 'bg-emerald-950 text-emerald-400'
                              : msg.status === 'approved'
                              ? 'bg-blue-950 text-blue-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          Status: {msg.status.toUpperCase()}
                        </span>

                        {msg.status === 'pending_approval' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApproveMsg(msg.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-bold hover:bg-emerald-500"
                            >
                              Approve Draft
                            </button>
                          </div>
                        )}

                        {msg.status === 'approved' && (
                          <button
                            onClick={() => handleSendMsg(msg.id)}
                            className="px-3 py-1 rounded bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send Outreach</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No conversation messages generated yet. Click "Draft Armenian Sales Message" above.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'proposals' && (
            <div className="space-y-4">
              {proposals && proposals.length > 0 ? (
                proposals.map(p => (
                  <div key={p.id} className="p-5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-cyan-400">Voxline AI Proposal</span>
                      <span className="text-sm font-black text-white">${p.estimated_value.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-300">{p.roi_projection}</p>
                    <div className="text-xs text-slate-400">Timeline: {p.implementation_timeline}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">No proposals generated yet.</div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddSubmitNote => handleAddNote(handleAddSubmitNote)} className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add internal CEO / team note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                >
                  Post Note
                </button>
              </form>

              <div className="space-y-2">
                {notes?.map(n => (
                  <div key={n.id} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-cyan-400">{n.author_name}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200">{n.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
