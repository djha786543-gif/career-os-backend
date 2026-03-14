/**
 * scripts/seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Initialises the Career OS PostgreSQL database:
 *   1. Runs the DDL from src/db/schema.sql (idempotent guard via IF NOT EXISTS)
 *   2. Seeds starter "Wishlist" kanban cards for both DJ and Pooja so the
 *      Tracker is never empty on first launch.
 *
 * Usage:
 *   npm run seed                 (requires DATABASE_URL in env / .env)
 *   DATABASE_URL=... ts-node scripts/seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Aborting seed.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

// ─────────────────────────────────────────────────────────────────────────────
// Starter Kanban cards
// ─────────────────────────────────────────────────────────────────────────────

const DJ_SEED_CARDS = [
  {
    title:       'IT Audit Manager — SOX & ITGC',
    company:     'Deloitte',
    apply_url:   'https://jobs.deloitte.com',
    match_score: 88,
    stage:       'wishlist',
    notes:       'Strong SOX/ITGC fit. AuditBoard listed. Check for Torrance/LA openings.',
    next_action: 'Tailor resume to highlight AuditBoard experience',
  },
  {
    title:       'Senior IT Auditor — Technology Risk',
    company:     'KPMG',
    apply_url:   'https://jobs.kpmg.com',
    match_score: 83,
    stage:       'wishlist',
    notes:       'Remote-friendly posting. Strong CISA requirement match.',
    next_action: 'Research KPMG LA office culture',
  },
  {
    title:       'AI Governance & Audit Manager',
    company:     'Meta',
    apply_url:   'https://www.metacareers.com',
    match_score: 79,
    stage:       'wishlist',
    notes:       'AIGP certification is a direct differentiator here.',
    next_action: 'Complete AIGP prep vault flashcards',
  },
  {
    title:       'Internal Audit Manager — SAP ERP',
    company:     'Toyota Financial Services',
    apply_url:   'https://jobs.toyota.com',
    match_score: 76,
    stage:       'wishlist',
    notes:       'Torrance, CA — 5 min from home base. SAP ERP experience is a perfect match.',
    next_action: 'Connect with Toyota TA on LinkedIn',
  },
];

const POOJA_SEED_CARDS = [
  {
    title:       'Postdoctoral Researcher — Cardiovascular Molecular Biology',
    company:     'UCLA Cardiovascular Research Lab',
    apply_url:   'https://jobs.ucla.edu',
    match_score: 91,
    stage:       'wishlist',
    notes:       'PI Dr. Chen lab — cardiac fibrosis and RNA-seq focus. Strong publication overlap.',
    next_action: 'Draft cover letter emphasising RNA-seq & in vivo expertise',
  },
  {
    title:       'Scientist II — Cardiovascular In Vivo',
    company:     'Amgen',
    apply_url:   'https://careers.amgen.com',
    match_score: 85,
    stage:       'wishlist',
    notes:       'Thousand Oaks, CA. In vivo mouse model requirement is an exact skill match.',
    next_action: 'Update CV with quantitative phenotyping metrics',
  },
  {
    title:       'Bioinformatics Scientist — Transcriptomics',
    company:     'AstraZeneca',
    apply_url:   'https://careers.astrazeneca.com',
    match_score: 80,
    stage:       'wishlist',
    notes:       'Remote eligible. RNA-seq + DESeq2 pipeline experience directly applicable.',
    next_action: 'Prepare bioinformatics portfolio with GitHub links',
  },
  {
    title:       'Research Scientist — Cardiac Physiology',
    company:     'Cedars-Sinai Medical Center',
    apply_url:   'https://www.cedars-sinai.edu/careers',
    match_score: 77,
    stage:       'wishlist',
    notes:       'Translational research role bridging basic science and clinical outcomes.',
    next_action: 'Request intro from mutual connection at Cedars',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split a SQL file into individual statements, respecting:
 *  - Dollar-quoted blocks  $$ ... $$  (PL/pgSQL function bodies)
 *  - DO $$ ... END $$; blocks
 *  - Standard semicolon delimiters outside quoted blocks
 */
function splitStatements(sql: string): string[] {
  const stmts: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let i = 0;

  while (i < sql.length) {
    // Detect start/end of dollar-quote  ($$  or  $tag$)
    if (sql[i] === '$') {
      const end = sql.indexOf('$', i + 1);
      if (end !== -1) {
        const tag = sql.slice(i, end + 1);
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
          current += tag;
          i = end + 1;
          continue;
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
          current += tag;
          i = end + 1;
          continue;
        }
      }
    }

    if (!inDollarQuote && sql[i] === ';') {
      const stmt = current.trim();
      if (stmt) stmts.push(stmt);
      current = '';
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  const last = current.trim();
  if (last) stmts.push(last);
  return stmts;
}

/** Pg error codes that are safe to skip during schema application */
const ALREADY_EXISTS = new Set([
  '42710', // duplicate_object        (type, role, policy already exists)
  '42P07', // duplicate_table         (table already exists)
  '42P16', // invalid_table_definition (RLS already enabled)
  '42723', // duplicate_function       (function already exists)
  '23505', // unique_violation         (GRANT idempotency edge case)
  '42703', // undefined_column         (column missing from simplified table — index skipped)
  '42883', // undefined_function       (cast to missing enum type — skipped)
  '42704', // undefined_object         (type/role doesn't exist for DROP IF EXISTS)
  '0A000', // feature_not_supported    (e.g. RLS not supported on this tier)
  '42P01', // undefined_table          (DROP on non-existent table)
  '42601', // syntax_error in DO block with unknown type
]);

async function runSchema(schemaClient: any): Promise<void> {
  const schemaPath = path.join(__dirname, '..', 'src', 'db', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.warn('⚠  schema.sql not found at', schemaPath, '— skipping DDL step.');
    return;
  }
  const sql   = fs.readFileSync(schemaPath, 'utf8');
  const stmts = splitStatements(sql).filter(s => !s.startsWith('--') && s.length > 0);
  console.log(`📐  Applying schema DDL (${stmts.length} statements)…`);

  let applied = 0;
  let skipped = 0;
  let failed  = 0;

  // DDL runs in its own transaction with a SAVEPOINT per statement.
  // This prevents a single failure from poisoning the entire connection (25P02).
  await schemaClient.query('BEGIN');

  for (const stmt of stmts) {
    const sp = `sp_${applied + skipped + failed}`;
    await schemaClient.query(`SAVEPOINT ${sp}`);
    try {
      await schemaClient.query(stmt);
      await schemaClient.query(`RELEASE SAVEPOINT ${sp}`);
      applied++;
    } catch (err: any) {
      // Roll back only this statement; leave the transaction alive
      await schemaClient.query(`ROLLBACK TO SAVEPOINT ${sp}`);

      if (
        ALREADY_EXISTS.has(err.code) ||
        err.message?.toLowerCase().includes('already exists') ||
        err.message?.toLowerCase().includes('does not exist')
      ) {
        skipped++;
      } else {
        // Unexpected error — log it but keep going (best-effort DDL)
        console.warn(`   ⚠  Skipped: ${stmt.slice(0, 80).replace(/\n/g, ' ')} → ${err.message} (${err.code})`);
        failed++;
      }
    }
  }

  await schemaClient.query('COMMIT');
  console.log(`✅  Schema ready — ${applied} applied, ${skipped} skipped, ${failed} warnings.`);
}

async function seedCards(
  client: any,
  profileId: 'dj' | 'pooja',
  cards: typeof DJ_SEED_CARDS,
): Promise<void> {
  console.log(`\n🌱  Seeding ${cards.length} cards for profile "${profileId}"…`);
  await client.query(`SET LOCAL app.current_profile = '${profileId}'`);

  for (const card of cards) {
    // Skip if a card with the same title+company already exists for this profile
    const { rows } = await client.query(
      `SELECT id FROM kanban_cards WHERE profile_id = $1 AND title = $2 AND company = $3 LIMIT 1`,
      [profileId, card.title, card.company],
    );
    if (rows.length > 0) {
      console.log(`   ⏭   Already exists: "${card.title}" @ ${card.company}`);
      continue;
    }
    await client.query(
      `INSERT INTO kanban_cards
         (profile_id, title, company, apply_url, match_score, stage, notes, next_action)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        profileId,
        card.title,
        card.company,
        card.apply_url,
        card.match_score,
        card.stage,
        card.notes,
        card.next_action,
      ],
    );
    console.log(`   ✓   "${card.title}" @ ${card.company}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🚀  Career OS seed script starting…');
  console.log(`    DB: ${DATABASE_URL!.replace(/:([^:@]+)@/, ':***@')}\n`);

  // ── Phase 1: DDL — own connection + savepoint-per-statement ──────────────
  const schemaClient = await pool.connect();
  try {
    await runSchema(schemaClient);
  } finally {
    schemaClient.release();
  }

  // ── Phase 2: Seed data — separate connection, single transaction ──────────
  const seedClient = await pool.connect();
  try {
    await seedClient.query('BEGIN');
    await seedCards(seedClient, 'dj',    DJ_SEED_CARDS);
    await seedCards(seedClient, 'pooja', POOJA_SEED_CARDS);
    await seedClient.query('COMMIT');
    console.log('\n✅  Seed complete.');
  } catch (err) {
    await seedClient.query('ROLLBACK');
    console.error('\n❌  Seed failed — transaction rolled back:', err);
    process.exit(1);
  } finally {
    seedClient.release();
    await pool.end();
  }
}

main();
