/**
 * db/init.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates all required tables on server startup.
 * Uses CREATE TABLE IF NOT EXISTS — safe to run on every boot.
 * Falls back gracefully if DB is not reachable (non-fatal).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import db from '../db';
import { validateJobSuitability, TIER1_ORG_NAMES, PIPELINE_VERSION } from '../opportunity-monitor/validateJobSuitability';

export async function dbInit(): Promise<void> {
  let client;
  try {
    client = await db.connect();
  } catch (err) {
    console.error('⚠️  dbInit connect failed (non-fatal):', (err as Error).message);
    return;
  }
  try {
    await client.query(`
      -- Jobs cache (Adzuna + Web Search results)
      CREATE TABLE IF NOT EXISTS jobs (
        id               TEXT         PRIMARY KEY,
        profile_id       VARCHAR(10)  NOT NULL,
        title            TEXT         NOT NULL,
        company          TEXT         NOT NULL,
        location         TEXT         NOT NULL DEFAULT '',
        region           TEXT         NOT NULL DEFAULT 'US',
        description      TEXT,
        skills           TEXT[]       NOT NULL DEFAULT '{}',
        experience_level TEXT,
        employment_type  TEXT,
        remote           BOOLEAN      NOT NULL DEFAULT FALSE,
        hybrid           BOOLEAN      NOT NULL DEFAULT FALSE,
        visa_sponsorship BOOLEAN      NOT NULL DEFAULT FALSE,
        salary_min       NUMERIC,
        salary_max       NUMERIC,
        salary_currency  TEXT,
        job_board        TEXT         NOT NULL DEFAULT 'Adzuna',
        apply_url        TEXT         NOT NULL DEFAULT '#',
        posted_date      TIMESTAMPTZ,
        match_score      SMALLINT,
        normalized       BOOLEAN      NOT NULL DEFAULT TRUE,
        fetched_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_jobs_profile ON jobs (profile_id);
      CREATE INDEX IF NOT EXISTS idx_jobs_region  ON jobs (profile_id, region);
      CREATE INDEX IF NOT EXISTS idx_jobs_score   ON jobs (profile_id, match_score DESC);

      -- Kanban / Application Tracker
      CREATE TABLE IF NOT EXISTS kanban_cards (
        id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id   VARCHAR(10)  NOT NULL,
        job_id       TEXT,
        title        TEXT         NOT NULL,
        company      TEXT         NOT NULL DEFAULT '',
        apply_url    TEXT,
        match_score  SMALLINT,
        stage        TEXT         NOT NULL DEFAULT 'wishlist',
        notes        TEXT,
        next_action  TEXT,
        deadline     DATE,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_kanban_profile ON kanban_cards (profile_id);
      CREATE INDEX IF NOT EXISTS idx_kanban_stage   ON kanban_cards (profile_id, stage);

      -- AI response cache
      CREATE TABLE IF NOT EXISTS ai_cache (
        id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id   VARCHAR(10)  NOT NULL,
        cache_key    TEXT         NOT NULL,
        response     TEXT         NOT NULL,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '6 hours',
        CONSTRAINT uq_ai_cache_key UNIQUE (cache_key)
      );
      CREATE INDEX IF NOT EXISTS idx_ai_cache_profile ON ai_cache (profile_id);
      CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry  ON ai_cache (expires_at);

      -- Prep Vault progress tracking
      CREATE TABLE IF NOT EXISTS prep_progress (
        id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id   VARCHAR(10)  NOT NULL,
        card_key     TEXT         NOT NULL,
        mastered     BOOLEAN      NOT NULL DEFAULT FALSE,
        last_seen_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_prep_progress UNIQUE (profile_id, card_key)
      );
      CREATE INDEX IF NOT EXISTS idx_prep_profile ON prep_progress (profile_id);

      -- Opportunity Monitor tables
      CREATE TABLE IF NOT EXISTS monitor_orgs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        sector VARCHAR(50) NOT NULL
          CHECK (sector IN ('academia','industry','international','india')),
        country VARCHAR(100) NOT NULL DEFAULT 'USA',
        careers_url TEXT,
        rss_url TEXT,
        api_type VARCHAR(50)
          CHECK (api_type IN ('rss','usajobs','websearch','adzuna','natureJobs')),
        is_active BOOLEAN DEFAULT TRUE,
        last_scanned_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS monitor_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES monitor_orgs(id) ON DELETE CASCADE,
        external_id VARCHAR(500) NOT NULL,
        title VARCHAR(500) NOT NULL,
        org_name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        country VARCHAR(100),
        sector VARCHAR(50),
        apply_url TEXT,
        snippet TEXT,
        salary VARCHAR(100),
        posted_date VARCHAR(100),
        detected_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        is_new BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        content_hash VARCHAR(64),
        UNIQUE(org_id, external_id)
      );

      CREATE TABLE IF NOT EXISTS monitor_scans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id UUID REFERENCES monitor_orgs(id) ON DELETE CASCADE,
        scanned_at TIMESTAMPTZ DEFAULT NOW(),
        jobs_found INTEGER DEFAULT 0,
        new_jobs INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'success',
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_monitor_jobs_sector
        ON monitor_jobs(sector);
      CREATE INDEX IF NOT EXISTS idx_monitor_jobs_new
        ON monitor_jobs(is_new, detected_at DESC);
      CREATE INDEX IF NOT EXISTS idx_monitor_jobs_org
        ON monitor_jobs(org_id);
      CREATE INDEX IF NOT EXISTS idx_monitor_jobs_active
        ON monitor_jobs(is_active, last_seen_at);
      CREATE INDEX IF NOT EXISTS idx_monitor_orgs_sector
        ON monitor_orgs(sector, is_active);
      CREATE INDEX IF NOT EXISTS idx_monitor_scans_time
        ON monitor_scans(scanned_at DESC);
      CREATE INDEX IF NOT EXISTS idx_monitor_scans_org
        ON monitor_scans(org_id, scanned_at DESC);

      -- ─── Idempotent column migrations (safe to run every boot) ───────────────
      ALTER TABLE jobs         ADD COLUMN IF NOT EXISTS job_board TEXT         DEFAULT 'Adzuna';
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS job_board VARCHAR(100);
      ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS job_board VARCHAR(100);
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS high_suitability BOOLEAN     DEFAULT FALSE;
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS match_score      NUMERIC(3,1) DEFAULT 0;
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS fail_reason      TEXT;

      -- Pipeline version gate: tracks which validation version last ran.
      -- revalidateAllJobs() checks this and skips if already up to date.
      CREATE TABLE IF NOT EXISTS db_meta (
        key        TEXT        PRIMARY KEY,
        value      TEXT        NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Convert match_score from legacy SMALLINT×10 format to real NUMERIC(3,1).
      -- Safe to run every boot: only fires when the column is still SMALLINT.
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'monitor_jobs'
            AND column_name = 'match_score'
            AND data_type   = 'smallint'
        ) THEN
          ALTER TABLE monitor_jobs
            ALTER COLUMN match_score TYPE NUMERIC(3,1)
            USING (match_score::NUMERIC / 10);
        END IF;
      END $$;

      -- ─── DJ table column migrations ───────────────────────────────────────────
      -- These run on every boot (ADD COLUMN IF NOT EXISTS is idempotent).
      -- Required because CREATE TABLE IF NOT EXISTS does nothing on existing tables,
      -- so any column added after the initial table creation must be migrated here.
      ALTER TABLE dj_monitor_orgs ADD COLUMN IF NOT EXISTS rss_url          TEXT;
      ALTER TABLE dj_monitor_orgs ADD COLUMN IF NOT EXISTS careers_url      TEXT;
      ALTER TABLE dj_monitor_orgs ADD COLUMN IF NOT EXISTS ead_friendly     BOOLEAN DEFAULT FALSE;
      ALTER TABLE dj_monitor_orgs ADD COLUMN IF NOT EXISTS managerial_grade BOOLEAN DEFAULT FALSE;

      ALTER TABLE dj_monitor_jobs ADD COLUMN IF NOT EXISTS content_hash     VARCHAR(64);
      ALTER TABLE dj_monitor_jobs ADD COLUMN IF NOT EXISTS high_suitability BOOLEAN  DEFAULT FALSE;
      ALTER TABLE dj_monitor_jobs ADD COLUMN IF NOT EXISTS ead_friendly     BOOLEAN  DEFAULT FALSE;
      ALTER TABLE dj_monitor_jobs ADD COLUMN IF NOT EXISTS managerial_grade BOOLEAN  DEFAULT FALSE;
      ALTER TABLE dj_monitor_jobs ADD COLUMN IF NOT EXISTS suitability_score SMALLINT DEFAULT 0;
      ALTER TABLE dj_monitor_jobs ADD COLUMN IF NOT EXISTS last_seen_at     TIMESTAMPTZ DEFAULT NOW();

      -- ─── DJ Opportunity Monitor — isolated tables (no crossover with Pooja) ──

      CREATE TABLE IF NOT EXISTS dj_monitor_orgs (
        id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        name             VARCHAR(255) NOT NULL UNIQUE,
        sector           VARCHAR(50)  NOT NULL
          CHECK (sector IN ('big4','banking','tech-cloud','manufacturing')),
        country          VARCHAR(10)  NOT NULL DEFAULT 'USA'
          CHECK (country IN ('USA','India')),
        careers_url      TEXT,
        api_type         VARCHAR(50)  DEFAULT 'websearch',
        ead_friendly     BOOLEAN      DEFAULT FALSE,
        managerial_grade BOOLEAN      DEFAULT FALSE,
        is_active        BOOLEAN      DEFAULT TRUE,
        last_scanned_at  TIMESTAMPTZ,
        created_at       TIMESTAMPTZ  DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS dj_monitor_jobs (
        id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id           UUID         REFERENCES dj_monitor_orgs(id) ON DELETE CASCADE,
        external_id      VARCHAR(500) NOT NULL,
        title            VARCHAR(500) NOT NULL,
        org_name         VARCHAR(255) NOT NULL,
        location         VARCHAR(255),
        country          VARCHAR(10),
        sector           VARCHAR(50),
        apply_url        TEXT,
        snippet          TEXT,
        posted_date      VARCHAR(100),
        detected_at      TIMESTAMPTZ  DEFAULT NOW(),
        last_seen_at     TIMESTAMPTZ  DEFAULT NOW(),
        is_new           BOOLEAN      DEFAULT TRUE,
        is_active        BOOLEAN      DEFAULT TRUE,
        content_hash     VARCHAR(64),
        high_suitability BOOLEAN      DEFAULT FALSE,
        ead_friendly     BOOLEAN      DEFAULT FALSE,
        managerial_grade BOOLEAN      DEFAULT FALSE,
        suitability_score SMALLINT    DEFAULT 0,
        UNIQUE(org_id, external_id)
      );

      CREATE TABLE IF NOT EXISTS dj_monitor_scans (
        id            UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
        org_id        UUID       REFERENCES dj_monitor_orgs(id) ON DELETE CASCADE,
        scanned_at    TIMESTAMPTZ DEFAULT NOW(),
        jobs_found    INTEGER     DEFAULT 0,
        new_jobs      INTEGER     DEFAULT 0,
        status        VARCHAR(20) DEFAULT 'success',
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_dj_monitor_jobs_sector
        ON dj_monitor_jobs(sector);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_jobs_country
        ON dj_monitor_jobs(country, is_active);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_jobs_new
        ON dj_monitor_jobs(is_new, detected_at DESC);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_jobs_org
        ON dj_monitor_jobs(org_id);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_jobs_active
        ON dj_monitor_jobs(is_active, last_seen_at);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_jobs_score
        ON dj_monitor_jobs(suitability_score DESC);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_orgs_sector
        ON dj_monitor_orgs(sector, is_active);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_orgs_country
        ON dj_monitor_orgs(country, is_active);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_scans_time
        ON dj_monitor_scans(scanned_at DESC);
      CREATE INDEX IF NOT EXISTS idx_dj_monitor_scans_org
        ON dj_monitor_scans(org_id, scanned_at DESC);
    `);
    console.log('✅ DB tables verified / created');
  } catch (err) {
    // Non-fatal: log and continue — app can still serve Adzuna jobs without DB
    console.error('⚠️  dbInit failed (non-fatal):', (err as Error).message);
  } finally {
    client.release();
  }

  // ── Versioned data cleanup — only runs when PIPELINE_VERSION changes ─────────
  await revalidateAllJobs();
}

/**
 * Re-runs every monitor_jobs row through the Zero-Trust pipeline and writes
 * back high_suitability, match_score (real float), and fail_reason.
 *
 * Gated by PIPELINE_VERSION stored in db_meta — skips entirely if the current
 * version has already been applied, so subsequent restarts are O(1) not O(n).
 * Version is bumped in validateJobSuitability.ts whenever scoring/blacklist
 * logic changes, triggering a fresh re-clean on next deploy.
 */
async function revalidateAllJobs(): Promise<void> {
  let client;
  try {
    client = await db.connect();
  } catch {
    return; // DB unreachable — skip silently
  }
  try {
    // ── Version check: skip if already applied ────────────────────────────────
    const { rows: [meta] } = await client.query<{ value: string }>(
      `SELECT value FROM db_meta WHERE key = 'pipeline_version'`
    );
    if (meta?.value === PIPELINE_VERSION) {
      console.log(`[CLEANUP] Pipeline ${PIPELINE_VERSION} already applied — skipping.`);
      return;
    }

    // ── Fetch all jobs across all sectors ────────────────────────────────────
    const { rows } = await client.query<{
      id:               string;
      title:            string;
      snippet:          string | null;
      apply_url:        string | null;
      org_name:         string;
      sector:           string;
      high_suitability: boolean;
    }>(
      `SELECT id, title, snippet, apply_url, org_name, sector, high_suitability
       FROM monitor_jobs`
    );

    console.log(`[CLEANUP] Pipeline ${PIPELINE_VERSION}: revalidating ${rows.length} jobs…`);
    let demoted = 0;
    let promoted = 0;

    for (const job of rows) {
      const result = validateJobSuitability(
        job.title, job.snippet, job.apply_url, job.org_name, TIER1_ORG_NAMES
      );
      await client.query(
        `UPDATE monitor_jobs
            SET high_suitability = $1,
                match_score      = $2,
                fail_reason      = $3
          WHERE id = $4`,
        [result.highSuitability, result.matchScore, result.failReason ?? null, job.id]
      );
      if (job.high_suitability && !result.highSuitability) {
        console.log(`[CLEANUP] Demoting "${job.title}" [${job.sector}] - ${result.failReason}`);
        demoted++;
      } else if (!job.high_suitability && result.highSuitability) {
        promoted++;
      }
    }

    // ── Mark this version as applied ─────────────────────────────────────────
    await client.query(
      `INSERT INTO db_meta (key, value, updated_at)
       VALUES ('pipeline_version', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [PIPELINE_VERSION]
    );

    console.log(
      `[CLEANUP] Done. ${demoted} demoted, ${promoted} promoted. ` +
      `Version ${PIPELINE_VERSION} recorded.`
    );
  } catch (err) {
    console.error('[CLEANUP] Revalidation error (non-fatal):', (err as Error).message);
  } finally {
    client.release();
  }
}
