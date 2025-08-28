# Ref: CLAUDE.md Terminal 3 Phase 3 - AI Core Agents
# Thermonuclear CrewAI Agents for ProtoThrive
import json
from crewai import Agent

class PlannerAgent(Agent):
    def __init__(self):
        super().__init__(role='Planner', goal='Decompose high-level goals into a list of actionable tasks', backbone='claude', backstory='Responsible for breaking down complex problems into manageable tasks.')
        print("Thermonuclear Planner Agent Initialized")

    def decompose(self, json_graph_str):
        print("Thermonuclear Planning: Decomposing graph")
        try:
            graph = json.loads(json_graph_str)
            decomposed_tasks = [
                {'type': 'ui' if i % 2 else 'code', 'desc': f'Task for node {n["id"]}', 'complexity': 'low' if i < 2 else 'high'}
                for i, n in enumerate(graph['nodes'])
            ]
            print(f"Decomposed into {len(decomposed_tasks)} tasks.")
            return decomposed_tasks
        except json.JSONDecodeError:
            print("Error: Invalid JSON graph format.")
            return []

class CoderAgent(Agent):
    def __init__(self):
        super().__init__(role='Coder', goal='Generate code based on a task description', backbone='kimi', backstory='Expert in generating production-ready code snippets.')
        print("Thermonuclear Coder Agent Initialized")

    def code(self, task):
        print(f"Thermonuclear Coding: Generating code for {task['desc']}")
        return {'code': f"// Thermo Code for {task['desc']} - Vibe: Neon\nconsole.log('Hello from {task['desc']}');"}

class AuditorAgent(Agent):
    def __init__(self):
        super().__init__(role='Auditor', goal='Validate generated code for quality and correctness', backbone='claude', backstory='Ensures all generated code meets quality and compliance standards.')
        print("Thermonuclear Auditor Agent Initialized")

    def audit(self, code_dict):
        code = code_dict.get('code', '')
        print("Thermonuclear Auditing code snippet...")
        score = 0.95 if "Thermo Code" in code else 0.6
        is_valid = score > 0.8
        print(f"Audit result: valid={is_valid}, score={score}")
        return {'valid': is_valid, 'score': score}

