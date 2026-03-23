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

// POST /api/admin/revalidate-academia
// One-shot data-cleaning endpoint. Fetches every monitor_jobs row where
// sector = 'academia', reruns it through the Zero-Trust validateJobSuitability
// pipeline, and writes back high_suitability, match_score, and fail_reason.
//
// Usage:  curl -X POST https://<host>/api/admin/revalidate-academia
router.post('/revalidate-academia', async (req: Request, res: Response) => {
  try {
    // ── 1. Fetch all academia jobs ────────────────────────────────────────────
    const { rows } = await pool.query<{
      id:         string
      title:      string
      snippet:    string | null
      apply_url:  string | null
      org_name:   string
    }>(
      `SELECT id, title, snippet, apply_url, org_name
       FROM monitor_jobs
       WHERE sector = 'academia'
       ORDER BY detected_at DESC`
    )

    console.log(`[Revalidate] Processing ${rows.length} academia jobs…`)

    let updated    = 0
    let nowHigh    = 0  // was false → now true
    let nowLow     = 0  // was true  → now false (the bug we're fixing)
    let errors     = 0

    for (const job of rows) {
      const result = validateJobSuitability(
        job.title,
        job.snippet,
        job.apply_url,
        job.org_name,
        TIER1_ORG_NAMES,
      )

      const matchScoreInt = Math.round(result.matchScore * 10)  // store as fixed-point (×10)

      try {
        const updateResult = await pool.query(
          `UPDATE monitor_jobs
              SET high_suitability = $1,
                  match_score      = $2,
                  fail_reason      = $3
            WHERE id = $4
            RETURNING (SELECT high_suitability FROM monitor_jobs WHERE id = $4) AS old_high`,
          [result.highSuitability, matchScoreInt, result.failReason ?? null, job.id]
        )

        // Track direction of changes for the summary
        const oldHigh: boolean | null = updateResult.rows[0]?.old_high ?? null
        if (oldHigh === true  && !result.highSuitability) nowLow++
        if (oldHigh === false &&  result.highSuitability) nowHigh++

        updated++

        if (!result.passes) {
          console.log(
            `[Revalidate] REJECT  "${job.title}" | ${result.failReason}`
          )
        }
      } catch (dbErr) {
        errors++
        console.error(`[Revalidate] DB error for "${job.title}":`, (dbErr as Error).message)
      }
    }

    console.log(
      `[Revalidate] Done. ${updated} updated, ${nowLow} demoted (was high→now low), ` +
      `${nowHigh} promoted, ${errors} errors.`
    )

    res.json({
      ok:        true,
      total:     rows.length,
      updated,
      demoted:   nowLow,   // postdoc/fellowship jobs that were wrongly high → now correctly low
      promoted:  nowHigh,
      errors,
    })
  } catch (err) {
    console.error('[Revalidate] Fatal error:', (err as Error).message)
    if (!res.headersSent) res.status(500).json({ error: (err as Error).message })
  }
})

export default router
