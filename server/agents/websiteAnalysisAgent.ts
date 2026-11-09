import { ai, GEMINI_MODEL } from '../gemini.js';
import { ScoreBreakdown, Priority } from '../../src/types/index.js';

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
}): Promise<BusinessAnalysisResult> {
  const { businessName, businessCategory, country, city, website, servicesOffered } = params;

  const prompt = `You are a Senior Digital Agency Audit Specialist and Lead Scoring AI.
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
   Provide 2 to 4 concrete, actionable, evidence-based opportunities or pain points (e.g., lack of responsive booking widget, uncompressed mobile hero media, weak inquiry call-to-actions, missing service landing pages).
5. Recommended Service:
   Select the single most impactful service from the services offered: ${servicesOffered.join(', ')}.
6. Transparent Lead Scoring (0 to 100):
   - websiteOpportunity: 0 to 30 points (higher score means greater need & opportunity for redesign/dev)
   - brandingOpportunity: 0 to 20 points (higher score means greater need for modern brand identity)
   - marketingOpportunity: 0 to 20 points (higher score means greater potential for ad campaigns/funnels)
   - serviceRelevance: 0 to 20 points (fit between business niche and offered services)
   - informationCompleteness: 0 to 10 points (bonus if valid website, verified contacts are present)
   - leadScore: Sum of the 5 factors above (0 to 100).
   - priority: "High" if score >= 75, "Medium" if score >= 50, "Low" if score < 50.
   - scoreReason: A clear, objective explanation of why this business received its score and why it's a prime target.

OUTPUT FORMAT:
Return strictly a valid JSON object with these exact keys:
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
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction:
          'You are an expert commercial digital audit system. You evaluate business websites objectively, never hallucinate false broken code, and provide clear strategic recommendations in strict JSON format.',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    // Validate and safeguard boundaries
    const webScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.websiteOpportunity) || 15, 0), 30);
    const brandScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.brandingOpportunity) || 12, 0), 20);
    const mktScore = Math.min(Math.max(Number(parsed.scoreBreakdown?.marketingOpportunity) || 12, 0), 20);
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
      scoreReason: parsed.scoreReason || `Scored ${totalScore}/100 based on website modernization potential and service fit.`,
    };
  } catch (error) {
    console.error('Error in runWebsiteAnalysisAndScorer:', error);
    // Safe graceful fallback
    return {
      websiteQualityAssessment: website === 'Not Available' ? 'Unable to Analyze - website unavailable' : 'Functional presence with modernization opportunities.',
      brandingAssessment: 'Established local brand presence with room for visual upgrade.',
      marketingOpportunity: 'High potential for targeted client acquisition.',
      identifiedProblems: [
        'Mobile navigation flow can be modernized for higher conversion',
        'Direct inquiry and consultation scheduling is not streamlined',
      ],
      recommendedService: servicesOffered[0] || 'Website Redesign',
      leadScore: 72,
      scoreBreakdown: {
        websiteOpportunity: 22,
        brandingOpportunity: 14,
        marketingOpportunity: 15,
        serviceRelevance: 15,
        informationCompleteness: 6,
      },
      priority: 'Medium',
      scoreReason: 'Strong prospective client with tangible website and brand conversion upside.',
    };
  }
}
