import { callGeminiResiliently, FREE_TIER_MODEL } from '../gemini.js';
import { ThinkingLevelSetting } from '../../src/types/index.js';
import { ThinkingLevel } from '@google/genai';

export interface OutreachResult {
  emailSubject: string;
  emailBody: string;
  shortContactMessage: string;
  linkedInMessage: string;
  followUpMessage: string;
  shortMessage?: string;
  linkedinMessage?: string;
}

export async function runOutreachGeneratorAgent(params: {
  businessName: string;
  businessCategory: string;
  city: string;
  country: string;
  website: string;
  identifiedProblems: string[];
  recommendedService: string;
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
}): Promise<OutreachResult> {
  const {
    businessName,
    businessCategory,
    city,
    country,
    website,
    identifiedProblems,
    recommendedService,
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

  const prompt = `You are an elite B2B Outreach Copywriter and Client Acquisition Strategist for a Web Development & Digital Marketing Agency.
${agentPrompt ? `SPECIALIZED AGENT INSTRUCTION & PERSONA:\n${agentPrompt}\n` : ''}

SENDER CONTEXT:
- Sender Name: ${senderName}
- Agency Name: ${agencyName}
${portfolioUrl ? `- Agency Portfolio URL: ${portfolioUrl}` : ''}
${bookingUrl ? `- Meeting Booking Link: ${bookingUrl}` : ''}
- Communication Tone: ${tone}
- Outreach Strategy: ${outreachStyle}

PROSPECT CONTEXT:
- Business Name: ${businessName}
- Industry: ${businessCategory}
- Location: ${city}, ${country}
- Website: ${website}
- Identified Business Opportunities/Pain Points:
${identifiedProblems.map((p) => `  * ${p}`).join('\n')}
- Recommended Service to Offer: ${recommendedService}

INSTRUCTIONS:
Generate 4 distinct, hyper-personalized outreach messages based strictly on the actual audit findings:
1. Personalized Cold Email:
   - Subject line: Punchy, curiosity-inducing, relevant to their business, under 9 words.
   - Body: 3 to 4 concise paragraphs. Cite the specific identified problems objectively. Never pretend you've previously talked. Present ${recommendedService} as the high-impact solution. End with a low-friction call to action (e.g., "Open to a 5-minute video breakdown this week?").
2. Short Contact Form / DM Message:
   - Extremely concise (under 60 words). Friendly and respectful.
3. LinkedIn Outreach Message:
   - Professional connection note or InMail (under 80 words).
4. Follow-Up Message:
   - 2 to 3 brief paragraphs checking in 4 to 5 days later with an additional helpful insight.

Return strictly valid JSON:
{
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
        'You write authentic, high-converting B2B cold emails and LinkedIn messages that provide genuine commercial value. You output strict JSON.',
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

    const shortMsg = parsed.shortContactMessage || parsed.shortMessage || `Hi ${businessName} team! Noticed a quick UX upgrade that could increase client bookings from your website. Open to seeing a brief mockup? - ${senderName}`;
    const linkedinMsg = parsed.linkedInMessage || parsed.linkedinMessage || `Hi there, noticed ${businessName}'s presence in ${city}. We help companies in your space increase digital conversions. Would love to connect!`;

    return {
      emailSubject: parsed.emailSubject || `Quick idea regarding ${businessName}'s website & online inquiries`,
      emailBody: parsed.emailBody || `Hi ${businessName} Team,\n\nI was looking through leading ${businessCategory} businesses in ${city} and noticed your work.\n\nWhile reviewing your website, I spotted a quick opportunity to optimize your mobile user experience and booking flow.\n\nWould you be open to a 5-minute video walkthrough?\n\n${signature || `${senderName}\n${agencyName}`}`,
      shortContactMessage: shortMsg,
      linkedInMessage: linkedinMsg,
      shortMessage: shortMsg,
      linkedinMessage: linkedinMsg,
      followUpMessage: parsed.followUpMessage || `Hi ${businessName} Team,\n\nFollowing up on my previous note. Wanted to check if upgrading your website's inquiry flow is on your radar this month?\n\nBest,\n${senderName}`,
    };
  } catch (error) {
    console.warn('[Outreach Fallback] Using heuristic copy:', error);
    const shortFallback = `Hi ${businessName} team! Impressed by your work in ${city}. Noticed 2 quick UX opportunities to increase online inquiries from your site. Happy to share a quick mockup! - ${senderName}`;
    const linkedinFallback = `Hi there, noticed ${businessName}'s growth in ${city}. We help businesses turn more site visitors into qualified clients through modern design. Would love to connect!`;
    return {
      emailSubject: `Quick idea for ${businessName}'s website & client conversions`,
      emailBody: `Hi ${businessName} Team,\n\nI was reviewing ${businessCategory} leaders in ${city} and came across ${businessName}.\n\nWhile reviewing your online presence, I noticed a couple of straightforward adjustments to your mobile user experience and inquiry flow that could significantly increase your client bookings.\n\nWe specialize in ${recommendedService} at ${agencyName}, helping businesses in ${city} attract more clients.\n\nWould you be open to a quick 5-minute video walkthrough of what I noticed? No strings attached.\n\n${signature || `Best regards,\n${senderName}\n${agencyName}`}`,
      shortContactMessage: shortFallback,
      linkedInMessage: linkedinFallback,
      shortMessage: shortFallback,
      linkedinMessage: linkedinFallback,
      followUpMessage: `Hi ${businessName} Team,\n\nJust following up on my note from last week. I put together a couple of actionable ideas on how ${businessName} could boost direct client inquiries.\n\nWould later this week work for a brief 10-minute chat?\n\nBest,\n${senderName}`,
    };
  }
}
