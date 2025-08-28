#!/usr/bin/env python3
"""
ProtoThrive Enhanced Mocks
Thermonuclear Master Control Document Implementation
Ref: CLAUDE.md Section 1 - Global Mocks & Configs

Provides mock implementations for all external dependencies:
- API calls (Claude, Kimi, uxpilot, Cloudflare, Vercel, etc.)
- Database queries (D1, KV, Pinecone)
- Authentication (Clerk, JWT)
- Monitoring (Datadog, logging)
- Cost tracking
- Compliance checks
"""

import time
import json
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

# Global mock store
MOCK_STORE = {
    "kv": {},
    "d1": {},
    "pinecone": {},
    "api_calls": [],
    "cost_tracker": {"total": 0.0, "session": time.time()},
    "kill_switch": False
}

# Mock API responses
MOCK_API_RESPONSES = {
    "claude": {
        "success": True,
        "data": "Thermonuclear Claude Response",
        "id": "claude-thermo-mock",
        "tokens_used": 150,
        "cost": 0.015
    },
    "kimi": {
        "success": True,
        "data": "Thermonuclear Kimi Response",
        "id": "kimi-thermo-mock",
        "tokens_used": 100,
        "cost": 0.001
    },
    "uxpilot": {
        "success": True,
        "data": {
            "ui_code": "console.log('Thermo UI Generated');",
            "preview_url": "https://mock-uxpilot.com/preview/thermo-neon",
            "components": ["Button", "Card", "Modal"]
        },
        "id": "uxpilot-thermo-mock",
        "cost": 0.02
    },
    "cloudflare": {
        "success": True,
        "data": {
            "deployment_id": "cf-thermo-deploy",
            "url": "https://proto-thermo.pages.dev",
            "status": "deployed"
        },
        "id": "cf-thermo-mock"
    },
    "vercel": {
        "success": True,
        "data": {
            "deployment_id": "vercel-thermo-deploy",
            "url": "https://proto-thermo.vercel.app",
            "status": "deployed"
        },
        "id": "vercel-thermo-mock"
    },
    "stripe": {
        "success": True,
        "data": {
            "payment_intent": "pi_thermo_mock",
            "status": "succeeded",
            "amount": 1000
        },
        "id": "stripe-thermo-mock"
    },
    "slack": {
        "success": True,
        "data": {
            "message_id": "slack-thermo-msg",
            "channel": "#hitl-thermo",
            "status": "sent"
        },
        "id": "slack-thermo-mock"
    },
    "uptime": {
        "success": True,
        "data": {
            "status": "healthy",
            "response_time": 150,
            "uptime_percentage": 99.9
        },
        "id": "uptime-thermo-mock"
    }
}

def mock_api_call(endpoint: str, payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Mock API call function (Ref: CLAUDE.md Section 1)
    
    Args:
        endpoint: API endpoint (e.g., 'claude/chat', 'kimi/generate', 'cloudflare/deploy')
        payload: Request payload
    
    Returns:
        Mock API response
    """
    print(f"🔥 THERMONUCLEAR MOCK CALL: {endpoint} - Payload: {payload}")
    
    # Track API call
    MOCK_STORE["api_calls"].append({
        "endpoint": endpoint,
        "payload": payload,
        "timestamp": time.time(),
        "id": str(uuid.uuid4())
    })
    
    # Determine response based on endpoint
    if "claude" in endpoint.lower():
        response = MOCK_API_RESPONSES["claude"].copy()
    elif "kimi" in endpoint.lower():
        response = MOCK_API_RESPONSES["kimi"].copy()
    elif "uxpilot" in endpoint.lower():
        response = MOCK_API_RESPONSES["uxpilot"].copy()
    elif "cloudflare" in endpoint.lower():
        response = MOCK_API_RESPONSES["cloudflare"].copy()
    elif "vercel" in endpoint.lower():
        response = MOCK_API_RESPONSES["vercel"].copy()
    elif "stripe" in endpoint.lower():
        response = MOCK_API_RESPONSES["stripe"].copy()
    elif "slack" in endpoint.lower():
        response = MOCK_API_RESPONSES["slack"].copy()
    elif "uptime" in endpoint.lower():
        response = MOCK_API_RESPONSES["uptime"].copy()
    else:
        # Generic response
        response = {
            "success": True,
            "data": f"Thermonuclear Mock Response for {endpoint}",
            "id": f"mock-{endpoint.replace('/', '-')}",
            "timestamp": time.time()
        }
    
    # Add cost tracking
    if "cost" in response:
        MOCK_STORE["cost_tracker"]["total"] += response["cost"]
        print(f"💰 Thermonuclear Cost: ${MOCK_STORE['cost_tracker']['total']:.3f}")
    
    return response

def mock_db_query(query: str, binds: List[Any] = None) -> List[Dict[str, Any]]:
    """
    Mock database query function (Ref: CLAUDE.md Section 1)
    
    Args:
        query: SQL query string
        binds: Query parameters
    
    Returns:
        Mock query results
    """
    print(f"🔥 THERMONUCLEAR MOCK DB: {query} - Binds: {binds}")
    
    # Parse query to determine response
    query_lower = query.lower()
    
    if "select" in query_lower and "roadmaps" in query_lower:
        # Roadmap query
        return [{
            "id": "uuid-thermo-1",
            "user_id": "uuid-thermo-user",
            "json_graph": '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
            "status": "active",
            "vibe_mode": True,
            "thrive_score": 0.45,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }]
    
    elif "select" in query_lower and "users" in query_lower:
        # User query
        return [{
            "id": "uuid-thermo-1",
            "email": "test@proto.com",
            "role": "vibe_coder",
            "created_at": datetime.now().isoformat()
        }]
    
    elif "select" in query_lower and "snippets" in query_lower:
        # Snippet query
        return [{
            "id": "sn-thermo-1",
            "category": "ui",
            "code": 'console.log("Thermo UI Dummy");',
            "ui_preview_url": "mock_neon.png",
            "version": 1
        }]
    
    elif "select" in query_lower and "agent_logs" in query_lower:
        # Agent logs query
        return [{
            "id": "log-thermo-1",
            "roadmap_id": "rm-thermo-1",
            "task_type": "ui",
            "output": "// Thermo Code Generated",
            "status": "success",
            "model_used": "kimi",
            "token_count": 50,
            "timestamp": datetime.now().isoformat()
        }]
    
    elif "select" in query_lower and "kv" in query_lower:
        # KV query
        key = binds[0] if binds else "default_key"
        return [{"key": key, "value": MOCK_STORE["kv"].get(key, "false")}]
    
    elif "insert" in query_lower:
        # Insert query
        return [{"id": f"uuid-{uuid.uuid4()}", "affected_rows": 1}]
    
    elif "update" in query_lower:
        # Update query
        return [{"affected_rows": 1}]
    
    elif "delete" in query_lower:
        # Delete query
        return [{"affected_rows": 1}]
    
    else:
        # Generic query response
        return [{
            "id": "uuid-thermo-mock",
            "json_graph": '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray"}],"edges":[{"from":"n1","to":"n2"}]}',
            "thrive_score": 0.45
        }]

def mock_pinecone_upsert(id: str, vector: List[float], metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock Pinecone upsert function
    
    Args:
        id: Vector ID
        vector: Embedding vector
        metadata: Vector metadata
    
    Returns:
        Mock upsert response
    """
    print(f"🔥 THERMONUCLEAR MOCK PINECONE UPSERT: {id}")
    
    MOCK_STORE["pinecone"][id] = {
        "vector": vector,
        "metadata": metadata,
        "timestamp": time.time()
    }
    
    return {
        "success": True,
        "id": id,
        "upserted_count": 1
    }

def mock_pinecone_query(query_vector: List[float], top_k: int = 3, threshold: float = 0.8) -> List[Dict[str, Any]]:
    """
    Mock Pinecone query function
    
    Args:
        query_vector: Query embedding vector
        top_k: Number of results to return
        threshold: Similarity threshold
    
    Returns:
        Mock query results
    """
    print(f"🔥 THERMONUCLEAR MOCK PINECONE QUERY: top_k={top_k}, threshold={threshold}")
    
    # Generate mock results
    results = []
    for i in range(min(top_k, 3)):
        results.append({
            "id": f"sn-thermo-{i+1}",
            "score": 0.9 - (i * 0.1),
            "metadata": {
                "category": "ui" if i % 2 == 0 else "code",
                "snippet": f'console.log("Thermo Snippet {i+1}");'
            }
        })
    
    return results

def mock_kv_get(key: str) -> Optional[Any]:
    """
    Mock KV get function
    
    Args:
        key: KV key
    
    Returns:
        KV value or None
    """
    print(f"🔥 THERMONUCLEAR MOCK KV GET: {key}")
    return MOCK_STORE["kv"].get(key)

def mock_kv_put(key: str, value: Any, ttl: int = 3600) -> bool:
    """
    Mock KV put function
    
    Args:
        key: KV key
        value: KV value
        ttl: Time to live in seconds
    
    Returns:
        Success status
    """
    print(f"🔥 THERMONUCLEAR MOCK KV PUT: {key} TTL {ttl}")
    
    MOCK_STORE["kv"][key] = {
        "value": value,
        "expire": time.time() + ttl
    }
    
    return True

def mock_validate_jwt(token: str) -> Optional[Dict[str, Any]]:
    """
    Mock JWT validation function
    
    Args:
        token: JWT token
    
    Returns:
        Decoded payload or None
    """
    print(f"🔥 THERMONUCLEAR MOCK JWT VALIDATE: {token[:20]}...")
    
    if token and "mock" in token.lower():
        return {
            "id": "uuid-thermo-1",
            "role": "vibe_coder",
            "email": "test@proto.com",
            "exp": time.time() + 3600
        }
    
    return None

def mock_check_budget(current: float, additional: float) -> float:
    """
    Mock budget check function
    
    Args:
        current: Current cost
        additional: Additional cost to add
    
    Returns:
        Total cost
    
    Raises:
        ValueError: If budget exceeded
    """
    total = current + additional
    budget_limit = 0.10  # $0.10 per task
    
    print(f"💰 THERMONUCLEAR BUDGET CHECK: ${total:.3f} / ${budget_limit:.2f}")
    
    if total > budget_limit:
        raise ValueError(f"BUDGET-429: Task exceeded budget limit ${budget_limit:.2f}")
    
    return total

def mock_log_metric(name: str, value: float, tags: Dict[str, str] = None) -> None:
    """
    Mock metric logging function
    
    Args:
        name: Metric name
        value: Metric value
        tags: Metric tags
    """
    print(f"📊 THERMONUCLEAR METRIC: {name}={value} {tags or ''}")

def mock_log_error(error: Exception, context: Dict[str, Any] = None) -> None:
    """
    Mock error logging function
    
    Args:
        error: Exception to log
        context: Error context
    """
    print(f"❌ THERMONUCLEAR ERROR: {type(error).__name__}: {str(error)} {context or ''}")

def mock_delete_user(user_id: str, soft: bool = True) -> Dict[str, Any]:
    """
    Mock user deletion function
    
    Args:
        user_id: User ID to delete
        soft: Whether to soft delete
    
    Returns:
        Deletion result
    """
    print(f"🗑️ THERMONUCLEAR DELETE USER: {user_id} (soft={soft})")
    
    if soft:
        print(f"🔥 Thermonuclear Soft Delete {user_id} - Set deleted_at")
    else:
        print(f"🔥 Thermonuclear Hard Purge {user_id}")
    
    return {
        "success": True,
        "user_id": user_id,
        "deletion_type": "soft" if soft else "hard",
        "timestamp": time.time()
    }

def mock_scan_pii(data: str) -> str:
    """
    Mock PII scanning function
    
    Args:
        data: Data to scan for PII
    
    Returns:
        Scan result message
    """
    print(f"🔍 THERMONUCLEAR PII SCAN: {data[:50]}...")
    
    if "email" in data.lower() or "@" in data:
        return "PII Detected - Redact"
    elif "password" in data.lower():
        return "PII Detected - Encrypt"
    else:
        return "Safe"

def mock_slack_notification(channel: str, message: str, severity: str = "info") -> bool:
    """
    Mock Slack notification function
    
    Args:
        channel: Slack channel
        message: Message to send
        severity: Message severity
    
    Returns:
        Success status
    """
    print(f"💬 THERMONUCLEAR SLACK: #{channel} [{severity.upper()}] {message}")
    
    # Track notification
    MOCK_STORE["api_calls"].append({
        "endpoint": "slack/notify",
        "payload": {"channel": channel, "message": message, "severity": severity},
        "timestamp": time.time(),
        "id": str(uuid.uuid4())
    })
    
    return True

def mock_escalate_hitl(task: str, uncertainty: float, section: str) -> bool:
    """
    Mock HITL escalation function
    
    Args:
        task: Task description
        uncertainty: Uncertainty score (0-1)
        section: CLAUDE.md section reference
    
    Returns:
        Escalation success status
    """
    message = f"Agent ESCALATE: {task} - Uncertainty {uncertainty:.2f} - Ref: CLAUDE.md {section}"
    
    print(f"🚨 THERMONUCLEAR HITL ESCALATE: {message}")
    
    return mock_slack_notification(
        channel="hitl-thermo",
        message=message,
        severity="critical"
    )

def mock_validate_thrive_score(logs: List[Dict[str, Any]]) -> float:
    """
    Mock thrive score validation function
    
    Args:
        logs: Log entries to calculate score from
    
    Returns:
        Thrive score (0-1)
    """
    if not logs:
        return 0.0
    
    total = len(logs)
    success_logs = len([log for log in logs if log.get('status') == 'success'])
    ui_tasks = len([log for log in logs if log.get('type') == 'ui'])
    fails = len([log for log in logs if log.get('status') == 'fail'])
    
    completion = (success_logs / total) * 0.6
    ui_polish = (ui_tasks / total) * 0.3
    risk = (1 - (fails / total)) * 0.1
    
    score = completion + ui_polish + risk
    return min(1.0, max(0.0, score))

def mock_check_kill_switch() -> bool:
    """
    Mock kill switch check function
    
    Returns:
        True if kill switch is activated
    """
    return MOCK_STORE["kill_switch"]

def mock_set_kill_switch(activated: bool) -> None:
    """
    Mock kill switch set function
    
    Args:
        activated: Whether to activate kill switch
    """
    MOCK_STORE["kill_switch"] = activated
    print(f"🔒 THERMONUCLEAR KILL SWITCH: {'ACTIVATED' if activated else 'DEACTIVATED'}")

def mock_get_cost_summary() -> Dict[str, Any]:
    """
    Mock cost summary function
    
    Returns:
        Cost summary
    """
    return {
        "total_cost": MOCK_STORE["cost_tracker"]["total"],
        "session_duration": time.time() - MOCK_STORE["cost_tracker"]["session"],
        "api_calls": len(MOCK_STORE["api_calls"]),
        "budget_limit": 0.10,
        "budget_remaining": max(0, 0.10 - MOCK_STORE["cost_tracker"]["total"])
    }

def mock_reset_mocks() -> None:
    """
    Reset all mock data
    """
    global MOCK_STORE
    MOCK_STORE = {
        "kv": {},
        "d1": {},
        "pinecone": {},
        "api_calls": [],
        "cost_tracker": {"total": 0.0, "session": time.time()},
        "kill_switch": False
    }
    print("🔄 THERMONUCLEAR MOCKS RESET")

# Export all mock functions
__all__ = [
    "mock_api_call",
    "mock_db_query", 
    "mock_pinecone_upsert",
    "mock_pinecone_query",
    "mock_kv_get",
    "mock_kv_put",
    "mock_validate_jwt",
    "mock_check_budget",
    "mock_log_metric",
    "mock_log_error",
    "mock_delete_user",
    "mock_scan_pii",
    "mock_slack_notification",
    "mock_escalate_hitl",
    "mock_validate_thrive_score",
    "mock_check_kill_switch",
    "mock_set_kill_switch",
    "mock_get_cost_summary",
    "mock_reset_mocks"
]