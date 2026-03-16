"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSkillsAI = extractSkillsAI;
const axios_1 = __importDefault(require("axios"));
// Use OpenAI or HuggingFace to extract skills from job description
async function extractSkillsAI(description) {
    // Example using OpenAI API (replace with your key and endpoint)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey)
        throw new Error('OPENAI_API_KEY not set');
    const prompt = `Extract a list of relevant skills from this job description:\n${description}`;
    const { data } = await axios_1.default.post('https://api.openai.com/v1/completions', {
        model: 'gpt-3.5-turbo-instruct',
        prompt,
        max_tokens: 64,
        temperature: 0.2
    }, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    // Parse response (assume comma-separated skills)
    const skills = data.choices?.[0]?.text?.split(',').map((s) => s.trim()).filter(Boolean) || [];
    return skills;
}
