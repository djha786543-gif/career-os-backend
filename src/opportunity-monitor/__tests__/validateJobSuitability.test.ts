/**
 * validateJobSuitability.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the Pooja-profile Zero-Trust validation pipeline.
 * Run:  npm test
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { validateJobSuitability, TIER1_ORG_NAMES } from '../validateJobSuitability'

const T1          = TIER1_ORG_NAMES
const EMPTY_TIER1 = new Set<string>()

const passes   = (r: ReturnType<typeof validateJobSuitability>) => r.passes
const highSuit = (r: ReturnType<typeof validateJobSuitability>) => r.highSuitability
const reason   = (r: ReturnType<typeof validateJobSuitability>) => r.failReason

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Blacklist Kill Switch
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 1: blacklist kill switch — postdoc/fellowship patterns', () => {
  test('VERIFY: "Postdoctoral Fellow Cardiovascular Research" → false, score=0', () => {
    const r = validateJobSuitability(
      'Postdoctoral Fellow Cardiovascular Research',
      'Join our lab studying cardiac regeneration using genomics. PhD required.',
      'https://harvard.edu/careers/postdoc/cardiovascular',
      'Harvard Medical School', T1,
    )
    expect(passes(r)).toBe(false)
    expect(highSuit(r)).toBe(false)
    expect(r.matchScore).toBe(0)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Postdoctoral Fellow in Cardiovascular Research" → blacklist', () => {
    const r = validateJobSuitability(
      'Postdoctoral Fellow in Cardiovascular Research',
      'Join our lab studying cardiac regeneration. PhD required.',
      'https://academicpositions.harvard.edu/postdoc/cardiovascular',
      'Harvard Medical School', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Postdoc – Molecular Cardiology" → blacklist (postdoc)', () => {
    const r = validateJobSuitability(
      'Postdoc – Molecular Cardiology',
      'Cardiac molecular biology position.',
      'https://stanford.edu/careers/postdoc/molecular',
      'Stanford Medicine', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Research Fellowship – Cardiovascular Genomics" → blacklist (fellowship)', () => {
    const r = validateJobSuitability(
      'Research Fellowship – Cardiovascular Genomics',
      'Fellowship position in cardiovascular molecular biology.',
      'https://broadinstitute.org/careers/fellowship/cardiovascular',
      'Broad Institute', T1,
    )
    expect(passes(r)).toBe(false)
    expect(r.matchScore).toBe(0)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"PhD Candidate – Cardiovascular Genomics" → blacklist', () => {
    const r = validateJobSuitability(
      'PhD Candidate – Cardiovascular Genomics',
      'PhD candidate position in cardiovascular molecular biology.',
      'https://eth.edu/doctoral/cardiovascular',
      'ETH Zurich', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Research Intern – Cardiovascular Biology" → blacklist (intern)', () => {
    const r = validateJobSuitability(
      'Research Intern – Cardiovascular Biology',
      'Cardiovascular molecular biology intern role.',
      'https://genentech.com/careers/intern/12345',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"trainee" in snippet → blacklist', () => {
    const r = validateJobSuitability(
      'Research Scientist – Cardiovascular Biology',
      'This is a trainee position for early-career scientists in cardiac genomics.',
      'https://nih.gov/careers/scientist',
      'NIH NHLBI', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"JRF – Cardiovascular Genomics" → blacklist (jrf)', () => {
    const r = validateJobSuitability(
      'JRF – Cardiovascular Genomics',
      'Junior Research Fellow position in cardiovascular molecular biology.',
      'https://iiserbhopal.ac.in/careers',
      'IISc Bangalore', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Resident" in title → blacklist', () => {
    const r = validateJobSuitability(
      'Cardiology Resident – Cardiovascular Medicine',
      'Residency training program in cardiovascular medicine.',
      'https://hospital.org/careers/resident/cardiology',
      'Mayo Clinic Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Graduate Student" in snippet → blacklist', () => {
    const r = validateJobSuitability(
      'Research Assistant – Cardiovascular Biology',
      'Graduate student opportunity in cardiovascular genomics research.',
      'https://nih.gov/careers/research-assistant',
      'NIH NHLBI', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })
})

describe('Step 1: TITLE_BLACKLIST — fellow in title only', () => {
  test('"Cardiovascular Research Fellow" (title) → blacklist', () => {
    const r = validateJobSuitability(
      'Cardiovascular Research Fellow',
      'Research position studying cardiac genomics at our institute.',
      'https://mayo.edu/careers/research-fellow-cardiovascular',
      'Mayo Clinic Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(r.matchScore).toBe(0)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Senior Research Fellow – Cardiovascular" (title) → blacklist', () => {
    const r = validateJobSuitability(
      'Senior Research Fellow – Cardiovascular Biology',
      'Lead cardiovascular molecular biology research. PhD required, 5+ years.',
      'https://wellcome.org/careers/senior-research-fellow',
      'Wellcome Sanger Institute', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Clinical Fellow" (title) → blacklist', () => {
    const r = validateJobSuitability(
      'Clinical Fellow – Cardiovascular Medicine',
      'Clinical fellowship in cardiovascular medicine and genomics research.',
      'https://stanford.edu/careers/clinical-fellow',
      'Stanford Medicine', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  // ── Two-tier accuracy: "fellow" in snippet alone should NOT block good jobs ──
  test('Snippet mentions "Wellcome Fellows" but clean title → PASSES (no false reject)', () => {
    // Tier-1 org snippets often mention their award holders — should not block
    // a legitimate Senior Scientist posting.
    const r = validateJobSuitability(
      'Senior Scientist – Cardiovascular Genomics',
      'Our department hosts several Wellcome Fellows and Howard Hughes investigators. ' +
      'We seek a Senior Scientist to lead cardiovascular molecular biology research.',
      'https://broadinstitute.org/careers/senior-scientist-cv',
      'Broad Institute', T1,
    )
    expect(passes(r)).toBe(true)
    expect(highSuit(r)).toBe(true)
  })

  test('Snippet mentions "EMBL Fellows alumni" but clean title → PASSES', () => {
    const r = validateJobSuitability(
      'Group Leader – Cardiovascular Research',
      'Our institute has produced many EMBL Fellows and Salk Fellows over 30 years. ' +
      'Now recruiting a Group Leader for cardiovascular genomics.',
      'https://embl.org/careers/group-leader',
      'EMBL Jobs', T1,
    )
    expect(passes(r)).toBe(true)
  })

  test('"fellow position" in snippet → blacklist (compound pattern still fires)', () => {
    const r = validateJobSuitability(
      'Senior Scientist – Cardiovascular Biology',
      'This is a fellow position embedded in our cardiovascular genomics team.',
      'https://genentech.com/careers/senior-scientist/cv',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"fellow-level" in snippet → blacklist (compound pattern fires)', () => {
    const r = validateJobSuitability(
      'Senior Scientist – Cardiovascular Biology',
      'This fellow-level cardiovascular role requires a PhD and genomics experience.',
      'https://genentech.com/careers/senior-scientist/cv',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(false)
    expect(r.matchScore).toBe(0)
  })

  // ── Word-boundary guard ──────────────────────────────────────────────────────
  test('"Internal" does NOT trigger blacklist (intern word-boundary)', () => {
    const r = validateJobSuitability(
      'Senior Research Scientist – Internal Medicine Cardiovascular',
      'Lead cardiovascular molecular biology program for internal portfolio.',
      'https://novartis.com/careers/senior-scientist/1234',
      'Novartis Basel', T1,
    )
    expect(passes(r)).toBe(true)
  })
})

describe('Step 1: visiting roles blacklist', () => {
  test('"Visiting Scientist – Cardiovascular Genomics" → blacklist', () => {
    const r = validateJobSuitability(
      'Visiting Scientist – Cardiovascular Genomics',
      'Temporary visiting scientist position in cardiovascular molecular biology.',
      'https://harvard.edu/careers/visiting-scientist',
      'Harvard Medical School', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Visiting Professor of Cardiovascular Biology" → blacklist', () => {
    const r = validateJobSuitability(
      'Visiting Professor of Cardiovascular Biology',
      'Visiting professorship in cardiovascular research for one academic year.',
      'https://stanford.edu/careers/visiting-professor',
      'Stanford Medicine', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Visiting Researcher" → blacklist', () => {
    const r = validateJobSuitability(
      'Visiting Researcher – Cardiac Genomics',
      'Short-term visiting researcher position in cardiac molecular biology.',
      'https://broadinstitute.org/careers/visiting-researcher',
      'Broad Institute', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Visiting Scholar – Cardiovascular" → blacklist', () => {
    const r = validateJobSuitability(
      'Visiting Scholar – Cardiovascular Research',
      'Visiting scholar program in cardiovascular genomics.',
      'https://ucsf.edu/careers/visiting-scholar',
      'UCSF', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"Visiting Faculty" → blacklist', () => {
    const r = validateJobSuitability(
      'Visiting Faculty – Cardiovascular Medicine',
      'Visiting faculty appointment in cardiovascular molecular biology.',
      'https://mayo.edu/careers/visiting-faculty',
      'Mayo Clinic Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('"visiting" alone in snippet does NOT trigger (word must be compound)', () => {
    // "visiting our facilities" should not block a legitimate role
    const r = validateJobSuitability(
      'Senior Scientist – Cardiovascular Biology',
      'We welcome scientists visiting our facilities. Cardiovascular molecular biology role.',
      'https://genentech.com/careers/senior-scientist',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Content & Aggregator Filter
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 2: aggregator title rejection', () => {
  test('"172 Cardiovascular jobs in Boston" → aggregator_title', () => {
    const r = validateJobSuitability(
      '172 Cardiovascular jobs in Boston',
      'Browse cardiovascular job listings.',
      'https://indeed.com/jobs?q=cardiovascular',
      'Indeed', EMPTY_TIER1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:aggregator_title')
  })

  test('"45 Research Scientist jobs" → aggregator_title', () => {
    const r = validateJobSuitability(
      '45 Research Scientist jobs – Cardiovascular',
      'Cardiovascular research scientist positions available.',
      'https://glassdoor.com/jobs/cardiovascular',
      'Glassdoor', EMPTY_TIER1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:aggregator_title')
  })
})

describe('Step 2: noise URL rejection', () => {
  test('/news/ URL → noise_url', () => {
    const r = validateJobSuitability(
      'New Insights into Cardiac Molecular Pathways',
      'Cardiovascular genomics scientists discovered biomarkers.',
      'https://medicine.wustl.edu/news/cardiac-molecular-research-2026',
      'Washington University St Louis', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:noise_url')
  })

  test('/press-releases/ URL → noise_url', () => {
    const r = validateJobSuitability(
      'Roche Appoints Senior Scientist for Cardiovascular Research',
      'We are seeking a senior scientist with cardiovascular molecular biology expertise.',
      'https://roche.com/press-releases/2026/cardiovascular-appointment',
      'Roche', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:noise_url')
  })

  test('/blog/ URL → noise_url', () => {
    const r = validateJobSuitability(
      'Senior Research Scientist Cardiovascular Team',
      'Join our cardiovascular genomics team.',
      'https://broadinstitute.org/blog/research-scientist-cardiovascular',
      'Broad Institute', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:noise_url')
  })

  test('/education/ URL → noise_url', () => {
    const r = validateJobSuitability(
      'Cardiovascular Biology Course',
      'Learn cardiovascular molecular biology in our graduate education program.',
      'https://hospital.org/education/cardiovascular-biology',
      'Mayo Clinic Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:noise_url')
  })

  test('Valid /careers/ URL passes', () => {
    const r = validateJobSuitability(
      'Senior Research Scientist – Cardiovascular Biology',
      'Lead cardiovascular molecular biology research. PhD required, 5 years experience.',
      'https://genentech.com/careers/senior-scientist/cardiovascular/1234',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(true)
  })
})

describe('Step 2: aggregator snippet rejection', () => {
  test('"Browse 245 jobs" snippet → aggregator_snippet', () => {
    const r = validateJobSuitability(
      'Research Scientist Jobs – Cardiovascular',
      'Browse 245 jobs matching research scientist cardiovascular in Boston.',
      'https://indeed.com/jobs?q=research+scientist+cardiovascular',
      'Indeed', EMPTY_TIER1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:aggregator_snippet')
  })

  test('"10 open positions at Pfizer" → aggregator_snippet', () => {
    const r = validateJobSuitability(
      'Pfizer Research Scientist Positions',
      'There are 10 open positions at Pfizer for cardiovascular molecular research.',
      'https://pfizer.com/careers',
      'Pfizer Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step2:aggregator_snippet')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Seniority Requirement
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 3: seniority requirement', () => {
  test('Bare "Scientist" → unqualified_title', () => {
    const r = validateJobSuitability(
      'Scientist',
      'Work on cardiovascular molecular biology research. PhD required.',
      'https://novartis.com/careers/scientist/1234',
      'Novartis Basel', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step3:unqualified_title')
  })

  test('Bare "Researcher" → unqualified_title', () => {
    const r = validateJobSuitability(
      'Researcher',
      'Cardiovascular molecular genomics research. Required: PhD.',
      'https://pfizer.com/careers/researcher/cv-456',
      'Pfizer Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step3:unqualified_title')
  })

  test('"Research Scientist" → passes', () => {
    const r = validateJobSuitability(
      'Research Scientist – Cardiovascular Biology',
      'Lead cardiovascular molecular biology programs. PhD required, 5 years experience.',
      'https://genentech.com/careers/research-scientist-cardio',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(true)
    expect(highSuit(r)).toBe(true)
  })

  test('"Senior Scientist" → passes', () => {
    const r = validateJobSuitability(
      'Senior Scientist – Molecular Cardiology',
      'Senior scientist cardiovascular genomics. PhD required, 7+ years.',
      'https://roche.com/careers/senior-scientist',
      'Roche', T1,
    )
    expect(passes(r)).toBe(true)
  })

  test('"Scientist III" → passes', () => {
    const r = validateJobSuitability(
      'Scientist III – Cardiovascular Genomics',
      'Scientist III role in cardiovascular molecular biology.',
      'https://amgen.com/careers/scientist-iii',
      'Amgen', T1,
    )
    expect(passes(r)).toBe(true)
  })

  test('"Assistant Professor" → passes', () => {
    const r = validateJobSuitability(
      'Assistant Professor of Cardiovascular Biology',
      'Tenure-track faculty in cardiovascular molecular biology and genomics.',
      'https://academicpositions.harvard.edu/faculty/cardiovascular',
      'Harvard Medical School', T1,
    )
    expect(passes(r)).toBe(true)
    expect(highSuit(r)).toBe(true)
  })

  test('"Group Leader" → passes', () => {
    const r = validateJobSuitability(
      'Group Leader – Cardiovascular Research',
      'Lead a cardiovascular genomics research team. PhD required, 10 years.',
      'https://max-planck.org/careers/group-leader-cardiovascular',
      'Max Planck Heart and Lung', T1,
    )
    expect(passes(r)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Technical Anchor Verification
// ═══════════════════════════════════════════════════════════════════════════════

describe('Step 4: technical anchor verification', () => {
  test('Pure oncology (no primary anchor) → no_technical_anchor', () => {
    const r = validateJobSuitability(
      'Senior Scientist – Oncology Drug Discovery',
      'Lead oncology cancer immunology research program.',
      'https://merck.com/careers/senior-scientist-oncology',
      'Merck Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step4:no_technical_anchor')
  })

  test('Pure neuroscience → no_technical_anchor', () => {
    const r = validateJobSuitability(
      'Research Scientist – Neurology',
      'Lead neuroscience neurology research. Requirements: PhD, 5 years.',
      'https://biogen.com/careers/research-scientist-neuro',
      'Biogen', EMPTY_TIER1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step4:no_technical_anchor')
  })

  test('Oncology + cardiovascular anchor → passes (cardio-oncology)', () => {
    const r = validateJobSuitability(
      'Senior Scientist – Cardiovascular Oncology',
      'Research cardiac tumor biology using genomics. PhD required, 5 years.',
      'https://merck.com/careers/senior-scientist-cardio-onco',
      'Merck Research', T1,
    )
    expect(passes(r)).toBe(true)
  })

  test('"heart" does NOT match inside "earth" (word-boundary)', () => {
    const r = validateJobSuitability(
      'Senior Research Scientist – Earth Sciences',
      'Lead earth sciences research. PhD required.',
      'https://someorg.com/careers/senior-scientist-earth',
      'SomeOrg', EMPTY_TIER1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step4:no_technical_anchor')
  })

  test('"molecular" anchor alone is sufficient', () => {
    const r = validateJobSuitability(
      'Senior Scientist – Molecular Biology',
      'Lead molecular research program. PhD required, 5 years.',
      'https://genentech.com/careers/senior-scientist-molecular',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Scoring: 60 % Technical / 40 % Seniority + Tier-1 bonus
// ═══════════════════════════════════════════════════════════════════════════════

describe('Scoring: weighted 60/40 + Tier-1 bonus', () => {
  test('Tech-rich job scores higher than tech-poor equivalent', () => {
    const techRich = validateJobSuitability(
      'Senior Research Scientist – Cardiovascular Genomics and Molecular Biology',
      'Cardiovascular cardiac genomics proteomics molecular biology research. PhD required.',
      'https://genentech.com/careers/senior-scientist-cv',
      'Genentech', T1,
    )
    const techPoor = validateJobSuitability(
      'Senior Scientist',
      'Cardiovascular research role. PhD required.',
      'https://biotech.com/careers/senior-scientist',
      'Unknown BioTech', EMPTY_TIER1,
    )
    expect(techRich.matchScore).toBeGreaterThan(techPoor.matchScore)
  })

  test('Tier-1 org raises score vs identical non-Tier-1 job', () => {
    const tier1Result = validateJobSuitability(
      'Senior Scientist – Cardiovascular Biology',
      'Cardiovascular molecular research. PhD required, 5 years.',
      'https://academicpositions.harvard.edu/senior-scientist',
      'Harvard Medical School', T1,
    )
    const nonTier1Result = validateJobSuitability(
      'Senior Scientist – Cardiovascular Biology',
      'Cardiovascular molecular research. PhD required, 5 years.',
      'https://somecompany.com/careers/senior-scientist',
      'Unknown Biotech', T1,
    )
    expect(tier1Result.matchScore).toBeGreaterThan(nonTier1Result.matchScore)
  })

  test('matchScore is between 0 and 5 inclusive', () => {
    const r = validateJobSuitability(
      'Principal Scientist – Cardiovascular Genomics Molecular Biology',
      'Cardiovascular cardiac heart molecular genomics proteomics research. PhD.',
      'https://genentech.com/careers/principal-scientist',
      'Genentech', T1,
    )
    expect(r.matchScore).toBeGreaterThanOrEqual(0)
    expect(r.matchScore).toBeLessThanOrEqual(5)
  })

  test('"fellow" is NOT a seniority signal — snippet compound pattern fires', () => {
    const r = validateJobSuitability(
      'Senior Scientist – Cardiovascular Biology',
      'This fellow-level cardiovascular role requires a PhD and genomics experience.',
      'https://genentech.com/careers/senior-scientist/cv',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(false)
    expect(r.matchScore).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Resilience — null / malformed inputs
// ═══════════════════════════════════════════════════════════════════════════════

describe('Resilience: null / malformed inputs', () => {
  test('null snippet → does not throw', () => {
    expect(() =>
      validateJobSuitability('Senior Scientist Cardiovascular', null,
        'https://pfizer.com/careers/senior-scientist/123', 'Pfizer Research', T1)
    ).not.toThrow()
  })

  test('undefined snippet → does not throw', () => {
    expect(() =>
      validateJobSuitability('Research Scientist Cardiovascular', undefined,
        'https://amgen.com/careers/rs/456', 'Amgen', T1)
    ).not.toThrow()
  })

  test('null URL → does not throw', () => {
    expect(() =>
      validateJobSuitability(
        'Senior Research Scientist Cardiovascular Genomics',
        'Cardiovascular molecular biology. PhD required. 5 years experience.',
        null, 'Genentech', T1)
    ).not.toThrow()
  })

  test('empty title → passes: false', () => {
    const r = validateJobSuitability('', 'Cardiovascular molecular biology role.', null, 'Genentech', T1)
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('gate0:empty_title')
  })

  test('whitespace-only title → passes: false', () => {
    const r = validateJobSuitability('   ', 'Cardiovascular genomics role.', null, 'Genentech', T1)
    expect(passes(r)).toBe(false)
  })

  test('malformed URL → does not throw', () => {
    expect(() =>
      validateJobSuitability('Senior Scientist – Cardiovascular',
        'Cardiovascular molecular biology. PhD required.',
        '%%%not_a_real_url%%%', 'Roche', T1)
    ).not.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Regression: real-world false-positive guard
// ═══════════════════════════════════════════════════════════════════════════════

describe('Regression: real-world false-positive examples', () => {
  test('"Clinical Research Fellowship" → blacklist', () => {
    const r = validateJobSuitability(
      'Clinical Research Fellowship – Cardiovascular',
      'Fellowship program in cardiovascular clinical research.',
      'https://hospital.org/careers/fellowship/cardiovascular',
      'Mayo Clinic Research', T1,
    )
    expect(passes(r)).toBe(false)
    expect(reason(r)).toBe('step1:blacklist')
  })

  test('Legitimate Staff Scientist at Tier-1 → high suitability', () => {
    const r = validateJobSuitability(
      'Staff Scientist – Cardiovascular and Molecular Biology',
      'Staff Scientist to join our cardiovascular genomics group. PhD required, 5+ years.',
      'https://salk.edu/careers/staff-scientist-cardiovascular',
      'Salk Institute', T1,
    )
    expect(passes(r)).toBe(true)
    expect(highSuit(r)).toBe(true)
  })

  test('Director of Cardiovascular Research at Tier-1 → high suitability', () => {
    const r = validateJobSuitability(
      'Director, Cardiovascular Research',
      'Lead the cardiovascular molecular biology and genomics research group. ' +
      'PhD required, 10+ years experience. Senior leadership role.',
      'https://genentech.com/careers/director-cardiovascular',
      'Genentech', T1,
    )
    expect(passes(r)).toBe(true)
    expect(highSuit(r)).toBe(true)
  })
})
