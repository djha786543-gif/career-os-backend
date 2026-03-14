/**
 * webSearchJobService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses the Anthropic `web_search` tool to find job listings for Pooja's
 * international research roles (Europe, India) where Adzuna coverage is thin.
 *
 * Designed exclusively for profile_id = 'pooja'. DJ's pipeline uses
 * jobAggregator.ts (Indeed MCP + Adzuna).
 *
 * Flow:
 *   1. Build a targeted web-search query per track (Academic | Industry)
 *      and per region.
 *   2. Call Claude claude-sonnet-4-6 with web_search enabled.
 *   3. Instruct Claude to return a clean JSON array of job objects.
 *   4. Parse and normalise each result into the existing Job model.
 *   5. Score with computeMatchScore; cache for 45 min.
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY   — Anthropic API key
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Anthropic from '@anthropic-ai/sdk';
import { Job } from '../models/Job';
import { Candidate } from '../models/Candidate';
import { Track } from '../models/Track';
import { computeMatchScore } from '../utils/matchScore';
import { deduplicateJobs } from '../utils/deduplicateJobs';
import { inferJobFlags, extractSkillsFromText } from '../utils/inferJobFlags';
import { poojaProfiles } from '../models/PoojaProfiles';
import { getCache, setCache } from '../utils/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Region → Job model mapping
// ─────────────────────────────────────────────────────────────────────────────

type JobRegion = 'US' | 'Europe' | 'India';

const REGION_MAP: Record<string, JobRegion> = {
  Europe: 'Europe',
  India:  'India',
  US:     'US',
};

// ─────────────────────────────────────────────────────────────────────────────
// Query templates per track × region
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Query banks — interleaved Academic / Industry per region so each fetch
// surfaces both track types in sequence.  The UI "Academic | Industry" filter
// then separates them client-side via title heuristics.
// ─────────────────────────────────────────────────────────────────────────────

const ACADEMIC_QUERIES: Record<string, string[]> = {
  US: [
    'Academic Research Jobs cardiovascular molecular biology United States postdoc 2025',
    'Postdoctoral Researcher cardiovascular molecular biology site:nature.com OR site:jobs.nih.gov',
    'Assistant Professor cardiovascular molecular biology university United States',
    'Research Fellow cardiac physiology RNA-seq genomics US academic 2025',
  ],
  Europe: [
    'Academic Research Jobs cardiovascular molecular biology UK Germany Netherlands 2025',
    'Postdoctoral Researcher cardiovascular molecular biology site:euraxess.eu OR site:jobs.ac.uk',
    'Research Scientist cardiac molecular genetics UK Germany Netherlands jobs 2025',
    'Assistant Professor cardiovascular molecular biology Europe university 2025',
  ],
  India: [
    'Academic Research Jobs cardiovascular molecular biology India CSIR DBT ICMR 2025',
    'Postdoctoral Fellow cardiovascular molecular biology India IISc IIT TIFR',
    'Research Scientist cardiac molecular genetics India DBT-funded 2025',
  ],
};

const INDUSTRY_QUERIES: Record<string, string[]> = {
  US: [
    'Industry R&D Scientist cardiovascular molecular biology United States pharma biotech 2025',
    'Senior Scientist cardiovascular in vivo preclinical pharma United States',
    'Bioinformatics Scientist RNA-seq transcriptomics cardiovascular biotech US',
    'Translational Research Scientist cardiovascular drug discovery United States',
  ],
  Europe: [
    'Industry R&D Scientist cardiovascular molecular biology UK Germany Netherlands 2025',
    'Senior Scientist cardiovascular in vivo pharma biotech Europe jobs 2025',
    'Bioinformatics Scientist RNA-seq transcriptomics cardiovascular biotech UK Germany',
    'Preclinical Research Scientist cardiac fibrosis pharma Europe 2025',
  ],
  India: [
    'Industry R&D Scientist cardiovascular molecular biology India Bangalore Hyderabad 2025',
    'Scientist in vivo pharma cardiovascular India drug discovery 2025',
    'Senior Scientist cardiovascular drug discovery biotech India',
  ],
};

/**
 * Returns queries for a specific track, or an ALTERNATING academic/industry
 * sequence when `track` is undefined (used for mixed fetches).
 */
function getQueries(track: Track, region: string): string[] {
  if (track === 'Academic') return ACADEMIC_QUERIES[region] ?? [];
  if (track === 'Industry') return INDUSTRY_QUERIES[region] ?? [];

  // Alternating mode: interleave academic and industry queries
  const academic  = ACADEMIC_QUERIES[region]  ?? [];
  const industry  = INDUSTRY_QUERIES[region]  ?? [];
  const maxLen    = Math.max(academic.length, industry.length);
  const alternating: string[] = [];
  for (let i = 0; i < maxLen; i++) {
    if (i < academic.length)  alternating.push(academic[i]);
    if (i < industry.length)  alternating.push(industry[i]);
  }
  return alternating;
}

// ─────────────────────────────────────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────────────────────────────────────

function buildSearchPrompt(query: string, region: string): string {
  return `
You are a job-search assistant. Use the web_search tool to find current job postings.

Search query: "${query}"

Return ONLY a JSON array (no markdown fences, no prose) of up to 10 real, currently
open job postings matching the query. Use this exact shape per object:
[
  {
    "id": "<unique string — use URL hash if no explicit ID>",
    "title": "<job title>",
    "company": "<company or institution name>",
    "location": "<city, country>",
    "description": "<first 300 chars of posting description>",
    "apply_url": "<full URL to the job posting>",
    "posted_date": "<YYYY-MM-DD or empty string>",
    "employment_type": "<Full-time|Part-time|Contract|Postdoctoral>",
    "region": "${region}"
  }
]

Rules:
- Only include currently open positions (not expired).
- Omit intern or entry-level roles unless the track is Academic and the title is "Postdoctoral".
- If you cannot find real postings, return an empty array [].
`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Normaliser
// ─────────────────────────────────────────────────────────────────────────────

interface WebSearchJobRaw {
  id:              string;
  title:           string;
  company:         string;
  location:        string;
  description:     string;
  apply_url:       string;
  posted_date?:    string;
  employment_type?: string;
  region:          string;
}

function normalizeWebSearchJob(raw: WebSearchJobRaw, track: Track): Job {
  const { remote, hybrid, visaSponsorship } = inferJobFlags(raw.title, raw.description);
  const skills = extractSkillsFromText(raw.title, raw.description);
  const titleLower = raw.title.toLowerCase();
  const region = (REGION_MAP[raw.region] ?? 'Europe') as JobRegion;

  let experienceLevel = 'Mid';
  if (['director', 'head of', 'principal investigator', 'pi'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Director';
  } else if (['senior', 'sr.', 'lead', 'staff', 'principal'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Senior';
  } else if (['postdoc', 'postdoctoral'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Postdoctoral';
  } else if (['assistant professor', 'associate professor'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Senior';
  }

  // Generate a stable ID from URL to avoid duplicates across queries
  const urlHash = Buffer.from(raw.apply_url || raw.id || Math.random().toString())
    .toString('base64')
    .slice(0, 12);

  return {
    id:             `websearch-${urlHash}`,
    title:          raw.title,
    company:        raw.company,
    location:       raw.location,
    region,
    description:    raw.description,
    skills,
    experienceLevel,
    employmentType: raw.employment_type ?? 'Full-time',
    remote,
    hybrid,
    visaSponsorship,
    jobBoard:       'WebSearch',
    applyUrl:       raw.apply_url,
    postedDate:     raw.posted_date ?? '',
    normalized:     true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Claude call with web_search tool
// ─────────────────────────────────────────────────────────────────────────────

function parseJobArray(text: string): WebSearchJobRaw[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function runWebSearch(
  client: Anthropic,
  query: string,
  region: string,
  track: Track,
): Promise<Job[]> {
  const prompt = buildSearchPrompt(query, region);

  // web_search is a first-party Anthropic tool — no schema needed, just the name
  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 4096,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
      } as any,
    ],
    messages: [{ role: 'user', content: prompt }],
  }, { signal: AbortSignal.timeout(10_000) });

  // Collect text blocks (Claude's final answer after tool use)
  const text = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n');

  const raw = parseJobArray(text);
  console.log(`[WebSearch] "${query}" (${region}): ${raw.length} results`);
  return raw.map(r => normalizeWebSearchJob(r, track));
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export interface WebSearchOptions {
  candidate: Candidate;
  track:     Track;
  /** Regions to search. US is intentionally excluded (handled by jobAggregator). */
  regions?:  string[];
}

export async function fetchWebSearchJobs(opts: WebSearchOptions): Promise<Job[]> {
  const { candidate, track, regions = ['Europe', 'India'] } = opts;

  const cacheKey = `websearch:pooja:${track}:${regions.join(',')}`;
  const cached = getCache(cacheKey);
  if (Array.isArray(cached)) {
    console.log(`[WebSearch] Cache hit for ${cacheKey}`);
    return cached as Job[];
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('[WebSearch] ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });

  // Resolve the scoring profile for this track
  const scoringProfile = { ...candidate, ...poojaProfiles[track] };

  const allJobs: Job[] = [];

  for (const region of regions) {
    const queries = getQueries(track, region);
    for (const query of queries) {
      try {
        const jobs = await runWebSearch(client, query, region, track);
        allJobs.push(...jobs);
        // Be polite to the API between queries
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`[WebSearch] Query failed: "${query}" (${region}):`, (err as Error).message);
      }
    }
  }

  const deduped = deduplicateJobs(allJobs);
  const scored  = deduped.map(job => ({
    ...job,
    matchScore: computeMatchScore(job, scoringProfile),
  }));
  const sorted  = scored
    .filter(job => (job.matchScore ?? 0) >= 20)   // light floor; jobSearchService enforces ≥60
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  setCache(cacheKey, sorted);
  console.log(`[WebSearch] pooja/${track}: ${sorted.length} jobs cached`);
  return sorted;
}
