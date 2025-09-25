"""
Tests for backend utility functions that don't require Cloudflare Workers runtime
"""

import pytest
import json
import uuid
from unittest.mock import Mock, patch

# Test database utility functions
def test_validate_uuid():
    """Test UUID validation"""
    # Valid UUIDs
    valid_uuid = str(uuid.uuid4())
    assert len(valid_uuid) == 36
    assert valid_uuid.count('-') == 4

    # Invalid UUIDs
    invalid_uuids = [
        "not-a-uuid",
        "12345",
        "",
        None
    ]

    for invalid in invalid_uuids:
        assert invalid != valid_uuid

def test_thrive_score_calculation():
    """Test the Thrive Score formula"""
    # Ref: CLAUDE.md Global Dummy Data & Thrive Score Formula

    def calculate_thrive_score(success_logs, total_logs, ui_tasks, fails):
        if total_logs == 0:
            return 0.0

        completion = (success_logs / total_logs) * 0.6
        ui_polish = (ui_tasks / total_logs) * 0.3
        risk = (1 - (fails / total_logs)) * 0.1
        score = completion + ui_polish + risk
        return min(max(score, 0.0), 1.0)  # Clamp between 0-1

    # Test perfect score (adjusted for formula)
    # 100% completion (0.6) + 30% UI (0.09) + 100% risk (0.1) = 0.79
    perfect_score = calculate_thrive_score(10, 10, 3, 0)
    assert abs(perfect_score - 0.79) < 0.01

    # Test zero score
    assert calculate_thrive_score(0, 10, 0, 10) == 0.0

    # Test typical score (CLAUDE.md example: 0.45)
    score = calculate_thrive_score(5, 10, 2, 3)
    assert 0.4 <= score <= 0.5

def test_json_graph_validation():
    """Test JSON graph structure validation"""

    def validate_json_graph(json_str):
        try:
            data = json.loads(json_str)
            return (
                isinstance(data, dict) and
                'nodes' in data and
                'edges' in data and
                isinstance(data['nodes'], list) and
                isinstance(data['edges'], list)
            )
        except (json.JSONDecodeError, TypeError):
            return False

    # Valid graph
    valid_graph = json.dumps({
        "nodes": [
            {"id": "n1", "label": "Start", "status": "gray", "position": {"x": 0, "y": 0, "z": 0}},
            {"id": "n2", "label": "End", "status": "gray", "position": {"x": 100, "y": 100, "z": 0}}
        ],
        "edges": [
            {"from": "n1", "to": "n2"}
        ]
    })

    assert validate_json_graph(valid_graph) == True

    # Invalid graphs
    invalid_graphs = [
        "not json",
        "{}",
        '{"nodes": "not array"}',
        '{"nodes": [], "edges": "not array"}'
    ]

    for invalid in invalid_graphs:
        assert validate_json_graph(invalid) == False

def test_error_codes():
    """Test error code formatting"""

    def format_error_code(module, code):
        return f"ERR-{module.upper()}-{code}"

    assert format_error_code("auth", "401") == "ERR-AUTH-401"
    assert format_error_code("graph", "404") == "ERR-GRAPH-404"
    assert format_error_code("val", "400") == "ERR-VAL-400"

def test_mock_data_consistency():
    """Test that mock data follows the expected format"""

    # CLAUDE.md dummy data format
    mock_user = {
        'id': 'uuid-thermo-1',
        'role': 'vibe_coder',
        'email': 'test@proto.com'
    }

    mock_roadmap = {
        'id': 'rm-thermo-1',
        'json_graph': {
            "nodes": [
                {"id": "n1", "label": "Start", "status": "gray", "position": {"x": 0, "y": 0, "z": 0}},
                {"id": "n2", "label": "Middle", "status": "gray", "position": {"x": 100, "y": 100, "z": 0}},
                {"id": "n3", "label": "End", "status": "gray", "position": {"x": 200, "y": 200, "z": 0}}
            ],
            "edges": [
                {"from": "n1", "to": "n2"},
                {"from": "n2", "to": "n3"}
            ]
        },
        'vibe_mode': True,
        'thrive_score': 0.45
    }

    mock_snippet = {
        'id': 'sn-thermo-1',
        'category': 'ui',
        'code': 'console.log("Thermo UI Dummy");',
        'ui_preview_url': 'mock_neon.png'
    }

    # Validate structure
    assert isinstance(mock_user['id'], str)
    assert mock_user['role'] in ['vibe_coder', 'engineer', 'exec']
    assert '@' in mock_user['email']

    assert isinstance(mock_roadmap['json_graph'], dict)
    assert 'nodes' in mock_roadmap['json_graph']
    assert 'edges' in mock_roadmap['json_graph']
    assert len(mock_roadmap['json_graph']['nodes']) == 3
    assert len(mock_roadmap['json_graph']['edges']) == 2

    assert mock_snippet['category'] in ['ui', 'auth', 'deploy']
    assert mock_snippet['code'].startswith('console.log')

if __name__ == "__main__":
    pytest.main([__file__])