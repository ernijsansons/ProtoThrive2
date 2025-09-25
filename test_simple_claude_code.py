#!/usr/bin/env python3
"""
Simple test of Claude Code for ProtoThrive
Tests basic functionality with shorter prompts
"""

import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def call_claude_simple(prompt: str, model: str = "haiku") -> str:
    """Simple Claude Code call with longer timeout"""
    cmd = ["claude", "--print", "--model", model]

    try:
        result = subprocess.run(
            cmd + [prompt],
            capture_output=True,
            text=True,
            timeout=180  # 3 minutes timeout
        )

        if result.returncode == 0:
            return result.stdout
        else:
            return f"Error: {result.stderr}"

    except subprocess.TimeoutExpired:
        return "Error: Timeout after 3 minutes"
    except Exception as e:
        return f"Error: {str(e)}"

def test_thrive_score():
    """Test Thrive Score calculation"""
    prompt = """Generate a Python function that calculates the Thrive Score for ProtoThrive.

The formula is:
- completion = (success_count / total) * 0.6
- ui_polish = (ui_count / total) * 0.3
- risk = (1 - (fail_count / total)) * 0.1
- score = completion + ui_polish + risk

Include proper error handling and return both the score and status (NEON if > 0.5, else GRAY)."""

    logger.info("Testing Thrive Score generation with Claude Code...")
    response = call_claude_simple(prompt, "haiku")

    if not response.startswith("Error"):
        logger.info("SUCCESS: Generated Thrive Score function")
        print(response[:500] + "...")
        return True
    else:
        logger.error(f"Failed: {response}")
        return False

def test_simple_api():
    """Test simple API endpoint generation"""
    prompt = """Generate a simple Hono API endpoint for getting a roadmap by ID.
Include:
- GET /roadmap/:id route
- User authentication check
- Database query mock
- Error handling
- JSON response

Keep it concise but complete."""

    logger.info("Testing API endpoint generation with Claude Code...")
    response = call_claude_simple(prompt, "sonnet")

    if not response.startswith("Error"):
        logger.info("SUCCESS: Generated API endpoint")
        print(response[:500] + "...")
        return True
    else:
        logger.error(f"Failed: {response}")
        return False

def main():
    print("=" * 70)
    print("CLAUDE CODE SIMPLE TESTS")
    print("Using your subscription - No API keys")
    print("=" * 70)

    tests_passed = 0
    tests_total = 2

    # Test 1: Thrive Score
    print("\nTest 1: Thrive Score Function")
    if test_thrive_score():
        tests_passed += 1

    # Test 2: Simple API
    print("\nTest 2: API Endpoint")
    if test_simple_api():
        tests_passed += 1

    print("\n" + "=" * 70)
    print(f"Results: {tests_passed}/{tests_total} tests passed")

    if tests_passed == tests_total:
        print("Claude Code is working perfectly with your subscription!")
        print("Ready to complete ProtoThrive!")
    else:
        print("Some tests failed - check the errors above")

    print("=" * 70)

if __name__ == "__main__":
    main()