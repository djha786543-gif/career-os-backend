"use strict";
/**
 * searchProfiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Adzuna search queries and region mappings for each candidate.
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.regionToAdzunaCountry = void 0;
exports.getSearchProfile = getSearchProfile;
/** Maps our region strings → Adzuna country codes */
exports.regionToAdzunaCountry = {
    US: 'us',
    Europe: 'gb',
    India: 'in',
};
// ─── DJ (Deobrat) — remote USA only ──────────────────────────────────────────
const DJ_US = {
    queries: [
        'IT Audit',
        'SOX',
        'ITGC',
        'GRC',
        'IT Risk',
        'Compliance Audit',
        'Information Security Audit',
        'AI Governance',
    ],
    pages: 1,
};
// ─── Pooja — Academic track ───────────────────────────────────────────────────
const PJ_ACADEMIC_US = {
    queries: [
        'Postdoctoral Researcher Cardiovascular',
        'Postdoc Molecular Biology',
        'Assistant Professor Cardiovascular',
        'Research Fellow Cardiovascular Biology',
    ],
    pages: 2,
};
const PJ_ACADEMIC_GB = {
    queries: [
        'Postdoctoral Research',
        'Research Fellow Molecular Biology',
        'Postdoc Biology',
        'Research Scientist Biology',
    ],
    pages: 1,
};
// ─── Pooja — Industry track ───────────────────────────────────────────────────
const PJ_INDUSTRY_US = {
    queries: [
        'Research Scientist Cardiovascular',
        'Senior Research Scientist Molecular Biology',
        'Translational Scientist Cardiovascular',
        'Scientist Cardiovascular Drug Discovery',
    ],
    pages: 2,
};
const PJ_INDUSTRY_GB = {
    queries: [
        'Research Scientist Biotech',
        'Scientist Molecular Biology',
        'Senior Scientist Pharma',
        'Drug Discovery Scientist',
    ],
    pages: 1,
};
/**
 * Returns a per-country SearchProfile map for the given candidate + track.
 * DJ is US-only. Pooja covers US + GB (Europe).
 */
function getSearchProfile(candidateId, track) {
    const isDJ = candidateId === 'dj' || candidateId === 'deobrat';
    if (isDJ) {
        return { us: DJ_US };
    }
    // Pooja
    const isAcademic = !track || track === 'Academic';
    return {
        us: isAcademic ? PJ_ACADEMIC_US : PJ_INDUSTRY_US,
        gb: isAcademic ? PJ_ACADEMIC_GB : PJ_INDUSTRY_GB,
    };
}
