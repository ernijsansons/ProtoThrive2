#!/usr/bin/env python3
"""
Quick finish for ProtoThrive - Generate key missing components
"""

import subprocess
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_component(name: str, prompt: str, output_file: str, model: str = "haiku"):
    """Generate a single component quickly"""
    logger.info(f"Generating {name}...")

    cmd = ["claude", "--print", "--model", model]

    try:
        result = subprocess.run(
            cmd + [prompt],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )

        if result.returncode == 0 and result.stdout:
            Path(output_file).parent.mkdir(parents=True, exist_ok=True)
            Path(output_file).write_text(result.stdout)
            logger.info(f"Created: {output_file}")
            return True
        else:
            logger.error(f"Failed to generate {name}")
            return False

    except Exception as e:
        logger.error(f"Error generating {name}: {e}")
        return False

def main():
    print("=" * 70)
    print("QUICK PROTOTHRIVE COMPLETION")
    print("=" * 70)

    # 1. Fix critical database utilities
    success = generate_component(
        "Database Utilities",
        """Create TypeScript database utilities for Cloudflare D1. Include:
- queryRoadmap(id, userId): Get roadmap with multi-tenant check
- insertRoadmap(userId, data): Create new roadmap
- updateRoadmapStatus(id, userId, status): Update status
- Cache functions: getCachedQuery, setCachedQuery

Use these types:
interface Roadmap {
  id: string;
  user_id: string;
  json_graph: string;
  status: string;
  thrive_score: number;
}

Keep it simple but complete with error handling.""",
        "backend/utils/db_quick.ts",
        "haiku"
    )

    if not success:
        print("Failed to generate database utilities")
        return False

    # 2. Create a simple working API endpoint
    success = generate_component(
        "API Endpoint",
        """Create a simple Hono API endpoint for roadmaps:

import { Hono } from 'hono';

const app = new Hono();

// GET /roadmaps/:id - with auth check
// POST /roadmaps - create new
// Include JWT middleware, error handling, and JSON responses.

Keep it concise but working.""",
        "backend/src/api_quick.ts",
        "haiku"
    )

    if not success:
        print("Failed to generate API")
        return False

    # 3. Fix MagicCanvas quickly
    success = generate_component(
        "MagicCanvas Fix",
        """Create a simple but working MagicCanvas React component:

import ReactFlow from 'reactflow';
import { useStore } from '../store';

Component should:
- Convert store nodes/edges to ReactFlow format
- Handle node dragging
- Show node status (neon/gray)
- Include basic error handling

Keep it simple but functional.""",
        "frontend/src/components/MagicCanvas_Quick.tsx",
        "haiku"
    )

    if not success:
        print("Failed to generate MagicCanvas")
        return False

    # 4. Create deployment config
    success = generate_component(
        "Deployment Config",
        """Create a wrangler.toml for Cloudflare Workers deployment:

name = "protothrive-backend"
main = "src/api_quick.ts"
compatibility_date = "2024-01-01"

Add D1 database and KV namespace bindings.
Include production environment config.""",
        "backend/wrangler_quick.toml",
        "haiku"
    )

    if not success:
        print("Failed to generate deployment config")
        return False

    print("\n" + "=" * 70)
    print("QUICK COMPLETION FINISHED")
    print("=" * 70)
    print("\nGenerated files:")
    print("  - backend/utils/db_quick.ts")
    print("  - backend/src/api_quick.ts")
    print("  - frontend/src/components/MagicCanvas_Quick.tsx")
    print("  - backend/wrangler_quick.toml")
    print("\nProtoThrive core components are ready!")
    print("Run tests and deploy when ready.")

    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)