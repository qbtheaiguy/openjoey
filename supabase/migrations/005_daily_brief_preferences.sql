-- ============================================================
-- OpenJoey: Daily brief user preferences
-- ============================================================

-- Add columns to users for daily brief opt-out and pause
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS daily_brief_opted_in boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS daily_brief_paused_until timestamptz;

COMMENT ON COLUMN users.daily_brief_opted_in IS 'When true, user receives the morning daily brief. Default true.';
COMMENT ON COLUMN users.daily_brief_paused_until IS 'When set, user does not receive the brief until this time (UTC). Used for "pause 7d/30d".';
