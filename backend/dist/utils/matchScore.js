"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeMatchScore = computeMatchScore;
// Compute a match score (0-100) between a job and a candidate
function computeMatchScore(job, candidate) {
    let score = 0;
    // Skill match
    const skillMatches = candidate.skills.filter(skill => job.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())).length;
    score += Math.min(60, skillMatches * 10); // up to 60 points for skills
    // Region match
    if (candidate.regions.includes(job.region))
        score += 10;
    // Experience level (simple heuristic)
    if (job.experienceLevel && candidate.experienceYears >= 5)
        score += 10;
    // Preferences
    if (candidate.preferences.remote && job.remote)
        score += 5;
    if (candidate.preferences.hybrid && job.hybrid)
        score += 5;
    if (candidate.preferences.visaSponsorship && job.visaSponsorship)
        score += 5;
    if (candidate.preferences.seniority && job.experienceLevel?.toLowerCase().includes(candidate.preferences.seniority.toLowerCase()))
        score += 5;
    return Math.min(100, score);
}
