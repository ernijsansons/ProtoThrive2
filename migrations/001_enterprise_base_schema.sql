-- ProtoThrive Enterprise Base Schema Migration
-- Version: 1.0.0
-- Date: 2025-01-21
-- Ref: CLAUDE.md Section 7 - Database Design

-- Core workspaces and organizations
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    domain TEXT UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    max_teams INTEGER NOT NULL DEFAULT 5,
    max_members INTEGER NOT NULL DEFAULT 50,
    settings JSON NOT NULL DEFAULT '{}',
    billing_email TEXT,
    subscription_id TEXT,
    trial_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams within workspaces
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    permissions JSON NOT NULL DEFAULT '{}',
    settings JSON NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team memberships with roles
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSON NOT NULL DEFAULT '{}',
    invited_by TEXT,
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended'))
);

-- Enhanced users table for enterprise features
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    sso_provider TEXT,
    sso_id TEXT,
    preferences JSON NOT NULL DEFAULT '{}',
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- Soft delete for GDPR compliance
);

-- SSO providers configuration
CREATE TABLE IF NOT EXISTS sso_providers (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('azure_ad', 'google_workspace', 'okta', 'onelogin', 'saml_generic')),
    provider_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL, -- Encrypted
    metadata_url TEXT,
    entity_id TEXT,
    sso_url TEXT,
    certificate TEXT,
    config JSON NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced roadmaps table with collaboration features
CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    json_graph TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'team', 'workspace', 'public')),
    vibe_mode BOOLEAN NOT NULL DEFAULT false,
    thrive_score REAL NOT NULL DEFAULT 0.0,
    is_template BOOLEAN NOT NULL DEFAULT false,
    template_category TEXT,
    collaboration_mode TEXT NOT NULL DEFAULT 'async' CHECK (collaboration_mode IN ('async', 'real_time', 'locked')),
    locked_by TEXT,
    locked_at TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    parent_id TEXT REFERENCES roadmaps(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roadmap collaborators and permissions
CREATE TABLE IF NOT EXISTS roadmap_collaborators (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL DEFAULT 'viewer' CHECK (permission IN ('owner', 'editor', 'commenter', 'viewer')),
    invited_by TEXT NOT NULL REFERENCES users(id),
    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    last_active_at TIMESTAMP
);

-- Real-time collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
    durable_object_id TEXT NOT NULL,
    active_participants JSON NOT NULL DEFAULT '[]',
    session_data JSON NOT NULL DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Performance and analytics
CREATE INDEX IF NOT EXISTS idx_workspaces_domain ON workspaces(domain);
CREATE INDEX IF NOT EXISTS idx_teams_workspace ON teams(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_sso ON users(sso_provider, sso_id);
CREATE INDEX IF NOT EXISTS idx_sso_providers_workspace ON sso_providers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sso_providers_domain ON sso_providers(domain);
CREATE INDEX IF NOT EXISTS idx_roadmaps_workspace ON roadmaps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_team ON roadmaps(team_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_visibility ON roadmaps(visibility);
CREATE INDEX IF NOT EXISTS idx_roadmap_collaborators_roadmap ON roadmap_collaborators(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_collaborators_user ON roadmap_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_roadmap ON collaboration_sessions(roadmap_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS trigger_workspaces_updated_at
    AFTER UPDATE ON workspaces
    BEGIN
        UPDATE workspaces SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_teams_updated_at
    AFTER UPDATE ON teams
    BEGIN
        UPDATE teams SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_sso_providers_updated_at
    AFTER UPDATE ON sso_providers
    BEGIN
        UPDATE sso_providers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_roadmaps_updated_at
    AFTER UPDATE ON roadmaps
    BEGIN
        UPDATE roadmaps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;