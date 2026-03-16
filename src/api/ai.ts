/**
 * api/ai.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/ai/skill       — Skill gap & learning analysis        → Gemini Flash
 * POST /api/ai/trend       — Market trend radar (web_search)      → Claude
 * POST /api/ai/pathway     — Cert / learning pathway generator    → DeepSeek
 * POST /api/ai/track       — Structured learning track            → DeepSeek
 * POST /api/ai/vault-entry — Prep Vault entry generator           → Gemini Flash
 * POST /api/ai/assist      — Cover letter / interview / skill gap → Gemini Flash
 * POST /api/ai/clear-cache — Manual cache clear                   → (no AI)
 *
 * Three-model routing:
 *   Claude   — web_search endpoints only (trend radar)
 *   DeepSeek — structured JSON / pathway tasks
 *   Gemini   — long-form content generation
 *
 * Cache TTLs (aggressive caching to minimise API costs):
 *   skill:       24h    (86400s)  — profile skill analysis changes daily at most
 *   trend:       24h    (86400s)  — market trends don't shift hour-to-hour
 *   pathway:     7 days (604800s) — cert pathways are stable week-to-week
 *   track:       7 days (604800s) — learning tracks are stable week-to-week
 *   vault-entry: 30 days(2592000s)— exam prep content is evergreen
 *   assist:      none             — personalised per-job, never cached
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express, { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { getCache, setCache, deleteCache } from '../utils/cache';
import { geminiGenerate }   from '../services/geminiClient';
import { deepseekGenerate } from '../services/deepseekClient';

const router = express.Router();

// ─── Cache TTL constants ──────────────────────────────────────────────────────
const TTL = {
  skill:      86400,    // 24 hours   — changes daily
  trend:      86400,    // 24 hours   — market data, cached per profile+mode
  pathway:    604800,   // 7 days     — cert pathways are stable
  track:      604800,   // 7 days     — learning tracks are stable
  vaultEntry: 2592000,  // 30 days    — exam prep content is evergreen
};

// ─── Profile context strings ──────────────────────────────────────────────────
const PROFILE_CONTEXT = {
  dj: `IT Audit Manager, CISA certified, 10+ years experience, EY alumni, Public Storage Corp.
Skills: SOX 404, ITGC, AI Governance, AWS Cloud Audit, NIST AI RMF, ISO 42001.
Target: AI Audit Director / CISO. Active cert: AAIA (March 2026).`,
  pj: `Postdoctoral Researcher, Cardiovascular & Molecular Biology. Nature Communications author.
Skills: NGS, qPCR, scRNA-seq, CRISPR, ChIP-seq. Target: Research Scientist / PI track.
Active cert: ASCP Molecular Biology (May 2026).`,
};

function getAnthropicClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
  return new Anthropic({ apiKey: key });
}

function resolveProfile(raw?: string): 'dj' | 'pj' {
  const p = (raw || '').toLowerCase().trim();
  if (p === 'pj' || p === 'pooja') return 'pj';
  return 'dj';
}

function cacheKey(prefix: string, profile: string, extra?: string): string {
  return `${prefix}:${profile}:${extra || '_'}`;
}

// ─── POST /api/ai/skill  →  Gemini Flash ─────────────────────────────────────
router.post('/skill', async (req: Request, res: Response) => {
  const profile = resolveProfile(req.body.profile);
  const mode: string = req.body.mode || 'immediate';
  const query: string | undefined = req.body.query;

  const keyExtra = query
    ? `custom_${Buffer.from(query).toString('base64').slice(0, 20)}`
    : mode;
  const ck = cacheKey('skill', profile, keyExtra);

  const cached = getCache(ck) as string | undefined;
  if (cached) return res.json({ result: cached, cached: true, profile, model: 'gemini' });

  const modePrompts: Record<string, string> = {
    immediate: 'List the 5 highest-impact skills to learn THIS MONTH for maximum job interview success. Be specific with resources and time estimates.',
    strategic: 'Outline a 6-12 month strategic skill development roadmap with milestones. Focus on certifications, tools, and domain expertise gaps.',
    emerging:  'Identify 5 emerging skills in this field that will be critical in 2026-2027. Explain why each matters and how to start building them now.',
    salary:    'Analyze which specific skills command the highest salary premium. Give specific $ ranges and the fastest paths to acquire them.',
  };

  const userPrompt = query
    ? `Custom skill analysis request: ${query}\n\nProvide a concise, actionable response.`
    : (modePrompts[mode] || modePrompts.immediate);

  try {
    const systemPrompt = `You are a career intelligence engine for a ${profile === 'dj' ? 'cybersecurity/IT audit' : 'biomedical research'} professional.\n\nProfile: ${PROFILE_CONTEXT[profile]}\n\nReturn concise, actionable advice. Use bullet points. No fluff.`;
    const text = await geminiGenerate(systemPrompt, userPrompt, 1500);
    setCache(ck, text, TTL.skill);
    return res.json({ result: text, cached: false, profile, model: 'gemini' });
  } catch (err: any) {
    console.error('[/api/ai/skill]', err.message);
    if (!res.headersSent) return res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// ─── POST /api/ai/trend  →  Claude (web_search required) ─────────────────────
router.post('/trend', async (req: Request, res: Response) => {
  const profile = resolveProfile(req.body.profile);
  const mode: string = req.body.mode || '6months';

  const ck = cacheKey('trend', profile, mode);
  const cached = getCache(ck) as string | undefined;
  if (cached) return res.json({ result: cached, cached: true, profile, model: 'claude' });

  const modePrompts: Record<string, string> = {
    '6months':   'What are the top 5 job market trends in this field over the next 6 months? Include hiring demand signals, compensation trends, and role evolution.',
    disruption:  'What technologies or forces are disrupting this field RIGHT NOW in 2026? What skills become obsolete vs. essential?',
    opportunity: 'Where are the highest-value career opportunities and underserved niches in this field right now? Focus on 2026 job market reality.',
  };

  try {
    const client = getAnthropicClient();
    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 1500,
      system:     `You are a career intelligence engine with real-time market awareness. Profile: ${PROFILE_CONTEXT[profile]}\n\nBase your analysis on 2026 market conditions. Be specific, data-driven, and actionable.`,
      messages:   [{ role: 'user', content: modePrompts[mode] || modePrompts['6months'] }],
      tools:      [{ type: 'web_search_20250305' as any, name: 'web_search' }],
    });

    const text = msg.content.find(b => b.type === 'text')?.text || '';
    setCache(ck, text, TTL.trend);
    return res.json({ result: text, cached: false, profile, model: 'claude' });
  } catch (err: any) {
    console.error('[/api/ai/trend]', err.message);
    if (!res.headersSent) return res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// ─── POST /api/ai/pathway  →  DeepSeek ───────────────────────────────────────
router.post('/pathway', async (req: Request, res: Response) => {
  const profile    = resolveProfile(req.body.profile);
  const targetRole: string = req.body.targetRole || '';
  const timeline: string   = req.body.timeline   || '6 months';

  const ck = cacheKey('pathway', profile, `${targetRole}_${timeline}`.slice(0, 40));
  const cached = getCache(ck) as string | undefined;
  if (cached) return res.json({ result: cached, cached: true, profile, model: 'deepseek' });

  try {
    const systemPrompt = `You are a career pathway architect. Profile: ${PROFILE_CONTEXT[profile]}`;
    const userPrompt = `Create a detailed certification and learning pathway to reach the role of "${targetRole}" within ${timeline}.\n\nInclude:\n- Required certifications (with exam details, cost, prep time)\n- Recommended courses/platforms\n- Milestone checkpoints\n- Common pitfalls to avoid\n\nBe specific and realistic for 2026.`;
    let text: string;
    let model = 'deepseek';
    try {
      text = await deepseekGenerate(systemPrompt, userPrompt, 2000);
    } catch (dsErr: any) {
      console.warn('[/api/ai/pathway] DeepSeek failed, falling back to Gemini:', dsErr.message);
      text = await geminiGenerate(systemPrompt, userPrompt, 2000);
      model = 'gemini';
    }
    setCache(ck, text, TTL.pathway);
    return res.json({ result: text, cached: false, profile, model });
  } catch (err: any) {
    console.error('[/api/ai/pathway]', err.message);
    if (!res.headersSent) return res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// ─── POST /api/ai/track  →  DeepSeek ─────────────────────────────────────────
router.post('/track', async (req: Request, res: Response) => {
  const profile = resolveProfile(req.body.profile);
  const query: string = req.body.query || 'Build a structured learning track for my target role';

  const ck = cacheKey('track', profile, Buffer.from(query).toString('base64').slice(0, 30));
  const cached = getCache(ck) as string | undefined;
  if (cached) return res.json({ result: cached, cached: true, profile, model: 'deepseek' });

  try {
    const systemPrompt = `You are a structured learning architect. Profile: ${PROFILE_CONTEXT[profile]}\n\nCreate practical, week-by-week learning tracks.`;
    let text: string;
    let model = 'deepseek';
    try {
      text = await deepseekGenerate(systemPrompt, query, 2000);
    } catch (dsErr: any) {
      console.warn('[/api/ai/track] DeepSeek failed, falling back to Gemini:', dsErr.message);
      text = await geminiGenerate(systemPrompt, query, 2000);
      model = 'gemini';
    }
    setCache(ck, text, TTL.track);
    return res.json({ result: text, cached: false, profile, model });
  } catch (err: any) {
    console.error('[/api/ai/track]', err.message);
    if (!res.headersSent) return res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// ─── POST /api/ai/vault-entry  →  Gemini Flash ───────────────────────────────
router.post('/vault-entry', async (req: Request, res: Response) => {
  const profile = resolveProfile(req.body.profile);
  const topic: string = req.body.topic || '';
  const type: string  = req.body.type  || 'full';

  const ck = cacheKey('vault', profile, `${topic}_${type}`.slice(0, 40));
  const cached = getCache(ck) as string | undefined;
  if (cached) return res.json({ result: cached, cached: true, profile, model: 'gemini' });

  const typeInstructions: Record<string, string> = {
    full:       'Provide a comprehensive study guide with key concepts, definitions, frameworks, and practice questions.',
    traps:      'List the top 10 common exam traps and mistakes. For each: what people think the answer is, what it actually is, and why.',
    compare:    'Create a comparison matrix of related concepts. Use tables where helpful.',
    flashcards: 'Generate 15 flashcard-style Q&A pairs. Format: Q: [question] / A: [concise answer]',
    mnemonics:  'Create memorable mnemonics, acronyms, and memory anchors for the key concepts. Make them vivid and sticky.',
  };

  try {
    const systemPrompt = `You are an expert exam prep coach. Profile: ${PROFILE_CONTEXT[profile]}\n\nFocus on exam-ready, memorable content.`;
    const userPrompt   = `Topic: ${topic}\n\nInstruction: ${typeInstructions[type] || typeInstructions.full}`;
    const text = await geminiGenerate(systemPrompt, userPrompt, 2500);
    setCache(ck, text, TTL.vaultEntry);
    return res.json({ result: text, cached: false, profile, model: 'gemini' });
  } catch (err: any) {
    console.error('[/api/ai/vault-entry]', err.message);
    if (!res.headersSent) return res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// ─── POST /api/ai/assist  →  Gemini Flash  (no cache — personalised per job) ─
router.post('/assist', async (req: Request, res: Response) => {
  const profile = resolveProfile(req.body.profile);
  const mode: string = req.body.mode || 'coverletter';
  const job: { title?: string; company?: string; snippet?: string; keySkills?: string[] } = req.body.job || {};

  const modeInstructions: Record<string, string> = {
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
    const systemPrompt = `You are a career coach. Profile: ${PROFILE_CONTEXT[profile]}`;
    const userPrompt   = `Job: ${job.title || 'Unknown Role'} at ${job.company || 'Unknown Company'}
Description snippet: ${job.snippet || 'Not provided'}
Key skills required: ${(job.keySkills || []).join(', ') || 'Not specified'}

${modeInstructions[mode] || modeInstructions.coverletter}`;
    const text = await geminiGenerate(systemPrompt, userPrompt, 1000);
    return res.json({ result: text, cached: false, profile, model: 'gemini' });
  } catch (err: any) {
    console.error('[/api/ai/assist]', err.message);
    if (!res.headersSent) return res.status(502).json({ error: 'AI service temporarily unavailable' });
  }
});

// ─── POST /api/ai/clear-cache  →  Manual cache invalidation ──────────────────
// Body: { profile: 'dj'|'pooja', type: 'all'|'skill'|'trend'|'pathway'|'track'|'vault' }
router.post('/clear-cache', (req: Request, res: Response) => {
  const profile = resolveProfile(req.body.profile);
  const type: string = req.body.type || 'all';

  const prefixes: Record<string, string[]> = {
    skill:   ['skill'],
    trend:   ['trend'],
    pathway: ['pathway'],
    track:   ['track'],
    vault:   ['vault'],
    all:     ['skill', 'trend', 'pathway', 'track', 'vault'],
  };

  const targets = prefixes[type] || prefixes.all;
  let cleared = 0;

  for (const prefix of targets) {
    const modes = ['immediate', 'strategic', 'emerging', 'salary',
                   '6months', 'disruption', 'opportunity', '_'];
    for (const m of modes) {
      deleteCache(cacheKey(prefix, profile, m));
      cleared++;
    }
    deleteCache(cacheKey(prefix, profile));
    cleared++;
  }

  console.log(`[Cache Clear] profile=${profile} type=${type} cleared=${cleared} keys`);
  return res.json({ cleared, profile, type });
});

export default router;
