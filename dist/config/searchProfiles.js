"use strict";
/**
 * searchProfiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Adzuna search queries and region mappings for each candidate.
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.countryNameToAdzunaCode = exports.regionToAdzunaCountry = void 0;
exports.getSearchProfile = getSearchProfile;
/** Maps our region strings → Adzuna country codes (used by jobIngestionService) */
exports.regionToAdzunaCountry = {
    US: 'us',
    Europe: 'gb',
    India: 'in',
};
/**
 * Maps every country name / code the frontend might send → Adzuna country code.
 * Used in api/jobs.ts for direct per-country Adzuna routing.
 */
exports.countryNameToAdzunaCode = {
    // USA
    'us': 'us', 'usa': 'us', 'united states': 'us',
    // UK
    'gb': 'gb', 'uk': 'gb', 'united kingdom': 'gb', 'britain': 'gb', 'great britain': 'gb',
    // Australia
    'au': 'au', 'australia': 'au',
    // Austria
    'at': 'at', 'austria': 'at',
    // Belgium
    'be': 'be', 'belgium': 'be',
    // Canada
    'ca': 'ca', 'canada': 'ca',
    // Germany
    'de': 'de', 'germany': 'de', 'deutschland': 'de',
    // France
    'fr': 'fr', 'france': 'fr',
    // India
    'in': 'in', 'india': 'in',
    // Italy
    'it': 'it', 'italy': 'it',
    // Netherlands
    'nl': 'nl', 'netherlands': 'nl', 'holland': 'nl',
    // New Zealand
    'nz': 'nz', 'new zealand': 'nz',
    // Poland
    'pl': 'pl', 'poland': 'pl',
    // Singapore
    'sg': 'sg', 'singapore': 'sg',
    // South Africa
    'za': 'za', 'south africa': 'za',
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
// ─── Pooja — US ──────────────────────────────────────────────────────────────
const PJ_ACADEMIC_US = {
    queries: [
        'Postdoctoral Researcher Cardiovascular',
        'Postdoc Molecular Biology',
        'Assistant Professor Cardiovascular',
        'Research Fellow Cardiovascular Biology',
    ],
    pages: 2,
};
const PJ_INDUSTRY_US = {
    queries: [
        'Research Scientist Cardiovascular',
        'Senior Research Scientist Molecular Biology',
        'Translational Scientist Cardiovascular',
        'Scientist Cardiovascular Drug Discovery',
    ],
    pages: 2,
};
// ─── Pooja — UK (gb) ─────────────────────────────────────────────────────────
const PJ_ACADEMIC_GB = {
    queries: [
        'Postdoctoral Research',
        'Research Fellow Molecular Biology',
        'Postdoc Biology',
        'Research Scientist Biology',
    ],
    pages: 1,
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
// ─── Pooja — India (in) ───────────────────────────────────────────────────────
const PJ_ACADEMIC_IN = {
    queries: [
        'Postdoctoral Researcher Biology',
        'Research Fellow Cardiovascular',
        'Postdoc Molecular Biology',
    ],
    pages: 1,
};
const PJ_INDUSTRY_IN = {
    queries: [
        'Research Scientist Biology',
        'Scientist Pharma',
        'Research Scientist Cardiovascular',
    ],
    pages: 1,
};
// ─── Pooja — Germany (de) ─────────────────────────────────────────────────────
// Adzuna DE has thin research coverage — use broad life-science terms
const PJ_ACADEMIC_DE = {
    queries: ['Postdoctoral', 'Research Scientist', 'Research Associate Biology'],
    pages: 1,
};
const PJ_INDUSTRY_DE = {
    queries: ['Research Scientist', 'Scientist Life Sciences', 'Biotech Scientist'],
    pages: 1,
};
// ─── Pooja — Canada (ca) ──────────────────────────────────────────────────────
const PJ_ACADEMIC_CA = {
    queries: ['Postdoctoral Fellow', 'Research Associate Biology', 'Research Scientist'],
    pages: 1,
};
const PJ_INDUSTRY_CA = {
    queries: ['Research Scientist', 'Scientist Life Sciences', 'Biomedical Scientist'],
    pages: 1,
};
// ─── Pooja — Australia (au) ───────────────────────────────────────────────────
const PJ_ACADEMIC_AU = {
    queries: ['Postdoctoral Research', 'Research Associate', 'Research Scientist Biology'],
    pages: 1,
};
const PJ_INDUSTRY_AU = {
    queries: ['Research Scientist', 'Scientist Life Sciences', 'Biomedical Scientist'],
    pages: 1,
};
// ─── Pooja — Netherlands (nl) ─────────────────────────────────────────────────
const PJ_ACADEMIC_NL = {
    queries: ['Postdoctoral Researcher', 'Research Scientist Biology', 'Research Associate'],
    pages: 1,
};
const PJ_INDUSTRY_NL = {
    queries: ['Research Scientist', 'Scientist Life Sciences', 'Drug Discovery Scientist'],
    pages: 1,
};
// ─── Pooja — France (fr) ──────────────────────────────────────────────────────
const PJ_ACADEMIC_FR = {
    queries: ['Postdoctoral Researcher', 'Research Scientist Biology', 'Research Fellow'],
    pages: 1,
};
const PJ_INDUSTRY_FR = {
    queries: ['Research Scientist', 'Scientist Life Sciences', 'Scientist Pharma'],
    pages: 1,
};
// ─── Pooja — Singapore (sg) ───────────────────────────────────────────────────
const PJ_ACADEMIC_SG = {
    queries: ['Postdoctoral Researcher', 'Research Scientist', 'Research Associate Biology'],
    pages: 1,
};
const PJ_INDUSTRY_SG = {
    queries: ['Research Scientist', 'Scientist Biotech', 'Life Sciences Scientist'],
    pages: 1,
};
// ─── Remaining Adzuna countries — broad life-science profiles ─────────────────
const PJ_ACADEMIC_GENERIC = {
    queries: ['Postdoctoral Researcher', 'Research Scientist'],
    pages: 1,
};
const PJ_INDUSTRY_GENERIC = {
    queries: ['Research Scientist', 'Life Sciences Scientist'],
    pages: 1,
};
/**
 * Returns a per-country SearchProfile map for the given candidate + track.
 * DJ is US-only. Pooja covers all Adzuna-supported countries.
 */
function getSearchProfile(candidateId, track) {
    const isDJ = candidateId === 'dj' || candidateId === 'deobrat';
    if (isDJ) {
        return { us: DJ_US };
    }
    // Pooja — Academic or Industry per country
    const a = (ac, ind) => (!track || track === 'Academic') ? ac : ind;
    return {
        us: a(PJ_ACADEMIC_US, PJ_INDUSTRY_US),
        gb: a(PJ_ACADEMIC_GB, PJ_INDUSTRY_GB),
        in: a(PJ_ACADEMIC_IN, PJ_INDUSTRY_IN),
        de: a(PJ_ACADEMIC_DE, PJ_INDUSTRY_DE),
        ca: a(PJ_ACADEMIC_CA, PJ_INDUSTRY_CA),
        au: a(PJ_ACADEMIC_AU, PJ_INDUSTRY_AU),
        nl: a(PJ_ACADEMIC_NL, PJ_INDUSTRY_NL),
        fr: a(PJ_ACADEMIC_FR, PJ_INDUSTRY_FR),
        sg: a(PJ_ACADEMIC_SG, PJ_INDUSTRY_SG),
        // Remaining supported countries — generic profiles
        at: a(PJ_ACADEMIC_GENERIC, PJ_INDUSTRY_GENERIC),
        be: a(PJ_ACADEMIC_GENERIC, PJ_INDUSTRY_GENERIC),
        it: a(PJ_ACADEMIC_GENERIC, PJ_INDUSTRY_GENERIC),
        nz: a(PJ_ACADEMIC_GENERIC, PJ_INDUSTRY_GENERIC),
        pl: a(PJ_ACADEMIC_GENERIC, PJ_INDUSTRY_GENERIC),
        za: a(PJ_ACADEMIC_GENERIC, PJ_INDUSTRY_GENERIC),
    };
}
