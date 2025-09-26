"""
ProtoThrive Authentication Utilities - JWT Implementation
Production JWT token validation and user management

Ref: CLAUDE.md Phase 1 - Authentication & Security
"""

import json
import time
import base64
import hmac
import hashlib
from typing import Dict, Any, Optional
from js import console

class AuthError(Exception):
    """Authentication related errors"""
    pass

def validate_jwt_structure(token: str) -> Dict[str, str]:
    """Validate JWT token structure and extract parts"""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            raise AuthError("Invalid JWT structure - must have 3 parts")

        return {
            'header': parts[0],
            'payload': parts[1],
            'signature': parts[2]
        }
    except Exception as e:
        raise AuthError(f"Invalid JWT format: {str(e)}")

def decode_jwt_payload(encoded_payload: str) -> Dict[str, Any]:
    """Decode JWT payload from base64"""
    try:
        # Add padding if needed
        missing_padding = len(encoded_payload) % 4
        if missing_padding:
            encoded_payload += '=' * (4 - missing_padding)

        decoded_bytes = base64.urlsafe_b64decode(encoded_payload)
        payload = json.loads(decoded_bytes.decode('utf-8'))

        return payload
    except Exception as e:
        raise AuthError(f"Failed to decode JWT payload: {str(e)}")

def verify_jwt_signature(header: str, payload: str, signature: str, secret: str) -> bool:
    """Verify JWT signature using HMAC-SHA256"""
    try:
        # Create the signature base
        message = f"{header}.{payload}"

        # Generate expected signature
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()

        # Encode to base64url
        expected_signature_b64 = base64.urlsafe_b64encode(expected_signature).decode('utf-8').rstrip('=')

        # Compare signatures
        return hmac.compare_digest(signature, expected_signature_b64)
    except Exception as e:
        console.error(f"JWT signature verification failed: {str(e)}")
        return False

def validate_jwt_claims(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Validate JWT claims and extract user information"""
    current_time = int(time.time())

    # SECURITY FIX: Stricter expiration validation - always required
    if 'exp' not in payload:
        raise AuthError("Token missing expiration claim")

    if current_time >= payload['exp']:
        raise AuthError("Token has expired")

    # Check not before
    if 'nbf' in payload:
        if current_time < payload['nbf']:
            raise AuthError("Token not yet valid")

    # SECURITY FIX: Stricter issued at validation - always required
    if 'iat' not in payload:
        raise AuthError("Token missing issued at claim")

    # Check issued at (with 1 minute leeway instead of 5)
    if current_time < payload['iat'] - 60:
        raise AuthError("Token issued in the future")

    # SECURITY FIX: Check token age - reject tokens older than 24 hours
    if current_time - payload['iat'] > 86400:
        raise AuthError("Token too old - please re-authenticate")

    # SECURITY FIX: Stricter validation of required claims
    if 'sub' not in payload:
        raise AuthError("Missing subject (user ID) in token")

    if 'iss' not in payload or payload['iss'] not in ['protothrive-prod', 'protothrive-dev']:
        raise AuthError("Invalid or missing token issuer")

    user_id = payload['sub']
    role = payload.get('role', 'vibe_coder')
    email = payload.get('email', '')

    # SECURITY FIX: Validate user ID format
    import re
    if not re.match(r'^[a-zA-Z0-9_-]+$', user_id) or len(user_id) < 3:
        raise AuthError("Invalid user ID format")

    # SECURITY FIX: Validate email format if present
    if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        raise AuthError("Invalid email format in token")

    # Validate role
    valid_roles = ['vibe_coder', 'engineer', 'admin', 'exec']
    if role not in valid_roles:
        raise AuthError(f"Invalid role: {role}")

    return {
        'id': user_id,
        'email': email,
        'role': role,
        'exp': payload.get('exp'),
        'iat': payload.get('iat'),
        'iss': payload.get('iss')
    }

async def validate_auth_token(authorization_header: Optional[str], jwt_secret: str = "thermonuclear-dev-secret") -> Dict[str, Any]:
    """
    Validate authentication token and return user information

    Args:
        authorization_header: Bearer token from request header
        jwt_secret: Secret key for JWT verification

    Returns:
        Dict containing user information

    Raises:
        AuthError: If token is invalid or expired
    """

    if not authorization_header:
        raise AuthError("Missing Authorization header")

    if not authorization_header.startswith('Bearer '):
        raise AuthError("Invalid Authorization header format - must start with 'Bearer '")

    token = authorization_header[7:]  # Remove 'Bearer ' prefix

    if not token:
        raise AuthError("Empty token")

    # SECURITY FIX: Only allow mock tokens in development environment
    import os
    if token == "mock-dev-token" and os.environ.get('ENVIRONMENT', 'production') == 'development':
        console.log("Development mode: Using mock authentication")
        return {
            'id': 'user_demo_001',
            'email': 'demo@protothrive.com',
            'role': 'vibe_coder',
            'exp': int(time.time()) + 3600,
            'iat': int(time.time())
        }
    elif token == "mock-dev-token":
        # SECURITY: Reject mock tokens in production
        raise AuthError("Mock tokens not allowed in production environment")

    try:
        # Parse JWT structure
        jwt_parts = validate_jwt_structure(token)

        # Decode payload
        payload = decode_jwt_payload(jwt_parts['payload'])

        # Verify signature
        if not verify_jwt_signature(jwt_parts['header'], jwt_parts['payload'], jwt_parts['signature'], jwt_secret):
            raise AuthError("Invalid token signature")

        # Validate claims
        user_info = validate_jwt_claims(payload)

        console.log(f"JWT validation successful for user: {user_info['id']}")
        return user_info

    except AuthError:
        raise
    except Exception as e:
        console.error(f"JWT validation error: {str(e)}")
        raise AuthError(f"Token validation failed: {str(e)}")

def generate_dev_jwt(user_id: str, email: str, role: str = "vibe_coder", secret: str = "thermonuclear-dev-secret") -> str:
    """
    Generate a JWT token for development/testing purposes

    Args:
        user_id: User identifier
        email: User email
        role: User role
        secret: JWT secret key

    Returns:
        JWT token string
    """

    # Create header
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }

    # Create payload
    current_time = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": current_time,
        "exp": current_time + 3600,  # 1 hour expiration
        "iss": "protothrive-dev",
        "aud": "protothrive-api"
    }

    # Encode header and payload
    header_encoded = base64.urlsafe_b64encode(json.dumps(header).encode('utf-8')).decode('utf-8').rstrip('=')
    payload_encoded = base64.urlsafe_b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8').rstrip('=')

    # Create signature
    message = f"{header_encoded}.{payload_encoded}"
    signature = hmac.new(
        secret.encode('utf-8'),
        message.encode('utf-8'),
        hashlib.sha256
    ).digest()
    signature_encoded = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip('=')

    # Combine parts
    jwt_token = f"{header_encoded}.{payload_encoded}.{signature_encoded}"

    console.log(f"Generated JWT for user {user_id} with role {role}")
    return jwt_token

def check_user_permission(user_role: str, required_role: str) -> bool:
    """
    Check if user has required permission level

    Role hierarchy: vibe_coder < engineer < admin < exec
    """

    role_hierarchy = {
        'vibe_coder': 1,
        'engineer': 2,
        'admin': 3,
        'exec': 4
    }

    user_level = role_hierarchy.get(user_role, 0)
    required_level = role_hierarchy.get(required_role, 0)

    return user_level >= required_level

async def get_auth_middleware(env: Dict[str, Any]):
    """
    Return authentication middleware function
    """

    async def auth_middleware(c, next):
        """Authentication middleware for Hono"""

        try:
            # Skip auth for health check and public endpoints
            path = c.req.path
            if path in ['/health', '/api/health']:
                await next()
                return

            # Get authorization header
            auth_header = c.req.header('Authorization')

            # Get JWT secret from environment (fallback to dev secret)
            jwt_secret = getattr(env, 'JWT_SECRET', 'thermonuclear-dev-secret')

            # Validate token
            user_info = await validate_auth_token(auth_header, jwt_secret)

            # Set user in context
            c.set('user', user_info)

            await next()

        except AuthError as e:
            console.error(f"Authentication failed: {str(e)}")
            return c.json({
                'error': str(e),
                'code': 'AUTH-401'
            }, 401)
        except Exception as e:
            console.error(f"Auth middleware error: {str(e)}")
            return c.json({
                'error': 'Authentication failed',
                'code': 'AUTH-500'
            }, 500)

    return auth_middleware

# Development helper function
def create_test_tokens():
    """Create test JWT tokens for development"""

    tokens = {}

    # Demo user token
    tokens['demo'] = generate_dev_jwt(
        'user_demo_001',
        'demo@protothrive.com',
        'vibe_coder'
    )

    # Admin user token
    tokens['admin'] = generate_dev_jwt(
        'user_admin_001',
        'admin@localhost.dev',
        'admin'
    )

    # Test user token
    tokens['test'] = generate_dev_jwt(
        'user_test_001',
        'test@protothrive.com',
        'engineer'
    )

    console.log("Generated test JWT tokens:")
    for name, token in tokens.items():
        console.log(f"{name}: {token}")

    return tokens

# Export main functions
__all__ = [
    'validate_auth_token',
    'generate_dev_jwt',
    'check_user_permission',
    'get_auth_middleware',
    'create_test_tokens',
    'AuthError'
]