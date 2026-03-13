"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestJobs = ingestJobs;
exports.invalidateCandidateCache = invalidateCandidateCache;
const deduplicateJobs_1 = require("../utils/deduplicateJobs");
const cache_1 = require("../utils/cache");
const searchProfiles_1 = require("../config/searchProfiles");
const adzunaFetcher_1 = require("./adzunaFetcher");
const mockJobs_1 = require("../data/mockJobs");
const LIVE_CACHE_TTL = 6 * 60 * 60; // 6 hours
function buildCacheKey(candidateId, track, country) {
    return `adzuna:${candidateId}:${track || '_'}:${country}`;
}
/** Returns ONLY this candidate's mock jobs for the given regions */
function getCandidateMockJobs(candidateId, regions) {
    const prefix = candidateId === 'deobrat' ? 'dj-' : 'pc-';
    return mockJobs_1.mockJobs.filter(j => j.id.startsWith(prefix) && regions.includes(j.region));
}
function isAdzunaConfigured() {
    return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
}
async function ingestJobs(candidateId, regions, track) {
    if (candidateId !== 'deobrat' && candidateId !== 'pooja') {
        throw new Error(`Unknown candidateId: "${candidateId}"`);
    }
    const profileMap = (0, searchProfiles_1.getSearchProfile)(candidateId, track);
    const adzunaReady = isAdzunaConfigured();
    let allJobs = [];
    for (const region of regions) {
        const country = searchProfiles_1.regionToAdzunaCountry[region];
        if (!country) {
            console.warn(`[Ingestion] Unknown region "${region}" — skipping`);
            continue;
        }
        const cacheKey = buildCacheKey(candidateId, track, country);
        // ── Cache hit ──────────────────────────────────────────────────────────
        const cached = (0, cache_1.getCache)(cacheKey);
        if (Array.isArray(cached) && cached.length > 0) {
            console.log(`[Ingestion] Cache hit: ${cacheKey} (${cached.length} jobs)`);
            allJobs = allJobs.concat(cached);
            continue;
        }
        // ── Live fetch ─────────────────────────────────────────────────────────
        let countryJobs = [];
        if (adzunaReady) {
            const profile = profileMap[country];
            if (profile) {
                try {
                    console.log(`[Ingestion] Adzuna → ${candidateId}/${track || '–'}/${country} (${profile.queries.length} queries)`);
                    countryJobs = await (0, adzunaFetcher_1.fetchAdzunaJobs)(country, profile);
                    console.log(`[Ingestion] Adzuna returned ${countryJobs.length} jobs for ${cacheKey}`);
                }
                catch (err) {
                    console.error(`[Ingestion] Adzuna error for ${cacheKey}:`, err.message);
                }
            }
        }
        else {
            console.log(`[Ingestion] Adzuna not configured — will use mock for ${cacheKey}`);
        }
        // ── Mock fallback (if Adzuna returned nothing) ─────────────────────────
        if (countryJobs.length === 0) {
            console.log(`[Ingestion] Mock fallback → ${candidateId}/${region}`);
            countryJobs = getCandidateMockJobs(candidateId, [region]);
        }
        const deduped = (0, deduplicateJobs_1.deduplicateJobs)(countryJobs);
        (0, cache_1.setCache)(cacheKey, deduped, LIVE_CACHE_TTL);
        allJobs = allJobs.concat(deduped);
    }
    return (0, deduplicateJobs_1.deduplicateJobs)(allJobs);
}
/** Force-expire cache for a candidate (use the /api/jobs/refresh endpoint) */
function invalidateCandidateCache(candidateId, track) {
    ['us', 'gb', 'in'].forEach(country => {
        (0, cache_1.setCache)(buildCacheKey(candidateId, track, country), [], 1);
    });
    console.log(`[Ingestion] Cache invalidated: ${candidateId}/${track || '*'}`);
}
