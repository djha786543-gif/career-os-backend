/**
 * validateJobSuitability.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pooja-profile — Zero-Trust validation pipeline.
 * Called by all three scanners in monitorEngine.ts (webSearch, RSS, USAJobs).
 *
 * Execution order (early-return at every step — NO scoring if any step fails):
 *
 *   STEP 1 — Blacklist Kill Switch   : Two-tier pattern matching.
 *     • BLACKLIST_REGEX   → checked on title AND snippet
 *     • TITLE_BLACKLIST_REGEX → checked on title ONLY
 *       (prevents false-rejects when snippets mention "Wellcome Fellows"
 *        or "EMBL Fellows" as third-party references)
 *     Match → score=0, passes=false, RETURN immediately.
 *
 *   STEP 2 — Content & Aggregator    : noise URLs, aggregator title patterns,
 *                                      aggregator snippet patterns.
 *   STEP 3 — Seniority Requirement   : bare "Scientist"/"Researcher" without a
 *                                      qualifying modifier → reject.
 *   STEP 4 — Technical Anchor        : job text must contain a primary domain
 *                                      keyword; off-domain-only titles rejected.
 *
 * Scoring (0–5 scale, only reached after all four steps pass):
 *   60 % — Technical Anchor depth  (up to 3.0 pts)
 *   40 % — Seniority keyword match (up to 2.0 pts)
 *    +0.5 — Tier 1 org bonus
 * High-suitability threshold : matchScore ≥ 3.5
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Bumped when blacklist/scoring logic changes — triggers a DB re-clean on next startup. */
export const PIPELINE_VERSION = 'zero-trust-v2'

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
// STEP 1 — Blacklist Kill Switch
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Applied to BOTH title AND snippet.
 *
 * Covers unambiguous training / visiting / junior role patterns.
 * "fellow" itself is intentionally NOT here — it is in TITLE_BLACKLIST_REGEX
 * (title-only) to avoid false-rejects when Tier-1 snippets mention e.g.
 * "Wellcome Fellows", "EMBL Fellows", "Salk Fellows" as context or accolades.
 *
 * Word-boundary rules:
 *   \bintern\b       — "intern"/"internship" but NOT "internal"
 *   \bresident\b     — "resident"/"residency" but NOT "residential"
 *   visiting\s+...   — only fires on compound "Visiting Scientist" etc.
 *   fellow[\s-]...   — catches "fellow position", "fellow-level", "fellow role"
 *                      in snippets without catching free-standing "Fellow" accolades
 */
export const BLACKLIST_REGEX =
  /\b(postdoc|postdoctoral|post-doc|phd\s+candidate|fellowship|jrf|srf|intern(?:ship)?|trainee|resident(?:cy)?|graduate\s+student|visiting\s+(?:scientist|professor|researcher|scholar|faculty)|fellow[\s-](?:level|position|role|program|opportunity))\b/i

/**
 * Title-only check: is this a postdoc position?
 * Used to identify Tier-1 postdoc exceptions before the full blacklist runs.
 */
const POSTDOC_TERMS_RE = /\b(postdoc|postdoctoral|post-doc)\b/i

/**
 * Secondary blacklist applied to Tier-1 postdocs.
 * Rejects truly unacceptable terms even at Tier-1 orgs
 * (e.g. "Postdoctoral Internship", "Postdoctoral Trainee").
 * Does NOT include postdoc/postdoctoral themselves — those are the exception.
 */
const TIER1_POSTDOC_SECONDARY_BLACKLIST =
  /\b(phd\s+candidate|fellowship|jrf|srf|intern(?:ship)?|trainee|resident(?:cy)?|graduate\s+student|visiting\s+(?:scientist|professor|researcher|scholar|faculty)|fellow[\s-](?:level|position|role|program|opportunity))\b/i

/**
 * Applied to the JOB TITLE ONLY.
 *
 * "Fellow" anywhere in a title = a training/junior role for Pooja's seniority
 * level.  Examples: "Research Fellow", "Clinical Fellow", "Cardiovascular
 * Research Fellow", "Postdoctoral Fellow", "Senior Research Fellow".
 * All are positions Pooja should NOT see.
 *
 * This is NOT applied to snippets — Tier-1 orgs routinely mention their
 * alumni or current award holders (e.g. "our lab is led by a Wellcome Fellow")
 * in job descriptions for legitimate staff scientist roles.
 */
export const TITLE_BLACKLIST_REGEX = /\bfellow\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Content & Aggregator filters
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Aggregator title: starts with a digit count followed by job keywords.
 * e.g. "172 Cardiovascular jobs in Boston" — SEO landing page, not a posting.
 */
const AGGREGATOR_TITLE_RE = /^\d+\s+[\w\s]{2,40}\bjobs?\b/i

/**
 * URL path segments indicating articles, courses, or non-job content.
 */
const NOISE_URL_PATH_RE =
  /\/(news|press-releases?|blog|education|fellowship-programs?|doi|pmc|archive|events?|seminars?|publications?)\b/i

/**
 * Snippet patterns that reveal an aggregator search landing page.
 */
const AGGREGATOR_SNIPPET_RE =
  /\bbrowse\s+\d+\s+jobs?\b|\bjobs?\s+in\s+[a-z\s]{3,30}(?:\s|$)|\b\d+\s+(open\s+)?positions?\s+(at|in)\b|\bapply\s+to\s+\d+\s+jobs?\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Seniority Requirement
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Qualified scientist/researcher: title must include a seniority or functional
 * modifier (Senior, Staff, Principal, Lead, Research, Associate Director…).
 */
const QUALIFIED_SCIENTIST_RE =
  /\b(senior|staff|principal|lead|research|associate\s+director|sr\.?)\s+(scientist|researcher|biologist)\b|\b(scientist|researcher|biologist)\s+(i{1,3}|iv|v|[1-5]|lead|senior|principal|staff)\b/i

/**
 * Bare generic title with no qualifier — too junior/vague for Pooja.
 */
const STANDALONE_SCIENTIST_RE = /^(scientist|researcher|biologist|research\s+associate\s*i?)$/i

/** Faculty/investigator titles — pass seniority gate; still need domain anchor in Step 4. */
const FACULTY_TITLE_RE =
  /\b(assistant\s+professor|associate\s+professor|full\s+professor|tenure.track|group\s+leader|lab\s+head|team\s+leader|principal\s+investigator|faculty\s+member|faculty)\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Technical Anchor
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Primary domain keywords — Pooja's specific expertise areas.
 * Specific enough to exclude pure oncology/neurology/immunology roles.
 */
const PRIMARY_ANCHORS = [
  // Cardiovascular / cardiac
  'cardiovascular', 'cardiac', 'cardiology',
  'heart', 'vascular', 'cardiomyopathy', 'heart failure', 'arrhythmia',
  // Molecular / omics
  'molecular biology', 'molecular',
  'genomics', 'proteomics', 'epigenomics', 'transcriptomics', 'bioinformatics',
  // Technologies
  'crispr', 'gene therapy', 'gene editing', 'base editing',
  'single.cell', 'spatial transcriptomics', 'spatial genomics',
  'ipsc', 'stem cell', 'organoid',
  // Broad domain
  'biotechnology',
] as const

// "heart" uses \b to avoid matching "earth"
const PRIMARY_ANCHOR_RE = new RegExp(
  `\\b(${PRIMARY_ANCHORS.map(a => a.replace(/\./g, '[- ]?')).join('|')})\\b`, 'i'
)

const OFF_DOMAIN_RE =
  /\b(oncology|immunology|neurology|neuroscience|dermatology|ophthalmology|hematology|autoimmun(?:e|ity)|pulmonology)\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// Scoring helpers
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_TECH_SCORE   = 3.0  // 60 % of 5
const MAX_SENIOR_SCORE = 2.0  // 40 % of 5
const TIER1_BONUS      = 0.5
export const HIGH_SUITABILITY_THRESHOLD = 3.5

function countPrimaryAnchors(text: string): number {
  return PRIMARY_ANCHORS.filter(a =>
    new RegExp(`\\b${a.replace(/\./g, '[- ]?')}\\b`, 'i').test(text)
  ).length
}

/**
 * Seniority keywords for the 40 % scoring axis.
 * NOTE: "fellow" is intentionally absent — it is a blacklist term, not a signal.
 */
const SENIORITY_SCORE_RE =
  /\b(senior|staff|principal|lead|director|head\s+of|associate\s+director|group\s+leader|lab\s+head|assistant\s+professor|associate\s+professor|faculty|tenure|investigator|scientist\s+[iv123])\b/i

// ═══════════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  /** True = job passed all steps and is worth storing */
  passes: boolean
  /** True = matchScore ≥ HIGH_SUITABILITY_THRESHOLD */
  highSuitability: boolean
  /** Weighted 0–5 score (60 % tech anchors + 40 % seniority + Tier-1 bonus) */
  matchScore: number
  /** Step that caused rejection — undefined when passes = true */
  failReason?: string
}

/**
 * Run a job through the Zero-Trust four-step validation pipeline.
 *
 * @param title       Job title (required)
 * @param snippet     Description snippet (null/undefined safe)
 * @param url         Source URL (null/undefined safe)
 * @param orgName     Organisation name for Tier-1 bonus lookup
 * @param tier1       Tier-1 org set (defaults to TIER1_ORG_NAMES)
 * @param relaxedMode When true (industry / international / india sectors):
 *                    • Step 3 (seniority gate) is skipped — any life-science title passes
 *                    • Step 4 accepts secondary domain anchors (oncology, immunology, etc.)
 *                      in addition to primary anchors
 *                    Mirrors DJ's remote-job relaxation: more opportunities surface
 *                    for sectors where title conventions differ from academia.
 */
export function validateJobSuitability(
  title: string,
  snippet: string | null | undefined,
  url: string | null | undefined,
  orgName: string,
  tier1: Set<string> = TIER1_ORG_NAMES,
  relaxedMode = false,
): ValidationResult {
  // ── Null-safety ─────────────────────────────────────────────────────────────
  const safeTitle   = (title   ?? '').trim()
  const safeSnippet = (snippet ?? '').trim()
  const safeUrl     = (url     ?? '').trim()

  if (!safeTitle) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'gate0:empty_title' }
  }

  // ── STEP 1: Blacklist Kill Switch ────────────────────────────────────────────
  // Two-tier: BLACKLIST_REGEX on title+snippet; TITLE_BLACKLIST_REGEX on title only.
  //
  // TIER-1 POSTDOC EXCEPTION:
  //   A postdoc at a Tier-1 org (Harvard, Broad, Genentech, etc.) can be a genuine
  //   career accelerator — higher salary, better portfolio, world-class network.
  //   These bypass the postdoc blacklist but still go through domain scoring
  //   (Steps 2–4). They reach high_suitability=true only if domain score ≥ 3.5.
  const isTier1PostdocException = POSTDOC_TERMS_RE.test(safeTitle) && tier1.has(orgName)

  if (isTier1PostdocException) {
    // Still reject Tier-1 postdocs that are also internships, traineeships, etc.
    if (TIER1_POSTDOC_SECONDARY_BLACKLIST.test(safeTitle) ||
        TIER1_POSTDOC_SECONDARY_BLACKLIST.test(safeSnippet)) {
      return { passes: false, highSuitability: false, matchScore: 0, failReason: 'step1:blacklist' }
    }
    console.log(`[Filter] Tier-1 postdoc exception: "${safeTitle}" at ${orgName}`)
    // Fall through to Steps 2–4 and scoring
  } else {
    // Normal path: full blacklist on title + snippet
    const titleMatch   = safeTitle.match(BLACKLIST_REGEX) ?? safeTitle.match(TITLE_BLACKLIST_REGEX)
    const snippetMatch = safeSnippet.match(BLACKLIST_REGEX)
    const blacklistMatch = titleMatch ?? snippetMatch
    if (blacklistMatch) {
      console.log(`[FILTER] Rejecting "${safeTitle}" due to Blacklist: "${blacklistMatch[0]}"`)
      return { passes: false, highSuitability: false, matchScore: 0, failReason: 'step1:blacklist' }
    }
  }

  // ── STEP 2: Content & Aggregator Filter ─────────────────────────────────────
  if (AGGREGATOR_TITLE_RE.test(safeTitle)) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'step2:aggregator_title' }
  }

  if (safeUrl && NOISE_URL_PATH_RE.test(safeUrl)) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'step2:noise_url' }
  }

  if (safeSnippet && AGGREGATOR_SNIPPET_RE.test(safeSnippet)) {
    return { passes: false, highSuitability: false, matchScore: 0, failReason: 'step2:aggregator_snippet' }
  }

  // ── STEP 3: Seniority Requirement ───────────────────────────────────────────
  // Relaxed mode (industry / international / india): skip this gate entirely.
  // Industry biotech/pharma use titles like "Scientist I", "Research Associate",
  // "Associate Scientist" which the strict academia gate rejects as too junior.
  if (!relaxedMode) {
    const isFaculty            = FACULTY_TITLE_RE.test(safeTitle)
    const isQualifiedScientist = QUALIFIED_SCIENTIST_RE.test(safeTitle)
    const isStandaloneGeneric  = STANDALONE_SCIENTIST_RE.test(safeTitle)

    if (isStandaloneGeneric && !isQualifiedScientist && !isFaculty) {
      return { passes: false, highSuitability: false, matchScore: 0, failReason: 'step3:unqualified_title' }
    }
  }

  // ── STEP 4: Technical Anchor Verification ───────────────────────────────────
  const combined         = `${safeTitle} ${safeSnippet}`
  const hasPrimaryAnchor = PRIMARY_ANCHOR_RE.test(combined)
  const hasOffDomain     = OFF_DOMAIN_RE.test(combined)

  if (!hasPrimaryAnchor) {
    // Relaxed mode: accept secondary domain (oncology, immunology, neuroscience, etc.)
    // Many pharma/biotech roles blend Pooja's molecular skills into adjacent areas.
    if (relaxedMode && hasOffDomain) {
      // Pass — will score lower due to zero primary anchors, shown as grey/partial
    } else {
      return { passes: false, highSuitability: false, matchScore: 0, failReason: 'step4:no_technical_anchor' }
    }
  }

  // ── Scoring (only reached when all four steps pass) ──────────────────────────
  const techMatches    = countPrimaryAnchors(combined)
  const techScore      = Math.min(MAX_TECH_SCORE, techMatches * 0.75)
  const seniorityScore = SENIORITY_SCORE_RE.test(combined) ? MAX_SENIOR_SCORE : 0.5
  const tier1Bonus     = tier1.has(orgName) ? TIER1_BONUS : 0

  const matchScore      = Math.min(5, +(techScore + seniorityScore + tier1Bonus).toFixed(2))
  const highSuitability = matchScore >= HIGH_SUITABILITY_THRESHOLD

  return { passes: true, highSuitability, matchScore }
}
