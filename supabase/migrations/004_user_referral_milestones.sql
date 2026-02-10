-- ============================================================
-- OpenJoey: Referral milestone nudge (§9.9)
-- Tracks which milestone messages we've already sent so we don't repeat.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_referral_milestones (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, milestone)
);

CREATE INDEX IF NOT EXISTS idx_user_referral_milestones_user_id ON user_referral_milestones(user_id);

ALTER TABLE user_referral_milestones ENABLE ROW LEVEL SECURITY;
