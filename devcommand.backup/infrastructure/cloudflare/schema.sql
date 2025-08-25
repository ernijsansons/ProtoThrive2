-- DevCommand Database Schema for Cloudflare D1
-- Multi-tenant SaaS with user isolation via user_id

-- Users table: Core user authentication and roles
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('vibe_coder', 'engineer', 'exec')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Index for role-based queries
CREATE INDEX idx_users_role_created ON users(role, created_at);

-- Roadmaps table: Core Living ERP Graph storage
CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    json_graph TEXT NOT NULL, -- JSON structure: {nodes: [], edges: []}
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'complete')),
    vibe_mode INTEGER DEFAULT 0, -- Boolean: 0 = false, 1 = true
    thrive_score REAL DEFAULT 0.0 CHECK (thrive_score >= 0 AND thrive_score <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for roadmap queries
CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_user_status_updated ON roadmaps(user_id, status, updated_at);

-- Snippets table: Pre-loaded templates library
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category TEXT NOT NULL,
    code TEXT NOT NULL,
    ui_preview_url TEXT,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for category searches
CREATE INDEX idx_snippets_category ON snippets(category);

-- Agent logs table: Tracks all agent executions
CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    output TEXT,
    status TEXT NOT NULL CHECK (status IN ('success', 'fail', 'pending')),
    token_count INTEGER DEFAULT 0,
    model_used TEXT,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Indexes for agent log queries
CREATE INDEX idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
CREATE INDEX idx_agent_logs_roadmap_status_timestamp ON agent_logs(roadmap_id, status, timestamp);

-- Insights table: Stores AI predictions and analyses
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('prediction', 'risk', 'roi')),
    data TEXT NOT NULL, -- JSON serialized
    score REAL CHECK (score >= 0 AND score <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Index for insights queries
CREATE INDEX idx_insights_roadmap_id ON insights(roadmap_id);

-- HITL queue table: Human-in-the-loop tasks
CREATE TABLE IF NOT EXISTS hitl_queue (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    task_id TEXT NOT NULL,
    task_json TEXT NOT NULL,
    user_id TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    assigned_to TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for HITL queue queries
CREATE INDEX idx_hitl_queue_status_priority ON hitl_queue(status, priority);
CREATE INDEX idx_hitl_queue_user_id ON hitl_queue(user_id);

-- User sessions table: Track active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for session lookups
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Billing subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for subscription queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Audit logs table: For compliance and security
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT, -- JSON
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for audit queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create update timestamp triggers
CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_roadmaps_timestamp 
AFTER UPDATE ON roadmaps
BEGIN
    UPDATE roadmaps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_snippets_timestamp 
AFTER UPDATE ON snippets
BEGIN
    UPDATE snippets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_subscriptions_timestamp 
AFTER UPDATE ON subscriptions
BEGIN
    UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;