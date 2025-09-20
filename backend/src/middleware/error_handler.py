"""
Comprehensive Error Handling Middleware for ProtoThrive

Provides centralized error handling with:
- Structured error responses
- Error categorization and codes
- Retry mechanisms
- Graceful degradation
- Error logging and monitoring
- User-friendly error messages
"""

from typing import Dict, Optional, Any, List, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import traceback
import json
import hashlib
from datetime import datetime

# Cloudflare imports
from js import Response, Request


class ErrorCategory(Enum):
    """Error categories for classification"""
    AUTHENTICATION = "AUTH"
    VALIDATION = "VAL"
    DATABASE = "DB"
    NETWORK = "NET"
    RATE_LIMIT = "RATE"
    AGENT = "AGENT"
    BUDGET = "COST"
    SERVER = "SRV"
    CLIENT = "CLIENT"
    UNKNOWN = "UNKNOWN"


class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ErrorDetail:
    """Structured error information"""
    code: str
    message: str
    category: ErrorCategory
    severity: ErrorSeverity
    status_code: int
    details: Optional[Dict[str, Any]] = None
    user_message: Optional[str] = None
    retry_after: Optional[int] = None
    help_url: Optional[str] = None
    request_id: Optional[str] = None
    timestamp: Optional[str] = None


class ErrorRegistry:
    """Registry of known errors with structured responses"""

    def __init__(self):
        self.errors = {
            # Authentication errors
            "AUTH-401": ErrorDetail(
                code="AUTH-401",
                message="Authentication required",
                category=ErrorCategory.AUTHENTICATION,
                severity=ErrorSeverity.MEDIUM,
                status_code=401,
                user_message="Please log in to access this resource",
                help_url="/docs/authentication"
            ),
            "AUTH-403": ErrorDetail(
                code="AUTH-403",
                message="Insufficient permissions",
                category=ErrorCategory.AUTHENTICATION,
                severity=ErrorSeverity.MEDIUM,
                status_code=403,
                user_message="You don't have permission to access this resource",
                help_url="/docs/permissions"
            ),

            # Validation errors
            "VAL-400": ErrorDetail(
                code="VAL-400",
                message="Invalid request data",
                category=ErrorCategory.VALIDATION,
                severity=ErrorSeverity.LOW,
                status_code=400,
                user_message="Please check your input and try again"
            ),
            "VAL-422": ErrorDetail(
                code="VAL-422",
                message="Unprocessable entity",
                category=ErrorCategory.VALIDATION,
                severity=ErrorSeverity.LOW,
                status_code=422,
                user_message="The data provided cannot be processed"
            ),

            # Database errors
            "DB-500": ErrorDetail(
                code="DB-500",
                message="Database error",
                category=ErrorCategory.DATABASE,
                severity=ErrorSeverity.HIGH,
                status_code=500,
                user_message="A database error occurred. Please try again later",
                retry_after=30
            ),
            "DB-503": ErrorDetail(
                code="DB-503",
                message="Database unavailable",
                category=ErrorCategory.DATABASE,
                severity=ErrorSeverity.CRITICAL,
                status_code=503,
                user_message="Database is temporarily unavailable",
                retry_after=60
            ),

            # Rate limiting
            "RATE-429": ErrorDetail(
                code="RATE-429",
                message="Rate limit exceeded",
                category=ErrorCategory.RATE_LIMIT,
                severity=ErrorSeverity.LOW,
                status_code=429,
                user_message="Too many requests. Please slow down",
                retry_after=60
            ),

            # Agent errors
            "AGENT-500": ErrorDetail(
                code="AGENT-500",
                message="Agent execution failed",
                category=ErrorCategory.AGENT,
                severity=ErrorSeverity.MEDIUM,
                status_code=500,
                user_message="AI processing failed. Please try again"
            ),
            "AGENT-417": ErrorDetail(
                code="AGENT-417",
                message="No agent produced successful result",
                category=ErrorCategory.AGENT,
                severity=ErrorSeverity.MEDIUM,
                status_code=502,
                user_message="Unable to process your request with AI"
            ),

            # Budget errors
            "COST-401": ErrorDetail(
                code="COST-401",
                message="Insufficient budget",
                category=ErrorCategory.BUDGET,
                severity=ErrorSeverity.MEDIUM,
                status_code=402,
                user_message="Processing budget exceeded",
                help_url="/docs/budgets"
            ),

            # Generic errors
            "SRV-500": ErrorDetail(
                code="SRV-500",
                message="Internal server error",
                category=ErrorCategory.SERVER,
                severity=ErrorSeverity.HIGH,
                status_code=500,
                user_message="An unexpected error occurred",
                retry_after=30
            ),
            "SRV-503": ErrorDetail(
                code="SRV-503",
                message="Service unavailable",
                category=ErrorCategory.SERVER,
                severity=ErrorSeverity.CRITICAL,
                status_code=503,
                user_message="Service is temporarily unavailable",
                retry_after=60
            )
        }

    def get_error(self, code: str) -> ErrorDetail:
        """Get error detail by code"""
        return self.errors.get(code, self.errors["SRV-500"])

    def register_error(self, error: ErrorDetail) -> None:
        """Register custom error"""
        self.errors[error.code] = error


class ErrorHandler:
    """
    Comprehensive error handling middleware.

    Features:
    - Automatic error categorization
    - Structured error responses
    - Error logging and monitoring
    - Retry mechanisms
    - Circuit breaker pattern
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize error handler"""
        self.env = env
        self.registry = ErrorRegistry()
        self.monitoring = ErrorMonitoring(env)

        # Circuit breaker configuration
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}

        # Error correlation
        self.correlation_store: Dict[str, List[str]] = {}

    async def handle_error(
        self,
        error: Exception,
        request: Request,
        context: Optional[Dict[str, Any]] = None
    ) -> Response:
        """
        Handle error and return appropriate response.

        Args:
            error: Exception that occurred
            request: Original request
            context: Additional context

        Returns:
            Error response with appropriate status and headers
        """
        # Generate request ID for tracking
        request_id = self._generate_request_id(request)

        # Extract error details
        error_detail = self._extract_error_detail(error, request_id)

        # Log error
        await self.monitoring.log_error(error_detail, request, error)

        # Check if we should apply circuit breaker
        if self._should_circuit_break(error_detail):
            return self._circuit_breaker_response(error_detail)

        # Create error response
        response = self._create_error_response(error_detail, request_id)

        # Add retry headers if applicable
        if error_detail.retry_after:
            response.headers["Retry-After"] = str(error_detail.retry_after)

        # Track error correlation
        self._track_correlation(request_id, error_detail.code)

        return response

    def _extract_error_detail(
        self,
        error: Exception,
        request_id: str
    ) -> ErrorDetail:
        """Extract structured error detail from exception"""
        # Check if it's a known error with code
        if hasattr(error, 'code'):
            error_detail = self.registry.get_error(error.code)
            error_detail.request_id = request_id
            error_detail.timestamp = datetime.utcnow().isoformat()

            # Add additional details from exception
            if hasattr(error, 'details'):
                error_detail.details = error.details

            return error_detail

        # Categorize unknown errors
        error_type = type(error).__name__
        error_message = str(error)

        # Try to categorize based on error type and message
        if "database" in error_message.lower() or "sql" in error_message.lower():
            category = ErrorCategory.DATABASE
            code = "DB-500"
        elif "auth" in error_message.lower() or "permission" in error_message.lower():
            category = ErrorCategory.AUTHENTICATION
            code = "AUTH-401"
        elif "validation" in error_message.lower() or "invalid" in error_message.lower():
            category = ErrorCategory.VALIDATION
            code = "VAL-400"
        elif "rate" in error_message.lower() or "limit" in error_message.lower():
            category = ErrorCategory.RATE_LIMIT
            code = "RATE-429"
        else:
            category = ErrorCategory.UNKNOWN
            code = "SRV-500"

        error_detail = self.registry.get_error(code)
        error_detail.request_id = request_id
        error_detail.timestamp = datetime.utcnow().isoformat()
        error_detail.details = {
            "error_type": error_type,
            "error_message": error_message
        }

        return error_detail

    def _create_error_response(
        self,
        error_detail: ErrorDetail,
        request_id: str
    ) -> Response:
        """Create structured error response"""
        # Determine what to include based on environment
        is_production = self.env.get("ENVIRONMENT") == "production"

        response_body = {
            "error": {
                "code": error_detail.code,
                "message": error_detail.user_message or error_detail.message,
                "category": error_detail.category.value,
                "request_id": request_id,
                "timestamp": error_detail.timestamp
            }
        }

        # Add help URL if available
        if error_detail.help_url:
            response_body["error"]["help_url"] = error_detail.help_url

        # Add retry information
        if error_detail.retry_after:
            response_body["error"]["retry_after"] = error_detail.retry_after

        # Include details in non-production
        if not is_production and error_detail.details:
            response_body["error"]["details"] = error_detail.details

        headers = {
            "Content-Type": "application/json",
            "X-Request-ID": request_id,
            "X-Error-Code": error_detail.code
        }

        return Response.new(
            json.dumps(response_body),
            status=error_detail.status_code,
            headers=headers
        )

    def _should_circuit_break(self, error_detail: ErrorDetail) -> bool:
        """Check if circuit breaker should be applied"""
        # Apply circuit breaker for critical errors
        if error_detail.severity == ErrorSeverity.CRITICAL:
            key = f"{error_detail.category.value}:{error_detail.code}"

            if key not in self.circuit_breakers:
                self.circuit_breakers[key] = CircuitBreaker()

            return self.circuit_breakers[key].should_break()

        return False

    def _circuit_breaker_response(self, error_detail: ErrorDetail) -> Response:
        """Create circuit breaker response"""
        return Response.new(
            json.dumps({
                "error": {
                    "code": "SRV-503",
                    "message": "Service circuit breaker activated",
                    "retry_after": 300  # 5 minutes
                }
            }),
            status=503,
            headers={
                "Content-Type": "application/json",
                "Retry-After": "300"
            }
        )

    def _generate_request_id(self, request: Request) -> str:
        """Generate unique request ID"""
        # Check if request already has ID
        existing_id = request.headers.get("X-Request-ID")
        if existing_id:
            return existing_id

        # Generate new ID
        timestamp = str(datetime.utcnow().timestamp())
        url = request.url
        hash_input = f"{timestamp}:{url}"

        return hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    def _track_correlation(self, request_id: str, error_code: str) -> None:
        """Track error correlation for pattern detection"""
        # Simple in-memory correlation (could be enhanced with KV)
        if error_code not in self.correlation_store:
            self.correlation_store[error_code] = []

        self.correlation_store[error_code].append(request_id)

        # Keep only last 100 for memory efficiency
        if len(self.correlation_store[error_code]) > 100:
            self.correlation_store[error_code] = self.correlation_store[error_code][-100:]


class CircuitBreaker:
    """Simple circuit breaker implementation"""

    def __init__(self, threshold: int = 5, timeout: int = 300):
        """
        Initialize circuit breaker.

        Args:
            threshold: Number of failures before breaking
            timeout: Seconds before attempting reset
        """
        self.threshold = threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open

    def should_break(self) -> bool:
        """Check if circuit should break"""
        current_time = datetime.utcnow().timestamp()

        # Reset if timeout passed
        if self.last_failure_time and (current_time - self.last_failure_time) > self.timeout:
            self.reset()

        # Increment failure count
        self.failure_count += 1
        self.last_failure_time = current_time

        # Check threshold
        if self.failure_count >= self.threshold:
            self.state = "open"
            return True

        return False

    def reset(self) -> None:
        """Reset circuit breaker"""
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"


class ErrorMonitoring:
    """Error monitoring and logging"""

    def __init__(self, env: Dict[str, Any]):
        self.env = env
        self.kv = env.get("KV")

    async def log_error(
        self,
        error_detail: ErrorDetail,
        request: Request,
        exception: Exception
    ) -> None:
        """Log error for monitoring"""
        # Create log entry
        log_entry = {
            "timestamp": error_detail.timestamp,
            "code": error_detail.code,
            "category": error_detail.category.value,
            "severity": error_detail.severity.value,
            "request_id": error_detail.request_id,
            "url": request.url,
            "method": request.method,
            "user_agent": request.headers.get("User-Agent", ""),
            "message": str(exception)
        }

        # Log to console
        print(f"ERROR: {json.dumps(log_entry)}")

        # Store in KV for analysis (if available)
        if self.kv:
            try:
                key = f"error:{error_detail.request_id}"
                await self.kv.put(key, json.dumps(log_entry), {
                    "expirationTtl": 86400 * 7  # Keep for 7 days
                })
            except Exception as e:
                print(f"Failed to store error in KV: {e}")

        # Send to external monitoring (if configured)
        await self._send_to_monitoring(log_entry)

    async def _send_to_monitoring(self, log_entry: Dict[str, Any]) -> None:
        """Send error to external monitoring service"""
        # Sentry integration
        sentry_dsn = self.env.get("SENTRY_DSN")
        if sentry_dsn:
            # Implement Sentry reporting
            pass

        # Datadog integration
        datadog_api_key = self.env.get("DATADOG_API_KEY")
        if datadog_api_key:
            # Implement Datadog reporting
            pass


# Retry decorator for automatic retry logic
class RetryHandler:
    """Automatic retry logic for transient failures"""

    def __init__(
        self,
        max_retries: int = 3,
        backoff_factor: float = 2.0,
        retryable_errors: Optional[List[str]] = None
    ):
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.retryable_errors = retryable_errors or [
            "NET-500", "DB-503", "SRV-503"
        ]

    async def execute_with_retry(
        self,
        func: Callable,
        *args,
        **kwargs
    ) -> Any:
        """Execute function with automatic retry"""
        import asyncio

        last_error = None
        for attempt in range(self.max_retries):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                last_error = e

                # Check if error is retryable
                if hasattr(e, 'code') and e.code not in self.retryable_errors:
                    raise e

                # Calculate backoff
                if attempt < self.max_retries - 1:
                    delay = (self.backoff_factor ** attempt)
                    await asyncio.sleep(delay)

        # All retries failed
        raise last_error


# Export for use in application
__all__ = [
    'ErrorHandler',
    'ErrorDetail',
    'ErrorCategory',
    'ErrorSeverity',
    'ErrorRegistry',
    'RetryHandler',
    'CircuitBreaker'
]