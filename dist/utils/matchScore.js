"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeMatchScore = computeMatchScore;
function computeMatchScore(job, candidate) {
    let score = 0;
    // Skill match — up to 60 pts
    const skillMatches = candidate.skills.filter(skill => job.skills.map(s => s.toLowerCase()).includes(skill.toLowerCase())).length;
    score += Math.min(60, skillMatches * 10);
    // Region match — 10 pts
    if (candidate.regions.includes(job.region))
        score += 10;
    // Experience heuristic — 10 pts
    if (job.experienceLevel && candidate.experienceYears >= 5)
        score += 10;
    // Preference matches — 5 pts each
    if (candidate.preferences.remote && job.remote)
        score += 5;
    if (candidate.preferences.hybrid && job.hybrid)
        score += 5;
    if (candidate.preferences.visaSponsorship && job.visaSponsorship)
        score += 5;
    if (candidate.preferences.seniority &&
        job.experienceLevel?.toLowerCase().includes(candidate.preferences.seniority.toLowerCase()))
        score += 5;
    return Math.min(100, score);
}
