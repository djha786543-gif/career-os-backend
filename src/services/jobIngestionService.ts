/**
 * jobIngestionService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * ISOLATION GUARANTEES:
 *   ✅ Cache keys namespaced:  adzuna:{candidateId}:{track|'_'}:{country}
 *   ✅ Deobrat never sees Pooja's data — enforced at cache + mock filter level
 *   ✅ Pooja Academic vs Industry → completely separate cache entries
 *   ✅ No cross-contamination possible
 *
 * Data flow:
 *   1. Check isolated cache → return if fresh
 *   2. Adzuna keys set? → fetch live data with candidate-specific queries
 *   3. Adzuna returned 0 or keys not set? → candidate-specific mock fallback
 *   4. Dedup → cache (6h) → return
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Job } from '../models/Job';
import { deduplicateJobs } from '../utils/deduplicateJobs';
import { getCache, setCache } from '../utils/cache';
import { getSearchProfile, regionToAdzunaCountry, AdzunaCountry } from '../config/searchProfiles';
import { fetchAdzunaJobs } from './adzunaFetcher';
import { mockJobs } from '../data/mockJobs';

const LIVE_CACHE_TTL = 6 * 60 * 60; // 6 hours

function buildCacheKey(candidateId: string, track: string | undefined, country: AdzunaCountry): string {
  return `adzuna:${candidateId}:${track || '_'}:${country}`;
}

/** Returns ONLY this candidate's mock jobs for the given regions */
function getCandidateMockJobs(candidateId: string, regions: string[]): Job[] {
  const prefix = candidateId === 'deobrat' ? 'dj-' : 'pc-';
  return mockJobs.filter(j => j.id.startsWith(prefix) && regions.includes(j.region));
}

function isAdzunaConfigured(): boolean {
  return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}

export async function ingestJobs(
  candidateId: string,
  regions: string[],
  track?: string,
): Promise<Job[]> {
  if (candidateId !== 'deobrat' && candidateId !== 'pooja') {
    throw new Error(`Unknown candidateId: "${candidateId}"`);
  }

  const profileMap  = getSearchProfile(candidateId, track);
  const adzunaReady = isAdzunaConfigured();
  let   allJobs: Job[] = [];

  for (const region of regions) {
    const country = regionToAdzunaCountry[region] as AdzunaCountry | undefined;
    if (!country) {
      console.warn(`[Ingestion] Unknown region "${region}" — skipping`);
      continue;
    }

    const cacheKey = buildCacheKey(candidateId, track, country);

    // ── Cache hit ──────────────────────────────────────────────────────────
    const cached = getCache(cacheKey) as Job[] | undefined;
    if (Array.isArray(cached) && cached.length > 0) {
      console.log(`[Ingestion] Cache hit: ${cacheKey} (${cached.length} jobs)`);
      allJobs = allJobs.concat(cached);
      continue;
    }

    // ── Live fetch ─────────────────────────────────────────────────────────
    let countryJobs: Job[] = [];

    if (adzunaReady) {
      const profile = profileMap[country];
      if (profile) {
        try {
          console.log(`[Ingestion] Adzuna → ${candidateId}/${track || '–'}/${country} (${profile.queries.length} queries)`);
          countryJobs = await fetchAdzunaJobs(country, profile);
          console.log(`[Ingestion] Adzuna returned ${countryJobs.length} jobs for ${cacheKey}`);
        } catch (err) {
          console.error(`[Ingestion] Adzuna error for ${cacheKey}:`, (err as Error).message);
        }
      }
    } else {
      console.log(`[Ingestion] Adzuna not configured — will use mock for ${cacheKey}`);
    }

    // ── Mock fallback (if Adzuna returned nothing) ─────────────────────────
    if (countryJobs.length === 0) {
      console.log(`[Ingestion] Mock fallback → ${candidateId}/${region}`);
      countryJobs = getCandidateMockJobs(candidateId, [region]);
    }

    const deduped = deduplicateJobs(countryJobs);
    setCache(cacheKey, deduped, LIVE_CACHE_TTL);
    allJobs = allJobs.concat(deduped);
  }

  return deduplicateJobs(allJobs);
}

/** Force-expire cache for a candidate (use the /api/jobs/refresh endpoint) */
export function invalidateCandidateCache(candidateId: string, track?: string): void {
  (['us', 'gb', 'in'] as AdzunaCountry[]).forEach(country => {
    setCache(buildCacheKey(candidateId, track, country), [], 1);
  });
  console.log(`[Ingestion] Cache invalidated: ${candidateId}/${track || '*'}`);
}
