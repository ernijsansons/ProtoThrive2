-- Security and Performance Indexes
-- Ref: CLAUDE.md Phase 6 - Database Security & Optimization

-- User indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Roadmap indexes for ownership and status queries
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status ON roadmaps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_updated_at ON roadmaps(updated_at);

-- Snippet indexes for category and version queries
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);
CREATE INDEX IF NOT EXISTS idx_snippets_version ON snippets(version);

-- Agent logs indexes for performance monitoring
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_model ON agent_logs(model_used);

-- Insights indexes for analytics
CREATE INDEX IF NOT EXISTS idx_insights_roadmap_id ON insights(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_score ON insights(score);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_updated ON roadmaps(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_timestamp ON agent_logs(roadmap_id, timestamp DESC);

-- Security: Add row-level security policies (if supported)
-- ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY roadmap_user_policy ON roadmaps FOR ALL TO authenticated
-- USING (user_id = current_user_id());

-- Performance: Analyze tables for query optimization
-- ANALYZE users;
-- ANALYZE roadmaps;
-- ANALYZE snippets;
-- ANALYZE agent_logs;
-- ANALYZE insights;