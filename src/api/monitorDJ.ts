/**
 * monitorDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ Opportunity Monitor API — completely isolated from Pooja's monitor.ts.
 * Mounted at /api/monitor/dj
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db/client'
import { runFullScanDJ, scanDJOrg, seedDJOrgs } from '../opportunity-monitor/monitorEngineDJ'
import { DJ_ORGS } from '../opportunity-monitor/orgConfigDJ'

const router = Router()
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

const VALID_DJ_SECTORS = [
  'us-big4', 'us-finance', 'us-tech', 'us-manufacturing',
  'india-gcc', 'india-bank', 'india-tech'
]

// GET /api/monitor/dj/jobs?sector=us-big4&region=us|india&isNew=true&limit=50&offset=0
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const sector   = req.query.sector as string | undefined
    const region   = req.query.region as string | undefined   // 'us' | 'india'
    const isNew    = req.query.isNew === 'true'
    const limit    = Math.min(parseInt(req.query.limit  as string || String(DEFAULT_LIMIT)), MAX_LIMIT)
    const offset   = Math.max(parseInt(req.query.offset as string || '0'), 0)

    const params: any[] = ["'dj'"]       // $1 always profile = 'dj'
    let where = `WHERE j.is_active = true AND j.profile = $1`

    // Filter by DJ sub_sector
    if (sector && VALID_DJ_SECTORS.includes(sector)) {
      params.push(sector)
      where += ` AND j.sub_sector = $${params.length}`
    }

    // Filter by region (us or india)
    if (region === 'us') {
      params.push('dj-us')
      where += ` AND j.sector = $${params.length}`
    } else if (region === 'india') {
      params.push('dj-india')
      where += ` AND j.sector = $${params.length}`
    }

    if (isNew) {
      where += ` AND j.is_new = true`
    }

    params.push(limit)
    params.push(offset)

    const result = await pool.query(
      `SELECT j.*, o.last_scanned_at, o.api_type
       FROM monitor_jobs j
       JOIN monitor_orgs o ON j.org_id = o.id
       ${where}
       ORDER BY j.is_new DESC, j.high_suitability DESC, j.detected_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    )

    // Sub-sector counts for the DJ sector tabs
    const counts = await pool.query(
      `SELECT sub_sector,
         COUNT(*) FILTER (WHERE is_active = true)              as total,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_count
       FROM monitor_jobs
       WHERE profile = 'dj'
       GROUP BY sub_sector`
    )

    // Multi-layer fallback: if specific query returns 0, broaden by region
    if (result.rows.length === 0) {
      const fallbackSector = (sector || '').startsWith('india') ? 'dj-india' : 'dj-us'
      const broadened = await pool.query(
        `SELECT j.*, o.last_scanned_at, o.api_type
         FROM monitor_jobs j
         JOIN monitor_orgs o ON j.org_id = o.id
         WHERE j.is_active = true AND j.profile = 'dj' AND j.sector = $1
         ORDER BY j.is_new DESC, j.high_suitability DESC, j.detected_at DESC
         LIMIT $2 OFFSET $3`,
        [fallbackSector, limit, offset]
      )

      if (broadened.rows.length > 0) {
        return res.json({
          status: 'success',
          jobs: broadened.rows,
          counts: counts.rows,
          total: broadened.rows.length,
          broadened: true,
          broadenedReason: `No ${sector || 'specific'} results yet — showing all ${fallbackSector === 'dj-india' ? 'India' : 'US'} DJ jobs`,
          limit,
          offset
        })
      }

      // Layer 2: truly empty — return empty with a scan-pending message
      return res.json({
        status: 'success',
        jobs: [],
        counts: counts.rows,
        total: 0,
        broadened: false,
        scanPending: true,
        scanPendingMessage: 'DJ profile scan not yet run — trigger a scan or wait for daily cron at 10:00 UTC',
        limit,
        offset
      })
    }

    res.json({
      status: 'success',
      jobs: result.rows,
      counts: counts.rows,
      total: result.rows.length,
      limit,
      offset
    })

  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// GET /api/monitor/dj/orgs?sector=us-big4
router.get('/orgs', async (req: Request, res: Response) => {
  try {
    const sector = req.query.sector as string | undefined
    const params: any[] = ["'dj'"]
    let where = `WHERE o.is_active = true AND o.profile = $1`

    if (sector && VALID_DJ_SECTORS.includes(sector)) {
      params.push(sector)
      where += ` AND o.sub_sector = $${params.length}`
    }

    const result = await pool.query(
      `SELECT o.*,
         COUNT(j.id) FILTER (WHERE j.is_active = true)                    as total_jobs,
         COUNT(j.id) FILTER (WHERE j.is_new = true AND j.is_active = true) as new_jobs
       FROM monitor_orgs o
       LEFT JOIN monitor_jobs j ON o.id = j.org_id AND j.profile = 'dj'
       ${where}
       GROUP BY o.id
       ORDER BY new_jobs DESC, total_jobs DESC`,
      params
    )

    res.json({ status: 'success', orgs: result.rows })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/dj/scan   { orgId? }
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body

    if (orgId) {
      const orgRow = await pool.query(
        `SELECT * FROM monitor_orgs WHERE id = $1 AND profile = 'dj'`, [orgId]
      )
      if (!orgRow.rows.length) {
        return res.status(404).json({ error: 'DJ organization not found' })
      }
      const orgConfig = DJ_ORGS.find(o => o.name === orgRow.rows[0].name)
      if (!orgConfig) {
        return res.status(404).json({ error: 'DJ organization config not found' })
      }
      res.json({ status: 'scanning', orgId, message: `Scanning ${orgConfig.name}...` })
      scanDJOrg(orgId, orgConfig).catch(console.error)
    } else {
      res.json({ status: 'scanning', message: 'Full DJ scan started in background' })
      runFullScanDJ().catch(console.error)
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/dj/mark-seen
router.post('/mark-seen', async (req: Request, res: Response) => {
  try {
    const { sector } = req.body
    if (sector && VALID_DJ_SECTORS.includes(sector)) {
      await pool.query(
        `UPDATE monitor_jobs SET is_new = false
         WHERE sub_sector = $1 AND profile = 'dj' AND is_active = true`,
        [sector]
      )
    } else {
      await pool.query(
        `UPDATE monitor_jobs SET is_new = false WHERE profile = 'dj' AND is_active = true`
      )
    }
    res.json({ status: 'success', message: 'DJ jobs marked as seen' })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// GET /api/monitor/dj/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const sectors = await pool.query(
      `SELECT sub_sector as sector,
         COUNT(*) FILTER (WHERE is_active = true)                    as total_jobs,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_jobs,
         MAX(detected_at) FILTER (WHERE is_active = true)            as last_detected
       FROM monitor_jobs
       WHERE profile = 'dj'
       GROUP BY sub_sector
       ORDER BY sub_sector`
    )

    const lastScan = await pool.query(
      `SELECT MAX(s.scanned_at) as last_scan
       FROM monitor_scans s
       JOIN monitor_orgs o ON s.org_id = o.id
       WHERE s.status = 'success' AND o.profile = 'dj'`
    )

    const orgCount = await pool.query(
      `SELECT COUNT(*) as total FROM monitor_orgs WHERE is_active = true AND profile = 'dj'`
    )

    res.json({
      status: 'success',
      sectors: sectors.rows,
      lastScan: lastScan.rows[0]?.last_scan,
      totalOrgs: parseInt(orgCount.rows[0]?.total || '0'),
      profile: 'dj'
    })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/dj/seed  (manual re-seed trigger)
router.post('/seed', async (_req: Request, res: Response) => {
  try {
    res.json({ status: 'seeding', message: 'DJ org seeding started in background' })
    seedDJOrgs().catch(console.error)
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

export default router
