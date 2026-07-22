import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, PieChart } from 'lucide-react';

interface AnalyticsViewProps {
  lang: 'am' | 'en';
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ lang }) => {
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
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span>Executive Analytics & Revenue AI Forecasting</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Predictive pipeline modeling, conversion funnel statistics, and sector yield analytics in Armenia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Revenue AI Q3 Forecast</span>
          </h3>
          <div className="text-3xl font-black text-white">$28,500</div>
          <div className="text-xs text-slate-400 space-y-1 border-t border-slate-800 pt-3">
            <div className="flex justify-between"><span>Low Estimate:</span> <span className="text-slate-200 font-mono">$21,000</span></div>
            <div className="flex justify-between"><span>High Estimate:</span> <span className="text-slate-200 font-mono">$36,000</span></div>
            <div className="flex justify-between"><span>Confidence:</span> <span className="text-cyan-400 font-bold">88%</span></div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>Industry Conversion Rates</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1"><span>Healthcare</span><span className="font-bold text-emerald-400">32%</span></div>
              <div className="w-full bg-slate-800 h-2 rounded-full"><div className="bg-emerald-500 h-full rounded-full w-[32%]" /></div>
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-1"><span>Hospitality</span><span className="font-bold text-blue-400">22%</span></div>
              <div className="w-full bg-slate-800 h-2 rounded-full"><div className="bg-blue-500 h-full rounded-full w-[22%]" /></div>
            </div>
            <div>
              <div className="flex justify-between text-slate-300 mb-1"><span>Restaurants</span><span className="font-bold text-amber-400">8%</span></div>
              <div className="w-full bg-slate-800 h-2 rounded-full"><div className="bg-amber-500 h-full rounded-full w-[8%]" /></div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span>Outreach Channel Yield</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded bg-slate-800/60 flex justify-between"><span>Instagram DMs</span><span className="font-bold text-cyan-400">54% replies</span></div>
            <div className="p-2.5 rounded bg-slate-800/60 flex justify-between"><span>WhatsApp Direct</span><span className="font-bold text-emerald-400">38% replies</span></div>
            <div className="p-2.5 rounded bg-slate-800/60 flex justify-between"><span>Cold Email</span><span className="font-bold text-purple-400">14% replies</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
