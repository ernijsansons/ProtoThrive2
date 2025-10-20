-- Materialized view cache for dashboard performance
-- Migration 009: Dashboard Performance Optimization
-- Created: 2025-10-07

-- User dashboard cache table
CREATE TABLE IF NOT EXISTS user_dashboard_cache (
    user_id TEXT PRIMARY KEY,
    total_roadmaps INTEGER DEFAULT 0,
    active_roadmaps INTEGER DEFAULT 0,
    completed_roadmaps INTEGER DEFAULT 0,
    avg_thrive_score REAL DEFAULT 0.0,
    total_agent_tasks INTEGER DEFAULT 0,
    total_cost_usd REAL DEFAULT 0.0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dashboard_cache_updated ON user_dashboard_cache(last_updated);

-- Trigger to update cache on roadmap changes
CREATE TRIGGER IF NOT EXISTS update_dashboard_cache_roadmaps
AFTER INSERT OR UPDATE OR DELETE ON roadmaps
FOR EACH ROW
BEGIN
    INSERT OR REPLACE INTO user_dashboard_cache (
        user_id,
        total_roadmaps,
        active_roadmaps,
        completed_roadmaps,
        avg_thrive_score,
        last_updated
    )
    SELECT
        user_id,
        COUNT(*) as total_roadmaps,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_roadmaps,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_roadmaps,
        AVG(COALESCE(thrive_score, 0.0)) as avg_thrive_score,
        datetime('now') as last_updated
    FROM roadmaps
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    GROUP BY user_id;
END;

-- Trigger to update agent task stats
CREATE TRIGGER IF NOT EXISTS update_dashboard_cache_agents
AFTER INSERT OR UPDATE ON agent_logs
FOR EACH ROW
BEGIN
    UPDATE user_dashboard_cache
    SET
        total_agent_tasks = (
            SELECT COUNT(*)
            FROM agent_logs al
            JOIN roadmaps r ON al.roadmap_id = r.id
            WHERE r.user_id = (SELECT user_id FROM roadmaps WHERE id = NEW.roadmap_id)
        ),
        total_cost_usd = (
            SELECT COALESCE(SUM(cost_usd), 0.0)
            FROM agent_logs al
            JOIN roadmaps r ON al.roadmap_id = r.id
            WHERE r.user_id = (SELECT user_id FROM roadmaps WHERE id = NEW.roadmap_id)
        ),
        last_updated = datetime('now')
    WHERE user_id = (SELECT user_id FROM roadmaps WHERE id = NEW.roadmap_id);
END;
