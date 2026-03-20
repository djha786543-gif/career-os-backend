/**
 * monitorEngineDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ (Deobrat Jha) — Isolated scoring engine for IT Audit / Cloud Risk Monitor.
 * Uses dedicated tables: dj_monitor_orgs, dj_monitor_jobs, dj_monitor_scans.
 * Zero crossover with Pooja's monitorEngine.ts.
 *
 * SCORING RULES (must score ≥ 4):
 *   +2  AWS Cloud Audit OR AI Governance (DJ's specialised DNA)
 *   +2  Manager OR Director title
 *   +1  TIER 1 orgs (EY, Deloitte, KPMG, PwC, Goldman Sachs, JPMorgan,
 *                    Public Storage, Investar, Western Digital)
 *
 * HARD FILTERS (global):
 *   Reject: Intern, Entry Level, Staff Auditor, Junior
 * HARD FILTERS (India only):
 *   Reject: Senior Associate, Associate
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/client'
import { DJ_MONITOR_ORGS, DJMonitorOrg } from './orgConfigDJ'
import crypto from 'crypto'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── DJ Profile Keywords ──────────────────────────────────────────────────────

const DJ_RANK1_TITLES = [
  'it audit manager', 'it audit director', 'head of it audit', 'director of it audit',
  'vp internal audit', 'avp it audit', 'senior manager it audit', 'technology risk manager',
  'technology risk director', 'cloud risk manager', 'cloud audit manager',
  'information security manager', 'sox audit manager', 'it compliance manager',
  'cloud security manager', 'grc manager', 'it risk manager',
]

const DJ_TECHNICAL_ANCHORS = [
  'sox', 'sox 404', 'itgc', 'itac', 'cloud security', 'cloud audit',
  'sap s/4hana', 'sap s4hana', 'nist', 'ai governance', 'ml governance',
  'soc1', 'soc 1', 'soc2', 'soc 2', 'soc type ii', 'grc',
  'cisa', 'cissp', 'aws cloud', 'azure security', 'cloud risk',
  'it general controls', 'application controls', 'it audit',
]

const DJ_SENIORITY_KEYWORDS = [
  'manager', 'senior manager', 'director', 'avp', 'vp', 'vice president',
  'head of', 'principal', 'lead',
]

// Global hard filters — these titles must never appear for DJ
const DJ_GLOBAL_HARD_FILTER = [
  'intern', 'internship', 'entry level', 'entry-level',
  'staff auditor', 'junior', 'graduate', 'trainee', 'fresher',
]

// India-specific additional hard filters
const DJ_INDIA_HARD_FILTER = [
  'senior associate', 'associate', 'analyst',
]

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
])

// ─── Filter Functions ─────────────────────────────────────────────────────────

function passesHardFilter(title: string, country: 'USA' | 'India'): boolean {
  const t = title.toLowerCase()
  if (DJ_GLOBAL_HARD_FILTER.some(term => t.includes(term))) return false
  if (country === 'India') {
    if (DJ_INDIA_HARD_FILTER.some(term => t.includes(term))) return false
  }
  return true
}

function hasSenioritySignal(title: string): boolean {
  const t = title.toLowerCase()
  return DJ_SENIORITY_KEYWORDS.some(kw => t.includes(kw))
}

function hasTechnicalAnchor(title: string, snippet: string): boolean {
  const text = (title + ' ' + snippet).toLowerCase()
  return DJ_TECHNICAL_ANCHORS.some(anchor => text.includes(anchor))
}

function isRelevantDJ(title: string, snippet: string = ''): boolean {
  const text = (title + ' ' + snippet).toLowerCase()
  return (
    DJ_RANK1_TITLES.some(kw => text.includes(kw)) ||
    (hasSenioritySignal(title) && hasTechnicalAnchor(title, snippet))
  )
}

/**
 * DJ suitability score (0–5). Score must be ≥ 4 to persist.
 */
function djSuitabilityScore(title: string, snippet: string, orgName: string): number {
  const text = (title + ' ' + snippet).toLowerCase()
  let score = 0

  // +2 for AWS Cloud Audit or AI/ML Governance
  if (
    text.includes('aws cloud audit') || text.includes('cloud audit') ||
    text.includes('ai governance') || text.includes('ml governance') ||
    text.includes('ai/ml governance')
  ) score += 2

  // +2 for Manager or Director title
  if (
    text.includes('manager') || text.includes('director') ||
    text.includes('avp') || text.includes('vp') || text.includes('head of')
  ) score += 2

  // +1 for Tier 1 org
  if (DJ_TIER1_ORGS.has(orgName)) score += 1

  return score
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashContent(title: string, org: string, location: string): string {
  return crypto
    .createHash('sha256')
    .update(`${title}|${org}|${location}`)
    .digest('hex')
    .slice(0, 64)
}

function extractCanonicalUrl(url: string, fallback: string): string {
  if (!url) return fallback
  const GENERIC = [
    'linkedin.com/company', 'linkedin.com/in/', 'linkedin.com/jobs',
    'twitter.com', 'x.com', 'facebook.com', 'instagram.com',
    'youtube.com', 'glassdoor.com/Overview',
  ]
  if (GENERIC.some(d => url.includes(d))) return fallback
  return url
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
  )
  return Promise.race([promise, timeout])
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DJScannedJob {
  externalId: string
  title: string
  orgName: string
  location: string
  country: 'USA' | 'India'
  sector: string
  applyUrl: string
  snippet: string
  postedDate: string
  contentHash: string
  highSuitability: boolean
  eadFriendly: boolean
  managerialGrade: boolean
  suitabilityScore: number
}

// ─── Web Search Scanner (DJ-specific prompt) ──────────────────────────────────

async function scanViaWebSearchDJ(org: DJMonitorOrg): Promise<DJScannedJob[]> {
  const isIndia = org.country === 'India'
  const countryStrategy = isIndia
    ? `INDIA STRATEGY: Return ONLY Manager, Senior Manager, Director, AVP, VP, or Head of IT Audit level roles. Hard-reject Associate, Senior Associate, Analyst.`
    : `US STRATEGY: Prioritize Contract, Consultant, W2, EAD-friendly, and Project-based roles. Include SOX Testing Cycle and Immediate Start positions.`

  try {
    const response = await withTimeout(
      anthropic.messages.create({
        model: 'claude-sonnet-4-5-20251001',
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for current open IT Audit or Technology Risk positions at ${org.name}.
Query: "${org.searchQuery}"

DJ Profile: IT Audit Manager, CISA, AWS Certified. Core expertise: SOX 404, ITGC/ITAC, Cloud Security, SAP S/4HANA, NIST, AI/ML Governance, SOC1/SOC2, GRC.

${countryStrategy}

Exclude ALL of the following: Intern, Entry Level, Staff Auditor, Junior, Graduate, Trainee${isIndia ? ', Associate, Senior Associate, Analyst' : ''}.

Find ONLY real, currently open positions posted in 2025 or 2026.

Return ONLY a JSON array, no markdown, no explanation:
[{
  "title": "exact job title",
  "location": "city, country (specific — not just 'remote')",
  "applyUrl": "direct URL to job posting",
  "snippet": "job description under 150 characters",
  "postedDate": "date posted or Recent"
}]
If no relevant open positions found, return: []`,
        }],
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
      .filter((j: any) => j.title && isRelevantDJ(j.title, j.snippet))
      .filter((j: any) => passesHardFilter(j.title, org.country))
      .filter((j: any) => {
        const s = djSuitabilityScore(j.title, j.snippet || '', org.name)
        return s >= 4
      })
      .map((j: any) => {
        const location = j.location || org.country
        const s = djSuitabilityScore(j.title, j.snippet || '', org.name)
        return {
          externalId: hashContent(j.title, org.name, location),
          title: j.title,
          orgName: org.name,
          location,
          country: org.country,
          sector: org.sector,
          applyUrl: extractCanonicalUrl(j.applyUrl || '', org.careersUrl || ''),
          snippet: j.snippet || '',
          postedDate: j.postedDate || 'Recent',
          contentHash: hashContent(j.title, org.name, location),
          highSuitability: s >= 4,
          eadFriendly: org.eadFriendly === true,
          managerialGrade: org.managerialGrade === true,
          suitabilityScore: s,
        }
      })

  } catch (err) {
    console.error(`[MonitorDJ] webSearch failed for ${org.name}:`, (err as Error).message)
    return []
  }
}

// ─── scanOrgDJ ────────────────────────────────────────────────────────────────

export async function scanOrgDJ(orgId: string, org: DJMonitorOrg): Promise<{
  found: number, newJobs: number, error?: string
}> {
  let jobs: DJScannedJob[] = []

  try {
    jobs = await scanViaWebSearchDJ(org)
  } catch (err) {
    const msg = (err as Error).message
    try {
      await pool.query(
        `INSERT INTO dj_monitor_scans (org_id, jobs_found, new_jobs, status, error_message)
         VALUES ($1, 0, 0, 'error', $2)`,
        [orgId, msg]
      )
    } catch { /* non-fatal */ }
    return { found: 0, newJobs: 0, error: msg }
  }

  let newCount = 0

  for (const job of jobs) {
    try {
      const result = await pool.query(
        `INSERT INTO dj_monitor_jobs
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
         RETURNING (xmax = 0) as inserted`,
        [
          orgId, job.externalId, job.title, job.orgName,
          job.location, job.country, job.sector,
          job.applyUrl, job.snippet, job.postedDate, job.contentHash,
          job.highSuitability, job.eadFriendly, job.managerialGrade, job.suitabilityScore,
        ]
      )
      if (result.rows[0]?.inserted) newCount++
    } catch (err) {
      console.error(`[MonitorDJ] Failed to save job "${job.title}":`, (err as Error).message)
    }
  }

  try {
    await pool.query(
      'UPDATE dj_monitor_orgs SET last_scanned_at = NOW() WHERE id = $1',
      [orgId]
    )
    await pool.query(
      `INSERT INTO dj_monitor_scans (org_id, jobs_found, new_jobs, status)
       VALUES ($1, $2, $3, 'success')`,
      [orgId, jobs.length, newCount]
    )
  } catch (err) {
    console.error('[MonitorDJ] Failed to update scan record:', (err as Error).message)
  }

  console.log(`[MonitorDJ] ${org.name}: ${jobs.length} found, ${newCount} new`)
  return { found: jobs.length, newJobs: newCount }
}

// ─── runFullScanDJ ────────────────────────────────────────────────────────────
// Uses advisory lock ID 987654322 (distinct from Pooja's 987654321).
// Scans 10 orgs per run — NULL last_scanned_at prioritised (populates table fast).

export async function runFullScanDJ(): Promise<void> {
  const lockId = 987654322

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
      console.log('[MonitorDJ] Another instance is already scanning, skipping...')
      client.release()
      return
    }

    console.log('[MonitorDJ] Advisory lock acquired, starting full DJ scan...')

    // Prioritise NULL last_scanned_at to populate the table immediately
    const orgs = await pool.query(
      `SELECT id, name FROM dj_monitor_orgs
       WHERE is_active = true
       ORDER BY last_scanned_at ASC NULLS FIRST
       LIMIT 10`
    )

    for (const row of orgs.rows) {
      const orgConfig = DJ_MONITOR_ORGS.find(o => o.name === row.name)
      if (!orgConfig) continue
      await scanOrgDJ(row.id, orgConfig)
      const delay = orgConfig.slowFetch ? 8000 : 3000
      await new Promise(r => setTimeout(r, delay))
    }

    // Expire jobs not seen in 30 days
    const cleaned = await pool.query(
      `UPDATE dj_monitor_jobs
       SET is_active = false
       WHERE last_seen_at < NOW() - INTERVAL '30 days'
       AND is_active = true
       RETURNING id`
    )
    if (cleaned.rows.length > 0) {
      console.log(`[MonitorDJ] Expired ${cleaned.rows.length} old DJ job listings`)
    }

    console.log('[MonitorDJ] Full DJ scan complete')

  } catch (err) {
    console.error('[MonitorDJ] Scan error:', (err as Error).message)
  } finally {
    if (client) {
      if (lockAcquired) {
        try {
          await client.query('SELECT pg_advisory_unlock($1)', [lockId])
        } catch (e) {
          console.error('[MonitorDJ] Failed to release advisory lock:', e)
        }
      }
      client.release()
    }
  }
}

// ─── seedOrgsDJ ──────────────────────────────────────────────────────────────

export async function seedOrgsDJ(): Promise<void> {
  const count = await pool.query('SELECT COUNT(*) FROM dj_monitor_orgs')
  if (parseInt(count.rows[0].count) >= DJ_MONITOR_ORGS.length) {
    console.log(`[MonitorDJ] ${count.rows[0].count} DJ orgs already seeded`)
    return
  }

  console.log('[MonitorDJ] Seeding DJ organizations...')
  for (const org of DJ_MONITOR_ORGS) {
    await pool.query(
      `INSERT INTO dj_monitor_orgs
         (name, sector, country, careers_url, api_type, ead_friendly, managerial_grade)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (name) DO NOTHING`,
      [
        org.name, org.sector, org.country,
        org.careersUrl || null, org.apiType,
        org.eadFriendly === true, org.managerialGrade === true,
      ]
    )
  }
  console.log(`[MonitorDJ] Seeded ${DJ_MONITOR_ORGS.length} DJ organizations`)
}
