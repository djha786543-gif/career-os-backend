"use strict";
/**
 * validateJobSuitability.test.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit tests for the Pooja-profile Zero-Trust validation pipeline.
 * Run:  npm test
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
const validateJobSuitability_1 = require("../validateJobSuitability");
const T1 = validateJobSuitability_1.TIER1_ORG_NAMES;
const EMPTY_TIER1 = new Set();
const passes = (r) => r.passes;
const highSuit = (r) => r.highSuitability;
const reason = (r) => r.failReason;
// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Blacklist Kill Switch
// ═══════════════════════════════════════════════════════════════════════════════
describe('Step 1: blacklist kill switch', () => {
    // ── Primary verification task ───────────────────────────────────────────────
    test('VERIFY: "Postdoctoral Fellow Cardiovascular Research" → false, score=0', () => {
        // "Cardiovascular" domain anchor MUST NOT override the blacklist.
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Postdoctoral Fellow Cardiovascular Research', 'Join our lab studying cardiac regeneration using genomics. PhD required.', 'https://harvard.edu/careers/postdoc/cardiovascular', 'Harvard Medical School', T1);
        expect(passes(r)).toBe(false);
        expect(highSuit(r)).toBe(false);
        expect(r.matchScore).toBe(0);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"Postdoctoral Fellow in Cardiovascular Research" → blacklist (postdoctoral)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Postdoctoral Fellow in Cardiovascular Research', 'Join our lab studying cardiac regeneration. PhD required.', 'https://academicpositions.harvard.edu/postdoc/cardiovascular', 'Harvard Medical School', T1);
        expect(passes(r)).toBe(false);
        expect(highSuit(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"Postdoc – Molecular Cardiology" → blacklist (postdoc)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Postdoc – Molecular Cardiology', 'Cardiac molecular biology position.', 'https://stanford.edu/careers/postdoc/molecular', 'Stanford Medicine', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"Research Fellowship – Cardiovascular Genomics" → blacklist (fellowship)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Fellowship – Cardiovascular Genomics', 'Fellowship position in cardiovascular molecular biology.', 'https://broadinstitute.org/careers/fellowship/cardiovascular', 'Broad Institute', T1);
        expect(passes(r)).toBe(false);
        expect(highSuit(r)).toBe(false);
        expect(r.matchScore).toBe(0);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"Cardiovascular Research Fellow" → blacklist (fellow)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Cardiovascular Research Fellow', 'Research fellow position studying cardiac genomics.', 'https://mayo.edu/careers/research-fellow-cardiovascular', 'Mayo Clinic Research', T1);
        expect(passes(r)).toBe(false);
        expect(highSuit(r)).toBe(false);
        expect(r.matchScore).toBe(0);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"fellow" in snippet → blacklist even if title looks senior', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular Biology', 'This is a fellow position embedded in our cardiovascular genomics team.', 'https://genentech.com/careers/senior-scientist/cv', 'Genentech', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"Research Intern – Cardiovascular Biology" → blacklist (intern)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Intern – Cardiovascular Biology', 'Cardiovascular molecular biology intern role.', 'https://genentech.com/careers/intern/12345', 'Genentech', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"trainee" in snippet → blacklist', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Cardiovascular Biology', 'This is a trainee position for early-career scientists in cardiac genomics.', 'https://nih.gov/careers/scientist', 'NIH NHLBI', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"JRF – Cardiovascular Genomics" → blacklist (jrf)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('JRF – Cardiovascular Genomics', 'Junior Research Fellow position in cardiovascular molecular biology.', 'https://iiserbhopal.ac.in/careers', 'IISc Bangalore', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"PhD Candidate – Cardiovascular Genomics" → blacklist (phd candidate)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('PhD Candidate – Cardiovascular Genomics', 'PhD candidate position in cardiovascular molecular biology.', 'https://eth.edu/doctoral/cardiovascular', 'ETH Zurich', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"Resident" in title → blacklist', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Cardiology Resident – Cardiovascular Medicine', 'Residency training program in cardiovascular medicine.', 'https://hospital.org/careers/resident/cardiology', 'Mayo Clinic Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('"Graduate Student" in snippet → blacklist', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Assistant – Cardiovascular Biology', 'Graduate student opportunity in cardiovascular genomics research.', 'https://nih.gov/careers/research-assistant', 'NIH NHLBI', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    // ── Word-boundary guards ────────────────────────────────────────────────────
    test('"Internal" does NOT trigger blacklist (intern word-boundary)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist – Internal Medicine Cardiovascular', 'Lead cardiovascular molecular biology program for internal portfolio.', 'https://novartis.com/careers/senior-scientist/1234', 'Novartis Basel', T1);
        expect(passes(r)).toBe(true);
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Content & Aggregator Filter
// ═══════════════════════════════════════════════════════════════════════════════
describe('Step 2: aggregator title rejection', () => {
    test('"172 Cardiovascular jobs in Boston" → aggregator_title', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('172 Cardiovascular jobs in Boston', 'Browse cardiovascular job listings.', 'https://indeed.com/jobs?q=cardiovascular', 'Indeed', EMPTY_TIER1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:aggregator_title');
    });
    test('"45 Research Scientist jobs – Cardiovascular" → aggregator_title', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('45 Research Scientist jobs – Cardiovascular', 'Cardiovascular research scientist positions available.', 'https://glassdoor.com/jobs/cardiovascular', 'Glassdoor', EMPTY_TIER1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:aggregator_title');
    });
});
describe('Step 2: noise URL rejection', () => {
    test('/news/ URL → noise_url', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('New Insights into Cardiac Molecular Pathways', 'Cardiovascular genomics scientists at WashU discovered biomarkers.', 'https://medicine.wustl.edu/news/cardiac-molecular-research-2026', 'Washington University St Louis', T1);
        expect(passes(r)).toBe(false);
        expect(highSuit(r)).toBe(false);
        expect(reason(r)).toBe('step2:noise_url');
    });
    test('/press-releases/ URL → noise_url', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Roche Appoints Senior Scientist for Cardiovascular Research', 'We are seeking a senior scientist with cardiovascular molecular biology expertise.', 'https://roche.com/press-releases/2026/cardiovascular-appointment', 'Roche', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:noise_url');
    });
    test('/blog/ URL → noise_url', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist Cardiovascular Team', 'Join our cardiovascular genomics team.', 'https://broadinstitute.org/blog/research-scientist-cardiovascular', 'Broad Institute', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:noise_url');
    });
    test('/education/ URL → noise_url', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Cardiovascular Biology Course', 'Learn cardiovascular molecular biology in our graduate education program.', 'https://hospital.org/education/cardiovascular-biology', 'Mayo Clinic Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:noise_url');
    });
    test('/pmc/ URL → noise_url', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Heart Failure Genomics', 'Cardiovascular molecular biology genomics role.', 'https://ncbi.nlm.nih.gov/pmc/articles/PMC123456', 'NIH NHLBI', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:noise_url');
    });
    test('Valid /careers/ URL is not blocked', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist – Cardiovascular Biology', 'Lead cardiovascular molecular biology research. PhD required, 5 years experience.', 'https://genentech.com/careers/senior-scientist/cardiovascular/1234', 'Genentech', T1);
        expect(passes(r)).toBe(true);
    });
});
describe('Step 2: aggregator snippet rejection', () => {
    test('"Browse 245 jobs" snippet → aggregator_snippet', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist Jobs – Cardiovascular', 'Browse 245 jobs matching research scientist cardiovascular in Boston.', 'https://indeed.com/jobs?q=research+scientist+cardiovascular', 'Indeed', EMPTY_TIER1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:aggregator_snippet');
    });
    test('"10 open positions at Pfizer" snippet → aggregator_snippet', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Pfizer Research Scientist Positions', 'There are 10 open positions at Pfizer for cardiovascular molecular research.', 'https://pfizer.com/careers', 'Pfizer Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step2:aggregator_snippet');
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Seniority Requirement
// ═══════════════════════════════════════════════════════════════════════════════
describe('Step 3: seniority requirement', () => {
    test('Bare "Scientist" → unqualified_title', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Scientist', 'Work on cardiovascular molecular biology research. PhD required.', 'https://novartis.com/careers/scientist/1234', 'Novartis Basel', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step3:unqualified_title');
    });
    test('Bare "Researcher" → unqualified_title', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Researcher', 'Cardiovascular molecular genomics research. Required: PhD.', 'https://pfizer.com/careers/researcher/cv-456', 'Pfizer Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step3:unqualified_title');
    });
    test('"Research Scientist" (qualified) → passes step 3', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Cardiovascular Biology', 'Lead cardiovascular molecular biology programs. PhD required, 5 years experience.', 'https://genentech.com/careers/research-scientist-cardio', 'Genentech', T1);
        expect(passes(r)).toBe(true);
        expect(highSuit(r)).toBe(true);
    });
    test('"Senior Scientist" → passes', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Molecular Cardiology', 'Senior scientist cardiovascular genomics. PhD required, 7+ years experience.', 'https://roche.com/careers/senior-scientist', 'Roche', T1);
        expect(passes(r)).toBe(true);
    });
    test('"Scientist III" → passes', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Scientist III – Cardiovascular Genomics', 'Scientist III role in cardiovascular molecular biology.', 'https://amgen.com/careers/scientist-iii', 'Amgen', T1);
        expect(passes(r)).toBe(true);
    });
    test('"Assistant Professor" → passes seniority', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Assistant Professor of Cardiovascular Biology', 'Tenure-track faculty in cardiovascular molecular biology and genomics.', 'https://academicpositions.harvard.edu/faculty/cardiovascular', 'Harvard Medical School', T1);
        expect(passes(r)).toBe(true);
        expect(highSuit(r)).toBe(true);
    });
    test('"Group Leader" → passes seniority', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Group Leader – Cardiovascular Research', 'Lead a cardiovascular genomics research team. PhD required, 10 years experience.', 'https://max-planck.org/careers/group-leader-cardiovascular', 'Max Planck Heart and Lung', T1);
        expect(passes(r)).toBe(true);
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Technical Anchor Verification
// ═══════════════════════════════════════════════════════════════════════════════
describe('Step 4: technical anchor verification', () => {
    test('Pure oncology (no primary anchor) → no_technical_anchor', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Oncology Drug Discovery', 'Lead oncology cancer immunology research program.', 'https://merck.com/careers/senior-scientist-oncology', 'Merck Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step4:no_technical_anchor');
    });
    test('Pure neuroscience → no_technical_anchor', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Research Scientist – Neurology', 'Lead neuroscience neurology research. Requirements: PhD, 5 years experience.', 'https://biogen.com/careers/research-scientist-neuro', 'Biogen', EMPTY_TIER1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step4:no_technical_anchor');
    });
    test('Oncology + cardiovascular anchor → passes (cardio-oncology)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular Oncology', 'Research cardiac tumor biology using genomics. PhD required, 5 years experience.', 'https://merck.com/careers/senior-scientist-cardio-onco', 'Merck Research', T1);
        expect(passes(r)).toBe(true);
    });
    test('"heart" does NOT match inside "earth" (word-boundary)', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist – Earth Sciences', 'Lead earth sciences research. PhD required.', 'https://someorg.com/careers/senior-scientist-earth', 'SomeOrg', EMPTY_TIER1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step4:no_technical_anchor');
    });
    test('"molecular" anchor alone is sufficient', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Molecular Biology', 'Lead molecular research program. PhD required, 5 years experience.', 'https://genentech.com/careers/senior-scientist-molecular', 'Genentech', T1);
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
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Principal Scientist – Cardiovascular Genomics Molecular Biology', 'Cardiovascular cardiac heart molecular genomics proteomics research. PhD.', 'https://genentech.com/careers/principal-scientist', 'Genentech', T1);
        expect(r.matchScore).toBeGreaterThanOrEqual(0);
        expect(r.matchScore).toBeLessThanOrEqual(5);
    });
    test('"fellow" is NOT a seniority signal — blacklist fires instead', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular Biology', 'This fellow-level cardiovascular role requires a PhD and genomics experience.', 'https://genentech.com/careers/senior-scientist/cv', 'Genentech', T1);
        // "fellow" in snippet → step1 blacklist, score never calculated
        expect(passes(r)).toBe(false);
        expect(r.matchScore).toBe(0);
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
    test('null URL → noise-URL step skipped gracefully', () => {
        expect(() => (0, validateJobSuitability_1.validateJobSuitability)('Senior Research Scientist Cardiovascular Genomics', 'Cardiovascular molecular biology. PhD required. 5 years experience.', null, 'Genentech', T1)).not.toThrow();
    });
    test('empty title → passes: false', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('', 'Cardiovascular molecular biology role.', null, 'Genentech', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('gate0:empty_title');
    });
    test('whitespace-only title → passes: false', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('   ', 'Cardiovascular genomics role.', null, 'Genentech', T1);
        expect(passes(r)).toBe(false);
    });
    test('malformed URL string → does not throw', () => {
        expect(() => (0, validateJobSuitability_1.validateJobSuitability)('Senior Scientist – Cardiovascular', 'Cardiovascular molecular biology. PhD required.', '%%%not_a_real_url%%%', 'Roche', T1)).not.toThrow();
    });
});
// ═══════════════════════════════════════════════════════════════════════════════
// Regression: real-world false-positive guard
// ═══════════════════════════════════════════════════════════════════════════════
describe('Regression: real-world false-positive examples', () => {
    test('"Clinical Research Fellowship – Cardiovascular" → step1 blacklist', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Clinical Research Fellowship – Cardiovascular', 'Fellowship program in cardiovascular clinical research.', 'https://hospital.org/careers/fellowship/cardiovascular', 'Mayo Clinic Research', T1);
        expect(passes(r)).toBe(false);
        expect(reason(r)).toBe('step1:blacklist');
    });
    test('Legitimate Staff Scientist at Tier-1 → high suitability', () => {
        const r = (0, validateJobSuitability_1.validateJobSuitability)('Staff Scientist – Cardiovascular and Molecular Biology', 'Staff Scientist to join our cardiovascular genomics group. PhD required, 5+ years experience.', 'https://salk.edu/careers/staff-scientist-cardiovascular', 'Salk Institute', T1);
        expect(passes(r)).toBe(true);
        expect(highSuit(r)).toBe(true);
    });
});
