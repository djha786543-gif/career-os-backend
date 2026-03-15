"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanOrg = scanOrg;
exports.runFullScan = runFullScan;
exports.seedOrgs = seedOrgs;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const client_1 = require("../db/client");
const orgConfig_1 = require("./orgConfig");
const crypto_1 = __importDefault(require("crypto"));
const anthropic = new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
// Pooja-relevant job title and domain keywords
const RELEVANT_KEYWORDS = [
    'postdoc', 'postdoctoral', 'research scientist', 'research associate',
    'senior scientist', 'staff scientist', 'principal scientist',
    'cardiovascular', 'molecular biology', 'cell biology', 'genomics',
    'sequencing', 'crispr', 'rna', 'cardiac', 'heart failure',
    'cardiomyopathy', 'transcriptomics', 'proteomics', 'bioinformatics',
    'research fellow', 'scientist i', 'scientist ii', 'scientist iii',
    'associate scientist', 'junior scientist', 'postdoctoral associate',
    'postdoctoral fellow', 'research officer'
];
// RECOMMENDATION 1: Strict location filtering
const RELEVANT_LOCATIONS = [
    'usa', 'united states', 'new york', 'boston', 'san francisco',
    'seattle', 'chicago', 'houston', 'los angeles', 'bethesda',
    'cambridge, ma', 'cambridge ma', 'la jolla', 'san diego',
    'uk', 'united kingdom', 'london', 'edinburgh', 'oxford',
    'cambridge, uk', 'cambridge uk', 'manchester', 'glasgow',
    'germany', 'berlin', 'heidelberg', 'munich', 'frankfurt',
    'sweden', 'stockholm', 'gothenburg',
    'switzerland', 'zurich', 'basel', 'geneva',
    'canada', 'toronto', 'montreal', 'vancouver',
    'singapore',
    'australia', 'melbourne', 'sydney',
    'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi',
    'hyderabad', 'pune', 'faridabad', 'trivandrum', 'kolkata'
];
// RECOMMENDATION 8: Relevance scoring instead of binary match
function relevanceScore(title, description = '') {
    const text = (title + ' ' + description).toLowerCase();
    let score = 0;
    for (const kw of RELEVANT_KEYWORDS) {
        if (text.includes(kw.toLowerCase()))
            score++;
    }
    return score;
}
function isRelevant(title, description = '') {
    return relevanceScore(title, description) >= 1;
}
// RECOMMENDATION 1: Fixed location filter — require explicit location match
function isRelevantLocation(location = '') {
    if (!location || location.trim() === '')
        return false;
    const loc = location.toLowerCase();
    return RELEVANT_LOCATIONS.some(l => loc.includes(l));
}
function hashContent(title, org, location) {
    return crypto_1.default
        .createHash('sha256')
        .update(`${title}|${org}|${location}`)
        .digest('hex')
        .slice(0, 64);
}
// RECOMMENDATION 3: Timeout wrapper for all external calls
async function withTimeout(promise, ms, label) {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms));
    return Promise.race([promise, timeout]);
}
// RECOMMENDATION 4: websearch is last resort — RSS and USAJobs preferred
async function scanViaWebSearch(org) {
    try {
        const response = await withTimeout(anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            messages: [{
                    role: 'user',
                    content: `Search for current open job positions at ${org.name}.
Query: "${org.searchQuery}"

Find ONLY real, currently open positions posted in 2025 or 2026.
Include ONLY positions in these locations: USA, UK, Germany, Sweden,
Switzerland, Canada, Singapore, Australia, or India.

Return ONLY a JSON array, no markdown, no explanation:
[{
  "title": "exact job title",
  "location": "city, country (must be specific — not just 'remote')",
  "applyUrl": "direct URL to job posting",
  "snippet": "job description under 150 characters",
  "postedDate": "date posted or Recent"
}]
If no relevant open positions found, return: []`
                }]
        }), 15000, `webSearch for ${org.name}`);
        let raw = '';
        for (const block of response.content) {
            if (block.type === 'text')
                raw += block.text;
        }
        raw = raw.replace(/```json|```/g, '').trim();
        const start = raw.indexOf('[');
        const end = raw.lastIndexOf(']');
        if (start === -1 || end === -1)
            return [];
        const parsed = JSON.parse(raw.slice(start, end + 1));
        return parsed
            .filter((j) => j.title && isRelevant(j.title, j.snippet))
            .filter((j) => j.location && isRelevantLocation(j.location))
            .map((j) => ({
            externalId: hashContent(j.title, org.name, j.location || ''),
            title: j.title,
            orgName: org.name,
            location: j.location,
            country: org.country,
            applyUrl: j.applyUrl || org.careersUrl || '',
            snippet: j.snippet || '',
            postedDate: j.postedDate || 'Recent',
            contentHash: hashContent(j.title, org.name, j.location || ''),
            relevanceScore: relevanceScore(j.title, j.snippet)
        }))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    catch (err) {
        console.error(`[Monitor] webSearch failed for ${org.name}:`, err.message);
        return [];
    }
}
async function scanViaUSAJobs(org) {
    try {
        const query = encodeURIComponent(org.searchQuery);
        const url = `https://data.usajobs.gov/api/search?Keyword=${query}&ResultsPerPage=10`;
        const resp = await withTimeout(fetch(url, {
            headers: {
                'User-Agent': 'career-os-portal@railway.app',
                'Authorization-Key': process.env.USAJOBS_API_KEY || ''
            }
        }), 10000, `USAJobs for ${org.name}`);
        if (!resp.ok) {
            console.warn(`[Monitor] USAJobs returned ${resp.status} for ${org.name}, falling back to webSearch`);
            return scanViaWebSearch(org);
        }
        const data = await resp.json();
        const items = data?.SearchResult?.SearchResultItems || [];
        return items
            .filter((item) => {
            const title = item.MatchedObjectDescriptor?.PositionTitle || '';
            return isRelevant(title);
        })
            .map((item) => {
            const d = item.MatchedObjectDescriptor;
            const title = d.PositionTitle || '';
            const location = d.PositionLocation?.[0]?.LocationName || 'Washington DC, USA';
            return {
                externalId: d.PositionID || hashContent(title, org.name, location),
                title,
                orgName: d.OrganizationName || org.name,
                location,
                country: 'USA',
                applyUrl: d.ApplyURI?.[0] || '',
                snippet: (d.UserArea?.Details?.JobSummary || '').slice(0, 150),
                postedDate: d.PublicationStartDate?.split('T')[0] || 'Recent',
                contentHash: hashContent(title, org.name, location),
                relevanceScore: relevanceScore(title)
            };
        });
    }
    catch (err) {
        console.error(`[Monitor] USAJobs failed for ${org.name}:`, err.message);
        return scanViaWebSearch(org);
    }
}
async function scanViaRSS(org) {
    if (!org.rssUrl)
        return scanViaWebSearch(org);
    try {
        const resp = await withTimeout(fetch(org.rssUrl, {
            headers: { 'User-Agent': 'career-os-portal@railway.app' }
        }), 8000, `RSS for ${org.name}`);
        const text = await resp.text();
        const items = [];
        const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || [];
        for (const item of itemMatches.slice(0, 15)) {
            const title = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                item.match(/<title>(.*?)<\/title>/)?.[1] || '').trim();
            const link = (item.match(/<link>(.*?)<\/link>/)?.[1] || '').trim();
            const desc = (item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                item.match(/<description>(.*?)<\/description>/)?.[1] || '').replace(/<[^>]+>/g, '').slice(0, 150).trim();
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 'Recent';
            if (!isRelevant(title, desc))
                continue;
            const location = org.country;
            if (!isRelevantLocation(location))
                continue;
            items.push({
                externalId: hashContent(title, org.name, location),
                title,
                orgName: org.name,
                location,
                country: org.country,
                applyUrl: link,
                snippet: desc,
                postedDate: pubDate,
                contentHash: hashContent(title, org.name, location),
                relevanceScore: relevanceScore(title, desc)
            });
        }
        if (items.length === 0) {
            console.log(`[Monitor] RSS empty for ${org.name}, falling back to webSearch`);
            return scanViaWebSearch(org);
        }
        return items.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    catch (err) {
        console.error(`[Monitor] RSS failed for ${org.name}:`, err.message);
        return scanViaWebSearch(org);
    }
}
async function scanOrg(orgId, org) {
    let jobs = [];
    try {
        switch (org.apiType) {
            case 'rss':
                jobs = await scanViaRSS(org);
                break;
            case 'usajobs':
                jobs = await scanViaUSAJobs(org);
                break;
            default: jobs = await scanViaWebSearch(org);
        }
    }
    catch (err) {
        const msg = err.message;
        try {
            await client_1.pool.query(`INSERT INTO monitor_scans (org_id, jobs_found, new_jobs, status, error_message)
         VALUES ($1, 0, 0, 'error', $2)`, [orgId, msg]);
        }
        catch (dbErr) {
            console.error('[Monitor] Failed to log scan error:', dbErr.message);
        }
        return { found: 0, newJobs: 0, error: msg };
    }
    let newCount = 0;
    for (const job of jobs) {
        try {
            const result = await client_1.pool.query(`INSERT INTO monitor_jobs
           (org_id, external_id, title, org_name, location, country,
            sector, apply_url, snippet, posted_date, content_hash,
            is_new, is_active, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true,NOW())
         ON CONFLICT (org_id, external_id) DO UPDATE
           SET is_active = true,
               last_seen_at = NOW(),
               is_new = CASE
                 WHEN monitor_jobs.content_hash != $11 THEN true
                 ELSE monitor_jobs.is_new
               END,
               content_hash = $11
         RETURNING (xmax = 0) as inserted`, [orgId, job.externalId, job.title, job.orgName,
                job.location, job.country, org.sector,
                job.applyUrl, job.snippet, job.postedDate, job.contentHash]);
            if (result.rows[0]?.inserted)
                newCount++;
        }
        catch (err) {
            console.error(`[Monitor] Failed to save job "${job.title}":`, err.message);
        }
    }
    try {
        await client_1.pool.query('UPDATE monitor_orgs SET last_scanned_at = NOW() WHERE id = $1', [orgId]);
        await client_1.pool.query(`INSERT INTO monitor_scans (org_id, jobs_found, new_jobs, status)
       VALUES ($1, $2, $3, 'success')`, [orgId, jobs.length, newCount]);
    }
    catch (err) {
        console.error('[Monitor] Failed to update scan record:', err.message);
    }
    console.log(`[Monitor] ${org.name}: ${jobs.length} found, ${newCount} new`);
    return { found: jobs.length, newJobs: newCount };
}
// RECOMMENDATION 2: PostgreSQL advisory lock to prevent duplicate cron runs
async function runFullScan() {
    const lockId = 987654321;
    let lockAcquired = false;
    let client;
    try {
        client = await client_1.pool.connect();
        const lockResult = await client.query('SELECT pg_try_advisory_lock($1) as acquired', [lockId]);
        lockAcquired = lockResult.rows[0]?.acquired === true;
        if (!lockAcquired) {
            console.log('[Monitor] Another instance is already scanning, skipping...');
            client.release();
            return;
        }
        console.log('[Monitor] Advisory lock acquired, starting full scan...');
        const orgs = await client_1.pool.query(`SELECT id, name FROM monitor_orgs
       WHERE is_active = true
       ORDER BY last_scanned_at ASC NULLS FIRST`);
        for (const row of orgs.rows) {
            const orgConfig = orgConfig_1.MONITOR_ORGS.find(o => o.name === row.name);
            if (!orgConfig)
                continue;
            await scanOrg(row.id, orgConfig);
            await new Promise(r => setTimeout(r, 3000));
        }
        // RECOMMENDATION 6: Clean up jobs not seen in 30 days
        const cleaned = await client_1.pool.query(`UPDATE monitor_jobs
       SET is_active = false
       WHERE last_seen_at < NOW() - INTERVAL '30 days'
       AND is_active = true
       RETURNING id`);
        if (cleaned.rows.length > 0) {
            console.log(`[Monitor] Expired ${cleaned.rows.length} old job listings`);
        }
        console.log('[Monitor] Full scan complete');
    }
    catch (err) {
        console.error('[Monitor] Scan error:', err.message);
    }
    finally {
        if (client) {
            if (lockAcquired) {
                try {
                    await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
                }
                catch (e) {
                    console.error('[Monitor] Failed to release advisory lock:', e);
                }
            }
            client.release();
        }
    }
}
async function seedOrgs() {
    const count = await client_1.pool.query('SELECT COUNT(*) FROM monitor_orgs');
    if (parseInt(count.rows[0].count) >= orgConfig_1.MONITOR_ORGS.length) {
        console.log(`[Monitor] ${count.rows[0].count} orgs already seeded`);
        return;
    }
    console.log('[Monitor] Seeding organizations...');
    for (const org of orgConfig_1.MONITOR_ORGS) {
        await client_1.pool.query(`INSERT INTO monitor_orgs
         (name, sector, country, careers_url, rss_url, api_type)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (name) DO NOTHING`, [org.name, org.sector, org.country,
            org.careersUrl || null, org.rssUrl || null, org.apiType]);
    }
    console.log(`[Monitor] Seeded ${orgConfig_1.MONITOR_ORGS.length} organizations`);
}
