-- Update existing schema to match expected structure
-- This migration adds missing columns and tables

-- Update users table to add missing columns
ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL;

-- Update roadmaps table to add missing columns
ALTER TABLE roadmaps ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Roadmap';
ALTER TABLE roadmaps ADD COLUMN json_graph TEXT NOT NULL DEFAULT '{"nodes":[],"edges":[]}';
ALTER TABLE roadmaps ADD COLUMN status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft';
ALTER TABLE roadmaps ADD COLUMN vibe_mode BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE roadmaps ADD COLUMN visibility TEXT NOT NULL CHECK (visibility IN ('private', 'team', 'public')) DEFAULT 'private';
ALTER TABLE roadmaps ADD COLUMN completed_at DATETIME NULL;

-- Create missing tables
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'typescript',
    ui_preview_url TEXT,
    tags TEXT, -- JSON array of tags
    usage_count INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('planning', 'coding', 'ui', 'testing', 'deployment', 'audit')),
    agent_name TEXT NOT NULL,
    input_data TEXT, -- JSON data
    output TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'success', 'error', 'timeout')) DEFAULT 'pending',
    error_message TEXT,
    model_used TEXT,
    token_count INTEGER DEFAULT 0,
    cost_usd REAL DEFAULT 0.0,
    execution_time_ms INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('performance', 'quality', 'progress', 'cost', 'security')),
    data TEXT NOT NULL, -- JSON data with metrics
    score REAL NOT NULL DEFAULT 0.0 CHECK (score >= 0.0 AND score <= 1.0),
    recommendations TEXT, -- JSON array of recommendations
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category, is_public);
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_id ON agent_logs(roadmap_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_insights_roadmap_type ON insights(roadmap_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);

-- Insert some default data
INSERT OR IGNORE INTO snippets (id, category, title, code, language, is_public) VALUES
('sn-thermo-1', 'ui', 'Thermonuclear Button', 'console.log("Thermo UI Button");', 'javascript', true),
('sn-thermo-2', 'auth', 'Thermonuclear Auth', 'console.log("Thermo Auth");', 'typescript', true);