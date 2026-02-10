-- ============================================================
-- OpenJoey: User Watchlist, Favorite Skills, Skill Use Tracking
-- Adds 3 new tables alongside existing schema. No changes to
-- existing tables (users, alerts, sessions, etc.).
-- ============================================================

-- 1. user_watchlist: tokens/stocks/penny stocks the user is watching
CREATE TABLE IF NOT EXISTS user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  symbol_type text NOT NULL DEFAULT 'crypto_token'
    CHECK (symbol_type IN ('crypto_token', 'stock', 'penny_stock')),
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON user_watchlist(user_id);

-- RLS: service role bypasses; enable for safety
ALTER TABLE user_watchlist ENABLE ROW LEVEL SECURITY;

-- 2. user_favorite_skills: skills the user has favorited
CREATE TABLE IF NOT EXISTS user_favorite_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  category text,
  added_at timestamptz NOT NULL DEFAULT now(),
  usage_count integer NOT NULL DEFAULT 0,
  last_used timestamptz,
  settings jsonb,
  UNIQUE (user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_skills_user_id ON user_favorite_skills(user_id);

ALTER TABLE user_favorite_skills ENABLE ROW LEVEL SECURITY;

-- 3. user_skill_use: per-skill use counts (drives "Favorite this skill?" prompt)
CREATE TABLE IF NOT EXISTS user_skill_use (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  use_count integer NOT NULL DEFAULT 0,
  last_used timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_user_skill_use_user_id ON user_skill_use(user_id);

ALTER TABLE user_skill_use ENABLE ROW LEVEL SECURITY;
