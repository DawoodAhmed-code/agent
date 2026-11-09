import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar.js';
import { Header } from './components/layout/Header.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { LeadCRMView } from './components/crm/LeadCRMView.js';
import { LeadProfileModal } from './components/crm/LeadProfileModal.js';
import { NewCampaignModal } from './components/campaigns/NewCampaignModal.js';
import { CampaignsListView } from './components/campaigns/CampaignsListView.js';
import { OutreachHubView } from './components/outreach/OutreachHubView.js';
import { CampaignReportsView } from './components/reports/CampaignReportsView.js';
import { IntegrationsView } from './components/integrations/IntegrationsView.js';
import { AIAgentStudioView } from './components/agents/AIAgentStudioView.js';
import { ToastContainer, ToastMessage } from './components/ui/Toast.js';
import { api } from './services/api.js';
import {
  Lead,
  Campaign,
  DashboardStats,
  ActivityLog,
  UserProfile,
  GoogleSheetsConfig,
  LeadStatus,
  AIAgentProfile,
  AgentModelSettings,
} from './types/index.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Core Data
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({ connected: false });
  const [agents, setAgents] = useState<AIAgentProfile[]>([]);
  const [agentSettings, setAgentSettings] = useState<AgentModelSettings>({
    globalModel: 'gemini-3.8-flash',
    activeAgentId: 'agent_apex_growth',
    discoveryAgentId: 'agent_apex_growth',
    websiteAnalysisAgentId: 'agent_creative_ux',
    leadScoringAgentId: 'agent_apex_growth',
    outreachAgentId: 'agent_apex_growth',
    reportingAgentId: 'agent_enterprise_closer',
  });

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = 'toast_' + Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all initial data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        userData,
        statsData,
        campsData,
        leadsData,
        actsData,
        sheetsData,
        agentsData,
        settingsData,
      ] = await Promise.all([
        api.getMe().catch(() => ({ user: null as any })),
        api.getDashboardStats().catch(() => null),
        api.getCampaigns().catch(() => []),
        api.getLeads().catch(() => []),
        api.getActivities().catch(() => []),
        api.getSheetsConfig().catch(() => ({ connected: false })),
        api.getAgents().catch(() => []),
        api.getAgentSettings().catch(() => ({ settings: null as any })),
      ]);

      if (userData?.user) setUser(userData.user);
      if (statsData) setStats(statsData);
      setCampaigns(campsData);
      setLeads(leadsData);
      setActivities(actsData);
      setSheetsConfig(sheetsData);
      if (Array.isArray(agentsData) && agentsData.length > 0) setAgents(agentsData);
      if (settingsData?.settings) setAgentSettings(settingsData.settings);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      showToast('error', 'Network Error', 'Failed to synchronize with server.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lead Operations
  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const updated = await api.updateLead(id, updates);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      if (selectedLead?.id === id) {
        setSelectedLead(updated);
      }
      // Refresh stats in background
      api.getDashboardStats().then((s) => setStats(s)).catch(() => {});
      api.getActivities().then((a) => setActivities(a)).catch(() => {});
      showToast('success', 'Lead Updated', `Pipeline changes saved for ${updated.businessName}`);
      return updated;
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update lead');
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: LeadStatus) => {
    await handleUpdateLead(id, { status });
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await api.deleteLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      if (selectedLead?.id === id) {
        setSelectedLead(null);
      }
      api.getDashboardStats().then((s) => setStats(s)).catch(() => {});
      api.getActivities().then((a) => setActivities(a)).catch(() => {});
      showToast('info', 'Lead Deleted', 'Lead removed from CRM.');
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  const handleBulkDelete = async (leadIds: string[]) => {
    try {
      await api.bulkDeleteLeads(leadIds);
      setLeads((prev) => prev.filter((l) => !leadIds.includes(l.id)));
      api.getDashboardStats().then((s) => setStats(s)).catch(() => {});
      api.getActivities().then((a) => setActivities(a)).catch(() => {});
      showToast('success', 'Batch Deleted', `Deleted ${leadIds.length} leads.`);
    } catch (err: any) {
      showToast('error', 'Bulk Delete Failed', err.message);
    }
  };

  const handleGenerateOutreach = async (id: string, customPrompt?: string, agentId?: string) => {
    try {
      const res = await api.generateOutreach(id, customPrompt, agentId);
      setLeads((prev) => prev.map((l) => (l.id === id ? res.lead : l)));
      if (selectedLead?.id === id) {
        setSelectedLead(res.lead);
      }
      showToast('success', 'Outreach Generated', 'Personalized email, LinkedIn & DM copy created.');
    } catch (err: any) {
      showToast('error', 'Generation Failed', err.message);
    }
  };

  const handleReResearchLead = async (id: string, agentId?: string) => {
    try {
      const res = await api.reResearchLead(id, agentId);
      setLeads((prev) => prev.map((l) => (l.id === id ? res.lead : l)));
      if (selectedLead?.id === id) {
        setSelectedLead(res.lead);
      }
      showToast('success', 'Re-Audit Completed', `Updated score: ${res.lead.leadScore}/100`);
    } catch (err: any) {
      showToast('error', 'Audit Failed', err.message);
    }
  };

  // AI Agent Operations
  const handleCreateAgent = async (newAgent: Partial<AIAgentProfile>) => {
    try {
      const created = await api.createAgent(newAgent);
      setAgents((prev) => [...prev, created]);
      showToast('success', 'Agent Created', `${created.name} is ready for deployment.`);
    } catch (err: any) {
      showToast('error', 'Agent Creation Failed', err.message);
    }
  };

  const handleUpdateAgent = async (id: string, updates: Partial<AIAgentProfile>) => {
    try {
      const updated = await api.updateAgent(id, updates);
      setAgents((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast('success', 'Agent Updated', `${updated.name} settings saved.`);
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      await api.deleteAgent(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      showToast('info', 'Agent Removed', 'Custom agent deleted.');
    } catch (err: any) {
      showToast('error', 'Delete Failed', err.message);
    }
  };

  const handleUpdateAgentSettings = async (settings: Partial<AgentModelSettings>) => {
    try {
      const res = await api.updateAgentSettings(settings);
      setAgentSettings(res.settings);
      showToast('success', 'Pipeline Matrix Updated', 'AI models and agent assignments saved.');
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message);
    }
  };

  const handleTestPlayground = async (payload: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    thinkingLevel?: string;
    useSearch?: boolean;
  }) => {
    return await api.testAgentPlayground(payload);
  };

  // Campaign Operations
  const handleRunCampaign = async (campaignId: string) => {
    const result = await api.runCampaign(campaignId);
    if (result.success) {
      setCampaigns((prev) =>
        prev.map((c) => (c.id === campaignId ? result.campaign : c))
      );
      if (result.leads && result.leads.length > 0) {
        setLeads((prev) => [...result.leads, ...prev]);
      }
      api.getDashboardStats().then((s) => setStats(s)).catch(() => {});
      api.getActivities().then((a) => setActivities(a)).catch(() => {});
    }
    return result;
  };

  const handleCampaignCreated = (campaign: Campaign, newLeadsCount: number) => {
    setCampaigns((prev) => [campaign, ...prev]);
    showToast(
      'success',
      'Campaign Completed!',
      `Discovered and scored ${newLeadsCount} prospective businesses in ${campaign.city}, ${campaign.country}`
    );
    fetchData();
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await api.deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setLeads((prev) => prev.filter((l) => l.campaignId !== id));
      api.getDashboardStats().then((s) => setStats(s)).catch(() => {});
      showToast('info', 'Campaign Deleted', 'Campaign and associated leads removed.');
    } catch (err: any) {
      showToast('error', 'Failed to delete campaign', err.message);
    }
  };

  // Google Sheets Sync
  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await api.syncSheets();
      if (res.success) {
        showToast('success', 'Sheets Synced!', res.message);
      } else {
        showToast('info', 'Google Sheets Notice', res.message);
      }
      const updatedConfig = await api.getSheetsConfig();
      setSheetsConfig(updatedConfig);
    } catch (err: any) {
      showToast('error', 'Sync Failed', err.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleExportCsv = (leadIds?: string[]) => {
    api.exportCsv(leadIds);
    showToast('success', 'CSV Exporting', 'Downloading 25-column spreadsheet file...');
  };

  const handleUpdateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const res = await api.updateProfile(updates);
      setUser(res.user);
      showToast('success', 'Profile Saved', 'Agency settings updated.');
    } catch (err: any) {
      showToast('error', 'Save Failed', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c15] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        user={user}
        onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-68 flex flex-col min-h-screen transition-all">
        {/* Sticky Header */}
        <Header
          currentTab={currentTab}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
          onRefreshData={fetchData}
          isLoading={isLoading}
          sheetsConnected={sheetsConfig.connected}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              recentLeads={leads}
              activities={activities}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onNavigateToCRM={() => setCurrentTab('crm')}
            />
          )}

          {currentTab === 'campaigns' && (
            <CampaignsListView
              campaigns={campaigns}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              onSelectCampaignForCRM={(campId) => setCurrentTab('crm')}
              onSelectCampaignForReport={(campId) => setCurrentTab('reports')}
              onDeleteCampaign={handleDeleteCampaign}
              onRunCampaign={handleRunCampaign}
            />
          )}

          {currentTab === 'crm' && (
            <LeadCRMView
              leads={leads}
              campaigns={campaigns}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onExportCsv={handleExportCsv}
              onBulkDelete={handleBulkDelete}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              onSyncSheets={handleSyncSheets}
              isSyncingSheets={isSyncingSheets}
            />
          )}

          {currentTab === 'outreach' && (
            <OutreachHubView
              leads={leads}
              onSelectLead={(lead) => setSelectedLead(lead)}
              onUpdateLead={handleUpdateLead}
              onGenerateOutreach={handleGenerateOutreach}
            />
          )}

          {currentTab === 'agents' && (
            <AIAgentStudioView
              agents={agents}
              agentSettings={agentSettings}
              onUpdateAgentSettings={handleUpdateAgentSettings}
              onCreateAgent={handleCreateAgent}
              onUpdateAgent={handleUpdateAgent}
              onDeleteAgent={handleDeleteAgent}
              onTestPlayground={handleTestPlayground}
            />
          )}

          {currentTab === 'reports' && (
            <CampaignReportsView
              campaigns={campaigns}
              leads={leads}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
            />
          )}

          {currentTab === 'integrations' && (
            <IntegrationsView
              sheetsConfig={sheetsConfig}
              user={user}
              onUpdateSheetsConfig={async (c) => {
                const updated = await api.updateSheetsConfig(c);
                setSheetsConfig(updated);
              }}
              onSyncSheets={handleSyncSheets}
              onExportCsv={() => handleExportCsv()}
              onUpdateProfile={handleUpdateProfile}
              isSyncing={isSyncingSheets}
            />
          )}

          {currentTab === 'settings' && (
            <IntegrationsView
              sheetsConfig={sheetsConfig}
              user={user}
              onUpdateSheetsConfig={async (c) => {
                const updated = await api.updateSheetsConfig(c);
                setSheetsConfig(updated);
              }}
              onSyncSheets={handleSyncSheets}
              onExportCsv={() => handleExportCsv()}
              onUpdateProfile={handleUpdateProfile}
              isSyncing={isSyncingSheets}
            />
          )}
        </main>
      </div>

      {/* New Campaign Creation Modal */}
      <NewCampaignModal
        isOpen={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
        onCampaignCreated={handleCampaignCreated}
        onRunCampaign={handleRunCampaign}
        agents={agents}
      />

      {/* Deep Lead Profile & Outreach Modal */}
      <LeadProfileModal
        lead={selectedLead}
        isOpen={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        onUpdateLead={handleUpdateLead}
        onDeleteLead={handleDeleteLead}
        onGenerateOutreach={handleGenerateOutreach}
        onReResearch={handleReResearchLead}
        agents={agents}
      />
    </div>
  );
}
