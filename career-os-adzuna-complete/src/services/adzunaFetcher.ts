/**
 * adzunaFetcher.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches real-time job listings from the Adzuna API.
 *
 * Isolation contract:
 *   - This module is stateless. All isolation is enforced by the caller
 *     (jobIngestionService) via separate cache keys per candidate+track+region.
 *   - This module never touches candidate state or Pooja/Deobrat business logic.
 *
 * Environment variables required:
 *   ADZUNA_APP_ID   — from developer.adzuna.com
 *   ADZUNA_APP_KEY  — from developer.adzuna.com
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios, { AxiosError } from 'axios';
import { Job } from '../models/Job';
import { AdzunaCountry, SearchProfile } from '../config/searchProfiles';
import { inferJobFlags, extractSkillsFromText } from '../utils/inferJobFlags';

const ADZUNA_BASE = 'https://api.adzuna.com/v1/api/jobs';
const RESULTS_PER_PAGE = 50;
const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 1200;

// ─── Raw Adzuna response shape ───────────────────────────────────────────────
interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  contract_type?: string;   // 'permanent' | 'contract'
  contract_time?: string;   // 'full_time' | 'part_time'
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: number;
  company?: { display_name: string };
  location?: {
    display_name: string;
    area: string[];
  };
  category?: { label: string; tag: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

// ─── Currency by country ─────────────────────────────────────────────────────
const COUNTRY_CURRENCY: Record<AdzunaCountry, string> = {
  us: 'USD',
  gb: 'GBP',
  in: 'INR',
};

// ─── Region label for the Job model ─────────────────────────────────────────
const COUNTRY_REGION: Record<AdzunaCountry, string> = {
  us: 'US',
  gb: 'Europe',
  in: 'India',
};

// ─── Normalise one Adzuna result into our Job interface ──────────────────────
function normalizeAdzunaJob(raw: AdzunaJob, country: AdzunaCountry): Job {
  const title       = raw.title || '';
  const description = raw.description || '';
  const company     = raw.company?.display_name || '';
  const location    = raw.location?.display_name || '';
  const currency    = COUNTRY_CURRENCY[country];
  const region      = COUNTRY_REGION[country];

  const { remote, hybrid, visaSponsorship } = inferJobFlags(title, description);
  const skills = extractSkillsFromText(title, description);

  // Build salary range only when both values are non-trivially present
  let salaryRange: Job['salaryRange'] | undefined;
  if (raw.salary_min && raw.salary_max && raw.salary_min > 0) {
    salaryRange = { min: raw.salary_min, max: raw.salary_max, currency };
  } else if (raw.salary_min && raw.salary_min > 0) {
    salaryRange = { min: raw.salary_min, max: raw.salary_min, currency };
  }

  // Experience level — inferred from title keywords
  let experienceLevel = '';
  const titleLower = title.toLowerCase();
  if (['director', 'vp ', 'vice president', 'chief', 'head of'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Director';
  } else if (['senior', 'sr.', 'sr ', 'lead', 'principal', 'staff'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Senior';
  } else if (['manager', 'mgr'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Senior';
  } else if (['postdoc', 'postdoctoral', 'associate', 'junior', 'ii', 'iii'].some(k => titleLower.includes(k))) {
    experienceLevel = titleLower.includes('postdoc') ? 'Postdoctoral' : 'Associate';
  } else {
    experienceLevel = 'Mid';
  }

  const employmentType = raw.contract_time === 'full_time' ? 'Full-time'
    : raw.contract_time === 'part_time' ? 'Part-time'
    : raw.contract_type === 'permanent' ? 'Full-time'
    : raw.contract_type === 'contract' ? 'Contract'
    : 'Full-time';

  return {
    id:             `adzuna-${raw.id}`,
    title,
    company,
    location,
    region,
    description,
    skills,
    experienceLevel,
    employmentType,
    remote,
    hybrid,
    visaSponsorship,
    salaryRange,
    jobBoard:       'Adzuna',
    applyUrl:       raw.redirect_url || '',
    postedDate:     raw.created ? raw.created.split('T')[0] : '',
    normalized:     true,
  };
}

// ─── Single page fetch with retry ────────────────────────────────────────────
async function fetchPage(
  country: AdzunaCountry,
  query: string,
  page: number,
  categoryTag?: string,
): Promise<AdzunaJob[]> {
  const appId  = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    throw new Error('ADZUNA_APP_ID or ADZUNA_APP_KEY not set');
  }

  const params: Record<string, string | number> = {
    app_id:           appId,
    app_key:          appKey,
    results_per_page: RESULTS_PER_PAGE,
    what:             query,
    'content-type':   'application/json',
  };

  if (categoryTag) params.category = categoryTag;

  const url = `${ADZUNA_BASE}/${country}/search/${page}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { data } = await axios.get<AdzunaResponse>(url, {
        params,
        timeout: REQUEST_TIMEOUT_MS,
        headers: { Accept: 'application/json' },
      });
      return data.results || [];
    } catch (err) {
      const axErr = err as AxiosError;
      const status = axErr.response?.status;

      // Don't retry on auth or client errors
      if (status && status >= 400 && status < 500) {
        console.error(`[Adzuna] ${status} error for query "${query}" (${country}):`, axErr.message);
        return [];
      }

      if (attempt === 2) {
        console.error(`[Adzuna] Failed after 2 attempts for query "${query}" (${country}):`, axErr.message);
        return [];
      }

      // Wait before retry
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  return [];
}

// ─── Public API: fetch all jobs for a given country + search profile ─────────
export async function fetchAdzunaJobs(
  country: AdzunaCountry,
  profile: SearchProfile,
): Promise<Job[]> {
  const allRaw: AdzunaJob[] = [];
  const seenIds = new Set<string>();

  for (const query of profile.queries) {
    for (let page = 1; page <= profile.pages; page++) {
      const results = await fetchPage(country, query, page, profile.categoryTag);
      for (const r of results) {
        if (!seenIds.has(r.id)) {
          seenIds.add(r.id);
          allRaw.push(r);
        }
      }
    }
    // Brief pause between queries to be polite to the API
    await new Promise(r => setTimeout(r, 250));
  }

  return allRaw.map(r => normalizeAdzunaJob(r, country));
}
