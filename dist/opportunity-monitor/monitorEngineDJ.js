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
 *   +2  Manager OR Director title
 *   +1  TIER 1 orgs (EY, Deloitte, KPMG, PwC, Goldman Sachs, JPMorgan,
 *                    Public Storage, Investar, Western Digital)
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
    'it audit manager', 'it audit director', 'head of it audit', 'director of it audit',
    'vp internal audit', 'avp it audit', 'senior manager it audit', 'technology risk manager',
    'technology risk director', 'cloud risk manager', 'cloud audit manager',
    'information security manager', 'sox audit manager', 'it compliance manager',
    'cloud security manager', 'grc manager', 'it risk manager',
];
const DJ_TECHNICAL_ANCHORS = [
    'sox', 'sox 404', 'itgc', 'itac', 'cloud security', 'cloud audit',
    'sap s/4hana', 'sap s4hana', 'nist', 'ai governance', 'ml governance',
    'soc1', 'soc 1', 'soc2', 'soc 2', 'soc type ii', 'grc',
    'cisa', 'cissp', 'aws cloud', 'azure security', 'cloud risk',
    'it general controls', 'application controls', 'it audit',
    // Broadened anchors to catch internal audit, technology risk, and compliance roles
    'internal audit', 'technology audit', 'technology risk', 'cyber audit',
    'information security audit', 'risk advisory', 'compliance audit',
    'digital audit', 'it compliance', 'it risk',
];
const DJ_SENIORITY_KEYWORDS = [
    'manager', 'senior manager', 'director', 'avp', 'vp', 'vice president',
    'head of', 'principal', 'lead',
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
    // Hard-reject: non-job domains and path patterns
    const NOISE_PATTERNS = [
        // News / media
        'reuters.com', 'bloomberg.com', 'cnbc.com', 'wsj.com', 'forbes.com',
        'businessinsider.com', 'techcrunch.com', 'venturebeat.com', 'zdnet.com',
        'theladders.com/career-advice', 'monster.com/career-advice',
        // Wikipedia / reference
        'wikipedia.org', 'investopedia.com',
        // Social (non-job)
        'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'youtube.com',
        // Company overview pages (not listings)
        'linkedin.com/company', 'linkedin.com/in/', 'glassdoor.com/overview',
        'glassdoor.com/reviews', 'indeed.com/cmp/',
        // Generic page paths
        '/about-us', '/about/', '/company/', '/team/', '/leadership/',
        '/blog/', '/news/', '/press/', '/insights/', '/resources/', '/article/',
        '/culture/', '/values/', '/history/', '/overview',
    ];
    if (NOISE_PATTERNS.some(p => lower.includes(p)))
        return false;
    // Positive signals — confirmed job posting URL patterns
    const JOB_PATTERNS = [
        '/jobs/', '/job/', '/careers/', '/career/', '/openings/', '/vacancies/',
        '/position/', '/apply', '/requisition', '/job-id', '/jobid',
        'jobs.', 'careers.', 'apply.',
        'indeed.com/viewjob', 'linkedin.com/jobs/view',
        'glassdoor.com/job-listing', 'lever.co/', 'greenhouse.io/',
        'workday.com/en-us/applications', 'myworkdayjobs.com',
        'taleo.net', 'icims.com', 'successfactors.com', 'smartrecruiters.com',
        'bamboohr.com', 'workable.com', 'ashbyhq.com', 'rippling.com/jobs',
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
        'openings', 'hiring', 'join our', 'vacancies', 'now hiring',
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
    // Use word boundaries to avoid 'intern' matching 'internal', etc.
    const matchesWord = (term) => new RegExp(`\\b${term.replace(/-/g, '[\\s-]')}\\b`).test(t);
    if (DJ_GLOBAL_HARD_FILTER.some(matchesWord))
        return false;
    if (country === 'India') {
        if (DJ_INDIA_HARD_FILTER.some(matchesWord))
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
 * DJ suitability score (0–5).
 * Confirmed job listings (RSS/Remotive/Google Jobs): store at score ≥ 2.
 * Serper organic fallback: store at score ≥ 4.
 */
function djSuitabilityScore(title, snippet, orgName) {
    const text = (title + ' ' + snippet).toLowerCase();
    let score = 0;
    // +2 for AWS Cloud Audit or AI/ML Governance (DJ's specialist edge)
    if (text.includes('aws cloud audit') || text.includes('cloud audit') ||
        text.includes('ai governance') || text.includes('ml governance') ||
        text.includes('ai/ml governance'))
        score += 2;
    // +2 for Manager or Director title
    if (text.includes('manager') || text.includes('director') ||
        text.includes('avp') || text.includes('vp') || text.includes('head of'))
        score += 2;
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
    const GENERIC = [
        'linkedin.com/company', 'linkedin.com/in/', 'linkedin.com/jobs/search', 'linkedin.com/jobs/collections',
        'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
        'youtube.com', 'glassdoor.com/Overview',
    ];
    if (GENERIC.some(d => url.includes(d)))
        return fallback;
    return url;
}
const CITY_RE = /\b(new york|san francisco|chicago|dallas|houston|atlanta|boston|seattle|washington dc|los angeles|charlotte|new jersey|bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|kolkata|gurgaon|noida|london|paris|frankfurt|amsterdam|zurich|singapore|toronto|sydney)\b/i;
function extractLocation(snippet, title, fallback) {
    const m = snippet.match(CITY_RE) || title.match(CITY_RE);
    return m ? m[0] : fallback;
}
async function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms));
    return Promise.race([promise, timeout]);
}
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
// ─── SOURCE 3: Serper /jobs API (Google Jobs) + organic fallback ─────────────
// /jobs endpoint always returns structured Google for Jobs listings (score ≥ 2).
// Organic results (from /search fallback) → strict URL + snippet + score ≥ 3.
async function scanViaWebSearchDJ(org) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        console.warn(`[MonitorDJ] SERPER_API_KEY not set — skipping ${org.name}`);
        return [];
    }
    // Country-appropriate Google locale
    const gl = org.country === 'India' ? 'in' : 'us';
    try {
        // ── PRIMARY: Serper /jobs endpoint — dedicated Google Jobs index ───────────
        // This always returns structured job listings (title, company, location,
        // description, apply links). Unlike /search, it never returns news/blogs.
        const jobsResp = await withTimeout(fetch('https://google.serper.dev/jobs', {
            method: 'POST',
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ q: org.searchQuery, num: 10, gl }),
        }), 10000, `Serper /jobs for ${org.name}`);
        const jobs = [];
        if (jobsResp.ok) {
            const jobsData = await jobsResp.json();
            const googleJobs = jobsData.jobs || [];
            console.log(`[MonitorDJ] ${org.name}: Serper /jobs raw=${googleJobs.length}`);
            for (const gj of googleJobs) {
                const title = (gj.title || '').trim();
                const company = (gj.companyName || '').trim();
                const location = gj.location || extractLocation(gj.description || '', title, org.country);
                const snippet = [
                    gj.description || '',
                    ...(gj.jobHighlights || []).flatMap((h) => h.items || []),
                ].join(' ').slice(0, 300);
                // /jobs endpoint: link in applyOptions or relatedLinks
                const link = gj.applyOptions?.[0]?.link ||
                    gj.relatedLinks?.[0]?.link ||
                    gj.applyLink || '';
                // /jobs endpoint: date in detected_extensions.posted_at or extensions array
                const postedDate = gj.detected_extensions?.posted_at ||
                    gj.extensions?.find((e) => /ago|day|week|month/i.test(e)) ||
                    'Recent';
                if (!title)
                    continue;
                const relevant = isRelevantDJ(title, snippet);
                if (!relevant) {
                    console.log(`[MonitorDJ][REJECT] ${org.name}: not relevant — title="${title}"`);
                    continue;
                }
                const passes = passesHardFilter(title, org.country);
                if (!passes) {
                    console.log(`[MonitorDJ][REJECT] ${org.name}: hard filter — title="${title}"`);
                    continue;
                }
                if (isAgencySpam(title, snippet))
                    continue;
                const s = djSuitabilityScore(title, snippet, company || org.name);
                console.log(`[MonitorDJ][SCORE] ${org.name}: score=${s} title="${title}"`);
                if (s < 2)
                    continue;
                jobs.push({
                    externalId: hashContent(title, company || org.name, link || location),
                    title,
                    orgName: company || org.name,
                    location,
                    country: org.country,
                    sector: org.sector,
                    applyUrl: extractCanonicalUrl(link || '', org.careersUrl || ''),
                    snippet: snippet.slice(0, 150),
                    postedDate,
                    contentHash: hashContent(title, company || org.name, link || location),
                    highSuitability: s >= 4,
                    eadFriendly: org.eadFriendly === true,
                    managerialGrade: org.managerialGrade === true,
                    suitabilityScore: s,
                });
            }
        }
        else {
            console.error(`[MonitorDJ] Serper /jobs ${jobsResp.status} for ${org.name}`);
        }
        // ── FALLBACK: organic web search — only if /jobs returned nothing ──────────
        if (jobs.length === 0) {
            const searchResp = await withTimeout(fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ q: org.searchQuery, num: 10, gl }),
            }), 10000, `Serper /search fallback for ${org.name}`);
            if (searchResp.ok) {
                const searchData = await searchResp.json();
                const organicResults = searchData.organic || [];
                console.log(`[MonitorDJ] ${org.name}: organic fallback=${organicResults.length}`);
                for (const r of organicResults) {
                    const title = (r.title || '').replace(/\s*[-|·].*$/, '').trim();
                    const snippet = r.snippet || '';
                    const link = r.link || '';
                    if (!title)
                        continue;
                    if (!isDirectJobUrl(link))
                        continue;
                    if (!hasJobLanguage(snippet))
                        continue;
                    if (!isRelevantDJ(title, snippet))
                        continue;
                    if (!passesHardFilter(title, org.country))
                        continue;
                    if (isAgencySpam(title, snippet))
                        continue;
                    const s = djSuitabilityScore(title, snippet, org.name);
                    if (s < 3)
                        continue;
                    const location = extractLocation(snippet, title, org.country);
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
            }
        }
        console.log(`[MonitorDJ] ${org.name}: ${jobs.length} total after filter`);
        return jobs.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
    }
    catch (err) {
        console.error(`[MonitorDJ] Serper failed for ${org.name}:`, err.message);
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
    console.log('[MonitorDJ] runFullScanDJ() invoked');
    const lockId = 987654322;
    let lockAcquired = false;
    let client;
    try {
        console.log('[MonitorDJ] Attempting pool.connect()...');
        client = await client_1.pool.connect();
        console.log('[MonitorDJ] pool.connect() succeeded');
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
       LIMIT 20`);
        for (const row of orgs.rows) {
            const orgConfig = orgConfigDJ_1.DJ_MONITOR_ORGS.find(o => o.name === row.name);
            if (!orgConfig) {
                // Stale DB row with no matching config — stamp it so it stops blocking the queue
                console.warn(`[MonitorDJ] No config for org "${row.name}" — marking scanned to clear queue`);
                await client_1.pool.query('UPDATE dj_monitor_orgs SET last_scanned_at = NOW() WHERE id = $1', [row.id]);
                continue;
            }
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
    // Always upsert — ON CONFLICT is idempotent, so this safely refreshes names/config
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
