import React from 'react';
import { Lead, LeadStatus, Priority } from '../../types/index.js';
import {
  ExternalLink,
  Mail,
  MapPin,
  Sparkles,
  DollarSign,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

interface LeadKanbanBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateStatus: (leadId: string, newStatus: LeadStatus) => void;
}

const KANBAN_COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: 'New', label: 'New Discovered', color: 'border-slate-700 bg-slate-900/60' },
  { status: 'Researched', label: 'Researched & Scored', color: 'border-blue-500/40 bg-blue-950/20' },
  { status: 'Message Prepared', label: 'Message Ready', color: 'border-sky-500/40 bg-sky-950/20' },
  { status: 'Contacted', label: 'Contacted', color: 'border-indigo-500/40 bg-indigo-950/20' },
  { status: 'Interested', label: 'Interested', color: 'border-emerald-500/40 bg-emerald-950/20' },
  { status: 'Negotiation', label: 'Negotiation', color: 'border-purple-500/40 bg-purple-950/20' },
  { status: 'Deal Won', label: 'Deal Won 🏆', color: 'border-amber-500/40 bg-amber-950/20' },
];

export const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({
  leads,
  onSelectLead,
  onUpdateStatus,
}) => {
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

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {KANBAN_COLUMNS.map((col) => {
        const columnLeads = leads.filter((l) => l.status === col.status);
        const columnValue = columnLeads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

        return (
          <div
            key={col.status}
            className={`w-72 shrink-0 rounded-2xl border ${col.color} p-3 flex flex-col max-h-[750px] shadow-lg`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-800/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">{col.label}</h4>
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                    {columnLeads.length}
                  </span>
                </div>
                {columnValue > 0 && (
                  <span className="text-[10px] text-amber-400 font-semibold">
                    ${columnValue.toLocaleString()} pipeline
                  </span>
                )}
              </div>
            </div>

            {/* Column Cards */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
              {columnLeads.length === 0 ? (
                <div className="py-8 text-center text-[11px] text-slate-500 border border-dashed border-slate-800/80 rounded-xl">
                  No leads in {col.label}
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all shadow-md group space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {lead.businessName}
                      </h5>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${getPriorityBadge(lead.priority)}`}>
                        {lead.leadScore}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{lead.city}, {lead.country}</span>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-300 line-clamp-2">
                      <span className="text-indigo-400 font-semibold">Rec: </span>
                      {lead.recommendedService}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                      {lead.dealValue ? (
                        <span className="text-amber-400 font-bold flex items-center">
                          ${lead.dealValue.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-500">Unvalued</span>
                      )}

                      <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform font-medium flex items-center gap-0.5">
                        Inspect
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
