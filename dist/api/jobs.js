"use strict";
/**
 * dist/api/jobs.js  ← PATCH v2: compiled from src/api/jobs.ts
 * - Dual-track fix: Pooja gets both Industry & Academic jobs in parallel if no ?track= param
 * - source field: always 'live' (never 'mock' if 0 results)
 * - COUNTRY_TO_REGION: covers all frontend options
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

const PROFILE_MAP = {
    dj:      'deobrat',
    pj:      'pooja',
    deobrat: 'deobrat',
    pooja:   'pooja',
};

const COUNTRY_TO_REGION = {
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

function resolveRegion(country, region) {
    if (region && VALID_REGIONS.includes(region)) return region;
    if (country) {
        const mapped = COUNTRY_TO_REGION[country.toLowerCase().trim()];
        if (mapped) return mapped;
    }
    return undefined;
}

function toFrontendJob(job) {
    const fit = job.fitScore != null ? job.fitScore : (job.matchScore != null ? job.matchScore : 65);
    const workMode = job.remote ? 'Remote' : job.hybrid ? 'Hybrid' : 'On-site';
    let salary = '';
    if (job.salaryRange) {
        const { min, max, currency } = job.salaryRange;
        const fmt = (n) =>
            currency === 'INR'
                ? `\u20B9${(n / 100000).toFixed(0)}L`
                : `$${Math.round(n / 1000)}k`;
        salary = min === max ? fmt(min) : `${fmt(min)}\u2013${fmt(max)}`;
    }
    const desc = job.description || '';
    const snippet = desc
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 220)
        + (desc.length > 220 ? '\u2026' : '');
    let fitReason = '';
    if (fit >= 80)      fitReason = 'Strong alignment with your experience, skills, and target role level.';
    else if (fit >= 65) fitReason = 'Good match on core skills \u2014 a few areas to address.';
    else if (fit >= 50) fitReason = 'Partial match \u2014 transferable skills apply but gaps exist.';
    else                fitReason = 'Low keyword overlap \u2014 consider only if expanding search scope.';
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
        const q = req.query;
        const rawProfile  = q.profile || q.candidate || '';
        const candidateId = PROFILE_MAP[rawProfile.toLowerCase().trim()] || rawProfile;
        const candidate   = CandidatesData_1.candidates.find(c => c.id === candidateId);
        if (!candidate) {
            return res.status(400).json({
                error:   'Invalid or missing candidate/profile parameter.',
                valid:   CandidatesData_1.candidates.map(c => ({ id: c.id, name: c.name })),
                example: '/api/jobs?candidate=deobrat&region=US  OR  /api/jobs?profile=dj&country=United%20States',
            });
        }
        const resolvedRegion  = resolveRegion(q.country, q.region);
        const resolvedRegions = resolvedRegion
            ? [resolvedRegion]
            : candidate.regions;
        const filters = {
            remote:          q.remote,
            hybrid:          q.hybrid,
            visaSponsorship: q.visaSponsorship,
            seniority:       q.seniority,
            salaryMin:       q.salaryMin,
            salaryMax:       q.salaryMax,
        };
        // Dual-track: Industry + Academic in parallel
        if (candidate.id === 'pooja' && !q.track) {
            const [industryRaw, academiaRaw] = await Promise.all([
                jobIngestionService_1.ingestJobs(candidate.id, resolvedRegions, 'Industry'),
                jobIngestionService_1.ingestJobs(candidate.id, resolvedRegions, 'Academic'),
            ]);
            const industryScored = jobSearchService_1.filterAndScoreJobs(
                industryRaw,
                Object.assign({}, candidate, { track: 'Industry' }),
                filters
            ).map(j => Object.assign({}, j, { category: 'INDUSTRY' }));
            const academiaScored = jobSearchService_1.filterAndScoreJobs(
                academiaRaw,
                Object.assign({}, candidate, { track: 'Academic' }),
                filters
            ).map(j => Object.assign({}, j, { category: 'ACADEMIA' }));
            const allScored = [...industryScored, ...academiaScored]
                .sort((a, b) => (b.fitScore != null ? b.fitScore : 0) - (a.fitScore != null ? a.fitScore : 0));
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
        let resolvedTrack;
        if (candidate.id === 'pooja') {
            const t = q.track;
            resolvedTrack = (t && VALID_TRACKS.includes(t)) ? t : 'Industry';
        }
        const candidateWithTrack = resolvedTrack
            ? Object.assign({}, candidate, { track: resolvedTrack })
            : Object.assign({}, candidate);
        const rawJobs = await jobIngestionService_1.ingestJobs(candidate.id, resolvedRegions, resolvedTrack);
        const scored  = jobSearchService_1.filterAndScoreJobs(rawJobs, candidateWithTrack, filters);
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
    jobIngestionService_1.invalidateCandidateCache(candidateId, track);
    return res.json({
        status:    'cache_invalidated',
        candidate: candidateId,
        track:     track != null ? track : 'all',
    });
});

exports.default = router;
