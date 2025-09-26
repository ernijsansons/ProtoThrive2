"""
Enterprise Agent Bridge for ProtoThrive - Claude Code Version
Uses Claude Code CLI directly with your Anthropic subscription
No API keys required - uses your $200/month plan
"""

import sys
import os
import json
import logging
import subprocess
import shlex
from pathlib import Path
from typing import Dict, Any, List, Optional
import asyncio

# Remove any API keys to force subscription usage
if "ANTHROPIC_API_KEY" in os.environ:
    del os.environ["ANTHROPIC_API_KEY"]

# Add Enterprise Agent to path
ENTERPRISE_AGENT_PATH = Path(r"C:\Users\ernij\OneDrive\Documents\Enterprise Agent")
sys.path.insert(0, str(ENTERPRISE_AGENT_PATH))

logger = logging.getLogger(__name__)

class ClaudeCodeBridge:
    """Bridge to use Claude Code CLI for ProtoThrive completion"""

    def __init__(self):
        """Initialize Claude Code bridge"""
        self.verify_claude_code()
        self.models = {
            "primary": "sonnet",  # Latest Sonnet
            "complex": "opus",    # Opus for complex tasks
            "simple": "haiku"     # Haiku for simple tasks
        }
        self.thrive_context = {
            "project": "ProtoThrive",
            "version": "2.0.0",
            "mode": "thermonuclear"
        }
        logger.info("Claude Code Bridge initialized - Using subscription")

    def verify_claude_code(self) -> bool:
        """Verify Claude Code CLI is available and authenticated"""
        try:
            # Check version
            result = subprocess.run(
                ["claude", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode != 0:
                raise RuntimeError("Claude Code CLI not working")

            logger.info(f"Claude Code available: {result.stdout.strip()}")

            # Test authentication with a simple command
            test_result = subprocess.run(
                ["claude", "--print", "--model", "haiku", "Say OK"],
                capture_output=True,
                text=True,
                timeout=10
            )

            if "please run `claude login`" in test_result.stderr.lower():
                logger.error("Not logged in to Claude Code. Please run: claude login")
                return False

            logger.info("Claude Code authentication verified - Subscription active")
            return True

        except Exception as e:
            logger.error(f"Claude Code verification failed: {e}")
            logger.error("Please ensure Claude Code CLI is installed and you're logged in")
            return False

    def call_claude_code(self, prompt: str, model: str = None) -> str:
        """Call Claude Code CLI directly"""
        if model is None:
            model = self.models["primary"]

        # Build command
        cmd = [
            "claude",
            "--print",
            "--model", model  # Use model directly (sonnet, opus, haiku)
        ]

        try:
            # Add the prompt as the last argument
            full_prompt = f"""You are helping complete the ProtoThrive platform.
Follow the Thermonuclear specifications from CLAUDE.md.
Generate production-ready code with proper error handling and testing.

{prompt}"""

            # Run the command
            result = subprocess.run(
                cmd + [full_prompt],
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                logger.error(f"Claude Code error: {result.stderr}")
                return f"// Error: {result.stderr}"

            return result.stdout

        except subprocess.TimeoutExpired:
            logger.error("Claude Code request timed out")
            return "// Error: Request timed out"
        except Exception as e:
            logger.error(f"Claude Code call failed: {e}")
            return f"// Error: {str(e)}"

    def generate_backend_api(self, spec: str) -> str:
        """Generate backend API implementation using Claude Code"""
        prompt = f"""Generate a complete backend API implementation for ProtoThrive:

Specification:
{spec}

Requirements:
1. Use Cloudflare Workers with Hono framework
2. Include D1 database queries
3. Add proper error handling with custom codes (ERR-[MODULE]-[CODE])
4. Implement multi-tenant support with user_id checks
5. Add Thermonuclear logging
6. Include Zod validation
7. Follow CLAUDE.md specifications exactly

Generate production-ready TypeScript code."""

        logger.info("Generating backend API with Claude Code...")
        return self.call_claude_code(prompt, model=self.models["primary"])

    def generate_frontend_component(self, component_name: str, spec: str) -> str:
        """Generate frontend component using Claude Code"""
        prompt = f"""Generate a complete React component for ProtoThrive:

Component: {component_name}
Specification:
{spec}

Requirements:
1. Use React 18 with TypeScript
2. Include Zustand for state management
3. Use Tailwind CSS for styling
4. Add proper error boundaries
5. Include loading states
6. Add accessibility features (ARIA)
7. Include comprehensive tests
8. Follow Thermonuclear validation protocol

Generate production-ready TSX code with tests."""

        logger.info(f"Generating {component_name} with Claude Code...")
        return self.call_claude_code(prompt, model=self.models["primary"])

    def fix_failing_tests(self, test_file: str, error_output: str) -> str:
        """Fix failing tests using Claude Code"""
        prompt = f"""Fix the failing tests in ProtoThrive:

Test File: {test_file}
Error Output:
{error_output}

Requirements:
1. Analyze the error and identify root cause
2. Generate corrected test code
3. Ensure proper mocking
4. Add missing dependencies
5. Follow Jest/React Testing Library best practices
6. Include proper async handling

Generate the complete fixed test file."""

        logger.info(f"Fixing tests in {test_file} with Claude Code...")
        return self.call_claude_code(prompt, model=self.models["primary"])

    def complete_magic_canvas(self) -> str:
        """Complete the MagicCanvas component using Claude Code"""
        prompt = """Complete the MagicCanvas component for ProtoThrive:

Requirements:
1. Full React Flow integration for 2D visualization
2. Spline 3D scene integration with lazy loading
3. Drag and drop functionality for nodes
4. Connection/edge creation between nodes
5. Real-time Thrive Score visualization
6. Smooth animations and transitions
7. Keyboard navigation support
8. Mobile responsive design

The component should:
- Convert Zustand store nodes/edges to React Flow format
- Support mode switching between 2D and 3D
- Show node status with neon effects
- Calculate and display Thrive Score
- Handle errors gracefully

Generate complete TypeScript/React code."""

        logger.info("Completing MagicCanvas with Claude Code...")
        return self.call_claude_code(prompt, model=self.models["complex"])

    def generate_ai_integration(self) -> str:
        """Generate AI integration code using Claude Code"""
        prompt = """Generate AI integration for ProtoThrive that connects to Enterprise Agent:

Requirements:
1. Router for model selection (Claude/Kimi/UXPilot logic)
2. RAG implementation with vector storage
3. Agent orchestration with CrewAI compatibility
4. Caching with TTL management
5. Cost tracking with $0.10 budget cap per task
6. Thrive Score calculation
7. Mock fallbacks for testing

The integration should:
- Use Claude Code for primary AI tasks
- Implement proper error handling
- Track usage and costs
- Calculate Thrive Score using the formula from CLAUDE.md
- Support both online and offline modes

Generate complete Python implementation."""

        logger.info("Generating AI integration with Claude Code...")
        return self.call_claude_code(prompt, model=self.models["complex"])

    def calculate_thrive_score(self, logs: List[Dict[str, Any]]) -> float:
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

        logger.info(f"Thrive Score: {score:.2f} - Status: {'NEON' if score > 0.5 else 'GRAY'}")
        return score

    async def complete_protothrive(self) -> Dict[str, Any]:
        """Complete ProtoThrive using Claude Code"""
        logger.info("Starting ProtoThrive completion with Claude Code")

        results = {
            "backend": False,
            "frontend": False,
            "ai_core": False,
            "tests": False,
            "deployment": False
        }

        try:
            # 1. Generate backend APIs
            logger.info("Phase 1: Generating backend APIs...")
            backend_spec = """
            - REST endpoints for roadmaps CRUD
            - GraphQL endpoint for complex queries
            - WebSocket for real-time updates
            - Authentication with JWT
            - Rate limiting and caching
            """
            backend_code = self.generate_backend_api(backend_spec)
            if backend_code and "Error" not in backend_code:
                results["backend"] = True
                # Save the generated code
                Path("backend/src/generated_api.ts").write_text(backend_code)

            # 2. Complete MagicCanvas
            logger.info("Phase 2: Completing MagicCanvas component...")
            canvas_code = self.complete_magic_canvas()
            if canvas_code and "Error" not in canvas_code:
                results["frontend"] = True
                Path("frontend/src/components/MagicCanvas_complete.tsx").write_text(canvas_code)

            # 3. Generate AI integration
            logger.info("Phase 3: Generating AI integration...")
            ai_code = self.generate_ai_integration()
            if ai_code and "Error" not in ai_code:
                results["ai_core"] = True
                Path("ai-core/src/claude_code_integration.py").write_text(ai_code)

            # Calculate final score
            logs = [
                {"status": "success" if results["backend"] else "fail", "type": "backend"},
                {"status": "success" if results["frontend"] else "fail", "type": "ui"},
                {"status": "success" if results["ai_core"] else "fail", "type": "ai"}
            ]

            final_score = self.calculate_thrive_score(logs)

            return {
                "success": final_score > 0.5,
                "score": final_score,
                "results": results,
                "status": "NEON" if final_score > 0.5 else "GRAY"
            }

        except Exception as e:
            logger.error(f"Completion failed: {e}")
            return {
                "success": False,
                "score": 0.0,
                "results": results,
                "error": str(e)
            }

# Test function
def test_claude_code():
    """Test Claude Code integration"""
    bridge = ClaudeCodeBridge()

    # Test simple call
    print("Testing Claude Code...")
    response = bridge.call_claude_code(
        "Generate a simple TypeScript function that calculates fibonacci",
        model=bridge.models["simple"]
    )

    if response and not response.startswith("// Error"):
        print("Claude Code is working!")
        print(f"Response preview: {response[:200]}...")
        return True
    else:
        print("Claude Code test failed")
        print(f"Error: {response}")
        return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    # Run test
    if test_claude_code():
        print("\nClaude Code Bridge is ready for ProtoThrive completion!")
        print("Your subscription is active and working.")
    else:
        print("\nPlease ensure you're logged in: claude login")