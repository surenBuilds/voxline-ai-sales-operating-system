import React, { useState } from 'react';
import { Search, Sparkles, Building2, Globe, Bot, ArrowRight } from 'lucide-react';
import { Company } from '../types/index.js';

interface ScoutAndResearchViewProps {
  onSelectCompany: (company: Company) => void;
  lang: 'am' | 'en';
}

export const ScoutAndResearchView: React.FC<ScoutAndResearchViewProps> = ({ onSelectCompany, lang }) => {
  const [industry, setIndustry] = useState('Healthcare');
  const [region, setRegion] = useState('Yerevan');
  const [isSearching, setIsSearching] = useState(false);
  const [discoveredCompanies, setDiscoveredCompanies] = useState<Company[]>([]);

  const handleRunScout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const res = await fetch('/api/agents/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, region })
      });
      const data = await res.json();
      setDiscoveredCompanies(data.new_companies || []);
    } catch (err) {
      console.error('Scout run error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scout Agent Control Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4" />
              <span>Voxline Scout Agent — Discovery Engine</span>
            </div>
            <h2 className="text-2xl font-black text-white">
              {lang === 'am' ? 'Հայկական Բիզնեսների Ավտոմատ Հայտնաբերում' : 'Discover Armenian Business Prospects'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Scout Agent scans public registries, Google Maps, and social channels in Armenia, triggers instant digital presence audits, and identifies automation gaps.
            </p>
          </div>

          <form onSubmit={handleRunScout} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Healthcare">Healthcare & Clinics</option>
              <option value="Hospitality">Hotels & Resorts</option>
              <option value="Food & Beverage">Culinary & Production</option>
              <option value="Financial Services">Banking & FinTech</option>
              <option value="Restaurants">Restaurants & Dining</option>
              <option value="Real Estate">Real Estate Agencies</option>
            </select>

            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="Yerevan">Yerevan</option>
              <option value="Gyumri">Gyumri</option>
              <option value="Vanadzor">Vanadzor</option>
              <option value="Dilijan">Dilijan</option>
            </select>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 whitespace-nowrap"
            >
              <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Scouting Armenia...' : 'Run Scout Agent'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Discovered Prospects Grid */}
      {discoveredCompanies.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Newly Discovered & Scored Prospects ({discoveredCompanies.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {discoveredCompanies.map((comp) => (
              <div
                key={comp.id}
                onClick={() => onSelectCompany(comp)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-base">{comp.name}</h4>
                    <span className="text-xs text-cyan-400 font-medium">{comp.industry}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                    Score: {comp.lead_score || 50}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2">{comp.description}</p>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                  <span className="flex items-center"><Globe className="w-3.5 h-3.5 mr-1" />{comp.website}</span>
                  <button className="text-cyan-400 font-semibold flex items-center space-x-1 hover:text-cyan-300">
                    <span>Review Audit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
