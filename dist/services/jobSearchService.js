"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAndScoreJobs = filterAndScoreJobs;
const matchScore_1 = require("../utils/matchScore");
const classifyAcademicIndustry_1 = require("../utils/classifyAcademicIndustry");
const PoojaProfiles_1 = require("../models/PoojaProfiles");
function toBool(v) { if (v === undefined)
    return undefined; if (typeof v === 'boolean')
    return v; return v === 'true'; }
function toNum(v) { if (v === undefined)
    return undefined; const n = Number(v); return isNaN(n) ? undefined : n; }
// Word-boundary regex — 'intern' must not match 'internal'
function makeBlockRegex(keywords) {
    const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp('(?<![a-z])(' + escaped.join('|') + ')(?![a-z])', 'i');
}
// Deobrat: 10yr Manager — block only genuine junior/entry terms (word-boundary safe)
const DJ_BLOCK_REGEX = makeBlockRegex([
    'intern', 'internship', 'trainee',
    'entry level', 'entry-level', 'junior',
    'new grad', 'co-op',
]);
// Pooja: postdoc researcher — block undergrad/tech/student roles
const PJ_BLOCK_REGEX = makeBlockRegex([
    'intern', 'internship', 'trainee', 'undergraduate', 'undergrad',
    'lab aide', 'lab assistant', 'lab technician',
    'research technician', 'research technologist',
    'laboratory technician', 'laboratory assistant',
    'junior researcher', 'junior scientist',
    'student researcher', 'phd student', 'graduate student',
    'visiting student', 'co-op', 'coop',
]);
const MIN_FIT = 20;
function filterAndScoreJobs(jobs, candidate, filters) {
    let scoringProfile = candidate;
    if (candidate.id === 'pooja' && candidate.track) {
        const td = PoojaProfiles_1.poojaProfiles[candidate.track];
        if (td)
            scoringProfile = { ...candidate, skills: td.skills, specialization: td.specialization, experienceYears: td.experienceYears };
    }
    const wantRemote = toBool(filters.remote), wantHybrid = toBool(filters.hybrid), wantVisa = toBool(filters.visaSponsorship);
    const wantSeniority = filters.seniority ? String(filters.seniority).toLowerCase() : undefined;
    const wantSalMin = toNum(filters.salaryMin), wantSalMax = toNum(filters.salaryMax);
    const isDJ = candidate.id === 'deobrat', isPJ = candidate.id === 'pooja';
    const filtered = jobs.filter(job => {
        const title = job.title || '';
        // Word-boundary safe blocking — 'intern' won't match 'internal'
        if (isDJ && DJ_BLOCK_REGEX.test(title)) {
            console.log(`[Filter] Blocking DJ title: "${title}"`);
            return false;
        }
        if (isPJ && PJ_BLOCK_REGEX.test(title)) {
            console.log(`[Filter] Blocking PJ title: "${title}"`);
            return false;
        }
        if (isPJ && candidate.track && (0, classifyAcademicIndustry_1.classifyAcademicIndustry)(job) !== candidate.track)
            return false;
        if (wantRemote === true && !job.remote)
            return false;
        if (wantHybrid === true && !job.hybrid)
            return false;
        if (wantVisa === true && !job.visaSponsorship)
            return false;
        if (wantSeniority && !job.experienceLevel.toLowerCase().includes(wantSeniority))
            return false;
        if (wantSalMin !== undefined && job.salaryRange && job.salaryRange.max < wantSalMin)
            return false;
        if (wantSalMax !== undefined && job.salaryRange && job.salaryRange.min > wantSalMax)
            return false;
        return true;
    });
    const scored = filtered
        .map(j => ({ ...j, matchScore: (0, matchScore_1.computeMatchScore)(j, scoringProfile), fitScore: (0, matchScore_1.computeMatchScore)(j, scoringProfile) }))
        .filter(j => (j.fitScore ?? 0) >= MIN_FIT);
    console.log(`[Filter Debug] Before filter: ${jobs.length}, After block: ${filtered.length}, After score (MIN_FIT=${MIN_FIT}): ${scored.length}`);
    // Company dedup: keep highest-scored per company
    const best = new Map();
    for (const j of scored) {
        const k = (j.company || '').toLowerCase().trim() || j.id;
        const ex = best.get(k);
        if (!ex || (j.fitScore ?? 0) > (ex.fitScore ?? 0))
            best.set(k, j);
    }
    return Array.from(best.values()).sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}
