import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Sparkles,
  Copy,
  Check,
  Send,
  RefreshCw,
  Trash2,
  DollarSign,
  AlertTriangle,
  Layers,
  FileText,
  Clock,
  ShieldCheck,
  Edit3,
  MessageSquare,
  Linkedin,
} from 'lucide-react';
import { Lead, LeadStatus, Priority } from '../../types/index.js';

interface LeadProfileModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => Promise<Lead | void>;
  onDeleteLead: (id: string) => Promise<void>;
  onGenerateOutreach: (id: string, prompt?: string) => Promise<void>;
  onReResearch: (id: string) => Promise<void>;
}

export const LeadProfileModal: React.FC<LeadProfileModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
  onDeleteLead,
  onGenerateOutreach,
  onReResearch,
}) => {
  if (!isOpen || !lead) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'outreach' | 'notes'>('profile');
  const [outreachFormat, setOutreachFormat] = useState<'email' | 'linkedin' | 'short' | 'followup'>('email');

  // Editable local state
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [dealValue, setDealValue] = useState<number>(lead.dealValue || 0);
  const [followUpDate, setFollowUpDate] = useState<string>(lead.followUpDate || '');
  const [notes, setNotes] = useState<string>(lead.notes || '');

  // Custom outreach prompt & editing
  const [isEditingOutreach, setIsEditingOutreach] = useState(false);
  const [editedEmailSubject, setEditedEmailSubject] = useState(lead.outreach?.emailSubject || '');
  const [editedEmailBody, setEditedEmailBody] = useState(lead.outreach?.emailBody || '');
  const [customOutreachPrompt, setCustomOutreachPrompt] = useState('');

  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReauditing, setIsReauditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const allStatuses: LeadStatus[] = [
    'New',
    'Researched',
    'Message Prepared',
    'Contacted',
    'Interested',
    'Follow-up Required',
    'Negotiation',
    'Deal Won',
    'Deal Lost',
    'Not Interested',
  ];

  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      await onUpdateLead(lead.id, {
        status,
        dealValue,
        followUpDate,
        notes,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCurrentMessage = () => {
    let textToCopy = '';
    if (outreachFormat === 'email') {
      textToCopy = `Subject: ${editedEmailSubject || lead.outreach?.emailSubject}\n\n${editedEmailBody || lead.outreach?.emailBody}`;
    } else if (outreachFormat === 'linkedin') {
      textToCopy = lead.outreach?.linkedInMessage || '';
    } else if (outreachFormat === 'short') {
      textToCopy = lead.outreach?.shortContactMessage || '';
    } else {
      textToCopy = lead.outreach?.followUpMessage || '';
    }

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSaveEditedOutreach = async () => {
    setIsSaving(true);
    try {
      await onUpdateLead(lead.id, {
        outreach: {
          ...lead.outreach,
          emailSubject: editedEmailSubject,
          emailBody: editedEmailBody,
        },
      });
      setIsEditingOutreach(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsSent = async () => {
    setIsSaving(true);
    try {
      setStatus('Contacted');
      await onUpdateLead(lead.id, {
        status: 'Contacted',
        lastContactedAt: new Date().toISOString(),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateOutreach = async () => {
    setIsGenerating(true);
    try {
      await onGenerateOutreach(lead.id, customOutreachPrompt);
      setCustomOutreachPrompt('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReAudit = async () => {
    setIsReauditing(true);
    try {
      await onReResearch(lead.id);
    } finally {
      setIsReauditing(false);
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Medium':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Low':
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                {lead.businessName}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getPriorityColor(lead.priority)}`}>
                {lead.priority} Priority
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Score: {lead.leadScore}/100
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {lead.city}, {lead.country}
              </span>
              <span>•</span>
              <span className="text-slate-300">{lead.businessCategory}</span>
              {lead.website && lead.website !== 'Not Available' && (
                <>
                  <span>•</span>
                  <a
                    href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReAudit}
              disabled={isReauditing}
              title="Re-analyze with AI"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isReauditing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/40 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Business Research & Scoring
          </button>
          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'outreach'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Personalized Outreach ({lead.outreach ? 'Ready' : 'Draft'})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'notes'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            CRM Status & Pipeline Notes
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Quick Contact & Verification Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-400" />
                    Public Business Email
                  </span>
                  <div className="font-medium text-white truncate">
                    {lead.email && lead.email !== 'Not Available' ? (
                      <a href={`mailto:${lead.email}`} className="hover:underline text-sky-300">
                        {lead.email}
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">Not publicly visible</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Public Business Phone
                  </span>
                  <div className="font-medium text-white">
                    {lead.phone && lead.phone !== 'Not Available' ? (
                      <a href={`tel:${lead.phone}`} className="hover:underline text-emerald-300">
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">Not Available</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Research Source & Verification
                  </span>
                  <div className="font-medium text-slate-300 truncate text-[11px]">
                    {lead.researchSource || 'Google Search Grounding verified'}
                  </div>
                </div>
              </div>

              {/* Recommended Service & Transparent Score Breakdown */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                        Recommended Agency Service
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-indigo-400" />
                      {lead.recommendedService}
                    </div>
                  </div>

                  <div className="sm:text-right space-y-0.5">
                    <span className="text-xs text-slate-400">Overall Lead Score</span>
                    <div className="text-2xl font-black text-white font-mono flex items-center sm:justify-end gap-1.5">
                      <span className="text-indigo-400">{lead.leadScore}</span>
                      <span className="text-slate-600 text-sm font-normal">/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Transparent 5-Factor Scoring */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Transparent Scoring Factor Breakdown
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Website Modernization</div>
                      <div className="font-bold text-white font-mono mt-1">
                        {lead.scoreBreakdown?.websiteOpportunity || 20} <span className="text-slate-600">/ 30</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Branding Upgrade</div>
                      <div className="font-bold text-white font-mono mt-1">
                        {lead.scoreBreakdown?.brandingOpportunity || 15} <span className="text-slate-600">/ 20</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Marketing & Funnel</div>
                      <div className="font-bold text-white font-mono mt-1">
                        {lead.scoreBreakdown?.marketingOpportunity || 15} <span className="text-slate-600">/ 20</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Service Relevance</div>
                      <div className="font-bold text-white font-mono mt-1">
                        {lead.scoreBreakdown?.serviceRelevance || 16} <span className="text-slate-600">/ 20</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Info Completeness</div>
                      <div className="font-bold text-white font-mono mt-1">
                        {lead.scoreBreakdown?.informationCompleteness || 8} <span className="text-slate-600">/ 10</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic bg-indigo-950/20 p-3 rounded-lg border border-indigo-500/20 leading-relaxed">
                  <span className="font-semibold text-indigo-300 not-italic">Scoring Rationale: </span>
                  {lead.scoreReason}
                </p>
              </div>

              {/* Identified Business Problems */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Identified Business Problems & Growth Opportunities
                </h3>
                <div className="space-y-2">
                  {lead.identifiedProblems && lead.identifiedProblems.length > 0 ? (
                    lead.identifiedProblems.map((prob, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{prob}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No specific problems flagged.</p>
                  )}
                </div>
              </div>

              {/* Deep Online Presence Assessments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white">Website Quality Assessment</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lead.websiteQualityAssessment || 'Evaluated for UX and responsive design.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white">Branding Assessment</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lead.brandingAssessment || 'Evaluated for brand identity and market perception.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white">Marketing Opportunity</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {lead.marketingOpportunity || 'Strong inbound positioning upside.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'outreach' && (
            <div className="space-y-5">
              {/* Outreach Format Selector */}
              <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
                <button
                  type="button"
                  onClick={() => setOutreachFormat('email')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachFormat === 'email'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Cold Email Pitch</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachFormat('linkedin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachFormat === 'linkedin'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn Outreach</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachFormat('short')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachFormat === 'short'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Website Contact Form / DM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachFormat('followup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    outreachFormat === 'followup'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Follow-up (Day 3-5)</span>
                </button>
              </div>

              {/* Message Box */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                {outreachFormat === 'email' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Subject Line
                      </label>
                      {isEditingOutreach ? (
                        <input
                          type="text"
                          value={editedEmailSubject}
                          onChange={(e) => setEditedEmailSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <div className="font-semibold text-white text-sm p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                          {lead.outreach?.emailSubject || 'Drafting subject...'}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Email Body
                      </label>
                      {isEditingOutreach ? (
                        <textarea
                          rows={10}
                          value={editedEmailBody}
                          onChange={(e) => setEditedEmailBody(e.target.value)}
                          className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed font-sans focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {lead.outreach?.emailBody || 'No email body generated yet.'}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {outreachFormat === 'linkedin' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      LinkedIn Connection Pitch
                    </label>
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {lead.outreach?.linkedInMessage || 'No LinkedIn message prepared yet.'}
                    </div>
                  </div>
                )}

                {outreachFormat === 'short' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Short Contact Form Message / Instagram DM
                    </label>
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {lead.outreach?.shortContactMessage || 'No short message prepared yet.'}
                    </div>
                  </div>
                )}

                {outreachFormat === 'followup' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Strategic Follow-up Note (Day 3-5)
                    </label>
                    <div className="p-4 rounded-lg bg-slate-900 border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {lead.outreach?.followUpMessage || 'No follow-up message prepared yet.'}
                    </div>
                  </div>
                )}

                {/* Outreach Action Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {outreachFormat === 'email' && (
                      <>
                        {isEditingOutreach ? (
                          <button
                            onClick={handleSaveEditedOutreach}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                          >
                            Save Edits
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsEditingOutreach(true)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Message</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={handleCopyCurrentMessage}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead.email && lead.email !== 'Not Available' && (
                      <a
                        href={`mailto:${lead.email}?subject=${encodeURIComponent(
                          lead.outreach?.emailSubject || ''
                        )}&body=${encodeURIComponent(lead.outreach?.emailBody || '')}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Open in Email App</span>
                      </a>
                    )}

                    <button
                      onClick={handleMarkAsSent}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Mark as Sent</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom AI Regeneration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Regenerate with Custom AI Prompt
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customOutreachPrompt}
                    onChange={(e) => setCustomOutreachPrompt(e.target.value)}
                    placeholder="e.g. Focus on their slow mobile portfolio; Make it punchy under 100 words; Mention SEO audits..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleRegenerateOutreach}
                    disabled={isGenerating}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-5">
              {/* Status and Pipeline Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Lead Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  >
                    {allStatuses.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Expected Deal Value ($)</label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="number"
                      value={dealValue}
                      onChange={(e) => setDealValue(Number(e.target.value))}
                      placeholder="e.g. 5000"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Private CRM Notes */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Private CRM Notes</span>
                  <span className="text-[11px] text-slate-500">Auto-synced with Google Sheets</span>
                </label>
                <textarea
                  rows={6}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record call logs, client objections, project requirements, budget discussions..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-400 font-medium">Permanently delete this lead?</span>
                      <button
                        onClick={async () => {
                          await onDeleteLead(lead.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                      >
                        Yes, Delete
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Lead</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20"
                >
                  {isSaving ? 'Saving...' : 'Save Pipeline Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
