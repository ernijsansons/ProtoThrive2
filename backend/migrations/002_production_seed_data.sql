-- Ref: CLAUDE.md Production Seed Data v2.0.0
-- Thermonuclear seed data with comprehensive test scenarios

-- ===== DEVELOPMENT/TEST USERS =====

-- Main test user (CLAUDE.md specification)
INSERT OR REPLACE INTO users (id, email, role, auth_provider, settings, created_at, deleted_at) 
VALUES ('uuid-thermo-1', 'test@proto.com', 'vibe_coder', 'local', 
        '{"notifications": true, "theme": "dark", "tutorial_completed": true}', 
        CURRENT_TIMESTAMP, NULL);

-- Enterprise admin user (NOTE: Admin user must be created through secure environment setup)
-- INSERT OR REPLACE INTO users (id, email, role, auth_provider, enterprise_id, settings, created_at, deleted_at)
-- VALUES ('uuid-admin', 'ADMIN_EMAIL_FROM_ENV', 'admin', 'local', 'enterprise-1',
--         '{"notifications": true, "theme": "dark", "admin_features": true}',
--         CURRENT_TIMESTAMP, NULL);

-- Engineer user for testing
INSERT OR REPLACE INTO users (id, email, role, created_at, deleted_at) 
VALUES ('uuid-thermo-eng', 'engineer@proto.com', 'engineer', CURRENT_TIMESTAMP, NULL);

-- ===== DEMO ROADMAP =====

-- Insert demo roadmap (CLAUDE.md specification)
INSERT OR REPLACE INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, title, description, visibility)
VALUES ('rm-thermo-1', 'uuid-thermo-1', 
        '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle Phase","status":"neon","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"Final Goal","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
        'active', 1, 0.75, 'Demo Thermonuclear Roadmap', 
        'Comprehensive demo roadmap showcasing ProtoThrive capabilities with neon vibe mode',
        'public');

-- Second demo roadmap for testing
INSERT OR REPLACE INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, title, description)
VALUES ('rm-thermo-2', 'uuid-thermo-1', 
        '{"nodes":[{"id":"a1","label":"Backend API","status":"neon","position":{"x":50,"y":50,"z":0}},{"id":"a2","label":"Frontend UI","status":"gray","position":{"x":150,"y":50,"z":0}},{"id":"a3","label":"Deployment","status":"gray","position":{"x":100,"y":150,"z":0}}],"edges":[{"from":"a1","to":"a2"},{"from":"a1","to":"a3"},{"from":"a2","to":"a3"}]}',
        'draft', 0, 0.33, 'Tech Stack Implementation', 
        'Standard technology implementation roadmap');

-- ===== CODE SNIPPETS (CLAUDE.md specification) =====

-- UI snippets with thermonuclear theme
INSERT OR REPLACE INTO snippets (id, category, code, ui_preview_url, title, description, language, created_by)
VALUES 
  ('sn-thermo-1', 'ui', 'console.log("Thermo UI Dummy");\n// Neon button component\nconst NeonButton = ({children, onClick}) => (\n  <button className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-neon hover:scale-105 transition-all duration-300" onClick={onClick}>\n    {children}\n  </button>\n);', 
   'mock_neon_button.png', 'Neon Button Component', 'Thermonuclear neon-style button with hover effects', 'javascript', 'uuid-thermo-1'),
   
  ('sn-thermo-2', 'auth', 'console.log("Thermo Auth Dummy");\n// JWT validation middleware\nconst validateJWT = async (req, res, next) => {\n  const token = req.headers.authorization?.replace("Bearer ", "");\n  if (!token) return res.status(401).json({error: "AUTH-401: Missing token"});\n  // Thermonuclear validation logic\n  next();\n};', 
   NULL, 'JWT Auth Middleware', 'Secure authentication middleware with error codes', 'javascript', 'uuid-thermo-1'),
   
  ('sn-thermo-3', 'deploy', 'console.log("Thermo Deploy Dummy");\n# Cloudflare Workers deployment\nwrangler deploy --env production\necho "Thermonuclear Deployment Complete - 0 Errors"', 
   NULL, 'Workers Deploy Script', 'Production deployment script with success logging', 'bash', 'uuid-thermo-1'),
   
  ('sn-thermo-4', 'database', 'console.log("Thermo DB Dummy");\n-- Thermonuclear query with performance optimization\nSELECT r.*, u.email \nFROM roadmaps r \nJOIN users u ON r.user_id = u.id \nWHERE r.status = "active" \nAND r.thrive_score > 0.5 \nORDER BY r.updated_at DESC \nLIMIT 50;', 
   NULL, 'Optimized Roadmap Query', 'High-performance query for active roadmaps', 'sql', 'uuid-thermo-1'),
   
  ('sn-thermo-5', 'monitoring', 'console.log("Thermo Monitor Dummy");\n// Performance monitoring hook\nconst usePerformanceMonitor = () => {\n  useEffect(() => {\n    const observer = new PerformanceObserver((list) => {\n      console.log("Thermonuclear Perf:", list.getEntries());\n    });\n    observer.observe({entryTypes: ["measure", "navigation"]});\n    return () => observer.disconnect();\n  }, []);\n};', 
   NULL, 'Performance Monitor Hook', 'React hook for performance tracking', 'javascript', 'uuid-thermo-1');

-- ===== DEMO AGENT LOGS =====

-- Success logs for thrive score calculation
INSERT OR REPLACE INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, cost_usd, duration_ms, metadata)
VALUES 
  ('log-thermo-1', 'rm-thermo-1', 'ui', '// Thermonuclear UI generation complete\nconst Dashboard = () => <div>Neon Dashboard</div>;', 'success', 'kimi', 150, 0.0015, 2500, '{"confidence": 0.95, "complexity": "low"}'),
  ('log-thermo-2', 'rm-thermo-1', 'code', '// Backend API endpoint generated\napp.get("/api/roadmaps", handleRoadmaps);', 'success', 'kimi', 200, 0.002, 3200, '{"confidence": 0.88, "complexity": "medium"}'),
  ('log-thermo-3', 'rm-thermo-1', 'deploy', '# Deployment script generated\nwrangler deploy --env staging', 'success', 'claude', 100, 0.015, 1800, '{"confidence": 0.92, "complexity": "low"}'),
  ('log-thermo-4', 'rm-thermo-1', 'test', '// Test suite generated\ndescribe("API Tests", () => {});', 'fail', 'kimi', 80, 0.0008, 5000, '{"error": "timeout", "retry_count": 2}');

-- ===== DEMO INSIGHTS =====

-- Performance insights
INSERT OR REPLACE INTO insights (id, roadmap_id, type, data, score, trend)
VALUES 
  ('insight-1', 'rm-thermo-1', 'performance', '{"avg_response_time": 245, "success_rate": 0.85, "errors": 2}', 0.75, 'improving'),
  ('insight-2', 'rm-thermo-1', 'cost', '{"total_cost": 0.0188, "cost_per_task": 0.0047, "budget_remaining": 0.0812}', 0.82, 'stable'),
  ('insight-3', 'rm-thermo-1', 'quality', '{"code_quality": 0.88, "test_coverage": 0.65, "documentation": 0.72}', 0.75, 'stable');

-- ===== DEMO TEAM & INTEGRATIONS =====

-- Demo team
INSERT OR REPLACE INTO teams (id, name, description, owner_id, settings)
VALUES ('team-thermo-1', 'ProtoThrive Core Team', 'Main development team for thermonuclear features', 'uuid-thermo-admin', 
        '{"collaboration_mode": "real-time", "default_visibility": "team", "notification_level": "important"}');

-- Team members
INSERT OR REPLACE INTO team_members (team_id, user_id, role)
VALUES 
  ('team-thermo-1', 'uuid-thermo-admin', 'owner'),
  ('team-thermo-1', 'uuid-thermo-1', 'member'),
  ('team-thermo-1', 'uuid-thermo-eng', 'admin');

-- Demo integration
INSERT OR REPLACE INTO integrations (id, user_id, service_type, config, status, last_sync)
VALUES ('int-thermo-1', 'uuid-thermo-1', 'github', 
        '{"repository": "protothrive/main", "webhook_url": "https://api.protothrive.com/webhooks/github", "sync_issues": true}', 
        'active', CURRENT_TIMESTAMP);

-- Console log for successful seed
SELECT 'Thermonuclear Seed Data Complete - Demo User: uuid-thermo-1, Roadmaps: 2, Snippets: 5, Logs: 4' as status;