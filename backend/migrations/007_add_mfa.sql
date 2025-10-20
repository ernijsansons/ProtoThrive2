-- Add Multi-Factor Authentication (MFA) support
-- Migration 007: MFA Implementation
-- Created: 2025-10-07

-- Add MFA columns to users table
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN backup_codes TEXT; -- JSON array of hashed backup codes
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME;

-- MFA events tracking table
CREATE TABLE IF NOT EXISTS mfa_events (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('enabled', 'disabled', 'verified', 'backup_used', 'failed_attempt')),
    ip_address TEXT,
    user_agent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mfa_events_user ON mfa_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_events_type ON mfa_events(event_type, timestamp DESC);
