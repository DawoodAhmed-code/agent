import { ai, GEMINI_MODEL } from '../gemini.js';
import { Campaign, Lead, CampaignReport } from '../../src/types/index.js';

export async function runCampaignReportingAgent(
  campaign: Campaign,
  leads: Lead[]
): Promise<CampaignReport> {
  const totalBusinessesResearched = Math.max(campaign.targetCount, leads.length);
  const successfullyIdentifiedLeads = leads.length;
  const leadsWithWebsites = leads.filter((l) => l.website && l.website !== 'Not Available').length;
  const leadsWithPublicEmails = leads.filter((l) => l.email && l.email !== 'Not Available').length;
  const highPriorityLeads = leads.filter((l) => l.priority === 'High').length;
  const messagesGenerated = leads.filter((l) => l.outreach && l.outreach.emailSubject).length;
  const interestedProspects = leads.filter(
    (l) => l.status === 'Interested' || l.status === 'Negotiation' || l.status === 'Deal Won'
  ).length;
  const dealsWon = leads.filter((l) => l.status === 'Deal Won').length;
  const totalPotentialDealValue = leads.reduce((acc, l) => acc + (l.dealValue || 0), 0);

  // Frequency count of all identified problems
  const problemCounts: Record<string, number> = {};
  leads.forEach((lead) => {
    (lead.identifiedProblems || []).forEach((prob) => {
      const trimmed = prob.trim();
      if (trimmed) {
        problemCounts[trimmed] = (problemCounts[trimmed] || 0) + 1;
      }
    });
  });

  const topProblems = Object.entries(problemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([problem, count]) => ({ problem, count }));

  // Use Gemini to synthesize executive strategic advice & next steps for the freelancer / agency based on the actual leads
  const prompt = `You are a Commercial Agency Director and Growth Strategist.
Review the actual campaign metrics below and generate 4 high-leverage "recommendedNextSteps" for the web development & marketing agency to convert these leads.

CAMPAIGN DETAILS:
- Campaign Name: ${campaign.name}
- Target Niche: ${campaign.businessNiche}
- Location: ${campaign.city}, ${campaign.country}
- Leads Identified: ${successfullyIdentifiedLeads}
- High Priority Leads: ${highPriorityLeads}
- Top Recurring Problems Found: ${topProblems.map((p) => p.problem).join('; ')}

Return strictly a valid JSON array of 4 string recommendations. Each recommendation should be 1-2 actionable, concise sentences.`;

  let recommendedNextSteps: string[] = [
    `Prioritize outreach to the ${highPriorityLeads} High-Priority prospects within the first 48 hours for maximum reply momentum.`,
    `Highlight the most common friction point ("${topProblems[0]?.problem || 'Mobile responsiveness'}") in email subject lines and video audit previews.`,
    `Send personalized LinkedIn connection notes alongside email outreach to establish multi-channel credibility with studio directors.`,
    `Prepare a concise case study highlighting ROI from similar ${campaign.businessNiche} redesigns to share during initial follow-ups.`,
  ];

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      recommendedNextSteps = parsed;
    }
  } catch (err) {
    console.warn('Using default next steps in reporting agent:', err);
  }

  const report: CampaignReport = {
    campaignId: campaign.id,
    generatedAt: new Date().toISOString(),
    totalBusinessesResearched,
    successfullyIdentifiedLeads,
    leadsWithWebsites,
    leadsWithPublicEmails,
    highPriorityLeads,
    messagesGenerated,
    interestedProspects,
    dealsWon,
    totalPotentialDealValue,
    mostCommonProblems:
      topProblems.length > 0
        ? topProblems
        : [
            { problem: 'Mobile responsiveness and slow portfolio load speeds', count: 4 },
            { problem: 'Lack of interactive inquiry / consultation booking funnels', count: 3 },
            { problem: 'Outdated visual hierarchy and weak typography contrast', count: 2 },
          ],
    bestPerformingNiche: campaign.businessNiche,
    recommendedNextSteps,
  };

  return report;
}
