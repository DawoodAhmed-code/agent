import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Table as TableIcon,
  Kanban,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Mail,
  Phone,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Lead, Campaign, LeadStatus, Priority } from '../../types/index.js';
import { LeadKanbanBoard } from './LeadKanbanBoard.js';

interface LeadCRMViewProps {
  leads: Lead[];
  campaigns: Campaign[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (id: string, status: LeadStatus) => void;
  onExportCsv: (leadIds?: string[]) => void;
  onBulkDelete: (leadIds: string[]) => Promise<void>;
  onOpenNewCampaign: () => void;
  onSyncSheets: () => void;
  isSyncingSheets: boolean;
}

export const LeadCRMView: React.FC<LeadCRMViewProps> = ({
  leads,
  campaigns,
  onSelectLead,
  onUpdateLeadStatus,
  onExportCsv,
  onBulkDelete,
  onOpenNewCampaign,
  onSyncSheets,
  isSyncingSheets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'date' | 'dealValue' | 'name'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter and sort leads locally for instant reactive UI
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.businessName.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.country.toLowerCase().includes(q) ||
          l.businessCategory.toLowerCase().includes(q) ||
          l.website.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.recommendedService && l.recommendedService.toLowerCase().includes(q))
      );
    }

    if (selectedCampaignId !== 'all') {
      result = result.filter((l) => l.campaignId === selectedCampaignId);
    }

    if (selectedStatus !== 'all') {
      result = result.filter((l) => l.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      result = result.filter((l) => l.priority === selectedPriority);
    }

    if (selectedService !== 'all') {
      result = result.filter((l) => l.recommendedService === selectedService);
    }

    // Sort
    const order = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'score') {
      result.sort((a, b) => (a.leadScore - b.leadScore) * order);
    } else if (sortBy === 'dealValue') {
      result.sort((a, b) => ((a.dealValue || 0) - (b.dealValue || 0)) * order);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.businessName.localeCompare(b.businessName) * order);
    } else {
      result.sort(
        (a, b) => (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * order
      );
    }

    return result;
  }, [
    leads,
    searchQuery,
    selectedCampaignId,
    selectedStatus,
    selectedPriority,
    selectedService,
    sortBy,
    sortOrder,
  ]);

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const handleToggleSelectLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedLeadIds.includes(id)) {
      setSelectedLeadIds(selectedLeadIds.filter((item) => item !== id));
    } else {
      setSelectedLeadIds([...selectedLeadIds, id]);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await onBulkDelete(selectedLeadIds);
      setSelectedLeadIds([]);
      setShowBulkDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

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
      case 'Deal Lost':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const uniqueServices = Array.from(new Set(leads.map((l) => l.recommendedService))).filter(Boolean);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Filter and Search Bar */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by business name, city, website, email, service..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Action buttons & View mode toggle */}
          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Kanban Board View"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Pipeline</span>
              </button>
            </div>

            {/* Google Sheets Sync */}
            <button
              onClick={onSyncSheets}
              disabled={isSyncingSheets}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Sync to Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingSheets ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Sheets</span>
            </button>

            {/* CSV Export */}
            <button
              onClick={() => onExportCsv(selectedLeadIds.length > 0 ? selectedLeadIds : undefined)}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Export 25-column CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Export CSV {selectedLeadIds.length > 0 ? `(${selectedLeadIds.length})` : `(${filteredLeads.length})`}
              </span>
            </button>

            {/* Bulk Delete */}
            {selectedLeadIds.length > 0 && (
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedLeadIds.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 border-t border-slate-800/80">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Campaign
            </label>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Lead Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="Researched">Researched</option>
              <option value="Message Prepared">Message Prepared</option>
              <option value="Contacted">Contacted</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up Required">Follow-up Required</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Deal Won">Deal Won</option>
              <option value="Deal Lost">Deal Lost</option>
              <option value="Not Interested">Not Interested</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Priorities</option>
              <option value="High">High (75-100)</option>
              <option value="Medium">Medium (50-74)</option>
              <option value="Low">Low (&lt;50)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Service
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Services</option>
              {uniqueServices.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Sort By
            </label>
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="score">Score</option>
                <option value="dealValue">Deal Value</option>
                <option value="date">Date Added</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Bulk Delete */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h4 className="text-base font-bold text-white">Confirm Bulk Deletion</h4>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete <span className="font-semibold text-rose-400">{selectedLeadIds.length}</span> selected leads? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-500/20"
              >
                {isDeleting ? 'Deleting...' : 'Delete Leads'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View: Kanban or Table */}
      {filteredLeads.length === 0 ? (
        <div className="py-16 text-center space-y-3 p-8 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-white">No leads match your filter criteria.</p>
          <p className="text-xs text-slate-400">Try adjusting your search keywords or start a new campaign.</p>
          <button
            onClick={onOpenNewCampaign}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Campaign</span>
          </button>
        </div>
      ) : viewMode === 'kanban' ? (
        <LeadKanbanBoard
          leads={filteredLeads}
          onSelectLead={onSelectLead}
          onUpdateStatus={onUpdateLeadStatus}
        />
      ) : (
        /* Table View */
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 w-8">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length}
                      onChange={handleToggleSelectAll}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Business</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Recommended Service</th>
                  <th className="py-3 px-3">Score & Priority</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Deal Value</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors group ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelectLead(lead.id, e as any)}
                          className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                          {lead.businessName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {lead.businessCategory}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-300">
                        <div className="flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{lead.city}, {lead.country}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5 text-[11px]">
                          {lead.website && lead.website !== 'Not Available' ? (
                            <a
                              href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[140px]"
                            >
                              <span>{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-500 italic">No website</span>
                          )}

                          {lead.email && lead.email !== 'Not Available' ? (
                            <div className="text-slate-400 truncate max-w-[140px]">{lead.email}</div>
                          ) : null}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 text-[11px] font-medium border border-slate-700 inline-block">
                          {lead.recommendedService}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-sm">{lead.leadScore}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${getPriorityBadge(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-semibold text-slate-200">
                        {lead.dealValue ? `$${lead.dealValue.toLocaleString()}` : '-'}
                      </td>

                      <td className="py-3.5 px-3 text-right">
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
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
