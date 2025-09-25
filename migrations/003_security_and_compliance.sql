-- ProtoThrive Enterprise Security & Compliance Schema Migration
-- Version: 1.0.0
-- Date: 2025-01-21
-- Ref: CLAUDE.md Section 9 - Security & Compliance

-- Audit logs for compliance and security monitoring
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('auth', 'data_access', 'data_modification', 'export', 'delete', 'admin_action', 'integration', 'compliance')),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values JSON,
    new_values JSON,
    metadata JSON NOT NULL DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    risk_score REAL DEFAULT 0.0,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('low', 'medium', 'high', 'critical', 'info')),
    compliance_relevant BOOLEAN NOT NULL DEFAULT false,
    retention_until TIMESTAMP, -- For automatic cleanup
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security events and threat detection
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('login_attempt', 'failed_auth', 'suspicious_activity', 'data_breach', 'malware', 'phishing', 'privilege_escalation')),
    source_ip TEXT,
    user_agent TEXT,
    location JSON,
    threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
    threat_indicators JSON NOT NULL DEFAULT '[]',
    automated_response TEXT,
    investigation_status TEXT NOT NULL DEFAULT 'new' CHECK (investigation_status IN ('new', 'investigating', 'resolved', 'false_positive')),
    investigated_by TEXT,
    investigation_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting and API protection
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    identifier TEXT NOT NULL, -- IP, user_id, workspace_id, etc.
    bucket_type TEXT NOT NULL CHECK (bucket_type IN ('ip', 'user', 'workspace', 'api_key')),
    endpoint TEXT,
    requests_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_duration INTEGER NOT NULL DEFAULT 3600, -- seconds
    limit_per_window INTEGER NOT NULL DEFAULT 1000,
    blocked_until TIMESTAMP,
    violation_count INTEGER NOT NULL DEFAULT 0,
    last_violation_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GDPR and data protection compliance
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')),
    data_subject_id TEXT, -- Could be user_id or external identifier
    data_subject_email TEXT NOT NULL,
    legal_basis TEXT,
    requested_by TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    due_date TIMESTAMP NOT NULL, -- 30 days from request
    completion_date TIMESTAMP,
    response_data JSON,
    rejection_reason TEXT,
    verification_method TEXT,
    processing_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Consent management for GDPR compliance
CREATE TABLE IF NOT EXISTS consent_records (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    legal_basis TEXT NOT NULL CHECK (legal_basis IN ('consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests')),
    consent_given BOOLEAN NOT NULL,
    consent_withdrawn BOOLEAN NOT NULL DEFAULT false,
    data_categories JSON NOT NULL DEFAULT '[]',
    processing_purposes JSON NOT NULL DEFAULT '[]',
    third_parties JSON NOT NULL DEFAULT '[]',
    retention_period TEXT,
    consent_method TEXT NOT NULL CHECK (consent_method IN ('explicit', 'implicit', 'opt_in', 'opt_out')),
    consent_version TEXT NOT NULL DEFAULT '1.0',
    ip_address TEXT,
    user_agent TEXT,
    metadata JSON NOT NULL DEFAULT '{}',
    withdrawn_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data processing activities register
CREATE TABLE IF NOT EXISTS data_processing_activities (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    activity_name TEXT NOT NULL,
    controller_name TEXT NOT NULL,
    controller_contact TEXT NOT NULL,
    dpo_contact TEXT,
    purposes JSON NOT NULL DEFAULT '[]',
    legal_basis JSON NOT NULL DEFAULT '[]',
    data_categories JSON NOT NULL DEFAULT '[]',
    data_subjects JSON NOT NULL DEFAULT '[]',
    recipients JSON NOT NULL DEFAULT '[]',
    third_country_transfers BOOLEAN NOT NULL DEFAULT false,
    transfer_safeguards TEXT,
    retention_schedule TEXT,
    security_measures JSON NOT NULL DEFAULT '[]',
    risk_assessment JSON NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL REFERENCES users(id),
    approved_by TEXT,
    review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance reports and assessments
CREATE TABLE IF NOT EXISTS compliance_reports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL CHECK (report_type IN ('gdpr_compliance', 'security_assessment', 'audit_summary', 'data_mapping', 'risk_assessment')),
    title TEXT NOT NULL,
    description TEXT,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    report_data JSON NOT NULL DEFAULT '{}',
    findings JSON NOT NULL DEFAULT '[]',
    recommendations JSON NOT NULL DEFAULT '[]',
    compliance_score REAL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),
    generated_by TEXT NOT NULL REFERENCES users(id),
    reviewed_by TEXT,
    approved_by TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session management and security
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT UNIQUE,
    device_fingerprint TEXT,
    ip_address TEXT,
    user_agent TEXT,
    location JSON,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_by TEXT,
    revocation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys and access tokens
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual key
    key_prefix TEXT NOT NULL, -- First 8 characters for identification
    permissions JSON NOT NULL DEFAULT '[]',
    rate_limit_per_hour INTEGER DEFAULT 1000,
    allowed_ips JSON NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP,
    usage_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes for security and compliance
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance ON audit_logs(compliance_relevant, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_workspace ON security_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_threat_level ON security_events(threat_level);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(investigation_status);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_identifier ON rate_limit_buckets(identifier, bucket_type);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_window ON rate_limit_buckets(window_start, window_duration);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_workspace ON gdpr_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status, due_date);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_subject ON gdpr_requests(data_subject_email);
CREATE INDEX IF NOT EXISTS idx_consent_records_user ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_workspace ON consent_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_purpose ON consent_records(purpose);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active, expires_at);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS trigger_rate_limit_buckets_updated_at
    AFTER UPDATE ON rate_limit_buckets
    BEGIN
        UPDATE rate_limit_buckets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_gdpr_requests_updated_at
    AFTER UPDATE ON gdpr_requests
    BEGIN
        UPDATE gdpr_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_data_processing_activities_updated_at
    AFTER UPDATE ON data_processing_activities
    BEGIN
        UPDATE data_processing_activities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS trigger_api_keys_updated_at
    AFTER UPDATE ON api_keys
    BEGIN
        UPDATE api_keys SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;