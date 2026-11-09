import { GoogleGenAI } from '@google/genai';

// Initialize the shared server-side Google GenAI client
// Per system skill instructions:
// - Always call from server-side
// - Include User-Agent: 'aistudio-build'
// - Access process.env.GEMINI_API_KEY
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export const FREE_TIER_MODEL = 'gemini-3.1-flash-lite';
export const STANDARD_MODEL = 'gemini-3.8-flash';
export const GEMINI_MODEL = FREE_TIER_MODEL;

interface ResilientCallParams {
  model?: string;
  contents: any;
  config?: any;
  enableSearch?: boolean;
  maxRetries?: number;
  fallbackToLiteOnQuota?: boolean;
}

export interface ResilientCallResult {
  text: string;
  candidates?: any[];
  modelUsed: string;
  usedSearch: boolean;
}

/**
 * Executes a Gemini model call with automatic Free-Tier quota protection:
 * 1. Handles 429 (RESOURCE_EXHAUSTED) by retrying with exponential backoff.
 * 2. If Google Search Grounding tool is rejected due to free tier search quota (429),
 *    immediately retries without search tools to ensure zero campaign interruptions.
 * 3. If a heavy or high-demand model (gemini-3.8-flash, gemini-4-argon) hits 429 or 503,
 *    automatically falls back to gemini-3.1-flash-lite (high RPM free tier model).
 */
export async function callGeminiResiliently(params: ResilientCallParams): Promise<ResilientCallResult> {
  const {
    model: requestedModel = FREE_TIER_MODEL,
    contents,
    config = {},
    enableSearch = false,
    maxRetries = 2,
    fallbackToLiteOnQuota = true,
  } = params;

  let currentModel = requestedModel;
  let useSearch = enableSearch;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const callConfig = { ...config };
      if (useSearch) {
        callConfig.tools = [{ googleSearch: {} }];
      } else if (callConfig.tools) {
        delete callConfig.tools;
      }

      const response = await ai.models.generateContent({
        model: currentModel,
        contents,
        config: callConfig,
      });

      return {
        text: response.text || '',
        candidates: response.candidates,
        modelUsed: currentModel,
        usedSearch: useSearch,
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuotaError = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
      const isUnavailable = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand');
      const isArgonPaidOnly = currentModel === 'gemini-4-argon' && isQuotaError;

      console.warn(`[Gemini Resilient Call] Attempt ${attempt + 1}/${maxRetries + 1} failed with ${currentModel} (search: ${useSearch}):`, errMsg.slice(0, 150));

      // 1. If Google Search Grounding caused a 429 (very common on free tier), disable search and immediately retry
      if (useSearch && (isQuotaError || isUnavailable)) {
        console.warn(`[Gemini Free Tier Shield] Google Search quota exhausted on free key. Falling back to direct model intelligence.`);
        useSearch = false;
        // Don't count as a retry penalty; immediately proceed to next loop iteration
        continue;
      }

      // 2. If a non-lite model (3.8-flash or 4-argon) hits 429 or 503, switch to gemini-3.1-flash-lite
      if (fallbackToLiteOnQuota && currentModel !== FREE_TIER_MODEL && (isQuotaError || isUnavailable || isArgonPaidOnly)) {
        console.warn(`[Gemini Free Tier Shield] Switching model from ${currentModel} to ${FREE_TIER_MODEL} to avoid rate limit.`);
        currentModel = FREE_TIER_MODEL;
        // Brief pause to clear any burst
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }

      // 3. If still failing on quota/503, wait with exponential backoff
      if (attempt < maxRetries) {
        const backoffMs = 1500 * Math.pow(1.6, attempt) + Math.floor(Math.random() * 400);
        console.warn(`[Gemini Free Tier Shield] Backing off for ${backoffMs}ms before retry...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      } else {
        // Last attempt failed
        throw err;
      }
    }
  }

  throw new Error('Gemini API call failed after retries.');
}
