-- Patch kanban_cards: add columns the seed INSERT expects
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS notes        TEXT;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS next_action  TEXT;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE kanban_cards ADD COLUMN IF NOT EXISTS deadline     DATE;

-- Patch jobs: add region column so existing indexes don't error
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'US';
