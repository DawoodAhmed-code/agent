import React, { useState } from 'react';
import {
  Bot,
  Cpu,
  Sparkles,
  Sliders,
  Play,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Globe,
  Zap,
  ShieldCheck,
  Search,
  Check,
  Layers,
  ArrowRight,
  Code2,
  MessageSquare,
  Wand2,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  AIAgentProfile,
  AgentModelSettings,
  AIModelName,
  ThinkingLevelSetting,
  ServiceType,
} from '../../types/index.js';

interface AIAgentStudioViewProps {
  agents: AIAgentProfile[];
  agentSettings: AgentModelSettings;
  onUpdateAgentSettings: (settings: Partial<AgentModelSettings>) => Promise<void>;
  onCreateAgent: (agent: Partial<AIAgentProfile>) => Promise<void>;
  onUpdateAgent: (id: string, updates: Partial<AIAgentProfile>) => Promise<void>;
  onDeleteAgent: (id: string) => Promise<void>;
  onTestPlayground: (payload: {
    model: string;
    systemPrompt: string;
    userPrompt: string;
    thinkingLevel?: string;
    useSearch?: boolean;
  }) => Promise<{ text: string; modelUsed: string; groundingChunks?: any[] }>;
}

const ALL_SERVICES: ServiceType[] = [
  'Professional Website Development',
  'Website Redesign',
  'UI/UX Design',
  'Brand Advertising',
  'Digital Marketing',
  'Business Branding',
];

export const AIAgentStudioView: React.FC<AIAgentStudioViewProps> = ({
  agents,
  agentSettings,
  onUpdateAgentSettings,
  onCreateAgent,
  onUpdateAgent,
  onDeleteAgent,
  onTestPlayground,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'pipeline' | 'playground'>('roster');

  // Create/Edit Agent Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const [agentName, setAgentName] = useState('');
  const [agentRole, setAgentRole] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [agentModel, setAgentModel] = useState<AIModelName>('gemini-3.8-flash');
  const [agentThinkingLevel, setAgentThinkingLevel] = useState<ThinkingLevelSetting>('MEDIUM');
  const [agentTone, setAgentTone] = useState('Consultative & Authoritative');
  const [agentOutreachStyle, setAgentOutreachStyle] = useState('Strategic Value-First Pitch');
  const [agentSystemPrompt, setAgentSystemPrompt] = useState('');
  const [agentSpecialties, setAgentSpecialties] = useState<ServiceType[]>([
    'Website Redesign',
    'UI/UX Design',
  ]);
  const [isSavingAgent, setIsSavingAgent] = useState(false);

  // Playground state
  const [selectedPlaygroundAgentId, setSelectedPlaygroundAgentId] = useState<string>(agents[0]?.id || '');
  const [playgroundModel, setPlaygroundModel] = useState<AIModelName>('gemini-3.8-flash');
  const [playgroundPrompt, setPlaygroundPrompt] = useState(
    'Audit this hypothetical scenario: A boutique architecture firm in Manchester has a stunning desktop site but takes 4.5 seconds to load on mobile and lacks a clear developer consultation booking funnel. Formulate a high-impact diagnosis and a 3-point redesign pitch.'
  );
  const [playgroundSystemPrompt, setPlaygroundSystemPrompt] = useState(
    'You are an elite Digital Agency Growth Director. Identify mobile UX bottlenecks and propose lucrative redesign packages.'
  );
  const [playgroundThinkingLevel, setPlaygroundThinkingLevel] = useState<ThinkingLevelSetting>('MEDIUM');
  const [playgroundUseSearch, setPlaygroundUseSearch] = useState(false);
  const [playgroundOutput, setPlaygroundOutput] = useState<string | null>(null);
  const [playgroundGrounding, setPlaygroundGrounding] = useState<any[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  const openCreateModal = () => {
    setEditingAgentId(null);
    setAgentName('');
    setAgentRole('');
    setAgentDescription('');
    setAgentModel('gemini-3.8-flash');
    setAgentThinkingLevel('MEDIUM');
    setAgentTone('Consultative & Authoritative');
    setAgentOutreachStyle('Strategic Value-First Pitch');
    setAgentSystemPrompt(
      'You are an expert commercial growth strategist. Pinpoint website friction, highlight unexploited revenue opportunities, and write polite, high-converting outreach.'
    );
    setAgentSpecialties(['Website Redesign', 'UI/UX Design']);
    setIsModalOpen(true);
  };

  const openEditModal = (agent: AIAgentProfile) => {
    setEditingAgentId(agent.id);
    setAgentName(agent.name);
    setAgentRole(agent.role);
    setAgentDescription(agent.description);
    setAgentModel(agent.model);
    setAgentThinkingLevel(agent.thinkingLevel);
    setAgentTone(agent.tone);
    setAgentOutreachStyle(agent.outreachStyle);
    setAgentSystemPrompt(agent.systemPrompt);
    setAgentSpecialties(agent.specialtyServices || ['Website Redesign']);
    setIsModalOpen(true);
  };

  const handleSaveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAgent(true);
    try {
      if (editingAgentId) {
        await onUpdateAgent(editingAgentId, {
          name: agentName,
          role: agentRole,
          description: agentDescription,
          model: agentModel,
          thinkingLevel: agentThinkingLevel,
          tone: agentTone,
          outreachStyle: agentOutreachStyle,
          systemPrompt: agentSystemPrompt,
          specialtyServices: agentSpecialties,
        });
      } else {
        await onCreateAgent({
          name: agentName,
          role: agentRole,
          description: agentDescription,
          model: agentModel,
          thinkingLevel: agentThinkingLevel,
          tone: agentTone,
          outreachStyle: agentOutreachStyle,
          systemPrompt: agentSystemPrompt,
          specialtyServices: agentSpecialties,
          isCustom: true,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSavingAgent(false);
    }
  };

  const handleToggleSpecialty = (srv: ServiceType) => {
    if (agentSpecialties.includes(srv)) {
      if (agentSpecialties.length === 1) return;
      setAgentSpecialties(agentSpecialties.filter((s) => s !== srv));
    } else {
      setAgentSpecialties([...agentSpecialties, srv]);
    }
  };

  const handleRunPlaygroundTest = async () => {
    setIsPlayingTest(true);
    setPlaygroundOutput(null);
    setPlaygroundGrounding([]);
    try {
      const res = await onTestPlayground({
        model: playgroundModel,
        systemPrompt: playgroundSystemPrompt,
        userPrompt: playgroundPrompt,
        thinkingLevel: playgroundThinkingLevel,
        useSearch: playgroundUseSearch,
      });
      setPlaygroundOutput(res.text);
      if (res.groundingChunks) {
        setPlaygroundGrounding(res.groundingChunks);
      }
    } catch (err: any) {
      setPlaygroundOutput(`Error executing test: ${err.message || 'Failed to generate response'}`);
    } finally {
      setIsPlayingTest(false);
    }
  };

  const handleSelectPlaygroundAgent = (agentId: string) => {
    setSelectedPlaygroundAgentId(agentId);
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      setPlaygroundModel(agent.model);
      setPlaygroundSystemPrompt(agent.systemPrompt);
      setPlaygroundThinkingLevel(agent.thinkingLevel);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Model & Custom Agent Studio</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Multi-Model & Specialized Agent Control Center
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Choose which AI models (Gemini 3.8 Flash, 3.1 Flash Lite, 4 Argon) power your lead discovery, website audits, scoring, and cold pitches. Build and deploy tailored AI Agents with custom personas.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Agent</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'roster'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span>AI Agent Roster ({agents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'pipeline'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Pipeline Model Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('playground')}
          className={`py-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === 'playground'
              ? 'border-indigo-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 className="w-4 h-4 text-violet-400" />
          <span>Interactive Agent Playground</span>
        </button>
      </div>

      {/* TAB 1: Agent Roster */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((agent) => {
            const isCurrentlyActive = agentSettings.activeAgentId === agent.id;
            return (
              <div
                key={agent.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xl ${
                  isCurrentlyActive
                    ? 'bg-slate-900/90 border-indigo-500 shadow-indigo-500/10'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm tracking-tight">{agent.name}</h3>
                        <p className="text-[11px] text-slate-400">{agent.role}</p>
                      </div>
                    </div>

                    {agent.isCustom ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        Custom
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                        Built-in
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {agent.description}
                  </p>

                  {/* Badges for Model & Thinking Level */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 text-[10px] font-mono flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-blue-400" />
                      {agent.model}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[10px] font-mono">
                      Thinking: {agent.thinkingLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]">
                      {agent.tone}
                    </span>
                  </div>

                  {/* Specialty Services */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {agent.specialtyServices?.map((s) => (
                      <span
                        key={s}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onUpdateAgentSettings({ activeAgentId: agent.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      isCurrentlyActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isCurrentlyActive ? <Check className="w-3.5 h-3.5" /> : null}
                    <span>{isCurrentlyActive ? 'Primary Active' : 'Set as Primary'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {agent.isCustom && (
                      <>
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Agent"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteAgent(agent.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete Agent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        handleSelectPlaygroundAgent(agent.id);
                        setActiveTab('playground');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold flex items-center gap-1"
                    >
                      <span>Test Live</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Pipeline Model Matrix */}
      {activeTab === 'pipeline' && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-6">
          <div className="space-y-1 pb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white">Pipeline AI Model & Agent Routing</h3>
            <p className="text-xs text-slate-400">
              Configure which AI model and specialized Agent runs during each stage of lead generation and outreach.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-emerald-200">Free Tier Quota Shield Active</span>
              <p className="text-slate-300 leading-relaxed">
                Your pipeline automatically uses unified single-pass lead analysis (cutting quota consumption by 50%), incorporates intelligent pacing delays between calls, and features instant zero-fail fallback to <span className="font-mono text-emerald-300">gemini-3.1-flash-lite</span> if Google rate limits (429/503) are encountered.
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-3xl">
            {/* Global Default Model */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Global Base AI Model
                </span>
                <p className="text-[11px] text-slate-400">Default engine powering campaign pipelines</p>
              </div>
              <select
                value={agentSettings.globalModel}
                onChange={(e) => onUpdateAgentSettings({ globalModel: e.target.value as AIModelName })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono font-medium focus:outline-none focus:border-indigo-500"
              >
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Free Tier Recommended • Max Quota)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Standard • Balanced Thinking)</option>
                <option value="gemini-4-argon">gemini-4-argon (Requires Paid Key • Deep Reasoning)</option>
              </select>
            </div>

            {/* Stage 1: Discovery Agent */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  1. Business Discovery Agent (Live Google Grounding)
                </span>
                <p className="text-[11px] text-slate-400">Searches live web directories and local operating businesses</p>
              </div>
              <select
                value={agentSettings.discoveryAgentId}
                onChange={(e) => onUpdateAgentSettings({ discoveryAgentId: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage 2: Website Analysis Agent */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-400" />
                  2. Website Analysis & UX Diagnostic Agent
                </span>
                <p className="text-[11px] text-slate-400">Audits mobile viewport, loading friction & typography</p>
              </div>
              <select
                value={agentSettings.websiteAnalysisAgentId}
                onChange={(e) => onUpdateAgentSettings({ websiteAnalysisAgentId: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage 3: Lead Scoring Agent */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  3. Transparent Lead Scoring Agent (0–100)
                </span>
                <p className="text-[11px] text-slate-400">Calculates transparent 5-factor opportunity score & priority</p>
              </div>
              <select
                value={agentSettings.leadScoringAgentId}
                onChange={(e) => onUpdateAgentSettings({ leadScoringAgentId: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage 4: Outreach Copywriter Agent */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  4. Personalized Cold Outreach Copywriter Agent
                </span>
                <p className="text-[11px] text-slate-400">Drafts cold emails, LinkedIn pitches & strategic follow-ups</p>
              </div>
              <select
                value={agentSettings.outreachAgentId}
                onChange={(e) => onUpdateAgentSettings({ outreachAgentId: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model} - {a.tone})
                  </option>
                ))}
              </select>
            </div>

            {/* Stage 5: Reporting Agent */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                  5. Campaign Executive Reporting & Strategic Agent
                </span>
                <p className="text-[11px] text-slate-400">Synthesizes campaign analytics, problem frequency & next steps</p>
              </div>
              <select
                value={agentSettings.reportingAgentId}
                onChange={(e) => onUpdateAgentSettings({ reportingAgentId: e.target.value })}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Interactive Agent Playground */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-violet-400" />
                Playground Controls
              </h3>
              <span className="text-[10px] text-slate-400">Live Server-Side Execution</span>
            </div>

            {/* Agent Preset Quick Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Preset Agent Persona</label>
              <select
                value={selectedPlaygroundAgentId}
                onChange={(e) => handleSelectPlaygroundAgent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Model Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">AI Model</label>
                <select
                  value={playgroundModel}
                  onChange={(e) => setPlaygroundModel(e.target.value as AIModelName)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                  <option value="gemini-4-argon">gemini-4-argon</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Thinking Level</label>
                <select
                  value={playgroundThinkingLevel}
                  onChange={(e) => setPlaygroundThinkingLevel(e.target.value as ThinkingLevelSetting)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
            </div>

            {/* Search Grounding Toggle */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  Live Google Search Grounding
                </span>
                <p className="text-[10px] text-slate-400">Enables real-time web retrieval for current facts</p>
              </div>
              <input
                type="checkbox"
                checked={playgroundUseSearch}
                onChange={(e) => setPlaygroundUseSearch(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Agent System Persona / Instructions</label>
              <textarea
                rows={3}
                value={playgroundSystemPrompt}
                onChange={(e) => setPlaygroundSystemPrompt(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* User Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Test Query / Prospect Scenario</label>
              <textarea
                rows={4}
                value={playgroundPrompt}
                onChange={(e) => setPlaygroundPrompt(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleRunPlaygroundTest}
              disabled={isPlayingTest}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {isPlayingTest ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isPlayingTest ? 'Running Inference...' : 'Execute Agent Test'}</span>
            </button>
          </div>

          {/* Output Display */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-xl space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-white">Agent Output & Reasoning</h4>
                <p className="text-xs text-slate-400">Inspected response from {playgroundModel}</p>
              </div>
            </div>

            <div className="flex-1 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto min-h-[380px] max-h-[550px]">
              {isPlayingTest ? (
                <div className="h-full flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                  <p>Inference in progress with {playgroundModel}...</p>
                </div>
              ) : playgroundOutput ? (
                playgroundOutput
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 text-slate-500">
                  <Code2 className="w-8 h-8 mb-2" />
                  <p>Click "Execute Agent Test" to view real-time output and reasoning.</p>
                </div>
              )}
            </div>

            {/* Grounding Chunks if present */}
            {playgroundGrounding && playgroundGrounding.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-blue-400 flex items-center gap-1.5 text-[11px]">
                  <Globe className="w-3.5 h-3.5" />
                  Verified Google Search Grounding Sources ({playgroundGrounding.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {playgroundGrounding.map((chunk, idx) => (
                    <a
                      key={idx}
                      href={chunk.web?.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-blue-300 hover:underline truncate max-w-[200px]"
                    >
                      {chunk.web?.title || chunk.web?.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Custom Agent */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" />
                <span>{editingAgentId ? 'Edit AI Agent' : 'Create Custom AI Agent'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAgent} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Agent Name *</label>
                <input
                  type="text"
                  required
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. Luxury Real Estate Lead Hunter"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Role / Persona Title *</label>
                <input
                  type="text"
                  required
                  value={agentRole}
                  onChange={(e) => setAgentRole(e.target.value)}
                  placeholder="e.g. High-Ticket Real Estate Web Consultant"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <input
                  type="text"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  placeholder="Brief summary of how this agent researches and scores leads"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">AI Model</label>
                  <select
                    value={agentModel}
                    onChange={(e) => setAgentModel(e.target.value as AIModelName)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                    <option value="gemini-4-argon">gemini-4-argon</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Thinking Level</label>
                  <select
                    value={agentThinkingLevel}
                    onChange={(e) => setAgentThinkingLevel(e.target.value as ThinkingLevelSetting)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Copywriting Tone</label>
                  <input
                    type="text"
                    value={agentTone}
                    onChange={(e) => setAgentTone(e.target.value)}
                    placeholder="e.g. Consultative, Direct, ROI-Focused"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Outreach Style</label>
                  <input
                    type="text"
                    value={agentOutreachStyle}
                    onChange={(e) => setAgentOutreachStyle(e.target.value)}
                    placeholder="e.g. Strategic Value-First, Audit Teaser"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Custom System Instructions (Agent Prompt)
                </label>
                <textarea
                  rows={4}
                  required
                  value={agentSystemPrompt}
                  onChange={(e) => setAgentSystemPrompt(e.target.value)}
                  placeholder="Define this agent's audit principles, red flags to look for, copywriting rules..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
                />
              </div>

              {/* Specialty Services */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Specialty Services</label>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_SERVICES.map((s) => {
                    const isChecked = agentSpecialties.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleToggleSpecialty(s)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-950 border border-slate-800 text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAgent}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20"
                >
                  {isSavingAgent ? 'Saving...' : editingAgentId ? 'Save Changes' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
