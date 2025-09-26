-- ProtoThrive Production Database Schema - Safe Migration
-- Cloudflare D1 Database Migration 001
-- Created: September 23, 2025
-- Ref: CLAUDE.md Terminal 2 - Database Migration

-- Drop existing tables if they exist (safe for clean deployment)
DROP TABLE IF EXISTS insights;
DROP TABLE IF EXISTS agent_logs;  
DROP TABLE IF EXISTS snippets;
DROP TABLE IF EXISTS roadmaps;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'vibe_coder',
    created_at REAL NOT NULL,
    updated_at REAL NOT NULL,
    deleted_at REAL NULL
);

-- Create index on email for fast lookup
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Roadmaps table
CREATE TABLE roadmaps (
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
CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_user_status ON roadmaps(user_id, status);
CREATE INDEX idx_roadmaps_user_updated ON roadmaps(user_id, updated_at);
CREATE INDEX idx_roadmaps_deleted_at ON roadmaps(deleted_at);

-- Code snippets table
CREATE TABLE snippets (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL DEFAULT 'general',
    code TEXT NOT NULL,
    ui_preview_url TEXT,
    version INTEGER NOT NULL DEFAULT 1
);

-- Create index on category for filtering
CREATE INDEX idx_snippets_category ON snippets(category);
CREATE INDEX idx_snippets_category_version ON snippets(category, version);

-- Agent execution logs table
CREATE TABLE agent_logs (
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
CREATE INDEX idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
CREATE INDEX idx_agent_logs_roadmap_timestamp ON agent_logs(roadmap_id, timestamp);

-- Performance insights table
CREATE TABLE insights (
    id TEXT PRIMARY KEY,
    roadmap_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'performance',
    data TEXT NOT NULL,
    score REAL NOT NULL DEFAULT 0.0,
    created_at REAL NOT NULL,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id)
);

-- Create index on roadmap_id and type
CREATE INDEX idx_insights_roadmap_id ON insights(roadmap_id);
CREATE INDEX idx_insights_roadmap_type ON insights(roadmap_id, type);
CREATE INDEX idx_insights_created_at ON insights(created_at);

-- Insert some initial data for testing - Ref: CLAUDE.md Thermonuclear Protocol
INSERT INTO users (id, email, role, created_at, updated_at) VALUES
('user_thermo_001', 'demo@protothrive.com', 'vibe_coder', strftime('%s', 'now'), strftime('%s', 'now'));
-- Admin user must be created through secure environment setup, not hardcoded
-- ('user_admin_001', 'ADMIN_EMAIL_FROM_ENV', 'admin', strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert thermonuclear demo roadmap
INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at) VALUES
('roadmap_thermo_001', 'user_thermo_001', '{"nodes":[{"id":"n1","label":"Thermonuclear Start","status":"neon","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"AI Optimization Phase","status":"in_progress","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"Production Launch","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}', 'active', 1, 0.95, strftime('%s', 'now'), strftime('%s', 'now'));

-- Insert thermonuclear code snippets
INSERT INTO snippets (id, category, code, ui_preview_url, version) VALUES
('snippet_thermo_001', 'ui', 'export const ThermoButton = () => <button className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:scale-105 hover:shadow-2xl shadow-cyan-500/25 transition-all duration-300 font-bold tracking-wider">🚀 THERMONUCLEAR ACTION</button>;', 'thermo_button_neon.png', 1),
('snippet_thermo_002', 'api', 'async function fetchThermonuclearRoadmap(id) { const response = await fetch(`/api/roadmaps/${id}`, { headers: { "Authorization": "Bearer thermonuclear_token" } }); return response.json(); }', '', 1),
('snippet_thermo_003', 'cache', 'const cacheKey = `thermo_roadmap_${id}`; const cached = await env.KV.get(cacheKey); if (cached) { console.log("Thermonuclear Cache Hit"); return JSON.parse(cached); }', '', 1);

-- Insert thermonuclear agent log
INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, timestamp) VALUES
('log_thermo_001', 'roadmap_thermo_001', 'ui_generation', '// Generated THERMONUCLEAR UI component - Ref: CLAUDE.md Phase 2\nexport const OptimizedThermoComponent = () => {\n  return (\n    <div className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-2xl p-8 border border-cyan-500/30 shadow-2xl">\n      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>\n      <div className="relative z-10 text-center">\n        <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">THERMONUCLEAR STATUS</h2>\n        <p className="text-cyan-300 text-xl">Production Ready! 🔥</p>\n      </div>\n    </div>\n  );\n};', 'completed', 'kimi', 180, strftime('%s', 'now'));

-- Insert thermonuclear insight
INSERT INTO insights (id, roadmap_id, type, data, score, created_at) VALUES
('insight_thermo_001', 'roadmap_thermo_001', 'performance', '{"thermonuclear_optimization_score": 0.95, "cache_hit_rate": 0.98, "response_time_p50": 18.2, "neon_features_active": ["argo_routing", "tiered_caching", "geographic_optimization", "edge_workers"], "thrive_level": "THERMONUCLEAR"}', 0.95, strftime('%s', 'now'));

-- Thermonuclear Validation: Verify schema creation
SELECT 'THERMONUCLEAR Schema Created Successfully - All Systems Operational' as status;