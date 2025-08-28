import pytest
import numpy as np
from unittest.mock import MagicMock
from src.orchestrator import orchestrate
from src.cache import MockKV
from src.rag import MockPinecone
from src.agents import AuditorAgent

@pytest.fixture
def mock_orchestrator_components(monkeypatch):
    mock_kv_get = MagicMock()
    monkeypatch.setattr(MockKV, 'get', mock_kv_get)

    mock_rag_query = MagicMock()
    monkeypatch.setattr(MockPinecone, 'query', mock_rag_query)

    mock_auditor_audit = MagicMock()
    monkeypatch.setattr(AuditorAgent, 'audit', mock_auditor_audit)

    return mock_kv_get, mock_rag_query, mock_auditor_audit

def test_orchestrate_dummy_graph():
    dummy_json_graph = '{"nodes": [{"id": "n1", "label": "Start"}, {"id": "n2", "label": "Middle"}, {"id": "n3", "label": "End"}], "edges": []}'
    final_outputs = orchestrate(dummy_json_graph)
    assert len(final_outputs) == 3
    assert "Thermo Code" in final_outputs[0]['code']

def test_orchestrate_no_tasks_generated():
    empty_json_graph = '{"nodes": [], "edges": []}'
    final_outputs = orchestrate(empty_json_graph)
    assert len(final_outputs) == 0

def test_orchestrate_cached_snippets(mock_orchestrator_components):
    mock_kv_get, mock_rag_query, mock_auditor_audit = mock_orchestrator_components
    mock_kv_get.return_value = [{"id": "cached-snip", "score": 0.99, "snippet": "cached code"}]
    mock_auditor_audit.return_value = {'valid': True, 'score': 0.95}

    dummy_json_graph = '{"nodes": [{"id": "n1"}], "edges": []}'
    final_outputs = orchestrate(dummy_json_graph)
    assert len(final_outputs) == 1
    mock_kv_get.assert_called_once() # Should call get from cache
    mock_rag_query.assert_not_called() # Should not call rag.query

def test_orchestrate_no_rag_matches(mock_orchestrator_components, capsys):
    mock_kv_get, mock_rag_query, mock_auditor_audit = mock_orchestrator_components
    mock_kv_get.return_value = None # No cached snippets
    mock_rag_query.return_value = [] # No RAG matches
    mock_auditor_audit.return_value = {'valid': True, 'score': 0.95}

    dummy_json_graph = '{"nodes": [{"id": "n1"}], "edges": []}'
    final_outputs = orchestrate(dummy_json_graph)
    assert len(final_outputs) == 1 # Still generates code, but no snippets found
    mock_rag_query.assert_called_once() # Should call rag.query
    captured = capsys.readouterr()
    assert "No relevant snippets found from RAG." in captured.out

def test_orchestrate_failed_audit(mock_orchestrator_components):
    mock_kv_get, mock_rag_query, mock_auditor_audit = mock_orchestrator_components
    mock_kv_get.return_value = None
    mock_rag_query.return_value = []
    mock_auditor_audit.return_value = {'valid': False, 'score': 0.6}

    dummy_json_graph = '{"nodes": [{"id": "n1"}], "edges": []}'
    final_outputs = orchestrate(dummy_json_graph)
    assert len(final_outputs) == 0 # No output appended if audit fails
    mock_auditor_audit.assert_called_once()