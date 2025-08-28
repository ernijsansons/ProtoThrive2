# Ref: CLAUDE.md Terminal 3 Phase 3 - AI Core Orchestrator
# Thermonuclear Agent Orchestrator for ProtoThrive

import numpy as np

from .agents import PlannerAgent, CoderAgent, AuditorAgent
from .router import PromptRouter
from .rag import MockPinecone
from .cache import MockKV

def orchestrate(json_graph):
    """
    Main orchestration function to run the AI agent crew.
    """
    print("--- Thermonuclear Orchestration Start ---")
    
    # Initialize components
    planner = PlannerAgent()
    coder = CoderAgent()
    auditor = AuditorAgent()
    router = PromptRouter()
    rag = MockPinecone()
    kv = MockKV()
    
    # 1. Decompose graph into tasks
    tasks = planner.decompose(json_graph)
    if not tasks:
        print("Orchestration failed: No tasks generated.")
        return []
        
    outputs = []
    
    # 2. Process each task
    for i, task in enumerate(tasks):
        print(f"\n--- Processing Task {i+1}/{len(tasks)}: {task['desc']} ---")
        
        # 3. Route task to appropriate model
        model = router.route_task(task['type'], task['complexity'], len(task['desc']))
        print(f"Task routed to: {model}")
        
        # 4. RAG: Query for relevant snippets
        cache_key = f"rag_query_{task['type']}"
        cached_snippets = kv.get(cache_key)
        
        if cached_snippets:
            print("Found relevant snippets in cache.")
            matches = cached_snippets
        else:
            query_vec = np.random.rand(768).tolist() # Dummy vector
            matches = rag.query(query_vec)
            if matches:
                print(f"Found {len(matches)} relevant snippets from RAG.")
                kv.put(cache_key, matches, ttl=600) # Cache for 10 mins
            else:
                print("No relevant snippets found from RAG.")

        # 5. Generate code
        code_output = coder.code(task)
        
        # 6. Audit code
        audit_result = auditor.audit(code_output)
        
        if not audit_result['valid']:
            print(f"Audit failed for task {task['desc']}. Escalating to HITL.")
            # In a real system, this would trigger a notification
        else:
            print(f"Audit passed for task {task['desc']}. Appending to outputs.")
            outputs.append(code_output)
            
    print("\n--- Thermonuclear Orchestration End ---")
    return outputs


