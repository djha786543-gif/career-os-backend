"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAndScoreJobs = filterAndScoreJobs;
const matchScore_1 = require("../utils/matchScore");
const classifyAcademicIndustry_1 = require("../utils/classifyAcademicIndustry");
const PoojaProfiles_1 = require("../models/PoojaProfiles");
function filterAndScoreJobs(jobs, candidate, filters) {
    let profile = candidate;
    if (candidate.id === 'pooja' && candidate.track) {
        // Use the correct profile for Pooja
        profile = { ...candidate, ...PoojaProfiles_1.poojaProfiles[candidate.track] };
    }
    return jobs
        .filter(job => {
        if (candidate.id === 'pooja' && candidate.track) {
            const track = (0, classifyAcademicIndustry_1.classifyAcademicIndustry)(job);
            if (track !== candidate.track)
                return false;
        }
        if (filters.remote !== undefined && job.remote !== filters.remote)
            return false;
        if (filters.hybrid !== undefined && job.hybrid !== filters.hybrid)
            return false;
        if (filters.visaSponsorship !== undefined && job.visaSponsorship !== filters.visaSponsorship)
            return false;
        if (filters.salaryRange) {
            if (!job.salaryRange)
                return false;
            if (job.salaryRange.min < filters.salaryRange.min || job.salaryRange.max > filters.salaryRange.max)
                return false;
        }
        if (filters.seniority && job.experienceLevel?.toLowerCase() !== filters.seniority.toLowerCase())
            return false;
        if (filters.domain && candidate.id === 'pooja' && candidate.track && filters.domain !== candidate.track)
            return false;
        return true;
    })
        .map(job => ({ ...job, matchScore: (0, matchScore_1.computeMatchScore)(job, profile) }))
        .filter(job => {
        if (filters.remote !== undefined && job.remote !== filters.remote)
            return false;
        if (filters.hybrid !== undefined && job.hybrid !== filters.hybrid)
            return false;
        if (filters.visaSponsorship !== undefined && job.visaSponsorship !== filters.visaSponsorship)
            return false;
        if (filters.salaryRange) {
            if (!job.salaryRange)
                return false;
            if (job.salaryRange.min < filters.salaryRange.min || job.salaryRange.max > filters.salaryRange.max)
                return false;
        }
        if (filters.seniority && job.experienceLevel?.toLowerCase() !== filters.seniority.toLowerCase())
            return false;
        if (filters.domain && candidate.id === 'pooja' && candidate.track && filters.domain !== candidate.track)
            return false;
        return true;
    })
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
