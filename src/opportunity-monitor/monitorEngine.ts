import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/client'
import { MONITOR_ORGS, MonitorOrg } from './orgConfig'
import crypto from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Pooja-Core Profile ────────────────────────────────────────────────────
// Rank 1 job title keywords — positions Pooja is actually targeting
const POOJA_RANK1_KEYWORDS = [
  'assistant professor', 'scientist', 'investigator', 'research scientist',
  'group leader', 'tenure track', 'tenure-track', 'faculty', 'staff scientist',
  'senior scientist', 'principal scientist', 'research fellow'
]

// Technical domain anchors — Pooja's core expertise areas
const TECHNICAL_ANCHORS = [
  'molecular', 'genetics', 'cardiovascular', 'genomics', 'bioinformatics',
  'cell biology', 'molecular biology', 'cardiac', 'transcriptomics',
  'proteomics', 'crispr', 'rna', 'heart'
]

// Hard filter: discard these title terms UNLESS the title is 'Assistant Professor'
const HARD_FILTER_TERMS = [
  'technician', 'postdoc', 'postdoctoral', 'intern', 'internship',
  'junior', 'admin', 'administrative', 'coordinator', 'assistant'
]

// Tier 1 orgs for +1 suitability bonus
const TIER1_ORG_NAMES = new Set([
  'Harvard Medical School', 'Stanford Medicine', 'MIT Biology', 'UCSF',
  'Broad Institute', 'Johns Hopkins Medicine', 'Mayo Clinic Research',
  'Salk Institute', 'Columbia University Medical Center', 'Yale School of Medicine',
  'Gladstone Institutes', 'Scripps Research', 'UT Southwestern Medical Center',
  'Baylor College of Medicine', 'Washington University St Louis', 'Weill Cornell Medicine',
  'NIH NHLBI', 'NIH NIGMS', 'NIH NCI',
  'Karolinska Institute', 'ETH Zurich', 'EMBL Jobs', 'Francis Crick Institute',
  'Wellcome Sanger Institute', 'Max Planck Heart and Lung', 'Roche',
  'Genentech', 'Regeneron', 'Amgen', 'Pfizer Research', 'Merck Research',
  'NCBS Bangalore', 'IISc Bangalore', 'TIFR Mumbai'
])

// Pooja-relevant job title and domain keywords (used for legacy relevance scoring)
const RELEVANT_KEYWORDS = [
  'research scientist', 'research associate',
  'senior scientist', 'staff scientist', 'principal scientist',
  'cardiovascular', 'molecular biology', 'cell biology', 'genomics',
  'sequencing', 'crispr', 'rna', 'cardiac', 'heart failure',
  'cardiomyopathy', 'transcriptomics', 'proteomics', 'bioinformatics',
  'research fellow', 'scientist i', 'scientist ii', 'scientist iii',
  'associate scientist', 'assistant professor', 'group leader',
  'investigator', 'faculty', 'tenure track'
]

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
]

// RECOMMENDATION 8: Relevance scoring instead of binary match
function relevanceScore(title: string, description: string = ''): number {
  const text = (title + ' ' + description).toLowerCase()
  let score = 0
  for (const kw of RELEVANT_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) score++
  }
  return score
}

function isRelevant(title: string, description: string = ''): boolean {
  return relevanceScore(title, description) >= 1
}

// RECOMMENDATION 1: Fixed location filter — require explicit location match
function isRelevantLocation(location: string = ''): boolean {
  if (!location || location.trim() === '') return false
  const loc = location.toLowerCase()
  return RELEVANT_LOCATIONS.some(l => loc.includes(l))
}

// Hard filter: returns false for roles Pooja should not see
// Exception: "assistant professor" is always allowed despite containing 'assistant'
function passesHardFilter(title: string): boolean {
  const t = title.toLowerCase()
  if (t.includes('assistant professor')) return true
  return !HARD_FILTER_TERMS.some(term => t.includes(term))
}

// Pooja suitability scorer (0–5 scale). Jobs must score ≥ 3 to be stored.
function poojaSuitabilityScore(title: string, snippet: string, orgName: string): number {
  const text = (title + ' ' + snippet).toLowerCase()
  let score = 0
  if (POOJA_RANK1_KEYWORDS.some(kw => text.includes(kw))) score += 2
  if (TECHNICAL_ANCHORS.some(anchor => text.includes(anchor))) score += 2
  if (TIER1_ORG_NAMES.has(orgName)) score += 1
  return score
}

// Filter out generic social/landing-page URLs that don't point to actual job postings
function extractCanonicalUrl(url: string, fallback: string): string {
  if (!url) return fallback
  const GENERIC_DOMAINS = [
    'linkedin.com/company', 'linkedin.com/in/', 'linkedin.com/jobs',
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
    'youtube.com', 'glassdoor.com/Overview'
  ]
  if (GENERIC_DOMAINS.some(d => url.includes(d))) return fallback
  return url
}

function hashContent(title: string, org: string, location: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${org}|${location}`)
    .digest('hex')
    .slice(0, 64)
}

// RECOMMENDATION 3: Timeout wrapper for all external calls
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
  )
  return Promise.race([promise, timeout])
}

interface ScannedJob {
  externalId: string
  title: string
  orgName: string
  location: string
  country: string
  applyUrl: string
  snippet: string
  postedDate?: string
  contentHash: string
  relevanceScore: number
  highSuitability: boolean
}

// RECOMMENDATION 4: websearch is last resort — RSS and USAJobs preferred
async function scanViaWebSearch(org: MonitorOrg): Promise<ScannedJob[]> {
  try {
    const response = await withTimeout(
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
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
      }),
      15000,
      `webSearch for ${org.name}`
    )

    let raw = ''
    for (const block of response.content) {
      if (block.type === 'text') raw += block.text
    }

    raw = raw.replace(/```json|```/g, '').trim()
    const start = raw.indexOf('[')
    const end = raw.lastIndexOf(']')
    if (start === -1 || end === -1) return []

    const parsed = JSON.parse(raw.slice(start, end + 1))

    return parsed
      .filter((j: any) => j.title && isRelevant(j.title, j.snippet))
      .filter((j: any) => j.location && isRelevantLocation(j.location))
      .filter((j: any) => passesHardFilter(j.title))
      .filter((j: any) => poojaSuitabilityScore(j.title, j.snippet || '', org.name) >= 3)
      .map((j: any) => ({
        externalId: hashContent(j.title, org.name, j.location || ''),
        title: j.title,
        orgName: org.name,
        location: j.location,
        country: org.country,
        applyUrl: extractCanonicalUrl(j.applyUrl || '', org.careersUrl || ''),
        snippet: j.snippet || '',
        postedDate: j.postedDate || 'Recent',
        contentHash: hashContent(j.title, org.name, j.location || ''),
        relevanceScore: relevanceScore(j.title, j.snippet),
        highSuitability: true
      }))
      .sort((a: ScannedJob, b: ScannedJob) => b.relevanceScore - a.relevanceScore)

  } catch (err) {
    console.error(`[Monitor] webSearch failed for ${org.name}:`, (err as Error).message)
    return []
  }
}

async function scanViaUSAJobs(org: MonitorOrg): Promise<ScannedJob[]> {
  try {
    const query = encodeURIComponent(org.searchQuery)
    const url = `https://data.usajobs.gov/api/search?Keyword=${query}&ResultsPerPage=10`

    const resp = await withTimeout(
      fetch(url, {
        headers: {
          'User-Agent': 'career-os-portal@railway.app',
          'Authorization-Key': process.env.USAJOBS_API_KEY || ''
        }
      }),
      10000,
      `USAJobs for ${org.name}`
    )

    if (!resp.ok) {
      console.warn(`[Monitor] USAJobs returned ${resp.status} for ${org.name}, falling back to webSearch`)
      return scanViaWebSearch(org)
    }

    const data = await resp.json()
    const items = data?.SearchResult?.SearchResultItems || []

    return items
      .filter((item: any) => {
        const title = item.MatchedObjectDescriptor?.PositionTitle || ''
        return isRelevant(title) && passesHardFilter(title)
      })
      .filter((item: any) => {
        const d = item.MatchedObjectDescriptor
        const title = d.PositionTitle || ''
        const snippet = (d.UserArea?.Details?.JobSummary || '').slice(0, 150)
        return poojaSuitabilityScore(title, snippet, org.name) >= 3
      })
      .map((item: any) => {
        const d = item.MatchedObjectDescriptor
        const title = d.PositionTitle || ''
        const location = d.PositionLocation?.[0]?.LocationName || 'Washington DC, USA'
        const snippet = (d.UserArea?.Details?.JobSummary || '').slice(0, 150)
        return {
          externalId: d.PositionID || hashContent(title, org.name, location),
          title,
          orgName: d.OrganizationName || org.name,
          location,
          country: 'USA',
          applyUrl: d.ApplyURI?.[0] || '',
          snippet,
          postedDate: d.PublicationStartDate?.split('T')[0] || 'Recent',
          contentHash: hashContent(title, org.name, location),
          relevanceScore: relevanceScore(title),
          highSuitability: true
        }
      })
  } catch (err) {
    console.error(`[Monitor] USAJobs failed for ${org.name}:`, (err as Error).message)
    return scanViaWebSearch(org)
  }
}

async function scanViaRSS(org: MonitorOrg): Promise<ScannedJob[]> {
  if (!org.rssUrl) return scanViaWebSearch(org)
  try {
    const resp = await withTimeout(
      fetch(org.rssUrl, {
        headers: { 'User-Agent': 'career-os-portal@railway.app' }
      }),
      8000,
      `RSS for ${org.name}`
    )

    const text = await resp.text()
    const items: ScannedJob[] = []
    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || []

    for (const item of itemMatches.slice(0, 15)) {
      const title = (
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      ).trim()

      const link = (
        item.match(/<link>(.*?)<\/link>/)?.[1] || ''
      ).trim()

      const desc = (
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>(.*?)<\/description>/)?.[1] || ''
      ).replace(/<[^>]+>/g, '').slice(0, 150).trim()

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 'Recent'

      if (!isRelevant(title, desc)) continue
      if (!passesHardFilter(title)) continue

      const location = org.country

      if (!isRelevantLocation(location)) continue

      const suitability = poojaSuitabilityScore(title, desc, org.name)
      if (suitability < 3) continue

      items.push({
        externalId: hashContent(title, org.name, location),
        title,
        orgName: org.name,
        location,
        country: org.country,
        applyUrl: extractCanonicalUrl(link, org.careersUrl || ''),
        snippet: desc,
        postedDate: pubDate,
        contentHash: hashContent(title, org.name, location),
        relevanceScore: relevanceScore(title, desc),
        highSuitability: suitability >= 3
      })
    }

    if (items.length === 0) {
      console.log(`[Monitor] RSS empty for ${org.name}, falling back to webSearch`)
      return scanViaWebSearch(org)
    }

    return items.sort((a, b) => b.relevanceScore - a.relevanceScore)

  } catch (err) {
    console.error(`[Monitor] RSS failed for ${org.name}:`, (err as Error).message)
    return scanViaWebSearch(org)
  }
}

export async function scanOrg(orgId: string, org: MonitorOrg): Promise<{
  found: number, newJobs: number, error?: string
}> {
  let jobs: ScannedJob[] = []

  try {
    switch (org.apiType) {
      case 'rss':      jobs = await scanViaRSS(org);      break
      case 'usajobs':  jobs = await scanViaUSAJobs(org);  break
      default:         jobs = await scanViaWebSearch(org)
    }
  } catch (err) {
    const msg = (err as Error).message
    try {
      await pool.query(
        `INSERT INTO monitor_scans (org_id, jobs_found, new_jobs, status, error_message)
         VALUES ($1, 0, 0, 'error', $2)`,
        [orgId, msg]
      )
    } catch (dbErr) {
      console.error('[Monitor] Failed to log scan error:', (dbErr as Error).message)
    }
    return { found: 0, newJobs: 0, error: msg }
  }

  let newCount = 0

  for (const job of jobs) {
    try {
      const result = await pool.query(
        `INSERT INTO monitor_jobs
           (org_id, external_id, title, org_name, location, country,
            sector, apply_url, snippet, posted_date, content_hash,
            high_suitability, is_new, is_active, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,true,NOW())
         ON CONFLICT (org_id, external_id) DO UPDATE
           SET is_active = true,
               last_seen_at = NOW(),
               high_suitability = $12,
               is_new = CASE
                 WHEN monitor_jobs.content_hash != $11 THEN true
                 ELSE monitor_jobs.is_new
               END,
               content_hash = $11
         RETURNING (xmax = 0) as inserted`,
        [orgId, job.externalId, job.title, job.orgName,
         job.location, job.country, org.sector,
         job.applyUrl, job.snippet, job.postedDate, job.contentHash,
         job.highSuitability]
      )
      if (result.rows[0]?.inserted) newCount++
    } catch (err) {
      console.error(`[Monitor] Failed to save job "${job.title}":`, (err as Error).message)
    }
  }

  try {
    await pool.query(
      'UPDATE monitor_orgs SET last_scanned_at = NOW() WHERE id = $1',
      [orgId]
    )
    await pool.query(
      `INSERT INTO monitor_scans (org_id, jobs_found, new_jobs, status)
       VALUES ($1, $2, $3, 'success')`,
      [orgId, jobs.length, newCount]
    )
  } catch (err) {
    console.error('[Monitor] Failed to update scan record:', (err as Error).message)
  }

  console.log(`[Monitor] ${org.name}: ${jobs.length} found, ${newCount} new`)
  return { found: jobs.length, newJobs: newCount }
}

// RECOMMENDATION 2: PostgreSQL advisory lock to prevent duplicate cron runs
export async function runFullScan(): Promise<void> {
  const lockId = 987654321

  let lockAcquired = false
  let client

  try {
    client = await pool.connect()

    const lockResult = await client.query(
      'SELECT pg_try_advisory_lock($1) as acquired',
      [lockId]
    )
    lockAcquired = lockResult.rows[0]?.acquired === true

    if (!lockAcquired) {
      console.log('[Monitor] Another instance is already scanning, skipping...')
      client.release()
      return
    }

    console.log('[Monitor] Advisory lock acquired, starting full scan...')

    // Cost optimisation: scan only 10 orgs per run (oldest-first).
    // All 82 orgs rotate over 8-9 days.
    const orgs = await pool.query(
      `SELECT id, name FROM monitor_orgs
       WHERE is_active = true
       ORDER BY last_scanned_at ASC NULLS FIRST
       LIMIT 10`
    )

    for (const row of orgs.rows) {
      const orgConfig = MONITOR_ORGS.find(o => o.name === row.name)
      if (!orgConfig) continue
      await scanOrg(row.id, orgConfig)
      // slowFetch orgs get extra delay to respect their rate limits
      const delay = orgConfig.slowFetch ? 8000 : 3000
      await new Promise(r => setTimeout(r, delay))
    }

    // RECOMMENDATION 6: Clean up jobs not seen in 30 days
    const cleaned = await pool.query(
      `UPDATE monitor_jobs
       SET is_active = false
       WHERE last_seen_at < NOW() - INTERVAL '30 days'
       AND is_active = true
       RETURNING id`
    )
    if (cleaned.rows.length > 0) {
      console.log(`[Monitor] Expired ${cleaned.rows.length} old job listings`)
    }

    console.log('[Monitor] Full scan complete')

  } catch (err) {
    console.error('[Monitor] Scan error:', (err as Error).message)
  } finally {
    if (client) {
      if (lockAcquired) {
        try {
          await client.query('SELECT pg_advisory_unlock($1)', [lockId])
        } catch (e) {
          console.error('[Monitor] Failed to release advisory lock:', e)
        }
      }
      client.release()
    }
  }
}

export async function seedOrgs(): Promise<void> {
  const count = await pool.query('SELECT COUNT(*) FROM monitor_orgs')
  if (parseInt(count.rows[0].count) >= MONITOR_ORGS.length) {
    console.log(`[Monitor] ${count.rows[0].count} orgs already seeded`)
    return
  }

  console.log('[Monitor] Seeding organizations...')
  for (const org of MONITOR_ORGS) {
    await pool.query(
      `INSERT INTO monitor_orgs
         (name, sector, country, careers_url, rss_url, api_type)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (name) DO NOTHING`,
      [org.name, org.sector, org.country,
       org.careersUrl || null, org.rssUrl || null, org.apiType]
    )
  }
  console.log(`[Monitor] Seeded ${MONITOR_ORGS.length} organizations`)
}
