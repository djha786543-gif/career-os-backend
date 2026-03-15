/**
 * adzunaFetcher.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches real-time job listings from the Adzuna API.
 *
 * Key design (v3):
 *   - Full-text search (no title_only): matches across title + description,
 *     maximizing result volume for niche queries like ITGC, AI Governance.
 *   - Junior/intern titles blocked post-fetch in both fetcher and jobSearchService.
 *   - Company-level deduplication: max 1 result per company per query batch,
 *     preventing the same job posted at 50 billboard/branch locations from
 *     flooding results.
 *
 * Environment variables required:
 *   ADZUNA_APP_ID   – from developer.adzuna.com
 *   ADZUNA_APP_KEY  – from developer.adzuna.com
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios, { AxiosError } from 'axios';
import { Job } from '../models/Job';
import { AdzunaCountry, SearchProfile } from '../config/searchProfiles';
import { inferJobFlags, extractSkillsFromText } from '../utils/inferJobFlags';

const ADZUNA_BASE         = 'https://api.adzuna.com/v1/api/jobs';
const RESULTS_PER_PAGE    = 50;
const REQUEST_TIMEOUT_MS  = 8000;
const RETRY_DELAY_MS      = 1200;

// ─── Raw Adzuna response shape ────────────────────────────────────────────────
interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  contract_type?: string;
  contract_time?: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: number;
  company?: { display_name: string };
  location?: { display_name: string; area: string[] };
  category?: { label: string; tag: string };
}

interface AdzunaResponse {
  results: AdzunaJob[];
  count: number;
}

// ─── Currency / region maps ───────────────────────────────────────────────────
const COUNTRY_CURRENCY: Record<AdzunaCountry, string> = {
  us: 'USD', gb: 'GBP', au: 'AUD', at: 'EUR', be: 'EUR',
  ca: 'CAD', de: 'EUR', fr: 'EUR', in: 'INR', it: 'EUR',
  nl: 'EUR', nz: 'NZD', pl: 'PLN', sg: 'SGD', za: 'ZAR',
};
const COUNTRY_REGION: Record<AdzunaCountry, string> = {
  us: 'US',     gb: 'Europe',    au: 'Australia',  at: 'Europe',
  be: 'Europe', ca: 'Canada',    de: 'Europe',     fr: 'Europe',
  in: 'India',  it: 'Europe',    nl: 'Europe',     nz: 'Australia',
  pl: 'Europe', sg: 'Asia',      za: 'Africa',
};

// ─── Seniority keywords that disqualify a job for senior candidates ───────────
const JUNIOR_TITLE_KEYWORDS = [
  'intern', 'internship', 'trainee', 'apprentice',
  'entry level', 'entry-level', 'junior', 'jr.',
  'graduate program', 'new grad', 'co-op', 'coop',
];

// ─── Normalise one Adzuna result → our Job model ──────────────────────────────
function normalizeAdzunaJob(raw: AdzunaJob, country: AdzunaCountry): Job {
  const title       = raw.title || '';
  const description = raw.description || '';
  const company     = raw.company?.display_name || '';
  const location    = raw.location?.display_name || '';
  const currency    = COUNTRY_CURRENCY[country];
  const region      = COUNTRY_REGION[country];

  const { remote, hybrid, visaSponsorship } = inferJobFlags(title, description);
  const skills = extractSkillsFromText(title, description);

  let salaryRange: Job['salaryRange'] | undefined;
  if (raw.salary_min && raw.salary_max && raw.salary_min > 0) {
    salaryRange = { min: raw.salary_min, max: raw.salary_max, currency };
  } else if (raw.salary_min && raw.salary_min > 0) {
    salaryRange = { min: raw.salary_min, max: raw.salary_min, currency };
  }

  const titleLower = title.toLowerCase();

  // Experience level inferred from title
  let experienceLevel = '';
  if (['director', 'vp ', 'vice president', 'chief', 'head of'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Director';
  } else if (['senior', 'sr.', 'sr ', 'lead', 'principal', 'staff'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Senior';
  } else if (['manager', 'mgr'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Senior';
  } else if (['postdoc', 'postdoctoral'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Postdoctoral';
  } else if (['associate', 'junior', 'ii', 'iii', 'intern', 'trainee', 'entry'].some(k => titleLower.includes(k))) {
    experienceLevel = 'Associate';
  } else {
    experienceLevel = 'Mid';
  }

  const employmentType =
    raw.contract_time  === 'full_time'  ? 'Full-time' :
    raw.contract_time  === 'part_time'  ? 'Part-time' :
    raw.contract_type  === 'permanent'  ? 'Full-time' :
    raw.contract_type  === 'contract'   ? 'Contract'  : 'Full-time';

  return {
    id: `adzuna-${raw.id}`,
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
    jobBoard:   'Adzuna',
    applyUrl:   raw.redirect_url || '',
    postedDate: raw.created ? raw.created.split('T')[0] : '',
    normalized: true,
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

  if (!appId || !appKey) throw new Error('ADZUNA_APP_ID or ADZUNA_APP_KEY not set');

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
      if (status && status >= 400 && status < 500) {
        console.error(`[Adzuna] ${status} error for query "${query}" (${country}):`, axErr.message);
        return [];
      }
      if (attempt === 2) {
        console.error(`[Adzuna] Failed after 2 attempts for query "${query}" (${country}):`, axErr.message);
        return [];
      }
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  return [];
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function fetchAdzunaJobs(
  country: AdzunaCountry,
  profile: SearchProfile,
): Promise<Job[]> {
  const allRaw: AdzunaJob[] = [];
  const seenIds      = new Set<string>();
  const seenCompanies = new Set<string>(); // ← company-level dedup

  for (const query of profile.queries) {
    for (let page = 1; page <= profile.pages; page++) {
      const results = await fetchPage(country, query, page, profile.categoryTag);
      console.log(`[Adzuna Debug] Raw results for "${query}" (${country} p${page}): ${results.length}`);

      for (const r of results) {
        // Skip if we've already seen this exact listing
        if (seenIds.has(r.id)) continue;

        // ── Company dedup: skip if we already have a job from this company ──
        const companyKey = (r.company?.display_name || '').toLowerCase().trim();
        if (companyKey && seenCompanies.has(companyKey)) continue;

        // ── Hard-block junior/intern titles ──────────────────────────────────
        const titleLower = (r.title || '').toLowerCase();
        if (JUNIOR_TITLE_KEYWORDS.some(kw => titleLower.includes(kw))) {
          console.log(`[Adzuna] Skipping junior/intern title: "${r.title}"`);
          continue;
        }

        seenIds.add(r.id);
        if (companyKey) seenCompanies.add(companyKey);
        allRaw.push(r);
      }
    }
    // Brief pause between queries
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`[Adzuna] ${country}: fetched ${allRaw.length} unique jobs across ${profile.queries.length} queries`);
  return allRaw.map(r => normalizeAdzunaJob(r, country));
}
