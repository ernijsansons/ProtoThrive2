"""
Comprehensive Input Validation and Security for ProtoThrive Backend
Implements OWASP security best practices and input sanitization
"""

import re
import json
import html
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse

class SecurityValidationError(Exception):
    """Custom exception for security validation failures"""
    pass

class InputValidator:
    """Comprehensive input validator with security checks"""

    # XSS patterns to detect
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'vbscript:',
        r'onload\s*=',
        r'onerror\s*=',
        r'onclick\s*=',
        r'onmouseover\s*=',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
        r'<link[^>]*>',
        r'<meta[^>]*>',
    ]

    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"['\";].*--",
        r"union\s+select",
        r"insert\s+into",
        r"delete\s+from",
        r"drop\s+table",
        r"exec\s*\(",
        r"execute\s*\(",
        r"sp_\w+",
        r"xp_\w+",
    ]

    @staticmethod
    def validate_uuid(value: str) -> bool:
        """Validate UUID format"""
        if not isinstance(value, str):
            return False

        uuid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        return bool(re.match(uuid_pattern, value))

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        if not isinstance(email, str) or len(email) > 320:
            return False

        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(email_pattern, email))

    @staticmethod
    def sanitize_string(value: str, max_length: int = 1000) -> str:
        """Sanitize string input to prevent XSS and injection attacks"""
        if not isinstance(value, str):
            raise SecurityValidationError("Value must be a string")

        # Length check
        if len(value) > max_length:
            raise SecurityValidationError(f"String exceeds maximum length of {max_length}")

        # HTML encode to prevent XSS
        sanitized = html.escape(value, quote=True)

        # Check for XSS patterns
        for pattern in InputValidator.XSS_PATTERNS:
            if re.search(pattern, sanitized, re.IGNORECASE):
                raise SecurityValidationError("Potential XSS attack detected")

        # Check for SQL injection patterns
        for pattern in InputValidator.SQL_INJECTION_PATTERNS:
            if re.search(pattern, sanitized, re.IGNORECASE):
                raise SecurityValidationError("Potential SQL injection detected")

        return sanitized

    @staticmethod
    def validate_json_graph(json_string: str) -> Dict[str, Any]:
        """Validate and sanitize JSON graph data"""
        if not isinstance(json_string, str):
            raise SecurityValidationError("JSON graph must be a string")

        if len(json_string) > 50000:  # 50KB limit
            raise SecurityValidationError("JSON graph too large")

        try:
            data = json.loads(json_string)
        except json.JSONDecodeError as e:
            raise SecurityValidationError(f"Invalid JSON format: {str(e)}")

        # Validate structure
        if not isinstance(data, dict):
            raise SecurityValidationError("JSON graph must be an object")

        # Validate nodes
        nodes = data.get('nodes', [])
        if not isinstance(nodes, list):
            raise SecurityValidationError("Nodes must be an array")

        for i, node in enumerate(nodes):
            if not isinstance(node, dict):
                raise SecurityValidationError(f"Node {i} must be an object")

            # Validate required fields
            if 'id' not in node:
                raise SecurityValidationError(f"Node {i} missing required 'id' field")

            # Sanitize node label
            if 'label' in node:
                node['label'] = InputValidator.sanitize_string(node['label'], 100)

        # Validate edges
        edges = data.get('edges', [])
        if not isinstance(edges, list):
            raise SecurityValidationError("Edges must be an array")

        for i, edge in enumerate(edges):
            if not isinstance(edge, dict):
                raise SecurityValidationError(f"Edge {i} must be an object")

        return data

    @staticmethod
    def validate_roadmap_status(status: str) -> str:
        """Validate roadmap status"""
        allowed_statuses = ['draft', 'active', 'completed', 'archived']
        if status not in allowed_statuses:
            raise SecurityValidationError(f"Invalid status. Must be one of: {allowed_statuses}")
        return status

    @staticmethod
    def validate_user_role(role: str) -> str:
        """Validate user role"""
        allowed_roles = ['vibe_coder', 'engineer', 'exec']
        if role not in allowed_roles:
            raise SecurityValidationError(f"Invalid role. Must be one of: {allowed_roles}")
        return role

    @staticmethod
    def validate_thrive_score(score: Union[int, float]) -> float:
        """Validate thrive score"""
        try:
            score = float(score)
        except (ValueError, TypeError):
            raise SecurityValidationError("Thrive score must be a number")

        if not 0.0 <= score <= 1.0:
            raise SecurityValidationError("Thrive score must be between 0.0 and 1.0")

        return score

    @staticmethod
    def validate_url(url: str) -> str:
        """Validate URL format and scheme"""
        if not isinstance(url, str):
            raise SecurityValidationError("URL must be a string")

        if len(url) > 2048:
            raise SecurityValidationError("URL too long")

        try:
            parsed = urlparse(url)
            if parsed.scheme not in ['http', 'https']:
                raise SecurityValidationError("URL must use http or https scheme")

            if not parsed.netloc:
                raise SecurityValidationError("Invalid URL format")

        except Exception:
            raise SecurityValidationError("Invalid URL format")

        return url

class RateLimitValidator:
    """Rate limiting validation"""

    @staticmethod
    def validate_request_rate(ip_address: str, max_requests: int = 100, window_seconds: int = 3600) -> bool:
        """Validate request rate (basic implementation)"""
        # In production, this would use Redis or similar
        # For now, return True (implement proper rate limiting in middleware)
        return True

def validate_roadmap_create_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate roadmap creation request"""
    validated = {}

    # Required fields
    if 'json_graph' not in data:
        raise SecurityValidationError("json_graph field is required")

    # Validate and sanitize JSON graph
    validated['json_graph'] = json.dumps(
        InputValidator.validate_json_graph(data['json_graph'])
    )

    # Optional fields with validation
    if 'status' in data:
        validated['status'] = InputValidator.validate_roadmap_status(data['status'])
    else:
        validated['status'] = 'draft'

    if 'vibe_mode' in data:
        validated['vibe_mode'] = bool(data['vibe_mode'])
    else:
        validated['vibe_mode'] = False

    if 'thrive_score' in data:
        validated['thrive_score'] = InputValidator.validate_thrive_score(data['thrive_score'])
    else:
        validated['thrive_score'] = 0.0

    return validated

def validate_roadmap_update_request(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate roadmap update request"""
    validated = {}

    # All fields are optional for updates
    if 'json_graph' in data:
        validated['json_graph'] = json.dumps(
            InputValidator.validate_json_graph(data['json_graph'])
        )

    if 'status' in data:
        validated['status'] = InputValidator.validate_roadmap_status(data['status'])

    if 'vibe_mode' in data:
        validated['vibe_mode'] = bool(data['vibe_mode'])

    if 'thrive_score' in data:
        validated['thrive_score'] = InputValidator.validate_thrive_score(data['thrive_score'])

    if not validated:
        raise SecurityValidationError("No valid update fields provided")

    return validated

def validate_auth_header(auth_header: Optional[str]) -> Optional[str]:
    """Validate authorization header"""
    if not auth_header:
        return None

    if not auth_header.startswith('Bearer '):
        raise SecurityValidationError("Invalid authorization header format")

    token = auth_header[7:].strip()  # Remove "Bearer " prefix

    if not token:
        raise SecurityValidationError("Missing authorization token")

    # Basic token format validation
    if len(token) < 10 or len(token) > 1000:
        raise SecurityValidationError("Invalid token length")

    # Sanitize token (remove any potential malicious characters)
    if not re.match(r'^[A-Za-z0-9._-]+$', token):
        raise SecurityValidationError("Invalid token format")

    return token