#!/usr/bin/env python3
"""
Test suite for performance utilities
"""

import pytest
import os
import sys
import time
import asyncio

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.utils.performance import memoize, run_in_threadpool, batch_process, PerformanceMonitor

class TestMemoize:
    """Test cases for memoize decorator"""
    
    def test_memoize_basic(self):
        """Test basic memoization functionality"""
        call_count = 0
        
        @memoize()
        def expensive_function(x, y):
            nonlocal call_count
            call_count += 1
            return x + y
        
        # First call should increment counter
        result1 = expensive_function(1, 2)
        assert result1 == 3
        assert call_count == 1
        
        # Second call with same args should use cache
        result2 = expensive_function(1, 2)
        assert result2 == 3
        assert call_count == 1  # Should not increment
        
        # Different args should increment counter
        result3 = expensive_function(2, 3)
        assert result3 == 5
        assert call_count == 2
    
    def test_memoize_with_kwargs(self):
        """Test memoization with keyword arguments"""
        call_count = 0
        
        @memoize()
        def function_with_kwargs(x, y, z=0):
            nonlocal call_count
            call_count += 1
            return x + y + z
        
        # Test with different kwarg combinations
        result1 = function_with_kwargs(1, 2)
        assert result1 == 3
        assert call_count == 1
        
        result2 = function_with_kwargs(1, 2, z=3)
        assert result2 == 6
        assert call_count == 2
        
        # Same args should use cache
        result3 = function_with_kwargs(1, 2)
        assert result3 == 3
        assert call_count == 2  # Should not increment
    
    def test_memoize_ttl(self):
        """Test memoization with TTL"""
        call_count = 0
        
        @memoize(ttl=0.1)  # Very short TTL for testing
        def ttl_function(x):
            nonlocal call_count
            call_count += 1
            return x * 2
        
        # First call
        result1 = ttl_function(5)
        assert result1 == 10
        assert call_count == 1
        
        # Immediate second call should use cache
        result2 = ttl_function(5)
        assert result2 == 10
        assert call_count == 1
        
        # Wait for TTL to expire
        time.sleep(0.2)
        
        # Call after TTL should increment counter
        result3 = ttl_function(5)
        assert result3 == 10
        assert call_count == 2

class TestRunInThreadpool:
    """Test cases for run_in_threadpool function"""
    
    def test_run_in_threadpool_basic(self):
        """Test basic threadpool functionality"""
        async def test_async():
            def cpu_intensive(x):
                time.sleep(0.1)  # Simulate CPU work
                return x * 2
            
            result = await run_in_threadpool(cpu_intensive, 5)
            return result
        
        result = asyncio.run(test_async())
        assert result == 10
    
    def test_run_in_threadpool_with_kwargs(self):
        """Test threadpool with keyword arguments"""
        async def test_async():
            def function_with_kwargs(x, y, z=0):
                time.sleep(0.1)
                return x + y + z
            
            result = await run_in_threadpool(function_with_kwargs, 1, 2, z=3)
            return result
        
        result = asyncio.run(test_async())
        assert result == 6

class TestBatchProcess:
    """Test cases for batch_process function"""
    
    def test_batch_process_basic(self):
        """Test basic batch processing"""
        items = list(range(10))
        batches = list(batch_process(items, batch_size=3))
        
        assert len(batches) == 4
        assert batches[0] == [0, 1, 2]
        assert batches[1] == [3, 4, 5]
        assert batches[2] == [6, 7, 8]
        assert batches[3] == [9]
    
    def test_batch_process_empty(self):
        """Test batch processing with empty list"""
        items = []
        batches = list(batch_process(items, batch_size=5))
        
        assert len(batches) == 0
    
    def test_batch_process_smaller_than_batch(self):
        """Test batch processing with fewer items than batch size"""
        items = [1, 2]
        batches = list(batch_process(items, batch_size=5))
        
        assert len(batches) == 1
        assert batches[0] == [1, 2]
    
    def test_batch_process_custom_size(self):
        """Test batch processing with custom batch size"""
        items = list(range(20))
        batches = list(batch_process(items, batch_size=7))
        
        assert len(batches) == 3
        assert batches[0] == [0, 1, 2, 3, 4, 5, 6]
        assert batches[1] == [7, 8, 9, 10, 11, 12, 13]
        assert batches[2] == [14, 15, 16, 17, 18, 19]

class TestPerformanceMonitor:
    """Test cases for PerformanceMonitor class"""
    
    def test_performance_monitor_basic(self):
        """Test basic performance monitoring"""
        monitor = PerformanceMonitor()
        
        # Start timing
        monitor.start_timer("test_operation")
        time.sleep(0.1)  # Simulate work
        duration = monitor.end_timer("test_operation")
        
        assert duration > 0
        assert duration >= 0.1
        assert "test_operation" in monitor.get_metrics()
    
    def test_performance_monitor_multiple_operations(self):
        """Test monitoring multiple operations"""
        monitor = PerformanceMonitor()
        
        # Monitor multiple operations
        monitor.start_timer("op1")
        time.sleep(0.05)
        duration1 = monitor.end_timer("op1")
        
        monitor.start_timer("op2")
        time.sleep(0.1)
        duration2 = monitor.end_timer("op2")
        
        metrics = monitor.get_metrics()
        
        assert "op1" in metrics
        assert "op2" in metrics
        assert duration1 < duration2
        assert len(metrics) == 2
    
    def test_performance_monitor_end_without_start(self):
        """Test ending timer without starting it"""
        monitor = PerformanceMonitor()
        
        duration = monitor.end_timer("nonexistent")
        assert duration == 0.0
    
    def test_performance_monitor_get_metrics(self):
        """Test getting metrics"""
        monitor = PerformanceMonitor()
        
        # Start and end a timer
        monitor.start_timer("test")
        time.sleep(0.01)
        monitor.end_timer("test")
        
        metrics = monitor.get_metrics()
        
        assert isinstance(metrics, dict)
        assert "test" in metrics
        assert "duration" in metrics["test"]
        assert metrics["test"]["duration"] > 0
    
    def test_performance_monitor_metrics_copy(self):
        """Test that get_metrics returns a copy"""
        monitor = PerformanceMonitor()
        
        monitor.start_timer("test")
        time.sleep(0.01)
        monitor.end_timer("test")
        
        metrics1 = monitor.get_metrics()
        metrics2 = monitor.get_metrics()
        
        # Modify one copy
        metrics1["test"]["duration"] = 999
        
        # Other copy should be unchanged
        assert metrics2["test"]["duration"] != 999

if __name__ == "__main__":
    pytest.main([__file__])
