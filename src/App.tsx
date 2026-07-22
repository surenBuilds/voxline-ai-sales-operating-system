import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation.js';
import { CEODashboard } from './components/CEODashboard.js';
import { CRMView } from './components/CRMView.js';
import { CompanyProfileModal } from './components/CompanyProfileModal.js';
import { ScoutAndResearchView } from './components/ScoutAndResearchView.js';
import { ConversationCenter } from './components/ConversationCenter.js';
import { ProposalGenerator } from './components/ProposalGenerator.js';
import { KnowledgeBaseView } from './components/KnowledgeBaseView.js';
import { AnalyticsView } from './components/AnalyticsView.js';
import { AgentControlCenter } from './components/AgentControlCenter.js';
import { StrategicIntelligenceView } from './components/StrategicIntelligenceView.js';
import { SettingsModal } from './components/SettingsModal.js';
import { SQLMigrationModal } from './components/SQLMigrationModal.js';
import { CEOBrief, Company } from './types/index.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState('ceo_dashboard');
  const [lang, setLang] = useState<'am' | 'en'>('am');

  const [brief, setBrief] = useState<CEOBrief | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingBrief, setLoadingBrief] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSQLModal, setShowSQLModal] = useState(false);

  // Fetch CEO Brief
  const fetchBrief = async () => {
    try {
      const res = await fetch('/api/ceo/brief');
      const data = await res.json();
      setBrief(data.brief || null);
    } catch (err) {
      console.error('Fetch CEO Brief error:', err);
    } finally {
      setLoadingBrief(false);
    }
  };

  // Fetch Companies
  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies?include_deleted=true');
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Fetch companies error:', err);
    }
  };

  // Full Refresh
  const handleSyncAll = async () => {
    setIsSyncing(true);
    await Promise.all([fetchBrief(), fetchCompanies()]);
    setIsSyncing(false);
  };

  useEffect(() => {
    handleSyncAll();
  }, []);

  // Run AI CEO Strategic Engine
  const handleRunAICEO = async () => {
    setLoadingBrief(true);
    try {
      await fetch('/api/ceo/trigger-ai-ceo', { method: 'POST' });
      await fetchBrief();
    } catch (err) {
      console.error('Trigger AI CEO error:', err);
    } finally {
      setLoadingBrief(false);
    }
  };

  // Approve or Reject Strategic Recommendation
  const handleActionRecommendation = async (recId: string, action: 'approve' | 'reject') => {
    try {
      await fetch(`/api/ceo/recommendations/${recId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      fetchBrief();
    } catch (err) {
      console.error('Action recommendation error:', err);
    }
  };

  // Create Prospect
  const handleCreateCompany = async (companyData: Partial<Company>) => {
    try {
      await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      });
      handleSyncAll();
    } catch (err) {
      console.error('Create company error:', err);
    }
  };

  // Soft Delete Prospect
  const handleSoftDeleteCompany = async (id: string) => {
    try {
      await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      handleSyncAll();
    } catch (err) {
      console.error('Delete company error:', err);
    }
  };

  // Restore Soft-Deleted Prospect
  const handleRestoreCompany = async (id: string) => {
    try {
      await fetch(`/api/companies/${id}/restore`, { method: 'POST' });
      handleSyncAll();
    } catch (err) {
      console.error('Restore company error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header & Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSQLModal={() => setShowSQLModal(true)}
        isSyncing={isSyncing}
        onSync={handleSyncAll}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'ceo_dashboard' && (
          <CEODashboard
            brief={brief}
            onSelectCompany={(comp) => setSelectedCompanyId(comp.id)}
            onRunAICEO={handleRunAICEO}
            onActionRecommendation={handleActionRecommendation}
            loading={loadingBrief}
            lang={lang}
          />
        )}

        {currentTab === 'crm' && (
          <CRMView
            companies={companies}
            onSelectCompany={(comp) => setSelectedCompanyId(comp.id)}
            onCreateCompany={handleCreateCompany}
            onSoftDeleteCompany={handleSoftDeleteCompany}
            onRestoreCompany={handleRestoreCompany}
            lang={lang}
          />
        )}

        {currentTab === 'scout' && (
          <ScoutAndResearchView
            onSelectCompany={(comp) => setSelectedCompanyId(comp.id)}
            lang={lang}
          />
        )}

        {currentTab === 'conversations' && (
          <ConversationCenter lang={lang} />
        )}

        {currentTab === 'proposals' && (
          <ProposalGenerator lang={lang} />
        )}

        {currentTab === 'kb' && (
          <KnowledgeBaseView lang={lang} />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView lang={lang} />
        )}

        {currentTab === 'strategic' && (
          <StrategicIntelligenceView lang={lang} />
        )}

        {currentTab === 'agents' && (
          <AgentControlCenter lang={lang} />
        )}
      </main>

      {/* Company 360° Profile View Modal */}
      {selectedCompanyId && (
        <CompanyProfileModal
          companyId={selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
          lang={lang}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onOpenSQL={() => setShowSQLModal(true)}
          lang={lang}
        />
      )}

      {/* Supabase SQL Migration Modal */}
      {showSQLModal && (
        <SQLMigrationModal onClose={() => setShowSQLModal(false)} />
      )}
    </div>
  );
}
