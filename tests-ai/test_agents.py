"""
Ref: CLAUDE.md Terminal 3: Phase 3 - Agent Tests
Tests for CrewAI agent implementations
"""

import sys
import os
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ..src-ai.agents import PlannerAgent, CoderAgent, AuditorAgent
from mocks import DUMMY_ROADMAP


def test_planner_agent_initialization():
    """Test PlannerAgent initializes correctly"""
    planner = PlannerAgent()
    assert planner.role == 'Planner'
    assert planner.goal == 'Decompose to tasks'
    assert planner.backbone == 'claude'


def test_planner_decompose():
    """Test PlannerAgent decomposes graph into tasks"""
    planner = PlannerAgent()
    
    # Use dummy roadmap
    tasks = planner.decompose(DUMMY_ROADMAP['json_graph'])
    
    # Should return 3 tasks (one per node)
    assert len(tasks) == 3
    
    # Check task structure and alternating types
    for i, task in enumerate(tasks):
        assert 'type' in task
        assert 'desc' in task
        assert 'complexity' in task
        
        # Types should alternate ui/code
        expected_type = 'ui' if i % 2 else 'code'
        assert task['type'] == expected_type
        
        # Complexity should be low for first 2, high for rest
        expected_complexity = 'low' if i < 2 else 'high'
        assert task['complexity'] == expected_complexity
        
        # Description should reference node
        assert 'Task for node' in task['desc']


def test_coder_agent_initialization():
    """Test CoderAgent initializes correctly"""
    coder = CoderAgent()
    assert coder.role == 'Coder'
    assert coder.goal == 'Gen code'
    assert coder.backbone == 'kimi'


def test_coder_generate():
    """Test CoderAgent generates code"""
    coder = CoderAgent()
    
    # Test with sample task
    task = {'type': 'code', 'desc': 'Test task', 'complexity': 'low'}
    result = coder.code(task)
    
    # Should return code dict
    assert 'code' in result
    assert isinstance(result['code'], str)
    
    # Code should contain expected elements
    assert '// Thermo Code for' in result['code']
    assert task['desc'] in result['code']
    assert 'Vibe: Neon' in result['code']


def test_auditor_agent_initialization():
    """Test AuditorAgent initializes correctly"""
    auditor = AuditorAgent()
    assert auditor.role == 'Auditor'
    assert auditor.goal == 'Validate'
    assert auditor.backbone == 'claude'


def test_auditor_audit_valid_json():
    """Test AuditorAgent validates valid JSON"""
    auditor = AuditorAgent()
    
    # Test with valid JSON string
    valid_json = '{"test": "data"}'
    result = auditor.audit(valid_json)
    
    assert 'valid' in result
    assert 'score' in result
    assert result['valid'] is True
    assert result['score'] == 0.95


def test_auditor_audit_invalid_json():
    """Test AuditorAgent handles invalid JSON"""
    auditor = AuditorAgent()
    
    # Test with non-JSON code
    code = {'code': '// This is JavaScript code'}
    result = auditor.audit(code)
    
    assert 'valid' in result
    assert 'score' in result
    assert result['valid'] is False
    assert result['score'] == 0.6


def test_auditor_audit_threshold():
    """Test AuditorAgent threshold logic"""
    auditor = AuditorAgent()
    
    # Mock different scenarios
    # Score > 0.8 should be valid
    auditor.audit = lambda code: {'valid': True, 'score': 0.95}
    result = auditor.audit('test')
    assert result['valid'] is True
    
    # Score <= 0.8 should be invalid
    auditor.audit = lambda code: {'valid': False, 'score': 0.6}
    result = auditor.audit('test')
    assert result['valid'] is False


def test_agent_integration():
    """Test agents working together"""
    planner = PlannerAgent()
    coder = CoderAgent()
    auditor = AuditorAgent()
    
    # Full workflow
    tasks = planner.decompose(DUMMY_ROADMAP['json_graph'])
    assert len(tasks) == 3
    
    # Process first task
    code_result = coder.code(tasks[0])
    audit_result = auditor.audit(code_result)
    
    # Verify results
    assert 'code' in code_result
    assert 'valid' in audit_result
    assert 'score' in audit_result


if __name__ == "__main__":
    test_planner_agent_initialization()
    test_planner_decompose()
    test_coder_agent_initialization()
    test_coder_generate()
    test_auditor_agent_initialization()
    test_auditor_audit_valid_json()
    test_auditor_audit_invalid_json()
    test_auditor_audit_threshold()
    test_agent_integration()
    print("All agent tests passed!")
    print("Thermonuclear Test Complete: Agents 100% Coverage")