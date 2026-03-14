-- src/db/schema.sql
-- PostgreSQL schema for Career Intelligence Portal
-- IDEMPOTENT: safe to run multiple times (IF NOT EXISTS + DROP…IF EXISTS guards)
-- Profile isolation enforced on every table via profile_id enum + Row-Level Security

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM TYPES  (DO blocks so re-runs don't error on "already exists")
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE profile_id_enum AS ENUM ('dj', 'pooja');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE kanban_stage_enum AS ENUM (
    'wishlist', 'applied', 'phone_screen',
    'interview', 'offer', 'rejected', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE job_region_enum AS ENUM ('US', 'Europe', 'India');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE track_enum AS ENUM ('Academic', 'Industry');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- JOBS  (cached normalised job records, 45-min TTL)
--
-- NOTE: expires_at uses a BEFORE INSERT trigger instead of GENERATED ALWAYS AS.
-- Reason: timestamptz + interval is STABLE (not IMMUTABLE) in PostgreSQL because
-- it can reference the session TimeZone GUC, so GENERATED ALWAYS AS STORED
-- raises error 42P17 ("generation expression is not immutable").
-- The trigger achieves identical semantics: expires_at = fetched_at + 45 min.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id               TEXT            PRIMARY KEY,
  profile_id       profile_id_enum NOT NULL,
  title            TEXT            NOT NULL,
  company          TEXT            NOT NULL,
  location         TEXT            NOT NULL,
  region           job_region_enum NOT NULL,
  description      TEXT,
  skills           TEXT[]          NOT NULL DEFAULT '{}',
  experience_level TEXT,
  employment_type  TEXT,
  remote           BOOLEAN         NOT NULL DEFAULT FALSE,
  hybrid           BOOLEAN         NOT NULL DEFAULT FALSE,
  visa_sponsorship BOOLEAN         NOT NULL DEFAULT FALSE,
  salary_min       NUMERIC,
  salary_max       NUMERIC,
  salary_currency  TEXT,
  job_board        TEXT            NOT NULL,
  apply_url        TEXT            NOT NULL,
  posted_date      TIMESTAMPTZ,
  match_score      SMALLINT,                    -- 0-100
  normalized       BOOLEAN         NOT NULL DEFAULT TRUE,
  fetched_at       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at       TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP  -- set by trigger below
);

-- Trigger function: keeps expires_at = fetched_at + 45 min on every INSERT
CREATE OR REPLACE FUNCTION set_job_expires_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.expires_at := NEW.fetched_at + INTERVAL '45 minutes';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_expires_at ON jobs;
CREATE TRIGGER job_expires_at
  BEFORE INSERT ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_job_expires_at();

CREATE INDEX IF NOT EXISTS idx_jobs_profile ON jobs (profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_region  ON jobs (profile_id, region);
CREATE INDEX IF NOT EXISTS idx_jobs_score   ON jobs (profile_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_fetched ON jobs (fetched_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- KANBAN CARDS  (application tracker)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kanban_cards (
  id           UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   profile_id_enum   NOT NULL,
  -- soft FK: card survives after the job cache row expires
  job_id       TEXT              REFERENCES jobs(id) ON DELETE SET NULL,

  -- denormalised snapshot so the card is readable after cache expiry
  title        TEXT              NOT NULL,
  company      TEXT              NOT NULL,
  apply_url    TEXT,
  match_score  SMALLINT,

  stage        kanban_stage_enum NOT NULL DEFAULT 'wishlist',
  notes        TEXT,
  next_action  TEXT,
  deadline     DATE,

  created_at   TIMESTAMPTZ       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMPTZ       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kanban_profile ON kanban_cards (profile_id);
CREATE INDEX IF NOT EXISTS idx_kanban_stage   ON kanban_cards (profile_id, stage);

-- auto-maintain updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS kanban_updated_at ON kanban_cards;
CREATE TRIGGER kanban_updated_at
  BEFORE UPDATE ON kanban_cards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- AI CACHE  (Claude / web-search response store)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_cache (
  id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   profile_id_enum NOT NULL,
  -- SHA-256(profile_id || ':' || prompt) — prevents cross-profile cache poisoning
  cache_key    TEXT            NOT NULL,
  prompt       TEXT            NOT NULL,
  response     JSONB           NOT NULL,
  model        TEXT,
  tokens_used  INTEGER,
  created_at   TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP + INTERVAL '24 hours',

  CONSTRAINT uq_ai_cache_key UNIQUE (cache_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_profile ON ai_cache (profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expiry  ON ai_cache (expires_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- PREP VAULT PROGRESS  (flashcard / accordion mastery state)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prep_progress (
  id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   profile_id_enum NOT NULL,
  -- stable key from static PREP_VAULT data  e.g. "dj:sox:q1"
  card_key     TEXT            NOT NULL,
  mastered     BOOLEAN         NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_prep_progress UNIQUE (profile_id, card_key)
);

CREATE INDEX IF NOT EXISTS idx_prep_profile ON prep_progress (profile_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- Every query must SET LOCAL app.current_profile = 'dj' | 'pooja'
-- before touching any of these tables.
-- ALTER TABLE … ENABLE ROW LEVEL SECURITY is idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache      ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_progress ENABLE ROW LEVEL SECURITY;

-- Application role (DO block so re-runs don't fail)
DO $$ BEGIN
  CREATE ROLE career_app LOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Policies — drop first so ALTER TABLE doesn't complain about duplicates
DROP POLICY IF EXISTS profile_isolation ON jobs;
CREATE POLICY profile_isolation ON jobs
  USING (profile_id = current_setting('app.current_profile')::profile_id_enum);

DROP POLICY IF EXISTS profile_isolation ON kanban_cards;
CREATE POLICY profile_isolation ON kanban_cards
  USING (profile_id = current_setting('app.current_profile')::profile_id_enum);

DROP POLICY IF EXISTS profile_isolation ON ai_cache;
CREATE POLICY profile_isolation ON ai_cache
  USING (profile_id = current_setting('app.current_profile')::profile_id_enum);

DROP POLICY IF EXISTS profile_isolation ON prep_progress;
CREATE POLICY profile_isolation ON prep_progress
  USING (profile_id = current_setting('app.current_profile')::profile_id_enum);

-- Grants (GRANT is idempotent in PostgreSQL)
GRANT SELECT, INSERT, UPDATE, DELETE
  ON jobs, kanban_cards, ai_cache, prep_progress
  TO career_app;
