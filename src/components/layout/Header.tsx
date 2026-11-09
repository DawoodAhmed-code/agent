import React from 'react';
import {
  Menu,
  Sparkles,
  RefreshCw,
  Search,
  Globe,
  Table,
  CheckCircle,
} from 'lucide-react';
import { NavTab } from './Sidebar.js';

interface HeaderProps {
  currentTab: NavTab;
  onToggleMobileMenu: () => void;
  onOpenNewCampaign: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
  sheetsConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onToggleMobileMenu,
  onOpenNewCampaign,
  onRefreshData,
  isLoading,
  sheetsConnected,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Executive Dashboard', subtitle: 'Live lead intelligence & pipeline metrics' };
      case 'campaigns':
        return { title: 'AI Business Discovery Campaigns', subtitle: 'Grounding search across international cities' };
      case 'agents':
        return { title: 'AI Agent Studio & Models', subtitle: 'Deploy custom AI agents & multi-model pipeline routing' };
      case 'crm':
        return { title: 'Lead Management CRM', subtitle: 'Detailed scoring, pipeline status & deals' };
      case 'outreach':
        return { title: 'Personalized Outreach Generator', subtitle: 'Cold emails, LinkedIn pitches & follow-ups' };
      case 'reports':
        return { title: 'Campaign Summary & Reporting', subtitle: 'Deep analysis, recurring problems & strategic next steps' };
      case 'integrations':
        return { title: 'Google Sheets & Integrations', subtitle: '25-column live sync, webhooks & database status' };
      case 'settings':
        return { title: 'Agency Profile & Services', subtitle: 'Your offered web services, portfolio & signature' };
      default:
        return { title: 'LeadPilot AI', subtitle: 'B2B Client Generation' };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  return (
    <header className="sticky top-0 z-30 h-18 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Google Sheets Sync Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
          <Table className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-300">Sheets Sync:</span>
          {sheetsConnected ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Connected
            </span>
          ) : (
            <span className="text-amber-400 font-medium">CSV Ready</span>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="Refresh live data"
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>

        {/* Start Campaign Action */}
        <button
          onClick={onOpenNewCampaign}
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span className="hidden sm:inline">Start Campaign</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
};
