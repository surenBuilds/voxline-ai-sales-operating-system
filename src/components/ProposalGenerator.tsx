import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, Printer, Plus, Trash2, Building2 } from 'lucide-react';
import { Proposal, Company } from '../types/index.js';

interface ProposalGeneratorProps {
  lang: 'am' | 'en';
}

export const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({ lang }) => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/proposals');
      const data = await res.json();
      setProposals(data.proposals || []);

      const cRes = await fetch('/api/companies');
      const cData = await cRes.json();
      setCompanies(cData.companies || []);
      if (cData.companies?.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(cData.companies[0].id);
      }
    } catch (err) {
      console.error('Fetch proposals error:', err);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleGenerate = async () => {
    if (!selectedCompanyId) return;
    setIsGenerating(true);
    try {
      await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: selectedCompanyId })
      });
      fetchProposals();
    } catch (err) {
      console.error('Generate proposal error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Voxline AI Proposal Generator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generates custom executive business proposals grounded in Knowledge Base pricing and identified opportunities.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>
            ))}
          </select>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating Proposal...' : 'Generate AI Proposal'}</span>
          </button>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-6">
        {proposals.map((prop) => (
          <div key={prop.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-cyan-400 font-semibold uppercase">Proposal ID: {prop.id}</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{prop.company_name}</h3>
              </div>

              <div className="text-right">
                <span className="text-xl font-black text-white">${prop.estimated_value.toLocaleString()}</span>
                <div className="text-xs text-emerald-400 font-medium">Status: {prop.status.toUpperCase()}</div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase">Services & Pricing Breakdown</h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                {prop.line_items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white">{item.service_name}</div>
                      <div className="text-slate-400 mt-0.5">{item.description}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-cyan-300 font-bold">Setup: ${item.setup_fee_usd}</div>
                      <div className="text-emerald-400">Monthly: ${item.monthly_recurring_usd}/mo</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI & Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-800/40 p-4 rounded-xl">
              <div>
                <span className="font-bold text-cyan-400 block mb-1">ROI Projection:</span>
                <p className="text-slate-300 leading-relaxed">{prop.roi_projection}</p>
              </div>
              <div>
                <span className="font-bold text-purple-400 block mb-1">Implementation Timeline:</span>
                <p className="text-slate-300">{prop.implementation_timeline}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
