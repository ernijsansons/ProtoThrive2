-- OAuth Database Migration
-- Add OAuth support fields to users table

-- Add OAuth provider tracking
ALTER TABLE users ADD COLUMN oauth_providers TEXT DEFAULT NULL;

-- Add OAuth provider ID for linking
ALTER TABLE users ADD COLUMN provider_id TEXT DEFAULT NULL;

-- Add avatar URL from OAuth providers
ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT NULL;

-- Add email verification status (OAuth emails are pre-verified)
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Add OAuth provider metadata (JSON)
ALTER TABLE users ADD COLUMN oauth_metadata TEXT DEFAULT NULL;

-- Create index for faster OAuth provider lookups
CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users(provider_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Update existing users to have email_verified = false (they'll verify via email)
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;