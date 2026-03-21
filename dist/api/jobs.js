"use strict";
/**
 * api/jobs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/jobs          — Combined Indeed MCP + DB + Adzuna
 * POST /api/jobs/refresh  — Force-expire cache
 * POST /ingest-mcp        — Ingest jobs from MCP
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("../db"));
const CandidatesData_1 = require("../models/CandidatesData");
const jobIngestionService_1 = require("../services/jobIngestionService");
const jobSearchService_1 = require("../services/jobSearchService");
const adzunaFetcher_1 = require("../services/adzunaFetcher");
const searchProfiles_1 = require("../config/searchProfiles");
const webSearchJobService_1 = require("../services/webSearchJobService");
const classifyAcademicIndustry_1 = require("../utils/classifyAcademicIndustry");
const cache_1 = require("../utils/cache");
const router = express_1.default.Router();
const VALID_TRACKS = ['Academic', 'Industry'];
const VALID_REGIONS = ['US', 'Europe', 'India'];
// ─── Indeed MCP Tier ──────────────────────────────────────────────────────────
const DJ_QUERY_INDEED = 'IT Audit Manager OR SOX ITGC OR IT Compliance OR Cloud Security Auditor remote';
const PJ_QUERY_INDEED = 'postdoctoral researcher cardiovascular molecular biology OR biotech research scientist Los Angeles';
async function fetchViaIndeedMCP(profile) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key)
        return null;
    const query = profile === 'dj' ? DJ_QUERY_INDEED : PJ_QUERY_INDEED;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'mcp-client-2025-04-04',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 2000,
                mcp_servers: [{ type: 'url', url: 'https://mcp.indeed.com/claude/mcp', name: 'indeed' }],
                messages: [{
                        role: 'user',
                        content: `Search Indeed for jobs matching: "${query}".
Return ONLY a raw JSON array (no markdown, no explanation) of up to 10 results.
Each object must have exactly these fields:
{ "id": "string", "title": "string", "company": "string", "location": "string",
  "salary": "string or Not disclosed", "posted": "string like 2 days ago",
  "url": "string", "tags": ["tag1","tag2","tag3"] }
If fewer than 10 results exist, return what you find. Never return null.`,
                    }],
            }),
        });
        clearTimeout(timer);
        const data = await res.json();
        const text = data?.content?.find((b) => b.type === 'text')?.text ?? '[]';
        const jobs = JSON.parse(text.replace(/```json|```/g, '').trim());
        if (!Array.isArray(jobs) || jobs.length === 0)
            throw new Error('empty');
        console.log(`[INDEED MCP] ${jobs.length} jobs for ${profile}`);
        return jobs;
    }
    catch (err) {
        clearTimeout(timer);
        console.warn('[INDEED MCP] failed:', err.message);
        return null;
    }
}
/** Map an MCP job object into the Job model */
function mcpJobToInternal(job) {
    const loc = (job.location || '').toLowerCase();
    const isRemote = loc.includes('remote');
    return {
        id: job.id || `mcp_${Math.random().toString(36).slice(2)}`,
        title: job.title || '',
        company: job.company || 'Unknown',
        location: job.location || 'US',
        region: 'US',
        description: '',
        skills: Array.isArray(job.tags) ? job.tags : [],
        experienceLevel: 'Mid',
        employmentType: 'Full-time',
        remote: isRemote,
        hybrid: false,
        visaSponsorship: false,
        jobBoard: 'Indeed',
        applyUrl: job.url || '#',
        postedDate: job.posted || 'Recent',
        normalized: true,
        matchScore: 82,
    };
}
// ─── EY Alumni signal detector ────────────────────────────────────────────────
function detectEYConnection(job) {
    const text = `${job.company || ''} ${job.description || ''}`.toLowerCase();
    return ['ernst & young', 'ernst and young', ' ey ', 'ey.com', 'ey llp', 'ey-parthenon'].some(t => text.includes(t));
}
// ─── Map frontend "profile" shortcodes → candidateId ─────────────────────────
const PROFILE_MAP = {
    dj: 'deobrat',
    pj: 'pooja',
    deobrat: 'deobrat',
    pooja: 'pooja',
};
// ─── Map candidateId → profile shortcode (for display/cache) ────────────────
const ID_TO_PROFILE = {
    deobrat: 'dj',
    pooja: 'pj',
};
// ─── Map candidateId → DB profile_id (VARCHAR in jobs/kanban tables) ────────
const ID_TO_DB_PROFILE = {
    deobrat: 'dj',
    pooja: 'pooja',
};
// Countries that route through ingestJobs (region-based Adzuna fetch)
const REGION_COUNTRIES = new Set(['us', 'usa', 'united states', 'uk', 'gb', 'united kingdom', 'britain', 'great britain', 'india', 'in', 'europe']);
function resolveRegion(country, region) {
    if (region && VALID_REGIONS.includes(region))
        return region;
    if (country) {
        const c = country.toLowerCase().trim();
        const code = searchProfiles_1.countryNameToAdzunaCode[c];
        if (code) {
            // Re-use adzunaFetcher's region strings via a local map
            const ADZUNA_CODE_TO_REGION = {
                us: 'US', gb: 'Europe', au: 'Australia', at: 'Europe',
                be: 'Europe', ca: 'Canada', de: 'Europe', fr: 'Europe',
                in: 'India', it: 'Europe', nl: 'Europe', nz: 'Australia',
                pl: 'Europe', sg: 'Asia', za: 'Africa',
            };
            return ADZUNA_CODE_TO_REGION[code];
        }
    }
    return undefined;
}
function toFrontendJob(job) {
    const fit = job.fitScore ?? job.matchScore ?? 65;
    const workMode = job.remote ? 'Remote' : job.hybrid ? 'Hybrid' : 'On-site';
    let salary = '';
    if (job.salaryRange) {
        const { min, max, currency } = job.salaryRange;
        const fmt = (n) => currency === 'INR' ? `₹${(n / 100000).toFixed(0)}L` : `$${Math.round(n / 1000)}k`;
        salary = min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`;
    }
    const snippet = (job.description || '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220) + (job.description && job.description.length > 220 ? '…' : '');
    return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: salary || 'Market Rate',
        snippet,
        applyUrl: job.applyUrl,
        fitScore: Math.round(fit),
        workMode,
        isRemote: job.remote,
        source: job.jobBoard || 'Adzuna',
        postedDate: job.postedDate || 'Recent',
        keySkills: (job.skills || []).slice(0, 6),
        region: job.region,
        eyConnection: detectEYConnection(job),
        category: job.category,
    };
}
// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const q = req.query;
        const rawProfile = q.profile || q.candidate || '';
        const candidateId = PROFILE_MAP[rawProfile.toLowerCase().trim()] || rawProfile;
        const profileShort = ID_TO_PROFILE[candidateId] || rawProfile.toLowerCase();
        // forceRefresh: bypass cache — rate-limited to once per hour per profile
        const forceRefresh = q.forceRefresh === 'true';
        const frKey = `forceRefresh:${profileShort}`;
        if (forceRefresh) {
            const lastUsed = (0, cache_1.getCache)(frKey);
            const now = Date.now();
            if (lastUsed && now - lastUsed < 3600 * 1000) {
                return res.status(429).json({ error: 'Force refresh rate-limited — please wait 1 hour between force refreshes.' });
            }
            (0, cache_1.setCache)(frKey, Date.now(), 3600);
            console.log(`[Jobs] forceRefresh=true for ${profileShort}`);
        }
        const candidate = CandidatesData_1.candidates.find(c => c.id === candidateId);
        if (!candidate)
            return res.status(400).json({ error: 'Invalid candidate' });
        let resolvedTrack;
        if (candidate.id === 'pooja') {
            const t = q.track;
            resolvedTrack = t && VALID_TRACKS.includes(t) ? t : undefined;
        }
        const resolvedRegion = resolveRegion(q.country, q.region);
        const resolvedRegions = resolvedRegion ? [resolvedRegion] : candidate.regions;
        // DB-safe profile ID (matches the VARCHAR values stored in the jobs table)
        const dbProfileId = ID_TO_DB_PROFILE[candidateId] || candidateId;
        // 1. Fetch from Database (Priority Sniper Jobs)
        let dbJobs = [];
        try {
            const client = await db_1.default.connect();
            try {
                // SET LOCAL does not accept $1 parameters in PostgreSQL — use string literal
                await client.query(`SET LOCAL app.current_profile = '${dbProfileId}'`);
                const query = `SELECT * FROM jobs WHERE profile_id = $1 AND region = ANY($2::text[]) ORDER BY job_board = 'Web Search' DESC, match_score DESC`;
                const { rows } = await client.query(query, [dbProfileId, resolvedRegions]);
                dbJobs = rows.map((r) => ({
                    id: r.id.toString(),
                    title: r.title,
                    company: r.company,
                    location: r.location,
                    region: r.region,
                    description: r.description,
                    applyUrl: r.apply_url,
                    remote: !!r.remote,
                    hybrid: !!r.hybrid,
                    visaSponsorship: !!r.visa_sponsorship,
                    experienceLevel: r.experience_level || 'Mid',
                    employmentType: r.employment_type || 'Full-time',
                    jobBoard: r.job_board,
                    matchScore: r.match_score,
                    skills: r.skills || [],
                    postedDate: r.fetched_at instanceof Date ? r.fetched_at.toISOString() : (r.fetched_at || ''),
                    normalized: true
                }));
                console.log(`[DB] Fetched ${dbJobs.length} jobs for ${profileShort}`);
            }
            catch (err) {
                console.error('DB Fetch Error:', err instanceof Error ? err.message : err);
            }
            finally {
                client.release();
            }
        }
        catch (dbConnErr) {
            console.warn('[DB] Connection failed, continuing without DB cache:', dbConnErr instanceof Error ? dbConnErr.message : dbConnErr);
        }
        // 2. Fetch Indeed MCP (if enabled)
        let mcpJobs = [];
        if (['dj', 'pj'].includes(profileShort) && resolvedRegions.includes('US')) {
            const rawMcp = await fetchViaIndeedMCP(profileShort);
            if (rawMcp)
                mcpJobs = rawMcp.map(mcpJobToInternal);
        }
        // 3. Fetch live jobs
        //    Pooja: UK only → Adzuna GB (the one Adzuna source with real postdoc listings)
        //           All other countries → webSearch (Adzuna has zero postdoc coverage outside GB)
        //    DJ:    existing Adzuna routing unchanged
        let adzunaJobs = [];
        if (candidateId === 'pooja') {
            const countryKey = (q.country || '').toLowerCase().trim();
            const UK_VARIANTS = new Set(['uk', 'gb', 'united kingdom', 'britain', 'great britain']);
            const COUNTRY_NAMES = {
                'usa': 'United States', 'us': 'United States', 'united states': 'United States',
                'germany': 'Germany', 'de': 'Germany', 'deutschland': 'Germany',
                'canada': 'Canada', 'ca': 'Canada',
                'australia': 'Australia', 'au': 'Australia',
                'netherlands': 'Netherlands', 'nl': 'Netherlands', 'holland': 'Netherlands',
                'switzerland': 'Switzerland', 'ch': 'Switzerland',
                'sweden': 'Sweden', 'se': 'Sweden',
                'denmark': 'Denmark', 'dk': 'Denmark',
                'singapore': 'Singapore', 'sg': 'Singapore',
                'japan': 'Japan', 'jp': 'Japan',
                'india': 'India', 'in': 'India',
                'france': 'France', 'fr': 'France',
                'belgium': 'Belgium', 'be': 'Belgium',
                'italy': 'Italy', 'it': 'Italy',
                'norway': 'Norway', 'no': 'Norway',
                'austria': 'Austria', 'at': 'Austria',
                'poland': 'Poland', 'pl': 'Poland',
            };
            // Countries that use ingestJobs (Adzuna regions with proper caching + scoring)
            const INGEST_REGION_MAP = {
                'uk': 'Europe', 'gb': 'Europe', 'united kingdom': 'Europe',
                'britain': 'Europe', 'great britain': 'Europe',
                'usa': 'US', 'us': 'US', 'united states': 'US',
                'india': 'India', 'in': 'India',
            };
            // Countries with direct Adzuna code (not covered by ingestJobs regions)
            const DIRECT_ADZUNA_COUNTRIES = new Set([
                'germany', 'de', 'deutschland',
                'netherlands', 'nl', 'holland',
                'france', 'fr',
                'canada', 'ca',
                'australia', 'au',
                'singapore', 'sg',
                'austria', 'at', 'belgium', 'be',
                'italy', 'it', 'poland', 'pl',
            ]);
            if (!countryKey || countryKey === 'all') {
                // No filter → US + UK in parallel (best Adzuna coverage)
                console.log('[Jobs] Pooja: all → Adzuna US + GB in parallel');
                const [usResult, ukResult] = await Promise.allSettled([
                    (0, jobIngestionService_1.ingestJobs)('pooja', ['US'], resolvedTrack),
                    (0, jobIngestionService_1.ingestJobs)('pooja', ['Europe'], resolvedTrack),
                ]);
                adzunaJobs = [
                    ...(usResult.status === 'fulfilled' ? usResult.value : []),
                    ...(ukResult.status === 'fulfilled' ? ukResult.value : []),
                ];
            }
            else if (INGEST_REGION_MAP[countryKey]) {
                // USA / UK / India → ingestJobs (cached Adzuna with proper scoring)
                const region = INGEST_REGION_MAP[countryKey];
                console.log(`[Jobs] Pooja: ${countryKey} → ingestJobs([${region}])`);
                try {
                    adzunaJobs = await (0, jobIngestionService_1.ingestJobs)('pooja', [region], resolvedTrack);
                }
                catch (err) {
                    console.error(`[Jobs] ingestJobs(${region}) error:`, err instanceof Error ? err.message : err);
                }
            }
            else if (DIRECT_ADZUNA_COUNTRIES.has(countryKey)) {
                // Countries with Adzuna support but not covered by ingestJobs regions
                const adzunaCode = searchProfiles_1.countryNameToAdzunaCode[countryKey];
                if (adzunaCode) {
                    const profileMap = (0, searchProfiles_1.getSearchProfile)('pooja', q.track);
                    const profile = profileMap[adzunaCode];
                    if (profile) {
                        console.log(`[Jobs] Pooja: ${countryKey} → Adzuna(${adzunaCode})`);
                        try {
                            const raw = await (0, adzunaFetcher_1.fetchAdzunaJobs)(adzunaCode, profile);
                            console.log(`[Jobs] Adzuna(${adzunaCode}): ${raw.length} jobs`);
                            // Try web search as supplement if Adzuna returns few results
                            if (raw.length < 5) {
                                const countryName = COUNTRY_NAMES[countryKey]
                                    || (countryKey.charAt(0).toUpperCase() + countryKey.slice(1));
                                console.log(`[Jobs] Adzuna thin for ${countryKey}, supplementing with webSearch`);
                                try {
                                    const webJobs = await (0, webSearchJobService_1.searchPoojaJobsViaWebSearch)(countryName, q.track);
                                    adzunaJobs = [...raw, ...webJobs];
                                }
                                catch {
                                    adzunaJobs = raw;
                                }
                            }
                            else {
                                adzunaJobs = raw;
                            }
                        }
                        catch (err) {
                            console.error(`[Jobs] Adzuna(${adzunaCode}) error:`, err instanceof Error ? err.message : err);
                        }
                    }
                }
            }
            else {
                // Countries not in Adzuna → try webSearch, fallback to nearest Adzuna proxy
                const countryName = COUNTRY_NAMES[countryKey]
                    || (countryKey.charAt(0).toUpperCase() + countryKey.slice(1));
                // Nearest Adzuna proxy for non-Adzuna countries
                const ADZUNA_PROXY = {
                    'switzerland': 'de', 'ch': 'de', // German-speaking → Germany
                    'sweden': 'gb', 'se': 'gb', // Nordic → UK Europe pool
                    'denmark': 'gb', 'dk': 'gb', // Nordic → UK Europe pool
                    'norway': 'gb', 'no': 'gb', // Nordic → UK Europe pool
                    'japan': 'sg', 'jp': 'sg', // East Asia → Singapore
                    'south korea': 'sg', 'kr': 'sg', // East Asia → Singapore
                    'new zealand': 'au', 'nz': 'au', // Oceania → Australia
                };
                console.log(`[Jobs] Pooja: ${countryKey} → webSearch (${countryName})`);
                let webJobs = [];
                try {
                    webJobs = await (0, webSearchJobService_1.searchPoojaJobsViaWebSearch)(countryName, q.track, forceRefresh);
                }
                catch (err) {
                    console.error(`[Jobs] webSearch(${countryName}) error:`, err instanceof Error ? err.message : err);
                }
                if (webJobs.length > 0) {
                    adzunaJobs = webJobs;
                }
                else {
                    // webSearch unavailable → fallback to nearest Adzuna proxy country
                    const proxyCode = ADZUNA_PROXY[countryKey];
                    if (proxyCode) {
                        const profileMap = (0, searchProfiles_1.getSearchProfile)('pooja', q.track);
                        const profile = profileMap[proxyCode];
                        if (profile) {
                            console.log(`[Jobs] Pooja: webSearch unavailable, falling back to Adzuna proxy (${proxyCode}) for ${countryKey}`);
                            try {
                                adzunaJobs = await (0, adzunaFetcher_1.fetchAdzunaJobs)(proxyCode, profile);
                            }
                            catch (err) {
                                console.error(`[Jobs] Adzuna proxy(${proxyCode}) error:`, err instanceof Error ? err.message : err);
                            }
                        }
                    }
                }
            }
        }
        else {
            // DJ (deobrat) — existing Adzuna routing unchanged
            const countryParam = (q.country || '').toLowerCase().trim();
            const adzunaCode = countryParam
                ? searchProfiles_1.countryNameToAdzunaCode[countryParam]
                : undefined;
            const useDirectFetch = !!adzunaCode && !REGION_COUNTRIES.has(countryParam);
            if (useDirectFetch && adzunaCode) {
                const profileMap = (0, searchProfiles_1.getSearchProfile)(candidate.id, resolvedTrack);
                const profile = profileMap[adzunaCode];
                if (profile) {
                    try {
                        adzunaJobs = await (0, adzunaFetcher_1.fetchAdzunaJobs)(adzunaCode, profile);
                        console.log(`[Jobs] Adzuna(${adzunaCode}) for ${candidate.id}: ${adzunaJobs.length} jobs`);
                    }
                    catch (err) {
                        console.error(`[Jobs] Adzuna(${adzunaCode}) error:`, err instanceof Error ? err.message : err);
                    }
                }
                else {
                    console.warn(`[Jobs] No Adzuna profile for ${candidate.id}/${adzunaCode}`);
                }
            }
            else {
                try {
                    adzunaJobs = await (0, jobIngestionService_1.ingestJobs)(candidate.id, resolvedRegions, resolvedTrack);
                }
                catch (err) {
                    console.error('Adzuna Ingestion Error:', err instanceof Error ? err.message : err);
                }
            }
        }
        // 4. Merge and Deduplicate (Priority: DB > MCP > Adzuna)
        const combined = [...dbJobs, ...mcpJobs, ...adzunaJobs];
        const seen = new Set();
        const unique = combined.filter(j => {
            const key = `${j.company.toLowerCase()}|${j.title.toLowerCase()}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
        const candidateWithTrack = resolvedTrack ? { ...candidate, track: resolvedTrack } : { ...candidate };
        const filters = {
            remote: q.remote,
            hybrid: q.hybrid,
            visaSponsorship: q.visaSponsorship,
            seniority: q.seniority,
            salaryMin: q.salaryMin,
            salaryMax: q.salaryMax,
        };
        const scored = (0, jobSearchService_1.filterAndScoreJobs)(unique, candidateWithTrack, filters);
        // A3: Add category classification to all jobs (for Pooja's Industry/Academic counts)
        // Map to uppercase INDUSTRY/ACADEMIA to match frontend NormalizedJob.category type
        const classifiedJobs = scored.map(job => ({
            ...job,
            category: (0, classifyAcademicIndustry_1.classifyAcademicIndustry)(job) === 'Industry' ? 'INDUSTRY' : 'ACADEMIA',
        }));
        // Final Sort: Sniper (Web Search) > fitScore
        const allJobs = classifiedJobs.sort((a, b) => {
            const aIsSniper = a.jobBoard === 'Web Search';
            const bIsSniper = b.jobBoard === 'Web Search';
            if (aIsSniper && !bIsSniper)
                return -1;
            if (!aIsSniper && bIsSniper)
                return 1;
            return (b.fitScore || 0) - (a.fitScore || 0);
        }).map(toFrontendJob);
        // Pagination
        const page = Math.max(0, parseInt(q.page || '0', 10));
        const pageSize = Math.max(1, Math.min(100, parseInt(q.pageSize || '50', 10)));
        const totalResults = allJobs.length;
        const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
        const pagedJobs = allJobs.slice(page * pageSize, (page + 1) * pageSize);
        return res.json({
            status: 'success',
            candidate: candidate.name,
            candidateId: candidate.id,
            track: resolvedTrack ?? null,
            regions: resolvedRegions,
            totalResults,
            page,
            totalPages,
            hasNext: page < totalPages - 1,
            hasPrev: page > 0,
            source: mcpJobs.length > 0 ? 'hybrid-mcp' : 'live',
            jobs: pagedJobs,
        });
    }
    catch (err) {
        console.error('[/api/jobs] Error:', err instanceof Error ? err.message : err);
        if (!res.headersSent)
            return res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/refresh', (req, res) => {
    const { candidate: candidateId, track } = req.body;
    if (!candidateId || !['deobrat', 'pooja'].includes(candidateId))
        return res.status(400).json({ error: 'Invalid candidate' });
    (0, jobIngestionService_1.invalidateCandidateCache)(candidateId, track);
    console.log(`[Refresh] Cache invalidated for ${candidateId} at ${new Date().toISOString()}`);
    return res.json({ status: 'cache_invalidated', candidate: candidateId, timestamp: new Date().toISOString() });
});
router.post('/ingest-mcp', async (req, res) => {
    const { profileId, jobs } = req.body;
    if (!Array.isArray(jobs))
        return res.status(400).json({ error: 'Array expected' });
    if (!['dj', 'pooja'].includes(profileId))
        return res.status(400).json({ error: 'Invalid profileId' });
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL app.current_profile = '${profileId}'`);
        for (const job of jobs) {
            const id = job.id || `mcp_${Math.random().toString(36).slice(2)}`;
            await client.query(`INSERT INTO jobs (
                    id, profile_id, title, company, location, region,
                    description, apply_url, match_score, fetched_at,
                    job_board, remote, normalized
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    company = EXCLUDED.company,
                    location = EXCLUDED.location,
                    description = EXCLUDED.description,
                    match_score = EXCLUDED.match_score,
                    fetched_at = EXCLUDED.fetched_at`, [
                id, profileId, job.title, job.company, job.location, job.region || 'US',
                job.description || '', job.apply_url || '#', job.matchScore || 80, new Date().toISOString(),
                'Web Search', !!job.is_remote || !!job.remote, true
            ]);
        }
        await client.query('COMMIT');
        res.status(200).json({ success: true, count: jobs.length });
    }
    catch (err) {
        await client.query('ROLLBACK');
        console.error('Ingest Error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : err });
    }
    finally {
        client.release();
    }
});
exports.default = router;
