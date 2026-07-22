import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldAlert, Globe, Cpu, PhoneCall, CheckCircle2 } from 'lucide-react';

interface StrategicIntelligenceViewProps {
  lang: 'am' | 'en';
}

export const StrategicIntelligenceView: React.FC<StrategicIntelligenceViewProps> = ({ lang }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/intelligence')
      .then(res => res.json())
      .then(d => setData(d));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <span>Strategic Intelligence & Plugin Marketplace (Section 16)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Competitor tracking, market signals, voice agent foundation, and extensible agent plugin architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competitor Intelligence */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Competitor Tracking & Market Alerts</span>
          </h3>

          <div className="space-y-3 text-xs">
            {data?.competitors?.map((comp: any) => (
              <div key={comp.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white text-sm">{comp.name}</div>
                  <div className="text-slate-400 mt-0.5">{comp.industry_focus}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-semibold uppercase text-[10px]">
                  Threat: {comp.threat_level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Market Signals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Market Intelligence Signals</span>
          </h3>

          <div className="space-y-3 text-xs">
            {data?.market_signals?.map((sig: any) => (
              <div key={sig.id} className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div className="flex justify-between font-bold text-white">
                  <span>{sig.industry} Growth ({sig.region})</span>
                  <span className="text-emerald-400">+{sig.growth_rate_pct}%</span>
                </div>
                <div className="text-slate-400 mt-1">Source: {sig.source}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Agent Pilot & Plugin Marketplace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Agent Pilot */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Voice Agent Pilot Foundation</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Prepared telephony architecture for Armenian speech synthesis and automated inbound support calls. Operates under strict telecom compliance gating.
          </p>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-emerald-400 font-mono">
            STATUS: Pilot Ready (Compliant Communication Gateway)
          </div>
        </div>

        {/* Plugin Marketplace */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Plugin Marketplace & Extensibility</span>
          </h3>
          <div className="space-y-2 text-xs">
            {data?.plugins?.map((plg: any) => (
              <div key={plg.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">{plg.name}</div>
                  <div className="text-slate-400 text-[11px]">{plg.description}</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px]">
                  ACTIVE
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
