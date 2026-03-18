/**
 * db/init.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates all required tables on server startup.
 * Uses CREATE TABLE IF NOT EXISTS — safe to run on every boot.
 * Falls back gracefully if DB is not reachable (non-fatal).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import db from '../db';

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
      -- Adds job_board to tables created before this column existed in the schema
      ALTER TABLE jobs         ADD COLUMN IF NOT EXISTS job_board TEXT         DEFAULT 'Adzuna';
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS job_board VARCHAR(100);
      ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS job_board VARCHAR(100);
      ALTER TABLE monitor_jobs ADD COLUMN IF NOT EXISTS high_suitability BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ DB tables verified / created');
  } catch (err) {
    // Non-fatal: log and continue — app can still serve Adzuna jobs without DB
    console.error('⚠️  dbInit failed (non-fatal):', (err as Error).message);
  } finally {
    client.release();
  }
}
