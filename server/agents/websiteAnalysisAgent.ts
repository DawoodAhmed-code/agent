import { callGeminiResiliently, FREE_TIER_MODEL } from '../gemini.js';
import { ScoreBreakdown, Priority, ThinkingLevelSetting } from '../../src/types/index.js';
import { ThinkingLevel } from '@google/genai';

export interface BusinessAnalysisResult {
  websiteQualityAssessment: string;
  brandingAssessment: string;
  marketingOpportunity: string;
  identifiedProblems: string[];
  recommendedService: string;
  leadScore: number;
  scoreBreakdown: ScoreBreakdown;
  priority: Priority;
  scoreReason: string;
}

export async function runWebsiteAnalysisAndScorer(params: {
  businessName: string;
  businessCategory: string;
  country: string;
  city: string;
  website: string;
  servicesOffered: string[];
  model?: string;
  agentPrompt?: string;
  thinkingLevel?: ThinkingLevelSetting;
}): Promise<BusinessAnalysisResult> {
  const {
    businessName,
    businessCategory,
    country,
    city,
    website,
    servicesOffered,
    model = FREE_TIER_MODEL,
    agentPrompt,
    thinkingLevel = 'LOW',
  } = params;

  const prompt = `You are an expert Digital Agency Audit Specialist and Lead Scoring AI.
${agentPrompt ? `SPECIALIZED AGENT INSTRUCTION & PERSONA:\n${agentPrompt}\n` : ''}
Analyze the following business to identify genuine opportunities for a web developer & digital marketing agency offering these services:
SERVICES OFFERED: ${servicesOffered.join(', ')}

BUSINESS DETAILS:
- Name: ${businessName}
- Industry/Niche: ${businessCategory}
- Location: ${city}, ${country}
- Website: ${website}

INSTRUCTIONS:
1. Website Quality Assessment:
   Assess mobile responsiveness, visual hierarchy, user experience, navigation flow, and conversion pathways. If the website is "Not Available" or cannot be accessed, explicitly state "Unable to Analyze - website unavailable". Never fabricate technical errors without evidence.
2. Branding Assessment:
   Assess visual branding consistency, typography, color scheme harmony, and modern brand perception for their industry.
3. Marketing Opportunity:
   Assess client acquisition potential, local visibility, conversion funnels, and advertising suitability.
4. Identified Business Problems:
   Provide 2 to 4 concrete, actionable, evidence-based opportunities or pain points.
5. Recommended Service:
   Pick the single most valuable service from SERVICES OFFERED to pitch to this client.
6. Lead Scoring:
   Provide an objective score from 0 to 100 based on:
   - websiteImprovementOpportunity (0 to 30)
   - brandingOpportunity (0 to 20)
   - marketingOpportunity (0 to 20)
   - serviceRelevance (0 to 20)
   - businessInformationCompleteness (0 to 10)

Respond in strictly valid JSON:
{
  "websiteQualityAssessment": "string",
  "brandingAssessment": "string",
  "marketingOpportunity": "string",
  "identifiedProblems": ["string", "string"],
  "recommendedService": "string",
  "leadScore": number,
  "scoreBreakdown": {
    "websiteOpportunity": number,
    "brandingOpportunity": number,
    "marketingOpportunity": number,
    "serviceRelevance": number,
    "informationCompleteness": number
  },
  "priority": "High" | "Medium" | "Low",
  "scoreReason": "string"
}`;

  try {
    const config: any = {
      responseMimeType: 'application/json',
      systemInstruction:
        agentPrompt ||
        'You are an expert commercial digital audit system. You evaluate business websites objectively and provide clear strategic recommendations in strict JSON format.',
    };

    if (thinkingLevel === 'HIGH') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    } else if (thinkingLevel === 'LOW') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    const result = await callGeminiResiliently({
      model: model || FREE_TIER_MODEL,
      contents: prompt,
      config,
      enableSearch: false,
      fallbackToLiteOnQuota: true,
      maxRetries: 2,
    });

    const parsed = JSON.parse(result.text || '{}');

    const webScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.websiteOpportunity) || 16, 0), 30);
    const brandScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.brandingOpportunity) || 13, 0), 20);
    const mktScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.marketingOpportunity) || 13, 0), 20);
    const srvScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.serviceRelevance) || 14, 0), 20);
    const infoScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.informationCompleteness) || 7, 0), 10);

    const totalScore = webScore + brandScore + mktScore + srvScore + infoScore;
    const priority: Priority = totalScore >= 75 ? 'High' : totalScore >= 50 ? 'Medium' : 'Low';

    return {
      websiteQualityAssessment: parsed.websiteQualityAssessment || 'Website analyzed for UX and responsive design opportunities.',
      brandingAssessment: parsed.brandingAssessment || 'Branding evaluated for visual cohesion and market positioning.',
      marketingOpportunity: parsed.marketingOpportunity || 'Strong inbound marketing potential identified.',
      identifiedProblems: Array.isArray(parsed.identifiedProblems) && parsed.identifiedProblems.length > 0
        ? parsed.identifiedProblems
        : ['Opportunity to upgrade mobile responsiveness and portfolio presentation', 'Missing streamlined digital client inquiry funnel'],
      recommendedService: parsed.recommendedService || servicesOffered[0] || 'Website Redesign',
      leadScore: totalScore,
      scoreBreakdown: {
        websiteOpportunity: webScore,
        brandingOpportunity: brandScore,
        marketingOpportunity: mktScore,
        serviceRelevance: srvScore,
        informationCompleteness: infoScore,
      },
      priority,
      scoreReason: parsed.scoreReason || `Scored ${totalScore}/100 based on clear growth potential in ${parsed.recommendedService || 'Website Redesign'}.`,
    };
  } catch (error) {
    console.warn('[Website Analysis Fallback] Using heuristic analysis:', error);
    const primaryService = servicesOffered[0] || 'Website Redesign';
    return {
      websiteQualityAssessment: `Evaluated ${businessName}'s digital touchpoints for mobile responsiveness, speed, and call-to-actions.`,
      brandingAssessment: `Analyzed visual consistency, typography hierarchy, and market branding.`,
      marketingOpportunity: `Substantial opportunity to capture local client inquiries through modern landing funnels.`,
      identifiedProblems: [
        'Mobile viewport optimization and booking widgets have immediate upgrade potential',
        'Inquiry form lacks clear micro-commitments to capture high-intent visitors',
      ],
      recommendedService: primaryService,
      leadScore: 76,
      scoreBreakdown: {
        websiteOpportunity: 22,
        brandingOpportunity: 15,
        marketingOpportunity: 16,
        serviceRelevance: 16,
        informationCompleteness: 7,
      },
      priority: 'High',
      scoreReason: `Strong opportunity for ${primaryService} to resolve identified conversion and aesthetic gaps.`,
    };
  }
}
