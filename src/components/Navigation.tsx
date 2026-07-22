import React from 'react';
import {
  Brain, LayoutDashboard, Building2, Search, MessageSquare,
  FileText, BookOpen, BarChart3, Bot, Settings, Database,
  Sparkles, RefreshCw
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: 'am' | 'en';
  setLang: (lang: 'am' | 'en') => void;
  onOpenSettings: () => void;
  onOpenSQLModal: () => void;
  isSyncing: boolean;
  onSync: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  onOpenSettings,
  onOpenSQLModal,
  isSyncing,
  onSync
}) => {
  const tabs = [
    { id: 'ceo_dashboard', label: lang === 'am' ? 'CEO Վահանակ' : 'CEO Dashboard', icon: LayoutDashboard },
    { id: 'crm', label: lang === 'am' ? 'CRM & Լիդեր' : 'CRM & Leads', icon: Building2 },
    { id: 'scout', label: lang === 'am' ? 'Scout & AI Research' : 'Scout & Research', icon: Search },
    { id: 'conversations', label: lang === 'am' ? 'Վաճառքի Զրույցներ' : 'Sales Center', icon: MessageSquare },
    { id: 'proposals', label: lang === 'am' ? 'Առաջարկներ (AI)' : 'Proposal AI', icon: FileText },
    { id: 'kb', label: lang === 'am' ? 'Գիտելիքի Բազա' : 'Knowledge Base', icon: BookOpen },
    { id: 'analytics', label: lang === 'am' ? 'Վերլուծություն' : 'Analytics & Revenue', icon: BarChart3 },
    { id: 'strategic', label: lang === 'am' ? 'AI CEO & Մրցակիցներ' : 'Strategic AI', icon: Sparkles },
    { id: 'agents', label: lang === 'am' ? 'Voxline Brain & Գործակալներ' : 'Agents & Brain', icon: Bot },
  ];

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('ceo_dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Brain className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-wide">Voxline AI</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  OS v2.4
                </span>
              </div>
              <span className="text-xs text-slate-400 block -mt-0.5">AI Business Operating System</span>
            </div>
          </div>

          {/* Quick Actions & Config */}
          <div className="flex items-center space-x-3">
            {/* Sync Status Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
              title="Refresh and sync Voxline Brain"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Brain'}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setLang('am')}
                className={`px-2 py-1 text-xs rounded-md font-medium transition ${
                  lang === 'am' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇦🇲 ՀԱՅ
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 text-xs rounded-md font-medium transition ${
                  lang === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇺🇸 ENG
              </button>
            </div>

            {/* Supabase SQL Export Button */}
            <button
              onClick={onOpenSQLModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/60 text-xs border border-indigo-700/50 transition"
              title="Export Supabase SQL Database Migration"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Export Supabase SQL</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Settings & System Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Profile Badge */}
            <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow">
                SH
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-slate-200 block">Suren H.</span>
                <span className="text-[10px] text-cyan-400 block font-medium">CEO / Architect</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
