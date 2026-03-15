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
const webSearchJobService_1 = require("../services/webSearchJobService");
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
const COUNTRY_TO_REGION = {
    'united states': 'US',
    'us': 'US',
    'usa': 'US',
    'united kingdom': 'Europe',
    'uk': 'Europe',
    'europe': 'Europe',
    'india': 'India',
    'in': 'India',
};
function resolveRegion(country, region) {
    if (region && VALID_REGIONS.includes(region))
        return region;
    if (country) {
        const mapped = COUNTRY_TO_REGION[country.toLowerCase().trim()];
        if (mapped)
            return mapped;
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
    };
}
// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    // Extend timeout for Pooja requests (web search can take up to 60s)
    res.setTimeout(90000);
    try {
        const q = req.query;
        const rawProfile = q.profile || q.candidate || '';
        const candidateId = PROFILE_MAP[rawProfile.toLowerCase().trim()] || rawProfile;
        const profileShort = ID_TO_PROFILE[candidateId] || rawProfile.toLowerCase();
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
        // 3. Fetch from Adzuna (Live Jobs)
        let adzunaJobs = [];
        try {
            adzunaJobs = await (0, jobIngestionService_1.ingestJobs)(candidate.id, resolvedRegions, resolvedTrack);
        }
        catch (err) {
            console.error('Adzuna Ingestion Error:', err instanceof Error ? err.message : err);
        }
        // 3b. Web search jobs for Pooja (supplements Adzuna which has thin coverage for research roles)
        // Wrapped in a 75s timeout. The route-level timeout was extended to 90s to accommodate this.
        let webSearchJobs = [];
        if (candidate.id === 'pooja' && resolvedRegions.length > 0) {
            try {
                const webRegions = resolvedRegions.filter(r => ['US', 'Europe', 'India'].includes(r));
                if (webRegions.length > 0) {
                    const wsTrack = resolvedTrack ?? 'Academic';
                    const wsTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('WebSearch timeout')), 75000));
                    webSearchJobs = await Promise.race([
                        (0, webSearchJobService_1.fetchWebSearchJobs)({
                            candidate,
                            track: wsTrack,
                            regions: webRegions,
                        }),
                        wsTimeout,
                    ]);
                    console.log(`[WebSearch] ${webSearchJobs.length} jobs for pooja/${wsTrack}`);
                }
            }
            catch (wsErr) {
                console.warn('[WebSearch] Failed, continuing without web search jobs:', wsErr instanceof Error ? wsErr.message : wsErr);
            }
        }
        // 4. Merge and Deduplicate (Priority: DB > MCP > Adzuna > WebSearch)
        const combined = [...dbJobs, ...mcpJobs, ...adzunaJobs, ...webSearchJobs];
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
        // Final Sort: Sniper (Web Search) > fitScore
        const allJobs = scored.sort((a, b) => {
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
        const pageSize = Math.max(1, Math.min(50, parseInt(q.pageSize || '8', 10)));
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
