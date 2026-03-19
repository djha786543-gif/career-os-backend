/**
 * monitorEngineDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ (Deobrat Jha) Opportunity Monitor — scoring engine.
 * COMPLETELY ISOLATED from monitorEngine.ts (Pooja).
 * Profile: IT Audit Manager | CISA | AWS Certified Cloud Practitioner
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/client'
import { DJ_ORGS, MonitorOrgDJ, djSectorToDbSector } from './orgConfigDJ'
import crypto from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── DJ Profile DNA ───────────────────────────────────────────────────────────
// +2 suitability: DJ's specialized high-signal keywords
const DJ_SPECIALIZED_KEYWORDS = [
  'aws cloud audit', 'cloud audit', 'ai governance', 'ai/ml governance',
  'ml governance', 'sox 404', 'sox testing', 'itgc', 'itac',
  'sap s/4hana', 's4hana', 'sap grc', 'pcaob', 'icfr',
  'erp audit', 'soc 1', 'soc 2', 'soc1', 'soc2', 'nist csf',
  'cloud security', 'cloud risk'
]

// +2 suitability: Managerial title terms (required for India, preferred for US)
const DJ_MANAGER_TITLES = [
  'manager', 'director', 'avp', 'associate vice president', 'vp', 'vice president',
  'head of', 'head of it audit', 'lead', 'principal'
]

// General domain relevance — must match at least 1 to not be filtered
const DJ_DOMAIN_KEYWORDS = [
  'it audit', 'information technology audit', 'internal audit', 'it risk',
  'it governance', 'grc', 'sox', 'cisa', 'cloud security', 'cyber audit',
  'technology risk', 'tech risk', 'cyber risk', 'it compliance',
  'information security audit', 'itgc', 'itac', 'erp audit', 'sap audit',
  'data governance', 'iam', 'identity access management'
]

// Hard reject — all profiles
const DJ_HARD_FILTER_GLOBAL = [
  'intern', 'internship', 'entry level', 'entry-level',
  'staff auditor', 'junior', 'jr.', 'jr ', 'fresher', 'trainee'
]

// Hard reject — India only (strict seniority constraint)
const DJ_HARD_FILTER_INDIA = [
  'senior associate', 'associate ', '- associate', 'associate auditor'
]

// Tier 1 orgs — +1 bonus
const DJ_TIER1_ORGS = new Set([
  'EY Americas IT Audit', 'Deloitte US IT Audit', 'KPMG US IT Audit', 'PwC US IT Audit',
  'EY India GCC IT Audit', 'Deloitte India GCC IT Audit', 'KPMG India GCC IT Audit', 'PwC India GCC IT Audit',
  'JPMorgan Chase IT Audit', 'Goldman Sachs IT Audit', 'Bank of America IT Audit',
  'Goldman Sachs India GCC', 'JPMorgan India GCC', 'Morgan Stanley India GCC',
  'AWS Cloud Audit', 'Google Cloud IT Audit', 'Microsoft IT Audit',
  'Public Storage IT Audit', 'Western Digital IT Audit', 'Investar Bank IT Audit',
  'HDFC Bank IT Audit', 'ICICI Bank IT Audit'
])

// EAD-friendly indicators in snippet/description (US roles)
const EAD_SIGNALS = [
  'contract', 'consultant', 'w2', 'ead', 'immediate start',
  'sox testing cycle', '1099', 'project-based', 'temporary', 'contract-to-hire'
]

// ─── Utility functions ────────────────────────────────────────────────────────

function hashContent(title: string, org: string, location: string): string {
  return crypto
    .createHash('sha256')
    .update(`dj|${title}|${org}|${location}`)
    .digest('hex')
    .slice(0, 64)
}

function isDomainRelevant(title: string, snippet: string): boolean {
  const text = (title + ' ' + snippet).toLowerCase()
  return DJ_DOMAIN_KEYWORDS.some(kw => text.includes(kw))
}

function passesHardFilter(title: string, isIndia: boolean): boolean {
  const t = title.toLowerCase()
  // Global hard rejects
  if (DJ_HARD_FILTER_GLOBAL.some(term => t.includes(term))) return false
  // India-specific hard rejects
  if (isIndia && DJ_HARD_FILTER_INDIA.some(term => t.includes(term))) return false
  return true
}

// DJ Suitability Scorer (0–5 scale). Threshold: >= 4
function djSuitabilityScore(title: string, snippet: string, orgName: string): number {
  const text = (title + ' ' + snippet).toLowerCase()
  let score = 0

  // +2 for specialized domain knowledge keywords
  if (DJ_SPECIALIZED_KEYWORDS.some(kw => text.includes(kw))) score += 2

  // +2 for managerial title (DJ's career level)
  if (DJ_MANAGER_TITLES.some(kw => text.includes(kw))) score += 2

  // +1 for Tier 1 org
  if (DJ_TIER1_ORGS.has(orgName)) score += 1

  return score
}

function djSuitabilityThreshold(djSector: string): number {
  // India roles: strict Manager/Director — threshold stays 4
  // US roles: slightly more flexible for contract/consultant roles
  return djSector.startsWith('india-') ? 4 : 3
}

function isEadFriendly(snippet: string): boolean {
  const s = snippet.toLowerCase()
  return EAD_SIGNALS.some(sig => s.includes(sig))
}

function isManagerialGrade(title: string): boolean {
  const t = title.toLowerCase()
  return DJ_MANAGER_TITLES.some(kw => t.includes(kw))
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout ${ms}ms: ${label}`)), ms)
  )
  return Promise.race([promise, timeout])
}

function extractCanonicalUrl(url: string, fallback: string): string {
  if (!url) return fallback
  const GENERIC = ['linkedin.com/company', 'linkedin.com/in/', 'twitter.com', 'x.com', 'facebook.com']
  if (GENERIC.some(d => url.includes(d))) return fallback
  return url
}

// ─── Scan via AI Web Search ───────────────────────────────────────────────────

interface DJScannedJob {
  externalId: string
  title: string
  orgName: string
  location: string
  country: string
  applyUrl: string
  snippet: string
  postedDate: string
  contentHash: string
  suitabilityScore: number
  isEadFriendly: boolean
  isManagerialGrade: boolean
}

async function scanDJViaWebSearch(org: MonitorOrgDJ): Promise<DJScannedJob[]> {
  const isIndia = org.country === 'India'
  const locationFilter = isIndia
    ? 'India (Bengaluru, Mumbai, Pune, Hyderabad, Delhi, Chennai, Gurugram, Noida)'
    : 'United States of America'

  try {
    const response: any = await withTimeout(
      anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for CURRENT open IT Audit positions at ${org.name}.
Query: "${org.searchQuery}"

STRICT REQUIREMENTS:
- Posted in 2025 or 2026 ONLY
- Location: ${locationFilter}
- Seniority: Manager, Senior Manager, Director, AVP, VP, Head only
  (EXCLUDE: Staff Auditor, Entry Level, Junior, Intern, Associate)${isIndia ? '\n- India extra rule: EXCLUDE "Senior Associate" and "Associate" roles' : ''}
- Domain: IT Audit, IT Risk, SOX, ITGC, GRC, Cloud Security, SAP Audit

Return ONLY a JSON array — no markdown, no explanation:
[{
  "title": "exact job title",
  "location": "City, Country",
  "applyUrl": "direct URL to job posting",
  "snippet": "key responsibilities under 150 characters — include SOX/ITGC/cloud/GRC if mentioned",
  "postedDate": "YYYY-MM-DD or Recent"
}]
If no matching open positions found, return: []`
        }]
      }),
      18000,
      `DJ webSearch for ${org.name}`
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
      .filter((j: any) => j.title)
      .filter((j: any) => isDomainRelevant(j.title, j.snippet || ''))
      .filter((j: any) => passesHardFilter(j.title, isIndia))
      .filter((j: any) => {
        const score = djSuitabilityScore(j.title, j.snippet || '', org.name)
        return score >= djSuitabilityThreshold(org.djSector)
      })
      .map((j: any) => {
        const contentHash = hashContent(j.title, org.name, j.location || '')
        const score = djSuitabilityScore(j.title, j.snippet || '', org.name)
        return {
          externalId: contentHash,
          title: j.title,
          orgName: org.name,
          location: j.location || org.country,
          country: org.country,
          applyUrl: extractCanonicalUrl(j.applyUrl || '', org.careersUrl || ''),
          snippet: j.snippet || '',
          postedDate: j.postedDate || 'Recent',
          contentHash,
          suitabilityScore: score,
          isEadFriendly: isEadFriendly(j.snippet || ''),
          isManagerialGrade: isManagerialGrade(j.title)
        }
      })
      .sort((a: DJScannedJob, b: DJScannedJob) => b.suitabilityScore - a.suitabilityScore)

  } catch (err) {
    console.error(`[MonitorDJ] webSearch failed for ${org.name}:`, (err as Error).message)
    return []
  }
}

// ─── Scan a single DJ org ─────────────────────────────────────────────────────

export async function scanDJOrg(orgId: string, org: MonitorOrgDJ): Promise<{
  found: number; newJobs: number; error?: string
}> {
  let jobs: DJScannedJob[] = []

  try {
    jobs = await scanDJViaWebSearch(org)
  } catch (err) {
    const msg = (err as Error).message
    try {
      await pool.query(
        `INSERT INTO monitor_scans (org_id, jobs_found, new_jobs, status, error_message)
         VALUES ($1, 0, 0, 'error', $2)`,
        [orgId, msg]
      )
    } catch { /* non-fatal */ }
    return { found: 0, newJobs: 0, error: msg }
  }

  let newCount = 0
  const dbSector = djSectorToDbSector(org.djSector)

  for (const job of jobs) {
    try {
      const result = await pool.query(
        `INSERT INTO monitor_jobs
           (org_id, external_id, title, org_name, location, country,
            sector, sub_sector, apply_url, snippet, posted_date, content_hash,
            high_suitability, is_new, is_active, last_seen_at, profile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,true,NOW(),'dj')
         ON CONFLICT (org_id, external_id) DO UPDATE
           SET is_active     = true,
               last_seen_at  = NOW(),
               high_suitability = $13,
               is_new = CASE
                 WHEN monitor_jobs.content_hash != $12 THEN true
                 ELSE monitor_jobs.is_new
               END,
               content_hash  = $12
         RETURNING (xmax = 0) as inserted`,
        [
          orgId, job.externalId, job.title, job.orgName,
          job.location, job.country,
          dbSector, org.djSector,
          job.applyUrl, job.snippet, job.postedDate, job.contentHash,
          job.suitabilityScore >= 4
        ]
      )
      if (result.rows[0]?.inserted) newCount++
    } catch (err) {
      console.error(`[MonitorDJ] Failed to save job "${job.title}":`, (err as Error).message)
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
    console.error('[MonitorDJ] Failed to update scan record:', (err as Error).message)
  }

  console.log(`[MonitorDJ] ${org.name}: ${jobs.length} found, ${newCount} new`)
  return { found: jobs.length, newJobs: newCount }
}

// ─── Full DJ Scan (advisory lock protected) ───────────────────────────────────

export async function runFullScanDJ(): Promise<void> {
  const lockId = 123456789  // Different from Pooja's 987654321

  let lockAcquired = false
  let client

  try {
    client = await pool.connect()
    const lockResult = await client.query(
      'SELECT pg_try_advisory_lock($1) as acquired', [lockId]
    )
    lockAcquired = lockResult.rows[0]?.acquired === true

    if (!lockAcquired) {
      console.log('[MonitorDJ] Another DJ scan already running, skipping...')
      client.release()
      return
    }

    console.log('[MonitorDJ] Advisory lock acquired, starting DJ full scan...')

    // Prioritise orgs where last_scanned_at IS NULL (new orgs get immediate data)
    const orgs = await pool.query(
      `SELECT id, name FROM monitor_orgs
       WHERE is_active = true AND profile = 'dj'
       ORDER BY last_scanned_at ASC NULLS FIRST
       LIMIT 12`
    )

    for (const row of orgs.rows) {
      const orgConfig = DJ_ORGS.find(o => o.name === row.name)
      if (!orgConfig) continue
      await scanDJOrg(row.id, orgConfig)
      await new Promise(r => setTimeout(r, 4000))  // 4s between scans
    }

    // Mark DJ jobs unseen in 30 days as inactive
    const cleaned = await pool.query(
      `UPDATE monitor_jobs
       SET is_active = false
       WHERE last_seen_at < NOW() - INTERVAL '30 days'
         AND is_active = true AND profile = 'dj'
       RETURNING id`
    )
    if (cleaned.rows.length > 0) {
      console.log(`[MonitorDJ] Expired ${cleaned.rows.length} old DJ job listings`)
    }

    console.log('[MonitorDJ] Full scan complete')

  } catch (err) {
    console.error('[MonitorDJ] Scan error:', (err as Error).message)
  } finally {
    if (client) {
      if (lockAcquired) {
        try { await client.query('SELECT pg_advisory_unlock($1)', [lockId]) } catch { /* */ }
      }
      client.release()
    }
  }
}

// ─── Seed DJ orgs into monitor_orgs table ────────────────────────────────────

export async function seedDJOrgs(): Promise<void> {
  const existing = await pool.query(
    `SELECT COUNT(*) FROM monitor_orgs WHERE profile = 'dj'`
  )
  if (parseInt(existing.rows[0].count) >= DJ_ORGS.length) {
    console.log(`[MonitorDJ] ${existing.rows[0].count} DJ orgs already seeded`)
    return
  }

  console.log('[MonitorDJ] Seeding DJ organizations...')
  let seeded = 0
  for (const org of DJ_ORGS) {
    const dbSector = djSectorToDbSector(org.djSector)
    try {
      await pool.query(
        `INSERT INTO monitor_orgs
           (name, sector, sub_sector, country, careers_url, api_type, profile)
         VALUES ($1,$2,$3,$4,$5,$6,'dj')
         ON CONFLICT (name) DO UPDATE
           SET profile = 'dj', sub_sector = $3`,
        [org.name, dbSector, org.djSector, org.country,
         org.careersUrl || null, org.apiType]
      )
      seeded++
    } catch (err) {
      console.error(`[MonitorDJ] Seed failed for ${org.name}:`, (err as Error).message)
    }
  }
  console.log(`[MonitorDJ] Seeded ${seeded}/${DJ_ORGS.length} DJ organizations`)
}
