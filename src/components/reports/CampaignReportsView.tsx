import React, { useState } from 'react';
import {
  FileBarChart2,
  Download,
  Sparkles,
  Users,
  Globe,
  Mail,
  Trophy,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Campaign, Lead, CampaignReport } from '../../types/index.js';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

interface CampaignReportsViewProps {
  campaigns: Campaign[];
  leads: Lead[];
  onOpenNewCampaign: () => void;
}

export const CampaignReportsView: React.FC<CampaignReportsViewProps> = ({
  campaigns,
  leads,
  onOpenNewCampaign,
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?.id || ''
  );

  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
  const campaignLeads = activeCampaign
    ? leads.filter((l) => l.campaignId === activeCampaign.id)
    : leads;

  // Real report metrics
  const totalResearched = Math.max(activeCampaign?.targetCount || 0, campaignLeads.length);
  const identified = campaignLeads.length;
  const withWebsites = campaignLeads.filter((l) => l.website && l.website !== 'Not Available').length;
  const withEmails = campaignLeads.filter((l) => l.email && l.email !== 'Not Available').length;
  const highPriority = campaignLeads.filter((l) => l.priority === 'High').length;
  const messagesPrepared = campaignLeads.filter((l) => l.outreach?.emailSubject).length;
  const interested = campaignLeads.filter(
    (l) => l.status === 'Interested' || l.status === 'Negotiation' || l.status === 'Deal Won'
  ).length;
  const dealsWon = campaignLeads.filter((l) => l.status === 'Deal Won').length;
  const totalDealValue = campaignLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

  // Problem counts from real data
  const problemCounts: Record<string, number> = {};
  campaignLeads.forEach((lead) => {
    (lead.identifiedProblems || []).forEach((p) => {
      const clean = p.trim();
      if (clean) problemCounts[clean] = (problemCounts[clean] || 0) + 1;
    });
  });

  const chartProblems = Object.entries(problemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([problem, count]) => ({
      problem: problem.length > 32 ? problem.slice(0, 32) + '...' : problem,
      fullProblem: problem,
      count,
    }));

  const recommendedSteps = activeCampaign?.report?.recommendedNextSteps || [
    `Follow up promptly with the ${highPriority} High-Priority prospects within 48 hours.`,
    `Focus initial pitch hooks on mobile responsiveness and portfolio speed enhancements.`,
    `Provide a short 2-minute mockup or Loom audit preview for prospects with verified email addresses.`,
    `Position your ${activeCampaign?.services?.[0] || 'Website Redesign'} service as a direct client-acquisition funnel.`,
  ];

  const handleDownloadJsonReport = () => {
    const reportData = {
      campaignName: activeCampaign?.name,
      businessNiche: activeCampaign?.businessNiche,
      location: `${activeCampaign?.city}, ${activeCampaign?.country}`,
      metrics: {
        totalBusinessesResearched: totalResearched,
        successfullyIdentifiedLeads: identified,
        leadsWithWebsites: withWebsites,
        leadsWithPublicEmails: withEmails,
        highPriorityLeads: highPriority,
        messagesGenerated: messagesPrepared,
        interestedProspects: interested,
        dealsWon,
        totalPotentialDealValue: totalDealValue,
      },
      mostCommonProblems: chartProblems,
      recommendedNextSteps: recommendedSteps,
      exportedAt: new Date().toISOString(),
      leads: campaignLeads,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeCampaign?.name || 'campaign').replace(/[^a-zA-Z0-9_-]/g, '_')}_intelligence_report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    window.location.href = `/api/campaigns/${activeCampaign?.id}/export-csv`;
  };

  if (!activeCampaign) {
    return (
      <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
        <FileBarChart2 className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-sm text-slate-400">No campaigns launched yet.</p>
        <button
          onClick={onOpenNewCampaign}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
        >
          Start First Campaign
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Campaign Selector & Export Toolbar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileBarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Campaign Intelligence & Executive Report</h2>
            <p className="text-xs text-slate-400">Deep performance analysis & strategic agency recommendations</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadJsonReport}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON Report</span>
          </button>
        </div>
      </div>

      {/* Campaign Overview Banner */}
      <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {activeCampaign.businessNiche} • {activeCampaign.city}, {activeCampaign.country}
          </span>
          <span className="text-xs text-slate-400">
            Launched on {new Date(activeCampaign.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h3 className="text-xl font-extrabold text-white">{activeCampaign.name}</h3>
        <div className="flex flex-wrap gap-2 pt-1">
          {activeCampaign.services.map((srv) => (
            <span
              key={srv}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium"
            >
              {srv}
            </span>
          ))}
        </div>
      </div>

      {/* 9 Executive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Businesses Researched</span>
          <div className="text-2xl font-black text-white font-mono">{totalResearched}</div>
          <span className="text-[10px] text-slate-500">Google Grounding target</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Identified Leads</span>
          <div className="text-2xl font-black text-white font-mono text-indigo-400">{identified}</div>
          <span className="text-[10px] text-slate-500">Verified operating</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Leads With Websites</span>
          <div className="text-2xl font-black text-white font-mono text-blue-400">{withWebsites}</div>
          <span className="text-[10px] text-slate-500">Active domains</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Public Emails Found</span>
          <div className="text-2xl font-black text-white font-mono text-sky-400">{withEmails}</div>
          <span className="text-[10px] text-slate-500">Direct contact ready</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">High Priority Leads</span>
          <div className="text-2xl font-black text-white font-mono text-emerald-400">{highPriority}</div>
          <span className="text-[10px] text-slate-500">Score ≥ 75/100</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Outreach Pitches Ready</span>
          <div className="text-2xl font-black text-white font-mono text-violet-400">{messagesPrepared}</div>
          <span className="text-[10px] text-slate-500">Cold emails & DMs</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Interested Prospects</span>
          <div className="text-2xl font-black text-white font-mono text-emerald-400">{interested}</div>
          <span className="text-[10px] text-slate-500">Active discovery</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-medium">Deals Won</span>
          <div className="text-2xl font-black text-white font-mono text-amber-400">{dealsWon}</div>
          <span className="text-[10px] text-slate-500">Contracts signed</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 font-medium">Potential Pipeline Value</span>
          <div className="text-2xl font-black text-white font-mono text-amber-400">
            ${totalDealValue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">Summed project value</span>
        </div>
      </div>

      {/* Visual Chart & AI Strategic Advisory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Common Problems Chart */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Most Common Business Problems Identified
            </h4>
            <p className="text-xs text-slate-400">Top audit findings across researched prospects</p>
          </div>

          {chartProblems.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No problems aggregated yet.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartProblems} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} />
                  <YAxis dataKey="problem" type="category" stroke="#94a3b8" fontSize={11} width={150} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* AI Recommended Next Steps */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-4">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-400" />
              AI Strategic Recommendations & Next Steps
            </h4>
            <p className="text-xs text-slate-400">Actionable growth tactics to convert this campaign</p>
          </div>

          <div className="space-y-3">
            {recommendedSteps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-xs">
                  {idx + 1}
                </div>
                <p className="leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
