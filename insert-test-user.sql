-- Insert test user for staging testing
-- Disable foreign key constraints temporarily
PRAGMA foreign_keys = OFF;

-- Insert the test user
INSERT OR REPLACE INTO users (id, email, role, created_at, updated_at) 
VALUES ('test-user-thermo-staging', 'demo@protothrive.com', 'vibe_coder', 1695478500.0, 1695478500.0);

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Verify the user was inserted
SELECT * FROM users WHERE id = 'test-user-thermo-staging';