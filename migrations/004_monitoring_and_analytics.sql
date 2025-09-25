-- ProtoThrive Enterprise Monitoring & Analytics Schema Migration
-- Version: 1.0.0
-- Date: 2025-01-21
-- Ref: CLAUDE.md Section 10 - Monitoring & Observability

-- System metrics and performance monitoring
CREATE TABLE IF NOT EXISTS metrics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
    value REAL NOT NULL,
    unit TEXT,
    tags JSON NOT NULL DEFAULT '{}',
    service_name TEXT NOT NULL DEFAULT 'protothrive',
    environment TEXT NOT NULL DEFAULT 'production',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributed tracing for request tracking
CREATE TABLE IF NOT EXISTS traces (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    trace_id TEXT NOT NULL,
    span_id TEXT NOT NULL,
    parent_span_id TEXT,
    operation_name TEXT NOT NULL,
    service_name TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_ms REAL,
    status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'error', 'timeout')),
    tags JSON NOT NULL DEFAULT '{}',
    logs JSON NOT NULL DEFAULT '[]',
    error_message TEXT,
    stack_trace TEXT,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

-- Application logs with structured data
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    service_name TEXT NOT NULL DEFAULT 'protothrive',
    environment TEXT NOT NULL DEFAULT 'production',
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    trace_id TEXT,
    fields JSON NOT NULL DEFAULT '{}',
    context JSON NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance monitoring for Core Web Vitals
CREATE TABLE IF NOT EXISTS web_vitals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    page_url TEXT NOT NULL,
    metric_name TEXT NOT NULL CHECK (metric_name IN ('CLS', 'FID', 'LCP', 'FCP', 'TTFB', 'INP')),
    value REAL NOT NULL,
    rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    connection_type TEXT,
    browser TEXT,
    browser_version TEXT,
    os TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business analytics and usage tracking
CREATE TABLE IF NOT EXISTS usage_analytics (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    page_path TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    session_id TEXT,
    device_id TEXT,
    properties JSON NOT NULL DEFAULT '{}',
    value REAL,
    revenue REAL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feature usage and adoption tracking
CREATE TABLE IF NOT EXISTS feature_usage (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    feature_name TEXT NOT NULL,
    feature_category TEXT,
    action TEXT NOT NULL,
    context JSON NOT NULL DEFAULT '{}',
    duration_ms REAL,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    session_id TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Error tracking and monitoring
CREATE TABLE IF NOT EXISTS error_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_code TEXT,
    stack_trace TEXT,
    file_path TEXT,
    line_number INTEGER,
    column_number INTEGER,
    user_agent TEXT,
    url TEXT,
    severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    fingerprint TEXT, -- For grouping similar errors
    resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by TEXT,
    resolved_at TIMESTAMP,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    context JSON NOT NULL DEFAULT '{}'
);

-- System health checks and uptime monitoring
CREATE TABLE IF NOT EXISTS health_checks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    service_name TEXT NOT NULL,
    check_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    response_time_ms REAL,
    details JSON NOT NULL DEFAULT '{}',
    environment TEXT NOT NULL DEFAULT 'production',
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert definitions and configurations
CREATE TABLE IF NOT EXISTS alert_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    metric_name TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('>', '<', '>=', '<=', '==', '!=')),
    threshold REAL NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 5,
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    notification_channels JSON NOT NULL DEFAULT '[]',
    tags JSON NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alert incidents and notifications
CREATE TABLE IF NOT EXISTS alert_incidents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    alert_rule_id TEXT NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'firing' CHECK (status IN ('firing', 'resolved', 'silenced')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by TEXT,
    last_notification_at TIMESTAMP,
    notification_count INTEGER NOT NULL DEFAULT 0,
    metric_value REAL,
    details JSON NOT NULL DEFAULT '{}',
    escalation_level INTEGER NOT NULL DEFAULT 1
);

-- Cost tracking and budget monitoring
CREATE TABLE IF NOT EXISTS cost_tracking (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    usage_amount REAL NOT NULL,
    usage_unit TEXT NOT NULL,
    cost_per_unit REAL NOT NULL,
    total_cost REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_period_start TIMESTAMP NOT NULL,
    billing_period_end TIMESTAMP NOT NULL,
    tags JSON NOT NULL DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B testing and experimentation
CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived')),
    traffic_allocation REAL NOT NULL DEFAULT 1.0,
    variants JSON NOT NULL DEFAULT '[]',
    success_metrics JSON NOT NULL DEFAULT '[]',
    guardrail_metrics JSON NOT NULL DEFAULT '[]',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    min_sample_size INTEGER,
    confidence_level REAL NOT NULL DEFAULT 0.95,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiment participation tracking
CREATE TABLE IF NOT EXISTS experiment_participants (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    variant TEXT NOT NULL,
    assignment_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bucketing_key TEXT NOT NULL,
    context JSON NOT NULL DEFAULT '{}'
);

-- Performance indexes for monitoring and analytics
CREATE INDEX IF NOT EXISTS idx_metrics_workspace ON metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at ON metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_metrics_service ON metrics(service_name, environment);
CREATE INDEX IF NOT EXISTS idx_traces_trace_id ON traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_traces_span_id ON traces(span_id);
CREATE INDEX IF NOT EXISTS idx_traces_workspace ON traces(workspace_id);
CREATE INDEX IF NOT EXISTS idx_traces_service ON traces(service_name);
CREATE INDEX IF NOT EXISTS idx_traces_start_time ON traces(start_time);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service_name, environment);
CREATE INDEX IF NOT EXISTS idx_logs_workspace ON logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_trace_id ON logs(trace_id);
CREATE INDEX IF NOT EXISTS idx_web_vitals_workspace ON web_vitals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_web_vitals_metric ON web_vitals(metric_name, rating);
CREATE INDEX IF NOT EXISTS idx_web_vitals_recorded_at ON web_vitals(recorded_at);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_workspace ON usage_analytics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_event ON usage_analytics(event_type, event_name);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_recorded_at ON usage_analytics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_feature_usage_workspace ON feature_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_recorded_at ON feature_usage(recorded_at);
CREATE INDEX IF NOT EXISTS idx_error_events_workspace ON error_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_error_events_type ON error_events(error_type);
CREATE INDEX IF NOT EXISTS idx_error_events_fingerprint ON error_events(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_events_resolved ON error_events(resolved, last_seen_at);
CREATE INDEX IF NOT EXISTS idx_health_checks_service ON health_checks(service_name, environment);
CREATE INDEX IF NOT EXISTS idx_health_checks_status ON health_checks(status, checked_at);
CREATE INDEX IF NOT EXISTS idx_alert_rules_workspace ON alert_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_incidents_rule ON alert_incidents(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_incidents_status ON alert_incidents(status, started_at);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_workspace ON cost_tracking(workspace_id);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_service ON cost_tracking(service_name);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_period ON cost_tracking(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_experiments_workspace ON experiments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiment_participants_experiment ON experiment_participants(experiment_id);
CREATE INDEX IF NOT EXISTS idx_experiment_participants_user ON experiment_participants(user_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS trigger_alert_rules_updated_at
    AFTER UPDATE ON alert_rules
    BEGIN
        UPDATE alert_rules SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_experiments_updated_at
    AFTER UPDATE ON experiments
    BEGIN
        UPDATE experiments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;