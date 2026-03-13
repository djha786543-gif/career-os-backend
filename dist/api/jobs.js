"use strict";
/**
 * api/jobs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/jobs          — Search jobs for a candidate
 * POST /api/jobs/refresh  — Force-expire cache
 *
 * Accepts BOTH parameter styles:
 *   Frontend style:  ?profile=dj&country=United States
 *   Backend style:   ?candidate=deobrat&region=US
 *
 * Returns jobs in the shape the frontend job cards expect:
 *   { status, jobs: [{ id, title, company, location, salary, snippet,
 *                      applyUrl, fitScore, workMode, isRemote, source,
 *                      postedDate, keySkills, fitReason, category }] }
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const CandidatesData_1 = require("../models/CandidatesData");
const jobIngestionService_1 = require("../services/jobIngestionService");
const jobSearchService_1 = require("../services/jobSearchService");
const router = express_1.default.Router();
const VALID_TRACKS = ['Academic', 'Industry'];
const VALID_REGIONS = ['US', 'Europe', 'India'];
// ─── Map frontend "profile" shortcodes → candidateId ─────────────────────────
const PROFILE_MAP = {
    dj: 'deobrat',
    pj: 'pooja',
    deobrat: 'deobrat',
    pooja: 'pooja',
};
// ─── Map frontend "country" display names → region codes ─────────────────────
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
// ─── Transform internal Job → frontend-ready shape ───────────────────────────
function toFrontendJob(job) {
    const fit = job.fitScore ?? job.matchScore ?? 65;
    // Work mode string
    const workMode = job.remote ? 'Remote' : job.hybrid ? 'Hybrid' : 'On-site';
    // Salary display string
    let salary = '';
    if (job.salaryRange) {
        const { min, max, currency } = job.salaryRange;
        const fmt = (n) => currency === 'INR'
            ? `₹${(n / 100000).toFixed(0)}L`
            : `$${Math.round(n / 1000)}k`;
        salary = min === max ? fmt(min) : `${fmt(min)}–${fmt(max)}`;
    }
    // Snippet: first 200 chars of description
    const snippet = (job.description || '')
        .replace(/<[^>]+>/g, '') // strip any HTML
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220)
        + (job.description && job.description.length > 220 ? '…' : '');
    // Fit reason (generic but informative)
    let fitReason = '';
    if (fit >= 80)
        fitReason = 'Strong alignment with your experience, skills, and target role level.';
    else if (fit >= 65)
        fitReason = 'Good match on core skills — a few areas to address.';
    else if (fit >= 50)
        fitReason = 'Partial match — transferable skills apply but gaps exist.';
    else
        fitReason = 'Low keyword overlap — consider only if expanding search scope.';
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
        fitReason,
        category: job.category, // present on Pooja jobs after classification
        region: job.region,
    };
}
// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const q = req.query;
        // Resolve candidateId (accept both ?profile= and ?candidate=)
        const rawProfile = q.profile || q.candidate || '';
        const candidateId = PROFILE_MAP[rawProfile.toLowerCase().trim()] || rawProfile;
        const candidate = CandidatesData_1.candidates.find(c => c.id === candidateId);
        if (!candidate) {
            return res.status(400).json({
                error: 'Invalid or missing candidate/profile parameter.',
                valid: CandidatesData_1.candidates.map(c => ({ id: c.id, name: c.name })),
                example: '/api/jobs?candidate=deobrat&region=US  OR  /api/jobs?profile=dj&country=United%20States',
            });
        }
        // Resolve track
        let resolvedTrack;
        if (candidate.id === 'pooja') {
            const t = q.track;
            resolvedTrack = t && VALID_TRACKS.includes(t) ? t : 'Industry';
        }
        // Resolve regions
        const resolvedRegion = resolveRegion(q.country, q.region);
        const resolvedRegions = resolvedRegion
            ? [resolvedRegion]
            : candidate.regions;
        // Build candidate with track for scoring
        const candidateWithTrack = resolvedTrack
            ? { ...candidate, track: resolvedTrack }
            : { ...candidate };
        // Fetch, filter, score
        const rawJobs = await (0, jobIngestionService_1.ingestJobs)(candidate.id, resolvedRegions, resolvedTrack);
        const filters = {
            remote: q.remote,
            hybrid: q.hybrid,
            visaSponsorship: q.visaSponsorship,
            seniority: q.seniority,
            salaryMin: q.salaryMin,
            salaryMax: q.salaryMax,
        };
        const scored = (0, jobSearchService_1.filterAndScoreJobs)(rawJobs, candidateWithTrack, filters);
        const jobs = scored.map(toFrontendJob);
        return res.json({
            status: 'success',
            candidate: candidate.name,
            candidateId: candidate.id,
            track: resolvedTrack ?? null,
            regions: resolvedRegions,
            totalResults: jobs.length,
            source: jobs.length > 0 ? 'live' : 'mock',
            jobs,
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[/api/jobs] Error:', message);
        return res.status(500).json({ error: 'Internal server error', detail: message });
    }
});
// ─── POST /api/jobs/refresh ───────────────────────────────────────────────────
router.post('/refresh', (req, res) => {
    const { candidate: candidateId, track } = req.body;
    if (!candidateId || !['deobrat', 'pooja'].includes(candidateId)) {
        return res.status(400).json({ error: 'Invalid candidate in body.' });
    }
    (0, jobIngestionService_1.invalidateCandidateCache)(candidateId, track);
    return res.json({
        status: 'cache_invalidated',
        candidate: candidateId,
        track: track ?? 'all',
        message: 'Next GET /api/jobs will fetch fresh results from Adzuna.',
    });
});
exports.default = router;
