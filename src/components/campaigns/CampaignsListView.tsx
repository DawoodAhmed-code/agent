import React from 'react';
import {
  Compass,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Layers,
  ArrowRight,
  Download,
  Trash2,
  Play,
  FileBarChart2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Campaign } from '../../types/index.js';

interface CampaignsListViewProps {
  campaigns: Campaign[];
  onOpenNewCampaign: () => void;
  onSelectCampaignForCRM: (campaignId: string) => void;
  onSelectCampaignForReport: (campaignId: string) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onRunCampaign: (campaignId: string) => Promise<any>;
}

export const CampaignsListView: React.FC<CampaignsListViewProps> = ({
  campaigns,
  onOpenNewCampaign,
  onSelectCampaignForCRM,
  onSelectCampaignForReport,
  onDeleteCampaign,
  onRunCampaign,
}) => {
  const [runningId, setRunningId] = React.useState<string | null>(null);

  const handleRun = async (id: string) => {
    setRunningId(id);
    try {
      await onRunCampaign(id);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Campaign Pipeline</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Targeted Lead Generation Campaigns
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Automated Google Search grounding and AI research across international markets and business niches.
          </p>
        </div>

        <button
          onClick={onOpenNewCampaign}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-500/20 transition active:scale-95 shrink-0"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>Launch New Campaign</span>
        </button>
      </div>

      {/* Campaign Cards Grid */}
      {campaigns.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <Compass className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No campaigns created yet</h3>
          <p className="text-xs text-slate-400">Launch your first search campaign to start discovering prospective clients.</p>
          <button
            onClick={onOpenNewCampaign}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
          >
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {campaigns.map((camp) => {
            const isCurrentlyRunning = runningId === camp.id;
            return (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        {camp.businessNiche}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          camp.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : camp.status === 'running'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {camp.status === 'completed' ? 'Completed' : camp.status === 'running' ? 'Active' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{camp.name}</h3>
                  </div>

                  <button
                    onClick={() => onDeleteCampaign(camp.id)}
                    title="Delete campaign"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-300 truncate">{camp.city}, {camp.country}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-slate-300 font-medium">
                      {camp.leadsFound || 0} leads discovered
                    </span>
                  </div>
                </div>

                {/* Offered Services Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {camp.services.map((srv) => (
                    <span
                      key={srv}
                      className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] font-medium border border-slate-800"
                    >
                      {srv}
                    </span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectCampaignForCRM(camp.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span>View Leads</span>
                    </button>
                    <button
                      onClick={() => onSelectCampaignForReport(camp.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <FileBarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Report</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleRun(camp.id)}
                    disabled={isCurrentlyRunning}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {isCurrentlyRunning ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{isCurrentlyRunning ? 'Searching...' : 'Run Pipeline'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
