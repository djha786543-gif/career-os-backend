"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiGenerate = geminiGenerate;
const generative_ai_1 = require("@google/generative-ai");
let _genAI = null;
function getGenAI() {
    const key = process.env.GEMINI_API_KEY;
    if (!key)
        throw new Error('GEMINI_API_KEY not configured');
    if (!_genAI)
        _genAI = new generative_ai_1.GoogleGenerativeAI(key);
    return _genAI;
}
/**
 * Generate content using Gemini 2.5 Flash.
 * @param systemPrompt  System-level instructions
 * @param userPrompt    User message / task
 * @param maxTokens     Max output tokens (default 2000)
 */
async function geminiGenerate(systemPrompt, userPrompt, maxTokens = 2000) {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: systemPrompt,
        generationConfig: { maxOutputTokens: maxTokens },
    });
    const result = await model.generateContent(userPrompt);
    const response = result.response;
    return response.text();
}
