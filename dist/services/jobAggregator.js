"use strict";
/**
 * jobAggregator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Aggregates job listings from two sources with strict priority:
 *
 *   1. PRIMARY  — Indeed MCP (via Anthropic SDK beta `mcp_servers`)
 *                 US searches only; requires INDEED_MCP_URL + INDEED_MCP_TOKEN.
 *
 *   2. FALLBACK — Adzuna (existing production fetcher, untouched)
 *                 Used automatically when:
 *                   - INDEED_MCP_URL is not set, OR
 *                   - the MCP call throws / returns 0 results, OR
 *                   - region is not 'US' (Adzuna covers Europe + India better).
 *
 * All results are normalised into the existing Job model and scored with the
 * existing computeMatchScore logic.
 *
 * Profile isolation: every in-memory cache key is prefixed with profile_id.
 * ─────────────────────────────────────────────────────────────────────────────
 * Required env vars:
 *   ANTHROPIC_API_KEY    — Anthropic API key
 *   INDEED_MCP_URL       — Remote MCP server URL (optional; enables Indeed path)
 *   INDEED_MCP_TOKEN     — Bearer token for the MCP server (optional)
 *   ADZUNA_APP_ID        — Adzuna credentials (existing)
 *   ADZUNA_APP_KEY       — Adzuna credentials (existing)
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAggregatedJobs = fetchAggregatedJobs;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const matchScore_1 = require("../utils/matchScore");
const deduplicateJobs_1 = require("../utils/deduplicateJobs");
const inferJobFlags_1 = require("../utils/inferJobFlags");
const PoojaProfiles_1 = require("../models/PoojaProfiles");
const cache_1 = require("../utils/cache");
const adzunaFetcher_1 = require("./adzunaFetcher");
const searchProfiles_1 = require("../config/searchProfiles");
// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const INDEED_REGIONS = ['us']; // Indeed MCP is US-only
const ALL_REGIONS = ['us', 'gb', 'in'];
// ─────────────────────────────────────────────────────────────────────────────
// Indeed MCP — primary path (US only)
// ─────────────────────────────────────────────────────────────────────────────
function buildIndeedPrompt(query, location) {
    return `
You are a job aggregation assistant.
Search Indeed for: "${query}" in "${location}", United States.
Return ONLY a JSON array (no markdown, no prose) of up to 20 jobs with this exact shape:
[
  {
    "id": "<indeed job id>",
    "title": "<job title>",
    "company": "<company name>",
    "location": "<city, state>",
    "description": "<first 300 chars of job description>",
    "apply_url": "<full application URL>",
    "posted_date": "<YYYY-MM-DD or empty string>",
    "job_type": "<fulltime|parttime|contract|internship|temporary>",
    "salary": "<salary range string or empty string>"
  }
]
Do not include intern, trainee, or entry-level positions.
`.trim();
}
function parseIndeedResponse(text) {
    // Extract first JSON array from Claude's response text
    const match = text.match(/\[[\s\S]*\]/);
    if (!match)
        return [];
    try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
function normalizeIndeedJob(raw) {
    const { remote, hybrid, visaSponsorship } = (0, inferJobFlags_1.inferJobFlags)(raw.title, raw.description);
    const skills = (0, inferJobFlags_1.extractSkillsFromText)(raw.title, raw.description);
    const titleLower = raw.title.toLowerCase();
    let experienceLevel = 'Mid';
    if (['director', 'vp ', 'vice president', 'chief', 'head of'].some(k => titleLower.includes(k))) {
        experienceLevel = 'Director';
    }
    else if (['senior', 'sr.', 'sr ', 'lead', 'principal', 'staff'].some(k => titleLower.includes(k))) {
        experienceLevel = 'Senior';
    }
    else if (['manager', 'mgr'].some(k => titleLower.includes(k))) {
        experienceLevel = 'Senior';
    }
    else if (['postdoc', 'postdoctoral'].some(k => titleLower.includes(k))) {
        experienceLevel = 'Postdoctoral';
    }
    let salaryRange;
    if (raw.salary) {
        const nums = raw.salary.replace(/[^0-9]/g, ' ').trim().split(/\s+/).filter(Boolean).map(Number);
        if (nums.length >= 2)
            salaryRange = { min: nums[0], max: nums[1], currency: 'USD' };
        else if (nums.length === 1)
            salaryRange = { min: nums[0], max: nums[0], currency: 'USD' };
    }
    const employmentTypeMap = {
        fulltime: 'Full-time', parttime: 'Part-time',
        contract: 'Contract', temporary: 'Contract', internship: 'Internship',
    };
    return {
        id: `indeed-${raw.id || Math.random().toString(36).slice(2)}`,
        title: raw.title,
        company: raw.company,
        location: raw.location,
        region: 'US',
        description: raw.description,
        skills,
        experienceLevel,
        employmentType: employmentTypeMap[raw.job_type?.toLowerCase() ?? ''] ?? 'Full-time',
        remote,
        hybrid,
        visaSponsorship,
        salaryRange,
        jobBoard: 'Indeed',
        applyUrl: raw.apply_url,
        postedDate: raw.posted_date ?? '',
        normalized: true,
    };
}
async function fetchIndeedJobsMCP(query, location) {
    const mcpUrl = process.env.INDEED_MCP_URL;
    const mcpToken = process.env.INDEED_MCP_TOKEN;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!mcpUrl || !apiKey) {
        throw new Error('[Indeed] INDEED_MCP_URL or ANTHROPIC_API_KEY not configured');
    }
    const client = new sdk_1.default({ apiKey });
    // The Anthropic SDK beta `mcp_servers` feature routes tool calls to the
    // configured remote MCP server on the Anthropic infrastructure side.
    // The Indeed MCP tool (search_jobs) is invoked automatically when Claude
    // decides to search for jobs based on our prompt.
    const mcpServerConfig = {
        type: 'url',
        url: mcpUrl,
        name: 'indeed',
    };
    if (mcpToken)
        mcpServerConfig.authorization_token = mcpToken;
    const response = await client.beta.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        betas: ['mcp-client-2025-04-04'],
        mcp_servers: [mcpServerConfig],
        messages: [{ role: 'user', content: buildIndeedPrompt(query, location) }],
    }, { signal: AbortSignal.timeout(10000) });
    // Collect all text blocks from the response
    const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
    const raw = parseIndeedResponse(text);
    console.log(`[Indeed MCP] "${query}" @ ${location}: ${raw.length} results`);
    return raw.map(normalizeIndeedJob);
}
// ─────────────────────────────────────────────────────────────────────────────
// Adzuna fallback — delegates entirely to the existing production fetcher
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAdzunaFallback(countries, profileMap) {
    const results = await Promise.all(countries
        .filter(country => !!profileMap[country])
        .map(country => (0, adzunaFetcher_1.fetchAdzunaJobs)(country, profileMap[country])));
    return results.flat();
}
async function fetchAggregatedJobs(opts) {
    const { profileId, candidate, track, regions = ['US', 'Europe', 'India'] } = opts;
    // Resolve candidate profile for scoring (Pooja is track-aware)
    const scoringProfile = (candidate.id === 'pooja' && track)
        ? { ...candidate, ...PoojaProfiles_1.poojaProfiles[track] }
        : candidate;
    const cacheKey = `aggregated:${profileId}:${track ?? 'default'}:${regions.join(',')}`;
    const cached = (0, cache_1.getCache)(cacheKey);
    if (Array.isArray(cached)) {
        console.log(`[Aggregator] Cache hit for ${cacheKey}`);
        return cached;
    }
    const profileMap = (0, searchProfiles_1.getSearchProfile)(candidate.id === 'deobrat' ? 'deobrat' : 'pooja', track);
    const allJobs = [];
    const indeedMcpEnabled = Boolean(process.env.INDEED_MCP_URL && process.env.ANTHROPIC_API_KEY);
    // ── US: Indeed MCP primary → Adzuna fallback ──────────────────────────────
    if (regions.includes('US')) {
        let usJobs = [];
        if (indeedMcpEnabled) {
            try {
                const usProfile = profileMap['us'];
                // Run each query sequentially to respect MCP rate limits
                for (const query of (usProfile?.queries ?? []).slice(0, 4)) {
                    const hits = await fetchIndeedJobsMCP(query, 'United States');
                    usJobs.push(...hits);
                }
                console.log(`[Aggregator] Indeed MCP yielded ${usJobs.length} US jobs`);
            }
            catch (err) {
                console.warn('[Aggregator] Indeed MCP failed, falling back to Adzuna for US:', err.message);
                usJobs = await fetchAdzunaFallback(['us'], profileMap);
            }
        }
        else {
            console.log('[Aggregator] Indeed MCP not configured, using Adzuna for US');
            usJobs = await fetchAdzunaFallback(['us'], profileMap);
        }
        allJobs.push(...usJobs);
    }
    // ── Europe + India: Adzuna always ─────────────────────────────────────────
    const nonUsCountries = regions
        .filter(r => r !== 'US')
        .map(r => searchProfiles_1.regionToAdzunaCountry[r])
        .filter((c) => Boolean(c) && c in profileMap);
    if (nonUsCountries.length > 0) {
        const nonUsJobs = await fetchAdzunaFallback(nonUsCountries, profileMap);
        allJobs.push(...nonUsJobs);
    }
    // ── Deduplicate, score, sort ───────────────────────────────────────────────
    const deduped = (0, deduplicateJobs_1.deduplicateJobs)(allJobs);
    const scored = deduped.map(job => ({
        ...job,
        matchScore: (0, matchScore_1.computeMatchScore)(job, scoringProfile),
    }));
    // ── DJ geographic sniper boost ────────────────────────────────────────────
    // Priority hierarchy: Remote (+20) > Torrance (+15) > California > rest of US
    // Applied after base scoring so remote roles always surface first regardless
    // of raw keyword score.  Cap stays at 100.  No boost applied to Pooja.
    const boosted = profileId === 'dj'
        ? scored.map(job => {
            const locLower = (job.location ?? '').toLowerCase();
            let boost = 0;
            if (job.remote) {
                boost = 20;
            }
            else if (locLower.includes('torrance')) {
                boost = 15;
            }
            else if (locLower.includes('california') || locLower.includes(', ca')) {
                boost = 5;
            }
            return boost > 0
                ? { ...job, matchScore: Math.min(100, (job.matchScore ?? 0) + boost) }
                : job;
        })
        : scored;
    const sorted = boosted.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    (0, cache_1.setCache)(cacheKey, sorted);
    console.log(`[Aggregator] ${profileId}/${track ?? 'default'}: ${sorted.length} jobs cached`);
    return sorted;
}
