-- ProtoThrive Database Schema Updates
-- Migration 002 - Add missing columns and test data
-- Created: September 20, 2025

-- Add updated_at column to users if it doesn't exist
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column to roadmaps if it doesn't exist
ALTER TABLE roadmaps ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status ON roadmaps(user_id, status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_user_updated ON roadmaps(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_roadmaps_deleted_at ON roadmaps(deleted_at);
CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);
CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_insights_roadmap_id ON insights(roadmap_id);

-- Insert demo users (ignore if already exist)
INSERT OR IGNORE INTO users (id, email, role, created_at, updated_at) VALUES
('user_demo_001', 'demo@protothrive.com', 'vibe_coder', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('user_test_001', 'test@protothrive.com', 'vibe_coder', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
-- Admin user must be created through secure environment setup, not hardcoded
-- ('user_admin_001', 'ADMIN_EMAIL_FROM_ENV', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert demo roadmaps
INSERT OR IGNORE INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at) VALUES
('roadmap_demo_001', 'user_demo_001', '{"nodes":[{"id":"n1","label":"Thermonuclear Start","status":"completed","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Optimization Phase","status":"in_progress","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"Production Launch","status":"pending","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}', 'active', 1, 0.87, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('roadmap_test_001', 'user_test_001', '{"nodes":[{"id":"t1","label":"Test Node","status":"pending","position":{"x":50,"y":50,"z":0}}],"edges":[]}', 'draft', 0, 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample code snippets for different categories
INSERT OR IGNORE INTO snippets (id, category, code, ui_preview_url, version) VALUES
('snippet_ui_001', 'ui', 'export const ThermoButton = ({ children, onClick }) => (\n  <button \n    onClick={onClick}\n    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"\n  >\n    {children}\n  </button>\n);', 'thermo_button.png', 1),
('snippet_api_001', 'api', 'export async function fetchRoadmap(id) {\n  const response = await fetch(`/api/roadmaps/${id}`, {\n    headers: {\n      Authorization: `Bearer ${getAuthToken()}`,\n      "Content-Type": "application/json"\n    }\n  });\n  if (!response.ok) throw new Error(`Failed to fetch roadmap: ${response.status}`);\n  return response.json();\n}', '', 1),
('snippet_cache_001', 'cache', 'export async function getCachedRoadmap(env, id) {\n  const cacheKey = `roadmap_${id}`;\n  const cached = await env.KV.get(cacheKey);\n  if (cached) {\n    console.log(`Cache hit for roadmap ${id}`);\n    return JSON.parse(cached);\n  }\n  return null;\n}', '', 1),
('snippet_auth_001', 'auth', 'export function validateAuthToken(token) {\n  if (!token || !token.startsWith("Bearer ")) {\n    return { valid: false, error: "Missing or invalid token format" };\n  }\n  const jwt = token.replace("Bearer ", "");\n  // Add JWT validation logic here\n  return { valid: true, user: { id: "user_123", role: "vibe_coder" } };\n}', '', 1),
('snippet_db_001', 'database', 'export async function insertRoadmap(env, roadmapData) {\n  const query = `\n    INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score)\n    VALUES (?, ?, ?, ?, ?, ?)\n  `;\n  const result = await env.DB.prepare(query)\n    .bind(roadmapData.id, roadmapData.user_id, roadmapData.json_graph, \n          roadmapData.status, roadmapData.vibe_mode, roadmapData.thrive_score)\n    .run();\n  return result;\n}', '', 1);

-- Insert sample agent logs showing the AI system in action
INSERT OR IGNORE INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, timestamp) VALUES
('log_demo_001', 'roadmap_demo_001', 'ui_generation', '// Thermonuclear UI Component Generated\nexport const OptimizedDashboard = () => {\n  return (\n    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">\n      <div className="container mx-auto px-4 py-8">\n        <h1 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">\n          Thermonuclear Performance Dashboard\n        </h1>\n        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">\n          {/* Performance metrics cards */}\n        </div>\n      </div>\n    </div>\n  );\n};', 'completed', 'kimi', 245, CURRENT_TIMESTAMP),
('log_demo_002', 'roadmap_demo_001', 'api_optimization', '// Optimized API endpoint with caching\nexport async function optimizedRoadmapHandler(request, env) {\n  const { id } = request.params;\n  \n  // Check cache first\n  const cached = await env.KV.get(`roadmap_${id}`);\n  if (cached) {\n    return new Response(cached, {\n      headers: { "Content-Type": "application/json", "X-Cache": "HIT" }\n    });\n  }\n  \n  // Fetch from database\n  const roadmap = await queryRoadmap(env, id);\n  \n  // Cache for 5 minutes\n  await env.KV.put(`roadmap_${id}`, JSON.stringify(roadmap), { expirationTtl: 300 });\n  \n  return new Response(JSON.stringify(roadmap), {\n    headers: { "Content-Type": "application/json", "X-Cache": "MISS" }\n  });\n}', 'completed', 'claude', 189, CURRENT_TIMESTAMP);

-- Insert performance insights showing optimization results
INSERT OR IGNORE INTO insights (id, roadmap_id, type, data, score, created_at) VALUES
('insight_perf_001', 'roadmap_demo_001', 'performance', '{"optimization_score": 0.87, "cache_hit_rate": 0.94, "response_time_p50": 23.5, "response_time_p99": 89.2, "features_active": ["argo_routing", "tiered_caching", "geographic_optimization"], "cost_savings_monthly": 109.50}', 0.87, CURRENT_TIMESTAMP),
('insight_cache_001', 'roadmap_demo_001', 'cache', '{"hot_tier_hit_rate": 0.96, "warm_tier_hit_rate": 0.89, "cold_tier_hit_rate": 0.72, "overall_hit_rate": 0.94, "cache_efficiency": "excellent"}', 0.94, CURRENT_TIMESTAMP),
('insight_cost_001', 'roadmap_demo_001', 'cost', '{"monthly_budget": 500.0, "current_usage": 387.50, "projected_usage": 465.00, "savings_from_optimization": 109.50, "budget_utilization": 0.775}', 0.78, CURRENT_TIMESTAMP);

-- Verify the data was inserted
SELECT 'Migration 002 completed successfully' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as roadmap_count FROM roadmaps;
SELECT COUNT(*) as snippet_count FROM snippets;
SELECT COUNT(*) as log_count FROM agent_logs;
SELECT COUNT(*) as insight_count FROM insights;