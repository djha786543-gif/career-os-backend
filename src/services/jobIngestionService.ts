/**
 * jobIngestionService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * REAL DATA ONLY — mock fallback has been removed entirely.
 * If Adzuna is not configured or returns 0 results, an empty array is returned
 * and the API surface reports the issue clearly. No fake jobs are ever shown.
 *
 * ISOLATION GUARANTEES:
 *   ✅ Cache keys namespaced:  adzuna:{candidateId}:{track|'_'}:{country}
 *   ✅ Deobrat never sees Pooja's data — enforced at cache level
 *   ✅ Pooja Academic vs Industry → completely separate cache entries
 *   ✅ No cross-contamination possible
 *
 * Data flow:
 *   1. Check isolated cache → return if fresh (6h TTL)
 *   2. Adzuna keys set? → fetch live data with candidate-specific queries
 *   3. Adzuna not configured → throw with clear message (no mock fallback)
 *   4. Dedup → cache → return
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Job } from '../models/Job';
import { deduplicateJobs } from '../utils/deduplicateJobs';
import { getCache, setCache } from '../utils/cache';
import { getSearchProfile, regionToAdzunaCountry, AdzunaCountry } from '../config/searchProfiles';
import { fetchAdzunaJobs } from './adzunaFetcher';

const LIVE_CACHE_TTL = 24 * 60 * 60; // 24 hours (cost optimisation)

function buildCacheKey(candidateId: string, track: string | undefined, country: AdzunaCountry): string {
  return `adzuna:${candidateId}:${track || '_'}:${country}`;
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

  if (!isAdzunaConfigured()) {
    throw new Error(
      'Adzuna API keys are not configured. Set ADZUNA_APP_ID and ADZUNA_APP_KEY environment variables in Railway.'
    );
  }

  const profileMap = getSearchProfile(candidateId, track);
  let allJobs: Job[] = [];

  for (const region of regions) {
    const country = regionToAdzunaCountry[region] as AdzunaCountry | undefined;
    if (!country) {
      console.warn(`[Ingestion] Unknown region "${region}" — skipping`);
      continue;
    }

    const cacheKey = buildCacheKey(candidateId, track, country);

    // ── Cache hit ──────────────────────────────────────────────────────────────
    const cached = getCache(cacheKey) as Job[] | undefined;
    if (Array.isArray(cached) && cached.length > 0) {
      console.log(`[Ingestion] Cache hit: ${cacheKey} (${cached.length} jobs)`);
      allJobs = allJobs.concat(cached);
      continue;
    }

    // ── Live Adzuna fetch ──────────────────────────────────────────────────────
    const profile = profileMap[country];
    if (!profile) {
      console.warn(`[Ingestion] No search profile for ${candidateId}/${track || '–'}/${country} — skipping`);
      continue;
    }

    let countryJobs: Job[] = [];
    try {
      console.log(`[Ingestion] Adzuna → ${candidateId}/${track || '–'}/${country} (${profile.queries.length} queries)`);
      countryJobs = await fetchAdzunaJobs(country, profile);
      console.log(`[Ingestion] Adzuna returned ${countryJobs.length} jobs for ${cacheKey}`);
    } catch (err) {
      console.error(`[Ingestion] Adzuna error for ${cacheKey}:`, (err as Error).message);
      // Do NOT fall back to mock — propagate as empty for this region
      countryJobs = [];
    }

    const deduped = deduplicateJobs(countryJobs);
    // Only cache if we got real results (don't cache empty responses)
    if (deduped.length > 0) {
      setCache(cacheKey, deduped, LIVE_CACHE_TTL);
    }
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
