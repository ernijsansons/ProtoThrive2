#!/usr/bin/env python3
"""
Final Implementation Generator for ProtoThrive
Uses Claude Code to generate actual code files
"""

import subprocess
from pathlib import Path

def claude_code(prompt: str, model: str = "haiku") -> str:
    """Call Claude Code with focused prompts"""
    cmd = ["claude", "--print", "--model", model]

    try:
        result = subprocess.run(
            cmd + [prompt],
            capture_output=True,
            text=True,
            timeout=90
        )
        return result.stdout if result.returncode == 0 else None
    except:
        return None

def create_db_utils():
    """Generate database utilities"""
    code = claude_code("""
Generate ONLY TypeScript code for Cloudflare D1 database utilities:

```typescript
// backend/utils/db_quick.ts
interface Roadmap {
  id: string;
  user_id: string;
  json_graph: string;
  status: 'draft' | 'active' | 'completed';
  thrive_score: number;
  created_at: string;
}

interface Env {
  DB: any; // D1Database
}

const cache = new Map();

export async function queryRoadmap(id: string, userId: string, env: Env): Promise<Roadmap | null> {
  const cacheKey = `roadmap:${id}:${userId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const stmt = env.DB.prepare('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?');
  const result = await stmt.bind(id, userId).first();

  if (result) {
    cache.set(cacheKey, result);
    return result;
  }
  return null;
}

export async function insertRoadmap(userId: string, data: any, env: Env): Promise<string> {
  const id = crypto.randomUUID();
  const stmt = env.DB.prepare(`
    INSERT INTO roadmaps (id, user_id, json_graph, status, thrive_score, created_at)
    VALUES (?, ?, ?, 'draft', 0.0, datetime('now'))
  `);

  await stmt.bind(id, userId, data.json_graph).run();
  return id;
}

export async function updateRoadmapStatus(id: string, userId: string, status: string, env: Env): Promise<boolean> {
  const stmt = env.DB.prepare(`
    UPDATE roadmaps SET status = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `);

  const result = await stmt.bind(status, id, userId).run();
  return result.changes > 0;
}
```

Generate ONLY the TypeScript code above, no explanations.
""")

    if code:
        Path("backend/utils/db_final.ts").write_text(code)
        print("✓ Created backend/utils/db_final.ts")
        return True
    return False

def create_api_server():
    """Generate API server"""
    code = claude_code("""
Generate ONLY TypeScript code for Hono API server:

```typescript
// backend/src/api_final.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { queryRoadmap, insertRoadmap, updateRoadmapStatus } from '../utils/db_final';

type Env = {
  DB: any;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', cors());

// Auth middleware
app.use('/api/roadmaps/*', async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  // Mock auth - in production, validate JWT
  c.set('userId', 'user-123');
  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get roadmap
app.get('/api/roadmaps/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  const roadmap = await queryRoadmap(id, userId, c.env);
  if (!roadmap) {
    return c.json({ error: 'Roadmap not found' }, 404);
  }

  return c.json(roadmap);
});

// Create roadmap
app.post('/api/roadmaps', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json();

  if (!body.json_graph) {
    return c.json({ error: 'json_graph required' }, 400);
  }

  const id = await insertRoadmap(userId, body, c.env);
  return c.json({ id, success: true }, 201);
});

export default app;
```

Generate ONLY the TypeScript code above, no explanations.
""")

    if code:
        Path("backend/src/api_final.ts").write_text(code)
        print("✓ Created backend/src/api_final.ts")
        return True
    return False

def create_magic_canvas():
    """Generate MagicCanvas component"""
    code = claude_code("""
Generate ONLY React TypeScript code for MagicCanvas:

```tsx
// frontend/src/components/MagicCanvas_Final.tsx
import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useStore } from '../store';

interface MagicCanvasProps {
  className?: string;
}

const MagicCanvas: React.FC<MagicCanvasProps> = ({ className }) => {
  const { nodes: storeNodes, edges: storeEdges, mode, thriveScore } = useStore();

  // Convert store nodes to ReactFlow format
  const initialNodes: Node[] = useMemo(() =>
    storeNodes.map(node => ({
      id: node.id,
      type: 'default',
      position: { x: node.position.x, y: node.position.y },
      data: {
        label: (
          <div className={`p-2 rounded ${
            node.status === 'neon'
              ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300'
          }`}>
            {node.label}
          </div>
        )
      }
    })), [storeNodes]
  );

  const initialEdges: Edge[] = useMemo(() =>
    storeEdges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      animated: true,
      style: { stroke: '#00ffff' }
    })), [storeEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`w-full h-96 ${className}`}>
      <div className="mb-4 p-2 bg-gray-800 rounded">
        <div className="text-white">Mode: {mode} | Thrive Score: {thriveScore.toFixed(2)}</div>
        <div className="w-full bg-gray-700 rounded h-2 mt-1">
          <div
            className="bg-gradient-to-r from-blue-500 to-orange-500 h-2 rounded"
            style={{ width: `${thriveScore * 100}%` }}
          />
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export default MagicCanvas;
```

Generate ONLY the React TypeScript code above, no explanations.
""", "sonnet")

    if code:
        Path("frontend/src/components/MagicCanvas_Final.tsx").write_text(code)
        print("✓ Created frontend/src/components/MagicCanvas_Final.tsx")
        return True
    return False

def create_wrangler_config():
    """Generate wrangler config"""
    config = """name = "protothrive-backend"
main = "src/api_final.ts"
compatibility_date = "2024-01-01"
node_compat = true

[env.development]
name = "protothrive-backend-dev"

[env.production]
name = "protothrive-backend-prod"

[[d1_databases]]
binding = "DB"
database_name = "protothrive"
database_id = "YOUR_D1_ID_HERE"

[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_ID_HERE"

[vars]
ENVIRONMENT = "production"
JWT_SECRET = "your-secret-key"
"""

    Path("backend/wrangler_final.toml").write_text(config)
    print("✓ Created backend/wrangler_final.toml")
    return True

def main():
    print("=" * 60)
    print("FINAL PROTOTHRIVE IMPLEMENTATION")
    print("=" * 60)

    Path("backend/utils").mkdir(parents=True, exist_ok=True)
    Path("backend/src").mkdir(parents=True, exist_ok=True)
    Path("frontend/src/components").mkdir(parents=True, exist_ok=True)

    success_count = 0
    tasks = [
        ("Database Utilities", create_db_utils),
        ("API Server", create_api_server),
        ("MagicCanvas", create_magic_canvas),
        ("Wrangler Config", create_wrangler_config)
    ]

    for name, func in tasks:
        print(f"\nGenerating {name}...")
        if func():
            success_count += 1
        else:
            print(f"✗ Failed to generate {name}")

    print("\n" + "=" * 60)
    print(f"COMPLETED: {success_count}/{len(tasks)} components")

    if success_count == len(tasks):
        print("\n🎉 ProtoThrive is ready!")
        print("\nNext steps:")
        print("1. Review generated files")
        print("2. Update imports in existing files")
        print("3. Run: npm test")
        print("4. Deploy: wrangler deploy")

    print("=" * 60)

if __name__ == "__main__":
    main()