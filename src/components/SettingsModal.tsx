import React, { useState } from 'react';
import { Settings, Shield, Copy, Check, Download, Users, Sliders } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onOpenSQL: () => void;
  lang: 'am' | 'en';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenSQL, lang }) => {
  const [requireApproval, setRequireApproval] = useState(true);
  const [followupDays, setFollowupDays] = useState('3, 7, 14');
  const [blacklist, setBlacklist] = useState('spam@domain.com, optout@company.am');
  const [brandTone, setBrandTone] = useState('Professional B2B Consultative in Armenian');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Voxline AI OS Settings & Compliance</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
        </div>

        {/* Approval Thresholds */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Outreach Compliance & Approval Gate</span>
          </h3>

          <label className="flex items-center space-x-3 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 w-4 h-4"
            />
            <span>Mandatory Human Approval for AI Sales Messages (Recommended Default)</span>
          </label>
        </div>

        {/* Follow-up Cadence */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Follow-up Agent Cadence (Days)</label>
          <input
            type="text"
            value={followupDays}
            onChange={(e) => setFollowupDays(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        {/* Do-Not-Contact List */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Do-Not-Contact Blacklist</label>
          <textarea
            rows={2}
            value={blacklist}
            onChange={(e) => setBlacklist(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        {/* Brand Voice */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-300">Brand Voice & Persona Tuning</label>
          <input
            type="text"
            value={brandTone}
            onChange={(e) => setBrandTone(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        {/* Supabase Export */}
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 flex items-center justify-between">
          <div>
            <div className="font-bold text-xs text-indigo-300">Supabase SQL Database Migration</div>
            <p className="text-[11px] text-slate-400">Export complete PostgreSQL DDL schema with RLS and tables.</p>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenSQL();
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
          >
            Export SQL
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
