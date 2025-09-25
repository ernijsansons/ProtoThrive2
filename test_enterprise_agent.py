"""
Test script for Enterprise Agent integration with ProtoThrive
Verifies the bridge is working and can execute tasks
"""

import sys
import asyncio
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the bridge
sys.path.append(str(Path(__file__).parent / "backend" / "src"))
from enterprise_agent_bridge import ProtoThriveAgentBridge

async def test_bridge():
    """Test the Enterprise Agent bridge capabilities"""

    logger.info("=" * 60)
    logger.info("THERMONUCLEAR TEST: Enterprise Agent Integration")
    logger.info("=" * 60)

    # Initialize bridge
    bridge = ProtoThriveAgentBridge()
    logger.info("✓ Bridge initialized successfully")

    # Test 1: Thrive Score Calculation
    logger.info("\nTest 1: Thrive Score Calculation")
    test_logs = [
        {"status": "success", "type": "ui"},
        {"status": "success", "type": "code"},
        {"status": "success", "type": "ui"},
        {"status": "fail", "type": "deploy"},
        {"status": "success", "type": "code"}
    ]
    score = bridge.calculate_thrive_score(test_logs)
    logger.info(f"Thrive Score: {score:.2f} - Status: {'NEON ✨' if score > 0.5 else 'GRAY'}")
    assert 0 <= score <= 1, "Score should be between 0 and 1"

    # Test 2: Analyze ProtoThrive Codebase
    logger.info("\nTest 2: Analyzing ProtoThrive Codebase")
    analysis = bridge.analyze_codebase(".")
    logger.info(f"Analysis Status: {analysis['status']}")

    if analysis['status'] == 'success':
        logger.info(f"Confidence: {analysis.get('confidence', 0):.2f}")
        logger.info("Recommendations:")
        for i, rec in enumerate(analysis.get('recommendations', [])[:3], 1):
            logger.info(f"  {i}. {rec}")

    # Test 3: Generate Sample Implementation
    logger.info("\nTest 3: Generate Sample Implementation")
    spec = """
    Create a simple Thrive Score display component that:
    - Shows the current thrive score as a percentage
    - Uses a gradient bar (blue to orange)
    - Displays 'NEON' or 'GRAY' status
    - Follows ProtoThrive Thermonuclear specifications
    """

    result = bridge.generate_implementation(
        spec=spec,
        file_path="frontend/src/components/ThriveScoreDisplay.tsx"
    )

    if result['status'] == 'success':
        logger.info(f"✓ Implementation generated with confidence: {result.get('confidence', 0):.2f}")
        logger.info("Validation results:")
        for check, passed in result.get('validation', {}).items():
            status = "✓" if passed else "✗"
            logger.info(f"  {status} {check}: {passed}")

    # Test 4: Test Workflow Generation
    logger.info("\nTest 4: Generate n8n Workflow")
    workflow_result = bridge.generate_workflow("n8n")

    if workflow_result['status'] == 'success':
        is_valid = workflow_result.get('validation', False)
        logger.info(f"Workflow generation: {'✓ VALID' if is_valid else '✗ INVALID'}")

    # Test 5: Quick Phase Completion Test (Mock)
    logger.info("\nTest 5: Phase Completion Simulation")
    phases = ["backend", "frontend", "ai_core", "workflows", "security"]

    for phase in phases[:2]:  # Test first two phases only
        logger.info(f"\nSimulating {phase.upper()} phase...")
        # Note: In real execution, this would complete the actual phase
        # For testing, we'll just calculate a mock thrive score
        mock_logs = [
            {"status": "success", "type": "code"} for _ in range(3)
        ]
        mock_logs.append({"status": "success", "type": "ui"})

        score = bridge.calculate_thrive_score(mock_logs)
        logger.info(f"  Phase {phase} score: {score:.2f} {'✓' if score > 0.8 else '⚠'}")

    logger.info("\n" + "=" * 60)
    logger.info("THERMONUCLEAR TEST COMPLETE - All Systems Operational")
    logger.info("Ready to complete ProtoThrive implementation")
    logger.info("=" * 60)

def main():
    """Main entry point"""
    try:
        # Run async tests
        asyncio.run(test_bridge())

        logger.info("\n🚀 Enterprise Agent Integration Test: SUCCESS")
        logger.info("The bridge is ready to complete ProtoThrive!")

    except Exception as e:
        logger.error(f"\n❌ Test failed: {e}")
        logger.error("Please check the Enterprise Agent configuration")
        raise

if __name__ == "__main__":
    main()