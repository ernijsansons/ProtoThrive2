#!/usr/bin/env python
"""
Demo script showcasing the refactored orchestrator with:
- Unique cache keys per roadmap/task
- Structured logging
- Thread-safe cache operations

Ref: CLAUDE.md Section 3 - AI Core & Agent Orchestration
"""

import logging
import json
import threading
import time
from src.cache import MockKV
from src.orchestrator import orchestrate

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
)

logger = logging.getLogger(__name__)


def demo_cache_uniqueness():
    """Demonstrate unique cache key generation"""
    print("\n" + "="*60)
    print("DEMO: Unique Cache Key Generation")
    print("="*60)

    cache = MockKV()

    # Generate keys for different scenarios
    scenarios = [
        ("rm-001", "task-001", "user-001"),
        ("rm-001", "task-001", "user-002"),  # Same task, different user
        ("rm-001", "task-002", "user-001"),  # Different task, same user
        ("rm-002", "task-001", "user-001"),  # Different roadmap
    ]

    keys = []
    for roadmap, task, user in scenarios:
        key = cache.generate_cache_key(roadmap, task, user)
        keys.append(key)
        print(f"Roadmap: {roadmap}, Task: {task}, User: {user}")
        print(f"  -> Generated Key: {key}")

    # Verify uniqueness
    unique_keys = set(keys)
    print(f"\nTotal keys: {len(keys)}, Unique keys: {len(unique_keys)}")
    print(f"All keys unique: {len(keys) == len(unique_keys)} [PASS]" if len(keys) == len(unique_keys) else "Collision detected! [FAIL]")


def demo_thread_safety():
    """Demonstrate thread-safe cache operations"""
    print("\n" + "="*60)
    print("DEMO: Thread-Safe Cache Operations")
    print("="*60)

    cache = MockKV()
    results = []

    def worker(worker_id, iterations=5):
        """Worker function for concurrent cache operations"""
        for i in range(iterations):
            key = cache.generate_cache_key(f"rm-{worker_id}", f"task-{i}", f"user-{worker_id}")
            value = f"Worker {worker_id} - Iteration {i}"

            # Simulate work
            cache.put(key, value, ttl=60)
            retrieved = cache.get(key)

            if retrieved == value:
                results.append((worker_id, i, "PASS"))
            else:
                results.append((worker_id, i, "FAIL"))

            time.sleep(0.01)  # Small delay to increase chance of race conditions

    # Launch multiple threads
    threads = []
    num_workers = 5
    for i in range(num_workers):
        thread = threading.Thread(target=worker, args=(i,))
        threads.append(thread)
        thread.start()

    # Wait for completion
    for thread in threads:
        thread.join()

    # Report results
    print(f"\nLaunched {num_workers} workers performing concurrent cache operations")
    success_count = sum(1 for _, _, status in results if status == "PASS")
    print(f"Successful operations: {success_count}/{len(results)}")

    # Show cache statistics
    print(f"Final cache size: {cache.size()} entries")


def demo_orchestration():
    """Demonstrate orchestration with structured logging"""
    print("\n" + "="*60)
    print("DEMO: Orchestration with Structured Logging")
    print("="*60)

    # Sample roadmap
    roadmap = {
        "nodes": [
            {"id": "auth", "label": "Authentication Module", "status": "gray"},
            {"id": "api", "label": "API Gateway", "status": "gray"},
            {"id": "db", "label": "Database Layer", "status": "gray"}
        ],
        "edges": [
            {"from": "auth", "to": "api"},
            {"from": "api", "to": "db"}
        ]
    }

    print("\nRoadmap structure:")
    print(f"  - Nodes: {len(roadmap['nodes'])} ({', '.join(n['label'] for n in roadmap['nodes'])})")
    print(f"  - Edges: {len(roadmap['edges'])}")

    print("\nStarting orchestration...")
    print("(Note: This will fail with real agent calls, but demonstrates logging)")

    try:
        # Attempt orchestration with explicit IDs for caching
        result = orchestrate(
            json.dumps(roadmap),
            roadmap_id="demo-roadmap-001",
            user_id="demo-user-001"
        )
        print(f"\nOrchestration completed: {len(result)} outputs generated")
    except Exception as e:
        print(f"\nExpected error (agents not mocked): {e}")


def demo_cache_ttl():
    """Demonstrate cache TTL expiration"""
    print("\n" + "="*60)
    print("DEMO: Cache TTL and Expiration")
    print("="*60)

    cache = MockKV()

    # Add entries with different TTLs
    cache.put("short_ttl", "expires quickly", ttl=2)
    cache.put("long_ttl", "expires slowly", ttl=10)

    print("Added two cache entries:")
    print("  - 'short_ttl': TTL = 2 seconds")
    print("  - 'long_ttl': TTL = 10 seconds")

    # Check immediately
    print("\nImmediate retrieval:")
    print(f"  - short_ttl: {cache.get('short_ttl')}")
    print(f"  - long_ttl: {cache.get('long_ttl')}")

    # Wait and check again
    print("\nWaiting 3 seconds...")
    time.sleep(3)

    print("After 3 seconds:")
    print(f"  - short_ttl: {cache.get('short_ttl')} (should be None)")
    print(f"  - long_ttl: {cache.get('long_ttl')} (should still exist)")

    # Cleanup expired entries
    print(f"\nCache size before cleanup: {cache.size()}")
    cache.cleanup_expired()
    print(f"Cache size after cleanup: {cache.size()}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("ProtoThrive AI Core - Refactored Components Demo")
    print("="*60)

    # Run all demonstrations
    demo_cache_uniqueness()
    demo_thread_safety()
    demo_cache_ttl()
    demo_orchestration()

    print("\n" + "="*60)
    print("Demo completed successfully!")
    print("="*60)