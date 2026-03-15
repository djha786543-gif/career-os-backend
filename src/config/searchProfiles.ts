/**
 * searchProfiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Adzuna search queries and region mappings for each candidate.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AdzunaCountry = 'us' | 'gb' | 'in';

export interface SearchProfile {
  queries: string[];
  pages: number;
  categoryTag?: string;
}

/** Type alias used by jobAggregator */
export type RegionProfileMap = Partial<Record<AdzunaCountry, SearchProfile>>;

/** Maps our region strings → Adzuna country codes */
export const regionToAdzunaCountry: Record<string, AdzunaCountry> = {
  US:     'us',
  Europe: 'gb',
  India:  'in',
};

// ─── DJ (Deobrat) — remote USA only ──────────────────────────────────────────
const DJ_US: SearchProfile = {
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
const PJ_ACADEMIC_US: SearchProfile = {
  queries: [
    'Postdoctoral Researcher Cardiovascular',
    'Postdoc Molecular Biology',
    'Assistant Professor Cardiovascular',
    'Research Fellow Cardiovascular Biology',
  ],
  pages: 2,
};

const PJ_ACADEMIC_GB: SearchProfile = {
  queries: [
    'Postdoctoral Research',
    'Research Fellow Molecular Biology',
    'Postdoc Biology',
    'Research Scientist Biology',
  ],
  pages: 1,
};

// ─── Pooja — Industry track ───────────────────────────────────────────────────
const PJ_INDUSTRY_US: SearchProfile = {
  queries: [
    'Research Scientist Cardiovascular',
    'Senior Research Scientist Molecular Biology',
    'Translational Scientist Cardiovascular',
    'Scientist Cardiovascular Drug Discovery',
  ],
  pages: 2,
};

const PJ_INDUSTRY_GB: SearchProfile = {
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
export function getSearchProfile(
  candidateId: string,
  track?: string,
): Partial<Record<AdzunaCountry, SearchProfile>> {
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
