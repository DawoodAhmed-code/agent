import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbService } from './server/db.js';
import { runBusinessDiscoveryAgent } from './server/agents/businessDiscoveryAgent.js';
import { runWebsiteAnalysisAndScorer } from './server/agents/websiteAnalysisAgent.js';
import { runOutreachGeneratorAgent } from './server/agents/outreachGeneratorAgent.js';
import { runCampaignReportingAgent } from './server/agents/campaignReportingAgent.js';
import { runUnifiedLeadIntelligenceAgent } from './server/agents/unifiedLeadAgent.js';
import { generateCsv, syncToGoogleSheets } from './server/services/sheetsExportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper to extract or fallback current user
function getAuthUserId(req: Request): string {
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId && headerUserId.trim()) {
    return headerUserId;
  }
  return 'user_default_agency_1';
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = dbService.getUserByEmail(email);
  if (!user) {
    // Convenient auto-registration for the developer's session
    user = dbService.createUser({
      email,
      name: email.split('@')[0],
      password,
    });
  }

  res.json({ success: true, user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, name, agencyName, password } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const user = dbService.createUser({
    email,
    name,
    agencyName,
    password,
  });

  res.json({ success: true, user });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  let user = dbService.getUser(userId);
  if (!user) {
    // fallback to default user
    user = dbService.getUser('user_default_agency_1');
  }
  res.json({ user });
});

app.put('/api/auth/profile', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const updated = dbService.updateUserProfile(userId, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user: updated });
});

// -------------------------------------------------------------
// Dashboard Endpoints
// -------------------------------------------------------------
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const stats = dbService.getDashboardStats(userId);
  res.json(stats);
});

app.get('/api/dashboard/activities', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const activities = dbService.getActivities(userId, 25);
  res.json(activities);
});

// -------------------------------------------------------------
// Campaign Endpoints
// -------------------------------------------------------------
app.get('/api/campaigns', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const campaigns = dbService.getCampaigns(userId);
  res.json(campaigns);
});

app.get('/api/campaigns/:id', (req: Request, res: Response) => {
  const campaign = dbService.getCampaign(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }
  res.json(campaign);
});

app.post('/api/campaigns', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const {
    name,
    country,
    city,
    businessNiche,
    targetCount,
    services,
    targetBusinessSize,
    preferredLanguage,
    minWebsiteQuality,
    selectedAgentId,
  } = req.body;

  if (!country || !city || !businessNiche) {
    return res.status(400).json({ error: 'Country, City, and Business Niche are required.' });
  }

  const newCampaign = dbService.createCampaign({
    userId,
    name: name || `${businessNiche} in ${city}, ${country}`,
    country,
    city,
    businessNiche,
    targetCount: Number(targetCount) || 5,
    services: Array.isArray(services) && services.length > 0 ? services : ['Website Redesign', 'UI/UX Design'],
    targetBusinessSize: targetBusinessSize || 'Small to Medium (5-25 staff)',
    preferredLanguage: preferredLanguage || 'English',
    minWebsiteQuality: minWebsiteQuality || 'Moderate (Opportunity for upgrade)',
    selectedAgentId,
    status: 'draft',
  });

  res.json(newCampaign);
});

app.delete('/api/campaigns/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const deleted = dbService.deleteCampaign(req.params.id, userId);
  res.json({ success: deleted });
});

// Run AI Lead Generation Campaign Pipeline with Configured Model & Agent System
app.post('/api/campaigns/:id/run', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const campaign = dbService.getCampaign(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const user = dbService.getUser(userId);

  // Resolve active AI Agents & Models from Agent Model Settings
  const agentSettings = dbService.getAgentSettings();
  const campaignAgent = campaign.selectedAgentId ? dbService.getAgent(campaign.selectedAgentId) : undefined;

  const discoveryAgent = campaignAgent || dbService.getAgent(agentSettings.discoveryAgentId) || dbService.getAgent('agent_apex_growth');
  const analysisAgent = campaignAgent || dbService.getAgent(agentSettings.websiteAnalysisAgentId) || dbService.getAgent('agent_creative_ux');
  const outreachAgent = campaignAgent || dbService.getAgent(agentSettings.outreachAgentId) || dbService.getAgent('agent_apex_growth');
  const reportingAgent = campaignAgent || dbService.getAgent(agentSettings.reportingAgentId) || dbService.getAgent('agent_enterprise_closer');

  const createdLeads: any[] = [];

  try {
    dbService.updateCampaign(campaign.id, { status: 'running' });

    // Step 1: Run Business Discovery Agent using Google Search grounding
    const rawBusinesses = await runBusinessDiscoveryAgent({
      country: campaign.country,
      city: campaign.city,
      businessNiche: campaign.businessNiche,
      targetCount: campaign.targetCount,
      model: discoveryAgent?.model || agentSettings.globalModel,
      agentPrompt: discoveryAgent?.systemPrompt,
    });

    if (!rawBusinesses || rawBusinesses.length === 0) {
      dbService.updateCampaign(campaign.id, { status: 'completed' });
      return res.json({
        success: true,
        campaign: dbService.getCampaign(campaign.id),
        leads: [],
        message: 'No new unique businesses found matching this query.',
      });
    }

    // Step 2, 3, 4: Deep Research, Website Analysis, Lead Scoring & Personalized Outreach
    // Using Unified Lead Intelligence Agent to cut quota consumption by 50% (1 call instead of 2 per lead)
    for (let i = 0; i < rawBusinesses.length; i++) {
      const biz = rawBusinesses[i];

      // Check for duplicate lead
      const isDuplicate = dbService.checkDuplicateLead(biz.website, biz.businessName, campaign.city);
      if (isDuplicate) {
        continue;
      }

      // Run unified analysis + scoring + outreach sequence with free-tier resilience
      const unifiedResult = await runUnifiedLeadIntelligenceAgent({
        businessName: biz.businessName,
        businessCategory: biz.businessCategory || campaign.businessNiche,
        country: campaign.country,
        city: campaign.city,
        website: biz.website,
        servicesOffered: campaign.services,
        senderName: user?.name || 'Dawood Ahmed',
        agencyName: user?.agencyName || 'Apex Web & Digital Growth',
        portfolioUrl: user?.portfolioUrl || '',
        bookingUrl: user?.bookingUrl || '',
        signature: user?.signature || '',
        model: analysisAgent?.model || agentSettings.globalModel,
        agentPrompt: analysisAgent?.systemPrompt || outreachAgent?.systemPrompt,
        tone: outreachAgent?.tone,
        outreachStyle: outreachAgent?.outreachStyle,
        thinkingLevel: analysisAgent?.thinkingLevel,
      });

      const { analysis, outreach } = unifiedResult;

      // Estimate expected deal value based on lead score & service
      let dealValue = 3500;
      if (analysis.recommendedService.includes('Development') || analysis.recommendedService.includes('Redesign')) {
        dealValue = analysis.leadScore > 80 ? 6500 : 4500;
      } else if (analysis.recommendedService.includes('Branding')) {
        dealValue = 4000;
      } else if (analysis.recommendedService.includes('Advertising')) {
        dealValue = 3000;
      }

      const newLead = dbService.createLead({
        userId,
        campaignId: campaign.id,
        campaignName: campaign.name,
        businessName: biz.businessName,
        businessCategory: biz.businessCategory || campaign.businessNiche,
        country: campaign.country,
        city: campaign.city,
        website: biz.website,
        email: biz.email || 'Not Available',
        phone: biz.phone || 'Not Available',
        websiteQualityAssessment: analysis.websiteQualityAssessment,
        brandingAssessment: analysis.brandingAssessment,
        marketingOpportunity: analysis.marketingOpportunity,
        identifiedProblems: analysis.identifiedProblems,
        recommendedService: analysis.recommendedService,
        leadScore: analysis.leadScore,
        scoreBreakdown: analysis.scoreBreakdown,
        priority: analysis.priority,
        scoreReason: analysis.scoreReason,
        researchSource: biz.researchSource || 'Verified Business Directory',
        researchDate: new Date().toISOString().split('T')[0],
        status: 'Researched',
        outreach,
        dealValue,
      });

      createdLeads.push(newLead);

      // Pacing delay between leads (1200ms) to ensure strict adherence to Free Tier 15 RPM limit
      if (i < rawBusinesses.length - 1) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    // Generate Campaign Summary Report
    const allCampaignLeads = dbService.getLeads(userId, { campaignId: campaign.id });
    const report = await runCampaignReportingAgent(campaign, allCampaignLeads, {
      model: reportingAgent?.model || agentSettings.globalModel,
      agentPrompt: reportingAgent?.systemPrompt,
    });

    const updatedCampaign = dbService.updateCampaign(campaign.id, {
      status: 'completed',
      leadsFound: allCampaignLeads.length,
      report,
    });

    res.json({
      success: true,
      campaign: updatedCampaign,
      leads: createdLeads,
      report,
    });
  } catch (error: any) {
    console.error('Error running campaign pipeline:', error);
    // If leads were created before error, save campaign gracefully so user progress is never lost
    const allCampaignLeads = dbService.getLeads(userId, { campaignId: campaign.id });
    if (allCampaignLeads.length > 0) {
      const updatedCampaign = dbService.updateCampaign(campaign.id, {
        status: 'completed',
        leadsFound: allCampaignLeads.length,
      });
      return res.json({
        success: true,
        campaign: updatedCampaign,
        leads: createdLeads,
        notice: 'Completed with Free Tier Quota Shield protection.',
      });
    }
    dbService.updateCampaign(campaign.id, { status: 'failed' });
    res.status(500).json({ error: error.message || 'Failed to complete campaign search.' });
  }
});

// Campaign Summary Report
app.get('/api/campaigns/:id/report', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const campaign = dbService.getCampaign(req.params.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const leads = dbService.getLeads(userId, { campaignId: campaign.id });
  try {
    const report = await runCampaignReportingAgent(campaign, leads);
    dbService.updateCampaign(campaign.id, { report });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// CSV Export for Campaign
app.get('/api/campaigns/:id/export-csv', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const campaign = dbService.getCampaign(req.params.id);
  const leads = dbService.getLeads(userId, { campaignId: req.params.id });

  const csv = generateCsv(leads);
  const filename = `${(campaign?.name || 'campaign').replace(/[^a-zA-Z0-9_-]/g, '_')}_leads.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// -------------------------------------------------------------
// Lead CRM Endpoints
// -------------------------------------------------------------
app.get('/api/leads', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { campaignId, status, priority, search, niche, sortBy, sortOrder } = req.query as any;

  const leads = dbService.getLeads(userId, {
    campaignId,
    status,
    priority,
    search,
    niche,
    sortBy,
    sortOrder,
  });

  res.json(leads);
});

app.get('/api/leads/:id', (req: Request, res: Response) => {
  const lead = dbService.getLead(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
});

app.put('/api/leads/:id', (req: Request, res: Response) => {
  const updated = dbService.updateLead(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(updated);
});

app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const success = dbService.deleteLead(req.params.id, userId);
  res.json({ success });
});

app.post('/api/leads/bulk-delete', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds)) {
    return res.status(400).json({ error: 'leadIds must be an array' });
  }

  let deletedCount = 0;
  for (const id of leadIds) {
    if (dbService.deleteLead(id, userId)) {
      deletedCount++;
    }
  }

  res.json({ success: true, deletedCount });
});

// Regenerate / Generate Outreach with chosen AI Agent & Model
app.post('/api/leads/:id/generate-outreach', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const lead = dbService.getLead(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const user = dbService.getUser(userId);
  const { customInstructions, agentId } = req.body;

  const agentSettings = dbService.getAgentSettings();
  const selectedAgent = (agentId ? dbService.getAgent(agentId) : undefined) ||
    dbService.getAgent(agentSettings.outreachAgentId) ||
    dbService.getAgent('agent_apex_growth');

  try {
    const outreach = await runOutreachGeneratorAgent({
      businessName: lead.businessName,
      businessCategory: lead.businessCategory,
      city: lead.city,
      country: lead.country,
      website: lead.website,
      identifiedProblems: lead.identifiedProblems || [],
      recommendedService: lead.recommendedService,
      senderName: user?.name || 'Dawood Ahmed',
      agencyName: user?.agencyName || 'Apex Web & Digital Growth',
      portfolioUrl: user?.portfolioUrl || '',
      bookingUrl: user?.bookingUrl || '',
      signature: user?.signature || '',
      model: selectedAgent?.model || agentSettings.globalModel,
      agentPrompt: customInstructions
        ? `${selectedAgent?.systemPrompt || ''}\nSpecialized User Instructions: ${customInstructions}`
        : selectedAgent?.systemPrompt,
      tone: selectedAgent?.tone,
      outreachStyle: selectedAgent?.outreachStyle,
      thinkingLevel: selectedAgent?.thinkingLevel,
    });

    const updated = dbService.updateLead(lead.id, {
      outreach,
      status: lead.status === 'New' || lead.status === 'Researched' ? 'Message Prepared' : lead.status,
    });

    dbService.addActivity({
      userId,
      leadId: lead.id,
      leadName: lead.businessName,
      action: `Outreach Generated (${selectedAgent?.name || 'AI Agent'})`,
      details: `Generated cold pitch using ${selectedAgent?.name} (${selectedAgent?.model || 'Gemini'}).`,
    });

    res.json({ success: true, lead: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate outreach.' });
  }
});

// Re-research Lead with chosen AI Agent
app.post('/api/leads/:id/research', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const lead = dbService.getLead(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const user = dbService.getUser(userId);
  const { agentId } = req.body;
  const services = user?.servicesOffered || ['Professional Website Development', 'Website Redesign', 'UI/UX Design'];

  const agentSettings = dbService.getAgentSettings();
  const selectedAgent = (agentId ? dbService.getAgent(agentId) : undefined) ||
    dbService.getAgent(agentSettings.websiteAnalysisAgentId) ||
    dbService.getAgent('agent_creative_ux');

  try {
    const analysis = await runWebsiteAnalysisAndScorer({
      businessName: lead.businessName,
      businessCategory: lead.businessCategory,
      country: lead.country,
      city: lead.city,
      website: lead.website,
      servicesOffered: services,
      model: selectedAgent?.model || agentSettings.globalModel,
      agentPrompt: selectedAgent?.systemPrompt,
      thinkingLevel: selectedAgent?.thinkingLevel,
    });

    const updated = dbService.updateLead(lead.id, {
      websiteQualityAssessment: analysis.websiteQualityAssessment,
      brandingAssessment: analysis.brandingAssessment,
      marketingOpportunity: analysis.marketingOpportunity,
      identifiedProblems: analysis.identifiedProblems,
      recommendedService: analysis.recommendedService,
      leadScore: analysis.leadScore,
      scoreBreakdown: analysis.scoreBreakdown,
      priority: analysis.priority,
      scoreReason: analysis.scoreReason,
      researchDate: new Date().toISOString().split('T')[0],
    });

    dbService.addActivity({
      userId,
      leadId: lead.id,
      leadName: lead.businessName,
      action: `AI Deep Audit (${selectedAgent?.name || 'Agent'})`,
      details: `Re-evaluated online presence using ${selectedAgent?.model || 'Gemini'}. Score: ${analysis.leadScore}/100.`,
    });

    res.json({ success: true, lead: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to research lead.' });
  }
});

// -------------------------------------------------------------
// AI Models & Custom Agents Hub Endpoints
// -------------------------------------------------------------
app.get('/api/agents', (_req: Request, res: Response) => {
  const agents = dbService.getAgents();
  res.json(agents);
});

app.post('/api/agents', (req: Request, res: Response) => {
  const {
    name,
    role,
    description,
    model,
    thinkingLevel,
    systemPrompt,
    tone,
    outreachStyle,
    specialtyServices,
  } = req.body;

  if (!name || !role) {
    return res.status(400).json({ error: 'Agent Name and Role are required.' });
  }

  const created = dbService.createAgent({
    name,
    role,
    description: description || 'Custom AI Agent for lead generation & analysis',
    model: model || 'gemini-3.8-flash',
    thinkingLevel: thinkingLevel || 'MEDIUM',
    systemPrompt: systemPrompt || 'You are an expert commercial growth strategist.',
    tone: tone || 'Consultative & Authoritative',
    outreachStyle: outreachStyle || 'Strategic Value-First Pitch',
    isCustom: true,
    specialtyServices: Array.isArray(specialtyServices) ? specialtyServices : ['Website Redesign'],
  });

  res.json(created);
});

app.put('/api/agents/:id', (req: Request, res: Response) => {
  const updated = dbService.updateAgent(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  res.json(updated);
});

app.delete('/api/agents/:id', (req: Request, res: Response) => {
  const deleted = dbService.deleteAgent(req.params.id);
  if (!deleted) {
    return res.status(400).json({ error: 'Cannot delete built-in agent or agent not found.' });
  }
  res.json({ success: true });
});

app.get('/api/agent-settings', (_req: Request, res: Response) => {
  const settings = dbService.getAgentSettings();
  const availableModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
  res.json({ settings, availableModels });
});

app.post('/api/agent-settings', (req: Request, res: Response) => {
  const updated = dbService.updateAgentSettings(req.body);
  res.json({ success: true, settings: updated });
});

// Live Interactive AI Agent Testing Playground
app.post('/api/agents/playground/test', async (req: Request, res: Response) => {
  const { model = 'gemini-3.1-flash-lite', systemPrompt, userPrompt, thinkingLevel = 'LOW', useSearch } = req.body;

  if (!userPrompt) {
    return res.status(400).json({ error: 'userPrompt is required' });
  }

  try {
    const { callGeminiResiliently } = await import('./server/gemini.js');
    const { ThinkingLevel } = await import('@google/genai');

    const config: any = {
      systemInstruction: systemPrompt || 'You are an expert commercial AI Agent for LeadPilot AI.',
    };

    if (thinkingLevel === 'HIGH') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else if (thinkingLevel === 'LOW') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    const result = await callGeminiResiliently({
      model: model || 'gemini-3.1-flash-lite',
      contents: userPrompt,
      config,
      enableSearch: Boolean(useSearch),
      fallbackToLiteOnQuota: true,
      maxRetries: 1,
    });

    res.json({
      success: true,
      modelUsed: result.modelUsed,
      text: result.text || '',
      groundingChunks: result.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      usedSearch: result.usedSearch,
      testedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Playground test error:', err);
    res.status(500).json({ error: err.message || 'AI generation failed in playground' });
  }
});

// Bulk / Filtered CSV Export
app.post('/api/leads/export-csv', (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { leadIds } = req.body;

  let leads = dbService.getLeads(userId);
  if (Array.isArray(leadIds) && leadIds.length > 0) {
    leads = leads.filter((l) => leadIds.includes(l.id));
  }

  const csv = generateCsv(leads);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="leadpilot_leads_export.csv"');
  res.send(csv);
});

// -------------------------------------------------------------
// Google Sheets Integration
// -------------------------------------------------------------
app.get('/api/sheets/config', (_req: Request, res: Response) => {
  res.json(dbService.getSheetsConfig());
});

app.post('/api/sheets/config', (req: Request, res: Response) => {
  const updated = dbService.updateSheetsConfig(req.body);
  res.json(updated);
});

app.post('/api/sheets/sync', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const leads = dbService.getLeads(userId);
  const config = dbService.getSheetsConfig();

  const result = await syncToGoogleSheets(leads, config as any);
  if (result.success) {
    dbService.updateSheetsConfig({
      lastSyncedAt: new Date().toISOString(),
    });
    dbService.addActivity({
      userId,
      action: 'Google Sheets Synced',
      details: `Synchronized ${result.syncedCount} leads to Google Sheets spreadsheet.`,
    });
  }

  res.json(result);
});

// -------------------------------------------------------------
// Supabase Integration & Settings
// -------------------------------------------------------------
app.get('/api/settings/supabase', (_req: Request, res: Response) => {
  res.json(dbService.getSupabaseConfig());
});

app.post('/api/settings/supabase', (req: Request, res: Response) => {
  const updated = dbService.updateSupabaseConfig(req.body);
  res.json({ success: true, config: updated });
});

// -------------------------------------------------------------
// Vite Dev Server / Static File Serving
// -------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeadPilot AI server listening on http://0.0.0.0:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
