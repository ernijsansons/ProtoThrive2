"""
Simplified Database Utilities for ProtoThrive Backend
Compatible with consolidated main.py architecture
"""

from typing import TypedDict, List, Optional, Any, Dict
import uuid
import json

# Type definitions
class Roadmap(TypedDict):
    id: str
    user_id: str
    json_graph: str
    status: str
    vibe_mode: bool
    thrive_score: float
    created_at: str
    updated_at: str

def validate_uuid(uuid_string: str) -> bool:
    """Validate UUID format to prevent injection"""
    try:
        uuid.UUID(uuid_string)
        return True
    except (ValueError, AttributeError, TypeError):
        return False

async def queryRoadmap(env: Any, roadmap_id: str, user_id: str) -> Optional[Roadmap]:
    """Query a roadmap by ID and user_id for security"""

    if not validate_uuid(roadmap_id) or not validate_uuid(user_id):
        return None

    try:
        # Use D1 database if available
        if hasattr(env, 'DB'):
            stmt = env.DB.prepare('SELECT * FROM roadmaps WHERE id = ? AND user_id = ?')
            result = await stmt.bind(roadmap_id, user_id).first()

            if result:
                return {
                    'id': result['id'],
                    'user_id': result['user_id'],
                    'json_graph': result['json_graph'],
                    'status': result['status'],
                    'vibe_mode': bool(result['vibe_mode']),
                    'thrive_score': float(result['thrive_score']),
                    'created_at': result['created_at'],
                    'updated_at': result['updated_at']
                }
        else:
            # Mock for development
            print(f"Mock DB: queryRoadmap {roadmap_id} for user {user_id}")
            return {
                'id': roadmap_id,
                'user_id': user_id,
                'json_graph': '{"nodes":[{"id":"n1","label":"Start","status":"gray"}],"edges":[]}',
                'status': 'draft',
                'vibe_mode': False,
                'thrive_score': 0.45,
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
    except Exception as e:
        print(f"Database error in queryRoadmap: {e}")
        return None

    return None

async def queryUserRoadmaps(env: Any, user_id: str, limit: int = 10, offset: int = 0, status: Optional[str] = None) -> List[Roadmap]:
    """Query roadmaps for a user with pagination"""

    if not validate_uuid(user_id):
        return []

    try:
        if hasattr(env, 'DB'):
            if status:
                query = 'SELECT * FROM roadmaps WHERE user_id = ? AND status = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
                stmt = env.DB.prepare(query)
                results = await stmt.bind(user_id, status, limit, offset).all()
            else:
                query = 'SELECT * FROM roadmaps WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
                stmt = env.DB.prepare(query)
                results = await stmt.bind(user_id, limit, offset).all()

            roadmaps = []
            for result in results:
                roadmaps.append({
                    'id': result['id'],
                    'user_id': result['user_id'],
                    'json_graph': result['json_graph'],
                    'status': result['status'],
                    'vibe_mode': bool(result['vibe_mode']),
                    'thrive_score': float(result['thrive_score']),
                    'created_at': result['created_at'],
                    'updated_at': result['updated_at']
                })
            return roadmaps
        else:
            # Mock for development
            print(f"Mock DB: queryUserRoadmaps for user {user_id}")
            return [
                {
                    'id': 'mock-roadmap-1',
                    'user_id': user_id,
                    'json_graph': '{"nodes":[{"id":"n1","label":"Mock Roadmap 1"}],"edges":[]}',
                    'status': status or 'draft',
                    'vibe_mode': False,
                    'thrive_score': 0.45,
                    'created_at': '2024-01-01T00:00:00Z',
                    'updated_at': '2024-01-01T00:00:00Z'
                }
            ]
    except Exception as e:
        print(f"Database error in queryUserRoadmaps: {e}")
        return []

async def insertRoadmap(env: Any, roadmap_data: Dict[str, Any]) -> Dict[str, str]:
    """Insert a new roadmap"""

    new_id = str(uuid.uuid4())

    try:
        if hasattr(env, 'DB'):
            query = '''INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score)
                      VALUES (?, ?, ?, ?, ?, ?)'''
            stmt = env.DB.prepare(query)
            await stmt.bind(
                new_id,
                roadmap_data['user_id'],
                roadmap_data['json_graph'],
                roadmap_data.get('status', 'draft'),
                int(roadmap_data.get('vibe_mode', False)),
                roadmap_data.get('thrive_score', 0.0)
            ).run()
        else:
            # Mock for development
            print(f"Mock DB: insertRoadmap {new_id}")

        return {'id': new_id}
    except Exception as e:
        print(f"Database error in insertRoadmap: {e}")
        raise Exception(f"Failed to create roadmap: {e}")

async def updateRoadmapStatus(env: Any, roadmap_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
    """Update roadmap fields"""

    if not validate_uuid(roadmap_id) or not validate_uuid(user_id):
        return False

    try:
        if hasattr(env, 'DB'):
            # Build dynamic update query
            set_clauses = []
            params = []

            for field, value in updates.items():
                if field in ['json_graph', 'status', 'thrive_score']:
                    set_clauses.append(f"{field} = ?")
                    params.append(value)
                elif field == 'vibe_mode':
                    set_clauses.append("vibe_mode = ?")
                    params.append(int(value))

            if not set_clauses:
                return False

            # Add updated_at
            set_clauses.append("updated_at = CURRENT_TIMESTAMP")

            query = f"UPDATE roadmaps SET {', '.join(set_clauses)} WHERE id = ? AND user_id = ?"
            params.extend([roadmap_id, user_id])

            stmt = env.DB.prepare(query)
            await stmt.bind(*params).run()
        else:
            # Mock for development
            print(f"Mock DB: updateRoadmapStatus {roadmap_id}")

        return True
    except Exception as e:
        print(f"Database error in updateRoadmapStatus: {e}")
        return False

# Simplified mock functions for other operations
async def querySnippets(env: Any, category: Optional[str] = None) -> List[Dict]:
    print(f"Mock DB: querySnippets category={category}")
    return []

async def insertSnippet(env: Any, snippet_data: Dict) -> Dict[str, str]:
    print(f"Mock DB: insertSnippet {snippet_data}")
    return {'id': str(uuid.uuid4())}

async def insertAgentLog(env: Any, log_data: Dict) -> Dict[str, str]:
    print(f"Mock DB: insertAgentLog {log_data}")
    return {'id': str(uuid.uuid4())}

async def queryAgentLogs(env: Any, roadmap_id: str) -> List[Dict]:
    print(f"Mock DB: queryAgentLogs {roadmap_id}")
    return []

async def insertInsight(env: Any, insight_data: Dict) -> Dict[str, str]:
    print(f"Mock DB: insertInsight {insight_data}")
    return {'id': str(uuid.uuid4())}

async def updateRoadmapScore(env: Any, roadmap_id: str, score: float) -> bool:
    print(f"Mock DB: updateRoadmapScore {roadmap_id} = {score}")
    return True

async def softDeleteUser(env: Any, user_id: str) -> bool:
    print(f"Mock DB: softDeleteUser {user_id}")
    return True

async def queryUser(env: Any, user_id: str) -> Optional[Dict]:
    print(f"Mock DB: queryUser {user_id}")
    return {'id': user_id, 'email': 'test@example.com', 'role': 'vibe_coder'}