import { pool } from '../db/client'
import { MONITOR_ORGS, MonitorOrg } from './orgConfig'
import crypto from 'crypto'

// Pooja-relevant job title and domain keywords
const RELEVANT_KEYWORDS = [
  'postdoc', 'postdoctoral', 'research scientist', 'research associate',
  'senior scientist', 'staff scientist', 'principal scientist',
  'cardiovascular', 'molecular biology', 'cell biology', 'genomics',
  'sequencing', 'crispr', 'rna', 'cardiac', 'heart failure',
  'cardiomyopathy', 'transcriptomics', 'proteomics', 'bioinformatics',
  'research fellow', 'scientist i', 'scientist ii', 'scientist iii',
  'associate scientist', 'junior scientist', 'postdoctoral associate',
  'postdoctoral fellow', 'research officer',
  // Industry titles: "Scientist, Oncology" / "Scientist II" without prefix
  'scientist',
  // Additional patterns common at pharma/biotech and Indian institutes
  'junior research fellow', 'senior research fellow', 'project associate',
  'project scientist', 'research assistant', 'lab technician',
  'computational biologist', 'bioinformatician'
]

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
  // Europe (broad)
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
]

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

// US state abbreviations — catches "Thousand Oaks, CA", "Tarrytown, NY", etc.
const US_STATE_ABBREV_RE = /,\s*(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy|dc)\b/i

function isRelevantLocation(location: string = ''): boolean {
  if (!location || location.trim() === '') return false
  const loc = location.toLowerCase()
  if (RELEVANT_LOCATIONS.some(l => loc.includes(l))) return true
  if (US_STATE_ABBREV_RE.test(location)) return true
  return false
}

function hashContent(title: string, org: string, location: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${org}|${location}`)
    .digest('hex')
    .slice(0, 64)
}

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
}

// ── Serper.dev web search (free tier: 2,500 queries/month) ──────────────────
async function scanViaWebSearch(org: MonitorOrg): Promise<ScannedJob[]> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) {
    console.warn(`[Monitor] SERPER_API_KEY not set — skipping ${org.name}`)
    return []
  }

  try {
    const response = await withTimeout(
      fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: org.searchQuery, num: 10 })
      }),
      10000,
      `Serper search for ${org.name}`
    )

    if (!response.ok) {
      console.error(`[Monitor] Serper returned ${response.status} for ${org.name}`)
      return []
    }

    const data = await response.json()
    const results = data.organic || []
    console.log(`[Monitor] ${org.name}: Serper returned ${results.length} results`)

    const jobs: ScannedJob[] = []
    for (const result of results) {
      const title   = (result.title   || '').replace(/\s*[-|].*$/, '').trim() // strip " - Company Name"
      const snippet = result.snippet  || ''
      const link    = result.link     || ''

      if (!title || !link) continue
      if (!isRelevant(title, snippet)) continue

      // Location: scan snippet for known city names, fallback to org.country
      let location = org.country
      const locMatch = snippet.match(
        /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|boston|cambridge|san francisco|south san francisco|la jolla|san diego|palo alto|stanford|seattle|new york|bethesda|london|oxford|heidelberg|munich|berlin|zurich|stockholm|singapore|toronto|montreal|melbourne|sydney)\b/i
      )
      if (locMatch) location = locMatch[0]

      jobs.push({
        externalId:    hashContent(title, org.name, link),
        title,
        orgName:       org.name,
        location,
        country:       org.country,
        applyUrl:      link,
        snippet:       snippet.slice(0, 150),
        postedDate:    'Recent',
        contentHash:   hashContent(title, org.name, link),
        relevanceScore: relevanceScore(title, snippet)
      })
    }

    console.log(`[Monitor] ${org.name}: ${jobs.length} relevant after filter`)
    return jobs.sort((a, b) => b.relevanceScore - a.relevanceScore)

  } catch (err) {
    console.error(`[Monitor] Serper failed for ${org.name}:`, (err as Error).message)
    return []
  }
}

// ── USAJobs (free, requires USAJOBS_API_KEY) ────────────────────────────────
async function scanViaUSAJobs(org: MonitorOrg): Promise<ScannedJob[]> {
  if (!process.env.USAJOBS_API_KEY) {
    console.warn(`[Monitor] USAJOBS_API_KEY not set — skipping ${org.name}`)
    return []
  }

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
      console.warn(`[Monitor] USAJobs returned ${resp.status} for ${org.name}`)
      return []
    }

    const data = await resp.json()
    const items = data?.SearchResult?.SearchResultItems || []

    return items
      .filter((item: any) => {
        const title = item.MatchedObjectDescriptor?.PositionTitle || ''
        return isRelevant(title)
      })
      .map((item: any) => {
        const d        = item.MatchedObjectDescriptor
        const title    = d.PositionTitle || ''
        const location = d.PositionLocation?.[0]?.LocationName || 'Washington DC, USA'
        return {
          externalId:    d.PositionID || hashContent(title, org.name, location),
          title,
          orgName:       d.OrganizationName || org.name,
          location,
          country:       'USA',
          applyUrl:      d.ApplyURI?.[0] || '',
          snippet:       (d.UserArea?.Details?.JobSummary || '').slice(0, 150),
          postedDate:    d.PublicationStartDate?.split('T')[0] || 'Recent',
          contentHash:   hashContent(title, org.name, location),
          relevanceScore: relevanceScore(title)
        }
      })
  } catch (err) {
    console.error(`[Monitor] USAJobs failed for ${org.name}:`, (err as Error).message)
    return []
  }
}

// ── RSS (free, no API key needed) ───────────────────────────────────────────
async function scanViaRSS(org: MonitorOrg): Promise<ScannedJob[]> {
  if (!org.rssUrl) {
    console.warn(`[RSS] ${org.name}: no rssUrl configured`)
    return []
  }

  try {
    const resp = await withTimeout(
      fetch(org.rssUrl, {
        headers: {
          'User-Agent': 'career-os-portal@railway.app',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        }
      }),
      8000,
      `RSS for ${org.name}`
    )

    console.log(`[RSS] ${org.name}: status=${resp.status}`)

    if (!resp.ok) {
      console.error(`[RSS] ${org.name}: HTTP ${resp.status} — skipping`)
      return []
    }

    const text = await resp.text()
    console.log(`[RSS] ${org.name}: body preview=${text.slice(0, 200).replace(/\n/g, ' ')}`)

    const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || []
    console.log(`[RSS] ${org.name}: raw items found=${itemMatches.length}`)

    const items: ScannedJob[] = []

    for (const item of itemMatches.slice(0, 20)) {
      const title = (
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
        item.match(/<title>(.*?)<\/title>/)?.[1] || ''
      ).trim()

      const link = (
        item.match(/<link><!\[CDATA\[(.*?)\]\]><\/link>/)?.[1] ||
        item.match(/<link>([^<]+)<\/link>/)?.[1] ||
        item.match(/<link[^>]+href=["']([^"']+)["']/)?.[1] ||
        item.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1] ||
        org.careersUrl || ''
      ).trim()

      const desc = (
        item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] ||
        item.match(/<description>([\s\S]*?)<\/description>/)?.[1] || ''
      ).replace(/<[^>]+>/g, '').slice(0, 150).trim()

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || 'Recent'

      // Title-only check first; description fallback is optional
      if (!title || !isRelevant(title, desc)) continue

      const location = org.country

      items.push({
        externalId:    hashContent(title, org.name, location),
        title,
        orgName:       org.name,
        location,
        country:       org.country,
        applyUrl:      link,
        snippet:       desc,
        postedDate:    pubDate,
        contentHash:   hashContent(title, org.name, location),
        relevanceScore: relevanceScore(title, desc)
      })
    }

    console.log(`[RSS] ${org.name}: ${items.length} relevant after filter`)
    return items.sort((a, b) => b.relevanceScore - a.relevanceScore)

  } catch (err) {
    console.error(`[RSS] ${org.name}: failed — ${(err as Error).message}`)
    return []
  }
}

export async function scanOrg(orgId: string, org: MonitorOrg): Promise<{
  found: number, newJobs: number, error?: string
}> {
  let jobs: ScannedJob[] = []
  // Record time before any upserts so we can expire jobs not seen in this scan
  const scanStart = new Date()

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
            is_new, is_active, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,true,NOW())
         ON CONFLICT (org_id, external_id) DO UPDATE
           SET is_active = true,
               last_seen_at = NOW(),
               apply_url = CASE
                 WHEN monitor_jobs.apply_url IS NULL OR monitor_jobs.apply_url = ''
                 THEN EXCLUDED.apply_url
                 ELSE monitor_jobs.apply_url
               END,
               is_new = CASE
                 WHEN monitor_jobs.content_hash != $11 THEN true
                 ELSE monitor_jobs.is_new
               END,
               content_hash = $11
         RETURNING (xmax = 0) as inserted`,
        [orgId, job.externalId, job.title, job.orgName,
         job.location, job.country, org.sector,
         job.applyUrl, job.snippet, job.postedDate, job.contentHash]
      )
      if (result.rows[0]?.inserted) newCount++
    } catch (err) {
      console.error(`[Monitor] Failed to save job "${job.title}":`, (err as Error).message)
    }
  }

  // RSS and USAJobs return the complete current feed — any of this org's jobs
  // that weren't refreshed (last_seen_at < scanStart) have been removed from
  // the source and should be marked inactive immediately.
  if ((org.apiType === 'rss' || org.apiType === 'usajobs') && jobs.length > 0) {
    try {
      const expired = await pool.query(
        `UPDATE monitor_jobs
         SET is_active = false
         WHERE org_id = $1
           AND is_active = true
           AND last_seen_at < $2
         RETURNING id`,
        [orgId, scanStart]
      )
      if (expired.rows.length > 0) {
        console.log(`[Monitor] ${org.name}: expired ${expired.rows.length} stale listing(s)`)
      }
    } catch (err) {
      console.error('[Monitor] Stale-job cleanup failed:', (err as Error).message)
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

// PostgreSQL advisory lock prevents duplicate concurrent cron runs
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

    // RSS/USAJobs orgs always run first (free, no external quota).
    // Serper websearch orgs rotate through the remaining slots.
    const orgs = await pool.query(
      `SELECT id, name, api_type FROM monitor_orgs
       WHERE is_active = true
       ORDER BY
         CASE WHEN api_type = 'websearch' THEN 1 ELSE 0 END ASC,
         last_scanned_at ASC NULLS FIRST
       LIMIT 30`
    )

    for (const row of orgs.rows) {
      const orgConfig = MONITOR_ORGS.find(o => o.name === row.name)
      if (!orgConfig) continue
      await scanOrg(row.id, orgConfig)
      await new Promise(r => setTimeout(r, 1000)) // 1s between calls is enough for Serper
    }

    // Global safety-net expiry: any job not seen in 14 days is considered gone.
    // RSS/USAJobs orgs get per-scan cleanup above; this catches Serper orgs.
    const cleaned = await pool.query(
      `UPDATE monitor_jobs
       SET is_active = false
       WHERE last_seen_at < NOW() - INTERVAL '14 days'
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
  console.log('[Monitor] Upserting organizations from config...')
  let added = 0
  for (const org of MONITOR_ORGS) {
    const result = await pool.query(
      `INSERT INTO monitor_orgs
         (name, sector, country, careers_url, rss_url, api_type)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (name) DO UPDATE
         SET sector = EXCLUDED.sector,
             country = EXCLUDED.country,
             careers_url = EXCLUDED.careers_url,
             rss_url = EXCLUDED.rss_url,
             api_type = EXCLUDED.api_type,
             is_active = true
       RETURNING (xmax = 0) as inserted`,
      [org.name, org.sector, org.country,
       org.careersUrl || null, org.rssUrl || null, org.apiType]
    )
    if (result.rows[0]?.inserted) added++
  }

  // Deactivate orgs removed from config so they don't fill scan slots
  const configNames = MONITOR_ORGS.map(o => o.name)
  const deactivated = await pool.query(
    `UPDATE monitor_orgs SET is_active = false
     WHERE name != ALL($1::text[]) AND is_active = true
     RETURNING name`,
    [configNames]
  )
  if (deactivated.rows.length > 0) {
    console.log(`[Monitor] Deactivated ${deactivated.rows.length} removed orgs: ${deactivated.rows.map((r: any) => r.name).join(', ')}`)
  }

  console.log(`[Monitor] Org sync complete: ${added} new, ${MONITOR_ORGS.length} active in config`)
}
