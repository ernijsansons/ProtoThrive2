-- Ref: CLAUDE.md Terminal 1 Phase 1 - Database Schema
-- Thermonuclear Database Schema for ProtoThrive

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL UNIQUE,
    role TEXT CHECK (role IN ('vibe_coder', 'engineer', 'exec')) NOT NULL DEFAULT 'vibe_coder',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create index on email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Roadmaps table with multi-tenant support
CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    json_graph TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'archived')) NOT NULL DEFAULT 'draft',
    vibe_mode INTEGER NOT NULL DEFAULT 0, -- Boolean: 0 or 1
    thrive_score REAL NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for roadmaps
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_updated_at ON roadmaps(updated_at);
CREATE INDEX IF NOT EXISTS idx_roadmaps_composite ON roadmaps(user_id, status, updated_at);

-- Snippets table for code templates
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category TEXT NOT NULL,
    code TEXT NOT NULL,
    ui_preview_url TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on category for fast filtering
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);

-- Agent logs table for tracking AI operations
CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    output TEXT NOT NULL,
    status TEXT CHECK (status IN ('success', 'fail', 'timeout', 'escalated')) NOT NULL,
    model_used TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Create indexes for agent logs
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);

-- Insights table for analytics
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('performance', 'usage', 'quality', 'cost')) NOT NULL,
    data TEXT NOT NULL,
    score REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Create indexes for insights
CREATE INDEX IF NOT EXISTS idx_insights_roadmap_id ON insights(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);

-- Trigger to update updated_at timestamp on roadmaps
CREATE TRIGGER IF NOT EXISTS update_roadmaps_updated_at
AFTER UPDATE ON roadmaps
FOR EACH ROW
BEGIN
    UPDATE roadmaps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp on snippets
CREATE TRIGGER IF NOT EXISTS update_snippets_updated_at
AFTER UPDATE ON snippets
FOR EACH ROW
BEGIN
    UPDATE snippets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;