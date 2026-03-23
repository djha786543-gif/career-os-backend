"use strict";
/**
 * monitorEngineDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ (Deobrat Jha) — Isolated scoring engine for IT Audit / Cloud Risk Monitor.
 * Uses dedicated tables: dj_monitor_orgs, dj_monitor_jobs, dj_monitor_scans.
 * Zero crossover with Pooja's monitorEngine.ts.
 *
 * SOURCE HIERARCHY (highest → lowest quality):
 *   1. Indeed RSS / Remotive API  — structured, confirmed job listings (score ≥ 2)
 *   2. Serper Google Jobs cards   — structured, Google-aggregated listings (score ≥ 2)
 *   3. Serper organic results     — filtered via URL + snippet validation (score ≥ 4)
 *
 * SCORING RULES:
 *   +2  AWS Cloud Audit OR AI Governance (DJ's specialised DNA)
 *   +2  Manager / Director / VP / AVP / Head-of title (primary target)
 *   +1  Senior / Lead / Principal (one level below — USA applicable)
 *   +1  TIER 1 orgs (EY, Deloitte, KPMG, PwC, Goldman Sachs, JPMorgan,
 *                    Public Storage, Investar, Western Digital)
 *   +1  Core IT audit domain keyword in title/snippet
 *
 * HARD FILTERS (global):
 *   Reject: Intern, Entry Level, Staff Auditor, Junior
 * HARD FILTERS (India only):
 *   Reject: Senior Associate, Associate, Analyst
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanOrgDJ = scanOrgDJ;
exports.runFullScanDJ = runFullScanDJ;
exports.seedOrgsDJ = seedOrgsDJ;
const client_1 = require("../db/client");
const orgConfigDJ_1 = require("./orgConfigDJ");
const crypto_1 = __importDefault(require("crypto"));
// ─── DJ Profile Keywords ──────────────────────────────────────────────────────
const DJ_RANK1_TITLES = [
    // Manager / Director / VP — primary target
    'it audit manager', 'it audit director', 'head of it audit', 'director of it audit',
    'vp internal audit', 'avp it audit', 'senior manager it audit', 'technology risk manager',
    'technology risk director', 'cloud risk manager', 'cloud audit manager',
    'information security manager', 'sox audit manager', 'it compliance manager',
    'cloud security manager', 'grc manager', 'it risk manager',
    // Senior / Lead — one level below manager (USA applicable)
    'senior it auditor', 'senior it audit', 'senior technology risk', 'senior cloud security',
    'senior information security', 'senior sox auditor', 'senior grc', 'senior audit',
    'senior internal auditor', 'it audit lead', 'lead it auditor', 'senior cloud risk',
    'senior it compliance', 'senior it risk',
];
const DJ_TECHNICAL_ANCHORS = [
    'sox', 'sox 404', 'itgc', 'itac', 'cloud security', 'cloud audit',
    'sap s/4hana', 'sap s4hana', 'nist', 'ai governance', 'ml governance',
    'soc1', 'soc 1', 'soc2', 'soc 2', 'soc type ii', 'grc',
    'cisa', 'cissp', 'aws cloud', 'azure security', 'cloud risk',
    'it general controls', 'application controls', 'it audit',
    // Broadened anchors
    'internal audit', 'technology audit', 'technology risk', 'cyber audit',
    'information security audit', 'risk advisory', 'compliance audit',
    'digital audit', 'it compliance', 'it risk',
];
const DJ_SENIORITY_KEYWORDS = [
    'manager', 'senior manager', 'director', 'avp', 'vp', 'vice president',
    'head of', 'principal', 'lead', 'senior', // 'senior' enables Senior Auditor / Senior Analyst matching
];
// Global hard filters — these titles must never appear for DJ
const DJ_GLOBAL_HARD_FILTER = [
    'intern', 'internship', 'entry level', 'entry-level',
    'staff auditor', 'junior', 'graduate', 'trainee', 'fresher',
];
// India-specific additional hard filters
const DJ_INDIA_HARD_FILTER = [
    'senior associate', 'associate', 'analyst',
];
// Tier 1 orgs — +1 suitability bonus
const DJ_TIER1_ORGS = new Set([
    'EY US Technology Risk', 'EY India GDS',
    'Deloitte US Risk Advisory', 'Deloitte India',
    'KPMG US Technology Risk', 'KPMG India',
    'PwC US Digital Assurance', 'PwC India',
    'Goldman Sachs', 'Goldman Sachs India',
    'JPMorgan Chase', 'JPMorgan India GCC',
    'Public Storage', 'Western Digital', 'Investar Bank',
    'Amazon Web Services', 'Amazon India GCC',
    'Microsoft', 'Microsoft India GCC',
    'Google Cloud', 'Google India GCC',
]);
// ─── Noise / Quality Filters ──────────────────────────────────────────────────
/**
 * URL quality gate — confirm the link points to an actual job posting.
 * Rejects: news sites, company overviews, blog posts, social media.
 * Accepts: known career/job page URL patterns.
 */
function isDirectJobUrl(url) {
    if (!url || url === '#')
        return false;
    const lower = url.toLowerCase();
    // Hard-reject: news / social / non-job pages
    const NOISE_PATTERNS = [
        'reuters.com', 'bloomberg.com', 'cnbc.com', 'wsj.com', 'forbes.com',
        'businessinsider.com', 'techcrunch.com', 'venturebeat.com', 'zdnet.com',
        'wikipedia.org', 'investopedia.com',
        'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'youtube.com',
        'linkedin.com/company', 'linkedin.com/in/',
        'glassdoor.com/overview', 'glassdoor.com/reviews',
        'indeed.com/cmp/',
        '/about-us', '/about/', '/blog/', '/news/', '/press/', '/insights/',
        '/resources/', '/article/', '/culture/', '/values/', '/history/', '/overview',
    ];
    if (NOISE_PATTERNS.some(p => lower.includes(p)))
        return false;
    // Accept all LinkedIn jobs pages (search or listing — both contain job postings)
    if (lower.includes('linkedin.com/jobs'))
        return true;
    // Accept all Glassdoor job pages
    if (lower.includes('glassdoor.com/job') || lower.includes('glassdoor.co.in/job'))
        return true;
    // Accept Indeed job pages
    if (lower.includes('indeed.com') && (lower.includes('/job') || lower.includes('viewjob')))
        return true;
    // Accept any Reed, Totaljobs, CityJobs, Jobsite (UK job boards)
    if (lower.includes('reed.co.uk') || lower.includes('totaljobs.com') ||
        lower.includes('jobsite.co.uk') || lower.includes('cwjobs.co.uk') ||
        lower.includes('michaelpage.co.uk') || lower.includes('robertwalters.co.uk'))
        return true;
    // Standard positive patterns
    const JOB_PATTERNS = [
        '/jobs/', '/job/', '/careers/', '/career/', '/openings/', '/vacancies/',
        '/position/', '/apply', '/requisition', '/job-id', '/jobid',
        'jobs.', 'careers.', 'apply.',
        'lever.co/', 'greenhouse.io/', 'workday.com', 'myworkdayjobs.com',
        'taleo.net', 'icims.com', 'successfactors.com', 'smartrecruiters.com',
        'bamboohr.com', 'workable.com', 'ashbyhq.com', 'rippling.com/jobs',
        'ziprecruiter.com', 'monster.com/job', 'simplyhired.com',
        'totaljobs.com', 'jobserve.com', 'cwjobs.co.uk',
    ];
    return JOB_PATTERNS.some(p => lower.includes(p));
}
/**
 * Snippet must contain language typical of a job description.
 * Rules out news summaries, company bios, and generic career page blurbs.
 */
function hasJobLanguage(snippet) {
    if (!snippet)
        return false;
    const s = snippet.toLowerCase();
    const JOB_WORDS = [
        'responsibilities', 'requirements', 'qualifications', 'years of experience',
        'required', 'preferred', 'skills', 'bachelor', 'master', 'degree',
        'apply', 'role', 'position', 'opportunity', 'we are looking',
        'you will', 'you\'ll', 'must have', 'nice to have', 'salary',
        'compensation', 'benefits', 'full-time', 'full time', 'remote',
    ];
    return JOB_WORDS.some(w => s.includes(w));
}
/**
 * Agency / spam blocker — removes low-quality third-party recruiter spam,
 * mass-posting agencies, and C2C-only listings that aren't real employer jobs.
 */
function isAgencySpam(title, snippet) {
    const text = (title + ' ' + snippet).toLowerCase();
    const SPAM_SIGNALS = [
        'corp to corp', 'c2c', 'w2 only contract', 'no h1b', 'no h-1b',
        'multiple openings available', '100+ applicants',
        'submit resume to', 'send resume to', 'email resume',
        'staffing company', 'staffing firm', 'recruiting agency', 'placement agency',
        'we are a staffing', 'this is a staffing', 'on behalf of our client',
        'contract corp-to-corp', 'c2c or w2',
    ];
    return SPAM_SIGNALS.some(s => text.includes(s));
}
// ─── Filter Functions ─────────────────────────────────────────────────────────
function passesHardFilter(title, country) {
    const t = title.toLowerCase();
    if (DJ_GLOBAL_HARD_FILTER.some(term => t.includes(term)))
        return false;
    if (country === 'India') {
        if (DJ_INDIA_HARD_FILTER.some(term => t.includes(term)))
            return false;
    }
    return true;
}
function hasSenioritySignal(title) {
    const t = title.toLowerCase();
    return DJ_SENIORITY_KEYWORDS.some(kw => t.includes(kw));
}
function hasTechnicalAnchor(title, snippet) {
    const text = (title + ' ' + snippet).toLowerCase();
    return DJ_TECHNICAL_ANCHORS.some(anchor => text.includes(anchor));
}
function isRelevantDJ(title, snippet = '') {
    const text = (title + ' ' + snippet).toLowerCase();
    return (DJ_RANK1_TITLES.some(kw => text.includes(kw)) ||
        (hasSenioritySignal(title) && hasTechnicalAnchor(title, snippet)));
}
/**
 * DJ suitability score (0–6+).
 * Confirmed job listings (RSS/Remotive/Google Jobs): store at score ≥ 2.
 * Serper organic fallback: store at score ≥ 3.
 *
 * +2  Cloud Audit / AI Governance (DJ's specialist edge)
 * +2  Manager / Director / VP / AVP / Head-of (primary target grade)
 * +1  Senior / Lead / Principal without Manager title (one level below — USA)
 * +1  Tier 1 org
 * +1  Core IT audit domain keyword
 */
function djSuitabilityScore(title, snippet, orgName) {
    const text = (title + ' ' + snippet).toLowerCase();
    const titleLower = title.toLowerCase();
    let score = 0;
    // +2 for Cloud Audit / AI/ML Governance (DJ's specialist edge)
    if (text.includes('aws cloud audit') || text.includes('cloud audit') ||
        text.includes('ai governance') || text.includes('ml governance') ||
        text.includes('ai/ml governance'))
        score += 2;
    // +2 for Manager / Director / VP — primary grade
    if (titleLower.includes('manager') || titleLower.includes('director') ||
        titleLower.includes('avp') || titleLower.includes(' vp ') ||
        titleLower.startsWith('vp ') || titleLower.includes('vice president') ||
        titleLower.includes('head of')) {
        score += 2;
    }
    else if (
    // +1 for Senior / Lead / Principal — one level below manager (USA applicable)
    titleLower.includes('senior') || titleLower.includes(' lead') ||
        titleLower.startsWith('lead ') || titleLower.includes('principal')) {
        score += 1;
    }
    // +1 for Tier 1 org
    if (DJ_TIER1_ORGS.has(orgName))
        score += 1;
    // +1 for core IT audit domain keywords in title or snippet
    if (text.includes('it audit') || text.includes('sox') || text.includes('itgc') ||
        text.includes('internal audit') || text.includes('technology risk') ||
        text.includes('it risk') || text.includes('grc') || text.includes('cisa') ||
        text.includes('it compliance') || text.includes('itac'))
        score += 1;
    return score;
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function hashContent(title, org, location) {
    return crypto_1.default
        .createHash('sha256')
        .update(`${title}|${org}|${location}`)
        .digest('hex')
        .slice(0, 64);
}
function extractCanonicalUrl(url, fallback) {
    if (!url)
        return fallback;
    // Only reject generic non-job LinkedIn pages (NOT /jobs/view/ which is a real listing)
    const GENERIC = [
        'linkedin.com/company', 'linkedin.com/in/',
        'linkedin.com/jobs/search', 'linkedin.com/jobs/collections',
        'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
        'youtube.com', 'glassdoor.com/Overview',
    ];
    if (GENERIC.some(d => url.includes(d)))
        return fallback;
    return url;
}
async function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms));
    return Promise.race([promise, timeout]);
}
const CITY_RE = /\b(new york|new york city|nyc|chicago|dallas|houston|charlotte|boston|atlanta|denver|phoenix|los angeles|san francisco|san jose|seattle|austin|remote|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|gurgaon|noida|london|manchester|edinburgh|birmingham|frankfurt|zurich|amsterdam|paris|dublin|singapore|sydney)\b/i;
// ─── SOURCE 1: Indeed RSS + Any RSS Feed ─────────────────────────────────────
// Direct job listings — no noise, no Serper cost. Score threshold: ≥ 2.
async function scanViaRSSDJ(org) {
    if (!org.rssUrl)
        return [];
    try {
        const resp = await withTimeout(fetch(org.rssUrl, {
            headers: {
                'User-Agent': 'career-os-portal/1.0',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
        }), 8000, `DJ RSS for ${org.name}`);
        if (!resp.ok) {
            console.warn(`[MonitorDJ-RSS] ${resp.status} for ${org.name}`);
            return [];
        }
        const text = await resp.text();
        const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        console.log(`[MonitorDJ-RSS] ${org.name}: raw items=${itemMatches.length}`);
        const jobs = [];
        for (const item of itemMatches.slice(0, 25)) {
            // Extract fields — handle both CDATA and plain text
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                item.match(/<title>(.*?)<\/title>/)?.[1] || '').replace(/<[^>]+>/g, '').trim();
            const link = (item.match(/<link>(.*?)<\/link>/)?.[1] ||
                item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || '').trim();
            const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                item.match(/<description>(.*?)<\/description>/)?.[1] || '').replace(/<[^>]+>/g, '').slice(0, 200).trim();
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 'Recent';
            // Indeed RSS encodes company name in the title as "Job Title - Company"
            // or in <source> tag
            const sourceCompany = item.match(/<source[^>]*>(.*?)<\/source>/)?.[1] || '';
            const titleCompanyMatch = title.match(/^(.+?)\s*-\s*(.+)$/);
            const company = sourceCompany ||
                (titleCompanyMatch ? titleCompanyMatch[2].trim() : '') ||
                org.name;
            const cleanTitle = titleCompanyMatch ? titleCompanyMatch[1].trim() : title;
            if (!cleanTitle)
                continue;
            if (!isRelevantDJ(cleanTitle, desc))
                continue;
            if (!passesHardFilter(cleanTitle, org.country))
                continue;
            if (isAgencySpam(cleanTitle, desc))
                continue;
            // Lower threshold for RSS — these are confirmed job listings
            const s = djSuitabilityScore(cleanTitle, desc, company);
            if (s < 2)
                continue;
            const cityMatch = desc.match(CITY_RE) || cleanTitle.match(CITY_RE);
            const location = cityMatch ? cityMatch[0] : (org.country === 'USA' ? 'United States' : 'India');
            jobs.push({
                externalId: hashContent(cleanTitle, company, link || pubDate),
                title: cleanTitle,
                orgName: company,
                location,
                country: org.country,
                sector: org.sector,
                applyUrl: link || org.careersUrl || '',
                snippet: desc.slice(0, 150),
                postedDate: pubDate,
                contentHash: hashContent(cleanTitle, company, link || pubDate),
                highSuitability: s >= 4,
                eadFriendly: org.eadFriendly === true,
                managerialGrade: false,
                suitabilityScore: s,
            });
        }
        console.log(`[MonitorDJ-RSS] ${org.name}: ${jobs.length} after filter`);
        return jobs.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }
    catch (err) {
        console.error(`[MonitorDJ-RSS] Failed ${org.name}:`, err.message);
        return [];
    }
}
// ─── SOURCE 2: Remotive.com API ───────────────────────────────────────────────
// Free JSON API — remote job listings only. No auth required. Score threshold: ≥ 2.
async function scanViaRemotive(org) {
    try {
        const query = encodeURIComponent(org.searchQuery);
        const url = `https://remotive.com/api/remote-jobs?search=${query}&limit=20`;
        const resp = await withTimeout(fetch(url, { headers: { 'User-Agent': 'career-os-portal/1.0' } }), 10000, `Remotive for ${org.name}`);
        if (!resp.ok) {
            console.warn(`[MonitorDJ-Remotive] ${resp.status} for ${org.name}`);
            return [];
        }
        const data = await resp.json();
        const items = data.jobs || [];
        console.log(`[MonitorDJ-Remotive] ${org.name}: raw=${items.length}`);
        const jobs = [];
        for (const item of items) {
            const title = (item.title || '').trim();
            const company = (item.company_name || '').trim();
            const snippet = (item.description || '')
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .slice(0, 200)
                .trim();
            if (!title)
                continue;
            if (!isRelevantDJ(title, snippet))
                continue;
            if (!passesHardFilter(title, 'USA'))
                continue;
            if (isAgencySpam(title, snippet))
                continue;
            const s = djSuitabilityScore(title, snippet, company);
            if (s < 2)
                continue;
            jobs.push({
                externalId: String(item.id) || hashContent(title, company, item.url || ''),
                title,
                orgName: company,
                location: 'Remote',
                country: 'USA',
                sector: org.sector,
                applyUrl: item.url || '',
                snippet: snippet.slice(0, 150),
                postedDate: item.publication_date || 'Recent',
                contentHash: hashContent(title, company, item.url || ''),
                highSuitability: s >= 4,
                eadFriendly: true, // Remote = EAD friendly by default
                managerialGrade: false,
                suitabilityScore: s,
            });
        }
        console.log(`[MonitorDJ-Remotive] ${org.name}: ${jobs.length} after filter`);
        return jobs.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }
    catch (err) {
        console.error(`[MonitorDJ-Remotive] Failed:`, err.message);
        return [];
    }
}
// ─── SOURCE 3: Serper Web Search ──────────────────────────────────────────────
// Google for Jobs cards (data.jobs) → structured listings, score ≥ 2.
// Organic results (data.organic) → job board URLs + relevance, score ≥ 2.
// Uses serperGl for country-appropriate Google locale (default: us/in/gb).
async function scanViaWebSearchDJ(org) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        console.warn(`[MonitorDJ] SERPER_API_KEY not set — skipping ${org.name}`);
        return [];
    }
    // Determine Google locale: use explicit serperGl, else derive from country
    const gl = org.serperGl ||
        (org.country === 'India' ? 'in' : org.country === 'Europe' ? 'gb' : 'us');
    try {
        const resp = await withTimeout(fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: org.searchQuery, num: 10, gl }),
        }), 10000, `DJ Serper for ${org.name}`);
        if (!resp.ok) {
            console.error(`[MonitorDJ] Serper ${resp.status} for ${org.name}`);
            return [];
        }
        const data = await resp.json();
        const jobs = [];
        // ── Tier A: Google for Jobs cards (highest quality, structured data) ──────
        const googleJobs = data.jobs || [];
        console.log(`[MonitorDJ] ${org.name}: Google Jobs cards=${googleJobs.length}`);
        for (const gj of googleJobs) {
            const title = (gj.title || '').trim();
            const company = (gj.companyName || '').trim();
            const location = gj.location || org.country;
            const snippet = [
                gj.description || '',
                ...(gj.jobHighlights || []).flatMap((h) => h.items || []),
            ].join(' ').slice(0, 300);
            const link = gj.relatedLinks?.[0]?.link || gj.applyLink || '';
            const postedDate = gj.extensions?.find((e) => /ago|day|week|month/i.test(e)) || 'Recent';
            if (!title)
                continue;
            if (!isRelevantDJ(title, snippet))
                continue;
            if (!passesHardFilter(title, org.country))
                continue;
            if (isAgencySpam(title, snippet))
                continue;
            const s = djSuitabilityScore(title, snippet, company || org.name);
            if (s < 2)
                continue;
            jobs.push({
                externalId: hashContent(title, company || org.name, link || location),
                title,
                orgName: company || org.name,
                location,
                country: org.country,
                sector: org.sector,
                applyUrl: link || org.careersUrl || '',
                snippet: snippet.slice(0, 150),
                postedDate,
                contentHash: hashContent(title, company || org.name, link || location),
                highSuitability: s >= 4,
                eadFriendly: org.eadFriendly === true,
                managerialGrade: org.managerialGrade === true,
                suitabilityScore: s,
            });
        }
        // ── Tier B: Organic results — job board URLs + relevance check ────────────
        // Threshold lowered to s≥2 (same as Google Jobs cards).
        // hasJobLanguage removed — Serper snippets are often truncated career page text.
        const organicResults = data.organic || [];
        console.log(`[MonitorDJ] ${org.name}: organic=${organicResults.length}`);
        for (const r of organicResults) {
            const rawTitle = (r.title || '').trim();
            // Strip site suffix (e.g. "IT Audit Manager | Goldman Sachs Careers" → "IT Audit Manager")
            const title = rawTitle.replace(/\s*[|\-–—·]\s*(careers|jobs|indeed|linkedin|glassdoor|goldman|jpmorgan).*/i, '').trim() || rawTitle;
            const snippet = r.snippet || '';
            const link = r.link || '';
            if (!title)
                continue;
            if (!isDirectJobUrl(link))
                continue;
            if (!isRelevantDJ(title, snippet))
                continue;
            if (!passesHardFilter(title, org.country))
                continue;
            if (isAgencySpam(title, snippet))
                continue;
            const s = djSuitabilityScore(title, snippet, org.name);
            if (s < 2)
                continue;
            const cityMatch = (snippet + ' ' + rawTitle).match(CITY_RE);
            const location = cityMatch ? cityMatch[0] : org.country;
            jobs.push({
                externalId: hashContent(title, org.name, link),
                title,
                orgName: org.name,
                location,
                country: org.country,
                sector: org.sector,
                applyUrl: extractCanonicalUrl(link, org.careersUrl || ''),
                snippet: snippet.slice(0, 150),
                postedDate: 'Recent',
                contentHash: hashContent(title, org.name, link),
                highSuitability: s >= 4,
                eadFriendly: org.eadFriendly === true,
                managerialGrade: org.managerialGrade === true,
                suitabilityScore: s,
            });
        }
        console.log(`[MonitorDJ] ${org.name}: ${jobs.length} total after filter`);
        return jobs.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }
    catch (err) {
        console.error(`[MonitorDJ] Serper failed ${org.name}:`, err.message);
        return [];
    }
}
// ─── SOURCE 4: Adzuna Free Job API ───────────────────────────────────────────
// Register free at https://developer.adzuna.com
// Set ADZUNA_APP_ID + ADZUNA_APP_KEY in Railway env vars.
// Covers USA (us), UK (gb), Germany (de), France (fr), Netherlands (nl), etc.
async function scanViaAdzuna(org) {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
        console.warn(`[MonitorDJ-Adzuna] ADZUNA_APP_ID/ADZUNA_APP_KEY not set — skipping ${org.name}`);
        return [];
    }
    const countryCode = org.adzunaCountry || 'us';
    const encodedQuery = encodeURIComponent(org.searchQuery);
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1` +
        `?app_id=${appId}&app_key=${appKey}&results_per_page=20&what=${encodedQuery}&sort_by=date`;
    try {
        const resp = await withTimeout(fetch(url, { headers: { 'User-Agent': 'career-os-portal/1.0' } }), 12000, `Adzuna for ${org.name}`);
        if (!resp.ok) {
            console.warn(`[MonitorDJ-Adzuna] ${resp.status} for ${org.name}`);
            return [];
        }
        const data = await resp.json();
        const results = data.results || [];
        console.log(`[MonitorDJ-Adzuna] ${org.name}: raw=${results.length}`);
        const jobs = [];
        for (const r of results) {
            const title = (r.title || '').trim();
            const company = (r.company?.display_name || '').trim();
            const location = r.location?.display_name || (org.country === 'India' ? 'India' : org.country);
            const snippet = (r.description || '')
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .slice(0, 300);
            const applyUrl = r.redirect_url || '';
            const postedDate = r.created ? r.created.slice(0, 10) : 'Recent';
            if (!title)
                continue;
            if (!isRelevantDJ(title, snippet))
                continue;
            if (!passesHardFilter(title, org.country))
                continue;
            if (isAgencySpam(title, snippet))
                continue;
            const s = djSuitabilityScore(title, snippet, company || org.name);
            if (s < 2)
                continue;
            jobs.push({
                externalId: String(r.id) || hashContent(title, company, applyUrl),
                title,
                orgName: company || org.name,
                location,
                country: org.country,
                sector: org.sector,
                applyUrl,
                snippet: snippet.slice(0, 150),
                postedDate,
                contentHash: hashContent(title, company || org.name, applyUrl || location),
                highSuitability: s >= 4,
                eadFriendly: org.eadFriendly === true,
                managerialGrade: false,
                suitabilityScore: s,
            });
        }
        console.log(`[MonitorDJ-Adzuna] ${org.name}: ${jobs.length} after filter`);
        return jobs.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }
    catch (err) {
        console.error(`[MonitorDJ-Adzuna] Failed ${org.name}:`, err.message);
        return [];
    }
}
// ─── scanOrgDJ ────────────────────────────────────────────────────────────────
async function scanOrgDJ(orgId, org) {
    let jobs = [];
    try {
        switch (org.apiType) {
            case 'rss':
                jobs = await scanViaRSSDJ(org);
                break;
            case 'remotive':
                jobs = await scanViaRemotive(org);
                break;
            case 'adzuna':
                jobs = await scanViaAdzuna(org);
                break;
            default: jobs = await scanViaWebSearchDJ(org);
        }
    }
    catch (err) {
        const msg = err.message;
        try {
            await client_1.pool.query(`INSERT INTO dj_monitor_scans (org_id, jobs_found, new_jobs, status, error_message)
         VALUES ($1, 0, 0, 'error', $2)`, [orgId, msg]);
        }
        catch { /* non-fatal */ }
        return { found: 0, newJobs: 0, error: msg };
    }
    let newCount = 0;
    for (const job of jobs) {
        try {
            const result = await client_1.pool.query(`INSERT INTO dj_monitor_jobs
           (org_id, external_id, title, org_name, location, country,
            sector, apply_url, snippet, posted_date, content_hash,
            high_suitability, ead_friendly, managerial_grade, suitability_score,
            is_new, is_active, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,true,NOW())
         ON CONFLICT (org_id, external_id) DO UPDATE
           SET is_active        = true,
               last_seen_at     = NOW(),
               high_suitability = $12,
               ead_friendly     = $13,
               managerial_grade = $14,
               suitability_score= $15,
               is_new = CASE
                 WHEN dj_monitor_jobs.content_hash != $11 THEN true
                 ELSE dj_monitor_jobs.is_new
               END,
               content_hash = $11
         RETURNING (xmax = 0) as inserted`, [
                orgId, job.externalId, job.title, job.orgName,
                job.location, job.country, job.sector,
                job.applyUrl, job.snippet, job.postedDate, job.contentHash,
                job.highSuitability, job.eadFriendly, job.managerialGrade, job.suitabilityScore,
            ]);
            if (result.rows[0]?.inserted)
                newCount++;
        }
        catch (err) {
            console.error(`[MonitorDJ] Failed to save job "${job.title}":`, err.message);
        }
    }
    try {
        await client_1.pool.query('UPDATE dj_monitor_orgs SET last_scanned_at = NOW() WHERE id = $1', [orgId]);
        await client_1.pool.query(`INSERT INTO dj_monitor_scans (org_id, jobs_found, new_jobs, status)
       VALUES ($1, $2, $3, 'success')`, [orgId, jobs.length, newCount]);
    }
    catch (err) {
        console.error('[MonitorDJ] Failed to update scan record:', err.message);
    }
    console.log(`[MonitorDJ] ${org.name}: ${jobs.length} found, ${newCount} new`);
    return { found: jobs.length, newJobs: newCount };
}
// ─── runFullScanDJ ────────────────────────────────────────────────────────────
// Uses advisory lock ID 987654322 (distinct from Pooja's 987654321).
// Scans 10 orgs per run — NULL last_scanned_at prioritised.
async function runFullScanDJ() {
    const lockId = 987654322;
    let lockAcquired = false;
    let client;
    try {
        client = await client_1.pool.connect();
        const lockResult = await client.query('SELECT pg_try_advisory_lock($1) as acquired', [lockId]);
        lockAcquired = lockResult.rows[0]?.acquired === true;
        if (!lockAcquired) {
            console.log('[MonitorDJ] Another instance is already scanning, skipping...');
            client.release();
            return;
        }
        console.log('[MonitorDJ] Advisory lock acquired, starting full DJ scan...');
        const orgs = await client_1.pool.query(`SELECT id, name FROM dj_monitor_orgs
       WHERE is_active = true
       ORDER BY last_scanned_at ASC NULLS FIRST
       LIMIT 10`);
        for (const row of orgs.rows) {
            const orgConfig = orgConfigDJ_1.DJ_MONITOR_ORGS.find(o => o.name === row.name);
            if (!orgConfig)
                continue;
            await scanOrgDJ(row.id, orgConfig);
            const delay = orgConfig.slowFetch ? 8000 : 3000;
            await new Promise(r => setTimeout(r, delay));
        }
        // Expire jobs not seen in 30 days
        const cleaned = await client_1.pool.query(`UPDATE dj_monitor_jobs
       SET is_active = false
       WHERE last_seen_at < NOW() - INTERVAL '30 days'
       AND is_active = true
       RETURNING id`);
        if (cleaned.rows.length > 0) {
            console.log(`[MonitorDJ] Expired ${cleaned.rows.length} old DJ job listings`);
        }
        console.log('[MonitorDJ] Full DJ scan complete');
    }
    catch (err) {
        console.error('[MonitorDJ] Scan error:', err.message);
    }
    finally {
        if (client) {
            if (lockAcquired) {
                try {
                    await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
                }
                catch (e) {
                    console.error('[MonitorDJ] Failed to release advisory lock:', e);
                }
            }
            client.release();
        }
    }
}
// ─── seedOrgsDJ ───────────────────────────────────────────────────────────────
async function seedOrgsDJ() {
    const count = await client_1.pool.query('SELECT COUNT(*) FROM dj_monitor_orgs');
    if (parseInt(count.rows[0].count) >= orgConfigDJ_1.DJ_MONITOR_ORGS.length) {
        console.log(`[MonitorDJ] ${count.rows[0].count} DJ orgs already seeded`);
        return;
    }
    console.log('[MonitorDJ] Seeding DJ organizations...');
    for (const org of orgConfigDJ_1.DJ_MONITOR_ORGS) {
        await client_1.pool.query(`INSERT INTO dj_monitor_orgs
         (name, sector, country, careers_url, rss_url, api_type, ead_friendly, managerial_grade)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (name) DO UPDATE
         SET api_type    = EXCLUDED.api_type,
             rss_url     = EXCLUDED.rss_url,
             careers_url = COALESCE(EXCLUDED.careers_url, dj_monitor_orgs.careers_url)`, [
            org.name, org.sector, org.country,
            org.careersUrl || null, org.rssUrl || null, org.apiType,
            org.eadFriendly === true, org.managerialGrade === true,
        ]);
    }
    console.log(`[MonitorDJ] Seeded ${orgConfigDJ_1.DJ_MONITOR_ORGS.length} DJ organizations`);
}
