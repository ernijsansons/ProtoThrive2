-- ProtoThrive Database Schema - Simplified Initial Migration
-- Version: 2.0.0
-- Created: 2024-09-28

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Untitled Roadmap',
    description TEXT,
    nodes TEXT DEFAULT '[]',
    edges TEXT DEFAULT '[]',
    thrive_score REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);

-- Snippets table
CREATE TABLE IF NOT EXISTS snippets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'javascript',
    category TEXT DEFAULT 'general',
    tags TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);

-- Insert test data
INSERT OR IGNORE INTO users (id, email, password_hash, role) VALUES
('test-user-1', 'test@protothrive.com', '$2a$12$LQkDjQ8.0YvogptAJPUeZOoXXdP3Hn2rGLlvGmfhSz91vAXduyXvG', 'admin'),
('test-user-2', 'demo@protothrive.com', '$2a$12$LQkDjQ8.0YvogptAJPUeZOoXXdP3Hn2rGLlvGmfhSz91vAXduyXvG', 'user');

-- Password for both users is: password123