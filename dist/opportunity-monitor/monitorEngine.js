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
    // USA
    'usa', 'united states', 'new york', 'boston', 'san francisco',
    'seattle', 'chicago', 'houston', 'los angeles', 'bethesda',
    'cambridge, ma', 'cambridge ma', 'la jolla', 'san diego',
    'atlanta', 'philadelphia', 'dallas', 'durham', 'baltimore',
    'pittsburgh', 'denver', 'minneapolis', 'st. louis', 'saint louis',
    'nashville', 'raleigh', 'research triangle', 'ann arbor',
    'new haven', 'stanford', 'palo alto', 'south san francisco',
    // UK
    'uk', 'united kingdom', 'london', 'edinburgh', 'oxford',
    'cambridge, uk', 'cambridge uk', 'manchester', 'glasgow', 'birmingham',
    // Europe (broad — covers EuroScienceJobs and any pan-European listings)
    'europe', 'european',
    // Germany
    'germany', 'berlin', 'heidelberg', 'munich', 'frankfurt', 'hamburg',
    'cologne', 'bonn', 'freiburg', 'göttingen', 'bad nauheim', 'dortmund',
    // Sweden
    'sweden', 'stockholm', 'gothenburg', 'solna', 'umeå',
    // Switzerland
    'switzerland', 'zurich', 'basel', 'geneva', 'lausanne', 'bern',
    // Netherlands
    'netherlands', 'amsterdam', 'leiden', 'utrecht', 'rotterdam', 'groningen',
    // France
    'france', 'paris', 'lyon', 'marseille', 'strasbourg', 'grenoble',
    // Belgium
    'belgium', 'brussels', 'ghent', 'leuven', 'liège',
    // Austria
    'austria', 'vienna', 'graz', 'innsbruck',
    // Denmark
    'denmark', 'copenhagen',
    // Norway
    'norway', 'oslo', 'bergen',
    // Finland
    'finland', 'helsinki',
    // Italy
    'italy', 'milan', 'rome', 'florence', 'bologna', 'trieste', 'padua',
    // Spain
    'spain', 'barcelona', 'madrid', 'valencia', 'bilbao',
    // Portugal
    'portugal', 'lisbon', 'porto',
    // Other international hubs
    'israel', 'tel aviv', 'rehovot', 'jerusalem',
    'japan', 'tokyo', 'osaka', 'kyoto', 'yokohama',
    // Canada
    'canada', 'toronto', 'montreal', 'vancouver', 'ottawa', 'calgary',
    // Singapore
    'singapore',
    // Australia
    'australia', 'melbourne', 'sydney', 'brisbane', 'perth', 'adelaide',
    // India — all major research cities
    'india', 'bangalore', 'bengaluru', 'mumbai', 'delhi', 'new delhi',
    'hyderabad', 'pune', 'faridabad', 'trivandrum', 'thiruvananthapuram',
    'kolkata', 'chennai', 'mysore', 'mysuru', 'chandigarh', 'jaipur',
    'ahmedabad', 'bhopal', 'lucknow', 'nagpur'
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
// US state abbreviations pattern — catches "Thousand Oaks, CA", "Tarrytown, NY", etc.
const US_STATE_ABBREV_RE = /,\s*(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)\b/i;
// RECOMMENDATION 1: Fixed location filter — require explicit location match
function isRelevantLocation(location = '') {
    if (!location || location.trim() === '')
        return false;
    const loc = location.toLowerCase();
    // Direct match against known cities/countries
    if (RELEVANT_LOCATIONS.some(l => loc.includes(l)))
        return true;
    // Catch any US city with a state abbreviation e.g. "Thousand Oaks, CA" or "Rahway, NJ"
    if (US_STATE_ABBREV_RE.test(location))
        return true;
    return false;
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
            model: 'claude-haiku-4-5',
            max_tokens: 2000,
            system: [{
                    type: 'text',
                    text: 'You are a job search assistant. When asked to find jobs, always use the web_search tool to search the web first, then return results as a JSON array. Never fabricate job listings — only return jobs found via web search.',
                    cache_control: { type: 'ephemeral' }
                }],
            tools: [{ type: 'web_search_20250305', name: 'web_search' }],
            tool_choice: { type: 'any' },
            messages: [{
                    role: 'user',
                    content: `Use web_search to find current open job positions at ${org.name}.
Query: "${org.searchQuery}"

Search the web NOW and find ONLY real, currently open positions posted in 2025 or 2026.
Include ONLY positions in these locations: USA, UK, Germany, Sweden,
Switzerland, Canada, Singapore, Australia, or India.

After searching, return ONLY a JSON array, no markdown, no explanation:
[{
  "title": "exact job title",
  "location": "city, country (must be specific — not just 'remote')",
  "applyUrl": "direct URL to job posting",
  "snippet": "job description under 150 characters",
  "postedDate": "date posted or Recent"
}]
If no relevant open positions found, return: []`
                }]
        }), 45000, `webSearch for ${org.name}`);
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
        const afterTitleFilter = parsed.filter((j) => j.title && isRelevant(j.title, j.snippet));
        // Task 2: location normalizer — if AI returned a vague/empty location but
        // we already know which country this org is in, substitute org.country so
        // the location filter passes instead of silently dropping real results.
        const VAGUE_LOCATIONS = ['remote', 'hybrid', 'multiple locations', 'worldwide', 'global', 'anywhere', ''];
        const normalizedFilter = afterTitleFilter.map((j) => {
            const loc = (j.location || '').toLowerCase().trim();
            if (VAGUE_LOCATIONS.includes(loc)) {
                const original = j.location || '';
                console.log(`[Monitor] ${org.name}: location fallback "${original}" → "${org.country}"`);
                return { ...j, location: org.country };
            }
            return j;
        });
        const afterLocationFilter = normalizedFilter.filter((j) => j.location && isRelevantLocation(j.location));
        console.log(`[Monitor] ${org.name}: raw=${parsed.length}, after-title-filter=${afterTitleFilter.length}, after-location-filter=${afterLocationFilter.length}`);
        if (afterTitleFilter.length > afterLocationFilter.length) {
            const dropped = normalizedFilter.filter((j) => !j.location || !isRelevantLocation(j.location));
            console.log(`[Monitor] ${org.name}: dropped locations: ${dropped.map((j) => `"${j.location}"`).join(', ')}`);
        }
        return afterLocationFilter
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
    if (!process.env.USAJOBS_API_KEY) {
        console.warn('[Monitor] USAJOBS_API_KEY not set — USAJobs orgs will fall back to websearch');
    }
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
        // Cost optimisation: RSS and USAJobs orgs run first (they're free and fast ~100ms).
        // Websearch orgs fill remaining slots ordered by oldest-scanned-first.
        // Limit raised to 20 because free-source orgs don't add AI cost and are ~100ms each.
        const orgs = await client_1.pool.query(`SELECT id, name, api_type FROM monitor_orgs
       WHERE is_active = true
       ORDER BY
         CASE WHEN api_type = 'websearch' THEN 1 ELSE 0 END ASC,
         last_scanned_at ASC NULLS FIRST
       LIMIT 20`);
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
    // Always upsert all orgs from config so new entries (e.g. new RSS feeds) are
    // picked up on deploy without needing to truncate the table.
    console.log('[Monitor] Upserting organizations from config...');
    let added = 0;
    for (const org of orgConfig_1.MONITOR_ORGS) {
        const result = await client_1.pool.query(`INSERT INTO monitor_orgs
         (name, sector, country, careers_url, rss_url, api_type)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (name) DO UPDATE
         SET sector = EXCLUDED.sector,
             country = EXCLUDED.country,
             careers_url = EXCLUDED.careers_url,
             rss_url = EXCLUDED.rss_url,
             api_type = EXCLUDED.api_type
       RETURNING (xmax = 0) as inserted`, [org.name, org.sector, org.country,
            org.careersUrl || null, org.rssUrl || null, org.apiType]);
        if (result.rows[0]?.inserted)
            added++;
    }
    console.log(`[Monitor] Org sync complete: ${added} new, ${orgConfig_1.MONITOR_ORGS.length} total in config`);
}
