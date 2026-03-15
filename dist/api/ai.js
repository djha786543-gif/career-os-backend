"use strict";
/**
 * api/ai.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/ai/skill       — Skill gap & learning analysis
 * POST /api/ai/trend       — Market trend radar (web_search grounded)
 * POST /api/ai/pathway     — Cert / learning pathway generator
 * POST /api/ai/track       — Structured learning track
 * POST /api/ai/vault-entry — Prep Vault entry generator
 * POST /api/ai/assist      — Cover letter / interview / skill gap (per-job)
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const cache_1 = require("../utils/cache");
const router = express_1.default.Router();
const MODEL = 'claude-sonnet-4-6';
// ─── Profile context strings ──────────────────────────────────────────────────
const PROFILE_CONTEXT = {
    dj: `IT Audit Manager, CISA certified, 10+ years experience, EY alumni, Public Storage Corp.
Skills: SOX 404, ITGC, AI Governance, AWS Cloud Audit, NIST AI RMF, ISO 42001.
Target: AI Audit Director / CISO. Active cert: AAIA (March 2026).`,
    pj: `Postdoctoral Researcher, Cardiovascular & Molecular Biology. Nature Communications author.
Skills: NGS, qPCR, scRNA-seq, CRISPR, ChIP-seq. Target: Research Scientist / PI track.
Active cert: ASCP Molecular Biology (May 2026).`,
};
function getAnthropicClient() {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key)
        throw new Error('ANTHROPIC_API_KEY not configured');
    return new sdk_1.default({ apiKey: key });
}
function resolveProfile(raw) {
    const p = (raw || '').toLowerCase().trim();
    if (p === 'pj' || p === 'pooja')
        return 'pj';
    return 'dj';
}
function cacheKey(prefix, profile, extra) {
    return `${prefix}:${profile}:${extra || '_'}`;
}
// ─── POST /api/ai/skill ───────────────────────────────────────────────────────
router.post('/skill', async (req, res) => {
    const profile = resolveProfile(req.body.profile);
    const mode = req.body.mode || 'immediate';
    const query = req.body.query;
    const keyExtra = query
        ? `custom_${Buffer.from(query).toString('base64').slice(0, 20)}`
        : mode;
    const ck = cacheKey('skill', profile, keyExtra);
    const cached = (0, cache_1.getCache)(ck);
    if (cached)
        return res.json({ result: cached, cached: true, profile });
    const modePrompts = {
        immediate: 'List the 5 highest-impact skills to learn THIS MONTH for maximum job interview success. Be specific with resources and time estimates.',
        strategic: 'Outline a 6-12 month strategic skill development roadmap with milestones. Focus on certifications, tools, and domain expertise gaps.',
        emerging: 'Identify 5 emerging skills in this field that will be critical in 2026-2027. Explain why each matters and how to start building them now.',
        salary: 'Analyze which specific skills command the highest salary premium. Give specific $ ranges and the fastest paths to acquire them.',
    };
    const userPrompt = query
        ? `Custom skill analysis request: ${query}\n\nProvide a concise, actionable response.`
        : (modePrompts[mode] || modePrompts.immediate);
    try {
        const client = getAnthropicClient();
        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 1500,
            system: `You are a career intelligence engine for a ${profile === 'dj' ? 'cybersecurity/IT audit' : 'biomedical research'} professional.\n\nProfile: ${PROFILE_CONTEXT[profile]}\n\nReturn concise, actionable advice. Use bullet points. No fluff.`,
            messages: [{ role: 'user', content: userPrompt }],
        });
        const text = msg.content.find(b => b.type === 'text')?.text || '';
        (0, cache_1.setCache)(ck, text, 6 * 3600);
        return res.json({ result: text, cached: false, profile });
    }
    catch (err) {
        console.error('[/api/ai/skill]', err.message);
        if (!res.headersSent)
            return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }
});
// ─── POST /api/ai/trend ───────────────────────────────────────────────────────
router.post('/trend', async (req, res) => {
    const profile = resolveProfile(req.body.profile);
    const mode = req.body.mode || '6months';
    const ck = cacheKey('trend', profile, mode);
    const cached = (0, cache_1.getCache)(ck);
    if (cached)
        return res.json({ result: cached, cached: true, profile });
    const modePrompts = {
        '6months': 'What are the top 5 job market trends in this field over the next 6 months? Include hiring demand signals, compensation trends, and role evolution.',
        disruption: 'What technologies or forces are disrupting this field RIGHT NOW in 2026? What skills become obsolete vs. essential?',
        opportunity: 'Where are the highest-value career opportunities and underserved niches in this field right now? Focus on 2026 job market reality.',
    };
    try {
        const client = getAnthropicClient();
        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 1500,
            system: `You are a career intelligence engine with real-time market awareness. Profile: ${PROFILE_CONTEXT[profile]}\n\nBase your analysis on 2026 market conditions. Be specific, data-driven, and actionable.`,
            messages: [{ role: 'user', content: modePrompts[mode] || modePrompts['6months'] }],
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        });
        const text = msg.content.find(b => b.type === 'text')?.text || '';
        (0, cache_1.setCache)(ck, text, 6 * 3600);
        return res.json({ result: text, cached: false, profile });
    }
    catch (err) {
        console.error('[/api/ai/trend]', err.message);
        if (!res.headersSent)
            return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }
});
// ─── POST /api/ai/pathway ─────────────────────────────────────────────────────
router.post('/pathway', async (req, res) => {
    const profile = resolveProfile(req.body.profile);
    const targetRole = req.body.targetRole || '';
    const timeline = req.body.timeline || '6 months';
    const ck = cacheKey('pathway', profile, `${targetRole}_${timeline}`.slice(0, 40));
    const cached = (0, cache_1.getCache)(ck);
    if (cached)
        return res.json({ result: cached, cached: true, profile });
    try {
        const client = getAnthropicClient();
        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 2000,
            system: `You are a career pathway architect. Profile: ${PROFILE_CONTEXT[profile]}`,
            messages: [{
                    role: 'user',
                    content: `Create a detailed certification and learning pathway to reach the role of "${targetRole}" within ${timeline}.\n\nInclude:\n- Required certifications (with exam details, cost, prep time)\n- Recommended courses/platforms\n- Milestone checkpoints\n- Common pitfalls to avoid\n\nBe specific and realistic for 2026.`,
                }],
        });
        const text = msg.content.find(b => b.type === 'text')?.text || '';
        (0, cache_1.setCache)(ck, text, 24 * 3600);
        return res.json({ result: text, cached: false, profile });
    }
    catch (err) {
        console.error('[/api/ai/pathway]', err.message);
        if (!res.headersSent)
            return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }
});
// ─── POST /api/ai/track ───────────────────────────────────────────────────────
router.post('/track', async (req, res) => {
    const profile = resolveProfile(req.body.profile);
    const query = req.body.query || 'Build a structured learning track for my target role';
    const ck = cacheKey('track', profile, Buffer.from(query).toString('base64').slice(0, 30));
    const cached = (0, cache_1.getCache)(ck);
    if (cached)
        return res.json({ result: cached, cached: true, profile });
    try {
        const client = getAnthropicClient();
        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 2000,
            system: `You are a structured learning architect. Profile: ${PROFILE_CONTEXT[profile]}\n\nCreate practical, week-by-week learning tracks.`,
            messages: [{ role: 'user', content: query }],
        });
        const text = msg.content.find(b => b.type === 'text')?.text || '';
        (0, cache_1.setCache)(ck, text, 12 * 3600);
        return res.json({ result: text, cached: false, profile });
    }
    catch (err) {
        console.error('[/api/ai/track]', err.message);
        if (!res.headersSent)
            return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }
});
// ─── POST /api/ai/vault-entry ─────────────────────────────────────────────────
router.post('/vault-entry', async (req, res) => {
    const profile = resolveProfile(req.body.profile);
    const topic = req.body.topic || '';
    const type = req.body.type || 'full';
    const ck = cacheKey('vault', profile, `${topic}_${type}`.slice(0, 40));
    const cached = (0, cache_1.getCache)(ck);
    if (cached)
        return res.json({ result: cached, cached: true, profile });
    const typeInstructions = {
        full: 'Provide a comprehensive study guide with key concepts, definitions, frameworks, and practice questions.',
        traps: 'List the top 10 common exam traps and mistakes. For each: what people think the answer is, what it actually is, and why.',
        compare: 'Create a comparison matrix of related concepts. Use tables where helpful.',
        flashcards: 'Generate 15 flashcard-style Q&A pairs. Format: Q: [question] / A: [concise answer]',
        mnemonics: 'Create memorable mnemonics, acronyms, and memory anchors for the key concepts. Make them vivid and sticky.',
    };
    try {
        const client = getAnthropicClient();
        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 2500,
            system: `You are an expert exam prep coach. Profile: ${PROFILE_CONTEXT[profile]}\n\nFocus on exam-ready, memorable content.`,
            messages: [{
                    role: 'user',
                    content: `Topic: ${topic}\n\nInstruction: ${typeInstructions[type] || typeInstructions.full}`,
                }],
        });
        const text = msg.content.find(b => b.type === 'text')?.text || '';
        (0, cache_1.setCache)(ck, text, 6 * 3600);
        return res.json({ result: text, cached: false, profile });
    }
    catch (err) {
        console.error('[/api/ai/vault-entry]', err.message);
        if (!res.headersSent)
            return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }
});
// ─── POST /api/ai/assist ──────────────────────────────────────────────────────
// Personalized per-job — NO caching
router.post('/assist', async (req, res) => {
    const profile = resolveProfile(req.body.profile);
    const mode = req.body.mode || 'coverletter';
    const job = req.body.job || {};
    const modeInstructions = {
        coverletter: `Write a compelling 3-paragraph cover letter for this job.
Tone: confident, specific, not generic. Reference the company by name.
Para 1: Hook — why this role at this company specifically.
Para 2: Top 2-3 matching achievements with specific metrics.
Para 3: Forward-looking close with availability.
Keep under 300 words.`,
        interview: `Generate the top 10 most likely interview questions for this role with ideal answer frameworks.
For each: the question, why they ask it, and a STAR-format answer outline using the candidate's real background.`,
        skillgap: `Perform a skill gap analysis comparing the candidate's profile to this job's requirements.
Format: ✅ Strong match | ⚠️ Partial match | ❌ Gap — for each requirement.
End with the top 3 actions to close the most critical gaps before applying.`,
    };
    try {
        const client = getAnthropicClient();
        const msg = await client.messages.create({
            model: MODEL,
            max_tokens: 1000,
            system: `You are a career coach. Profile: ${PROFILE_CONTEXT[profile]}`,
            messages: [{
                    role: 'user',
                    content: `Job: ${job.title || 'Unknown Role'} at ${job.company || 'Unknown Company'}
Description snippet: ${job.snippet || 'Not provided'}
Key skills required: ${(job.keySkills || []).join(', ') || 'Not specified'}

${modeInstructions[mode] || modeInstructions.coverletter}`,
                }],
        });
        const text = msg.content.find(b => b.type === 'text')?.text || '';
        return res.json({ result: text, cached: false, profile });
    }
    catch (err) {
        console.error('[/api/ai/assist]', err.message);
        if (!res.headersSent)
            return res.status(502).json({ error: 'AI service temporarily unavailable' });
    }
});
exports.default = router;
