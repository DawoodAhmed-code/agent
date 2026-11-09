import React from 'react';
import {
  Users,
  Calendar,
  HeartHandshake,
  MailCheck,
  Trophy,
  Percent,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Clock,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { DashboardStats, Lead, ActivityLog, Priority, LeadStatus } from '../../types/index.js';

interface DashboardViewProps {
  stats: DashboardStats | null;
  recentLeads: Lead[];
  activities: ActivityLog[];
  onOpenNewCampaign: () => void;
  onSelectLead: (lead: Lead) => void;
  onNavigateToCRM: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  recentLeads,
  activities,
  onOpenNewCampaign,
  onSelectLead,
  onNavigateToCRM,
}) => {
  if (!stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading intelligence metrics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: <Users className="w-5 h-5 text-blue-400" />,
      subtext: `${stats.leadsToday} added today`,
      glow: 'from-blue-600/20 to-blue-900/10',
      border: 'border-blue-500/30',
    },
    {
      label: 'Leads Today',
      value: stats.leadsToday,
      icon: <Calendar className="w-5 h-5 text-indigo-400" />,
      subtext: 'Real-time AI discoveries',
      glow: 'from-indigo-600/20 to-indigo-900/10',
      border: 'border-indigo-500/30',
    },
    {
      label: 'Interested Prospects',
      value: stats.interestedProspects,
      icon: <HeartHandshake className="w-5 h-5 text-violet-400" />,
      subtext: 'High engagement stage',
      glow: 'from-violet-600/20 to-violet-900/10',
      border: 'border-violet-500/30',
    },
    {
      label: 'Emails Prepared',
      value: stats.emailsPrepared,
      icon: <MailCheck className="w-5 h-5 text-sky-400" />,
      subtext: 'AI personalized copy ready',
      glow: 'from-sky-600/20 to-sky-900/10',
      border: 'border-sky-500/30',
    },
    {
      label: 'Deals Won',
      value: stats.dealsWon,
      icon: <Trophy className="w-5 h-5 text-amber-400" />,
      subtext: stats.totalDealValue ? `$${stats.totalDealValue.toLocaleString()} pipeline` : 'Closed revenue',
      glow: 'from-amber-600/20 to-amber-900/10',
      border: 'border-amber-500/30',
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: <Percent className="w-5 h-5 text-emerald-400" />,
      subtext: 'Won / Total lead ratio',
      glow: 'from-emerald-600/20 to-emerald-900/10',
      border: 'border-emerald-500/30',
    },
  ];

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Low':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'Deal Won':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Interested':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Negotiation':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Contacted':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Message Prepared':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'Follow-up Required':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const statusColors: Record<string, string> = {
    New: '#64748b',
    Researched: '#3b82f6',
    'Message Prepared': '#0284c7',
    Contacted: '#6366f1',
    Interested: '#10b981',
    'Follow-up Required': '#f97316',
    Negotiation: '#a855f7',
    'Deal Won': '#f59e0b',
    'Deal Lost': '#ef4444',
    'Not Interested': '#475569',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Welcome Banner & Quick Action */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>International Business Lead Generation Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to find high-value client projects?
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Launch targeted AI research campaigns in any city across the globe. Uncover real businesses with sub-optimal websites, diagnose UX gaps, score opportunities, and generate tailored outreach.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenNewCampaign}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-500/25 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span>Start New Campaign</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key Statistic Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl bg-slate-900/70 backdrop-blur-md border ${card.border} shadow-lg relative overflow-hidden group hover:border-indigo-500/50 transition-all`}
          >
            <div className={`absolute inset-0 bg-gradient-to-b ${card.glow} opacity-20 pointer-events-none`} />
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 truncate">{card.label}</span>
                <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                  {card.icon}
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400 truncate">{card.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Lead Generation Trend */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Daily Lead Discoveries (Past 7 Days)
              </h3>
              <p className="text-xs text-slate-400">Total qualified businesses researched per day</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyLeadTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leadAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#leadAreaGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Status Distribution */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-xl space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              Lead Pipeline Distribution
            </h3>
            <p className="text-xs text-slate-400">Active breakdown across conversion stages</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.statusDistribution}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} />
                <YAxis dataKey="status" type="category" stroke="#94a3b8" fontSize={11} width={110} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Leads Table & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Leads Table */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white">Recently Researched Leads</h3>
              <p className="text-xs text-slate-400">Click any business to inspect AI diagnosis & outreach</p>
            </div>
            <button
              onClick={onNavigateToCRM}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
            >
              <span>View All Leads</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentLeads.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-400">No leads recorded yet.</p>
              <button
                onClick={onOpenNewCampaign}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
              >
                Launch First Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Business</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Recommended Service</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {recentLeads.slice(0, 6).map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {lead.businessName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {lead.businessCategory}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {lead.city}, {lead.country}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700">
                          {lead.recommendedService}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono">{lead.leadScore}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getPriorityBadge(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLead(lead);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition text-[11px] font-medium"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Activity Stream */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-xl space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-400" />
              Live Activity Stream
            </h3>
            <p className="text-xs text-slate-400">Real pipeline actions & AI events</p>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No recent activity logs.</p>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-1 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span className="font-semibold text-indigo-400">{act.action}</span>
                    <span>
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {act.leadName && (
                    <div className="font-medium text-white text-xs truncate">{act.leadName}</div>
                  )}
                  <p className="text-slate-300 text-[11px] leading-relaxed">{act.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
