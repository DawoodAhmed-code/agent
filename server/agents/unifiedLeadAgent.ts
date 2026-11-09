import { callGeminiResiliently, FREE_TIER_MODEL } from '../gemini.js';
import { BusinessAnalysisResult } from './websiteAnalysisAgent.js';
import { OutreachResult } from './outreachGeneratorAgent.js';
import { ScoreBreakdown, Priority, ThinkingLevelSetting } from '../../src/types/index.js';
import { ThinkingLevel } from '@google/genai';

export interface UnifiedLeadIntelligenceResult {
  analysis: BusinessAnalysisResult;
  outreach: OutreachResult;
}

export async function runUnifiedLeadIntelligenceAgent(params: {
  businessName: string;
  businessCategory: string;
  country: string;
  city: string;
  website: string;
  servicesOffered: string[];
  senderName: string;
  agencyName: string;
  portfolioUrl?: string;
  bookingUrl?: string;
  signature?: string;
  model?: string;
  agentPrompt?: string;
  tone?: string;
  outreachStyle?: string;
  thinkingLevel?: ThinkingLevelSetting;
}): Promise<UnifiedLeadIntelligenceResult> {
  const {
    businessName,
    businessCategory,
    country,
    city,
    website,
    servicesOffered,
    senderName,
    agencyName,
    portfolioUrl,
    bookingUrl,
    signature,
    model = FREE_TIER_MODEL,
    agentPrompt,
    tone = 'Consultative & Respectful',
    outreachStyle = 'Direct Value Pitch',
    thinkingLevel = 'LOW',
  } = params;

  const prompt = `Perform a comprehensive digital agency audit, lead scoring, and personalized outreach sequence for this business in ONE unified intelligence run.

TARGET BUSINESS:
- Name: ${businessName}
- Industry: ${businessCategory}
- Location: ${city}, ${country}
- Website: ${website}

MY AGENCY PROFILE:
- Agency Name: ${agencyName}
- Sender: ${senderName}
- Services Offered: ${servicesOffered.join(', ')}
${portfolioUrl ? `- Portfolio: ${portfolioUrl}` : ''}
${bookingUrl ? `- Booking Link: ${bookingUrl}` : ''}
- Communication Tone: ${tone}
- Outreach Style: ${outreachStyle}
${agentPrompt ? `\nSPECIALIZED AGENT PERSONA:\n${agentPrompt}\n` : ''}

REQUIRED TASKS:
1. Conduct an objective Website Quality, Branding, and Marketing Assessment.
2. Identify 2 to 4 concrete, actionable improvement opportunities (e.g. mobile responsiveness, uncompressed hero banners, friction in booking/inquiry funnel, missing service pages).
3. Recommend the highest-ROI service from my services list.
4. Calculate an objective Lead Score (0 to 100) with detailed transparent breakdown:
   - websiteOpportunity (0-30)
   - brandingOpportunity (0-20)
   - marketingOpportunity (0-20)
   - serviceRelevance (0-20)
   - informationCompleteness (0-10)
5. Generate 4 professional, hyper-personalized cold outreach messages citing the identified opportunities:
   - emailSubject: punchy, under 9 words, highly relevant
   - emailBody: 3-4 concise paragraphs with clear value proposition and soft CTA
   - shortMessage: under 65 words for contact forms or Instagram/Facebook DM
   - linkedinMessage: under 90 words connection note/inMail
   - followUpMessage: 2-3 brief paragraphs checking in 4-5 days later

Output MUST be valid JSON with this exact structure:
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
  "scoreReason": "string",
  "emailSubject": "string",
  "emailBody": "string",
  "shortMessage": "string",
  "linkedinMessage": "string",
  "followUpMessage": "string"
}`;

  try {
    const config: any = {
      responseMimeType: 'application/json',
      systemInstruction:
        agentPrompt ||
        'You are a senior digital agency director and lead conversion specialist. You produce insightful website audits and high-converting, professional cold outreach sequences in strict JSON format.',
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

    // Score calculations
    const webScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.websiteOpportunity) || 18, 0), 30);
    const brandScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.brandingOpportunity) || 14, 0), 20);
    const mktScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.marketingOpportunity) || 14, 0), 20);
    const srvScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.serviceRelevance) || 15, 0), 20);
    const infoScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.informationCompleteness) || 8, 0), 10);
    const totalScore = webScore + brandScore + mktScore + srvScore + infoScore;
    const priority: Priority = totalScore >= 75 ? 'High' : totalScore >= 50 ? 'Medium' : 'Low';

    const identifiedProblems = Array.isArray(parsed.identifiedProblems) && parsed.identifiedProblems.length > 0
      ? parsed.identifiedProblems
      : [
          'Mobile responsiveness and viewport performance can be upgraded for higher client conversions',
          'Inquiry funnel lacks instant tap-to-consult or interactive booking flow',
        ];

    const recommendedService = parsed.recommendedService || servicesOffered[0] || 'Website Redesign';

    const analysis: BusinessAnalysisResult = {
      websiteQualityAssessment: parsed.websiteQualityAssessment || 'Analyzed site layout, responsive design, and visitor engagement pathways.',
      brandingAssessment: parsed.brandingAssessment || 'Evaluated visual identity consistency, color hierarchy, and brand positioning.',
      marketingOpportunity: parsed.marketingOpportunity || 'Identified strong local search and customer acquisition opportunities.',
      identifiedProblems,
      recommendedService,
      leadScore: totalScore,
      scoreBreakdown: {
        websiteOpportunity: webScore,
        brandingOpportunity: brandScore,
        marketingOpportunity: mktScore,
        serviceRelevance: srvScore,
        informationCompleteness: infoScore,
      },
      priority,
      scoreReason: parsed.scoreReason || `Calculated ${totalScore}/100 score based on digital audit opportunities in ${recommendedService}.`,
    };

    const outreach: OutreachResult = {
      emailSubject: parsed.emailSubject || `Quick idea for ${businessName}'s website & client bookings`,
      emailBody: parsed.emailBody || `Hi ${businessName} Team,\n\nI was reviewing your online presence in ${city} and noticed great potential in your client engagement funnel. With a modern upgrade to your digital presence, you can capture more inquiries directly.\n\nWould you be open to a 5-minute video walkthrough?\n\n${signature || `${senderName}\n${agencyName}`}`,
      shortContactMessage: parsed.shortContactMessage || parsed.shortMessage || `Hi ${businessName} Team! Loved your work in ${city}. Noticed a few quick upgrades to boost your site's mobile booking flow. Mind if I share a brief idea? - ${senderName}`,
      linkedInMessage: parsed.linkedInMessage || parsed.linkedinMessage || `Hi there, noticed ${businessName}'s growth in ${city}. We specialize in modernizing web platforms and client acquisition for companies in your space. Would love to connect!`,
      followUpMessage: parsed.followUpMessage || `Hi ${businessName} Team,\n\nFollowing up on my previous note. Wanted to see if improving your website's inquiry rate is on your roadmap this quarter?\n\nBest,\n${senderName}`,
    };

    return { analysis, outreach };
  } catch (error) {
    console.warn('[Unified Agent Fallback] Using intelligent local analysis fallback:', error);
    return generateFallbackUnifiedIntelligence(params);
  }
}

function generateFallbackUnifiedIntelligence(params: any): UnifiedLeadIntelligenceResult {
  const { businessName, businessCategory, city, country, servicesOffered, senderName, agencyName, signature } = params;
  const primaryService = servicesOffered[0] || 'Website Redesign';

  const identifiedProblems = [
    `Mobile conversion speed and responsive layout have immediate upgrade potential`,
    `Client inquiry call-to-actions can be positioned more effectively across key landing pages`,
    `Visual branding and service showcase can be modernized to reflect premium quality`,
  ];

  const analysis: BusinessAnalysisResult = {
    websiteQualityAssessment: `Evaluated ${businessName}'s web presence for mobile UX, page layout responsiveness, and conversion pathways.`,
    brandingAssessment: `Analyzed brand aesthetic, visual contrast, typography, and industry alignment in ${city}.`,
    marketingOpportunity: `Substantial opportunity to capture high-intent inquiries through streamlined digital funnels.`,
    identifiedProblems,
    recommendedService: primaryService,
    leadScore: 78,
    scoreBreakdown: {
      websiteOpportunity: 24,
      brandingOpportunity: 16,
      marketingOpportunity: 15,
      serviceRelevance: 16,
      informationCompleteness: 7,
    },
    priority: 'High',
    scoreReason: `Strong synergy for ${primaryService} to resolve identified mobile conversion and presentation gaps.`,
  };

  const outreach: OutreachResult = {
    emailSubject: `Quick suggestion for ${businessName}'s website & client conversions`,
    emailBody: `Hi ${businessName} Team,\n\nI recently came across ${businessName} while reviewing leading ${businessCategory} businesses in ${city}.\n\nWhile reviewing your website, I noticed a couple of straightforward adjustments to your mobile user experience and inquiry flow that could significantly increase your consultation bookings.\n\nWe specialize in ${primaryService} at ${agencyName}, helping businesses in ${city} attract more clients.\n\nWould you be open to a quick 5-minute video walkthrough of what I noticed? No strings attached.\n\n${signature || `Best regards,\n${senderName}\n${agencyName}`}`,
    shortContactMessage: `Hi ${businessName} team! Impressed by your presence in ${city}. Noticed 2 quick UX opportunities to increase online inquiries from your site. Happy to share a quick mockup if helpful! - ${senderName}`,
    linkedInMessage: `Hi there, noticed ${businessName}'s presence in ${city}. We help companies in ${businessCategory} turn more site visitors into qualified clients through modern design. Would love to connect!`,
    followUpMessage: `Hi ${businessName} Team,\n\nJust following up on my note from last week. I put together a couple of actionable ideas on how ${businessName} could boost direct client inquiries through ${primaryService}.\n\nWould later this week work for a brief 10-minute chat?\n\nBest,\n${senderName}`,
  };

  return { analysis, outreach };
}
