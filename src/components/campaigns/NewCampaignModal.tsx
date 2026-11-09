import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Globe,
  MapPin,
  Briefcase,
  Layers,
  CheckSquare,
  Sliders,
  Languages,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ServiceType, Campaign } from '../../types/index.js';

interface NewCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: (campaign: Campaign, newLeadsCount: number) => void;
  onRunCampaign: (campaignId: string) => Promise<{ success: boolean; leads: any[]; campaign: Campaign }>;
}

const AVAILABLE_SERVICES: ServiceType[] = [
  'Professional Website Development',
  'Website Redesign',
  'UI/UX Design',
  'Brand Advertising',
  'Digital Marketing',
  'Business Branding',
];

const PRESET_NICHES = [
  'Architecture Firms',
  'Dental & Cosmetic Clinics',
  'Boutique Law Firms',
  'High-End Restaurants & Hospitality',
  'Luxury Real Estate Agencies',
  'Eco Roofing & Solar Installers',
  'Fitness Studios & Gyms',
  'Accounting & Financial Advisors',
  'Custom Home Builders',
];

const PRESET_CITIES = [
  { city: 'Manchester', country: 'United Kingdom' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Austin', country: 'United States' },
  { city: 'Chicago', country: 'United States' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Melbourne', country: 'Australia' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Berlin', country: 'Germany' },
  { city: 'Dubai', country: 'United Arab Emirates' },
];

export const NewCampaignModal: React.FC<NewCampaignModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
  onRunCampaign,
}) => {
  const [name, setName] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [city, setCity] = useState('Manchester');
  const [businessNiche, setBusinessNiche] = useState('Architecture Firms');
  const [targetCount, setTargetCount] = useState<number>(5);
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([
    'Website Redesign',
    'Brand Advertising',
    'UI/UX Design',
  ]);
  const [targetBusinessSize, setTargetBusinessSize] = useState('Small to Medium (5-25 staff)');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [minWebsiteQuality, setMinWebsiteQuality] = useState('Moderate (Opportunity for upgrade)');

  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleService = (service: ServiceType) => {
    if (selectedServices.includes(service)) {
      if (selectedServices.length === 1) return; // keep at least 1
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handlePresetSelect = (preset: { city: string; country: string }) => {
    setCity(preset.city);
    setCountry(preset.country);
  };

  const handleStartCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsRunning(true);
    setActiveStep(1);

    const campaignName = name.trim() || `${businessNiche} in ${city}, ${country}`;

    try {
      // Create campaign record
      const createRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          country,
          city,
          businessNiche,
          targetCount,
          services: selectedServices,
          targetBusinessSize,
          preferredLanguage,
          minWebsiteQuality,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create campaign record');
      }

      const campaign = await createRes.json();

      // Step simulation for transparency
      setActiveStep(2); // Google Search Grounding Discovery
      const timer1 = setTimeout(() => setActiveStep(3), 3500); // Website & Brand Audit
      const timer2 = setTimeout(() => setActiveStep(4), 6500); // Lead Scoring & Outreach

      // Execute AI campaign pipeline
      const runResult = await onRunCampaign(campaign.id);

      clearTimeout(timer1);
      clearTimeout(timer2);
      setActiveStep(5); // Complete

      setTimeout(() => {
        setIsRunning(false);
        onCampaignCreated(runResult.campaign, runResult.leads?.length || 0);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setIsRunning(false);
      setErrorMessage(err.message || 'An error occurred during campaign execution.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Launch AI Lead Generation Campaign</h2>
              <p className="text-xs text-slate-400">Target live operating businesses with search grounding & AI auditing</p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Running Pipeline Progress View */}
        {isRunning ? (
          <div className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">AI Agents at Work</h3>
              <p className="text-xs text-slate-400">
                Finding and analyzing real businesses for <span className="text-indigo-400 font-medium">{businessNiche}</span> in <span className="text-indigo-400 font-medium">{city}, {country}</span>
              </p>
            </div>

            {/* Stepper */}
            <div className="space-y-3 max-w-md mx-auto text-left py-2">
              {[
                { step: 1, title: 'Campaign Planner Agent initialized' },
                { step: 2, title: 'Discovery Agent: Searching Google Grounding for real businesses...' },
                { step: 3, title: 'Website & UX Agent: Analyzing mobile speeds, UX & problems...' },
                { step: 4, title: 'Lead Scoring & Outreach Agent: Calculating scores & drafting copy...' },
                { step: 5, title: 'Saving leads to CRM and synthesizing campaign report...' },
              ].map((item) => (
                <div key={item.step} className="flex items-center gap-3 text-xs">
                  {activeStep > item.step ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : activeStep === item.step ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                  )}
                  <span
                    className={`${
                      activeStep === item.step
                        ? 'text-white font-semibold'
                        : activeStep > item.step
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Google Search grounding queries are retrieving verified business data. Please allow 15-25 seconds...
            </p>
          </div>
        ) : (
          <form onSubmit={handleStartCampaign} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
                <div className="flex-1">
                  <p className="font-semibold text-rose-200">Campaign Execution Error</p>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Campaign Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Campaign Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. ${businessNiche} in ${city}`}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* Target Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  City or Specific Area *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Manchester, Austin, Berlin"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Quick City Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400">Quick Global Hubs:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CITIES.map((p) => (
                  <button
                    key={p.city}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                      city === p.city && country === p.country
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {p.city}, {p.country === 'United Kingdom' ? 'UK' : p.country === 'United States' ? 'USA' : p.country}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Niche */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-violet-400" />
                Business Niche / Industry *
              </label>
              <input
                type="text"
                required
                value={businessNiche}
                onChange={(e) => setBusinessNiche(e.target.value)}
                placeholder="e.g. Architecture Firms, Dental Clinics, Luxury Realtors"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 transition"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_NICHES.slice(0, 5).map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => setBusinessNiche(niche)}
                    className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-slate-400 hover:text-indigo-300 border border-slate-800"
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            {/* Services to Offer */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  My Services to Offer (Multi-Select) *
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedServices.length} selected
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_SERVICES.map((srv) => {
                  const isChecked = selectedServices.includes(srv);
                  return (
                    <button
                      type="button"
                      key={srv}
                      onClick={() => toggleService(srv)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm shadow-indigo-500/10'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="truncate pr-1">{srv}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] ${
                          isChecked ? 'bg-indigo-500 text-white' : 'border border-slate-700'
                        }`}
                      >
                        {isChecked && '✓'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Campaign Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Leads to Find</label>
                <select
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value={5}>5 Leads (Fast preview)</option>
                  <option value={10}>10 Leads (Recommended)</option>
                  <option value={15}>15 Leads (Comprehensive)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Business Size</label>
                <select
                  value={targetBusinessSize}
                  onChange={(e) => setTargetBusinessSize(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="Small (1-10 staff)">Small (1-10 staff)</option>
                  <option value="Small to Medium (5-25 staff)">Small to Medium (5-25)</option>
                  <option value="Medium (25-100 staff)">Medium (25-100 staff)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Preferred Language</label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="German">German</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>
            </div>

            {/* Quality Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Website Quality / Opportunity</label>
              <select
                value={minWebsiteQuality}
                onChange={(e) => setMinWebsiteQuality(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Any / Needs Overhaul">Any / High opportunity for complete rebuild</option>
                <option value="Moderate (Opportunity for upgrade)">Moderate (Established brand, slow mobile / UX gaps)</option>
                <option value="High-End Practice">High-End Practice (Prestigious, ready for high-ticket ads & visual UX)</option>
              </select>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 active:scale-95 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Start Campaign</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
