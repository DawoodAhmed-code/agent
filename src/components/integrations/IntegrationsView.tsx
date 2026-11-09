import React, { useState } from 'react';
import {
  Table,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Database,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Save,
  Layers,
  Globe,
  Calendar,
  Lock,
} from 'lucide-react';
import { GoogleSheetsConfig, UserProfile, ServiceType } from '../../types/index.js';

interface IntegrationsViewProps {
  sheetsConfig: GoogleSheetsConfig;
  user: UserProfile | null;
  onUpdateSheetsConfig: (config: Partial<GoogleSheetsConfig>) => Promise<void>;
  onSyncSheets: () => Promise<void>;
  onExportCsv: () => void;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isSyncing: boolean;
}

const REQUIRED_25_COLUMNS = [
  'Lead ID',
  'Date',
  'Campaign Name',
  'Business Name',
  'Country',
  'City',
  'Business Niche',
  'Website',
  'Email',
  'Phone',
  'Website Problems',
  'Branding Problems',
  'Marketing Opportunity',
  'Recommended Service',
  'Lead Score',
  'Priority',
  'Outreach Subject',
  'Outreach Message',
  'Lead Status',
  'Interested Status',
  'Deal Status',
  'Deal Value',
  'Follow-up Date',
  'Notes',
  'Research Source',
];

const ALL_SERVICES: ServiceType[] = [
  'Professional Website Development',
  'Website Redesign',
  'UI/UX Design',
  'Brand Advertising',
  'Digital Marketing',
  'Business Branding',
];

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  sheetsConfig,
  user,
  onUpdateSheetsConfig,
  onSyncSheets,
  onExportCsv,
  onUpdateProfile,
  isSyncing,
}) => {
  // Webhook / Sheet input
  const [webhookUrl, setWebhookUrl] = useState((sheetsConfig as any).webhookUrl || '');
  const [spreadsheetId, setSpreadsheetId] = useState(sheetsConfig.spreadsheetId || '');
  const [isSavingSheets, setIsSavingSheets] = useState(false);
  const [sheetSaveMessage, setSheetSaveMessage] = useState<string | null>(null);

  // Profile / Agency form
  const [name, setName] = useState(user?.name || 'Dawood Ahmed');
  const [agencyName, setAgencyName] = useState(user?.agencyName || 'Apex Web & Digital Growth');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolioUrl || 'https://apexwebstudios.agency');
  const [bookingUrl, setBookingUrl] = useState(user?.bookingUrl || 'https://calendly.com/apex-growth/discovery-call');
  const [signature, setSignature] = useState(
    user?.signature ||
      'Best regards,\nDawood Ahmed | Lead Strategist\nApex Web & Digital Growth\nhttps://apexwebstudios.agency'
  );
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>(
    user?.servicesOffered || ALL_SERVICES
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Supabase Status
  const [supabaseUrl, setSupabaseUrl] = useState(process.env.SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  const handleSaveSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSheets(true);
    setSheetSaveMessage(null);
    try {
      await onUpdateSheetsConfig({
        spreadsheetId,
        connected: Boolean(webhookUrl || spreadsheetId),
        ...({ webhookUrl } as any),
      });
      setSheetSaveMessage('Google Sheets connection settings saved successfully!');
    } catch (err: any) {
      setSheetSaveMessage('Failed to update Google Sheets settings.');
    } finally {
      setIsSavingSheets(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await onUpdateProfile({
        name,
        agencyName,
        portfolioUrl,
        bookingUrl,
        signature,
        servicesOffered: selectedServices,
      });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleService = (srv: ServiceType) => {
    if (selectedServices.includes(srv)) {
      if (selectedServices.length === 1) return;
      setSelectedServices(selectedServices.filter((s) => s !== srv));
    } else {
      setSelectedServices([...selectedServices, srv]);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Google Sheets Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Google Sheets Integration</h3>
                {sheetsConfig.connected ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    CSV Ready / Standalone Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Synchronize all leads with 25 standard CRM columns, update pipeline statuses, and export to CSV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onExportCsv}
              className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Download 25-Col CSV</span>
            </button>
            <button
              onClick={onSyncSheets}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync All Leads Now</span>
            </button>
          </div>
        </div>

        {/* Sync Settings Form */}
        <form onSubmit={handleSaveSheets} className="space-y-4 max-w-3xl">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Google Apps Script Webhook URL (For Direct Automated Sync)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Paste your Google Apps Script Webhook deployment URL to automatically append and update rows directly in your Google Sheet. If left blank, you can seamlessly use 1-click 25-column CSV export anytime.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Google Spreadsheet ID or URL</label>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {sheetSaveMessage && (
            <p className="text-xs text-emerald-400 font-medium">{sheetSaveMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSavingSheets}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
          >
            {isSavingSheets ? 'Saving...' : 'Save Sheets Configuration'}
          </button>
        </form>

        {/* 25 Column Schema Verification Grid */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verified 25-Column Spreadsheet Schema
            </span>
            <span className="text-[11px] text-slate-400">Strictly mapped & formatted</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REQUIRED_25_COLUMNS.map((col, idx) => (
              <span
                key={col}
                className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono"
              >
                <span className="text-indigo-400 font-bold mr-1">{idx + 1}.</span>
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Database & Supabase PostgreSQL Architecture */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Database & Supabase PostgreSQL Storage</h3>
            <p className="text-xs text-slate-400">Persistent user campaigns, leads CRM, and activity history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Primary Storage Engine</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Active & Persistent
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Atomic file-persisted JSON relational database stored in <code className="text-indigo-300">data/leadpilot.json</code>. Survives server reboots, retains full lead scoring breakdowns, activities, and prevents duplicates.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">Supabase PostgreSQL Bridge</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                Optional Remote RLS
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              To connect external Supabase credentials, supply <code className="text-indigo-300">SUPABASE_URL</code> and <code className="text-indigo-300">SUPABASE_KEY</code> in environment variables or configuration.
            </p>
          </div>
        </div>
      </div>

      {/* Service Provider Agency Profile */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Agency & Service Provider Profile</h3>
              <p className="text-xs text-slate-400">
                Used by the AI Outreach Generator to inject your exact credentials and portfolio into personalized messages
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dawood Ahmed"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Agency / Brand Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="e.g. Apex Web & Digital Growth"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Portfolio Website URL</label>
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://apexwebstudios.agency"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Booking / Calendly Link</label>
              <input
                type="url"
                value={bookingUrl}
                onChange={(e) => setBookingUrl(e.target.value)}
                placeholder="https://calendly.com/your-agency/discovery"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Services Offered */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Services You Provide (Checked by default)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_SERVICES.map((srv) => {
                const isSelected = selectedServices.includes(srv);
                return (
                  <button
                    type="button"
                    key={srv}
                    onClick={() => toggleService(srv)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="truncate pr-1">{srv}</span>
                    <span className="text-indigo-400 font-bold">{isSelected ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email Signature */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Default Cold Email Signature</label>
            <textarea
              rows={4}
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSaveSuccess && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Profile changes saved!
              </span>
            )}
            <div className="ml-auto">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingProfile ? 'Saving...' : 'Save Agency Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
