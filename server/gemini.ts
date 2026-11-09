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

export const GEMINI_MODEL = 'gemini-3.8-flash';
