"use strict";
/**
 * jobSearchService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Filters and scores jobs for a specific candidate profile.
 *
 * ISOLATION CONTRACT:
 *   - This function only operates on the jobs array passed in.
 *   - It never fetches or stores data.
 *   - The caller (jobs.ts route) is responsible for passing ONLY the jobs
 *     that belong to the correct candidate.
 *   - Deobrat and Pooja profiles are applied independently via computeMatchScore.
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAndScoreJobs = filterAndScoreJobs;
const matchScore_1 = require("../utils/matchScore");
const classifyAcademicIndustry_1 = require("../utils/classifyAcademicIndustry");
const PoojaProfiles_1 = require("../models/PoojaProfiles");
function toBool(val) {
    if (val === undefined)
        return undefined;
    if (typeof val === 'boolean')
        return val;
    return val === 'true';
}
function toNum(val) {
    if (val === undefined)
        return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
}
function filterAndScoreJobs(jobs, candidate, filters) {
    // ── Build effective scoring profile ───────────────────────────────────────
    let scoringProfile = candidate;
    if (candidate.id === 'pooja' && candidate.track) {
        const trackData = PoojaProfiles_1.poojaProfiles[candidate.track];
        if (trackData) {
            scoringProfile = {
                ...candidate,
                skills: trackData.skills,
                specialization: trackData.specialization,
                experienceYears: trackData.experienceYears,
            };
        }
    }
    // ── Parse filter values (query params arrive as strings) ──────────────────
    const wantRemote = toBool(filters.remote);
    const wantHybrid = toBool(filters.hybrid);
    const wantVisa = toBool(filters.visaSponsorship);
    const wantSeniority = filters.seniority ? String(filters.seniority).toLowerCase() : undefined;
    const wantSalMin = toNum(filters.salaryMin);
    const wantSalMax = toNum(filters.salaryMax);
    return jobs
        // ── Single-pass filter ─────────────────────────────────────────────────
        .filter(job => {
        // For Pooja: classify job as Academic or Industry and enforce track match
        if (candidate.id === 'pooja' && candidate.track) {
            const jobTrack = (0, classifyAcademicIndustry_1.classifyAcademicIndustry)(job);
            if (jobTrack !== candidate.track)
                return false;
        }
        // Remote / hybrid / visa (only filter if explicitly requested)
        if (wantRemote === true && !job.remote)
            return false;
        if (wantHybrid === true && !job.hybrid)
            return false;
        if (wantVisa === true && !job.visaSponsorship)
            return false;
        // Seniority
        if (wantSeniority && !job.experienceLevel.toLowerCase().includes(wantSeniority)) {
            return false;
        }
        // Salary range
        if (wantSalMin !== undefined && job.salaryRange && job.salaryRange.max < wantSalMin)
            return false;
        if (wantSalMax !== undefined && job.salaryRange && job.salaryRange.min > wantSalMax)
            return false;
        return true;
    })
        // ── Score ──────────────────────────────────────────────────────────────
        .map(job => ({ ...job, matchScore: (0, matchScore_1.computeMatchScore)(job, scoringProfile) }))
        // ── Sort highest score first ───────────────────────────────────────────
        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}
