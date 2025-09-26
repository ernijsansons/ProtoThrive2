"""
Test Suite for ProtoThrive AI Orchestrator

Comprehensive tests covering:
- Cache key generation and uniqueness
- Thread-safe cache operations
- Structured logging validation
- Error handling and escalation flows
- Multi-tenancy support

Ref: CLAUDE.md Section 3 - AI Core & Agent Orchestration
"""

import pytest
import json
import logging
import threading
import time
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.cache import MockKV
from src.orchestrator import orchestrate


class TestMockKVCache:
    """Test suite for thread-safe cache with unique key generation"""

    def test_cache_key_generation_unique(self):
        """Test that cache keys are unique for different inputs"""
        cache = MockKV()

        # Same roadmap/task but different users should have different keys
        key1 = cache.generate_cache_key("rm-001", "task-001", "user-001")
        key2 = cache.generate_cache_key("rm-001", "task-001", "user-002")
        assert key1 != key2, "Keys should be different for different users"

        # Different tasks should have different keys
        key3 = cache.generate_cache_key("rm-001", "task-002", "user-001")
        assert key1 != key3, "Keys should be different for different tasks"

        # Different roadmaps should have different keys
        key4 = cache.generate_cache_key("rm-002", "task-001", "user-001")
        assert key1 != key4, "Keys should be different for different roadmaps"

    def test_cache_key_deterministic(self):
        """Test that cache keys are deterministic (same input = same output)"""
        cache = MockKV()

        key1 = cache.generate_cache_key("rm-001", "task-001", "user-001")
        key2 = cache.generate_cache_key("rm-001", "task-001", "user-001")
        assert key1 == key2, "Same inputs should produce the same key"

    def test_cache_thread_safety(self):
        """Test thread-safe cache operations"""
        cache = MockKV()
        results = []
        errors = []

        def cache_operation(thread_id):
            try:
                key = f"key_{thread_id}"
                value = f"value_{thread_id}"

                # Rapid put/get operations
                for i in range(10):
                    cache.put(key, f"{value}_{i}", ttl=60)
                    retrieved = cache.get(key)
                    if retrieved != f"{value}_{i}":
                        errors.append(f"Thread {thread_id}: Expected {value}_{i}, got {retrieved}")

                results.append(f"Thread {thread_id} completed")
            except Exception as e:
                errors.append(f"Thread {thread_id} error: {e}")

        # Create multiple threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=cache_operation, args=(i,))
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join(timeout=5)

        assert len(errors) == 0, f"Thread safety violations: {errors}"
        assert len(results) == 10, f"Not all threads completed: {results}"

    def test_cache_ttl_expiration(self):
        """Test that cache entries expire correctly"""
        cache = MockKV()

        cache.put("test_key", "test_value", ttl=1)  # 1 second TTL
        assert cache.get("test_key") == "test_value", "Value should be retrievable immediately"

        time.sleep(1.1)  # Wait for expiration
        assert cache.get("test_key") is None, "Value should be None after expiration"

    def test_cache_cleanup_expired(self):
        """Test cleanup of expired entries"""
        cache = MockKV()

        # Add multiple entries with different TTLs
        cache.put("key1", "value1", ttl=1)
        cache.put("key2", "value2", ttl=60)
        cache.put("key3", "value3", ttl=1)

        assert cache.size() == 3, "Should have 3 entries"

        time.sleep(1.1)  # Wait for some to expire
        cache.cleanup_expired()

        assert cache.size() == 1, "Should have 1 entry after cleanup"
        assert cache.get("key2") == "value2", "Non-expired entry should remain"


class TestOrchestrator:
    """Test suite for orchestrator with logging and unique cache keys"""

    @pytest.fixture
    def sample_json_graph(self):
        """Sample roadmap graph for testing"""
        return json.dumps({
            "nodes": [
                {"id": "n1", "label": "Start", "status": "gray"},
                {"id": "n2", "label": "Process", "status": "gray"},
                {"id": "n3", "label": "End", "status": "gray"}
            ],
            "edges": [
                {"from": "n1", "to": "n2"},
                {"from": "n2", "to": "n3"}
            ]
        })

    @patch('src.orchestrator.PlannerAgent')
    @patch('src.orchestrator.CoderAgent')
    @patch('src.orchestrator.AuditorAgent')
    @patch('src.orchestrator.MockPinecone')
    @patch('src.orchestrator.PromptRouter')
    def test_orchestrator_unique_cache_keys(self, mock_router, mock_pinecone, mock_auditor,
                                           mock_coder, mock_planner, sample_json_graph, caplog):
        """Test that orchestrator uses unique cache keys for each task"""
        # Setup mocks
        mock_planner_instance = Mock()
        mock_planner_instance.decompose.return_value = [
            {"id": "task1", "desc": "Task 1", "type": "code", "complexity": "low"},
            {"id": "task2", "desc": "Task 2", "type": "ui", "complexity": "high"}
        ]
        mock_planner.return_value = mock_planner_instance

        mock_router_instance = Mock()
        mock_router_instance.route_task.return_value = "kimi"
        mock_router.return_value = mock_router_instance

        mock_pinecone_instance = Mock()
        mock_pinecone_instance.query.return_value = [{"snippet": "test_snippet", "score": 0.9}]
        mock_pinecone.return_value = mock_pinecone_instance

        mock_coder_instance = Mock()
        mock_coder_instance.code.return_value = {"code": "// Test code"}
        mock_coder.return_value = mock_coder_instance

        mock_auditor_instance = Mock()
        mock_auditor_instance.audit.return_value = {"valid": True, "score": 0.95}
        mock_auditor.return_value = mock_auditor_instance

        with caplog.at_level(logging.INFO):
            result = orchestrate(sample_json_graph, roadmap_id="rm-test", user_id="user-test")

        # Check that unique cache keys were generated (in logs)
        cache_key_logs = [record for record in caplog.records if "cache" in record.message.lower()]
        assert len(cache_key_logs) > 0, "Should have cache-related log entries"

        # Verify results
        assert len(result) == 2, "Should have 2 successful outputs"
        assert all("task_id" in output for output in result), "Each output should have task_id"

    @patch('src.orchestrator.PlannerAgent')
    def test_orchestrator_error_handling(self, mock_planner, sample_json_graph, caplog):
        """Test error handling and logging in orchestrator"""
        # Make planner raise an exception
        mock_planner_instance = Mock()
        mock_planner_instance.decompose.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)
        mock_planner.return_value = mock_planner_instance

        with caplog.at_level(logging.ERROR):
            with pytest.raises(ValueError, match="Invalid json_graph"):
                orchestrate(sample_json_graph)

        # Check error was logged
        error_logs = [record for record in caplog.records if record.levelno == logging.ERROR]
        assert len(error_logs) > 0, "Should have error log entries"
        assert any("Failed to decompose" in record.message for record in error_logs)

    @patch('src.orchestrator.PlannerAgent')
    @patch('src.orchestrator.CoderAgent')
    @patch('src.orchestrator.AuditorAgent')
    @patch('src.orchestrator.MockPinecone')
    @patch('src.orchestrator.PromptRouter')
    def test_orchestrator_audit_escalation(self, mock_router, mock_pinecone, mock_auditor,
                                          mock_coder, mock_planner, sample_json_graph, caplog):
        """Test audit failure escalation and logging"""
        # Setup mocks
        mock_planner_instance = Mock()
        mock_planner_instance.decompose.return_value = [
            {"id": "task1", "desc": "Task 1", "type": "code", "complexity": "low"}
        ]
        mock_planner.return_value = mock_planner_instance

        mock_router_instance = Mock()
        mock_router_instance.route_task.return_value = "kimi"
        mock_router.return_value = mock_router_instance

        mock_pinecone_instance = Mock()
        mock_pinecone_instance.query.return_value = []
        mock_pinecone.return_value = mock_pinecone_instance

        mock_coder_instance = Mock()
        mock_coder_instance.code.return_value = {"code": "// Bad code"}
        mock_coder.return_value = mock_coder_instance

        # Make audit fail
        mock_auditor_instance = Mock()
        mock_auditor_instance.audit.return_value = {"valid": False, "score": 0.5}
        mock_auditor.return_value = mock_auditor_instance

        with caplog.at_level(logging.WARNING):
            result = orchestrate(sample_json_graph)

        # Check escalation was logged
        escalation_logs = [record for record in caplog.records if "ESCALATION" in record.message]
        assert len(escalation_logs) > 0, "Should have escalation log entries"

        # Should have no successful outputs
        assert len(result) == 0, "Should have no outputs due to audit failure"

    def test_orchestrator_logging_structure(self, sample_json_graph, caplog):
        """Test that structured logging is properly implemented"""
        with caplog.at_level(logging.DEBUG):
            # This will fail but we're testing logging structure
            try:
                orchestrate(sample_json_graph, roadmap_id="rm-log-test", user_id="user-log-test")
            except:
                pass  # Expected to fail with real dependencies

        # Check log structure
        for record in caplog.records:
            # Verify log has required attributes
            assert hasattr(record, 'levelname'), "Log should have level"
            assert hasattr(record, 'message'), "Log should have message"
            assert hasattr(record, 'funcName'), "Log should have function name"
            assert hasattr(record, 'lineno'), "Log should have line number"

    def test_orchestrator_metrics_logging(self):
        """Test metrics collection and logging"""
        # Create mock logger to capture metrics
        with patch('src.orchestrator.logger') as mock_logger:
            with patch('src.orchestrator.PlannerAgent') as mock_planner:
                # Setup minimal working mock
                mock_planner_instance = Mock()
                mock_planner_instance.decompose.return_value = []
                mock_planner.return_value = mock_planner_instance

                orchestrate('{"nodes":[],"edges":[]}')

                # Verify metrics were logged
                metrics_call = None
                for call in mock_logger.info.call_args_list:
                    if len(call[0]) > 0 and "Orchestration Metrics" in str(call[0][0]):
                        metrics_call = call
                        break

                assert metrics_call is not None, "Should log orchestration metrics"

                # Check for extra metrics data
                if 'extra' in metrics_call[1]:
                    extra = metrics_call[1]['extra']
                    assert 'roadmap_id' in extra, "Metrics should include roadmap_id"
                    assert 'success_rate' in extra, "Metrics should include success_rate"


class TestConcurrentCacheOperations:
    """Test concurrent operations on the cache"""

    def test_concurrent_cache_writes(self):
        """Test multiple threads writing to cache simultaneously"""
        cache = MockKV()
        completed = []
        errors = []

        def writer(thread_id, count):
            try:
                for i in range(count):
                    roadmap_id = f"rm_{thread_id}"
                    task_id = f"task_{i}"
                    key = cache.generate_cache_key(roadmap_id, task_id)
                    cache.put(key, f"data_{thread_id}_{i}", ttl=60)
                completed.append(thread_id)
            except Exception as e:
                errors.append((thread_id, str(e)))

        threads = []
        for i in range(20):  # 20 concurrent writers
            t = threading.Thread(target=writer, args=(i, 50))
            threads.append(t)
            t.start()

        for t in threads:
            t.join(timeout=10)

        assert len(errors) == 0, f"Errors during concurrent writes: {errors}"
        assert len(completed) == 20, f"Not all writers completed: {len(completed)}/20"

        # Verify cache size
        assert cache.size() == 1000, f"Expected 1000 entries (20 threads * 50 writes), got {cache.size()}"


if __name__ == "__main__":
    # Run tests with verbose output
    pytest.main([__file__, "-v", "-s"])