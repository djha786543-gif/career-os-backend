/**
 * searchProfiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central configuration for all search queries and region mappings.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AdzunaCountry = 'us' | 'gb' | 'in';

export interface SearchProfile {
  queries: string[];
  pages: number;
  categoryTag?: string;
}

export type RegionProfileMap = Record<AdzunaCountry, SearchProfile>;

export const regionToAdzunaCountry: Record<string, AdzunaCountry> = {
  'US':    'us',
  'Europe': 'gb',
  'India':  'in',
};

export const SEARCH_PROFILES = {
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
    locations: ['us'] as AdzunaCountry[],
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
    locations: ['us', 'gb'] as AdzunaCountry[],
    minFitScore: 65
  }
};

/**
 * Returns the keyword-based search profile for a candidate and track.
 */
export function getSearchProfile(candidateId: string, track?: string): RegionProfileMap {
  const isDJ = candidateId === 'deobrat' || candidateId === 'dj';
  
  if (isDJ) {
    // Deobrat (dj)
    const queries = SEARCH_PROFILES.dj.keywords;
    const baseProfile: SearchProfile = { queries, pages: 2 };
    return {
      us: baseProfile,
      gb: baseProfile,
      in: baseProfile,
    };
  } else {
    // Pooja (pj)
    let keywords = [...SEARCH_PROFILES.pj.keywords];
    
    // Add track-specific keywords
    if (track === 'Academic') {
      keywords.push('Assistant Professor', 'Faculty', 'Tenure-track');
    } else if (track === 'Industry') {
      keywords.push('Principal Scientist', 'R&D Scientist', 'Biotech Researcher');
    }

    const baseProfile: SearchProfile = { queries: keywords, pages: 2 };
    return {
      us: baseProfile,
      gb: baseProfile,
      in: { ...baseProfile, queries: ['Cardiology Research', 'Molecular Biology'] }, // India has fewer niche roles
    };
  }
}
