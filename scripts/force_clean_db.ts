/**
 * scripts/force_clean_db.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot DB cleaner. Fetches every monitor_jobs row where sector = 'academia',
 * runs it through the Zero-Trust validateJobSuitability pipeline, and writes
 * back high_suitability, match_score, and fail_reason.
 *
 * Run:  npx ts-node scripts/force_clean_db.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv'
dotenv.config()

import { Pool } from 'pg'
import {
  validateJobSuitability,
  TIER1_ORG_NAMES,
} from '../src/opportunity-monitor/validateJobSuitability'

const rawUrl =
  process.env.DATABASE_PUBLIC_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.DATABASE_URL ||
  ''

if (!rawUrl) {
  console.error('❌  No database URL found in environment. Aborting.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: rawUrl,
  ssl: rawUrl.includes('rlwy.net') || rawUrl.includes('railway.internal')
    ? { rejectUnauthorized: false }
    : false,
  max: 3,
  connectionTimeoutMillis: 20000,
})

async function main() {
  const client = await pool.connect()

  try {
    // Ensure columns exist
    await client.query(`
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS match_score SMALLINT DEFAULT 0;
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS fail_reason TEXT;
    `)

    const { rows } = await client.query<{
      id:               string
      title:            string
      snippet:          string | null
      apply_url:        string | null
      org_name:         string
      high_suitability: boolean
    }>(
      `SELECT id, title, snippet, apply_url, org_name, high_suitability
       FROM monitor_jobs
       WHERE sector = 'academia'
       ORDER BY detected_at DESC`
    )

    console.log(`\n[CLEANUP] Found ${rows.length} academia jobs to process.\n`)

    let demoted  = 0
    let promoted = 0
    let kept     = 0
    let errors   = 0

    for (const job of rows) {
      const result = validateJobSuitability(
        job.title,
        job.snippet,
        job.apply_url,
        job.org_name,
        TIER1_ORG_NAMES,
      )

      try {
        await client.query(
          `UPDATE monitor_jobs
              SET high_suitability = $1,
                  match_score      = $2,
                  fail_reason      = $3
            WHERE id = $4`,
          [
            result.highSuitability,
            Math.round(result.matchScore * 10),
            result.failReason ?? null,
            job.id,
          ]
        )

        if (job.high_suitability && !result.highSuitability) {
          console.log(`[CLEANUP] Demoting "${job.title}" - ${result.failReason}`)
          demoted++
        } else if (!job.high_suitability && result.highSuitability) {
          console.log(`[CLEANUP] Promoting "${job.title}"`)
          promoted++
        } else {
          kept++
        }
      } catch (err) {
        console.error(`[CLEANUP] DB error on "${job.title}":`, (err as Error).message)
        errors++
      }
    }

    console.log('\n' + '─'.repeat(60))
    console.log('[CLEANUP] Complete.')
    console.log(`  Total     : ${rows.length}`)
    console.log(`  Demoted   : ${demoted}   ← false-positives cleared`)
    console.log(`  Promoted  : ${promoted}`)
    console.log(`  Unchanged : ${kept}`)
    console.log(`  Errors    : ${errors}`)
    console.log('─'.repeat(60) + '\n')

  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('[CLEANUP] Fatal:', err.message)
  process.exit(1)
})
