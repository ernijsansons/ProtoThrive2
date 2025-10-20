-- Optimize database indexes for performance
-- Migration 006: Index Optimization
-- Created: 2025-10-07

-- Composite index for user roadmap queries with filters
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status_score
ON roadmaps(user_id, status, thrive_score DESC, updated_at DESC);

-- Index for agent log analysis
CREATE INDEX IF NOT EXISTS idx_agent_logs_task_status_time
ON agent_logs(task_type, status, timestamp DESC);

-- Index for audit log searches by action
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_resource
ON audit_logs(action, resource_type, timestamp DESC);

-- Covering index for snippet queries
CREATE INDEX IF NOT EXISTS idx_snippets_category_public_usage
ON snippets(category, is_public, usage_count DESC);

-- Session cleanup index
CREATE INDEX IF NOT EXISTS idx_sessions_expires
ON sessions(expires_at) WHERE expires_at < datetime('now');

-- Full-text search preparation (for future)
-- CREATE INDEX IF NOT EXISTS idx_roadmaps_title_fts ON roadmaps(title);
-- CREATE INDEX IF NOT EXISTS idx_snippets_title_fts ON snippets(title);

-- Analyze tables for query planner optimization
ANALYZE users;
ANALYZE roadmaps;
ANALYZE snippets;
ANALYZE agent_logs;
ANALYZE sessions;
ANALYZE audit_logs;

-- Verify index usage
-- Use: EXPLAIN QUERY PLAN SELECT ... to verify indexes are used
