-- ProtoThrive Enterprise Integrations & API Schema Migration
-- Version: 1.0.0
-- Date: 2025-01-21
-- Ref: CLAUDE.md Section 7 - API Integrations

-- External service integrations
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('github', 'jira', 'slack', 'linear', 'notion', 'asana', 'trello')),
    service_name TEXT NOT NULL,
    config JSON NOT NULL DEFAULT '{}',
    credentials JSON NOT NULL DEFAULT '{}', -- Encrypted
    webhook_url TEXT,
    webhook_secret TEXT,
    sync_settings JSON NOT NULL DEFAULT '{}',
    last_sync_at TIMESTAMP,
    sync_status TEXT NOT NULL DEFAULT 'active' CHECK (sync_status IN ('active', 'paused', 'error', 'disabled')),
    error_details TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GitHub-specific integration data
CREATE TABLE IF NOT EXISTS github_repositories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    repo_id INTEGER NOT NULL,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    private BOOLEAN NOT NULL DEFAULT false,
    default_branch TEXT NOT NULL DEFAULT 'main',
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_commit_sha TEXT,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GitHub issues synced to roadmap nodes
CREATE TABLE IF NOT EXISTS github_issues (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    repository_id TEXT NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
    roadmap_id TEXT REFERENCES roadmaps(id) ON DELETE SET NULL,
    roadmap_node_id TEXT,
    issue_number INTEGER NOT NULL,
    github_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    state TEXT NOT NULL CHECK (state IN ('open', 'closed')),
    labels JSON NOT NULL DEFAULT '[]',
    assignees JSON NOT NULL DEFAULT '[]',
    milestone TEXT,
    created_by_github TEXT,
    closed_at TIMESTAMP,
    github_created_at TIMESTAMP NOT NULL,
    github_updated_at TIMESTAMP NOT NULL,
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Jira projects and issues
CREATE TABLE IF NOT EXISTS jira_projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    project_key TEXT NOT NULL,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    project_type TEXT,
    lead TEXT,
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jira_issues (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    project_id TEXT NOT NULL REFERENCES jira_projects(id) ON DELETE CASCADE,
    roadmap_id TEXT REFERENCES roadmaps(id) ON DELETE SET NULL,
    roadmap_node_id TEXT,
    issue_key TEXT NOT NULL,
    jira_id TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT,
    issue_type TEXT NOT NULL,
    status TEXT NOT NULL,
    priority TEXT,
    assignee TEXT,
    reporter TEXT,
    sprint_id TEXT,
    story_points REAL,
    epic_link TEXT,
    labels JSON NOT NULL DEFAULT '[]',
    components JSON NOT NULL DEFAULT '[]',
    jira_created_at TIMESTAMP NOT NULL,
    jira_updated_at TIMESTAMP NOT NULL,
    last_sync_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slack workspaces and channels
CREATE TABLE IF NOT EXISTS slack_workspaces (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    team_id TEXT NOT NULL,
    team_name TEXT NOT NULL,
    bot_user_id TEXT,
    bot_access_token TEXT, -- Encrypted
    sync_enabled BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS slack_channels (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES slack_workspaces(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    purpose TEXT,
    topic TEXT,
    member_count INTEGER,
    roadmap_id TEXT REFERENCES roadmaps(id) ON DELETE SET NULL,
    notification_settings JSON NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync logs for all integrations
CREATE TABLE IF NOT EXISTS sync_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'webhook')),
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details TEXT,
    metadata JSON NOT NULL DEFAULT '{}'
);

-- API rate limiting and usage tracking
CREATE TABLE IF NOT EXISTS api_rate_limits (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    requests_per_minute INTEGER NOT NULL DEFAULT 60,
    requests_per_hour INTEGER NOT NULL DEFAULT 3600,
    requests_per_day INTEGER NOT NULL DEFAULT 86400,
    current_minute_count INTEGER NOT NULL DEFAULT 0,
    current_hour_count INTEGER NOT NULL DEFAULT 0,
    current_day_count INTEGER NOT NULL DEFAULT 0,
    minute_reset_at TIMESTAMP NOT NULL,
    hour_reset_at TIMESTAMP NOT NULL,
    day_reset_at TIMESTAMP NOT NULL,
    last_request_at TIMESTAMP
);

-- Webhook events for real-time sync
CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_id TEXT,
    source_id TEXT,
    payload JSON NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT false,
    processed_at TIMESTAMP,
    error_details TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_service_type ON integrations(service_type);
CREATE INDEX IF NOT EXISTS idx_integrations_sync_status ON integrations(sync_status);
CREATE INDEX IF NOT EXISTS idx_github_repositories_integration ON github_repositories(integration_id);
CREATE INDEX IF NOT EXISTS idx_github_repositories_sync ON github_repositories(sync_enabled, last_sync_at);
CREATE INDEX IF NOT EXISTS idx_github_issues_repository ON github_issues(repository_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_roadmap ON github_issues(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_state ON github_issues(state);
CREATE INDEX IF NOT EXISTS idx_jira_projects_integration ON jira_projects(integration_id);
CREATE INDEX IF NOT EXISTS idx_jira_issues_project ON jira_issues(project_id);
CREATE INDEX IF NOT EXISTS idx_jira_issues_roadmap ON jira_issues(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_slack_workspaces_integration ON slack_workspaces(integration_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_workspace ON slack_channels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_slack_channels_roadmap ON slack_channels(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status, started_at);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_workspace ON api_rate_limits(workspace_id, service_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_integration ON webhook_events(integration_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, received_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS trigger_integrations_updated_at
    AFTER UPDATE ON integrations
    BEGIN
        UPDATE integrations SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;