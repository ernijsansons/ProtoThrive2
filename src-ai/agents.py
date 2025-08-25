"""
Ref: CLAUDE.md Terminal 3: Phase 3 - CrewAI Agents
CrewAI agent implementations for task planning, coding, and auditing
"""

import json
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mocks import mock_api_call


# Mock CrewAI base class since we're not using the actual library
class Agent:
    """Base Agent class (mock CrewAI)"""

    def __init__(self, role, goal, backbone):
        self.role = role
        self.goal = goal
        self.backbone = backbone


class PlannerAgent(Agent):
    """
    Planner agent that decomposes roadmap graph into executable tasks
    """

    def __init__(self):
        """Initialize with Planner role"""
        super().__init__(
            role='Planner',
            goal='Decompose to tasks',
            backbone='claude'
        )

    def decompose(self, json_graph):
        """
        Decompose JSON graph into tasks
        
        Args:
            json_graph: JSON string representing the roadmap graph
            
        Returns:
            list: Tasks with alternating types and complexity levels
        """
        print("Thermonuclear Planning")

        # Parse the JSON graph
        graph = json.loads(json_graph)

        # Generate tasks for each node
        tasks = []
        for i, node in enumerate(graph['nodes']):
            task = {
                'type': 'ui' if i % 2 else 'code',
                'desc': f'Task for node {node["id"]}',
                'complexity': 'low' if i < 2 else 'high'
            }
            tasks.append(task)

        return tasks


class CoderAgent(Agent):
    """
    Coder agent that generates code for tasks
    """

    def __init__(self):
        """Initialize with Coder role"""
        super().__init__(
            role='Coder',
            goal='Gen code',
            backbone='kimi'
        )

    def code(self, task):
        """
        Generate code for a given task
        
        Args:
            task: Task dictionary with type, desc, complexity
            
        Returns:
            dict: Generated code with metadata
        """
        print(f"Thermonuclear Coding {task['desc']}")

        return {
            'code': f'// Thermo Code for {task["desc"]} - Vibe: Neon'
        }


class AuditorAgent(Agent):
    """
    Auditor agent that validates generated code
    """

    def __init__(self):
        """Initialize with Auditor role"""
        super().__init__(
            role='Auditor',
            goal='Validate',
            backbone='claude'
        )

    def audit(self, code):
        """
        Audit code for validity and quality
        
        Args:
            code: Code dictionary or string to audit
            
        Returns:
            dict: Validation result with score
        """
        print(f"Thermonuclear Auditing {code}")

        # Convert to string if dict
        code_str = str(code)

        # Simple validation: try to parse as JSON
        try:
            json.loads(code_str)
            score = 0.95
        except json.JSONDecodeError:
            # Not JSON, but could still be valid code
            score = 0.6

        return {
            'valid': score > 0.8,
            'score': score
        }

"""
Mermaid Diagram for Agent Flow:

```mermaid
graph TD
    A[JSON Graph] --> B[PlannerAgent]
    B -->|Decompose| C[Tasks List]
    C --> D{For Each Task}
    D --> E[CoderAgent]
    E -->|Generate| F[Code Output]
    F --> G[AuditorAgent]
    G -->|Validate| H{Score > 0.8?}
    H -->|Yes| I[Append to Outputs]
    H -->|No| J[HITL Escalation]
    
    subgraph Agent Roles
        K[Planner - Claude]
        L[Coder - Kimi]
        M[Auditor - Claude]
    end
```
"""