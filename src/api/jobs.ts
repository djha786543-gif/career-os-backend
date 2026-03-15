/**
 * api/jobs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/jobs          — Combined Indeed MCP + DB + Adzuna
 * POST /api/jobs/refresh  — Force-expire cache
 * POST /ingest-mcp        — Ingest jobs from MCP
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express';
import db from '../db';
import { candidates } from '../models/CandidatesData';
import { ingestJobs, invalidateCandidateCache } from '../services/jobIngestionService';
import { filterAndScoreJobs, JobFilters } from '../services/jobSearchService';
import { fetchWebSearchJobs, searchPoojaJobsViaWebSearch } from '../services/webSearchJobService';
import { Track } from '../models/Track';
import { Job } from '../models/Job';
import { classifyAcademicIndustry } from '../utils/classifyAcademicIndustry';

const router = express.Router();
const VALID_TRACKS: Track[] = ['Academic', 'Industry'];
const VALID_REGIONS = ['US', 'Europe', 'India'];

// ─── Indeed MCP Tier ──────────────────────────────────────────────────────────
const DJ_QUERY_INDEED = 'IT Audit Manager OR SOX ITGC OR IT Compliance OR Cloud Security Auditor remote';
const PJ_QUERY_INDEED = 'postdoctoral researcher cardiovascular molecular biology OR biotech research scientist Los Angeles';

async function fetchViaIndeedMCP(profile: 'dj' | 'pj'): Promise<any[] | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

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

    const data: any = await res.json();
    const text: string = data?.content?.find((b: any) => b.type === 'text')?.text ?? '[]';
    const jobs = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (!Array.isArray(jobs) || jobs.length === 0) throw new Error('empty');
    console.log(`[INDEED MCP] ${jobs.length} jobs for ${profile}`);
    return jobs;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn('[INDEED MCP] failed:', err.message);
    return null;
  }
}

/** Map an MCP job object into the Job model */
function mcpJobToInternal(job: any): Job {
  const loc: string = (job.location || '').toLowerCase();
  const isRemote = loc.includes('remote');
  return {
    id:          job.id || `mcp_${Math.random().toString(36).slice(2)}`,
    title:       job.title || '',
    company:     job.company || 'Unknown',
    location:    job.location || 'US',
    region:      'US',
    description: '',
    skills:      Array.isArray(job.tags) ? job.tags : [],
    experienceLevel: 'Mid',
    employmentType: 'Full-time',
    remote:      isRemote,
    hybrid:      false,
    visaSponsorship: false,
    jobBoard:    'Indeed',
    applyUrl:    job.url || '#',
    postedDate:  job.posted || 'Recent',
    normalized:  true,
    matchScore:  82,
  };
}

// ─── EY Alumni signal detector ────────────────────────────────────────────────
function detectEYConnection(job: { title?: string; company?: string; description?: string }): boolean {
  const text = `${job.company || ''} ${job.description || ''}`.toLowerCase();
  return ['ernst & young', 'ernst and young', ' ey ', 'ey.com', 'ey llp', 'ey-parthenon'].some(t => text.includes(t));
}

// ─── Map frontend "profile" shortcodes → candidateId ─────────────────────────
const PROFILE_MAP: Record<string, string> = {
  dj:       'deobrat',
  pj:       'pooja',
  deobrat:  'deobrat',
  pooja:    'pooja',
};

// ─── Map candidateId → profile shortcode (for display/cache) ────────────────
const ID_TO_PROFILE: Record<string, string> = {
  deobrat: 'dj',
  pooja:   'pj',
};

// ─── Map candidateId → DB profile_id (VARCHAR in jobs/kanban tables) ────────
const ID_TO_DB_PROFILE: Record<string, string> = {
  deobrat: 'dj',
  pooja:   'pooja',
};

const COUNTRY_TO_REGION: Record<string, string> = {
  'united states':   'US',
  'us':              'US',
  'usa':             'US',
  'united kingdom':  'Europe',
  'uk':              'Europe',
  'great britain':   'Europe',
  'britain':         'Europe',
  'europe':          'Europe',
  'india':           'India',
  'in':              'India',
  // Web-search-only countries (we assign them to a region for display)
  'germany':         'Europe',
  'deutschland':     'Europe',
  'canada':          'North America',
  'australia':       'Australia',
  'netherlands':     'Europe',
  'holland':         'Europe',
  'switzerland':     'Europe',
  'sweden':          'Europe',
  'denmark':         'Europe',
  'singapore':       'Asia',
  'japan':           'Asia',
  'france':          'Europe',
  'spain':           'Europe',
  'italy':           'Europe',
  'belgium':         'Europe',
  'norway':          'Europe',
};

const WEB_SEARCH_COUNTRIES = new Set([
  'germany', 'deutschland', 'canada', 'australia', 'netherlands', 'holland',
  'switzerland', 'sweden', 'denmark', 'singapore', 'japan', 'france',
  'spain', 'italy', 'belgium', 'norway',
]);

function resolveRegion(country?: string, region?: string): string | undefined {
  if (region && VALID_REGIONS.includes(region)) return region;
  if (country) {
    const mapped = COUNTRY_TO_REGION[country.toLowerCase().trim()];
    if (mapped) return mapped;
  }
  return undefined;
}

function toFrontendJob(job: Job & { fitScore?: number }) {
  const fit = job.fitScore ?? job.matchScore ?? 65;
  const workMode = job.remote ? 'Remote' : job.hybrid ? 'Hybrid' : 'On-site';

  let salary = '';
  if (job.salaryRange) {
    const { min, max, currency } = job.salaryRange;
    const fmt = (n: number) =>
      currency === 'INR' ? `₹${(n / 100000).toFixed(0)}L` : `$${Math.round(n / 1000)}k`;
    salary = min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`;
  }

  const snippet = (job.description || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220) + (job.description && job.description.length > 220 ? '…' : '');

  return {
    id:            job.id,
    title:         job.title,
    company:       job.company,
    location:      job.location,
    salary:        salary || 'Market Rate',
    snippet,
    applyUrl:      job.applyUrl,
    fitScore:      Math.round(fit),
    workMode,
    isRemote:      job.remote,
    source:        job.jobBoard || 'Adzuna',
    postedDate:    job.postedDate || 'Recent',
    keySkills:     (job.skills || []).slice(0, 6),
    region:        job.region,
    eyConnection:  detectEYConnection(job),
    category:      (job as any).category as 'INDUSTRY' | 'ACADEMIA' | undefined,
  };
}

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  // Extend timeout for Pooja requests (web search can take up to 60s)
  res.setTimeout(90000);
  try {
    const q = req.query as Record<string, string | undefined>;
    const rawProfile = q.profile || q.candidate || '';
    const candidateId = PROFILE_MAP[rawProfile.toLowerCase().trim()] || rawProfile;
    const profileShort = ID_TO_PROFILE[candidateId] || rawProfile.toLowerCase();

    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return res.status(400).json({ error: 'Invalid candidate' });

    let resolvedTrack: Track | undefined;
    if (candidate.id === 'pooja') {
      const t = q.track;
      resolvedTrack = t && VALID_TRACKS.includes(t as Track) ? (t as Track) : undefined;
    }

    const resolvedRegion = resolveRegion(q.country, q.region);
    const resolvedRegions = resolvedRegion ? [resolvedRegion] : (candidate.regions as string[]);

    // DB-safe profile ID (matches the VARCHAR values stored in the jobs table)
    const dbProfileId = ID_TO_DB_PROFILE[candidateId] || candidateId;

    // 1. Fetch from Database (Priority Sniper Jobs)
    let dbJobs: Job[] = [];
    try {
        const client = await db.connect();
        try {
            // SET LOCAL does not accept $1 parameters in PostgreSQL — use string literal
            await client.query(`SET LOCAL app.current_profile = '${dbProfileId}'`);
            const query = `SELECT * FROM jobs WHERE profile_id = $1 AND region = ANY($2::text[]) ORDER BY job_board = 'Web Search' DESC, match_score DESC`;
            const { rows } = await client.query(query, [dbProfileId, resolvedRegions]);
            dbJobs = rows.map((r: any) => ({
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
        } catch (err) {
            console.error('DB Fetch Error:', err instanceof Error ? err.message : err);
        } finally {
            client.release();
        }
    } catch (dbConnErr) {
        console.warn('[DB] Connection failed, continuing without DB cache:', dbConnErr instanceof Error ? dbConnErr.message : dbConnErr);
    }

    // 2. Fetch Indeed MCP (if enabled)
    let mcpJobs: Job[] = [];
    if (['dj', 'pj'].includes(profileShort) && resolvedRegions.includes('US')) {
        const rawMcp = await fetchViaIndeedMCP(profileShort as 'dj' | 'pj');
        if (rawMcp) mcpJobs = rawMcp.map(mcpJobToInternal);
    }

    // 3. Fetch live jobs (Adzuna or WebSearch depending on country)
    let adzunaJobs: Job[] = [];
    const countryParam = (q.country || '').toLowerCase().trim();
    const useWebSearch = candidate.id === 'pooja' && countryParam && WEB_SEARCH_COUNTRIES.has(countryParam);
    const isAllCountries = candidate.id === 'pooja' && (!countryParam || countryParam === 'all');

    if (useWebSearch) {
        // Non-US/UK country → use Claude web search
        const COUNTRY_DISPLAY: Record<string, string> = {
            'germany': 'Germany', 'deutschland': 'Germany',
            'canada': 'Canada', 'australia': 'Australia',
            'netherlands': 'Netherlands', 'holland': 'Netherlands',
            'switzerland': 'Switzerland', 'sweden': 'Sweden',
            'denmark': 'Denmark', 'singapore': 'Singapore',
            'japan': 'Japan', 'france': 'France', 'spain': 'Spain',
            'italy': 'Italy', 'belgium': 'Belgium', 'norway': 'Norway',
        };
        const countryName = COUNTRY_DISPLAY[countryParam] || countryParam;
        try {
            adzunaJobs = await searchPoojaJobsViaWebSearch(countryName, resolvedTrack);
            console.log(`[Jobs] WebSearch for Pooja/${countryName}: ${adzunaJobs.length} jobs`);
        } catch (err) {
            console.error('[Jobs] WebSearch error:', err instanceof Error ? err.message : err);
        }
    } else {
        try {
            adzunaJobs = await ingestJobs(candidate.id, resolvedRegions, resolvedTrack);
        } catch (err) {
            console.error('Adzuna Ingestion Error:', err instanceof Error ? err.message : err);
        }
    }

    // 3b. Web search jobs for Pooja (supplements Adzuna which has thin coverage for research roles)
    // Wrapped in a 75s timeout. The route-level timeout was extended to 90s to accommodate this.
    let webSearchJobs: Job[] = [];
    if (!useWebSearch && candidate.id === 'pooja' && resolvedRegions.length > 0) {
        try {
            const webRegions = resolvedRegions.filter(r => ['US', 'Europe', 'India'].includes(r));
            if (webRegions.length > 0) {
                const wsTrack = resolvedTrack ?? 'Academic';
                const wsTimeout = new Promise<Job[]>((_, reject) =>
                    setTimeout(() => reject(new Error('WebSearch timeout')), 75000)
                );
                webSearchJobs = await Promise.race([
                    fetchWebSearchJobs({
                        candidate,
                        track: wsTrack,
                        regions: webRegions,
                    }),
                    wsTimeout,
                ]);
                console.log(`[WebSearch] ${webSearchJobs.length} jobs for pooja/${wsTrack}`);
            }
        } catch (wsErr) {
            console.warn('[WebSearch] Failed, continuing without web search jobs:', wsErr instanceof Error ? wsErr.message : wsErr);
        }
    }

    // 3c. For "all countries" Pooja fetch, additionally run Germany webSearch and merge
    if (isAllCountries) {
        try {
            const intlJobs = await searchPoojaJobsViaWebSearch('Germany', resolvedTrack);
            adzunaJobs = [...adzunaJobs, ...intlJobs];
        } catch (err) {
            console.warn('[Jobs] International web search failed:', err instanceof Error ? err.message : err);
        }
    }

    // 4. Merge and Deduplicate (Priority: DB > MCP > Adzuna > WebSearch)
    const combined = [...dbJobs, ...mcpJobs, ...adzunaJobs, ...webSearchJobs];
    const seen = new Set();
    const unique = combined.filter(j => {
        const key = `${j.company.toLowerCase()}|${j.title.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    const candidateWithTrack = resolvedTrack ? { ...candidate, track: resolvedTrack } : { ...candidate };
    const filters: JobFilters = {
      remote:          q.remote,
      hybrid:          q.hybrid,
      visaSponsorship: q.visaSponsorship,
      seniority:       q.seniority,
      salaryMin:       q.salaryMin,
      salaryMax:       q.salaryMax,
    };
    const scored = filterAndScoreJobs(unique, candidateWithTrack as any, filters);

    // A3: Add category classification to all jobs (for Pooja's Industry/Academic counts)
    // Map to uppercase INDUSTRY/ACADEMIA to match frontend NormalizedJob.category type
    const classifiedJobs = scored.map(job => ({
      ...job,
      category: classifyAcademicIndustry(job) === 'Industry' ? 'INDUSTRY' : 'ACADEMIA',
    }));

    // Final Sort: Sniper (Web Search) > fitScore
    const allJobs = classifiedJobs.sort((a, b) => {
        const aIsSniper = a.jobBoard === 'Web Search';
        const bIsSniper = b.jobBoard === 'Web Search';
        if (aIsSniper && !bIsSniper) return -1;
        if (!aIsSniper && bIsSniper) return 1;
        return ((b as any).fitScore || 0) - ((a as any).fitScore || 0);
    }).map(toFrontendJob);

    // Pagination
    const page     = Math.max(0, parseInt(q.page     || '0', 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(q.pageSize || '50', 10)));
    const totalResults = allJobs.length;
    const totalPages   = Math.max(1, Math.ceil(totalResults / pageSize));
    const pagedJobs    = allJobs.slice(page * pageSize, (page + 1) * pageSize);

    return res.json({
      status:       'success',
      candidate:    candidate.name,
      candidateId:  candidate.id,
      track:        resolvedTrack ?? null,
      regions:      resolvedRegions,
      totalResults,
      page,
      totalPages,
      hasNext:      page < totalPages - 1,
      hasPrev:      page > 0,
      source:       mcpJobs.length > 0 ? 'hybrid-mcp' : 'live',
      jobs:         pagedJobs,
    });

  } catch (err) {
    console.error('[/api/jobs] Error:', err instanceof Error ? err.message : err);
    if (!res.headersSent) return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/refresh', (req, res) => {
  const { candidate: candidateId, track } = req.body;
  if (!candidateId || !['deobrat', 'pooja'].includes(candidateId)) return res.status(400).json({ error: 'Invalid candidate' });
  invalidateCandidateCache(candidateId, track);
  console.log(`[Refresh] Cache invalidated for ${candidateId} at ${new Date().toISOString()}`);
  return res.json({ status: 'cache_invalidated', candidate: candidateId, timestamp: new Date().toISOString() });
});

router.post('/ingest-mcp', async (req, res) => {
    const { profileId, jobs } = req.body;
    if (!Array.isArray(jobs)) return res.status(400).json({ error: 'Array expected' });
    if (!['dj', 'pooja'].includes(profileId)) return res.status(400).json({ error: 'Invalid profileId' });

    const client = await db.connect();
    try {
        await client.query('BEGIN');
        await client.query(`SET LOCAL app.current_profile = '${profileId}'`);
        for (const job of jobs) {
            const id = job.id || `mcp_${Math.random().toString(36).slice(2)}`;
            await client.query(
                `INSERT INTO jobs (
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
                    fetched_at = EXCLUDED.fetched_at`,
                [
                    id, profileId, job.title, job.company, job.location, job.region || 'US',
                    job.description || '', job.apply_url || '#', job.matchScore || 80, new Date().toISOString(),
                    'Web Search', !!job.is_remote || !!job.remote, true
                ]
            );
        }
        await client.query('COMMIT');
        res.status(200).json({ success: true, count: jobs.length });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Ingest Error:', err);
        res.status(500).json({ error: err instanceof Error ? err.message : err });
    } finally {
        client.release();
    }
});

export default router;
