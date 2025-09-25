#!/usr/bin/env python3
"""
Complete ProtoThrive using Claude Code (Subscription)
This uses your $200/month Anthropic plan - no API keys needed!
"""

import sys
import asyncio
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import the Claude Code bridge
sys.path.append(str(Path(__file__).parent / "backend" / "src"))
from enterprise_agent_bridge_claude_code import ClaudeCodeBridge

def print_banner(text: str):
    """Print a formatted banner"""
    line = "=" * 70
    print(line)
    print(text.center(70))
    print(line)

async def main():
    """Main execution function"""
    print_banner("PROTOTHRIVE COMPLETION WITH CLAUDE CODE")
    print("Using your Anthropic subscription - No API keys needed!")
    print("=" * 70)

    # Initialize Claude Code bridge
    bridge = ClaudeCodeBridge()

    # Run completion
    logger.info("Starting ProtoThrive completion with Claude Code...")
    result = await bridge.complete_protothrive()

    # Print results
    print_banner("COMPLETION RESULTS")

    if result["success"]:
        print(f"SUCCESS! Thrive Score: {result['score']:.2f}")
        print(f"Status: {result['status']}")
        print("\nCompleted Components:")
        for component, status in result["results"].items():
            emoji = "✅" if status else "❌"
            print(f"  {emoji} {component.upper()}: {'Complete' if status else 'Failed'}")
    else:
        print(f"PARTIAL COMPLETION - Score: {result['score']:.2f}")
        if "error" in result:
            print(f"Error: {result['error']}")

    print("\n" + "=" * 70)
    print("ProtoThrive completion process finished.")
    print("Your subscription has been used to generate the code.")
    print("=" * 70)

    return result["success"]

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)