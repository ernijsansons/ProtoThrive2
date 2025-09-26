"""
Database-specific exceptions with proper error codes
Ref: CLAUDE.md - Secure Database Implementation

Provides comprehensive error handling for database operations
with structured error codes and meaningful messages.
"""
from typing import Optional, Dict, Any


class DatabaseError(Exception):
    """Base database exception with structured error reporting"""

    def __init__(
        self,
        message: str,
        code: str = "DB-500",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses"""
        return {
            "error": self.message,
            "code": self.code,
            "details": self.details
        }


class ValidationError(DatabaseError):
    """Data validation error with specific field information"""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Optional[Any] = None
    ):
        details = {}
        if field:
            details["field"] = field
        if value is not None:
            details["invalid_value"] = str(value)

        super().__init__(message, "DB-400", details)


class NotFoundError(DatabaseError):
    """Resource not found error"""

    def __init__(
        self,
        resource_type: str,
        resource_id: Optional[str] = None
    ):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" (ID: {resource_id})"

        details = {"resource_type": resource_type}
        if resource_id:
            details["resource_id"] = resource_id

        super().__init__(message, "DB-404", details)


class ConflictError(DatabaseError):
    """Conflict with existing data"""

    def __init__(
        self,
        message: str,
        conflicting_field: Optional[str] = None
    ):
        details = {}
        if conflicting_field:
            details["conflicting_field"] = conflicting_field

        super().__init__(message, "DB-409", details)


class UnauthorizedError(DatabaseError):
    """Unauthorized access to resource"""

    def __init__(
        self,
        resource_type: str,
        action: str,
        user_id: Optional[str] = None
    ):
        message = f"Unauthorized {action} access to {resource_type}"

        details = {
            "resource_type": resource_type,
            "action": action
        }
        if user_id:
            details["user_id"] = user_id

        super().__init__(message, "DB-403", details)


class ConnectionError(DatabaseError):
    """Database connection error"""

    def __init__(self, message: str = "Database connection failed"):
        super().__init__(message, "DB-503")


class TransactionError(DatabaseError):
    """Transaction-related error"""

    def __init__(
        self,
        message: str,
        transaction_id: Optional[str] = None
    ):
        details = {}
        if transaction_id:
            details["transaction_id"] = transaction_id

        super().__init__(message, "DB-500", details)


class QueryError(DatabaseError):
    """SQL query execution error"""

    def __init__(
        self,
        message: str,
        query: Optional[str] = None,
        params: Optional[list] = None
    ):
        details = {}
        if query:
            # Truncate query for security (don't log full queries)
            details["query_preview"] = query[:100] + "..." if len(query) > 100 else query
        if params:
            details["param_count"] = len(params)

        super().__init__(message, "DB-500", details)


class IntegrityError(DatabaseError):
    """Database integrity constraint violation"""

    def __init__(
        self,
        message: str,
        constraint: Optional[str] = None
    ):
        details = {}
        if constraint:
            details["constraint"] = constraint

        super().__init__(message, "DB-409", details)


# Export all exception classes
__all__ = [
    'DatabaseError',
    'ValidationError',
    'NotFoundError',
    'ConflictError',
    'UnauthorizedError',
    'ConnectionError',
    'TransactionError',
    'QueryError',
    'IntegrityError'
]