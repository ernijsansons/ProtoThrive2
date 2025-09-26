-- ProtoThrive Production Database Schema
-- Cloudflare D1 Database Migration 001
-- Created: September 20, 2025

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'vibe_coder',
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    deleted_at REAL NULL
);

-- Create index on email for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    json_graph TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
    status TEXT NOT NULL DEFAULT 'draft',
    vibe_mode BOOLEAN NOT NULL DEFAULT FALSE,
    thrive_score REAL NOT NULL DEFAULT 0.0,
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    deleted_at REAL NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status ON roadmaps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_updated ON roadmaps(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_roadmaps_deleted_at ON roadmaps(deleted_at);

-- Code snippets table
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL DEFAULT 'general',
    code TEXT NOT NULL,
    ui_preview_url TEXT,
    version INTEGER NOT NULL DEFAULT 1
);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);
CREATE INDEX IF NOT EXISTS idx_snippets_category_version ON snippets(category, version);

-- Agent execution logs table
CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY,
    roadmap_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    output TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    model_used TEXT NOT NULL DEFAULT 'unknown',
    token_count INTEGER NOT NULL DEFAULT 0,
    timestamp REAL NOT NULL,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

-- Create index on roadmap_id for fast retrieval
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_timestamp ON agent_logs(roadmap_id, timestamp);

-- Performance insights table
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY,
    roadmap_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'performance',
    data TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0.0,
    created_at REAL NOT NULL,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

-- Create index on roadmap_id and type
CREATE INDEX IF NOT EXISTS idx_insights_roadmap_id ON insights(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_insights_roadmap_type ON insights(roadmap_id, type);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);

-- Insert some initial data for testing
INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at) VALUES
('user_demo_001', 'demo@protothrive.com', 'vibe_coder', strftime('%s', 'now'), strftime('%s', 'now'));
-- Admin user must be created through secure environment setup, not hardcoded
-- ('user_admin_001', 'ADMIN_EMAIL_FROM_ENV', 'admin', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert demo roadmap
INSERT OR IGNORE INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at) VALUES
('roadmap_demo_001', 'user_demo_001', '{"nodes":[{"id":"n1","label":"Thermonuclear Start","status":"completed","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Optimization Phase","status":"in_progress","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"Production Launch","status":"pending","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}', 'active', TRUE, 0.87, strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert sample code snippets
INSERT OR IGNORE INTO snippets (id, category, code, ui_preview_url, version) VALUES
('snippet_001', 'ui', 'export const ThermoButton = () => <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition-transform">Thermonuclear Action</button>;', 'thermo_button.png', 1),
('snippet_002', 'api', 'async function fetchRoadmap(id) { const response = await fetch(`/api/roadmaps/${id}`); return response.json(); }', '', 1),
('snippet_003', 'cache', 'const cacheKey = `roadmap_${id}`; const cached = await env.KV.get(cacheKey); if (cached) return JSON.parse(cached);', '', 1);

-- Insert sample agent log
INSERT OR IGNORE INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, timestamp) VALUES
('log_001', 'roadmap_demo_001', 'ui_generation', '// Generated thermonuclear UI component\nexport const OptimizedComponent = () => {\n  return <div className="neon-glow">Production Ready!</div>;\n};', 'completed', 'kimi', 150, strftime('%s', 'now'));

-- Insert sample insight
INSERT OR IGNORE INTO insights (id, roadmap_id, type, data, score, created_at) VALUES
('insight_001', 'roadmap_demo_001', 'performance', '{"optimization_score": 0.87, "cache_hit_rate": 0.94, "response_time_p50": 23.5, "features_active": ["argo_routing", "tiered_caching", "geographic_optimization"]}', 0.87, strftime('%s', 'now'));

-- Verify schema creation
SELECT 'Schema created successfully' as status;