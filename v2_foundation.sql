-- skill_usage table (for analytics + quotas)
CREATE TABLE IF NOT EXISTS skill_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_category TEXT, -- 'trading', 'research', 'alerts', etc.
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_usage_user ON skill_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_skill_usage_skill ON skill_usage(skill_name, created_at);

-- audit_log table (for security)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id, created_at);

-- skill_catalog table (dynamic skill definitions)
CREATE TABLE IF NOT EXISTS skill_catalog (
  id TEXT PRIMARY KEY, -- 'signal-fusion', 'trading-god', etc.
  display_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  allowed_tiers TEXT[] DEFAULT ARRAY['trial', 'trader', 'premium', 'annual'],
  blocked_tiers TEXT[] DEFAULT ARRAY['free'],
  cost_tier TEXT DEFAULT 'standard', -- 'free', 'standard', 'expensive'
  is_active BOOLEAN DEFAULT true,
  requires_api_keys TEXT[], -- ['HELIUS_API_KEY'] etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- analysis_cache table (for cost optimization)
CREATE TABLE IF NOT EXISTS analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL, -- 'stock', 'crypto', 'commodity', 'forex'
  asset_symbol TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'technical', 'sentiment', 'fundamental'
  content JSONB NOT NULL,
  embedding vector(1536), -- For QMD semantic search
  ttl_minutes INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  invalidated_reason TEXT,
  hit_count INTEGER DEFAULT 0,
  generation_cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ
);

-- Partial index with NOW() is invalid (predicate must be IMMUTABLE). Use full index.
CREATE INDEX IF NOT EXISTS idx_analysis_cache_lookup ON analysis_cache(asset_type, asset_symbol, analysis_type, is_valid);

-- quotas table (user-level limits)
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_skill_calls_used INTEGER DEFAULT 0,
  daily_expensive_skill_calls_used INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Views for analytics
CREATE OR REPLACE VIEW daily_skill_stats AS
SELECT
  date_trunc('day', created_at) as day,
  skill_name,
  COUNT(*) as call_count,
  SUM(cost_usd) as total_cost,
  AVG(execution_time_ms) as avg_time_ms,
  COUNT(CASE WHEN success THEN 1 END) as success_count
FROM skill_usage
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  u.id,
  u.telegram_username,
  u.tier,
  u.status,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(su.id) as total_skill_calls,
  SUM(su.cost_usd) as total_cost,
  MAX(su.created_at) as last_activity
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
LEFT JOIN skill_usage su ON u.id = su.user_id
GROUP BY u.id, u.telegram_username, u.tier, u.status;

-- Seed Skill Catalog
INSERT INTO skill_catalog (id, display_name, description, category, allowed_tiers, cost_tier) VALUES
('signal-guru', 'Signal Guru', 'Master multi-asset technical analyzer', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('research-guru', 'Research Guru', 'Institutional-grade deep research', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('crypto-guru', 'Crypto Guru', 'Crypto-specific deep dives', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('meme-guru', 'Meme Guru', 'Meme coin degen intelligence', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('stock-guru', 'Stock Guru', 'Stocks & ETFs analysis', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('forex-guru', 'Forex Guru', 'Currency pair analysis', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('commodity-guru', 'Commodity Guru', 'Gold, oil, commodities', 'trading', ARRAY['trial', 'trader', 'premium', 'annual'], 'standard'),
('options-guru', 'Options Guru', 'Options chain & Greeks', 'trading', ARRAY['premium', 'annual'], 'expensive'),
('whale-guru', 'Whale Guru', 'Whale tracking & smart money', 'research', ARRAY['trader', 'premium', 'annual'], 'standard'),
('alert-guru', 'Alert Guru', 'Price alert management', 'alerts', ARRAY['trial', 'trader', 'premium', 'annual'], 'free'),
('edy', 'Edy', 'Personalized trading assistant', 'trading', ARRAY['premium', 'annual'], 'standard')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  allowed_tiers = EXCLUDED.allowed_tiers,
  cost_tier = EXCLUDED.cost_tier;
