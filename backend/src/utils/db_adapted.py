"""
ProtoThrive Database Utilities - Adapted for Existing Schema
Production D1 Implementation adapted to work with existing TIMESTAMP columns

Ref: CLAUDE.md Phase 1 - Database Foundation (Adapted)
"""

import json
import uuid
import time
from typing import Dict, List, Optional, Any
from js import console

class DatabaseError(Exception):
    """Custom database exception"""
    pass

def validate_uuid(uuid_string: str) -> bool:
    """Validate UUID format with stricter security checks"""
    if not uuid_string or not isinstance(uuid_string, str):
        return False

    # SECURITY FIX: Length check to prevent DoS
    if len(uuid_string) > 50:
        return False

    try:
        # SECURITY FIX: Ensure proper UUID format and version
        parsed_uuid = uuid.UUID(uuid_string)
        # Only allow version 4 UUIDs for security
        if parsed_uuid.version != 4:
            console.error(f"Invalid UUID version: {parsed_uuid.version}")
            return False
        return True
    except (ValueError, TypeError) as e:
        console.error(f"UUID validation failed: {str(e)}")
        return False

def sanitize_query_param(param: Any) -> Any:
    """Sanitize query parameters to prevent injection attacks"""
    if isinstance(param, str):
        # SECURITY FIX: Prevent SQL injection patterns
        dangerous_patterns = [
            "'", '"', ';', '--', '/*', '*/', 'DROP', 'DELETE', 'UPDATE', 'INSERT',
            'SELECT', 'UNION', 'OR 1=1', 'OR TRUE', 'EXEC', 'EXECUTE', 'xp_', 'sp_'
        ]

        sanitized = param
        for pattern in dangerous_patterns:
            if pattern.upper() in param.upper():
                console.error(f"Blocked dangerous SQL pattern: {pattern}")
                raise DatabaseError(f"Invalid characters in parameter")

        # SECURITY FIX: Length limits to prevent DoS
        if len(sanitized) > 10000:
            raise DatabaseError("Parameter too long")

        return sanitized

    elif isinstance(param, (int, float)):
        # SECURITY FIX: Validate numeric ranges
        if abs(param) > 1e15:
            raise DatabaseError("Numeric parameter out of range")
        return param

    elif isinstance(param, bool):
        return param

    elif param is None:
        return param

    else:
        raise DatabaseError(f"Unsupported parameter type: {type(param)}")

async def execute_query(env: Dict[str, Any], query: str, params: List[Any] = None) -> Dict[str, Any]:
    """Execute a database query with enhanced security"""

    if not hasattr(env, 'DB'):
        console.error("Database binding not available")
        raise DatabaseError("Database not configured")

    # SECURITY FIX: Validate and sanitize all parameters
    sanitized_params = []
    if params:
        for param in params:
            sanitized_params.append(sanitize_query_param(param))

    # SECURITY FIX: Log query execution (without sensitive data)
    console.log(f"Executing query with {len(sanitized_params) if sanitized_params else 0} parameters")

    try:
        if sanitized_params:
            result = await env.DB.prepare(query).bind(*sanitized_params).all()
        else:
            result = await env.DB.prepare(query).all()

        return {
            'success': True,
            'results': result.get('results', []),
            'meta': result.get('meta', {}),
            'error': None
        }

    except Exception as e:
        console.error(f"Database query error: {str(e)}")
        # SECURITY FIX: Don't log query or params in production to prevent log injection
        if env.get('ENVIRONMENT') != 'production':
            console.error(f"Query: {query}")
            console.error(f"Params: {sanitized_params}")

        return {
            'success': False,
            'results': [],
            'meta': {},
            'error': str(e)
        }

async def execute_single_query(env: Dict[str, Any], query: str, params: List[Any] = None) -> Optional[Dict[str, Any]]:
    """Execute query and return first result or None"""

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(result['error'])

    results = result['results']
    return results[0] if results else None

# User Operations
async def queryUser(env: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
    """Query user by ID"""

    if not validate_uuid(user_id):
        raise DatabaseError("Invalid user ID format")

    query = "SELECT * FROM users WHERE id = ? AND deleted_at IS NULL"
    return await execute_single_query(env, query, [user_id])

async def insertUser(env: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert new user"""

    user_id = str(uuid.uuid4())

    query = """
        INSERT INTO users (id, email, role)
        VALUES (?, ?, ?)
    """

    params = [
        user_id,
        user_data.get('email'),
        user_data.get('role', 'vibe_coder')
    ]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(f"Failed to create user: {result['error']}")

    return {
        'id': user_id,
        'email': user_data.get('email'),
        'role': user_data.get('role', 'vibe_coder')
    }

async def softDeleteUser(env: Dict[str, Any], user_id: str) -> bool:
    """Soft delete user by setting deleted_at timestamp"""

    if not validate_uuid(user_id):
        raise DatabaseError("Invalid user ID format")

    query = "UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?"
    result = await execute_query(env, query, [user_id])

    return result['success']

# Roadmap Operations
async def queryRoadmap(env: Dict[str, Any], roadmap_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Query roadmap by ID with user access control"""

    if not validate_uuid(roadmap_id) or not validate_uuid(user_id):
        raise DatabaseError("Invalid roadmap or user ID format")

    query = """
        SELECT * FROM roadmaps
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    """

    result = await execute_single_query(env, query, [roadmap_id, user_id])

    if result and result.get('json_graph'):
        try:
            result['json_graph'] = json.loads(result['json_graph'])
        except json.JSONDecodeError:
            console.error(f"Invalid JSON in roadmap {roadmap_id}")
            result['json_graph'] = {"nodes": [], "edges": []}

    return result

async def queryUserRoadmaps(env: Dict[str, Any], user_id: str, limit: int = 10, offset: int = 0, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Query roadmaps for a user with pagination"""

    if not validate_uuid(user_id):
        raise DatabaseError("Invalid user ID format")

    # Build query with optional status filter
    if status:
        query = """
            SELECT * FROM roadmaps
            WHERE user_id = ? AND status = ? AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params = [user_id, status, limit, offset]
    else:
        query = """
            SELECT * FROM roadmaps
            WHERE user_id = ? AND deleted_at IS NULL
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params = [user_id, limit, offset]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(result['error'])

    roadmaps = result['results']

    # Parse JSON graphs
    for roadmap in roadmaps:
        if roadmap.get('json_graph'):
            try:
                roadmap['json_graph'] = json.loads(roadmap['json_graph'])
            except json.JSONDecodeError:
                roadmap['json_graph'] = {"nodes": [], "edges": []}

    return roadmaps

async def insertRoadmap(env: Dict[str, Any], roadmap_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert new roadmap"""

    roadmap_id = str(uuid.uuid4())

    # Ensure json_graph is a string
    json_graph = roadmap_data.get('json_graph', '{"nodes":[], "edges":[]}')
    if isinstance(json_graph, dict):
        json_graph = json.dumps(json_graph)

    query = """
        INSERT INTO roadmaps (id, user_id, json_graph, status, vibe_mode, thrive_score)
        VALUES (?, ?, ?, ?, ?, ?)
    """

    params = [
        roadmap_id,
        roadmap_data['user_id'],
        json_graph,
        roadmap_data.get('status', 'draft'),
        roadmap_data.get('vibe_mode', False),
        roadmap_data.get('thrive_score', 0.0)
    ]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(f"Failed to create roadmap: {result['error']}")

    return {
        'id': roadmap_id,
        'user_id': roadmap_data['user_id'],
        'json_graph': json.loads(json_graph),
        'status': roadmap_data.get('status', 'draft'),
        'vibe_mode': roadmap_data.get('vibe_mode', False),
        'thrive_score': roadmap_data.get('thrive_score', 0.0)
    }

async def updateRoadmap(env: Dict[str, Any], roadmap_id: str, user_id: str, update_data: Dict[str, Any]) -> bool:
    """Update roadmap with user access control"""

    if not validate_uuid(roadmap_id) or not validate_uuid(user_id):
        raise DatabaseError("Invalid roadmap or user ID format")

    # Build dynamic update query
    set_clauses = []
    params = []

    if 'json_graph' in update_data:
        set_clauses.append("json_graph = ?")
        json_graph = update_data['json_graph']
        if isinstance(json_graph, dict):
            json_graph = json.dumps(json_graph)
        params.append(json_graph)

    if 'status' in update_data:
        set_clauses.append("status = ?")
        params.append(update_data['status'])

    if 'vibe_mode' in update_data:
        set_clauses.append("vibe_mode = ?")
        params.append(update_data['vibe_mode'])

    if 'thrive_score' in update_data:
        set_clauses.append("thrive_score = ?")
        params.append(update_data['thrive_score'])

    if not set_clauses:
        return True  # Nothing to update

    # Add WHERE clause parameters
    params.extend([roadmap_id, user_id])

    query = f"""
        UPDATE roadmaps
        SET {', '.join(set_clauses)}
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    """

    result = await execute_query(env, query, params)
    return result['success']

async def updateRoadmapStatus(env: Dict[str, Any], roadmap_id: str, user_id: str, status: str) -> bool:
    """Update roadmap status"""
    return await updateRoadmap(env, roadmap_id, user_id, {'status': status})

async def updateRoadmapScore(env: Dict[str, Any], roadmap_id: str, user_id: str, score: float) -> bool:
    """Update roadmap thrive score"""
    return await updateRoadmap(env, roadmap_id, user_id, {'thrive_score': score})

async def softDeleteRoadmap(env: Dict[str, Any], roadmap_id: str, user_id: str) -> bool:
    """Soft delete roadmap"""

    if not validate_uuid(roadmap_id) or not validate_uuid(user_id):
        raise DatabaseError("Invalid roadmap or user ID format")

    query = """
        UPDATE roadmaps
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    """

    result = await execute_query(env, query, [roadmap_id, user_id])

    return result['success']

# Snippet Operations
async def querySnippets(env: Dict[str, Any], category: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Query code snippets with optional category filter"""

    if category:
        query = "SELECT * FROM snippets WHERE category = ? ORDER BY version DESC LIMIT ?"
        params = [category, limit]
    else:
        query = "SELECT * FROM snippets ORDER BY category, version DESC LIMIT ?"
        params = [limit]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(result['error'])

    return result['results']

async def insertSnippet(env: Dict[str, Any], snippet_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert new code snippet"""

    snippet_id = str(uuid.uuid4())

    query = """
        INSERT INTO snippets (id, category, code, ui_preview_url, version)
        VALUES (?, ?, ?, ?, ?)
    """

    params = [
        snippet_id,
        snippet_data.get('category', 'general'),
        snippet_data.get('code', ''),
        snippet_data.get('ui_preview_url', ''),
        snippet_data.get('version', 1)
    ]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(f"Failed to create snippet: {result['error']}")

    return {
        'id': snippet_id,
        'category': snippet_data.get('category', 'general'),
        'code': snippet_data.get('code', ''),
        'ui_preview_url': snippet_data.get('ui_preview_url', ''),
        'version': snippet_data.get('version', 1)
    }

# Agent Log Operations
async def insertAgentLog(env: Dict[str, Any], log_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert agent execution log"""

    log_id = str(uuid.uuid4())

    query = """
        INSERT INTO agent_logs (id, roadmap_id, task_type, output, status, model_used, token_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """

    params = [
        log_id,
        log_data.get('roadmap_id'),
        log_data.get('task_type', 'unknown'),
        log_data.get('output', ''),
        log_data.get('status', 'pending'),
        log_data.get('model_used', 'unknown'),
        log_data.get('token_count', 0)
    ]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(f"Failed to create agent log: {result['error']}")

    return {
        'id': log_id,
        'roadmap_id': log_data.get('roadmap_id'),
        'task_type': log_data.get('task_type', 'unknown'),
        'output': log_data.get('output', ''),
        'status': log_data.get('status', 'pending'),
        'model_used': log_data.get('model_used', 'unknown'),
        'token_count': log_data.get('token_count', 0)
    }

async def queryAgentLogs(env: Dict[str, Any], roadmap_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Query agent logs for a roadmap"""

    if not validate_uuid(roadmap_id):
        raise DatabaseError("Invalid roadmap ID format")

    query = """
        SELECT * FROM agent_logs
        WHERE roadmap_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
    """

    result = await execute_query(env, query, [roadmap_id, limit])

    if not result['success']:
        raise DatabaseError(result['error'])

    return result['results']

# Insights Operations
async def insertInsight(env: Dict[str, Any], insight_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert performance insight"""

    insight_id = str(uuid.uuid4())

    query = """
        INSERT INTO insights (id, roadmap_id, type, data, score)
        VALUES (?, ?, ?, ?, ?)
    """

    params = [
        insight_id,
        insight_data.get('roadmap_id'),
        insight_data.get('type', 'performance'),
        insight_data.get('data', ''),
        insight_data.get('score', 0.0)
    ]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(f"Failed to create insight: {result['error']}")

    return {
        'id': insight_id,
        'roadmap_id': insight_data.get('roadmap_id'),
        'type': insight_data.get('type', 'performance'),
        'data': insight_data.get('data', ''),
        'score': insight_data.get('score', 0.0)
    }

async def queryInsights(env: Dict[str, Any], roadmap_id: str, insight_type: Optional[str] = None) -> List[Dict[str, Any]]:
    """Query insights for a roadmap"""

    if not validate_uuid(roadmap_id):
        raise DatabaseError("Invalid roadmap ID format")

    if insight_type:
        query = """
            SELECT * FROM insights
            WHERE roadmap_id = ? AND type = ?
            ORDER BY created_at DESC
        """
        params = [roadmap_id, insight_type]
    else:
        query = """
            SELECT * FROM insights
            WHERE roadmap_id = ?
            ORDER BY created_at DESC
        """
        params = [roadmap_id]

    result = await execute_query(env, query, params)

    if not result['success']:
        raise DatabaseError(result['error'])

    return result['results']

# Health check function
async def checkDatabaseHealth(env: Dict[str, Any]) -> Dict[str, Any]:
    """Check database connectivity and basic operations"""

    try:
        # Simple connectivity test
        result = await execute_query(env, "SELECT 1 as test")

        if result['success']:
            return {
                'status': 'healthy',
                'connected': True,
                'timestamp': time.time()
            }
        else:
            return {
                'status': 'error',
                'connected': False,
                'error': result['error'],
                'timestamp': time.time()
            }

    except Exception as e:
        return {
            'status': 'error',
            'connected': False,
            'error': str(e),
            'timestamp': time.time()
        }