/**
 * api/monitorPoojaIndia.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Pooja India Career Monitor — isolated from DJ's monitor entirely.
 * Mounted at: /api/monitor/pooja-india/*
 *
 * Uses Serper API to search Indian government/research portals for relevant
 * Scientist / Faculty / Scientific Officer openings. Stores results in
 * pooja_india_monitor_jobs (separate table, zero crossover with DJ tables).
 *
 * Endpoints:
 *   GET  /api/monitor/pooja-india/jobs        — cached results (filterable)
 *   POST /api/monitor/pooja-india/scan        — trigger fresh Serper scan
 *   DELETE /api/monitor/pooja-india/jobs/:id  — dismiss a job (applied / done)
 *   GET  /api/monitor/pooja-india/status      — last scan time + counts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db/client'
import crypto from 'crypto'

const router = Router()

// ─── Portal registry (non-fellowship only) ────────────────────────────────────

interface MonitorPortal {
  id:       string
  name:     string
  category: 'central-govt' | 'state-psc' | 'academia' | 'aggregator'
  query:    string   // Serper search query
}

const POOJA_INDIA_PORTALS: MonitorPortal[] = [
  // ─── Central Govt ────────────────────────────────────────────────────────
  {
    id: 'icmr', name: 'ICMR', category: 'central-govt',
    query: 'scientist vacancy recruitment 2025 2026 (site:icmr.nic.in OR site:recruitment.icmr.org.in)',
  },
  {
    id: 'csir', name: 'CSIR', category: 'central-govt',
    query: 'scientist senior scientist vacancy recruitment 2025 2026 (site:csir.res.in OR site:csirhrdg.res.in)',
  },
  {
    id: 'thsti', name: 'THSTI', category: 'central-govt',
    query: 'scientist faculty vacancy recruitment 2025 2026 site:thsti.res.in',
  },
  {
    id: 'nii', name: 'NII', category: 'central-govt',
    query: 'scientist vacancy recruitment 2025 2026 site:nii.res.in',
  },
  {
    id: 'nbrc', name: 'NBRC', category: 'central-govt',
    query: 'scientist vacancy recruitment 2025 2026 site:nbrc.ac.in',
  },
  {
    id: 'nipgr', name: 'NIPGR', category: 'central-govt',
    query: 'scientist vacancy recruitment 2025 2026 site:nipgr.ac.in',
  },
  {
    id: 'drdo', name: 'DRDO', category: 'central-govt',
    query: 'scientist life sciences CEPTAM recruitment 2025 2026 site:drdo.gov.in',
  },
  {
    id: 'icar', name: 'ICAR', category: 'central-govt',
    query: 'scientist ARS life sciences recruitment 2025 2026 site:icar.org.in',
  },
  {
    id: 'aiims', name: 'AIIMS', category: 'central-govt',
    query: 'research scientist assistant professor recruitment 2025 2026 (site:aiims.edu OR site:aiimsexams.ac.in)',
  },
  {
    id: 'rgcb', name: 'RGCB', category: 'central-govt',
    query: 'scientist vacancy recruitment 2025 2026 site:rgcb.res.in',
  },

  // ─── State PSC ───────────────────────────────────────────────────────────
  {
    id: 'mppsc', name: 'MPPSC', category: 'state-psc',
    query: 'scientific officer biology advertisement 2025 2026 site:mppsc.mp.gov.in',
  },
  {
    id: 'uppsc', name: 'UPPSC', category: 'state-psc',
    query: 'scientific officer lecturer notification 2025 2026 site:uppsc.up.nic.in',
  },
  {
    id: 'wbpsc', name: 'WBPSC', category: 'state-psc',
    query: 'scientist professor scientific officer advertisement 2025 2026 site:psc.wb.gov.in',
  },
  {
    id: 'kscste', name: 'KSCSTE', category: 'state-psc',
    query: 'scientist junior scientist recruitment 2025 2026 site:kscste.kerala.gov.in',
  },
  {
    id: 'tnpsc', name: 'TNPSC', category: 'state-psc',
    query: 'assistant professor life sciences biology notification 2025 2026 site:tnpsc.gov.in',
  },
  {
    id: 'rpsc', name: 'RPSC', category: 'state-psc',
    query: 'assistant professor life sciences 2025 2026 site:rpsc.rajasthan.gov.in',
  },
  {
    id: 'kpsc', name: 'KPSC', category: 'state-psc',
    query: 'scientific officer lecturer biology 2025 2026 site:kpsc.kar.nic.in',
  },

  // ─── Academia ────────────────────────────────────────────────────────────
  {
    id: 'iit', name: 'IIT System', category: 'academia',
    query: 'assistant professor biosciences biochemistry biology faculty opening 2025 2026 (site:iitk.ac.in OR site:iitb.ac.in OR site:iitm.ac.in OR site:iitd.ac.in OR site:iitkgp.ac.in OR site:iith.ac.in OR site:iitgn.ac.in)',
  },
  {
    id: 'iiser', name: 'IISER', category: 'academia',
    query: 'assistant professor biology molecular 2025 2026 (site:iiserfaculty.in OR site:iiserpune.ac.in OR site:iiserb.ac.in OR site:iiserk.ac.in OR site:iisermohali.ac.in)',
  },
  {
    id: 'ncbs', name: 'NCBS-TIFR', category: 'academia',
    query: 'faculty scientist position 2025 2026 site:ncbs.res.in',
  },
  {
    id: 'instem', name: 'InStem', category: 'academia',
    query: 'faculty scientist cardiovascular biology 2025 2026 site:instem.res.in',
  },
  {
    id: 'central-univ', name: 'Central Universities', category: 'academia',
    query: 'assistant professor life sciences biology recruitment 2025 2026 site:ugc.ac.in',
  },

  // ─── Aggregators ─────────────────────────────────────────────────────────
  {
    id: 'indiabioscience', name: 'IndiaBioscience', category: 'aggregator',
    query: 'scientist faculty PhD life science position vacancy site:indiabioscience.org',
  },
  {
    id: 'employment-news', name: 'Employment News', category: 'aggregator',
    query: 'scientist fellowship life science vacancy recruitment 2026 site:employmentnews.gov.in',
  },
  {
    id: 'dbt', name: 'DBT Portal', category: 'aggregator',
    query: 'scientist vacancy recruitment opening 2025 2026 site:dbtindia.gov.in',
  },
  {
    id: 'serb-dst', name: 'SERB / DST', category: 'aggregator',
    query: 'vacancy opening recruitment 2025 2026 (site:serb.gov.in OR site:dst.gov.in)',
  },
]

// ─── Relevance Scoring ────────────────────────────────────────────────────────

const CORE_KEYWORDS = [
  'scientist', 'faculty', 'professor', 'researcher', 'scientific officer',
  'research scientist', 'research associate', 'scientist-b', 'scientist-c',
  'scientist-d', 'assistant professor', 'associate professor', 'jr. research',
  'junior research', 'phd position', 'phd opening', 'phd student', 'phd fellow',
  'doctoral', 'project scientist', 'ra-i', 'ra-ii', 'ra-iii', 'vacancy',
  'recruitment', 'application invited', 'applications invited',
]
const BOOST_KEYWORDS = [
  'life science', 'biology', 'molecular', 'cardiovascular', 'biomedical',
  'phd', 'biotechnology', 'biochemistry', 'genomics', 'immunology',
  'translational', 'stem cell', 'neuroscience', 'microbiology', 'cell biology',
  'pharmacology', 'bioinformatics', 'structural biology',
]

// Title-level hard filters — these nearly always indicate non-job content
// (informational articles, preparation guides, result announcements, etc.)
const NOISE_TITLE_TERMS = [
  'how to', 'how-to', 'tips for', 'tips to', 'top 10', 'top 5', 'top 20',
  'list of', 'all about', 'everything you', 'a complete guide', 'complete guide',
  'step by step', 'step-by-step', 'beginner\'s guide', 'beginners guide',
  'preparation', 'study material', 'study plan', 'mock test', 'practice set',
  'previous year', 'previous papers', 'sample papers', 'question bank',
  'syllabus', 'exam pattern', 'cut off', 'cutoff', 'merit list', 'result declared',
  'answer key', 'admit card', 'hall ticket', 'scorecard',
  'salary', 'pay scale', 'pay band', 'age limit', 'eligibility criteria',
  'best books', 'recommended books', 'coaching', 'online course',
  'news:', 'latest news', 'breaking news', 'press release', 'annual report',
  'newsletter', 'event report', 'workshop report', 'conference report',
  'obituary', 'obituaries', 'covid', 'tender', 'e-tender', 'quotation',
]

// Token-level hard filters — roles that are never relevant for Pooja
const HARD_FILTER_TERMS = [
  'intern', 'internship', 'technical assistant', 'lab attendant', 'peon',
  'stenographer', 'accountant', 'accountancy', 'clerk', 'driver', 'nurse',
  'pharmacist', 'radiographer', 'security guard', 'multi tasking',
  'multi-tasking', 'mts', 'group d', 'lower division', 'upper division',
  'assistant librarian', 'junior assistant', 'data entry', 'finance officer',
  'legal officer', 'executive director', 'general manager', 'deputy manager',
  'assistant manager', 'hindi officer', 'rajbhasha',
]

function scoreJob(title: string, snippet: string): number {
  const titleLc = title.toLowerCase()
  const text    = `${titleLc} ${snippet.toLowerCase()}`

  // Title-level noise check — reject informational content outright
  if (NOISE_TITLE_TERMS.some(kw => titleLc.includes(kw))) return -1

  // Token-level role filter — reject non-relevant job types
  if (HARD_FILTER_TERMS.some(kw => text.includes(kw))) return -1

  let score = 0
  if (CORE_KEYWORDS.some(kw => text.includes(kw))) score += 2
  if (BOOST_KEYWORDS.some(kw => text.includes(kw))) score += 1
  return score
}

// ─── GET /api/monitor/pooja-india/jobs ────────────────────────────────────────

router.get('/jobs', async (req: Request, res: Response) => {
  const { category } = req.query
  const params: any[] = []
  // Only return results from the past 30 days — older entries are stale
  let where = `WHERE dismissed = false AND detected_at > NOW() - INTERVAL '30 days'`

  if (category && category !== 'all') {
    params.push(category)
    where += ` AND portal_category = $${params.length}`
  }

  // Use explicit client so we can set statement_timeout and guarantee release.
  // pool.query() can hang indefinitely if a connection is never returned.
  let client: any
  try {
    client = await pool.connect()
    await client.query(`SET statement_timeout = 8000`)   // abort if stuck >8s

    const result = await client.query(
      `SELECT id, title, org_name, portal_category, snippet, apply_url,
              posted_date, source_portal, relevance_score, is_new, dismissed,
              detected_at, last_seen_at
       FROM pooja_india_monitor_jobs
       ${where}
       ORDER BY relevance_score DESC, detected_at DESC
       LIMIT 150`,
      params.length ? params : undefined
    )

    const meta = await client.query(
      `SELECT MAX(detected_at) AS last_scan
       FROM pooja_india_monitor_jobs
       WHERE dismissed = false`
    )

    res.json({
      status:   'success',
      jobs:     result.rows,
      total:    result.rows.length,
      lastScan: meta.rows[0]?.last_scan || null,
    })
  } catch (err: any) {
    console.error('[PoojaIndia] /jobs error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: err.message, jobs: [] })
  } finally {
    if (client) client.release()
  }
})

// ─── POST /api/monitor/pooja-india/scan ──────────────────────────────────────

router.post('/scan', async (req: Request, res: Response) => {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'SERPER_API_KEY not configured' })

  // Respond immediately — scan runs in background
  res.json({ status: 'scanning', message: 'Scan started — results available in ~30 seconds' })
  runScan(apiKey).catch(console.error)
})

async function runScan(apiKey: string): Promise<void> {
  console.log('[PoojaIndia] Starting scan across', POOJA_INDIA_PORTALS.length, 'portals')
  let totalStored = 0

  const client = await pool.connect()
  try {
    for (const portal of POOJA_INDIA_PORTALS) {
      try {
        const resp = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          // tbs:'qdr:m3' = Google's "past 3 months" filter — kills stale/archived pages
          body: JSON.stringify({ q: portal.query, num: 10, gl: 'in', hl: 'en', tbs: 'qdr:m3' }),
        })

        if (!resp.ok) {
          console.warn(`[PoojaIndia] Serper ${resp.status} for ${portal.name}`)
          continue
        }

        const data: any = await resp.json()
        const results: any[] = [
          ...(data.organic || []),
          ...(data.news    || []),
        ]

        for (const r of results) {
          const title   = (r.title   || '').trim()
          const snippet = (r.snippet || '').trim()
          const link    = (r.link    || r.url || '').trim()

          if (!title || !link) continue

          const score = scoreJob(title, snippet)
          // Require at least one CORE keyword (score >= 1) — pure noise scores 0
          if (score < 1) continue

          const id = crypto
            .createHash('md5')
            .update(`${title}__${link}`)
            .digest('hex')
            .slice(0, 24)

          await client.query(
            `INSERT INTO pooja_india_monitor_jobs
               (id, title, org_name, portal_category, snippet, apply_url,
                posted_date, source_portal, relevance_score, is_new, dismissed)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,false)
             ON CONFLICT (id) DO UPDATE SET
               snippet         = EXCLUDED.snippet,
               posted_date     = EXCLUDED.posted_date,
               relevance_score = EXCLUDED.relevance_score,
               last_seen_at    = NOW()`,
            [
              id, title, portal.name, portal.category,
              snippet, link,
              r.date || 'Recent',
              portal.id,
              score,
            ]
          )
          totalStored++
        }
      } catch (err) {
        console.error(`[PoojaIndia] Error scanning ${portal.name}:`, (err as Error).message)
      }

      // Respect Serper rate limits — 200 ms between calls
      await new Promise(r => setTimeout(r, 200))
    }
    console.log(`[PoojaIndia] Scan complete — ${totalStored} jobs upserted`)

    // Auto-purge records older than 30 days to keep the table clean
    const purge = await client.query(
      `DELETE FROM pooja_india_monitor_jobs
       WHERE detected_at < NOW() - INTERVAL '30 days'`
    )
    if (purge.rowCount && purge.rowCount > 0) {
      console.log(`[PoojaIndia] Purged ${purge.rowCount} stale jobs (>30 days)`)
    }
  } finally {
    client.release()
  }
}

// ─── DELETE /api/monitor/pooja-india/jobs/:id  (dismiss — applied / done) ────

router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await pool.query(
      'UPDATE pooja_india_monitor_jobs SET dismissed = true WHERE id = $1',
      [id]
    )
    res.json({ status: 'success', dismissed: id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/monitor/pooja-india/status ─────────────────────────────────────

router.get('/status', async (req: Request, res: Response) => {
  try {
    const stats = await pool.query(`
      SELECT
        portal_category,
        COUNT(*)                              FILTER (WHERE dismissed = false) AS active,
        COUNT(*)                              FILTER (WHERE dismissed = true)  AS dismissed,
        MAX(detected_at)                      FILTER (WHERE dismissed = false) AS last_detected
      FROM pooja_india_monitor_jobs
      GROUP BY portal_category
    `)
    const lastScan = await pool.query(
      `SELECT MAX(detected_at) as last_scan FROM pooja_india_monitor_jobs`
    )
    res.json({
      status:   'success',
      byCategory: stats.rows,
      lastScan:   lastScan.rows[0]?.last_scan || null,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/monitor/pooja-india/debug ──────────────────────────────────────

router.get('/debug', async (req: Request, res: Response) => {
  const result: Record<string, any> = {
    route:      'pooja-india-monitor',
    serperKey:  !!process.env.SERPER_API_KEY,
    dbUrl:      !!(process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL),
    portalCount: POOJA_INDIA_PORTALS.length,
  }
  try {
    const row = await pool.query(
      `SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE dismissed=false) as active
       FROM pooja_india_monitor_jobs`
    )
    result.jobsInDb = { total: parseInt(row.rows[0]?.total || '0'), active: parseInt(row.rows[0]?.active || '0') }
    result.tableExists = true
  } catch (err: any) {
    result.tableExists = false
    result.dbError = err.message
  }
  res.json(result)
})

export default router
