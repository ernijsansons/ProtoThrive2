"""
Secure Database Package
Ref: CLAUDE.md - Secure Database Implementation

Provides secure, production-ready database access layer with:
- SQL injection prevention
- Comprehensive validation
- Structured logging
- Performance monitoring
- Migration management
"""

from .exceptions import (
    DatabaseError,
    ValidationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ConnectionError,
    TransactionError,
    QueryError,
    IntegrityError
)

from .query_builder import SecureQueryBuilder
from .migration_manager import MigrationManager, PRODUCTION_MIGRATIONS
from .monitoring_integration import DatabaseMonitoringIntegration

__all__ = [
    # Exceptions
    'DatabaseError',
    'ValidationError',
    'NotFoundError',
    'ConflictError',
    'UnauthorizedError',
    'ConnectionError',
    'TransactionError',
    'QueryError',
    'IntegrityError',

    # Core components
    'SecureQueryBuilder',
    'MigrationManager',
    'DatabaseMonitoringIntegration',

    # Migration data
    'PRODUCTION_MIGRATIONS'
]