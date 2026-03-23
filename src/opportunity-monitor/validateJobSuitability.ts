/**
 * validateJobSuitability.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pooja-profile — central three-gate validation pipeline.
 * Called by all three scanners in monitorEngine.ts (webSearch, RSS, USAJobs).
 *
 * GATE 1 — Identity & Career Stage  : hard-rejects training roles, noise URLs,
 *                                     aggregator landing pages.
 * GATE 2 — Technical Anchor         : job text must contain a primary domain
 *                                     keyword; off-domain-only titles rejected.
 * GATE 3 — Staff-Level Enforcement  : bare "Scientist"/"Researcher" requires a
 *                                     qualifying prefix/suffix; faculty titles
 *                                     require a domain anchor.
 *
 * Scoring (0–5 scale):
 *   60 % — Technical Anchor depth  (up to 3.0 pts)
 *   40 % — Seniority keyword match (up to 2.0 pts)
 *    +0.5 — Tier 1 org bonus
 * High-suitability threshold : matchScore ≥ 3.5
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Tier-1 organisations exported so monitorEngine.ts can import directly ────
export const TIER1_ORG_NAMES = new Set([
  'Harvard Medical School', 'Stanford Medicine', 'MIT Biology', 'UCSF',
  'Broad Institute', 'Johns Hopkins Medicine', 'Mayo Clinic Research',
  'Salk Institute', 'Columbia University Medical Center', 'Yale School of Medicine',
  'Gladstone Institutes', 'Scripps Research', 'UT Southwestern Medical Center',
  'Baylor College of Medicine', 'Washington University St Louis', 'Weill Cornell Medicine',
  'NIH NHLBI', 'NIH NIGMS', 'NIH NCI',
  'Karolinska Institute', 'ETH Zurich', 'EMBL Jobs', 'Francis Crick Institute',
  'Wellcome Sanger Institute', 'Max Planck Heart and Lung',
  'Roche', 'Genentech', 'Regeneron', 'Amgen', 'Pfizer Research', 'Merck Research',
  'NCBS Bangalore', 'IISc Bangalore', 'TIFR Mumbai',
  // Europe industry tier-1
  'AstraZeneca UK', 'GSK UK', 'Novartis Basel', 'Roche Research Basel',
  'Bayer Life Sciences', 'Boehringer Ingelheim', 'Novo Nordisk',
  'BioNTech Germany', 'Sanofi Paris', 'UCB Pharma Belgium',
  // Asia industry tier-1
  'Daiichi Sankyo Japan', 'Takeda Japan', 'AstraZeneca China', 'Roche China',
])

// ═══════════════════════════════════════════════════════════════════════════════
// GATE 1 — Identity & Career Stage patterns
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Training / junior roles Pooja must never see.
 * Word-boundary so "postdoc" won't accidentally fire on a word like "postdoctorate"
 * and "intern" won't fire inside "internal".
 */
const TRAINING_ROLE_RE = /\b(postdoctoral|postdoc|post-doc|phd\s+candidate|jrf|srf|junior\s+research\s+fellow|intern(?:ship)?|resident(?:cy)?|trainee|graduate\s+student|fellowship\s+program)\b/i

/**
 * URL path segments that indicate non-job content.
 * Applied to the URL string, not title/snippet.
 */
const NOISE_URL_PATH_RE = /\/(news|press-releases?|blog|education|fellowship-programs?|doi|pmc|archive|events?|seminars?|publications?)\b/i

/**
 * Snippet patterns that reveal the page is an aggregator search landing page,
 * not a specific job posting.
 */
const AGGREGATOR_SNIPPET_RE = /\bbrowse\s+\d+\s+jobs?\b|\bjobs?\s+in\s+[a-z\s]{3,30}(?:\s|$)|\b\d+\s+(open\s+)?positions?\s+(at|in)\b|\bapply\s+to\s+\d+\s+jobs?\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// GATE 2 — Technical Anchor patterns
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Primary domain keywords — Pooja's specific expertise areas.
 * These must be specific enough to EXCLUDE pure oncology / neurology / immunology roles.
 * Generic industry terms like "drug discovery", "preclinical", "in vivo" are intentionally
 * excluded here because they appear equally in unrelated therapeutic areas.
 */
const PRIMARY_ANCHORS = [
  // Cardiovascular / cardiac — Pooja's primary domain
  'cardiovascular', 'cardiac', 'cardiology',
  'heart',          // word-boundary in regex prevents matching 'earth'
  'vascular', 'cardiomyopathy', 'heart failure', 'arrhythmia',
  // Molecular / omics — core methodological toolkit
  'molecular biology', 'molecular',
  'genomics', 'proteomics', 'epigenomics', 'transcriptomics',
  'bioinformatics',
  // Specific technologies Pooja works with
  'crispr', 'gene therapy', 'gene editing', 'base editing',
  'single.cell', 'spatial transcriptomics', 'spatial genomics',
  'ipsc', 'stem cell', 'organoid',
  // Biotechnology (broad but domain-anchored)
  'biotechnology',
] as const

// Build one case-insensitive regex — "heart" uses \bheart\b to avoid matching "earth"
const PRIMARY_ANCHOR_RE = new RegExp(
  `\\b(${PRIMARY_ANCHORS.map(a => a.replace(/\./g, '[- ]?')).join('|')})\\b`, 'i'
)

/**
 * Off-domain fields: if ONLY these appear (no primary anchor) → off-domain reject.
 * If they co-exist with a primary anchor the job is still valid (e.g. cardio-oncology).
 */
const OFF_DOMAIN_RE = /\b(oncology|immunology|neurology|neuroscience|dermatology|ophthalmology|hematology|autoimmun(?:e|ity)|pulmonology)\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// GATE 3 — Staff-Level Enforcement patterns
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Qualified scientist / researcher: must be prefixed or suffixed by a seniority
 * or functional modifier (Senior, Staff, Principal, Research, etc.).
 */
const QUALIFIED_SCIENTIST_RE = /\b(senior|staff|principal|lead|research|associate\s+director|sr\.?)\s+(scientist|researcher|biologist)\b|\b(scientist|researcher|biologist)\s+(i{1,3}|iv|v|[1-5]|lead|senior|principal|staff)\b/i

/**
 * Matches a title that IS (exactly) a bare generic role with no qualifier —
 * these are too junior / too vague for Pooja.
 */
const STANDALONE_SCIENTIST_RE = /^(scientist|researcher|biologist|research\s+associate\s*i?)$/i

/** Faculty / investigator titles — always valid IF domain anchor present (Gate 2). */
const FACULTY_TITLE_RE = /\b(assistant\s+professor|associate\s+professor|full\s+professor|tenure.track|group\s+leader|lab\s+head|team\s+leader|principal\s+investigator|faculty\s+member|faculty)\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// Scoring helpers
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_TECH_SCORE = 3.0     // 60 % of 5
const MAX_SENIOR_SCORE = 2.0   // 40 % of 5
const TIER1_BONUS = 0.5
export const HIGH_SUITABILITY_THRESHOLD = 3.5  // exported for use in engine

/**
 * Count distinct primary anchors present in `text` for weighted tech scoring.
 */
function countPrimaryAnchors(text: string): number {
  return PRIMARY_ANCHORS.filter(a =>
    new RegExp(`\\b${a.replace(/\./g, '[- ]?')}\\b`, 'i').test(text)
  ).length
}

/**
 * Seniority keywords used for the 40 % scoring axis.
 * Match any of these in title or snippet for full seniority credit.
 */
const SENIORITY_SCORE_RE = /\b(senior|staff|principal|lead|director|head\s+of|associate\s+director|group\s+leader|lab\s+head|assistant\s+professor|associate\s+professor|faculty|tenure|investigator|fellow|scientist\s+[iv123])\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  /** True = job passed all gates and is worth storing */
  passes: boolean
  /** True = matchScore ≥ HIGH_SUITABILITY_THRESHOLD */
  highSuitability: boolean
  /** Weighted 0–5 score (60 % tech anchors + 40 % seniority + Tier-1 bonus) */
  matchScore: number
  /** Gate that caused rejection — undefined when passes = true */
  failReason?: string
}

/**
 * Run a job through the full three-gate validation pipeline.
 *
 * @param title    Job title (required — empty string returns fails=false)
 * @param snippet  Job description snippet (null/undefined handled safely)
 * @param url      Apply / source URL (null/undefined handled safely)
 * @param orgName  Organisation name for Tier-1 bonus lookup
 * @param tier1    Set of Tier-1 org names (defaults to TIER1_ORG_NAMES export)
 */
export function validateJobSuitability(
  title: string,
  snippet: string | null | undefined,
  url: string | null | undefined,
  orgName: string,
  tier1: Set<string> = TIER1_ORG_NAMES,
): ValidationResult {
  // ── Null-safety ─────────────────────────────────────────────────────────────
  const safeTitle   = (title   ?? '').trim()
  const safeSnippet = (snippet ?? '').trim()
  const safeUrl     = (url     ?? '').trim()

  if (!safeTitle) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate1:empty_title' }
  }

  const combined = `${safeTitle} ${safeSnippet}`

  // ── GATE 1: Identity & Career Stage ─────────────────────────────────────────
  if (TRAINING_ROLE_RE.test(safeTitle) || TRAINING_ROLE_RE.test(safeSnippet)) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate1:training_role' }
  }

  if (safeUrl && NOISE_URL_PATH_RE.test(safeUrl)) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate1:noise_url' }
  }

  if (safeSnippet && AGGREGATOR_SNIPPET_RE.test(safeSnippet)) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate1:aggregator_page' }
  }

  // ── GATE 2: Technical Anchor ─────────────────────────────────────────────────
  const hasPrimaryAnchor = PRIMARY_ANCHOR_RE.test(combined)
  const hasOffDomain     = OFF_DOMAIN_RE.test(combined)

  if (!hasPrimaryAnchor) {
    // Off-domain only, or entirely unrelated — reject either way
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate2:no_technical_anchor' }
  }

  if (hasOffDomain && !hasPrimaryAnchor) {
    // Redundant guard — kept for clarity
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate2:off_domain_no_anchor' }
  }

  // ── GATE 3: Staff-Level Enforcement ─────────────────────────────────────────
  const isFaculty            = FACULTY_TITLE_RE.test(safeTitle)
  const isQualifiedScientist = QUALIFIED_SCIENTIST_RE.test(safeTitle)
  const isStandaloneGeneric  = STANDALONE_SCIENTIST_RE.test(safeTitle)

  if (isStandaloneGeneric && !isQualifiedScientist && !isFaculty) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate3:unqualified_title' }
  }

  // Faculty titles already require a primary anchor (Gate 2 passed above) ✓

  // ── Scoring: 60 % Technical + 40 % Seniority ────────────────────────────────
  const techMatches  = countPrimaryAnchors(combined)
  const techScore    = Math.min(MAX_TECH_SCORE, techMatches * 0.75)

  const seniorityScore = SENIORITY_SCORE_RE.test(combined) ? MAX_SENIOR_SCORE : 0.5

  const tier1Bonus   = tier1.has(orgName) ? TIER1_BONUS : 0

  const matchScore   = Math.min(5, +(techScore + seniorityScore + tier1Bonus).toFixed(2))
  const highSuitability = matchScore >= HIGH_SUITABILITY_THRESHOLD

  return { passes: true, highSuitability, matchScore }
}
