# Simplified validation utilities for Cloudflare Workers
from typing import Dict, Any, Optional, Tuple
import json
import uuid

class UserRoleEnum:
    VIBE_CODER = "vibe_coder"
    ENGINEER = "engineer"
    EXEC = "exec"
    SUPER_ADMIN = "super_admin"

def validate_roadmap_body(body: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate roadmap request body"""
    if not isinstance(body, dict):
        return False, "Body must be a JSON object"
    
    if 'json_graph' not in body:
        return False, "json_graph is required"
    
    try:
        json.loads(body['json_graph'])
    except (TypeError, ValueError):
        return False, "json_graph must be valid JSON"
    
    return True, None

def validate_roadmap_update(body: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate roadmap update body"""
    if not isinstance(body, dict):
        return False, "Body must be a JSON object"
    
    if 'json_graph' in body:
        try:
            json.loads(body['json_graph'])
        except (TypeError, ValueError):
            return False, "json_graph must be valid JSON"
    
    return True, None

def validate_snippet_body(body: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate snippet request body"""
    if not isinstance(body, dict):
        return False, "Body must be a JSON object"
    
    if 'content' not in body:
        return False, "content is required"
    
    return True, None

def validate_agent_log_body(body: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate agent log request body"""
    if not isinstance(body, dict):
        return False, "Body must be a JSON object"
    
    if 'agent' not in body:
        return False, "agent is required"
    
    if 'action' not in body:
        return False, "action is required"
    
    return True, None

def validate_insight_body(body: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate insight request body"""
    if not isinstance(body, dict):
        return False, "Body must be a JSON object"
    
    if 'content' not in body:
        return False, "content is required"
    
    return True, None

def validate_query_params(params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate query parameters"""
    return True, None

def validate_uuid(value: str) -> bool:
    """Validate UUID format"""
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False
