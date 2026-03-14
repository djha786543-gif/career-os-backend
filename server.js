'use strict';
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = Number(process.env.PORT) || 3001;

// ─── Keys ─────────────────────────────────────────────────────────────────────
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ADZUNA_ID     = process.env.ADZUNA_APP_ID;
const ADZUNA_KEY    = process.env.ADZUNA_APP_KEY;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json());
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    if (!res.headersSent) res.status(503).json({ error: 'timeout' });
  });
  next();
});

// ─── PHASE 2: Health ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: Date.now(),
    env: {
      anthropic: !!ANTHROPIC_KEY,
      adzuna:    !!ADZUNA_ID,
    },
  });
});

// ─── PHASE 3: Job Engine ──────────────────────────────────────────────────────
const QUERIES = {
  dj: { adzuna: 'IT audit manager' },
  pj: { adzuna: 'research scientist biology' },
};

async function fetchViaAdzuna(profile) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const what = encodeURIComponent(QUERIES[profile].adzuna);
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_ID}&app_key=${ADZUNA_KEY}&results_per_page=15&what=${what}`;
    const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
    clearTimeout(timeout);
    const data = await res.json();
    console.log(`[ADZUNA] HTTP ${res.status} count=${data.count} results=${data.results?.length}`);
    if (!data.results?.length) throw new Error(`no results (count=${data.count})`);
    const jobs = data.results.map((j, i) => {
      const loc = (j.location?.display_name || 'US').toLowerCase();
      const isRemote = loc.includes('remote') || (j.title || '').toLowerCase().includes('remote');
      return {
        id:         j.id || `az${i}`,
        title:      j.title || '',
        company:    j.company?.display_name || 'Unknown',
        location:   j.location?.display_name || 'US',
        salary:     j.salary_min
          ? `$${Math.round(j.salary_min / 1000)}k – $${Math.round((j.salary_max || j.salary_min) / 1000)}k`
          : 'Not disclosed',
        snippet:    (j.description || '').replace(/<[^>]+>/g, '').slice(0, 200),
        applyUrl:   j.redirect_url || '#',
        fitScore:   75,
        workMode:   isRemote ? 'Remote' : 'On-site',
        isRemote,
        source:     'adzuna',
        postedDate: j.created ? new Date(j.created).toLocaleDateString() : 'Recent',
        keySkills:  j.category?.label ? [j.category.label] : [],
        region:     'US',
      };
    });
    console.log(`[ADZUNA] ${jobs.length} jobs for ${profile}`);
    return { jobs, source: 'adzuna', profile, total: jobs.length, totalResults: jobs.length };
  } catch (e) {
    clearTimeout(timeout);
    console.warn('[ADZUNA] failed:', e.message);
    throw e;
  }
}

function engineOffline(profile) {
  return {
    jobs:    [],
    source:  'offline',
    profile,
    total:   0,
    message: 'Set ADZUNA_APP_ID + ADZUNA_APP_KEY in Railway to enable live job search.',
  };
}

app.get('/api/jobs', async (req, res) => {
  const profile = req.query.profile === 'pj' ? 'pj' : 'dj';
  console.log(`[/api/jobs] profile=${profile}`);

  if (ADZUNA_ID && ADZUNA_KEY) {
    try { return res.json(await fetchViaAdzuna(profile)); } catch (_) {}
  } else {
    console.warn('[/api/jobs] ADZUNA keys not set');
  }

  return res.json(engineOffline(profile));
});

// ─── PHASE 4: Trends ──────────────────────────────────────────────────────────
const STATIC_TRENDS = {
  dj: {
    hot:     ['AI Governance & Model Risk', 'Cloud Security AWS/Azure', 'SOX ITGC Automation', 'Continuous Auditing', 'ERM Integration'],
    rising:  ['DORA Compliance', 'Third-Party AI Risk', 'GRC Platform Expertise', 'COBIT 2019', 'Zero Trust Auditing'],
    stable:  ['CISA Certification', 'IT General Controls', 'Access Management Reviews', 'Vendor Risk'],
    cooling: ['Manual Spreadsheet Audits', 'On-prem-only Audits'],
  },
  pj: {
    hot:     ['AI/ML in Drug Discovery', 'Single-Cell Genomics', 'Translational Cardiology', 'CRISPR Therapeutics', 'Spatial Transcriptomics'],
    rising:  ['ASCP MB value', 'Industry-Academia pivot', 'NIH R-series grants', 'Cardiovascular biomarkers', 'PPCM Research'],
    stable:  ['Molecular Biology', 'R/Bioinformatics', 'Grant writing', 'Peer review'],
    cooling: ['Pure bench science without translation', 'Single-institution postdoc pipelines'],
  },
};

app.get('/api/trends', async (req, res) => {
  const profile = req.query.profile === 'pj' ? 'pj' : 'dj';

  if (!ANTHROPIC_KEY) {
    return res.json({ trends: STATIC_TRENDS[profile], source: 'static', profile });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: 800,
        messages: [{
          role:    'user',
          content: `Career intelligence for ${
            profile === 'dj'
              ? 'CISA-certified IT Audit Manager, EY alumni, SOX ITGC + AI governance + cloud security, 10 years experience, 2025-2026 job market'
              : 'Postdoctoral researcher cardiovascular and molecular biology, targeting research scientist and faculty roles Los Angeles 2025-2026'
          }. Return ONLY raw JSON no markdown: { "hot":[5 strings], "rising":[4 strings], "stable":[4 strings], "cooling":[2 strings] }`,
        }],
      }),
    });
    clearTimeout(timeout);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message || 'API error');
    const text = d.content?.find(b => b.type === 'text')?.text || '{}';
    const trends = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (!trends.hot) throw new Error('unexpected shape');
    res.json({ trends, source: 'claude', profile });
  } catch (e) {
    clearTimeout(timeout);
    console.warn('[/api/trends] Claude failed, using static:', e.message);
    res.json({ trends: STATIC_TRENDS[profile], source: 'static', profile });
  }
});

// ─── PHASE 5: Skills ──────────────────────────────────────────────────────────
const SKILLS_DATA = {
  dj: {
    current: {
      'SOX ITGC': 95, 'CISA': 100, 'AWS Cloud': 75, 'AI Governance': 70,
      'GRC Tools': 80, 'Python/Data': 45, 'Continuous Auditing': 60, 'ERM': 65,
    },
    gaps:         ['Python scripting for audit automation', 'COBIT 2019 deep dive', 'Azure/GCP exposure', 'AI model risk frameworks'],
    target_roles: ['IT Audit Manager', 'AI Governance Auditor', 'Cloud Security Auditor'],
  },
  pj: {
    current: {
      'Molecular Biology': 95, 'Cardiovascular Research': 90, 'R/Bioinformatics': 75,
      'Grant Writing': 65, 'Transcriptomics': 80, 'Clinical Translation': 55,
      'Drug Discovery': 45, 'Industry Communication': 50,
    },
    gaps:         ['Industry drug discovery workflows', 'Biotech regulatory basics IND/NDA', 'Clinical trial design', 'Scientific communication for non-academic audiences'],
    target_roles: ['Research Scientist', 'Translational Scientist', 'Assistant Professor'],
  },
};

app.get('/api/skills', (req, res) => {
  const p = req.query.profile === 'pj' ? 'pj' : 'dj';
  res.json({ skills: SKILLS_DATA[p], source: 'static', profile: p });
});

// ─── PHASE 6: Salary ──────────────────────────────────────────────────────────
const SALARY_DATA = {
  dj: [
    { title: 'IT Audit Manager',       low: 110000, mid: 135000, high: 165000, remote_premium: '+8%' },
    { title: 'IT Compliance Manager',  low: 105000, mid: 128000, high: 155000, remote_premium: '+6%' },
    { title: 'SOX ITGC Lead',          low:  95000, mid: 118000, high: 142000, remote_premium: '+10%' },
    { title: 'Cloud Security Auditor', low: 115000, mid: 140000, high: 170000, remote_premium: '+12%' },
    { title: 'AI Governance Auditor',  low: 125000, mid: 155000, high: 195000, remote_premium: '+15%' },
    { title: 'Director of IT Audit',   low: 150000, mid: 175000, high: 215000, remote_premium: '+5%' },
  ],
  pj: [
    { title: 'Postdoctoral Researcher',   low:  55000, mid:  64000, high:  72000, remote_premium: 'N/A' },
    { title: 'Research Scientist II',     low:  85000, mid: 105000, high: 128000, remote_premium: '+10%' },
    { title: 'Senior Research Scientist', low: 110000, mid: 132000, high: 158000, remote_premium: '+8%' },
    { title: 'Assistant Professor',       low:  90000, mid: 110000, high: 135000, remote_premium: 'N/A' },
    { title: 'Translational Scientist',   low: 108000, mid: 130000, high: 160000, remote_premium: '+12%' },
  ],
};

app.get('/api/salary', (req, res) => {
  const p = req.query.profile === 'pj' ? 'pj' : 'dj';
  res.json({ data: SALARY_DATA[p], profile: p });
});

// ─── PHASE 7: Market ──────────────────────────────────────────────────────────
const MARKET_DATA = {
  dj: [
    { city: 'Remote/US',        demand: 98, jobs: 2847, yoy: '+34%' },
    { city: 'New York NY',      demand: 82, jobs:  412, yoy: '+12%' },
    { city: 'San Francisco CA', demand: 79, jobs:  387, yoy:  '+8%' },
    { city: 'Los Angeles CA',   demand: 68, jobs:  241, yoy: '+22%' },
    { city: 'Chicago IL',       demand: 71, jobs:  298, yoy: '+15%' },
    { city: 'Dallas TX',        demand: 65, jobs:  218, yoy: '+19%' },
  ],
  pj: [
    { city: 'Boston MA',             demand: 91, jobs: 1204, yoy: '+21%' },
    { city: 'San Diego CA',          demand: 88, jobs:  987, yoy: '+26%' },
    { city: 'Los Angeles CA',        demand: 82, jobs:  743, yoy: '+30%' },
    { city: 'San Francisco CA',      demand: 79, jobs:  698, yoy: '+15%' },
    { city: 'Remote/US',             demand: 72, jobs:  892, yoy: '+18%' },
    { city: 'Research Triangle NC',  demand: 75, jobs:  541, yoy: '+17%' },
  ],
};

app.get('/api/market', (req, res) => {
  const p = req.query.profile === 'pj' ? 'pj' : 'dj';
  res.json({ data: MARKET_DATA[p], profile: p });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  if (!res.headersSent) res.status(500).json({ error: err.message });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ CareerOS server.js running on port ${PORT}`);
  console.log(`   ANTHROPIC_API_KEY: ${ANTHROPIC_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`   ADZUNA_APP_ID:     ${ADZUNA_ID     ? 'SET' : 'NOT SET'}`);
});
