import pytest
import json
from src.agents import PlannerAgent, CoderAgent, AuditorAgent

def test_planner_decompose():
    planner = PlannerAgent()
    dummy_graph = '{"nodes": [{"id": "n1"}, {"id": "n2"}, {"id": "n3"}], "edges": []}'
    tasks = planner.decompose(dummy_graph)
    assert len(tasks) == 3
    assert tasks[0]['type'] == 'code'

def test_planner_decompose_invalid_json():
    planner = PlannerAgent()
    invalid_json = 'invalid json'
    tasks = planner.decompose(invalid_json)
    assert len(tasks) == 0

def test_coder_code():
    coder = CoderAgent()
    task = {'desc': 'test task', 'type': 'code', 'complexity': 'low'}
    code_output = coder.code(task)
    assert "Thermo Code" in code_output['code']

def test_auditor_audit_valid_code():
    auditor = AuditorAgent()
    code_output = {'code': '// Thermo Code for test task'}
    audit_result = auditor.audit(code_output)
    assert audit_result['valid'] is True
    assert audit_result['score'] == 0.95

def test_auditor_audit_invalid_code():
    auditor = AuditorAgent()
    code_output = {'code': '// Invalid code'}
    audit_result = auditor.audit(code_output)
    assert audit_result['valid'] is False
    assert audit_result['score'] == 0.6
