-- RLS Policies for OpenJoey V2 Tables

-- 1. Enable RLS on all new tables
ALTER TABLE IF EXISTS skill_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS skill_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_quotas ENABLE ROW LEVEL SECURITY;

-- 2. skill_usage policies
-- Users can view their own usage
CREATE POLICY "Users can view own skill_usage" ON skill_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access skill_usage" ON skill_usage
  FOR ALL USING (auth.role() = 'service_role');

-- 3. audit_log policies
-- Users can view their own logs
CREATE POLICY "Users can view own audit_log" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access audit_log" ON audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- 4. skill_catalog policies
-- Everyone can read the catalog
CREATE POLICY "Anyone can read skill_catalog" ON skill_catalog
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access skill_catalog" ON skill_catalog
  FOR ALL USING (auth.role() = 'service_role');

-- 5. analysis_cache policies
-- Anyone can read the cache
CREATE POLICY "Anyone can read analysis_cache" ON analysis_cache
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access analysis_cache" ON analysis_cache
  FOR ALL USING (auth.role() = 'service_role');

-- 6. user_quotas policies
-- Users can view their own quotas
CREATE POLICY "Users can view own user_quotas" ON user_quotas
  FOR SELECT USING (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access user_quotas" ON user_quotas
  FOR ALL USING (auth.role() = 'service_role');
