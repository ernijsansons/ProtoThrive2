-- Ref: CLAUDE.md Terminal 1 Phase 1 - Seed Data for ProtoThrive
-- Insert dummy user for testing

INSERT INTO users (id, email, role, created_at, deleted_at) 
VALUES ('uuid-thermo-1', 'test@proto.com', 'vibe_coder', CURRENT_TIMESTAMP, NULL);

-- Insert dummy snippets
INSERT INTO snippets (id, category, code, ui_preview_url, version, created_at, updated_at)
VALUES 
  ('sn-thermo-1', 'ui', 'console.log("Thermo UI Dummy");', 'mock_neon.png', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sn-thermo-2', 'auth', 'console.log("Thermo Auth Dummy");', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sn-thermo-3', 'deploy', 'console.log("Thermo Deploy Dummy");', NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);