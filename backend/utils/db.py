# Ref: CLAUDE.md Terminal 1 Phase 1 - Database Utilities (Python Port)
# Thermonuclear Database Functions for ProtoThrive

from typing import TypedDict, List, Optional, Any
import uuid

# Define TypedDicts for data models, mirroring TypeScript interfaces
class User(TypedDict):
    id: str
    email: str
    role: str # 'vibe_coder' | 'engineer' | 'exec' | 'super_admin'
    created_at: str
    deleted_at: Optional[str]

class Roadmap(TypedDict):
    id: str
    user_id: str
    json_graph: str
    status: str # 'draft' | 'active' | 'completed' | 'archived'
    vibe_mode: int # Stored as 0 or 1 in D1
    thrive_score: float
    created_at: str
    updated_at: str

class Snippet(TypedDict):
    id: str
    category: str
    code: str
    ui_preview_url: Optional[str]
    version: int
    created_at: str
    updated_at: str

class AgentLog(TypedDict):
    id: str
    roadmap_id: str
    task_type: str
    output: str
    status: str # 'success' | 'fail' | 'timeout' | 'escalated'
    model_used: str
    token_count: int
    timestamp: str

class Insight(TypedDict):
    id: str
    roadmap_id: str
    type: str # 'performance' | 'usage' | 'quality' | 'cost'
    data: str
    score: float
    created_at: str

# Helper to convert D1 row (vibe_mode as int) to Python boolean
def _convert_roadmap_vibe_mode(roadmap_data: dict) -> Roadmap:
    roadmap_data['vibe_mode'] = bool(roadmap_data.get('vibe_mode', 0))
    return roadmap_data

async def queryRoadmap(id: str, user_id: str, env: Any) -> Roadmap:
    try:
        stmt = env["DB"].prepare('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?').bind(id, user_id)
        result = await stmt.first()
        
        if not result:
            raise ValueError({'code': 'GRAPH-404', 'message': 'Roadmap not found'})
        
        return _convert_roadmap_vibe_mode(result)
    except Exception as e:
        if isinstance(e, ValueError) and e.args[0].get('code') == 'GRAPH-404':
            raise e
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Database error'})

async def queryUserRoadmaps(user_id: str, status: Optional[str], env: Any) -> List[Roadmap]:
    try:
        query = 'SELECT * FROM roadmaps WHERE user_id = ?'
        binds = [user_id]
        
        if status:
            query += ' AND status = ?'
            binds.append(status)
        
        query += ' ORDER BY updated_at DESC'
        
        stmt = env["DB"].prepare(query).bind(*binds)
        results = await stmt.all()
        
        return [_convert_roadmap_vibe_mode(row) for row in results]
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to query roadmaps'})

async def insertRoadmap(user_id: str, body: dict, env: Any) -> dict:
    try:
        roadmap_id = str(uuid.uuid4())
        
        stmt = env["DB"].prepare(
            'INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score, created_at, updated_at) VALUES (?, ?, ?, "draft", ?, 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
        ).bind(roadmap_id, user_id, body['json_graph'], 1 if body['vibe_mode'] else 0)
        
        await stmt.run()
        print(f"Thermonuclear Insert: Roadmap {roadmap_id} created")
        
        return {'id': roadmap_id}
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to insert roadmap'})

async def updateRoadmapStatus(id: str, user_id: str, status: str, env: Any) -> None:
    try:
        stmt = env["DB"].prepare(
            'UPDATE roadmaps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
        ).bind(status, id, user_id)
        
        result = await stmt.run()
        
        if result['meta']['changes'] == 0:
            raise ValueError({'code': 'GRAPH-404', 'message': 'Roadmap not found or unauthorized'})
    except Exception as e:
        if isinstance(e, ValueError) and e.args[0].get('code') == 'GRAPH-404':
            raise e
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to update status'})

async def updateRoadmapScore(id: str, score: float, env: Any) -> None:
    try:
        stmt = env["DB"].prepare(
            'UPDATE roadmaps SET thrive_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(score, id)
        
        await stmt.run()
        print(f"Thermonuclear Score Update: Roadmap {id} score {score}")
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to update thrive score'})

async def querySnippets(category: Optional[str], env: Any) -> List[Snippet]:
    try:
        query = 'SELECT * FROM snippets'
        binds: List[Any] = []
        
        if category:
            query += ' WHERE category = ?'
            binds.append(category)
        
        query += ' ORDER BY updated_at DESC'
        
        stmt = env["DB"].prepare(query).bind(*binds) if binds else env["DB"].prepare(query)
        results = await stmt.all()
        
        return results
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to query snippets'})

async def insertSnippet(snippet: dict, env: Any) -> dict:
    try:
        snippet_id = str(uuid.uuid4())
        
        stmt = env["DB"].prepare(
            'INSERT INTO snippets (id, category, code, ui_preview_url, version, created_at, updated_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'
        ).bind(snippet_id, snippet['category'], snippet['code'], snippet.get('ui_preview_url'))
        
        await stmt.run()
        print(f"Thermonuclear Insert: Snippet {snippet_id} created")
        
        return {'id': snippet_id}
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to insert snippet'})

async def insertAgentLog(log: dict, env: Any) -> dict:
    try:
        log_id = str(uuid.uuid4())
        
        stmt = env["DB"].prepare(
            'INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(log_id, log['roadmap_id'], log['task_type'], log['output'], log['status'], log['model_used'], log['token_count'])
        
        await stmt.run()
        print(f"Thermonuclear Insert: Agent log {log_id} for roadmap {log['roadmap_id']}")
        
        return {'id': log_id}
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to insert agent log'})

async def queryAgentLogs(roadmap_id: str, env: Any) -> List[AgentLog]:
    try:
        stmt = env["DB"].prepare(
            'SELECT * FROM agent_logs WHERE roadmap_id = ? ORDER BY timestamp DESC'
        ).bind(roadmap_id)
        
        results = await stmt.all()
        
        return results
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to query agent logs'})

async def insertInsight(insight: dict, env: Any) -> dict:
    try:
        insight_id = str(uuid.uuid4())
        
        stmt = env["DB"].prepare(
            'INSERT INTO insights (id, roadmap_id, type, data, score, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(insight_id, insight['roadmap_id'], insight['type'], insight['data'], insight['score'])
        
        await stmt.run()
        print(f"Thermonuclear Insert: Insight {insight_id} for roadmap {insight['roadmap_id']}")
        
        return {'id': insight_id}
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to insert insight'})

async def softDeleteUser(user_id: str, env: Any) -> None:
    try:
        stmt = env["DB"].prepare(
            'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(user_id)
        
        await stmt.run()
        print(f"Thermonuclear Soft Delete: User {user_id} marked for deletion")
    except Exception as e:
        raise ValueError({'code': 'DB-500', 'message': str(e) or 'Failed to soft delete user'})
