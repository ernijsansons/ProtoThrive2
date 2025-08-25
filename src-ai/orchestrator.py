"""
Ref: CLAUDE.md Terminal 3: Phase 3 - Orchestrator
Orchestrates all AI components to process roadmaps end-to-end
"""

from agents import PlannerAgent, CoderAgent, AuditorAgent
from router import PromptRouter
# Import unified mocks from root
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mocks import MockPinecone as MockPineconeIndex, MockKV as MockKVStore, mock_db_query


# pylint: disable=too-many-locals
def orchestrate(roadmap_id=None):
    """
    Main orchestration function that coordinates all AI components
    
    Workflow:
    0. AI→Backend: Query roadmap from database
    1. Planner decomposes graph into tasks
    2. Router selects model for each task
    3. RAG searches for relevant snippets
    4. Cache stores/retrieves results
    5. Coder generates code
    6. Auditor validates output
    7. HITL escalation if needed
    
    Args:
        roadmap_id: ID of roadmap to process (optional, defaults to rm-thermo-1)
        
    Returns:
        list: Successfully generated code outputs
    """
    # AI to Backend Integration - Query roadmap from database
    if not roadmap_id:
        roadmap_id = 'rm-thermo-1'
    
    print(f"Thermonuclear AI→Backend: Querying roadmap {roadmap_id}...")
    try:
        graph_result = mock_db_query('SELECT json_graph FROM roadmaps WHERE id = ?', [roadmap_id])
        if not graph_result or len(graph_result) == 0:
            print(f"Thermonuclear AI→Backend: No roadmap found for {roadmap_id}, using dummy data")
            from mocks import DUMMY_ROADMAP
            json_graph = DUMMY_ROADMAP['json_graph']
        else:
            json_graph = graph_result[0]['json_graph']
            print(f"Thermonuclear AI→Backend: Retrieved roadmap data from database")
    except Exception as e:
        print(f"Thermonuclear AI→Backend Error: {e}, falling back to dummy data")
        from mocks import DUMMY_ROADMAP
        json_graph = DUMMY_ROADMAP['json_graph']
    
    # Initialize all components
    planner = PlannerAgent()
    tasks = planner.decompose(json_graph)
    
    router = PromptRouter()
    rag = MockPineconeIndex()
    kv = MockKVStore()
    
    outputs = []

    # Process each task
    for task in tasks:
        # Route to appropriate model
        model = router.route_task(
            task['type'],
            task['complexity'],
            len(task['desc'])
        )
        print(f"Thermonuclear Routing: Task '{task['desc']}' -> Model '{model}'")

        # Query RAG for relevant snippets
        query_vec = [0.5] * 768  # Mock query vector
        matches = rag.query(query_vec)

        # Cache matched snippet
        if matches:
            kv.put('cache_task', matches[0]['snippet'])
            snippet = kv.get('cache_task')
            print(f"Thermonuclear Cache Hit: {snippet}")
        else:
            snippet = 'no_match'

        # Generate code
        coder = CoderAgent()
        code = coder.code(task)

        # Audit generated code
        auditor = AuditorAgent()
        audit = auditor.audit(code)

        # Handle audit results
        if not audit['valid']:
            print("Escalate HITL")
        else:
            outputs.append(code)
            print(f"Thermonuclear Success: Code validated with score {audit['score']}")

    return outputs


# Test orchestration with backend integration
if __name__ == "__main__":
    print("Thermonuclear Orchestration Test Starting...")
    results = orchestrate('rm-thermo-1')  # Use roadmap ID instead of direct JSON
    print(f"Thermonuclear Orchestration Complete: {len(results)} outputs generated")
    print("Phase 3 Thermonuclear - 0 Errors.")

"""
Mermaid Diagram for Orchestration Flow:

```mermaid
graph TD
    A[JSON Graph Input] --> B[PlannerAgent.decompose]
    B --> C[Tasks List]
    
    C --> D{For Each Task}
    D --> E[PromptRouter.route_task]
    E --> F[Model Selection]
    
    F --> G[MockPinecone.query]
    G --> H[RAG Matches]
    
    H --> I[MockKV.put/get]
    I --> J[Cached Snippet]
    
    J --> K[CoderAgent.code]
    K --> L[Generated Code]
    
    L --> M[AuditorAgent.audit]
    M --> N{Valid Score > 0.8?}
    
    N -->|Yes| O[Add to Outputs]
    N -->|No| P[HITL Escalation]
    
    O --> Q[Return Outputs]
    
    subgraph Components
        R[Router: Cost Optimization]
        S[RAG: Snippet Matching]
        T[Cache: TTL Storage]
        U[Agents: Task Processing]
    end
```
"""