/**
 * scripts/fix_db.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * One-shot DB cleaner: re-runs every monitor_jobs row where sector = 'academia'
 * through the Zero-Trust validateJobSuitability pipeline and writes back the
 * corrected high_suitability, match_score, and fail_reason values.
 *
 * Run:  npx ts-node scripts/fix_db.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv'
dotenv.config()

import { Pool } from 'pg'
import {
  validateJobSuitability,
  TIER1_ORG_NAMES,
} from '../src/opportunity-monitor/validateJobSuitability'

// ── DB connection (mirrors db.ts logic) ──────────────────────────────────────
const rawUrl =
  process.env.DATABASE_PUBLIC_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.DATABASE_URL ||
  ''

if (!rawUrl) {
  console.error('❌  No DATABASE_URL found in environment. Aborting.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: rawUrl,
  ssl: rawUrl.includes('rlwy.net') || rawUrl.includes('railway.internal')
    ? { rejectUnauthorized: false }
    : false,
  max: 5,
  connectionTimeoutMillis: 15000,
})

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const client = await pool.connect()

  try {
    // Ensure columns exist before we try to write them
    console.log('🔧  Ensuring match_score / fail_reason columns exist…')
    await client.query(`
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS match_score SMALLINT DEFAULT 0;
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS fail_reason TEXT;
    `)
    console.log('✅  Columns ready.\n')

    // ── Fetch all academia jobs ───────────────────────────────────────────────
    const { rows } = await client.query<{
      id:              string
      title:           string
      snippet:         string | null
      apply_url:       string | null
      org_name:        string
      high_suitability: boolean
    }>(
      `SELECT id, title, snippet, apply_url, org_name, high_suitability
       FROM monitor_jobs
       WHERE sector = 'academia'
       ORDER BY detected_at DESC`
    )

    console.log(`📋  Found ${rows.length} academia jobs to revalidate.\n`)

    let updated  = 0
    let demoted  = 0   // was high → now correctly low
    let promoted = 0   // was low  → now high
    let errors   = 0

    for (const job of rows) {
      const result = validateJobSuitability(
        job.title,
        job.snippet,
        job.apply_url,
        job.org_name,
        TIER1_ORG_NAMES,
      )

      // Store matchScore as fixed-point integer (×10) to fit SMALLINT
      const matchScoreInt = Math.round(result.matchScore * 10)

      try {
        await client.query(
          `UPDATE monitor_jobs
              SET high_suitability = $1,
                  match_score      = $2,
                  fail_reason      = $3
            WHERE id = $4`,
          [result.highSuitability, matchScoreInt, result.failReason ?? null, job.id]
        )

        const wasHigh = job.high_suitability
        if (wasHigh && !result.highSuitability) {
          demoted++
          console.log(`  ❌  DEMOTED  "${job.title}"  →  ${result.failReason}`)
        } else if (!wasHigh && result.highSuitability) {
          promoted++
          console.log(`  ✅  PROMOTED "${job.title}"`)
        }

        updated++
      } catch (dbErr) {
        errors++
        console.error(`  ⚠️  DB error for "${job.title}":`, (dbErr as Error).message)
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n' + '─'.repeat(60))
    console.log('✅  Revalidation complete.')
    console.log(`    Total processed : ${rows.length}`)
    console.log(`    Updated         : ${updated}`)
    console.log(`    Demoted (fixed) : ${demoted}  ← postdoc/fellowship false-positives cleared`)
    console.log(`    Promoted        : ${promoted}`)
    console.log(`    Errors          : ${errors}`)
    console.log('─'.repeat(60))

  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('❌  Fatal:', err.message)
  process.exit(1)
})
