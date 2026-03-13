"use strict";
/**
 * api/jobs.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GET  /api/jobs          — Search jobs for a candidate
 * POST /api/jobs/refresh  — Force-expire cache for a candidate (dev/admin use)
 *
 * Isolation: the candidateId is extracted from query params and passed through
 * the entire pipeline. No job data is ever shared between candidates.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Query params:
 *   candidate          required   'deobrat' | 'pooja'
 *   region             optional   'US' | 'Europe' | 'India'  (default: all)
 *   track              optional   'Academic' | 'Industry'    (Pooja only)
 *   remote             optional   'true' | 'false'
 *   hybrid             optional   'true' | 'false'
 *   visaSponsorship    optional   'true' | 'false'
 *   seniority          optional   'Senior' | 'Director' | ...
 *   salaryMin          optional   number
 *   salaryMax          optional   number
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
// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const { candidate: candidateId, region, track, remote, hybrid, visaSponsorship, seniority, salaryMin, salaryMax, } = req.query;
        // ── Validate candidate ───────────────────────────────────────────────────
        const candidate = CandidatesData_1.candidates.find(c => c.id === candidateId);
        if (!candidate) {
            return res.status(400).json({
                error: 'Invalid or missing "candidate" parameter.',
                valid: CandidatesData_1.candidates.map(c => ({ id: c.id, name: c.name })),
                example: '/api/jobs?candidate=deobrat&region=US',
            });
        }
        // ── Validate + resolve track (Pooja only) ────────────────────────────────
        let resolvedTrack;
        if (candidate.id === 'pooja') {
            if (track && VALID_TRACKS.includes(track)) {
                resolvedTrack = track;
            }
            else {
                // Default Pooja to Industry if no track specified
                resolvedTrack = 'Industry';
            }
        }
        // ── Validate + resolve regions ───────────────────────────────────────────
        let resolvedRegions;
        if (region) {
            if (!VALID_REGIONS.includes(region)) {
                return res.status(400).json({
                    error: `Invalid region "${region}".`,
                    valid: VALID_REGIONS,
                });
            }
            resolvedRegions = [region];
        }
        else {
            resolvedRegions = candidate.regions;
        }
        // ── Build candidate object with track (for scoring) ──────────────────────
        const candidateWithTrack = resolvedTrack
            ? { ...candidate, track: resolvedTrack }
            : { ...candidate };
        // ── Fetch jobs (isolated per candidate + track + region) ─────────────────
        const jobs = await (0, jobIngestionService_1.ingestJobs)(candidate.id, resolvedRegions, resolvedTrack);
        // ── Filter + score ───────────────────────────────────────────────────────
        const filters = { remote, hybrid, visaSponsorship, seniority, salaryMin, salaryMax };
        const results = (0, jobSearchService_1.filterAndScoreJobs)(jobs, candidateWithTrack, filters);
        return res.json({
            candidate: candidate.name,
            candidateId: candidate.id,
            track: resolvedTrack ?? null,
            regions: resolvedRegions,
            totalResults: results.length,
            source: results.length > 0 && results[0].jobBoard === 'Adzuna' ? 'live' : 'mock',
            jobs: results,
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('[/api/jobs] Error:', message);
        return res.status(500).json({ error: 'Internal server error', detail: message });
    }
});
// ─── POST /api/jobs/refresh ───────────────────────────────────────────────────
// Force-expire cache for a candidate so next GET re-fetches from Adzuna.
// Body: { candidate: 'deobrat' | 'pooja', track?: 'Academic' | 'Industry' }
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
        message: 'Next GET /api/jobs will fetch fresh data from Adzuna.',
    });
});
exports.default = router;
