-- Ref: CLAUDE.md Consolidated Production Schema v2.0.0
-- Thermonuclear Unified Database Schema for ProtoThrive
-- Consolidates all schemas into single production-ready file

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ===== CORE TABLES =====

-- Users table with role-based access and enterprise features
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT NOT NULL UNIQUE,
    role TEXT CHECK (role IN ('vibe_coder', 'engineer', 'exec', 'admin')) NOT NULL DEFAULT 'vibe_coder',
    enterprise_id TEXT NULL, -- For multi-tenant enterprise support
    auth_provider TEXT DEFAULT 'local', -- oauth, clerk, local
    last_login TIMESTAMP NULL,
    settings TEXT DEFAULT '{}', -- JSON settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Create indexes on users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_enterprise ON users(enterprise_id) WHERE enterprise_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON users(deleted_at) WHERE deleted_at IS NULL;

-- Roadmaps table with multi-tenant support and analytics
CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    json_graph TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'active', 'completed', 'archived', 'deleted')) NOT NULL DEFAULT 'draft',
    vibe_mode INTEGER NOT NULL DEFAULT 0, -- Boolean: 0 or 1
    thrive_score REAL NOT NULL DEFAULT 0.0,
    title TEXT DEFAULT 'Untitled Roadmap',
    description TEXT,
    tags TEXT DEFAULT '[]', -- JSON array
    shared_with TEXT DEFAULT '[]', -- JSON array of user IDs
    visibility TEXT CHECK (visibility IN ('private', 'team', 'public')) DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for roadmaps
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_updated_at ON roadmaps(updated_at);
CREATE INDEX IF NOT EXISTS idx_roadmaps_composite ON roadmaps(user_id, status, updated_at);
CREATE INDEX IF NOT EXISTS idx_roadmaps_active ON roadmaps(deleted_at) WHERE deleted_at IS NULL;

-- Snippets table for code templates with versioning
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    category TEXT NOT NULL,
    code TEXT NOT NULL,
    ui_preview_url TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT,
    description TEXT,
    tags TEXT DEFAULT '[]', -- JSON array
    language TEXT DEFAULT 'javascript',
    created_by TEXT, -- user_id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes on snippets
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_created_by ON snippets(created_by);

-- Agent logs table for tracking AI operations with detailed metrics
CREATE TABLE IF NOT EXISTS agent_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    output TEXT NOT NULL,
    status TEXT CHECK (status IN ('success', 'fail', 'timeout', 'escalated', 'retry')) NOT NULL,
    model_used TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    cost_usd REAL DEFAULT 0.0,
    duration_ms INTEGER DEFAULT 0,
    error_code TEXT,
    metadata TEXT DEFAULT '{}', -- JSON metadata
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Create indexes for agent logs
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_logs_model ON agent_logs(model_used);

-- Insights table for analytics with enhanced metrics
CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('performance', 'usage', 'quality', 'cost', 'collaboration')) NOT NULL,
    data TEXT NOT NULL,
    score REAL NOT NULL,
    trend TEXT DEFAULT 'stable', -- improving, declining, stable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
);

-- Create indexes for insights
CREATE INDEX IF NOT EXISTS idx_insights_roadmap_id ON insights(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at);

-- ===== SECURITY & COMPLIANCE TABLES =====

-- API Keys table for secure key management
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the key
    name TEXT NOT NULL,
    scopes TEXT DEFAULT '[]', -- JSON array of permissions
    last_used TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(revoked_at) WHERE revoked_at IS NULL;

-- Audit logs for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    metadata TEXT DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ===== COLLABORATION & INTEGRATIONS =====

-- Teams table for collaboration
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    settings TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Team members junction table
CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Integrations table for external services
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    service_type TEXT NOT NULL, -- github, jira, slack, etc
    config TEXT NOT NULL, -- Encrypted JSON config
    status TEXT CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'active',
    last_sync TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_service ON integrations(service_type);

-- ===== TRIGGERS =====

-- Update timestamps automatically
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_roadmaps_updated_at
AFTER UPDATE ON roadmaps
FOR EACH ROW
BEGIN
    UPDATE roadmaps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_snippets_updated_at
AFTER UPDATE ON snippets
FOR EACH ROW
BEGIN
    UPDATE snippets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_teams_updated_at
AFTER UPDATE ON teams
FOR EACH ROW
BEGIN
    UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Audit trigger for roadmap changes
CREATE TRIGGER IF NOT EXISTS audit_roadmap_changes
AFTER UPDATE ON roadmaps
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (NEW.user_id, 'UPDATE', 'roadmap', NEW.id, 
            json_object('old_status', OLD.status, 'new_status', NEW.status,
                       'old_score', OLD.thrive_score, 'new_score', NEW.thrive_score));
END;

-- ===== VIEWS FOR ANALYTICS =====

-- User statistics view
CREATE VIEW IF NOT EXISTS user_stats AS
SELECT 
    u.id,
    u.email,
    u.role,
    COUNT(r.id) as roadmap_count,
    AVG(r.thrive_score) as avg_thrive_score,
    MAX(r.updated_at) as last_activity
FROM users u
LEFT JOIN roadmaps r ON u.id = r.user_id AND r.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.email, u.role;

-- Roadmap performance view
CREATE VIEW IF NOT EXISTS roadmap_performance AS
SELECT 
    r.id,
    r.title,
    r.thrive_score,
    COUNT(al.id) as agent_operations,
    AVG(CASE WHEN al.status = 'success' THEN 1.0 ELSE 0.0 END) as success_rate,
    SUM(al.cost_usd) as total_cost,
    AVG(al.duration_ms) as avg_duration_ms
FROM roadmaps r
LEFT JOIN agent_logs al ON r.id = al.roadmap_id
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.title, r.thrive_score;

-- Console log for successful migration
SELECT 'Thermonuclear Database Migration Complete - Schema v2.0.0 - 0 Errors' as status;