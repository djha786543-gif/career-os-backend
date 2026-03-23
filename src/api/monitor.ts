import { Router, Request, Response } from 'express'
import { pool } from '../db/client'
import { runFullScan, scanOrg, seedOrgs, scanViaWebSearch } from '../opportunity-monitor/monitorEngine'
import { MONITOR_ORGS } from '../opportunity-monitor/orgConfig'

const router = Router()

// RECOMMENDATION 7: Validated query params with caps
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

// GET /api/monitor/jobs?sector=academia&region=asia&subsector=industry&isNew=true&highSuitability=true&limit=50&offset=0
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const sector          = req.query.sector    as string | undefined
    const region          = req.query.region    as string | undefined
    const subsector       = req.query.subsector as string | undefined
    const isNew           = req.query.isNew           === 'true'
    const highSuitability = req.query.highSuitability === 'true'
    const limit  = Math.min(parseInt(req.query.limit  as string || String(DEFAULT_LIMIT)), MAX_LIMIT)
    const offset = Math.max(parseInt(req.query.offset as string || '0'), 0)

    // ── Region → DB country mapping ──────────────────────────────────────────
    const REGION_COUNTRIES: Record<string, string[]> = {
      asia:          ['Japan', 'Singapore', 'South Korea', 'China', 'Australia',
                      'India', 'Hong Kong', 'Taiwan'],
      europe:        ['UK', 'Germany', 'Switzerland', 'France', 'Denmark',
                      'Ireland', 'Netherlands', 'Belgium', 'Sweden'],
      north_america: ['USA', 'Canada'],
    }

    const params: any[] = []
    let where = 'WHERE j.is_active = true'

    if (sector && ['academia','industry','international','india'].includes(sector)) {
      params.push(sector)
      where += ` AND j.sector = $${params.length}`
    }
    if (region && REGION_COUNTRIES[region.toLowerCase()]) {
      const countries = REGION_COUNTRIES[region.toLowerCase()]
      params.push(countries)
      where += ` AND j.country = ANY($${params.length}::text[])`
    }
    if (isNew) {
      where += ` AND j.is_new = true`
    }
    if (highSuitability) {
      where += ` AND j.high_suitability = true`
    }

    const INDIA_INDUSTRY_ORG_NAMES = [
      'Biocon Biologics', 'Syngene International', 'AstraZeneca India',
      'Dr Reddy\'s Laboratories', 'Sun Pharmaceutical', 'Cipla Research',
      'Piramal Pharma', 'Jubilant Biosys', 'Aragen Bioscience',
      'Anthem Biosciences', 'Tata Memorial Centre', 'Serum Institute India',
      'Lupin Research'
    ]
    if (subsector === 'industry' && sector === 'india') {
      params.push(INDIA_INDUSTRY_ORG_NAMES)
      where += ` AND j.org_name = ANY($${params.length})`
    }

    params.push(limit)
    params.push(offset)

    const result = await pool.query(
      `SELECT j.*, o.last_scanned_at, o.api_type
       FROM monitor_jobs j
       JOIN monitor_orgs o ON j.org_id = o.id
       ${where}
       ORDER BY j.is_new DESC, j.detected_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    )

    // ── Live-search priority org lists ───────────────────────────────────────
    const LIVE: Record<string, string[]> = {
      india_academic: [
        'NCBS Bangalore', 'IISc Bangalore', 'inStem Bangalore',
        'IGIB Delhi', 'CCMB Hyderabad', 'DBT-THSTI Faridabad', 'RCB Faridabad', 'IISER Pune',
      ],
      india_industry: [
        'Biocon Biologics', 'Syngene International', 'AstraZeneca India',
        'Dr Reddy\'s Laboratories', 'Sun Pharmaceutical', 'Cipla Research',
        'Piramal Pharma', 'Jubilant Biosys', 'Aragen Bioscience',
        'Anthem Biosciences', 'Tata Memorial Centre', 'Serum Institute India',
        'Lupin Research',
      ],
      asia: [
        'Takeda Japan', 'Daiichi Sankyo Japan', 'Astellas Japan', 'Eisai Japan',
        'Takeda Pharmaceuticals Japan', 'Daiichi Sankyo', 'Astellas Pharma',
        'Eisai Research', 'Ono Pharmaceutical', 'Chugai Pharmaceutical', 'Mitsubishi Tanabe Pharma',
        'Novartis Singapore', 'GSK Singapore', 'Takeda Singapore',
        'A*STAR Singapore', 'Roche Singapore', 'AbbVie Singapore', 'Bayer Asia',
        'AstraZeneca China', 'Roche China', 'BeiGene Research', 'Zymeworks China',
        'Samsung Biologics', 'Celltrion', 'Yuhan Corporation',
        'CSL Behring', 'Pfizer Australia',
      ],
      europe: [
        'AstraZeneca UK', 'GSK UK', 'Novartis Basel', 'Roche Research Basel',
        'Novo Nordisk', 'BioNTech Germany', 'Bayer Life Sciences', 'Boehringer Ingelheim',
      ],
      north_america: ['Genentech', 'Regeneron', 'AstraZeneca US', 'Amgen', 'Pfizer Research'],
      international: ['ETH Zurich', 'Karolinska Institute', 'MRC LMS London', 'A*STAR Singapore', 'WEHI Melbourne'],
    }

    // ── Decide which live orgs to search ────────────────────────────────────
    let liveOrgNames: string[] = []

    if (result.rows.length === 0) {
      // DB empty for this specific query — full live search
      if (region === 'asia')          liveOrgNames = LIVE.asia
      else if (region === 'europe')   liveOrgNames = LIVE.europe
      else if (region === 'north_america') liveOrgNames = LIVE.north_america
      else if (sector === 'india' && subsector === 'industry') liveOrgNames = LIVE.india_industry
      else if (sector === 'india')    liveOrgNames = [...LIVE.india_academic, ...LIVE.india_industry]
      else if (sector === 'industry') liveOrgNames = [...LIVE.asia, ...LIVE.europe, ...LIVE.north_america]
      else if (sector === 'international') liveOrgNames = LIVE.international
    } else if (sector === 'industry' && !region) {
      // DB has industry jobs but may be missing regions — supplement selectively
      const ASIA_C   = new Set(['Japan', 'Singapore', 'South Korea', 'China', 'Australia', 'Hong Kong', 'Taiwan'])
      const EUROPE_C = new Set(['UK', 'Germany', 'Switzerland', 'France', 'Denmark',
                                'Ireland', 'Netherlands', 'Belgium', 'Sweden'])
      if (!result.rows.some((r: any) => ASIA_C.has(r.country)))   liveOrgNames.push(...LIVE.asia)
      if (!result.rows.some((r: any) => EUROPE_C.has(r.country))) liveOrgNames.push(...LIVE.europe)
    }

    // ── Run live search if needed ────────────────────────────────────────────
    if (liveOrgNames.length > 0) {
      const nameSet  = new Set(liveOrgNames)
      const liveOrgs = MONITOR_ORGS.filter(o => o.apiType === 'websearch' && nameSet.has(o.name))

      try {
        const settled = await Promise.allSettled(liveOrgs.map(org => scanViaWebSearch(org)))

        const liveJobs: any[] = []
        const existingKeys = new Set(result.rows.map((r: any) => `${r.title}|${r.org_name}`))

        settled.forEach((r, i) => {
          if (r.status !== 'fulfilled') return
          const org = liveOrgs[i]
          r.value.forEach(j => {
            const key = `${j.title}|${j.orgName}`
            if (existingKeys.has(key)) return
            existingKeys.add(key)
            liveJobs.push({
              title: j.title, company: j.orgName, org_name: j.orgName,
              location: j.location, country: org.country,
              apply_url: j.applyUrl, applyUrl: j.applyUrl,
              snippet: j.snippet, sector: org.sector,
              is_new: true, fit_score: Math.min(j.relevanceScore * 15, 85),
              high_suitability: j.highSuitability,
            })
          })
        })

        if (liveJobs.length > 0) {
          runFullScan().catch(console.error)
          const allJobs = [...result.rows, ...liveJobs]
          return res.json({
            status: 'success', jobs: allJobs, counts: [], total: allJobs.length, limit, offset,
            broadened: true,
            broadenedReason: result.rows.length === 0
              ? `Live search — ${liveJobs.length} positions found. Run Scan to cache to database.`
              : `Supplemented with ${liveJobs.length} live results for uncached regions.`,
          })
        }
      } catch (fallbackErr) {
        console.error('[Monitor] Live fallback error:', (fallbackErr as Error).message)
      }
    }
    // ── End live-search fallback ─────────────────────────────────────────────

    const counts = await pool.query(
      `SELECT sector,
         COUNT(*) FILTER (WHERE is_active = true) as total,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_count
       FROM monitor_jobs
       GROUP BY sector`
    )

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

// GET /api/monitor/orgs?sector=academia
router.get('/orgs', async (req: Request, res: Response) => {
  try {
    const sector = req.query.sector as string | undefined
    const params: any[] = []
    let where = 'WHERE o.is_active = true'

    if (sector && ['academia','industry','international','india'].includes(sector)) {
      params.push(sector)
      where += ` AND o.sector = $${params.length}`
    }

    const result = await pool.query(
      `SELECT o.*,
         COUNT(j.id) FILTER (WHERE j.is_active = true) as total_jobs,
         COUNT(j.id) FILTER (WHERE j.is_new = true AND j.is_active = true) as new_jobs
       FROM monitor_orgs o
       LEFT JOIN monitor_jobs j ON o.id = j.org_id
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

// POST /api/monitor/scan
router.post('/scan', async (req: Request, res: Response) => {
  try {
    const { orgId } = req.body

    if (orgId) {
      const orgRow = await pool.query(
        'SELECT * FROM monitor_orgs WHERE id = $1', [orgId]
      )
      if (!orgRow.rows.length) {
        return res.status(404).json({ error: 'Organization not found' })
      }
      const orgConfig = MONITOR_ORGS.find(o => o.name === orgRow.rows[0].name)
      if (!orgConfig) {
        return res.status(404).json({ error: 'Organization config not found' })
      }
      res.json({ status: 'scanning', orgId, message: `Scanning ${orgConfig.name}...` })
      scanOrg(orgId, orgConfig).catch(console.error)
    } else {
      res.json({ status: 'scanning', message: 'Full scan started in background' })
      runFullScan().catch(console.error)
    }
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// POST /api/monitor/mark-seen
router.post('/mark-seen', async (req: Request, res: Response) => {
  try {
    const { sector } = req.body
    if (sector && ['academia','industry','international','india'].includes(sector)) {
      await pool.query(
        'UPDATE monitor_jobs SET is_new = false WHERE sector = $1 AND is_active = true',
        [sector]
      )
    } else {
      await pool.query(
        'UPDATE monitor_jobs SET is_new = false WHERE is_active = true'
      )
    }
    res.json({ status: 'success', message: 'Jobs marked as seen' })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

// GET /api/monitor/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const sectors = await pool.query(
      `SELECT sector,
         COUNT(*) FILTER (WHERE is_active = true) as total_jobs,
         COUNT(*) FILTER (WHERE is_new = true AND is_active = true) as new_jobs,
         MAX(detected_at) FILTER (WHERE is_active = true) as last_detected
       FROM monitor_jobs
       GROUP BY sector
       ORDER BY sector`
    )

    const lastScan = await pool.query(
      `SELECT MAX(scanned_at) as last_scan
       FROM monitor_scans
       WHERE status = 'success'`
    )

    const orgCount = await pool.query(
      'SELECT COUNT(*) as total FROM monitor_orgs WHERE is_active = true'
    )

    res.json({
      status: 'success',
      sectors: sectors.rows,
      lastScan: lastScan.rows[0]?.last_scan,
      totalOrgs: parseInt(orgCount.rows[0]?.total || '0')
    })
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: (err as Error).message })
    }
  }
})

export default router
