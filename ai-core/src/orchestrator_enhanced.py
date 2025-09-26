"""
ProtoThrive AI Orchestrator - Enhanced with Enterprise Observability
Multi-Agent Task Coordination System with structured logging, metrics, and monitoring

This module coordinates the execution of multiple AI agents to transform roadmap graphs
into executable code through an intelligent pipeline with comprehensive observability.
"""

import hashlib
import json
import time
from typing import List, Dict, Any, Optional

# Import structured logger
try:
    from .logger import get_logger
    logger = get_logger('ai-orchestrator', '2.0.0')
except ImportError:
    # Fallback to standard logging if structured logger not available
    import logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
    )
    logger = logging.getLogger(__name__)

from .router import PromptRouter
from .rag import MockPinecone
from .agents import PlannerAgent, CoderAgent, AuditorAgent
from .cache import MockKV

def orchestrate(json_graph: str, roadmap_id: Optional[str] = None, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Enhanced orchestrator with comprehensive observability and monitoring

    Args:
        json_graph (str): JSON string containing roadmap nodes and edges
        roadmap_id (Optional[str]): Unique identifier for the roadmap
        user_id (Optional[str]): User identifier for multi-tenancy

    Returns:
        List[Dict[str, Any]]: List of generated code outputs that passed quality checks
    """
    orchestration_start_time = time.time()

    # Generate unique identifiers if not provided
    if not roadmap_id:
        roadmap_id = f"rm_{hashlib.md5(json_graph.encode()).hexdigest()[:8]}"
        logger.info('Generated roadmap ID', roadmap_id=roadmap_id)

    if not user_id:
        user_id = "uuid-thermo-1"  # Default user for testing
        logger.debug('Using default user ID', user_id=user_id)

    logger.info('Starting orchestration',
               roadmap_id=roadmap_id,
               user_id=user_id,
               graph_size=len(json_graph))

    # Initialize all system components with error handling
    try:
        planner = PlannerAgent()
        router = PromptRouter()
        rag = MockPinecone()
        kv = MockKV()
        logger.debug('AI components initialized successfully')
    except Exception as e:
        logger.critical('Failed to initialize AI components', error=e)
        raise RuntimeError(f"System initialization failed: {e}")

    # Process roadmap through complete pipeline
    try:
        tasks = planner.decompose(json_graph)
        logger.info('Roadmap decomposed', task_count=len(tasks))
    except Exception as e:
        logger.error('Failed to decompose roadmap', error=e)
        raise ValueError(f"Invalid json_graph: {e}")

    outputs = []
    task_metrics = {'successful': 0, 'failed': 0, 'escalated': 0}

    # Process each task through the complete AI pipeline
    for idx, task in enumerate(tasks, 1):
        task_start_time = time.time()
        task_id = task.get('id', f"task_{idx}_{task.get('type', 'unknown')}")

        # Create child logger for this task
        if hasattr(logger, 'child'):
            task_logger = logger.child('task_processor', task_id=task_id)
        else:
            task_logger = logger

        task_logger.info('Processing task',
                        task_index=f"{idx}/{len(tasks)}",
                        task_type=task['type'],
                        complexity=task['complexity'],
                        description=task['desc'])

        try:
            # Step 2: Route to optimal model
            model = router.route_task(task['type'], task['complexity'], len(task['desc']))
            task_logger.info('Task routed', selected_model=model)

            # Estimate cost for this task
            estimated_cost = router.estimate_cost(len(task['desc']), model)
            if hasattr(logger, 'metric'):
                logger.metric('ai.estimated_cost', estimated_cost, 'usd', {'model': model})

        except Exception as e:
            task_logger.error('Task routing failed', error=e)
            task_metrics['failed'] += 1
            continue

        # Step 3: Retrieve relevant context using RAG
        try:
            cache_key = kv.generate_cache_key(roadmap_id, task_id, user_id)
            cached_snippet = kv.get(cache_key)

            if cached_snippet:
                snippet = cached_snippet
                task_logger.debug('Cache hit', cache_key=cache_key)
            else:
                query_vec = [0.5] * 768  # Mock embedding
                matches = rag.query(query_vec)

                if matches:
                    snippet = matches[0]['snippet']
                    kv.put(cache_key, snippet, ttl=3600)
                    task_logger.info('RAG matches found',
                                   match_count=len(matches),
                                   cached_key=cache_key)
                else:
                    snippet = 'no_match'
                    task_logger.warning('No RAG context found')

        except Exception as e:
            task_logger.error('RAG/Cache error', error=e)
            snippet = 'error_retrieving_context'

        # Step 4: Generate code
        try:
            generation_start = time.time()
            coder = CoderAgent()
            code_result = coder.code(task)
            generation_duration = (time.time() - generation_start) * 1000

            code_length = len(code_result.get('code', ''))
            task_logger.info('Code generated',
                           code_length=code_length,
                           generation_duration_ms=generation_duration)

            # Log AI inference metrics
            if hasattr(logger, 'ai_inference'):
                logger.ai_inference(
                    model=model,
                    task_type=task['type'],
                    prompt_tokens=50,  # Estimated
                    completion_tokens=code_length // 4,  # Rough estimate: 1 token ≈ 4 chars
                    duration_ms=generation_duration,
                    cost_usd=estimated_cost,
                    success=True,
                    task_id=task_id,
                    complexity=task['complexity']
                )

        except Exception as e:
            task_logger.error('Code generation failed', error=e)
            task_metrics['failed'] += 1
            continue

        # Step 5: Quality assurance
        try:
            auditor = AuditorAgent()
            audit_result = auditor.audit(code_result)

            if not audit_result['valid']:
                task_logger.warning('Quality audit failed - escalating to HITL',
                                  audit_score=audit_result['score'],
                                  threshold=0.8)
                task_metrics['escalated'] += 1

                # Log audit event for compliance
                if hasattr(logger, 'audit'):
                    logger.audit('hitl_escalation', 'system', {
                        'roadmap_id': roadmap_id,
                        'task_id': task_id,
                        'audit_score': audit_result['score'],
                        'reason': 'quality_threshold_not_met',
                        'task_type': task['type'],
                        'complexity': task['complexity']
                    })
            else:
                # Success case
                task_duration = (time.time() - task_start_time) * 1000
                outputs.append({
                    **code_result,
                    'task_id': task_id,
                    'audit_score': audit_result['score'],
                    'generation_duration_ms': generation_duration,
                    'task_duration_ms': task_duration
                })
                task_metrics['successful'] += 1

                task_logger.info('Task completed successfully',
                               audit_score=audit_result['score'],
                               task_duration_ms=task_duration)

                # Log performance metrics
                if hasattr(logger, 'metric'):
                    logger.metric(f'task.{task["type"]}.duration', task_duration, 'ms', {
                        'complexity': task['complexity'],
                        'success': 'true',
                        'audit_score': str(round(audit_result['score'], 2))
                    })

        except Exception as e:
            task_logger.error('Audit failed', error=e)
            task_metrics['failed'] += 1

    # Calculate final metrics
    orchestration_duration = (time.time() - orchestration_start_time) * 1000
    success_rate = task_metrics['successful'] / len(tasks) if tasks else 0

    logger.info('Orchestration completed',
               roadmap_id=roadmap_id,
               user_id=user_id,
               total_tasks=len(tasks),
               successful_tasks=task_metrics['successful'],
               failed_tasks=task_metrics['failed'],
               escalated_tasks=task_metrics['escalated'],
               success_rate=success_rate,
               orchestration_duration_ms=orchestration_duration)

    # Log comprehensive business metrics
    if hasattr(logger, 'metric'):
        logger.metric('orchestration.success_rate', success_rate, 'ratio', {
            'roadmap_id': roadmap_id,
            'user_id': user_id
        })
        logger.metric('orchestration.duration', orchestration_duration, 'ms')
        logger.metric('orchestration.tasks.total', len(tasks), 'count')
        logger.metric('orchestration.tasks.successful', task_metrics['successful'], 'count')
        logger.metric('orchestration.tasks.failed', task_metrics['failed'], 'count')
        logger.metric('orchestration.tasks.escalated', task_metrics['escalated'], 'count')

    return outputs

# Test data
dummy_json_graph = '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}'

if __name__ == "__main__":
    # Test orchestration with enhanced logging
    result = orchestrate(
        dummy_json_graph,
        roadmap_id="rm-test-enhanced",
        user_id="user-test-enhanced"
    )
    print(f"Enhanced orchestration complete: {len(result)} outputs generated")