"use strict";
/**
 * db/init.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates all required tables on server startup.
 * Uses CREATE TABLE IF NOT EXISTS — safe to run on every boot.
 * Falls back gracefully if DB is not reachable (non-fatal).
 * ─────────────────────────────────────────────────────────────────────────────
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbInit = dbInit;
const db_1 = __importDefault(require("../db"));
async function dbInit() {
    let client;
    try {
        client = await db_1.default.connect();
    }
    catch (err) {
        console.error('⚠️  dbInit connect failed (non-fatal):', err.message);
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
    `);
        console.log('✅ DB tables verified / created');
    }
    catch (err) {
        // Non-fatal: log and continue — app can still serve Adzuna jobs without DB
        console.error('⚠️  dbInit failed (non-fatal):', err.message);
    }
    finally {
        client.release();
    }
}
