#!/usr/bin/env python3
"""
Advanced Security Utilities for ProtoThrive
Comprehensive security features for input validation, sanitization, and threat detection
"""

import re
import hashlib
import secrets
import string
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
import ipaddress
import urllib.parse

@dataclass
class SecurityThreat:
    threat_type: str
    severity: str
    description: str
    payload: str
    timestamp: datetime

class SecurityValidator:
    """Advanced security validation and threat detection"""
    
    def __init__(self):
        self.threats: List[SecurityThreat] = []
        self.blocked_patterns = self._load_blocked_patterns()
    
    def _load_blocked_patterns(self) -> Dict[str, List[str]]:
        """Load blocked patterns for various attack types"""
        return {
            'sql_injection': [
                r"(\b(union|select|insert|update|delete|drop|create|alter)\b)",
                r"(\b(or|and)\b\s+\d+\s*=\s*\d+)",
                r"(--|#|/\*|\*/)",
                r"(\bxp_|sp_|exec\b)",
                r"(\bwaitfor\b)",
                r"(\bchar\b\s*\()",
                r"(\bcast\b\s*\()",
                r"(\bconvert\b\s*\()",
            ],
            'xss': [
                r"(<script[^>]*>.*?</script>)",
                r"(javascript:)",
                r"(vbscript:)",
                r"(onload\s*=)",
                r"(onerror\s*=)",
                r"(onclick\s*=)",
                r"(onmouseover\s*=)",
                r"(<iframe[^>]*>)",
                r"(<object[^>]*>)",
                r"(<embed[^>]*>)",
            ],
            'path_traversal': [
                r"(\.\./|\.\.\\)",
                r"(/etc/passwd)",
                r"(/etc/shadow)",
                r"(c:\\windows\\system32)",
                r"(%2e%2e%2f)",
                r"(%2e%2e%5c)",
            ],
            'command_injection': [
                r"(\b(cmd|powershell|bash|sh|python|perl|ruby)\b)",
                r"(\||&|;|`|\\$\\()",
                r"(\b(net|ipconfig|ifconfig|whoami|id|ls|dir)\b)",
                r"(\b(kill|taskkill|pkill)\b)",
            ],
            'ldap_injection': [
                r"(\b(uid|cn|ou|dc)\s*=)",
                r"(\*\)|\(\|)",
                r"(\b(and|or|not)\b)",
            ]
        }
    
    def detect_sql_injection(self, input_str: str) -> bool:
        """Detect SQL injection attempts"""
        input_lower = input_str.lower()
        for pattern in self.blocked_patterns['sql_injection']:
            if re.search(pattern, input_lower, re.IGNORECASE):
                self._log_threat('sql_injection', 'high', f'SQL injection pattern detected: {pattern}', input_str)
                return True
        return False
    
    def detect_xss(self, input_str: str) -> bool:
        """Detect XSS attempts"""
        for pattern in self.blocked_patterns['xss']:
            if re.search(pattern, input_str, re.IGNORECASE):
                self._log_threat('xss', 'high', f'XSS pattern detected: {pattern}', input_str)
                return True
        return False
    
    def detect_path_traversal(self, input_str: str) -> bool:
        """Detect path traversal attempts"""
        for pattern in self.blocked_patterns['path_traversal']:
            if re.search(pattern, input_str, re.IGNORECASE):
                self._log_threat('path_traversal', 'high', f'Path traversal pattern detected: {pattern}', input_str)
                return True
        return False
    
    def detect_command_injection(self, input_str: str) -> bool:
        """Detect command injection attempts"""
        for pattern in self.blocked_patterns['command_injection']:
            if re.search(pattern, input_str, re.IGNORECASE):
                self._log_threat('command_injection', 'critical', f'Command injection pattern detected: {pattern}', input_str)
                return True
        return False
    
    def validate_url(self, url: str) -> Tuple[bool, str]:
        """Validate and sanitize URLs"""
        try:
            parsed = urllib.parse.urlparse(url)
            
            # Check for dangerous protocols
            dangerous_protocols = ['javascript:', 'vbscript:', 'data:', 'file:']
            if parsed.scheme.lower() in dangerous_protocols:
                self._log_threat('dangerous_protocol', 'high', f'Dangerous protocol detected: {parsed.scheme}', url)
                return False, f"Dangerous protocol: {parsed.scheme}"
            
            # Check for localhost/private IP access
            if parsed.hostname:
                try:
                    ip = ipaddress.ip_address(parsed.hostname)
                    if ip.is_private or ip.is_loopback:
                        self._log_threat('private_ip_access', 'medium', f'Private IP access attempt: {parsed.hostname}', url)
                        return False, f"Private IP access not allowed: {parsed.hostname}"
                except ValueError:
                    pass  # Not an IP address
            
            return True, "URL is valid"
            
        except Exception as e:
            self._log_threat('invalid_url', 'medium', f'Invalid URL format: {str(e)}', url)
            return False, f"Invalid URL format: {str(e)}"
    
    def sanitize_filename(self, filename: str) -> str:
        """Sanitize filename to prevent path traversal"""
        # Remove dangerous characters
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')
        
        # Remove path traversal attempts
        filename = re.sub(r'\.\./', '', filename)
        filename = re.sub(r'\.\.\\', '', filename)
        
        # Limit length
        if len(filename) > 255:
            filename = filename[:255]
        
        return filename
    
    def validate_file_upload(self, filename: str, content_type: str, file_size: int) -> Tuple[bool, str]:
        """Validate file upload security"""
        # Check file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            return False, f"File too large: {file_size} bytes (max: {max_size})"
        
        # Check file extension
        allowed_extensions = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/gif': ['.gif'],
            'image/webp': ['.webp'],
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/json': ['.json'],
            'text/csv': ['.csv']
        }
        
        if content_type not in allowed_extensions:
            return False, f"Unsupported content type: {content_type}"
        
        # Check file extension matches content type
        file_ext = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
        if file_ext not in allowed_extensions[content_type]:
            return False, f"File extension {file_ext} doesn't match content type {content_type}"
        
        # Sanitize filename
        sanitized_filename = self.sanitize_filename(filename)
        if sanitized_filename != filename:
            return False, f"Filename contains dangerous characters: {filename}"
        
        return True, "File upload is valid"
    
    def _log_threat(self, threat_type: str, severity: str, description: str, payload: str):
        """Log security threat"""
        threat = SecurityThreat(
            threat_type=threat_type,
            severity=severity,
            description=description,
            payload=payload,
            timestamp=datetime.utcnow()
        )
        self.threats.append(threat)
    
    def get_threats(self) -> List[SecurityThreat]:
        """Get all detected threats"""
        return self.threats.copy()
    
    def clear_threats(self):
        """Clear threat log"""
        self.threats.clear()

class CSRFProtection:
    """CSRF protection utilities"""
    
    def __init__(self):
        self.tokens: Dict[str, datetime] = {}
    
    def generate_token(self, session_id: str) -> str:
        """Generate CSRF token for session"""
        token = secrets.token_urlsafe(32)
        self.tokens[session_id] = datetime.utcnow()
        return token
    
    def validate_token(self, session_id: str, token: str) -> bool:
        """Validate CSRF token"""
        if session_id not in self.tokens:
            return False
        
        # Check if token is expired (24 hours)
        token_time = self.tokens[session_id]
        if datetime.utcnow() - token_time > timedelta(hours=24):
            del self.tokens[session_id]
            return False
        
        return True
    
    def invalidate_token(self, session_id: str):
        """Invalidate CSRF token"""
        if session_id in self.tokens:
            del self.tokens[session_id]

class RateLimiter:
    """Advanced rate limiting with IP-based tracking"""
    
    def __init__(self, max_requests: int = 100, window_seconds: int = 3600):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[datetime]] = {}
    
    def is_allowed(self, identifier: str) -> bool:
        """Check if request is allowed"""
        now = datetime.utcnow()
        
        if identifier not in self.requests:
            self.requests[identifier] = [now]
            return True
        
        # Remove old requests outside window
        cutoff = now - timedelta(seconds=self.window_seconds)
        self.requests[identifier] = [
            req_time for req_time in self.requests[identifier]
            if req_time > cutoff
        ]
        
        # Check if under limit
        if len(self.requests[identifier]) < self.max_requests:
            self.requests[identifier].append(now)
            return True
        
        return False
    
    def get_remaining_requests(self, identifier: str) -> int:
        """Get remaining requests for identifier"""
        now = datetime.utcnow()
        cutoff = now - timedelta(seconds=self.window_seconds)
        
        if identifier not in self.requests:
            return self.max_requests
        
        valid_requests = [
            req_time for req_time in self.requests[identifier]
            if req_time > cutoff
        ]
        
        return max(0, self.max_requests - len(valid_requests))

class InputSanitizer:
    """Advanced input sanitization"""
    
    @staticmethod
    def sanitize_html(html: str) -> str:
        """Sanitize HTML input"""
        # Remove script tags and content
        html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove dangerous tags
        dangerous_tags = ['iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select']
        for tag in dangerous_tags:
            html = re.sub(f'<{tag}[^>]*>.*?</{tag}>', '', html, flags=re.IGNORECASE | re.DOTALL)
            html = re.sub(f'<{tag}[^>]*>', '', html, flags=re.IGNORECASE)
        
        # Remove dangerous attributes
        dangerous_attrs = [
            'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
            'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
            'onkeydown', 'onkeyup', 'onkeypress'
        ]
        for attr in dangerous_attrs:
            html = re.sub(f'{attr}=["\'][^"\']*["\']', '', html, flags=re.IGNORECASE)
        
        # Remove javascript: protocol
        html = re.sub(r'javascript:', '', html, flags=re.IGNORECASE)
        
        return html
    
    @staticmethod
    def sanitize_sql_input(input_str: str) -> str:
        """Sanitize SQL input"""
        # Remove SQL comments
        input_str = re.sub(r'--.*$', '', input_str, flags=re.MULTILINE)
        input_str = re.sub(r'/\*.*?\*/', '', input_str, flags=re.DOTALL)
        
        # Escape single quotes
        input_str = input_str.replace("'", "''")
        
        return input_str
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename"""
        # Remove dangerous characters
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\\', '/']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')
        
        # Remove path traversal
        filename = re.sub(r'\.\./', '', filename)
        filename = re.sub(r'\.\.\\', '', filename)
        
        # Limit length
        if len(filename) > 255:
            filename = filename[:255]
        
        return filename
