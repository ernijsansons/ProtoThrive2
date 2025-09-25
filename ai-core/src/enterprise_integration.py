"""
AI Core Integration with Enterprise Agent
Connects ProtoThrive's AI capabilities with Enterprise Agent orchestration
"""

import sys
from pathlib import Path

# Add Enterprise Agent to path
ENTERPRISE_AGENT_PATH = Path(r"C:\Users\ernij\OneDrive\Documents\Enterprise Agent")
if str(ENTERPRISE_AGENT_PATH) not in sys.path:
    sys.path.insert(0, str(ENTERPRISE_AGENT_PATH))

try:
    from src.agent_orchestrator import AgentOrchestrator
    ENTERPRISE_AGENT_AVAILABLE = True
except ImportError:
    ENTERPRISE_AGENT_AVAILABLE = False
    print("Warning: Enterprise Agent not available, using mock mode")

class AIIntegration:
    """Integration layer between ProtoThrive and Enterprise Agent"""

    def __init__(self):
        self.orchestrator = None
        if ENTERPRISE_AGENT_AVAILABLE:
            try:
                self.orchestrator = AgentOrchestrator()
                print("Thermonuclear: Enterprise Agent connected successfully")
            except Exception as e:
                print(f"Warning: Could not initialize Enterprise Agent: {e}")

    def generate_roadmap(self, vision: str) -> dict:
        """Generate roadmap using Enterprise Agent or fallback"""
        if self.orchestrator:
            try:
                result = self.orchestrator.run_mode(
                    domain="protothrive",
                    task=f"Generate roadmap for: {vision}",
                    vuln_flag=False
                )
                return {
                    "success": True,
                    "roadmap": result.get("code", ""),
                    "confidence": result.get("confidence", 0.0)
                }
            except Exception as e:
                print(f"Enterprise Agent error: {e}")

        # Fallback to mock
        return {
            "success": True,
            "roadmap": self._generate_mock_roadmap(vision),
            "confidence": 0.75
        }

    def _generate_mock_roadmap(self, vision: str) -> str:
        """Generate mock roadmap for testing"""
        import json
        return json.dumps({
            "nodes": [
                {"id": "n1", "label": "Start: " + vision[:20], "status": "gray", "position": {"x": 0, "y": 0, "z": 0}},
                {"id": "n2", "label": "Process", "status": "gray", "position": {"x": 150, "y": 100, "z": 0}},
                {"id": "n3", "label": "Complete", "status": "neon", "position": {"x": 300, "y": 0, "z": 0}}
            ],
            "edges": [
                {"from": "n1", "to": "n2"},
                {"from": "n2", "to": "n3"}
            ]
        })

    def calculate_thrive_score(self, logs):
        """Calculate Thrive Score using the formula from CLAUDE.md"""
        if not logs:
            return 0.0

        total = len(logs)
        success_count = sum(1 for log in logs if log.get("status") == "success")
        ui_count = sum(1 for log in logs if log.get("type") == "ui")
        fail_count = sum(1 for log in logs if log.get("status") == "fail")

        completion = (success_count / total) * 0.6 if total > 0 else 0
        ui_polish = (ui_count / total) * 0.3 if total > 0 else 0
        risk = (1 - (fail_count / total)) * 0.1 if total > 0 else 0.1

        score = completion + ui_polish + risk
        print(f"Thermonuclear Thrive Score: {score:.2f} - Status: {'neon' if score > 0.5 else 'gray'}")
        return score

# Global integration instance
ai_integration = AIIntegration()
