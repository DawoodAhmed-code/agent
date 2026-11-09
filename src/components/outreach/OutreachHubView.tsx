import React, { useState } from 'react';
import {
  Send,
  Mail,
  Linkedin,
  MessageSquare,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Lead } from '../../types/index.js';

interface OutreachHubViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<Lead | void>;
  onGenerateOutreach: (id: string, prompt?: string) => Promise<void>;
}

export const OutreachHubView: React.FC<OutreachHubViewProps> = ({
  leads,
  onSelectLead,
  onUpdateLead,
  onGenerateOutreach,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [outreachType, setOutreachType] = useState<'email' | 'linkedin' | 'short' | 'followup'>('email');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSent, setFilterSent] = useState<'all' | 'uncontacted' | 'contacted'>('all');

  const filteredLeads = leads.filter((l) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        l.businessName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.recommendedService.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterSent === 'uncontacted') {
      return l.status !== 'Contacted' && l.status !== 'Interested' && l.status !== 'Deal Won';
    }
    if (filterSent === 'contacted') {
      return l.status === 'Contacted' || l.status === 'Interested' || l.status === 'Deal Won';
    }
    return true;
  });

  const activeLead = leads.find((l) => l.id === selectedLeadId) || filteredLeads[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkSent = async (lead: Lead) => {
    await onUpdateLead(lead.id, {
      status: 'Contacted',
      lastContactedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Personalized Cold Outreach Generator</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          High-Converting Client Pitches & Follow-ups
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
          Each outreach message is customized using evidence-based observations from your research findings. No generic templates or false claims. Review, copy, or launch directly.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 space-y-3">
          <Send className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm text-slate-400">No leads researched yet. Start a campaign to generate outreach.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Lead List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter prospects..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-1.5 text-[11px]">
                <button
                  onClick={() => setFilterSent('all')}
                  className={`flex-1 py-1 rounded-lg font-medium transition ${
                    filterSent === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  All ({leads.length})
                </button>
                <button
                  onClick={() => setFilterSent('uncontacted')}
                  className={`flex-1 py-1 rounded-lg font-medium transition ${
                    filterSent === 'uncontacted'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Unsent
                </button>
                <button
                  onClick={() => setFilterSent('contacted')}
                  className={`flex-1 py-1 rounded-lg font-medium transition ${
                    filterSent === 'contacted'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Contacted
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredLeads.map((lead) => {
                const isSelected = activeLead?.id === lead.id;
                const isContacted = lead.status === 'Contacted' || lead.status === 'Interested' || lead.status === 'Deal Won';

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLeadId(lead.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs truncate">{lead.businessName}</h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {lead.city}, {lead.country}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {lead.leadScore} pts
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 truncate max-w-[170px]">
                        Rec: <span className="text-slate-200">{lead.recommendedService}</span>
                      </span>
                      {isContacted ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Sent
                        </span>
                      ) : (
                        <span className="text-sky-400 font-medium">Ready</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Lead Outreach Inspector */}
          {activeLead ? (
            <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-white">{activeLead.businessName}</h3>
                  <p className="text-xs text-slate-400">
                    Recommended Pitch: <span className="text-indigo-400 font-semibold">{activeLead.recommendedService}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectLead(activeLead)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    View Lead Profile
                  </button>
                </div>
              </div>

              {/* Outreach Format Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setOutreachType('email')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachType === 'email' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Cold Email</span>
                </button>
                <button
                  onClick={() => setOutreachType('linkedin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachType === 'linkedin' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn Note</span>
                </button>
                <button
                  onClick={() => setOutreachType('short')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachType === 'short' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Short DM / Form</span>
                </button>
                <button
                  onClick={() => setOutreachType('followup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachType === 'followup' ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Follow-Up</span>
                </button>
              </div>

              {/* Outreach Content Display */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                {outreachType === 'email' && (
                  <>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</span>
                      <div className="font-semibold text-white text-xs p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                        {activeLead.outreach?.emailSubject || 'Drafting subject...'}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Body</span>
                      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                        {activeLead.outreach?.emailBody || 'No email generated yet.'}
                      </div>
                    </div>
                  </>
                )}

                {outreachType === 'linkedin' && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LinkedIn Message</span>
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {activeLead.outreach?.linkedInMessage || 'No LinkedIn message generated.'}
                    </div>
                  </div>
                )}

                {outreachType === 'short' && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Short DM</span>
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {activeLead.outreach?.shortContactMessage || 'No short message generated.'}
                    </div>
                  </div>
                )}

                {outreachType === 'followup' && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Follow-up Message</span>
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {activeLead.outreach?.followUpMessage || 'No follow-up message generated.'}
                    </div>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => {
                      let text = '';
                      if (outreachType === 'email') {
                        text = `Subject: ${activeLead.outreach?.emailSubject}\n\n${activeLead.outreach?.emailBody}`;
                      } else if (outreachType === 'linkedin') {
                        text = activeLead.outreach?.linkedInMessage || '';
                      } else if (outreachType === 'short') {
                        text = activeLead.outreach?.shortContactMessage || '';
                      } else {
                        text = activeLead.outreach?.followUpMessage || '';
                      }
                      handleCopy(text, activeLead.id);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-2 transition"
                  >
                    {copiedId === activeLead.id ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span>{copiedId === activeLead.id ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {activeLead.email && activeLead.email !== 'Not Available' && (
                      <a
                        href={`mailto:${activeLead.email}?subject=${encodeURIComponent(
                          activeLead.outreach?.emailSubject || ''
                        )}&body=${encodeURIComponent(activeLead.outreach?.emailBody || '')}`}
                        className="px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Open in Mail</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleMarkSent(activeLead)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Mark as Sent</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
