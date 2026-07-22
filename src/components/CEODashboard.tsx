import React from 'react';
import {
  TrendingUp, Sparkles, Building2,
  DollarSign, CheckCircle2, AlertTriangle, ArrowUpRight,
  ShieldAlert, RefreshCw, Zap
} from 'lucide-react';
import { CEOBrief, Company, StrategicRecommendation } from '../types/index.js';

interface CEODashboardProps {
  brief: CEOBrief | null;
  onSelectCompany: (company: Company) => void;
  onRunAICEO: () => void;
  onActionRecommendation: (recId: string, action: 'approve' | 'reject') => void;
  loading: boolean;
  lang: 'am' | 'en';
}

export const CEODashboard: React.FC<CEODashboardProps> = ({
  brief,
  onSelectCompany,
  onRunAICEO,
  onActionRecommendation,
  loading,
  lang
}) => {
  if (loading || !brief) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Generating Voxline AI CEO Brief & Synthesizing Strategic Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CEO Brief Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>{lang === 'am' ? 'Voxline AI CEO-ի Ամենօրյա Զեկույց' : 'Executive AI CEO Daily Intelligence Brief'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {lang === 'am' ? 'Բարև, Սուրեն: Ահա այսօրվա առաջնահերթությունները' : 'Good Morning, Suren. Here is Today’s Strategic Brief'}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              {lang === 'am'
                ? 'Voxline Brain-ը վերլուծել է Հայաստանի բիզնես շուկան, 32 ակտիվ լիդերը և առաջարկում է ռեսուրսների 40% վերաբաշխում դեպի Healthcare:'
                : 'Voxline Brain analyzed 32 active prospects in Armenia. Healthcare conversion leads at 32%. AI CEO recommends immediate outreach pass.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRunAICEO}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition transform active:scale-95"
            >
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              <span>{lang === 'am' ? 'Վերլուծել AI CEO-ով' : 'Run AI CEO Analysis'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlight Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Forecasted Revenue */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {lang === 'am' ? 'Կանխատեսվող Եկամուտ (Q3)' : 'Forecasted Revenue (Q3)'}
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ${brief.expected_revenue_usd.toLocaleString()}
          </div>
          <p className="text-xs text-emerald-400 mt-2 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            <span>+24.5% vs last month</span>
          </p>
        </div>

        {/* Top Hot Leads */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {lang === 'am' ? 'Թեժ Լիդեր (Hot Prospects)' : 'Top Hot Prospects'}
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {brief.top_20_leads.filter(l => (l.lead_score || 0) >= 80).length}
          </div>
          <p className="text-xs text-slate-400 mt-2">Score ≥ 80 with high automation gap</p>
        </div>

        {/* Pipeline Health Score */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {lang === 'am' ? 'Փայփլայնի Առողջություն' : 'Pipeline Health Score'}
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {brief.pipeline_health_score} / 100
          </div>
          <p className="text-xs text-blue-400 mt-2">Optimal agent execution speed</p>
        </div>

        {/* AI Recommendations Pending */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              {lang === 'am' ? 'Սպասող Որոշումներ' : 'Strategic Decisions'}
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {brief.strategic_recommendations.filter(r => r.status === 'pending').length}
          </div>
          <p className="text-xs text-purple-400 mt-2">Awaiting CEO Approval</p>
        </div>
      </div>

      {/* Main Grid: AI CEO Strategic Recommendations & Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: AI CEO Strategic Recommendations & Top Leads */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI CEO Strategic Recommendations Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  {lang === 'am' ? 'AI CEO — Ռազմավարական Առաջարկություններ' : 'AI CEO Strategic Recommendations'}
                </h2>
              </div>
              <span className="px-2.5 py-1 text-xs rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                Voxline Brain Grounded
              </span>
            </div>

            <div className="space-y-4">
              {brief.strategic_recommendations.map((rec: StrategicRecommendation) => (
                <div
                  key={rec.id}
                  className={`p-5 rounded-xl border transition-all ${
                    rec.status === 'approved'
                      ? 'bg-emerald-950/20 border-emerald-800/50'
                      : rec.status === 'rejected'
                      ? 'bg-rose-950/20 border-rose-800/50 opacity-60'
                      : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50 uppercase">
                          {rec.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">
                          Confidence: <strong className="text-cyan-400">{rec.confidence_score}%</strong>
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base leading-snug">{rec.decision_text}</h3>
                      <p className="text-xs text-slate-300 mt-2 leading-relaxed">{rec.reasoning}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center text-emerald-400 font-medium">
                          <TrendingUp className="w-3.5 h-3.5 mr-1" />
                          Expected: {rec.expected_outcome}
                        </span>
                        <span>• Data Ref: {rec.data_source_ref}</span>
                      </div>
                    </div>

                    {rec.status === 'pending' ? (
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => onActionRecommendation(rec.id, 'approve')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onActionRecommendation(rec.id, 'reject')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                          rec.status === 'approved'
                            ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700'
                            : 'bg-rose-900/40 text-rose-300 border-rose-700'
                        }`}
                      >
                        {rec.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Prospects Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {lang === 'am' ? 'Այսօրվա Թոփ 20 Լիդերը' : 'Today’s Top 20 Prospect Target List'}
                </h2>
                <p className="text-xs text-slate-400">Ranked by Voxline AI Score & Automation Gap Severity</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="py-3 px-3">Company Name</th>
                    <th className="py-3 px-3">Industry</th>
                    <th className="py-3 px-3">AI Score</th>
                    <th className="py-3 px-3">Pipeline Stage</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {brief.top_20_leads.map((comp: Company) => (
                    <tr
                      key={comp.id}
                      className="hover:bg-slate-800/40 cursor-pointer transition"
                      onClick={() => onSelectCompany(comp)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{comp.name}</div>
                        <div className="text-xs text-slate-400">{comp.website}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {comp.industry}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-xs ${
                            (comp.lead_score || 0) >= 80
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {comp.lead_score || 50} / 100
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs capitalize text-cyan-400 font-medium">
                          {comp.pipeline_stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCompany(comp);
                          }}
                          className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recommended Actions & Risk Radar */}
        <div className="space-y-6">
          {/* Executive Action Items */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{lang === 'am' ? 'Առաջնահերթ Գործողություններ' : 'CEO Action Items'}</span>
            </h3>

            <div className="space-y-3">
              {brief.recommended_actions.map((act, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 leading-relaxed flex items-start space-x-2.5">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Alerts & Competitor Watch */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>{lang === 'am' ? 'Ռիսկերի և Մրցակցային Ազդանշաններ' : 'Market Risk Alerts'}</span>
            </h3>

            <div className="space-y-3">
              {brief.potential_risks.map((risk, i) => (
                <div key={i} className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{risk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Goals Progress */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Weekly Sales Goals</h3>
            <div className="space-y-4">
              {brief.weekly_goals.map((g, i) => {
                const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">{g.metric}</span>
                      <span className="text-cyan-400 font-bold">{g.current} / {g.target}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
