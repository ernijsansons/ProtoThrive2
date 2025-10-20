-- Add password_hash column to users table for authentication
-- This is required for the registration and login endpoints to work

ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login DATETIME;
