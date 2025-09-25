-- ProtoThrive Database Initialization
-- This script sets up the initial database schema and tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE node_type AS ENUM ('task', 'milestone', 'decision', 'note', 'resource');

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status DEFAULT 'draft',
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_members UUID[] DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roadmaps table
CREATE TABLE IF NOT EXISTS roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nodes table (for ReactFlow nodes)
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL, -- ReactFlow node ID
    type node_type NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(roadmap_id, node_id)
);

-- Edges table (for ReactFlow edges)
CREATE TABLE IF NOT EXISTS edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
    edge_id VARCHAR(255) NOT NULL, -- ReactFlow edge ID
    source VARCHAR(255) NOT NULL,
    target VARCHAR(255) NOT NULL,
    data JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(roadmap_id, edge_id)
);

-- Code snippets table
CREATE TABLE IF NOT EXISTS code_snippets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    ui_preview_url TEXT,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    participants UUID[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    started_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Real-time events table (for WebSocket events)
CREATE TABLE IF NOT EXISTS realtime_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255),
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_project_id ON roadmaps(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_roadmap_id ON nodes(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_edges_roadmap_id ON edges(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_code_snippets_project_id ON code_snippets(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_project_id ON collaboration_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_session_id ON realtime_events(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roadmaps_updated_at BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_edges_updated_at BEFORE UPDATE ON edges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_code_snippets_updated_at BEFORE UPDATE ON code_snippets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - change in production!)
INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_verified)
VALUES (
    'admin@protothrive.com',
    'admin',
    crypt('admin123', gen_salt('bf')),
    'admin',
    'System',
    'Administrator',
    true
) ON CONFLICT (email) DO NOTHING;
