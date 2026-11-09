import { ai, GEMINI_MODEL } from '../gemini.js';
import { OutreachMessages } from '../../src/types/index.js';

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
  customInstructions?: string;
}): Promise<OutreachMessages> {
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
    customInstructions,
  } = params;

  const prompt = `You are a world-class B2B Cold Outreach and Client Acquisition Copywriter.
Draft personalized, non-spammy, highly professional outreach messages for a digital agency pitching services to a real prospective business.

PROSPECT DETAILS:
- Business Name: ${businessName}
- Industry: ${businessCategory}
- Location: ${city}, ${country}
- Website: ${website}
- Identified Improvement Areas: ${identifiedProblems.join('; ')}
- Recommended Service to Offer: ${recommendedService}

MY SERVICE PROVIDER DETAILS:
- My Name: ${senderName || 'Dawood Ahmed'}
- My Agency: ${agencyName || 'Apex Web & Digital Growth'}
- Portfolio Link: ${portfolioUrl || 'https://apexwebstudios.agency'}
- Meeting/Booking Link: ${bookingUrl || ''}
- Signature preference: ${signature || `Best regards,\n${senderName || 'Dawood Ahmed'}\n${agencyName || 'Apex Web & Digital Growth'}`}

${customInstructions ? `USER REGENERATION INSTRUCTION: "${customInstructions}"` : ''}

RULES FOR OUTREACH:
1. Professional, respectful, and concise (under 160 words for the email body).
2. Never claim we have previously spoken or worked together if we haven't.
3. Reference real, tangible observations from the identified improvement areas (e.g., mobile responsiveness, booking friction, visual refresh).
4. No fake hype, clickbait, or aggressive sales tactics.
5. Offer genuine value (e.g., a 2-minute video mockup, brief audit, or quick 10-minute preview call).
6. Naturally include the recommended service (${recommendedService}).

OUTPUT REQUIREMENTS:
Return strictly a valid JSON object with:
- "emailSubject": Catchy, short, tailored subject line (e.g., "Quick idea for [Business Name]'s mobile portfolio", "Enhancing client inquiry flow for [Business Name]").
- "emailBody": Complete, well-structured email with greeting, specific praise/observation, concrete value proposition, low-friction CTA, and sender signature.
- "shortContactMessage": Compact 2-3 sentence note suitable for a website contact form or Instagram/social direct message.
- "linkedInMessage": Crisp connection request / message (under 300 characters) referencing mutual industry focus and specific observation.
- "followUpMessage": Polite follow-up message to send 3-5 days later if no response was received.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        systemInstruction:
          'You write authentic, high-converting B2B outreach messages that sound like a thoughtful senior agency director. You output strict JSON without conversational markdown wrappers.',
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    return {
      emailSubject: parsed.emailSubject || `Modernizing ${businessName}'s digital client experience`,
      emailBody:
        parsed.emailBody ||
        `Hi ${businessName} team,\n\nI recently came across your work in ${city} and was really impressed by your portfolio.\n\nWhile reviewing your website, I noticed a quick opportunity to enhance your mobile inquiry flow and streamline how prospective clients book consultations.\n\nWe specialize in ${recommendedService} for top-tier ${businessCategory} practices. Would you be open to a 10-minute preview of a few design concepts we put together for you?\n\n${signature || `Best regards,\n${senderName}\n${agencyName}`}`,
      shortContactMessage:
        parsed.shortContactMessage ||
        `Hi ${businessName} team! Big admirers of your work in ${city}. We put together a brief proposal on streamlining your online inquiry flow and mobile portfolio: ${portfolioUrl || ''}`,
      linkedInMessage:
        parsed.linkedInMessage ||
        `Hi team - impressed by your work at ${businessName}. We help leading practices in ${city} upgrade their digital conversion funnels. Would love to connect and share a few ideas!`,
      followUpMessage:
        parsed.followUpMessage ||
        `Hi team, following up on my previous note regarding modernizing the digital showcase for ${businessName}. We just rolled out a new mobile framework that doubled inquiries for a similar firm. Happy to share a quick preview if helpful!`,
    };
  } catch (error) {
    console.error('Error in runOutreachGeneratorAgent:', error);
    return {
      emailSubject: `Ideas for ${businessName}'s online presence`,
      emailBody: `Hi ${businessName} team,\n\nI was reviewing your website and noticed some great opportunities to optimize your mobile user experience and client inquiry flow.\n\nAt ${agencyName}, we help businesses in ${city} scale through ${recommendedService}.\n\nWould you be open to a short 10-minute chat this week?\n\nBest regards,\n${senderName}\n${agencyName}`,
      shortContactMessage: `Hi ${businessName} team, loved your work in ${city}. Sent you a quick note on optimizing your client inquiry experience!`,
      linkedInMessage: `Hi team - love the work at ${businessName}. Would love to connect and share some insights on ${recommendedService}.`,
      followUpMessage: `Hi team, following up on my previous message. Let me know if you would like me to share a 2-minute preview of the website recommendations!`,
    };
  }
}
