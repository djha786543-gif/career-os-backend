/**
 * api/monitorDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ (Deobrat Jha) Opportunity Monitor API — isolated from Pooja's monitor.ts.
 * Mounted at: /api/monitor/dj/*
 *
 * Endpoints:
 *   GET  /api/monitor/dj/jobs     — DJ job listings with sector filter
 *   GET  /api/monitor/dj/orgs     — DJ org list
 *   POST /api/monitor/dj/scan     — Trigger DJ scan
 *   POST /api/monitor/dj/mark-seen — Mark DJ jobs as seen
 *   GET  /api/monitor/dj/stats    — DJ scan stats
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router, Request, Response } from 'express'
import { pool } from '../db/client'
import { runFullScanDJ, scanOrgDJ, seedOrgsDJ } from '../opportunity-monitor/monitorEngineDJ'
import { DJ_MONITOR_ORGS } from '../opportunity-monitor/orgConfigDJ'

const router = Router()

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50
const VALID_DJ_SECTORS = ['big4', 'banking', 'tech-cloud', 'manufacturing']

// GET /api/monitor/dj/jobs?sector=big4&country=USA&isNew=true&limit=50&offset=0
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const sector  = req.query.sector  as string | undefined
    const country = req.query.country as string | undefined
    const isNew   = req.query.isNew === 'true'
    const limit   = Math.min(parseInt(req.query.limit  as string || String(DEFAULT_LIMIT)), MAX_LIMIT)
    const offset  = Math.max(parseInt(req.query.offset as string || '0'), 0)

    const params: any[] = []
    let where = 'WHERE j.is_active = true'

    if (sector && VALID_DJ_SECTORS.includes(sector)) {
      params.push(sector)
      where += ` AND j.sector = $${params.length}`
    }
    if (country && ['USA', 'India'].includes(country)) {
      params.push(country)
      where += ` AND j.country = $${params.length}`
    }
    if (isNew) {
      where += ` AND j.is_new = true`
    }

    params.push(limit)
    params.push(offset)

    const result = await pool.query(
      `SELECT j.*, o.last_scanned_at, o.api_type, o.ead_friendly as org_ead_friendly, o.managerial_grade as org_managerial_grade
       FROM dj_monitor_jobs j
       JOIN dj_monitor_orgs o ON j.org_id = o.id
       ${where}
       ORDER BY j.suitability_score DESC, j.is_new DESC, j.detected_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    )

    const counts = await pool.query(
      `SELECT sector, country,
         COUNT(*) FILTER (WHERE is_active = true) as total,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_count
       FROM dj_monitor_jobs
       GROUP BY sector, country`
    )

    res.json({
      status: 'success',
      profile: 'dj',
      jobs: result.rows,
      counts: counts.rows,
      total: result.rows.length,
      limit,
      offset,
    })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// GET /api/monitor/dj/orgs?sector=big4&country=USA
router.get('/orgs', async (req: Request, res: Response) => {
  try {
    const sector  = req.query.sector  as string | undefined
    const country = req.query.country as string | undefined
    const params: any[] = []
    let where = 'WHERE o.is_active = true'

    if (sector && VALID_DJ_SECTORS.includes(sector)) {
      params.push(sector)
      where += ` AND o.sector = $${params.length}`
    }
    if (country && ['USA', 'India'].includes(country)) {
      params.push(country)
      where += ` AND o.country = $${params.length}`
    }

    const result = await pool.query(
      `SELECT o.*,
         COUNT(j.id) FILTER (WHERE j.is_active = true) as total_jobs,
         COUNT(j.id) FILTER (WHERE j.is_new = true AND j.is_active = true) as new_jobs
       FROM dj_monitor_orgs o
       LEFT JOIN dj_monitor_jobs j ON o.id = j.org_id
       ${where}
       GROUP BY o.id
       ORDER BY new_jobs DESC, total_jobs DESC`,
      params
    )

    res.json({ status: 'success', profile: 'dj', orgs: result.rows })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/dj/scan
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body

    if (orgId) {
      const orgRow = await pool.query(
        'SELECT * FROM dj_monitor_orgs WHERE id = $1',
        [orgId]
      )
      if (!orgRow.rows.length) {
        return res.status(404).json({ error: 'DJ organization not found' })
      }
      const orgConfig = DJ_MONITOR_ORGS.find(o => o.name === orgRow.rows[0].name)
      if (!orgConfig) {
        return res.status(404).json({ error: 'DJ organization config not found' })
      }
      res.json({ status: 'scanning', profile: 'dj', orgId, message: `Scanning ${orgConfig.name}...` })
      scanOrgDJ(orgId, orgConfig).catch(console.error)
    } else {
      res.json({ status: 'scanning', profile: 'dj', message: 'Full DJ scan started in background' })
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
        'UPDATE dj_monitor_jobs SET is_new = false WHERE sector = $1 AND is_active = true',
        [sector]
      )
    } else {
      await pool.query(
        'UPDATE dj_monitor_jobs SET is_new = false WHERE is_active = true'
      )
    }
    res.json({ status: 'success', profile: 'dj', message: 'DJ jobs marked as seen' })
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
      `SELECT sector, country,
         COUNT(*) FILTER (WHERE is_active = true) as total_jobs,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_jobs,
         COUNT(*) FILTER (WHERE ead_friendly = true AND is_active = true) as ead_jobs,
         COUNT(*) FILTER (WHERE managerial_grade = true AND is_active = true) as mgr_jobs,
         MAX(detected_at) FILTER (WHERE is_active = true) as last_detected
       FROM dj_monitor_jobs
       GROUP BY sector, country
       ORDER BY sector, country`
    )

    const lastScan = await pool.query(
      `SELECT MAX(scanned_at) as last_scan
       FROM dj_monitor_scans
       WHERE status = 'success'`
    )

    const orgCount = await pool.query(
      'SELECT COUNT(*) as total FROM dj_monitor_orgs WHERE is_active = true'
    )

    const pendingScan = await pool.query(
      `SELECT COUNT(*) as pending
       FROM dj_monitor_orgs
       WHERE is_active = true AND last_scanned_at IS NULL`
    )

    res.json({
      status: 'success',
      profile: 'dj',
      sectors: sectors.rows,
      lastScan: lastScan.rows[0]?.last_scan,
      totalOrgs: parseInt(orgCount.rows[0]?.total || '0'),
      pendingScan: parseInt(pendingScan.rows[0]?.pending || '0'),
    })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/dj/seed — manual seed trigger (admin use)
router.post('/seed', async (req: Request, res: Response) => {
  try {
    await seedOrgsDJ()
    res.json({ status: 'success', message: 'DJ orgs seeded' })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

export default router
