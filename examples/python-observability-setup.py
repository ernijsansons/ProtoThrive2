"""
ProtoThrive AI Core Observability Setup Example
Demonstrates how to integrate structured logging in Python AI components

Ref: CLAUDE.md Section 3 - AI Core & Agent Orchestration
"""

import os
import sys
import time
from datetime import datetime

# Add the ai-core src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai-core', 'src'))

from logger import StructuredLogger, get_logger, initialize_logger

def main():
    print("ProtoThrive AI Core Observability Setup Example")
    print("=" * 60)

    # Example 1: Basic Logger Initialization
    logger = StructuredLogger("protothrive-ai-example", "2.0.0")
    print("✅ Basic logger initialized")

    # Example 2: Environment-specific Configuration
    os.environ['ENVIRONMENT'] = 'development'
    dev_logger = StructuredLogger("ai-dev", "2.0.0")

    os.environ['ENVIRONMENT'] = 'production'
    prod_logger = StructuredLogger("ai-prod", "2.0.0")
    print("✅ Environment-specific loggers created")

    # Example 3: Basic Logging Methods
    logger.info("AI Core system initialized",
                components=["orchestrator", "router", "agents"],
                startup_time=1.23)

    logger.debug("Debug information",
                 debug_level="verbose",
                 module="example")

    logger.warning("Performance degradation detected",
                   response_time=2.5,
                   threshold=2.0)

    # Example 4: Error Logging with Exception Handling
    try:
        # Simulate an error
        raise ValueError("Example AI processing error")
    except ValueError as e:
        logger.error("AI processing failed",
                     error=e,
                     task_id="task-123",
                     model="gpt-4")

    print("✅ Basic logging methods demonstrated")

    # Example 5: AI-Specific Inference Logging
    logger.ai_inference(
        model="gpt-4",
        task_type="code_generation",
        prompt_tokens=150,
        completion_tokens=300,
        duration_ms=1500,
        cost_usd=0.025,
        success=True,
        task_id="code-gen-001",
        user_id="user-123"
    )

    logger.ai_inference(
        model="claude-3",
        task_type="analysis",
        prompt_tokens=200,
        completion_tokens=0,
        duration_ms=5000,
        cost_usd=0.030,
        success=False,
        error_reason="timeout",
        task_id="analysis-002"
    )

    print("✅ AI inference logging demonstrated")

    # Example 6: Performance Monitoring with Decorators
    @logger.performance("data_processing")
    def process_large_dataset(size):
        """Simulate data processing with performance monitoring"""
        time.sleep(0.1 * size)  # Simulate work
        return f"Processed {size} items"

    @logger.performance("model_inference")
    def run_model_inference(model_name, input_data):
        """Simulate model inference with monitoring"""
        time.sleep(0.05)  # Simulate inference time
        return {"result": f"Inference complete for {model_name}", "confidence": 0.95}

    # Execute monitored functions
    result1 = process_large_dataset(5)
    result2 = run_model_inference("gpt-4", {"prompt": "Generate code"})

    print("✅ Performance monitoring with decorators demonstrated")

    # Example 7: Metric Logging
    logger.metric("model_accuracy", 0.95, "ratio", {"model": "gpt-4", "task": "code_gen"})
    logger.metric("processing_time", 2.5, "seconds", {"component": "orchestrator"})
    logger.metric("memory_usage", 512, "MB", {"process": "ai-worker"})
    logger.metric("queue_size", 25, "count", {"queue": "high_priority"})

    print("✅ Metric logging demonstrated")

    # Example 8: Audit Logging for Compliance
    logger.audit("model_invocation", "user-123", {
        "model": "gpt-4",
        "task_type": "code_generation",
        "input_size": 150,
        "output_size": 300,
        "cost": 0.025,
        "timestamp": datetime.utcnow().isoformat()
    })

    logger.audit("data_access", "admin-456", {
        "resource": "training_data",
        "action": "read",
        "records_accessed": 1000,
        "purpose": "model_training"
    })

    print("✅ Audit logging demonstrated")

    # Example 9: Child Logger for Components
    orchestrator_logger = logger.child("orchestrator", task_id="orch-001")
    agent_logger = logger.child("coder_agent", agent_id="agent-002")

    orchestrator_logger.info("Task orchestration started",
                           total_tasks=5,
                           priority="high")

    agent_logger.info("Code generation completed",
                     lines_generated=150,
                     language="python")

    print("✅ Child loggers for components demonstrated")

    # Example 10: Data Sanitization Testing
    sensitive_data = {
        "user_id": "user-123",
        "api_key": "sk-secret-key-123",
        "password": "secret-password",
        "token": "bearer-token-xyz",
        "model_config": {
            "temperature": 0.7,
            "max_tokens": 1000,
            "secret_param": "hidden-value"
        },
        "safe_data": "this is safe to log"
    }

    logger.info("Testing data sanitization", **sensitive_data)
    print("✅ Data sanitization demonstrated")

    # Example 11: Large Data Handling
    large_dataset = {
        "records": [{"id": i, "data": f"record_{i}"} for i in range(100)],
        "metadata": {
            "total_records": 100,
            "processing_time": 5.2,
            "model_version": "2.0.0"
        }
    }

    logger.info("Processing large dataset", dataset=large_dataset)
    print("✅ Large data handling demonstrated")

    # Example 12: Circular Reference Handling
    circular_data = {"id": "test", "name": "circular_test"}
    circular_data["self_reference"] = circular_data

    logger.info("Testing circular reference handling", data=circular_data)
    print("✅ Circular reference handling demonstrated")

    # Example 13: Singleton Pattern Usage
    # Initialize global logger
    global_logger = initialize_logger("protothrive-global", "2.0.0")

    # Get the same instance from anywhere
    same_logger = get_logger()

    print(f"✅ Singleton pattern: Same instance? {global_logger is same_logger}")

    # Example 14: Error Handling Edge Cases
    # Test with None values
    logger.info("Testing None values", data=None, empty_dict={}, empty_list=[])

    # Test with various data types
    logger.info("Testing data types",
                string_data="test",
                number_data=42,
                float_data=3.14,
                bool_data=True,
                list_data=[1, 2, 3],
                set_data={"a", "b", "c"})  # Sets will be converted

    print("✅ Edge case handling demonstrated")

    # Example 15: Concurrent Logging Simulation
    import threading
    import queue

    def worker_function(worker_id, result_queue):
        """Simulate concurrent AI processing with logging"""
        worker_logger = logger.child("worker", worker_id=worker_id)

        for i in range(5):
            worker_logger.info(f"Worker {worker_id} processing task {i}",
                             task_id=f"task-{worker_id}-{i}",
                             progress=f"{i+1}/5")
            time.sleep(0.01)  # Simulate work

        result_queue.put(f"worker_{worker_id}_completed")

    # Start multiple worker threads
    threads = []
    results = queue.Queue()

    for i in range(3):
        thread = threading.Thread(target=worker_function, args=(i, results))
        threads.append(thread)
        thread.start()

    # Wait for completion
    for thread in threads:
        thread.join()

    # Collect results
    completed_workers = []
    while not results.empty():
        completed_workers.append(results.get())

    logger.info("Concurrent processing completed",
                workers_completed=len(completed_workers),
                results=completed_workers)

    print("✅ Concurrent logging demonstrated")

    # Example 16: Integration with AI Orchestrator Workflow
    def simulate_ai_orchestration():
        """Simulate a complete AI orchestration workflow with logging"""
        workflow_logger = logger.child("orchestrator", workflow_id="wf-001")

        # Start workflow
        workflow_logger.info("AI orchestration workflow started",
                           roadmap_id="rm-123",
                           user_id="user-456",
                           priority="high")

        # Task decomposition
        tasks = ["ui_component", "backend_api", "database_schema"]
        workflow_logger.info("Tasks decomposed",
                           total_tasks=len(tasks),
                           task_types=tasks)

        # Process each task
        for i, task in enumerate(tasks):
            task_logger = workflow_logger.child("task_processor", task_id=f"task-{i}")

            # Start task
            task_logger.info("Task processing started",
                           task_type=task,
                           position=f"{i+1}/{len(tasks)}")

            # Simulate AI inference
            workflow_logger.ai_inference(
                model="gpt-4",
                task_type=task,
                prompt_tokens=100 + i * 20,
                completion_tokens=200 + i * 30,
                duration_ms=1000 + i * 200,
                cost_usd=0.01 * (i + 1),
                success=True,
                task_id=f"task-{i}"
            )

            # Complete task
            task_logger.info("Task processing completed",
                           success=True,
                           output_size=f"{200 + i * 30} tokens")

        # Complete workflow
        workflow_logger.info("AI orchestration workflow completed",
                           total_tasks=len(tasks),
                           success_rate=1.0,
                           total_cost=0.06)

    simulate_ai_orchestration()
    print("✅ AI orchestration workflow logging demonstrated")

    print("\n" + "=" * 60)
    print("🎉 ProtoThrive AI Core Observability Setup Example Completed!")
    print("📚 Check the test files in ai-core/tests/ for more examples")
    print("🔧 Customize the logger configuration for your specific AI components")
    print("📊 View logs in development console or configure for production systems")


if __name__ == "__main__":
    main()