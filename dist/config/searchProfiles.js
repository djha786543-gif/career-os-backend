"use strict";
/**
 * searchProfiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central configuration for all search queries and region mappings.
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEARCH_PROFILES = exports.regionToAdzunaCountry = void 0;
exports.getSearchProfile = getSearchProfile;
exports.regionToAdzunaCountry = {
    'US': 'us',
    'Europe': 'gb',
    'India': 'in',
};
exports.SEARCH_PROFILES = {
    dj: {
        keywords: [
            'AI Audit',
            'CISA IT Audit',
            'SOX Compliance',
            'IT Auditor',
            'Information Systems Auditor',
            'Internal Audit Manager',
            'ITGC Auditor',
            'Cloud Security Auditor'
        ],
        locations: ['us'],
        minFitScore: 70
    },
    pj: {
        keywords: [
            'Cardiovascular Research',
            'Molecular Biology',
            'Postdoc Scientist',
            'Biomedical Research',
            'Genomics',
            'Cell Biology',
            'Cardiac Physiology',
            'Translational Scientist'
        ],
        locations: ['us', 'gb'],
        minFitScore: 65
    }
};
/**
 * Returns the keyword-based search profile for a candidate and track.
 */
function getSearchProfile(candidateId, track) {
    const isDJ = candidateId === 'deobrat' || candidateId === 'dj';
    if (isDJ) {
        // Deobrat (dj)
        const queries = exports.SEARCH_PROFILES.dj.keywords;
        const baseProfile = { queries, pages: 2 };
        return {
            us: baseProfile,
            gb: baseProfile,
            in: baseProfile,
        };
    }
    else {
        // Pooja (pj)
        let keywords = [...exports.SEARCH_PROFILES.pj.keywords];
        // Add track-specific keywords
        if (track === 'Academic') {
            keywords.push('Assistant Professor', 'Faculty', 'Tenure-track');
        }
        else if (track === 'Industry') {
            keywords.push('Principal Scientist', 'R&D Scientist', 'Biotech Researcher');
        }
        const baseProfile = { queries: keywords, pages: 2 };
        return {
            us: baseProfile,
            gb: baseProfile,
            in: { ...baseProfile, queries: ['Cardiology Research', 'Molecular Biology'] }, // India has fewer niche roles
        };
    }
}
