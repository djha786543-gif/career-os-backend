-- Career OS — Railway schema injection
-- Executed via local psql bridge

CREATE OR REPLACE FUNCTION set_job_expires_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.expires_at := NEW.fetched_at + INTERVAL '45 minutes';
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS jobs (
  id          SERIAL PRIMARY KEY,
  profile_id  VARCHAR(50),
  title       VARCHAR(255),
  company     VARCHAR(255),
  location    VARCHAR(255),
  description TEXT,
  apply_url   TEXT,
  salary      VARCHAR(100),
  is_remote   BOOLEAN,
  source      VARCHAR(50),
  match_score INTEGER,
  fetched_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at  TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS kanban_cards (
  id          SERIAL PRIMARY KEY,
  profile_id  VARCHAR(50)  NOT NULL,
  job_id      VARCHAR(255),
  title       VARCHAR(255) NOT NULL,
  company     VARCHAR(255) NOT NULL,
  location    VARCHAR(255),
  salary      VARCHAR(100),
  apply_url   TEXT,
  match_score INTEGER  DEFAULT 0,
  stage       VARCHAR(50)  DEFAULT 'wishlist',
  is_remote   BOOLEAN      DEFAULT false,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trigger_set_job_expires ON jobs;
CREATE TRIGGER trigger_set_job_expires
  BEFORE INSERT ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_job_expires_at();
