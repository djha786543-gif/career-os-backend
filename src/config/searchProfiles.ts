/**
 * searchProfiles.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * STRICT ISOLATION: Every candidate (and every Pooja track) has its OWN search
 * profile. Nothing is shared between Deobrat and Pooja. Pooja's Academic and
 * Industry tracks are also completely independent of each other.
 *
 * Adzuna country codes:
 *   US     → 'us'
 *   Europe → 'gb'  (UK as European proxy; most IT/biotech English postings)
 *   India  → 'in'
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AdzunaCountry = 'us' | 'gb' | 'in';

export interface SearchProfile {
  /** Adzuna `what` queries — each is a separate API call, results merged & deduped */
  queries: string[];
  /** Adzuna category tag filter (optional — omit to search all categories) */
  categoryTag?: string;
  /** Pages to fetch per query (each page = up to 50 results) */
  pages: number;
}

export type RegionProfileMap = Record<AdzunaCountry, SearchProfile>;

// ─── Region → Adzuna country mapping ────────────────────────────────────────
export const regionToAdzunaCountry: Record<string, AdzunaCountry> = {
  US:     'us',
  Europe: 'gb',
  India:  'in',
};

// ─────────────────────────────────────────────────────────────────────────────
// DEOBRAT JHA — IT Audit / SOX / SAP / AI Governance
// ─────────────────────────────────────────────────────────────────────────────
export const deobratProfiles: RegionProfileMap = {
  us: {
    queries: [
      'IT Audit Manager SOX ITGC',
      'Senior IT Auditor Technology Risk',
      'Internal Audit Manager SAP ERP',
      'IT Audit Manager AuditBoard',
      'AI Governance Audit Risk',
      'Technology Risk Manager SOX compliance',
      'IT Internal Audit Manager cloud AWS',
      'Senior IT Auditor CISA',
    ],
    categoryTag: 'it-jobs',
    pages: 1,
  },
  gb: {
    queries: [
      'IT Audit Manager SOX ITGC',
      'Senior IT Auditor Technology Risk',
      'Internal Audit Manager SAP',
      'Technology Risk Manager compliance',
      'IT Audit Manager CISA',
    ],
    categoryTag: 'it-jobs',
    pages: 1,
  },
  in: {
    queries: [
      'IT Audit Manager SOX ITGC',
      'Senior IT Auditor Technology Risk',
      'Internal Audit Manager SAP ERP',
      'IT Audit Manager CISA',
    ],
    categoryTag: 'it-jobs',
    pages: 1,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// POOJA CHOUBEY — Academic Track
// (university, postdoc, faculty, core facility, research fellow)
// ─────────────────────────────────────────────────────────────────────────────
export const poojaAcademicProfiles: RegionProfileMap = {
  us: {
    queries: [
      'Postdoctoral Researcher cardiovascular molecular biology',
      'Research Scientist cardiac physiology molecular',
      'Assistant Professor molecular cardiology',
      'Core Facility Scientist cardiovascular imaging',
      'Postdoctoral Fellow RNA genomics cardiac',
      'Translational Research Fellow cardiovascular',
    ],
    categoryTag: 'scientific-qa-jobs',
    pages: 1,
  },
  gb: {
    queries: [
      'Postdoctoral Researcher cardiovascular molecular biology',
      'Research Scientist cardiac molecular genetics',
      'Postdoctoral Fellow RNA-seq cardiac',
    ],
    categoryTag: 'scientific-qa-jobs',
    pages: 1,
  },
  in: {
    queries: [
      'Postdoctoral Researcher cardiovascular molecular biology',
      'Research Scientist molecular cardiology',
    ],
    categoryTag: 'scientific-qa-jobs',
    pages: 1,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// POOJA CHOUBEY — Industry Track
// (pharma/biotech scientist, in vivo, bioinformatics, preclinical)
// ─────────────────────────────────────────────────────────────────────────────
export const poojaIndustryProfiles: RegionProfileMap = {
  us: {
    queries: [
      'Scientist cardiovascular in vivo preclinical pharma',
      'Senior Scientist molecular biology cardiovascular',
      'Bioinformatics Scientist RNA-seq transcriptomics',
      'Translational Research Scientist cardiovascular biotech',
      'Preclinical Research Scientist cardiac fibrosis',
      'In Vivo Scientist cardiovascular disease modeling',
      'Staff Scientist molecular biology cardiovascular',
      'Research Associate molecular biology in vivo',
    ],
    categoryTag: 'scientific-qa-jobs',
    pages: 1,
  },
  gb: {
    queries: [
      'Scientist cardiovascular in vivo pharma biotech',
      'Senior Scientist molecular biology cardiovascular',
      'Bioinformatics Scientist RNA-seq genomics',
      'Preclinical Research Scientist cardiovascular',
    ],
    categoryTag: 'scientific-qa-jobs',
    pages: 1,
  },
  in: {
    queries: [
      'Research Scientist molecular biology cardiovascular',
      'Scientist in vivo molecular biology pharma',
    ],
    categoryTag: 'scientific-qa-jobs',
    pages: 1,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Resolver — given candidateId + optional track, return the right profile map
// ─────────────────────────────────────────────────────────────────────────────
export function getSearchProfile(
  candidateId: string,
  track?: string
): RegionProfileMap {
  if (candidateId === 'deobrat') return deobratProfiles;
  if (candidateId === 'pooja' && track === 'Academic') return poojaAcademicProfiles;
  if (candidateId === 'pooja' && track === 'Industry') return poojaIndustryProfiles;
  // Pooja default → Industry (broader market)
  if (candidateId === 'pooja') return poojaIndustryProfiles;
  throw new Error(`Unknown candidateId: ${candidateId}`);
}
