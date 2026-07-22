import React, { useState } from 'react';
import {
  Building2, Plus, Filter, LayoutGrid, List,
  Trash2, RotateCcw, ArrowRight,
  Globe, Phone, Mail
} from 'lucide-react';
import { Company, PipelineStage } from '../types/index.js';

interface CRMViewProps {
  companies: Company[];
  onSelectCompany: (company: Company) => void;
  onCreateCompany: (companyData: Partial<Company>) => void;
  onSoftDeleteCompany: (id: string) => void;
  onRestoreCompany: (id: string) => void;
  lang: 'am' | 'en';
}

const PIPELINE_STAGES: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'discovery', label: 'Discovered', color: 'border-slate-700 bg-slate-900/60' },
  { id: 'research_completed', label: 'Research Done', color: 'border-blue-800 bg-blue-950/20' },
  { id: 'qualified_lead', label: 'Qualified Lead', color: 'border-cyan-800 bg-cyan-950/20' },
  { id: 'outreach_drafted', label: 'Drafted AI Message', color: 'border-indigo-800 bg-indigo-950/20' },
  { id: 'contacted', label: 'Outreach Sent', color: 'border-purple-800 bg-purple-950/20' },
  { id: 'proposal_sent', label: 'Proposal Sent', color: 'border-amber-800 bg-amber-950/20' },
  { id: 'closed_won', label: 'Closed Won', color: 'border-emerald-800 bg-emerald-950/30' },
];

export const CRMView: React.FC<CRMViewProps> = ({
  companies,
  onSelectCompany,
  onCreateCompany,
  onSoftDeleteCompany,
  onRestoreCompany,
  lang
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New Prospect Form State
  const [newComp, setNewComp] = useState({
    name: '',
    industry: 'Healthcare',
    website: '',
    phone: '',
    email: '',
    description: '',
    address: 'Yerevan, Armenia',
    business_size: '11-50'
  });

  const industries = Array.from(new Set(companies.map(c => c.industry))).filter(Boolean);

  const filteredCompanies = companies.filter(c => {
    if (!includeDeleted && c.is_deleted) return false;
    if (selectedIndustry !== 'all' && c.industry.toLowerCase() !== selectedIndustry.toLowerCase()) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q));
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCompany(newComp);
    setShowAddModal(false);
    setNewComp({
      name: '',
      industry: 'Healthcare',
      website: '',
      phone: '',
      email: '',
      description: '',
      address: 'Yerevan, Armenia',
      business_size: '11-50'
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder={lang === 'am' ? 'Փնտրել ընկերություն...' : 'Search company, industry, or email...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Industry Filter */}
          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none"
            >
              <option value="all">All Industries</option>
              {industries.map(ind => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          {/* Soft Delete Toggle */}
          <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
            />
            <span>Include Deleted Prospects</span>
          </label>
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Kanban Board View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'am' ? 'Ավելացնել Լիդ' : 'Add Prospect'}</span>
          </button>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4 scrollbar-none">
          {PIPELINE_STAGES.map(stage => {
            const stageCompanies = filteredCompanies.filter(c => c.pipeline_stage === stage.id);
            return (
              <div key={stage.id} className="min-w-[240px] flex flex-col space-y-3">
                {/* Column Header */}
                <div className={`p-3 rounded-xl border ${stage.color} flex items-center justify-between`}>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">{stage.label}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {stageCompanies.length}
                  </span>
                </div>

                {/* Company Cards Column */}
                <div className="space-y-3 flex-1">
                  {stageCompanies.map(comp => (
                    <div
                      key={comp.id}
                      onClick={() => onSelectCompany(comp)}
                      className={`p-4 rounded-xl border bg-slate-900/90 hover:bg-slate-800/80 cursor-pointer transition-all shadow-md group relative ${
                        comp.is_deleted ? 'border-rose-900/40 opacity-50' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-bold text-white text-sm group-hover:text-cyan-400 transition">{comp.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            (comp.lead_score || 0) >= 80 ? 'bg-rose-950 text-rose-400' : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {comp.lead_score || 50}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{comp.description}</p>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {comp.industry}
                        </span>

                        <div className="flex items-center space-x-1">
                          {comp.is_deleted ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestoreCompany(comp.id);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 p-1"
                              title="Restore Prospect"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSoftDeleteCompany(comp.id);
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                              title="Soft Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {stageCompanies.length === 0 && (
                    <div className="p-4 rounded-xl border border-dashed border-slate-800/60 text-center text-xs text-slate-600 py-8">
                      No prospects
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/40 text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Lead Score</th>
                <th className="py-3 px-4">Pipeline Stage</th>
                <th className="py-3 px-4">Contact Channels</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredCompanies.map(comp => (
                <tr
                  key={comp.id}
                  onClick={() => onSelectCompany(comp)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition ${comp.is_deleted ? 'opacity-50 bg-rose-950/10' : ''}`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{comp.name}</div>
                    <div className="text-xs text-slate-400">{comp.address}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {comp.industry}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-xs text-rose-400 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800">
                      {comp.lead_score || 50} / 100
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-semibold uppercase text-cyan-400">
                      {comp.pipeline_stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2 text-slate-400 text-xs">
                      {comp.website && <Globe className="w-3.5 h-3.5 text-blue-400" />}
                      {comp.phone && <Phone className="w-3.5 h-3.5 text-emerald-400" />}
                      {comp.email && <Mail className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCompany(comp);
                        }}
                        className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition"
                        title="View Profile"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      {comp.is_deleted ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreCompany(comp.id);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
                          title="Restore Prospect"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSoftDeleteCompany(comp.id);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-900 hover:text-white transition"
                          title="Soft Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD PROSPECT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-center mb-5 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>{lang === 'am' ? 'Ավելացնել Նոր Ընկերություն' : 'Add New Prospect'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yerevan City Medical"
                  value={newComp.name}
                  onChange={(e) => setNewComp({ ...newComp, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Industry</label>
                  <select
                    value={newComp.industry}
                    onChange={(e) => setNewComp({ ...newComp, industry: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="Healthcare">Healthcare</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="Restaurants">Restaurants</option>
                    <option value="Real Estate">Real Estate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Size</label>
                  <select
                    value={newComp.business_size}
                    onChange={(e) => setNewComp({ ...newComp, business_size: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="200+">200+ employees</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Website</label>
                  <input
                    type="text"
                    placeholder="https://company.am"
                    value={newComp.website}
                    onChange={(e) => setNewComp({ ...newComp, website: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+374 10 ..."
                    value={newComp.phone}
                    onChange={(e) => setNewComp({ ...newComp, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description & Notes</label>
                <textarea
                  rows={3}
                  placeholder="Business overview, current support channels..."
                  value={newComp.description}
                  onChange={(e) => setNewComp({ ...newComp, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg hover:from-blue-500 hover:to-indigo-500"
                >
                  Create & Run AI Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
