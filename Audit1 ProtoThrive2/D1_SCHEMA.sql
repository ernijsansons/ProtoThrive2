-- ProtoThrive D1 Database Schema
-- Optimized for Cloudflare D1 (SQLite)
-- Multi-tenant, secure, edge-ready

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Users table (multi-tenant base)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('vibe_coder', 'engineer', 'exec', 'super_admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted ON users(deleted_at);

-- Roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT,
    description TEXT,
    json_graph TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'archived')),
    vibe_mode INTEGER DEFAULT 0,
    thrive_score REAL DEFAULT 50.0 CHECK(thrive_score >= 0 AND thrive_score <= 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_roadmaps_tenant ON roadmaps(tenant_id);
CREATE INDEX idx_roadmaps_user ON roadmaps(user_id);
CREATE INDEX idx_roadmaps_status ON roadmaps(status);
CREATE INDEX idx_roadmaps_deleted ON roadmaps(deleted_at);
CREATE INDEX idx_roadmaps_updated ON roadmaps(updated_at DESC);

-- Snippets table (shared code repository)
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT,
    code TEXT NOT NULL,
    language TEXT DEFAULT 'typescript',
    ui_preview_url TEXT,
    version INTEGER DEFAULT 1,
    tags TEXT, -- JSON array of tags
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_snippets_tenant ON snippets(tenant_id);
CREATE INDEX idx_snippets_category ON snippets(category);
CREATE INDEX idx_snippets_language ON snippets(language);
CREATE INDEX idx_snippets_deleted ON snippets(deleted_at);

-- Agent logs table (AI activity tracking)
CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    roadmap_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    input TEXT,
    output TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    model_used TEXT,
    token_count INTEGER DEFAULT 0,
    latency_ms INTEGER,
    error_message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_logs_tenant ON agent_logs(tenant_id);
CREATE INDEX idx_agent_logs_roadmap ON agent_logs(roadmap_id);
CREATE INDEX idx_agent_logs_status ON agent_logs(status);
CREATE INDEX idx_agent_logs_timestamp ON agent_logs(timestamp DESC);

-- Insights table (analytics and recommendations)
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    roadmap_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('performance', 'quality', 'security', 'recommendation')),
    severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    data TEXT NOT NULL, -- JSON data
    score REAL CHECK(score >= 0 AND score <= 100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

CREATE INDEX idx_insights_tenant ON insights(tenant_id);
CREATE INDEX idx_insights_roadmap ON insights(roadmap_id);
CREATE INDEX idx_insights_type ON insights(type);
CREATE INDEX idx_insights_severity ON insights(severity);
CREATE INDEX idx_insights_created ON insights(created_at DESC);

-- Sessions table (JWT token management)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    refresh_token_hash TEXT UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_refresh ON sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Rate limit table (for persistent rate limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    key TEXT NOT NULL,
    window_start DATETIME NOT NULL,
    count INTEGER DEFAULT 1,
    UNIQUE(key, window_start)
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);

-- Audit log table (compliance and security)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    response_code INTEGER,
    metadata TEXT, -- JSON additional data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Create triggers for updated_at timestamps
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

-- Insert default data for testing
INSERT INTO users (id, tenant_id, email, role) 
VALUES 
    ('user-admin', 'tenant-default', 'admin@protothrive.com', 'super_admin'),
    ('user-demo', 'tenant-default', 'demo@protothrive.com', 'engineer');

INSERT INTO roadmaps (id, tenant_id, user_id, title, json_graph, status, vibe_mode, thrive_score) 
VALUES 
    ('roadmap-1', 'tenant-default', 'user-demo', 'MVP Launch', 
     '{"nodes":[{"id":"1","label":"Setup"},{"id":"2","label":"Build"},{"id":"3","label":"Deploy"}],"edges":[{"from":"1","to":"2"},{"from":"2","to":"3"}]}',
     'active', 1, 85.5),
    ('roadmap-2', 'tenant-default', 'user-demo', 'Q1 Features', 
     '{"nodes":[{"id":"1","label":"Auth"},{"id":"2","label":"Dashboard"}],"edges":[{"from":"1","to":"2"}]}',
     'draft', 0, 72.3),
    ('roadmap-3', 'tenant-default', 'user-demo', 'Performance Optimization', 
     '{"nodes":[{"id":"1","label":"Audit"},{"id":"2","label":"Optimize"},{"id":"3","label":"Test"}],"edges":[]}',
     'active', 1, 91.0);

INSERT INTO snippets (id, tenant_id, category, title, code, language, tags) 
VALUES 
    ('snippet-1', 'tenant-default', 'auth', 'JWT Validation', 
     'export const validateJWT = (token: string): boolean => {\n  // Implementation\n  return true;\n}',
     'typescript', '["security","jwt","auth"]'),
    ('snippet-2', 'tenant-default', 'ui', 'Loading Spinner', 
     '<div class="spinner">Loading...</div>',
     'html', '["ui","component","loading"]');
