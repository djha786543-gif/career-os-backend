/**
 * geminiClient.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Gemini Flash client for long-form content generation:
 *   - Skill Engine analysis (all 4 modes)
 *   - Prep Vault AI generator
 *   - Learning Track generator
 *   - AI Assist (cover letter, interview prep, skill gap)
 *
 * Requires env var: GEMINI_API_KEY
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not configured');
  if (!_genAI) _genAI = new GoogleGenerativeAI(key);
  return _genAI;
}

/**
 * Generate content using Gemini 2.5 Flash.
 * @param systemPrompt  System-level instructions
 * @param userPrompt    User message / task
 * @param maxTokens     Max output tokens (default 2000)
 */
export async function geminiGenerate(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-lite',
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: maxTokens },
  });

  const result = await model.generateContent(userPrompt);
  const response = result.response;
  return response.text();
}
