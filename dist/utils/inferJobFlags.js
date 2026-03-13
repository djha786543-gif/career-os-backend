"use strict";
/**
 * inferJobFlags.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Adzuna doesn't return structured remote/hybrid/visaSponsorship booleans.
 * We infer them from title + description text.
 * ─────────────────────────────────────────────────────────────────────────────
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferJobFlags = inferJobFlags;
exports.extractSkillsFromText = extractSkillsFromText;
const REMOTE_SIGNALS = [
    'remote', 'work from home', 'wfh', 'fully remote', '100% remote',
    'anywhere', 'distributed team', 'remote-first', 'remote position',
    'telecommute', 'virtual position',
];
const HYBRID_SIGNALS = [
    'hybrid', 'flexible working', 'partial remote', '2 days',
    '3 days in office', 'mixed remote', 'hybrid working',
    'flexible location', 'partially remote',
];
const VISA_SIGNALS = [
    'visa sponsorship', 'will sponsor', 'h1b', 'h-1b', 'work authorization',
    'work visa', 'sponsorship available', 'visa supported',
    'relocation assistance', 'relocation support',
];
function inferJobFlags(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    return {
        remote: REMOTE_SIGNALS.some(s => text.includes(s)),
        hybrid: HYBRID_SIGNALS.some(s => text.includes(s)),
        visaSponsorship: VISA_SIGNALS.some(s => text.includes(s)),
    };
}
// ─── Skill keyword extractor (no external API needed) ────────────────────────
// Deobrat's domain keywords
const AUDIT_SKILLS = [
    'SOX 404', 'ITGC', 'ITAC', 'COSO', 'COBIT', 'CISA', 'CISM', 'CISSP',
    'ERP', 'SAP', 'Oracle', 'Workday', 'NetSuite', 'PeopleSoft',
    'AuditBoard', 'Onspring', 'ServiceNow GRC', 'Archer',
    'IT audit', 'internal audit', 'IT risk', 'cyber risk', 'cybersecurity',
    'cloud security', 'AWS', 'Azure', 'GCP', 'access management',
    'SoD', 'segregation of duties', 'change management',
    'AI governance', 'model risk', 'data governance', 'GDPR', 'HIPAA',
    'risk assessment', 'control testing', 'process improvement',
    'project management', 'SOC 1', 'SOC 2', 'ISO 27001', 'NIST',
    'penetration testing', 'vulnerability management', 'compliance',
];
// Pooja's domain keywords (both tracks)
const BIOTECH_SKILLS = [
    'RNA-seq', 'IPA', 'DESeq2', 'EdgeR', 'scRNA-seq', 'single-cell',
    'Western blot', 'IHC', 'ICC', 'ELISA', 'TUNEL', 'qPCR', 'RT-PCR',
    'flow cytometry', 'FACS', 'CRISPR', 'siRNA', 'lentiviral',
    'transgenic mice', 'transgenic mouse models', 'Cre-lox models',
    'conditional knockouts', 'knockout mice', 'knock-in',
    'Langendorff perfusion', 'echocardiography', 'cardiac MRI',
    'in vivo models', 'in vitro', 'primary cell culture', 'iPSC',
    'cardiomyocytes', 'fibrosis assays', 'senescence assays',
    'histology', 'microscopy', 'confocal', 'imaging',
    'molecular biology', 'cardiac physiology', 'cardiovascular disease modeling',
    'senescence biology', 'systems biology', 'bioinformatics',
    'transcriptomics', 'genomics', 'proteomics', 'metabolomics',
    'scientific visualization', 'BioRender', 'Illustrator',
    'publication', 'peer review', 'grant writing', 'teaching', 'mentorship',
    'preclinical', 'translational research', 'drug discovery',
];
const ALL_SKILLS = [...AUDIT_SKILLS, ...BIOTECH_SKILLS];
function extractSkillsFromText(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    return ALL_SKILLS.filter(skill => text.includes(skill.toLowerCase()));
}
