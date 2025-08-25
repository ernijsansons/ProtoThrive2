"""
Ref: CLAUDE.md Global Configs & Mocks
Global mock functions for AI Core testing
"""

def mock_api_call(endpoint, payload):
    """Mock external API calls"""
    print(f"THERMONUCLEAR MOCK CALL: {endpoint} - Payload: {payload}")
    return {'success': True, 'data': 'thermo_mock', 'id': 'uuid-thermo-mock'}

def mock_db_query(query, binds):
    """Mock database queries"""
    print(f"THERMONUCLEAR MOCK DB: {query} - Binds: {binds}")
    return [{
        'id': 'uuid-thermo',
        'json_graph': '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray"}],"edges":[{"from":"n1","to":"n2"}]}',
        'thrive_score': 0.45
    }]

# Ref: CLAUDE.md Dummy Data
DUMMY_USER = {'id': 'uuid-thermo-1', 'role': 'vibe_coder', 'email': 'test@proto.com'}

DUMMY_ROADMAP = {
    'id': 'rm-thermo-1',
    'json_graph': '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
    'vibe_mode': True,
    'thrive_score': 0.45
}

DUMMY_SNIPPET = {
    'id': 'sn-thermo-1',
    'category': 'ui',
    'code': 'console.log("Thermo UI Dummy");',
    'ui_preview_url': 'mock_neon.png'
}

DUMMY_AGENT_LOG = {
    'roadmap_id': 'rm-thermo-1',
    'task_type': 'ui',
    'output': '// Thermo Code',
    'status': 'success',
    'model_used': 'kimi',
    'token_count': 50
}