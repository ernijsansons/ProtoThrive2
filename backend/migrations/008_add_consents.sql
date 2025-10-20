-- Add GDPR consent tracking
-- Migration 008: Consent Management
-- Created: 2025-10-07

CREATE TABLE IF NOT EXISTS user_consents (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'terms_of_service',
        'privacy_policy',
        'marketing_emails',
        'analytics_tracking',
        'third_party_sharing',
        'data_processing'
    )),
    granted BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    consent_version TEXT, -- Track which version of terms/privacy policy
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_type ON user_consents(user_id, consent_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_consents_granted ON user_consents(granted, consent_type);

-- GDPR data export requests
CREATE TABLE IF NOT EXISTS data_export_requests (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'anonymization')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    export_url TEXT, -- R2 URL for data export
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_export_requests(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_requests_status ON data_export_requests(status, requested_at);
