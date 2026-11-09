import { ai, GEMINI_MODEL } from '../gemini.js';

export interface DiscoveredBusinessRaw {
  businessName: string;
  businessCategory: string;
  country: string;
  city: string;
  website: string;
  email: string;
  phone: string;
  address?: string;
  researchSource: string;
}

export async function runBusinessDiscoveryAgent(params: {
  country: string;
  city: string;
  businessNiche: string;
  targetCount: number;
}): Promise<DiscoveredBusinessRaw[]> {
  const { country, city, businessNiche, targetCount } = params;
  const count = Math.min(Math.max(targetCount, 2), 15);

  const prompt = `Search the live web using Google Search to discover real, operating businesses matching this target:
- Country: ${country}
- City or Region: ${city}
- Business Niche / Industry: ${businessNiche}
- Desired count: ${count} real businesses

CRITICAL REQUIREMENTS:
1. ONLY return REAL businesses currently operating in ${city}, ${country}.
2. Provide their REAL official website domain or URL.
3. If public business contact email or phone number is publicly visible on their website or directory listings, include it. If not found, explicitly put "Not Available".
4. NEVER invent fake businesses, mock URLs (like "testfirm.com" or "example.com"), or fictional emails.
5. Provide the verified source URL where the business or website was verified.

Return your response strictly as a JSON array of objects with the following keys for each business:
- "businessName": string (Official registered or trading name)
- "businessCategory": string (Specific industry/specialization)
- "country": string ("${country}")
- "city": string ("${city}")
- "website": string (Official website starting with https:// or http://, or "Not Available")
- "email": string (Public business email or "Not Available")
- "phone": string (Public business phone or "Not Available")
- "address": string (Physical office address or "Not Available")
- "researchSource": string (Source URL or domain where found)`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are an expert commercial business intelligence agent. You search live web data via Google Search to locate genuine, authentic businesses. You output pure, valid JSON arrays with no markdown conversation or preamble.',
      },
    });

    const rawText = response.text || '';
    const businesses = parseJsonArray<DiscoveredBusinessRaw>(rawText);

    // Also enrich with grounding sources if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sourceUrls: string[] = [];
    if (groundingChunks && Array.isArray(groundingChunks)) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sourceUrls.push(chunk.web.uri);
        }
      });
    }

    if (businesses.length > 0) {
      return businesses.map((b, i) => ({
        ...b,
        researchSource:
          b.researchSource && b.researchSource !== 'Not Available'
            ? b.researchSource
            : sourceUrls[i % Math.max(1, sourceUrls.length)] || `Google Search Grounding (${b.city}, ${b.country})`,
      }));
    }

    // Fallback if parsing returned empty
    return [];
  } catch (error) {
    console.error('Error in runBusinessDiscoveryAgent:', error);
    throw error;
  }
}

function parseJsonArray<T>(text: string): T[] {
  try {
    // Strip code fence if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse JSON array from model output directly:', err);
  }
  return [];
}
