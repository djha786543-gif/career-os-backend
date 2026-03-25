import { Router, Request, Response } from 'express'
import { pool } from '../db/client'
import { validateJobSuitability, TIER1_ORG_NAMES } from '../opportunity-monitor/validateJobSuitability'

const router = Router()

const COST_PER_AI_CALL = 0.0013  // claude-haiku-4-5 @ ~500 in / ~500 out tokens
const COST_PER_SCAN_CYCLE = 0.008 // user-visible rate (full batch of ~6 websearch calls)

// GET /api/admin/usage
// Returns Anthropic credit balance (requires ANTHROPIC_ADMIN_KEY env var)
// plus estimated usage calculated from our own scan logs.
// Safe to call from the frontend — returns nulls gracefully when admin key absent.
router.get('/usage', async (req: Request, res: Response) => {
  try {
    // ── 1. Try Anthropic Admin API for real credit balance ────────────────────
    // Requires a separate ANTHROPIC_ADMIN_KEY (Settings → API Keys → Admin key).
    // Falls back silently if not configured — regular API keys cannot read billing.
    let available_balance: number | null = null
    let total_spent_api: number | null = null

    const adminKey = process.env.ANTHROPIC_ADMIN_KEY
    if (adminKey) {
      try {
        const r = await fetch('https://api.anthropic.com/v1/organizations/usage', {
          headers: {
            'anthropic-admin-key': adminKey,
            'anthropic-version': '2023-06-01',
          },
        })
        if (r.ok) {
          const data = await r.json()
          available_balance = data.available_balance ?? null
          total_spent_api   = data.total_cost ?? null
        }
      } catch { /* admin key present but endpoint unavailable — ignore */ }
    }

    // ── 2. Compute estimated usage from our own scan logs ────────────────────
    const stats = await pool.query<{
      ai_calls_month:    number
      total_scans_month: number
      jobs_found_month:  number
    }>(`
      SELECT
        COUNT(s.id) FILTER (WHERE s.status = 'success' AND o.api_type = 'websearch')::int AS ai_calls_month,
        COUNT(s.id) FILTER (WHERE s.status = 'success')::int                              AS total_scans_month,
        COALESCE(SUM(s.jobs_found), 0)::int                                               AS jobs_found_month
      FROM monitor_scans s
      JOIN monitor_orgs o ON s.org_id = o.id
      WHERE s.scanned_at >= date_trunc('month', NOW())
    `)

    const row = stats.rows[0]
    const ai_calls       = row.ai_calls_month    || 0
    const total_scans    = row.total_scans_month  || 0
    const jobs_found     = row.jobs_found_month   || 0
    const estimated_cost = parseFloat((ai_calls * COST_PER_AI_CALL).toFixed(3))

    // ── 3. Budget fallback ───────────────────────────────────────────────────
    // If no admin key, use ANTHROPIC_MONTHLY_BUDGET env var (e.g. 20) to
    // synthesise a pseudo available_balance = budget - estimated_monthly_cost.
    let source: 'anthropic_api' | 'budgeted' | 'estimated' = 'estimated'
    if (available_balance !== null) {
      source = 'anthropic_api'
    } else {
      const budget = parseFloat(process.env.ANTHROPIC_MONTHLY_BUDGET || '')
      if (!isNaN(budget) && budget > 0) {
        available_balance = parseFloat((budget - estimated_cost).toFixed(3))
        source = 'budgeted'
      }
    }

    res.json({
      available_balance,
      total_spent: total_spent_api ?? estimated_cost,

      // Local scan tracking (always available)
      estimated_monthly_cost: estimated_cost,
      monthly_ai_calls:       ai_calls,
      monthly_total_scans:    total_scans,
      jobs_found_month:       jobs_found,

      // Rates for frontend calculations
      cost_per_ai_call:    COST_PER_AI_CALL,
      cost_per_scan_cycle: COST_PER_SCAN_CYCLE,

      // 'anthropic_api' | 'budgeted' | 'estimated'
      source,
    })
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/admin/revalidate-all
// Re-runs every monitor_jobs row (all sectors) through the Zero-Trust pipeline
// and writes back high_suitability, match_score (real float), and fail_reason.
// Correctly tracks demotions/promotions by reading old value BEFORE the UPDATE.
//
// Usage:  curl -X POST https://<host>/api/admin/revalidate-all
router.post('/revalidate-all', async (req: Request, res: Response) => {
  try {
    // ── Fetch all jobs across every sector, including old high_suitability ─────
    const { rows } = await pool.query<{
      id:               string
      title:            string
      snippet:          string | null
      apply_url:        string | null
      org_name:         string
      sector:           string
      high_suitability: boolean   // read BEFORE update to track direction
    }>(
      `SELECT id, title, snippet, apply_url, org_name, sector, high_suitability
       FROM monitor_jobs
       ORDER BY detected_at DESC`
    )

    console.log(`[Revalidate] Processing ${rows.length} jobs across all sectors…`)

    let updated = 0
    let demoted = 0  // was true  → now false (the false-positives we're fixing)
    let promoted = 0 // was false → now true
    let errors  = 0

    for (const job of rows) {
      const result = validateJobSuitability(
        job.title, job.snippet, job.apply_url, job.org_name, TIER1_ORG_NAMES,
      )

      try {
        await pool.query(
          `UPDATE monitor_jobs
              SET high_suitability = $1,
                  match_score      = $2,
                  fail_reason      = $3
            WHERE id = $4`,
          [result.highSuitability, result.matchScore, result.failReason ?? null, job.id]
        )

        // Compare against the value we fetched BEFORE the UPDATE (correct tracking)
        if (job.high_suitability && !result.highSuitability) {
          demoted++
          console.log(`[Revalidate] DEMOTED  "${job.title}" [${job.sector}] | ${result.failReason}`)
        } else if (!job.high_suitability && result.highSuitability) {
          promoted++
        }

        updated++
      } catch (dbErr) {
        errors++
        console.error(`[Revalidate] DB error for "${job.title}":`, (dbErr as Error).message)
      }
    }

    console.log(
      `[Revalidate] Done. ${updated} updated, ${demoted} demoted, ${promoted} promoted, ${errors} errors.`
    )

    res.json({ ok: true, total: rows.length, updated, demoted, promoted, errors })
  } catch (err) {
    console.error('[Revalidate] Fatal error:', (err as Error).message)
    if (!res.headersSent) res.status(500).json({ error: (err as Error).message })
  }
})

// Keep old route as alias so existing bookmarks still work
router.post('/revalidate-academia', (req: Request, res: Response) => {
  res.redirect(307, '/api/admin/revalidate-all')
})

// POST /api/admin/cleanup-jobs
// Immediately purges noisy/stale records from monitor_jobs.
// Equivalent to the cleanup that runs at the start of every scheduled scan.
router.post('/cleanup-jobs', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      UPDATE monitor_jobs SET is_active = false
      WHERE is_active = true AND (
        title ILIKE '%workshop%' OR title ILIKE '%seminar%'
        OR title ILIKE '%conference%' OR title ILIKE '%symposium%'
        OR title ILIKE '%webinar%' OR title ILIKE '%colloquium%'
        OR title ILIKE '%merit list%' OR title ILIKE '%answer key%'
        OR title ILIKE '%question paper%' OR title ILIKE '%written test%'
        OR title ILIKE '%tender%' OR title ILIKE '%syllabus for%'
        OR title ILIKE '%interview schedule%' OR title ILIKE '%exam notice%'
        OR title ILIKE '%rate contract%' OR title ILIKE '%quotation%'
        OR title ILIKE '%librarian%' OR title ILIKE '%accountant%'
        OR title ILIKE '%finance officer%' OR title ILIKE '%registrar%'
        OR title ILIKE '%store keeper%' OR title ILIKE '%storekeeper%'
        OR title ILIKE '%housekeeping%' OR title ILIKE '%sanitation%'
        OR title ILIKE '% peon %' OR title ILIKE '%peon)'
        OR title ILIKE '%multi tasking staff%' OR title ILIKE '% mts %'
        OR title ILIKE '%computer operator%' OR title ILIKE '%data entry%'
        OR title ILIKE '%stenographer%' OR title ILIKE '%electrician%'
        OR title ILIKE '%plumber%' OR title ILIKE '% driver%'
        OR title ILIKE '%lower division clerk%' OR title ILIKE '% ldc %'
        OR title ILIKE '%security guard%' OR title ILIKE '%canteen%'
        OR title ILIKE '%walk-in interview%' OR title ILIKE '%walk in interview%'
        OR title ILIKE '%admission notice%' OR title ILIKE '%admission fee%'
        OR title ILIKE '%last date extended%'
        OR title ILIKE '%faculty members%' OR title ILIKE '%faculty member%'
        OR title ILIKE '%our faculty%' OR title ILIKE '%meet the faculty%'
        OR title ILIKE '%school of biology%' OR title ILIKE '%school of biosciences%'
        OR title ILIKE '%department of biosciences%' OR title ILIKE '%department of biochemical%'
        OR title ILIKE '%department of biology%' OR title ILIKE '%department of biotechnology%'
        OR title ILIKE '%department of molecular%'
        OR title ILIKE '%freshers%'
        OR title ILIKE '%recruitment 2025%' OR title ILIKE '%recruitment 2024%'
        OR title ILIKE '%vacancy 2025%' OR title ILIKE '%vacancy 2024%'
        OR title ILIKE '%jobs 2025%' OR title ILIKE '%jobs 2024%'
        OR title ~* '^\s*(Dr\.|Prof\.|Professor |Mr\.|Ms\.|Mrs\.)'
        OR apply_url ILIKE '%.pdf'
        OR apply_url ILIKE '%/events/%' OR apply_url ILIKE '%/event/%'
        OR apply_url ILIKE '%/seminar/%' OR apply_url ILIKE '%/workshop/%'
        OR apply_url ILIKE '%/notices/%' OR apply_url ILIKE '%/notice/%'
        OR apply_url ILIKE '%/circular/%' OR apply_url ILIKE '%/tender/%'
        OR apply_url ILIKE '%/results/%' OR apply_url ILIKE '%/result/%'
        OR apply_url ILIKE '%/admissions/%' OR apply_url ILIKE '%/admission/%'
        OR apply_url ILIKE '%faculty-profile%' OR apply_url ILIKE '%/people/%'
        OR apply_url ILIKE '%/directory/%' OR apply_url ILIKE '%/exam/%'
        OR apply_url ILIKE '%/faculty/%' OR apply_url ILIKE '%faculty.html%'
        OR apply_url ILIKE '%biotecnika.org%'
        OR apply_url ILIKE '%pharmatutor.org%'
        OR apply_url ILIKE '%biotecharticles.com%'
        OR detected_at < NOW() - INTERVAL '30 days'
      )
      RETURNING id
    `)
    res.json({ purged: result.rows.length, message: `Deactivated ${result.rows.length} noisy/stale records` })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// POST /api/admin/purge-before-march
// One-time purge: deactivates all monitor_jobs detected before 2026-03-01.
router.post('/purge-before-march', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      UPDATE monitor_jobs SET is_active = false
      WHERE is_active = true
        AND detected_at < '2026-03-01'
      RETURNING id
    `)
    res.json({ purged: result.rows.length, message: `Deactivated ${result.rows.length} records detected before 2026-03-01` })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

export default router
