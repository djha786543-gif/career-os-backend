/**
 * api/jobs.ts (PATCH v2)
 *
 * - Dual-track fix: Pooja gets both Industry & Academic jobs in parallel if no ?track= param
 * - source field: always 'live' (never 'mock' if 0 results)
 * - COUNTRY_TO_REGION: covers all frontend options
 */

import express from 'express';
import { candidates } from '../models/CandidatesData';
import { ingestJobs, invalidateCandidateCache } from '../services/jobIngestionService';
import { filterAndScoreJobs, JobFilters } from '../services/jobSearchService';
import { Track } from '../models/Track';
import { Job } from '../models/Job';

const router = express.Router();
const VALID_TRACKS: Track[] = ['Academic', 'Industry'];
const VALID_REGIONS = ['US', 'Europe', 'India'];

const PROFILE_MAP: Record<string, string> = {
  dj:      'deobrat',
  pj:      'pooja',
  deobrat: 'deobrat',
  pooja:   'pooja',
};

const COUNTRY_TO_REGION: Record<string, string> = {
  'united states':  'US',
  'us':             'US',
  'usa':            'US',
  'united kingdom': 'Europe',
  'uk':             'Europe',
  'europe':         'Europe',
  'germany':        'Europe',
  'netherlands':    'Europe',
  'switzerland':    'Europe',
  'sweden':         'Europe',
  'denmark':        'Europe',
  'india':          'India',
  'in':             'India',
  'canada':         'US',
  'australia':      'US',
  'singapore':      'India',
  'japan':          'US',
};

function resolveRegion(country?: string, region?: string): string | undefined {
  if (region && VALID_REGIONS.includes(region)) return region;
  if (country) {
    const mapped = COUNTRY_TO_REGION[country.toLowerCase().trim()];
    if (mapped) return mapped;
  }
  return undefined;
}

function toFrontendJob(job: Job & { fitScore?: number; matchScore?: number; category?: string }) {
  const fit = job.fitScore ?? job.matchScore ?? 65;
  const workMode = job.remote ? 'Remote' : job.hybrid ? 'Hybrid' : 'On-site';
  let salary = '';
  if (job.salaryRange) {
    const { min, max, currency } = job.salaryRange;
    const fmt = (n: number) =>
      currency === 'INR'
        ? `₹${(n / 100000).toFixed(0)}L`
        : `$${Math.round(n / 1000)}k`;
    salary = min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`;
  }
  const snippet = (job.description || '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220)
    + (job.description && job.description.length > 220 ? '…' : '');
  let fitReason = '';
  if (fit >= 80)      fitReason = 'Strong alignment with your experience, skills, and target role level.';
  else if (fit >= 65) fitReason = 'Good match on core skills — a few areas to address.';
  else if (fit >= 50) fitReason = 'Partial match — transferable skills apply but gaps exist.';
  else                fitReason = 'Low keyword overlap — consider only if expanding search scope.';
  return {
    id:         job.id,
    title:      job.title,
    company:    job.company,
    location:   job.location,
    salary:     salary || 'Market Rate',
    snippet,
    applyUrl:   job.applyUrl,
    fitScore:   Math.round(fit),
    workMode,
    isRemote:   job.remote,
    source:     job.jobBoard || 'Adzuna',
    postedDate: job.postedDate || 'Recent',
    keySkills:  (job.skills || []).slice(0, 6),
    fitReason,
    category:   job.category,
    region:     job.region,
  };
}

router.get('/', async (req, res) => {
  try {
    const q = req.query as Record<string, string | undefined>;
    const rawProfile  = q.profile || q.candidate || '';
    const candidateId = PROFILE_MAP[rawProfile.toLowerCase().trim()] || rawProfile;
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) {
      return res.status(400).json({
        error:   'Invalid or missing candidate/profile parameter.',
        valid:   candidates.map(c => ({ id: c.id, name: c.name })),
        example: '/api/jobs?candidate=deobrat&region=US  OR  /api/jobs?profile=dj&country=United%20States',
      });
    }
    const resolvedRegion  = resolveRegion(q.country, q.region);
    const resolvedRegions = resolvedRegion
      ? [resolvedRegion]
      : (candidate.regions as string[]);
    const filters: JobFilters = {
      remote:          q.remote,
      hybrid:          q.hybrid,
      visaSponsorship: q.visaSponsorship,
      seniority:       q.seniority,
      salaryMin:       q.salaryMin,
      salaryMax:       q.salaryMax,
    };
    // Dual-track: fetch both for Pooja if no ?track=
    if (candidate.id === 'pooja' && !q.track) {
      const [industryRaw, academiaRaw] = await Promise.all([
        ingestJobs(candidate.id, resolvedRegions, 'Industry'),
        ingestJobs(candidate.id, resolvedRegions, 'Academic'),
      ]);
      const industryScored = filterAndScoreJobs(
        industryRaw,
        { ...candidate, track: 'Industry' as Track } as any,
        filters,
      ).map(j => ({ ...j, category: 'INDUSTRY' }));
      const academiaScored = filterAndScoreJobs(
        academiaRaw,
        { ...candidate, track: 'Academic' as Track } as any,
        filters,
      ).map(j => ({ ...j, category: 'ACADEMIA' }));
      const allScored = [...industryScored, ...academiaScored]
        .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
      return res.json({
        status:       'success',
        candidate:    candidate.name,
        candidateId:  candidate.id,
        track:        null,
        regions:      resolvedRegions,
        totalResults: allScored.length,
        source:       'live',
        jobs:         allScored.map(toFrontendJob),
      });
    }
    // Single track: Pooja with ?track=, or DJ
    let resolvedTrack: Track | undefined;
    if (candidate.id === 'pooja') {
      const t = q.track;
      resolvedTrack = t && VALID_TRACKS.includes(t as Track) ? (t as Track) : 'Industry';
    }
    const candidateWithTrack = resolvedTrack
      ? { ...candidate, track: resolvedTrack }
      : { ...candidate };
    const rawJobs = await ingestJobs(candidate.id, resolvedRegions, resolvedTrack);
    const scored  = filterAndScoreJobs(rawJobs, candidateWithTrack as any, filters);
    const jobs    = scored.map(toFrontendJob);
    return res.json({
      status:       'success',
      candidate:    candidate.name,
      candidateId:  candidate.id,
      track:        resolvedTrack != null ? resolvedTrack : null,
      regions:      resolvedRegions,
      totalResults: jobs.length,
      source:       'live',
      jobs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/jobs] Error:', message);
    return res.status(500).json({ error: 'Internal server error', detail: message });
  }
});

router.post('/refresh', (req, res) => {
  const { candidate: candidateId, track } = req.body;
  if (!candidateId || !['deobrat', 'pooja'].includes(candidateId)) {
    return res.status(400).json({ error: 'Invalid candidate in body.' });
  }
  invalidateCandidateCache(candidateId, track);
  return res.json({
    status:    'cache_invalidated',
    candidate: candidateId,
    track:     track != null ? track : 'all',
  });
});

export default router;
      candidateId:  candidate.id,
      track:        resolvedTrack ?? null,
      regions:      resolvedRegions,
      totalResults: jobs.length,
      source:       'live',          // ← fix: was `jobs.length > 0 ? 'live' : 'mock'`
      jobs,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/jobs] Error:', message);
    return res.status(500).json({ error: 'Internal server error', detail: message });
  }
});

// ─── POST /api/jobs/refresh ───────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
  const { candidate: candidateId, track } = req.body as { candidate?: string; track?: string };
  if (!candidateId || !['deobrat', 'pooja'].includes(candidateId)) {
    return res.status(400).json({ error: 'Invalid candidate in body.' });
  }
  invalidateCandidateCache(candidateId, track);
  return res.json({
    status:    'cache_invalidated',
    candidate: candidateId,
    track:     track ?? 'all',
    message:   'Next GET /api/jobs will fetch fresh results from Adzuna.',
  });
});

export default router;
