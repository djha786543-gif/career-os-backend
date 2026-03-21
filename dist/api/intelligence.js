"use strict";
/**
 * api/intelligence.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/trends?profile=dj|pj  — AI-powered trend radar (Claude fallback → static)
 * GET /api/skills?profile=dj|pj  — Skill gap analysis (static)
 * GET /api/salary?profile=dj|pj  — Salary benchmarks (static)
 * GET /api/market?profile=dj|pj  — Market demand by city (static)
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// ─── Helpers ──────────────────────────────────────────────────────────────────
function profile(req) {
    return req.query.profile === 'pj' ? 'pj' : 'dj';
}
// ─── Static data ─────────────────────────────────────────────────────────────
const STATIC_TRENDS = {
    dj: {
        hot: ['AI Governance & Model Risk', 'Cloud Security (AWS/Azure)', 'SOX ITGC Automation', 'Continuous Auditing', 'ERM Integration'],
        rising: ['DORA Compliance', 'Third-Party AI Risk', 'GRC Platform Expertise', 'COBIT 2019', 'Zero Trust Auditing'],
        stable: ['CISA Certification', 'IT General Controls', 'Access Management Reviews', 'Vendor Risk'],
        cooling: ['Manual Spreadsheet Audits', 'On-prem-only Audits'],
    },
    pj: {
        hot: ['AI/ML in Drug Discovery', 'Single-Cell Genomics', 'Translational Cardiology', 'CRISPR Therapeutics', 'Spatial Transcriptomics'],
        rising: ['ASCP MB value', 'Industry-Academia pivot', 'NIH R-series grants', 'Cardiovascular biomarkers', 'PPCM Research'],
        stable: ['Molecular Biology', 'R/Bioinformatics', 'Grant writing', 'Peer review'],
        cooling: ['Pure bench science without translation', 'Single-institution postdoc pipelines'],
    },
};
const STATIC_SKILLS = {
    dj: {
        current: {
            'SOX ITGC': 95, 'CISA': 100, 'AWS Cloud': 75, 'AI Governance': 70,
            'GRC Tools': 80, 'Python/Data': 45, 'Continuous Auditing': 60, 'ERM': 65,
        },
        gaps: ['Python scripting for audit automation', 'COBIT 2019 deep dive', 'Azure/GCP exposure', 'AI model risk frameworks'],
        target_roles: ['IT Audit Manager', 'AI Governance Auditor', 'Cloud Security Auditor'],
    },
    pj: {
        current: {
            'Molecular Biology': 95, 'Cardiovascular Research': 90, 'R/Bioinformatics': 75,
            'Grant Writing': 65, 'Transcriptomics': 80, 'Clinical Translation': 55,
            'Drug Discovery': 45, 'Industry Communication': 50,
        },
        gaps: ['Industry drug discovery workflows', 'Biotech regulatory basics (IND/NDA)', 'Clinical trial design', 'Scientific communication for non-academic audiences'],
        target_roles: ['Research Scientist', 'Translational Scientist', 'Assistant Professor'],
    },
};
const SALARY_DATA = {
    dj: [
        { title: 'IT Audit Manager', low: 110000, mid: 135000, high: 165000, remote_premium: '+8%' },
        { title: 'IT Compliance Manager', low: 105000, mid: 128000, high: 155000, remote_premium: '+6%' },
        { title: 'SOX ITGC Lead', low: 95000, mid: 118000, high: 142000, remote_premium: '+10%' },
        { title: 'Cloud Security Auditor', low: 115000, mid: 140000, high: 170000, remote_premium: '+12%' },
        { title: 'AI Governance Auditor', low: 125000, mid: 155000, high: 195000, remote_premium: '+15%' },
        { title: 'Director of IT Audit', low: 150000, mid: 175000, high: 215000, remote_premium: '+5%' },
    ],
    pj: [
        { title: 'Postdoctoral Researcher', low: 55000, mid: 64000, high: 72000, remote_premium: 'N/A' },
        { title: 'Research Scientist II', low: 85000, mid: 105000, high: 128000, remote_premium: '+10%' },
        { title: 'Senior Research Scientist', low: 110000, mid: 132000, high: 158000, remote_premium: '+8%' },
        { title: 'Assistant Professor', low: 90000, mid: 110000, high: 135000, remote_premium: 'N/A' },
        { title: 'Translational Scientist', low: 108000, mid: 130000, high: 160000, remote_premium: '+12%' },
    ],
};
const MARKET_DATA = {
    dj: [
        { city: 'Remote / US', demand: 98, jobs: 2847, yoy: '+34%' },
        { city: 'New York, NY', demand: 82, jobs: 412, yoy: '+12%' },
        { city: 'San Francisco, CA', demand: 79, jobs: 387, yoy: '+8%' },
        { city: 'Los Angeles, CA', demand: 68, jobs: 241, yoy: '+22%' },
        { city: 'Chicago, IL', demand: 71, jobs: 298, yoy: '+15%' },
        { city: 'Dallas, TX', demand: 65, jobs: 218, yoy: '+19%' },
    ],
    pj: [
        { city: 'Boston, MA', demand: 91, jobs: 1204, yoy: '+21%' },
        { city: 'San Diego, CA', demand: 88, jobs: 987, yoy: '+26%' },
        { city: 'Los Angeles, CA', demand: 82, jobs: 743, yoy: '+30%' },
        { city: 'San Francisco, CA', demand: 79, jobs: 698, yoy: '+15%' },
        { city: 'Remote / US', demand: 72, jobs: 892, yoy: '+18%' },
        { city: 'Research Triangle, NC', demand: 75, jobs: 541, yoy: '+17%' },
    ],
};
// ─── GET /api/trends ──────────────────────────────────────────────────────────
const DJ_TREND_PROMPT = 'CISA-certified IT Audit Manager with 10+ years experience, EY alumni, expert in SOX ITGC, AI governance, cloud security';
const PJ_TREND_PROMPT = 'Postdoctoral researcher in cardiovascular and molecular biology, targeting industry and faculty roles in Los Angeles';
router.get('/trends', async (req, res) => {
    const p = profile(req);
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
        return res.json({ trends: STATIC_TRENDS[p], source: 'static', profile: p });
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
        const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-6',
                max_tokens: 800,
                messages: [{
                        role: 'user',
                        content: `You are a career intelligence engine. For a ${p === 'dj' ? DJ_TREND_PROMPT : PJ_TREND_PROMPT}, return ONLY a raw JSON object (no markdown) with this exact structure:
{ "hot": ["trend1","trend2","trend3","trend4","trend5"], "rising": ["...x4"], "stable": ["...x4"], "cooling": ["...x2"] }
Base this on the 2025-2026 job market. Be specific and actionable.`,
                    }],
            }),
        });
        clearTimeout(timer);
        const d = await r.json();
        if (d.error)
            throw new Error(d.error.message ?? 'API error');
        const text = d?.content?.find((b) => b.type === 'text')?.text ?? '{}';
        const trends = JSON.parse(text.replace(/```json|```/g, '').trim());
        if (!trends.hot)
            throw new Error('unexpected shape');
        return res.json({ trends, source: 'claude', profile: p });
    }
    catch (err) {
        clearTimeout(timer);
        console.warn('[/api/trends] Claude failed, using static:', err.message);
        if (!res.headersSent)
            return res.json({ trends: STATIC_TRENDS[p], source: 'static', profile: p });
    }
});
// ─── GET /api/skills ──────────────────────────────────────────────────────────
router.get('/skills', (req, res) => {
    const p = profile(req);
    res.json({ skills: STATIC_SKILLS[p], source: 'static', profile: p });
});
// ─── GET /api/salary ──────────────────────────────────────────────────────────
router.get('/salary', (req, res) => {
    const p = profile(req);
    res.json({ data: SALARY_DATA[p], profile: p });
});
// ─── GET /api/market ──────────────────────────────────────────────────────────
router.get('/market', (req, res) => {
    const p = profile(req);
    res.json({ data: MARKET_DATA[p], profile: p });
});
// ─── GET /api/market/heatmap ──────────────────────────────────────────────────
const HEATMAP_DATA = {
    dj: {
        gaugeValue: 94,
        skills: [
            { name: 'AI Governance', score: 97, trend: 'rising' },
            { name: 'LLM Security', score: 94, trend: 'rising' },
            { name: 'Cloud Audit (AWS)', score: 93, trend: 'stable' },
            { name: 'EU AI Act', score: 92, trend: 'rising' },
            { name: 'SOX/ITGC', score: 89, trend: 'stable' },
            { name: 'NIST AI RMF', score: 88, trend: 'rising' },
            { name: 'Continuous Auditing', score: 84, trend: 'rising' },
            { name: 'COBIT 2019', score: 78, trend: 'stable' },
            { name: 'GRC Platforms', score: 75, trend: 'stable' },
            { name: 'Manual Audits', score: 32, trend: 'cooling' },
        ],
        risingSkills: ['AI Governance', 'LLM Security', 'EU AI Act', 'NIST AI RMF'],
        gapSkills: ['Python for Audit', 'Azure/GCP', 'COBIT 2019 deep dive'],
    },
    pj: {
        gaugeValue: 91,
        skills: [
            { name: 'NGS/Sequencing', score: 96, trend: 'rising' },
            { name: 'scRNA-seq', score: 94, trend: 'rising' },
            { name: 'CRISPR', score: 91, trend: 'stable' },
            { name: 'Bioinformatics', score: 89, trend: 'rising' },
            { name: 'ddPCR', score: 87, trend: 'stable' },
            { name: 'Spatial Transcriptomics', score: 85, trend: 'rising' },
            { name: 'iPSC Modeling', score: 82, trend: 'rising' },
            { name: 'Clinical Translation', score: 79, trend: 'rising' },
            { name: 'Drug Discovery', score: 74, trend: 'stable' },
            { name: 'Pure Bench Science', score: 41, trend: 'cooling' },
        ],
        risingSkills: ['scRNA-seq', 'Spatial Transcriptomics', 'iPSC Modeling', 'Bioinformatics'],
        gapSkills: ['Biotech regulatory (IND/NDA)', 'Clinical trial design', 'Industry communication'],
    },
};
router.get('/market/heatmap', (req, res) => {
    const p = profile(req);
    res.json({ data: HEATMAP_DATA[p], profile: p });
});
// ─── GET /api/study/plan ──────────────────────────────────────────────────────
const STUDY_PLANS = {
    dj: {
        examName: 'ISACA AAIA (Auditing AI Systems)',
        examDate: '2026-03-31',
        topics: [
            'AI Fundamentals & Machine Learning Concepts',
            'NIST AI RMF — Govern, Map, Measure, Manage functions',
            'AI Risk Assessment Methodologies',
            'Bias, Fairness & Explainability in AI',
            'AI Model Risk Management (MRM)',
            'Data Governance & Lineage for AI',
            'Responsible AI Frameworks (ISO 42001)',
            'AI Audit Evidence & Testing Techniques',
            'Regulatory Landscape: EU AI Act, NIST, FFIEC',
            'AAIA Exam Strategy & Practice Questions',
        ],
    },
    pj: {
        examName: 'ASCP Molecular Biology (MBcm)',
        examDate: '2026-05-31',
        topics: [
            'Nucleic Acid Extraction & QC',
            'PCR Principles & Troubleshooting',
            'NGS Library Prep & Sequencing Platforms',
            'Variant Interpretation & ACMG Guidelines',
            'FISH, ISH & Cytogenetics',
            'Gene Expression Profiling',
            'Molecular Oncology',
            'Inherited Disease & Carrier Testing',
            'Laboratory Management & QA/QC',
            'MBcm Exam Strategy & Practice Questions',
        ],
    },
};
router.get('/study/plan', (req, res) => {
    const p = profile(req);
    const plan = STUDY_PLANS[p];
    const today = new Date();
    const examDay = new Date(plan.examDate);
    const msLeft = examDay.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    let urgency;
    if (daysRemaining <= 14)
        urgency = 'critical';
    else if (daysRemaining <= 30)
        urgency = 'high';
    else if (daysRemaining <= 60)
        urgency = 'moderate';
    else
        urgency = 'comfortable';
    // Deterministic today's topic (rotates by day of year)
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const todayTask = plan.topics[dayOfYear % plan.topics.length];
    res.json({
        examName: plan.examName,
        examDate: plan.examDate,
        daysRemaining,
        urgency,
        todayTask,
        topics: plan.topics,
        profile: p,
    });
});
exports.default = router;
