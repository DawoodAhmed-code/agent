import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Users,
  Send,
  FileBarChart2,
  TableProperties,
  Settings,
  Sparkles,
  Layers,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../../types/index.js';

export type NavTab =
  | 'dashboard'
  | 'campaigns'
  | 'crm'
  | 'outreach'
  | 'reports'
  | 'integrations'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: UserProfile | null;
  onOpenNewCampaign: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenNewCampaign,
  isOpenMobile,
  onCloseMobile,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'campaigns', label: 'AI Campaigns', icon: <Compass className="w-5 h-5" /> },
    { id: 'crm', label: 'Lead CRM', icon: <Users className="w-5 h-5" /> },
    { id: 'outreach', label: 'Outreach Hub', icon: <Send className="w-5 h-5" /> },
    { id: 'reports', label: 'Intelligence Reports', icon: <FileBarChart2 className="w-5 h-5" /> },
    { id: 'integrations', label: 'Sheets & Integrations', icon: <TableProperties className="w-5 h-5" /> },
    { id: 'settings', label: 'Agency & Profile', icon: <Settings className="w-5 h-5" /> },
  ];

  const handleTabClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-68 bg-slate-950/95 lg:bg-slate-950/80 border-r border-slate-800/80 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-5 flex items-center justify-between border-b border-slate-800/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">LeadPilot</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">B2B Client Generation</p>
            </div>
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onOpenNewCampaign();
              onCloseMobile();
            }}
            className="w-full relative group overflow-hidden rounded-xl p-[1px] font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-600 rounded-xl transition-all duration-300 group-hover:opacity-90" />
            <div className="relative px-4 py-2.5 rounded-[11px] bg-slate-950/40 group-hover:bg-transparent transition-all flex items-center justify-center gap-2 text-white font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-blue-300 animate-pulse" />
              <span>Start New Campaign</span>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-white border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
              </button>
            );
          })}
        </div>

        {/* Agency Provider Card */}
        <div className="p-3 border-t border-slate-800/70">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'LP'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.agencyName || 'Web Agency'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.name || 'Dawood Ahmed'}</p>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live AI Grounding
              </span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
