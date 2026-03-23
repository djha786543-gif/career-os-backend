"use strict";
/**
 * validateJobSuitability.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the Pooja-profile three-gate validation pipeline.
 * Run:  npm test
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
const validateJobSuitability_1 = require("../validateJobSuitability");
// Convenience alias for tier-1 set
const T1 = validateJobSuitability_1.TIER1_ORG_NAMES;
const EMPTY_TIER1 = new Set();
// ─── helpers ──────────────────────────────────────────────────────────────────
const passes = (r) => r.passes;
const highSuit = (r) => r.highSuitability;
const reason = (r) => r.failReason;
// ═══════════════════════════════════════════════════════════════════════════════
// GATE 1 — Identity & Career Stage
// ═══════════════════════════════════════════════════════════════════════════════
describe('Gate 1: training role rejection', () => {
    test('Harvard Postdoc — "Postdoctoral" in title → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Postdoctoral Fellow in Cardiovascular Research', 'Join our lab studying cardiac regeneration. PhD required.', 'https://academicpositions.harvard.edu/postdoc/cardiovascular', 'Harvard Medical School', T1);
        expect(passes(r)).toBe(false);
        expect(highSuit(r)).toBe(false);
        expect(reason(r)).toBe('gate1:training_role');
    });
    test('"Postdoc" variant in title → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Postdoc – Molecular Cardiology', 'Cardiac molecular biology position.', 'https://stanford.edu/careers/postdoc/molecular', 'Stanford Medicine', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:training_role');
    });
    test('"Intern" in title → rejected (word-boundary: not "Internal")', () => {
        const internResult = (0, validateJobSuitability_1.validateJobSuitability)('Research Intern – Cardiovascular Biology', 'Cardiovascular molecular biology intern role.', 'https://genentech.com/careers/intern/12345', 'Genentech', T1);
        expect(passes(internResult)).toBe(false);
        expect(reason(internResult)).toBe('gate1:training_role');
    });
    test('"Internal" does NOT trigger training-role gate (word-boundary)', () => {
        // "internal" contains "intern" — word-boundary regex must NOT fire
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist – Internal Medicine Cardiovascular', 'Lead cardiovascular molecular biology program for internal portfolio.', 'https://novartis.com/careers/senior-scientist/1234', 'Novartis Basel', T1);
        expect(passes(r)).toBe(true);
    });
    test('"Trainee" in snippet → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Cardiovascular Biology', 'This is a trainee position for early-career scientists in cardiac genomics.', 'https://nih.gov/careers/scientist', 'NIH NHLBI', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:training_role');
    });
    test('"JRF" in title → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('JRF – Cardiovascular Genomics', 'Junior Research Fellow position in cardiovascular molecular biology.', 'https://iiserbhopal.ac.in/careers', 'IISc Bangalore', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:training_role');
    });
});
describe('Gate 1: noise URL rejection', () => {
    test('WashU News article URL → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('New Insights into Cardiac Molecular Pathways', 'Cardiovascular genomics scientists at WashU discovered biomarkers.', 'https://medicine.wustl.edu/news/cardiac-molecular-research-2026', 'Washington University St Louis', T1);
        expect(passes(r)).toBe(false);
        expect(highSuit(r)).toBe(false);
        expect(reason(r)).toBe('gate1:noise_url');
    });
    test('Press-release URL → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Roche Appoints Senior Scientist for Cardiovascular Research', 'We are seeking a senior scientist with cardiovascular molecular biology expertise.', 'https://roche.com/press-releases/2026/cardiovascular-appointment', 'Roche', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:noise_url');
    });
    test('Blog URL → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist Cardiovascular Team', 'Join our cardiovascular genomics team. Requirements: PhD molecular biology.', 'https://broadinstitute.org/blog/research-scientist-cardiovascular', 'Broad Institute', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:noise_url');
    });
    test('/pmc/ URL → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Heart Failure Genomics', 'Cardiovascular molecular biology genomics role.', 'https://ncbi.nlm.nih.gov/pmc/articles/PMC123456', 'NIH NHLBI', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:noise_url');
    });
    test('Valid /careers/ URL is not affected by noise URL gate', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist – Cardiovascular Biology', 'Lead cardiovascular molecular biology research. PhD required, 5 years experience.', 'https://genentech.com/careers/senior-scientist/cardiovascular/1234', 'Genentech', T1);
        expect(passes(r)).toBe(true);
    });
});
describe('Gate 1: aggregator page rejection', () => {
    test('"Browse 245 jobs" snippet → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist Jobs – Cardiovascular', 'Browse 245 jobs matching research scientist cardiovascular in Boston.', 'https://indeed.com/jobs?q=research+scientist+cardiovascular', 'Indeed', EMPTY_TIER1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:aggregator_page');
    });
    test('"10 open positions at Pfizer" snippet → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Pfizer Research Scientist Positions', 'There are 10 open positions at Pfizer for cardiovascular molecular research.', 'https://pfizer.com/careers', 'Pfizer Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:aggregator_page');
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// GATE 2 — Technical Anchor
// ═══════════════════════════════════════════════════════════════════════════════
describe('Gate 2: technical anchor enforcement', () => {
    test('Pure oncology role (no primary anchor) → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Oncology Drug Discovery', 'Lead oncology cancer immunology research program.', 'https://merck.com/careers/senior-scientist-oncology', 'Merck Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate2:no_technical_anchor');
    });
    test('Pure neuroscience role → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Neurology', 'Lead neuroscience neurology research. Requirements: PhD, 5 years experience.', 'https://biogen.com/careers/research-scientist-neuro', 'Biogen', EMPTY_TIER1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate2:no_technical_anchor');
    });
    test('Oncology with cardiovascular anchor → passes Gate 2 (cardio-oncology)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular Oncology', 'Research cardiac tumor biology using genomics. PhD required, 5 years experience.', 'https://merck.com/careers/senior-scientist-cardio-onco', 'Merck Research', T1);
        expect(passes(r)).toBe(true);
    });
    test('"heart" does NOT match inside "earth" (word-boundary)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist – Earth Sciences', 'Lead earth sciences research. Requirements: PhD, experience in research required.', 'https://someorg.com/careers/senior-scientist-earth', 'SomeOrg', EMPTY_TIER1);
        // "earth" contains "heart" substring — word-boundary must prevent false match
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate2:no_technical_anchor');
    });
    test('"molecular" anchor alone is sufficient', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Molecular Biology', 'Lead molecular research program. PhD required, 5 years of experience required.', 'https://genentech.com/careers/senior-scientist-molecular', 'Genentech', T1);
        expect(passes(r)).toBe(true);
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// GATE 3 — Staff-Level Enforcement
// ═══════════════════════════════════════════════════════════════════════════════
describe('Gate 3: staff-level title enforcement', () => {
    test('Bare "Scientist" title → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Scientist', 'Work on cardiovascular molecular biology research. PhD required. 3 years experience required.', 'https://novartis.com/careers/scientist/1234', 'Novartis Basel', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate3:unqualified_title');
    });
    test('Bare "Researcher" → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Researcher', 'Cardiovascular molecular genomics research. Required: PhD, experience.', 'https://pfizer.com/careers/researcher/cv-456', 'Pfizer Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate3:unqualified_title');
    });
    test('"Research Scientist" (qualified) → passes', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Cardiovascular Biology', 'Lead cardiovascular molecular biology programs. PhD required, 5 years experience.', 'https://genentech.com/careers/research-scientist-cardio', 'Genentech', T1);
        expect(passes(r)).toBe(true);
        expect(highSuit(r)).toBe(true);
    });
    test('"Senior Scientist" → passes', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Molecular Cardiology', 'Senior scientist cardiovascular genomics. PhD required, 7+ years experience required.', 'https://roche.com/careers/senior-scientist', 'Roche', T1);
        expect(passes(r)).toBe(true);
    });
    test('"Scientist III" → passes', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Scientist III – Cardiovascular Genomics', 'Scientist III role in cardiovascular molecular biology. PhD required, experience.', 'https://amgen.com/careers/scientist-iii', 'Amgen', T1);
        expect(passes(r)).toBe(true);
    });
    test('"Assistant Professor" faculty title → passes with domain anchor', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Assistant Professor of Cardiovascular Biology', 'Tenure-track faculty in cardiovascular molecular biology and genomics. PhD required.', 'https://academicpositions.harvard.edu/faculty/cardiovascular', 'Harvard Medical School', T1);
        expect(passes(r)).toBe(true);
        expect(highSuit(r)).toBe(true);
    });
    test('"Group Leader" → passes with domain anchor', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Group Leader – Cardiovascular Research', 'Lead a cardiovascular genomics research team. PhD required, 10 years experience.', 'https://max-planck.org/careers/group-leader-cardiovascular', 'Max Planck Heart and Lung', T1);
        expect(passes(r)).toBe(true);
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// Scoring: 60 % Technical / 40 % Seniority weighting
// ═══════════════════════════════════════════════════════════════════════════════
describe('Scoring: weighted 60/40 + Tier-1 bonus', () => {
    test('Tech-rich job scores higher than tech-poor equivalent', () => {
        const techRich = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist – Cardiovascular Genomics and Molecular Biology', 'Cardiovascular cardiac genomics proteomics molecular biology research. PhD required.', 'https://genentech.com/careers/senior-scientist-cv', 'Genentech', T1);
        const techPoor = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist', 'Cardiovascular research role. PhD required, experience required.', 'https://biotech.com/careers/senior-scientist', 'Unknown BioTech', EMPTY_TIER1);
        expect(techRich.matchScore).toBeGreaterThan(techPoor.matchScore);
    });
    test('Tier-1 org bonus raises score vs non-Tier-1 identical job', () => {
        const tier1Result = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular Biology', 'Cardiovascular molecular research. PhD required, 5 years experience.', 'https://academicpositions.harvard.edu/senior-scientist', 'Harvard Medical School', T1);
        const nonTier1Result = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular Biology', 'Cardiovascular molecular research. PhD required, 5 years experience.', 'https://somecompany.com/careers/senior-scientist', 'Unknown Biotech', T1);
        expect(tier1Result.matchScore).toBeGreaterThan(nonTier1Result.matchScore);
    });
    test('matchScore is between 0 and 5 inclusive', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Principal Scientist – Cardiovascular Genomics Molecular Biology', 'Cardiovascular cardiac heart molecular genomics proteomics research. Required: PhD.', 'https://genentech.com/careers/principal-scientist', 'Genentech', T1);
        expect(r.matchScore).toBeGreaterThanOrEqual(0);
        expect(r.matchScore).toBeLessThanOrEqual(5);
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// Resilience — null / malformed inputs
// ═══════════════════════════════════════════════════════════════════════════════
describe('Resilience: null / malformed inputs', () => {
    test('null snippet → does not throw', () => {
        expect(() => (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist Cardiovascular', null, 'https://pfizer.com/careers/senior-scientist/123', 'Pfizer Research', T1)).not.toThrow();
    });
    test('undefined snippet → does not throw', () => {
        expect(() => (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist Cardiovascular', undefined, 'https://amgen.com/careers/rs/456', 'Amgen', T1)).not.toThrow();
    });
    test('null URL → does not throw, noise-URL gate skipped gracefully', () => {
        expect(() => (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist Cardiovascular Genomics', 'Cardiovascular molecular biology. PhD required. 5 years experience required.', null, 'Genentech', T1)).not.toThrow();
    });
    test('empty title → passes: false', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('', 'Cardiovascular molecular biology role.', null, 'Genentech', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:empty_title');
    });
    test('whitespace-only title → passes: false', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('   ', 'Cardiovascular genomics role.', null, 'Genentech', T1);
        expect(passes(r)).toBe(false);
    });
    test('malformed URL string → does not throw', () => {
        expect(() => (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular', 'Cardiovascular molecular biology. PhD required, experience needed.', '%%%not_a_real_url%%%', 'Roche', T1)).not.toThrow();
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// Real-world false-positive examples (regression guard)
// ═══════════════════════════════════════════════════════════════════════════════
describe('Regression: real-world false-positive examples', () => {
    test('Generic "Clinical Fellowship" → rejected (fellowship-programs URL)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Clinical Research Fellowship – Cardiovascular', 'Fellowship program in cardiovascular clinical research.', 'https://hospital.org/education/fellowship-programs/cardiovascular', 'Mayo Clinic Research', T1);
        expect(passes(r)).toBe(false);
    });
    test('PhD Candidate role → rejected', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('PhD Candidate – Cardiovascular Genomics', 'PhD candidate position in cardiovascular molecular biology. Requirements: MSc.', 'https://eth.edu/doctoral/cardiovascular', 'ETH Zurich', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate1:training_role');
    });
    test('Legitimate Staff Scientist at Tier-1 → high suitability', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Staff Scientist – Cardiovascular and Molecular Biology', 'Staff Scientist to join our cardiovascular genomics group. PhD required, 5+ years experience required.', 'https://salk.edu/careers/staff-scientist-cardiovascular', 'Salk Institute', T1);
        expect(passes(r)).toBe(true);
        expect(highSuit(r)).toBe(true);
    });
});
