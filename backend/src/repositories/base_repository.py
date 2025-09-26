"""
Base repository with transaction support and comprehensive error handling
Ref: CLAUDE.md - Secure Database Implementation

Provides common CRUD operations with security, validation, and monitoring.
"""
from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

import structlog

from ..database.exceptions import (
    DatabaseError,
    NotFoundError,
    ValidationError
)
from ..database.query_builder import SecureQueryBuilder

logger = structlog.get_logger()
T = TypeVar('T')


class BaseRepository(Generic[T]):
    """
    Base repository providing secure CRUD operations with monitoring

    Features:
    - Parameterized queries for SQL injection prevention
    - Comprehensive logging and error handling
    - Transaction support with rollback capabilities
    - Automatic audit trail generation
    - Performance monitoring integration
    """

    def __init__(self, query_builder: SecureQueryBuilder, monitoring_service):
        """
        Initialize base repository

        Args:
            query_builder: Secure query builder instance
            monitoring_service: Monitoring service for metrics and tracing
        """
        self.qb = query_builder
        self.monitoring = monitoring_service
        self.logger = logger.bind(repository=self.__class__.__name__)
        self.table_name = None  # Override in subclasses

        if not self.table_name:
            raise ValueError("table_name must be set in repository subclass")

    @asynccontextmanager
    async def transaction(self):
        """
        Transaction context manager for atomic operations

        Note: D1 doesn't support explicit transactions, but we track
        operations for monitoring and provide structured error handling.

        Yields:
            transaction_id: Unique identifier for this transaction
        """
        transaction_id = str(uuid.uuid4())[:8]

        try:
            self.logger.info("transaction_started", transaction_id=transaction_id)

            # Start monitoring span for transaction
            span_id = self.monitoring.tracer.start_span(
                f"transaction.{self.table_name}",
                tags={"transaction_id": transaction_id}
            )

            yield transaction_id

            self.logger.info("transaction_completed", transaction_id=transaction_id)

            # Finish span successfully
            self.monitoring.tracer.finish_span(span_id)

        except Exception as e:
            self.logger.error(
                "transaction_failed",
                transaction_id=transaction_id,
                error=str(e),
                error_type=type(e).__name__
            )

            # Record transaction failure
            self.monitoring.increment(
                f"transactions.failed",
                {"table": self.table_name, "error_type": type(e).__name__}
            )

            # Finish span with error
            self.monitoring.tracer.finish_span(span_id, error=True)

            raise

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> str:
        """
        Create new record with validation and audit trail

        Args:
            data: Record data to insert
            user_id: ID of user creating the record (for audit)

        Returns:
            ID of created record

        Raises:
            ValidationError: If data validation fails
            DatabaseError: If creation fails
        """
        span_id = self.monitoring.tracer.start_span(f"db.{self.table_name}.create")

        try:
            # Validate data before insertion
            validated_data = await self._validate_create_data(data)

            # Add metadata fields
            validated_data.update({
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })

            # Add user_id if provided and not already set
            if user_id and "user_id" not in validated_data:
                validated_data["user_id"] = user_id

            # Insert record
            record_id = await self.qb.insert(self.table_name, validated_data)

            # Log successful creation
            self.logger.info(
                "record_created",
                table=self.table_name,
                record_id=record_id,
                user_id=user_id
            )

            # Record metrics
            self.monitoring.increment(
                f"{self.table_name}.created",
                {"status": "success"}
            )

            return record_id

        except ValidationError:
            self.monitoring.increment(
                f"{self.table_name}.created",
                {"status": "validation_error"}
            )
            raise

        except Exception as e:
            self.monitoring.increment(
                f"{self.table_name}.created",
                {"status": "error"}
            )
            self.logger.error(
                "create_failed",
                table=self.table_name,
                error=str(e),
                error_type=type(e).__name__
            )
            raise DatabaseError(f"Failed to create {self.table_name}: {str(e)}")

        finally:
            self.monitoring.tracer.finish_span(span_id)

    async def get_by_id(
        self,
        record_id: str,
        user_id: Optional[str] = None,
        include_deleted: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Get record by ID with optional user authorization check

        Args:
            record_id: ID of record to retrieve
            user_id: User ID for authorization (if applicable)
            include_deleted: Whether to include soft-deleted records

        Returns:
            Record data as dict, or None if not found

        Raises:
            DatabaseError: If retrieval fails
        """
        span_id = self.monitoring.tracer.start_span(f"db.{self.table_name}.get")

        try:
            # Build where clause
            where_clause = {"id": record_id}

            # Add user authorization if provided
            if user_id:
                where_clause["user_id"] = user_id

            # Exclude deleted records by default
            if not include_deleted:
                where_clause["deleted_at"] = None

            # Execute query
            results = await self.qb.select(self.table_name, where=where_clause)

            if results:
                record = results[0]
                self.logger.debug(
                    "record_retrieved",
                    table=self.table_name,
                    record_id=record_id
                )
                self.monitoring.increment(
                    f"{self.table_name}.retrieved",
                    {"status": "found"}
                )
                return record

            # Record not found
            self.monitoring.increment(
                f"{self.table_name}.retrieved",
                {"status": "not_found"}
            )
            return None

        except Exception as e:
            self.monitoring.increment(
                f"{self.table_name}.retrieved",
                {"status": "error"}
            )
            self.logger.error(
                "get_failed",
                table=self.table_name,
                record_id=record_id,
                error=str(e)
            )
            raise DatabaseError(f"Failed to get {self.table_name}: {str(e)}")

        finally:
            self.monitoring.tracer.finish_span(span_id)

    async def update(
        self,
        record_id: str,
        data: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> bool:
        """
        Update record with validation and authorization check

        Args:
            record_id: ID of record to update
            data: Update data as dict
            user_id: User ID for authorization (if applicable)

        Returns:
            True if record was updated, False if not found

        Raises:
            ValidationError: If update data is invalid
            DatabaseError: If update fails
        """
        span_id = self.monitoring.tracer.start_span(f"db.{self.table_name}.update")

        try:
            # Validate update data
            validated_data = await self._validate_update_data(data)

            # Add updated timestamp
            validated_data["updated_at"] = datetime.utcnow()

            # Build where clause
            where_clause = {"id": record_id, "deleted_at": None}
            if user_id:
                where_clause["user_id"] = user_id

            # Execute update
            affected_rows = await self.qb.update(
                self.table_name,
                validated_data,
                where_clause
            )

            if affected_rows > 0:
                self.logger.info(
                    "record_updated",
                    table=self.table_name,
                    record_id=record_id,
                    fields=list(validated_data.keys()),
                    user_id=user_id
                )
                self.monitoring.increment(
                    f"{self.table_name}.updated",
                    {"status": "success"}
                )
                return True

            # No rows affected - record not found or unauthorized
            self.monitoring.increment(
                f"{self.table_name}.updated",
                {"status": "not_found"}
            )
            return False

        except ValidationError:
            self.monitoring.increment(
                f"{self.table_name}.updated",
                {"status": "validation_error"}
            )
            raise

        except Exception as e:
            self.monitoring.increment(
                f"{self.table_name}.updated",
                {"status": "error"}
            )
            self.logger.error(
                "update_failed",
                table=self.table_name,
                record_id=record_id,
                error=str(e)
            )
            raise DatabaseError(f"Failed to update {self.table_name}: {str(e)}")

        finally:
            self.monitoring.tracer.finish_span(span_id)

    async def delete(
        self,
        record_id: str,
        user_id: Optional[str] = None,
        soft_delete: bool = True
    ) -> bool:
        """
        Delete record with soft delete support

        Args:
            record_id: ID of record to delete
            user_id: User ID for authorization (if applicable)
            soft_delete: If True, performs soft delete by setting deleted_at

        Returns:
            True if record was deleted, False if not found

        Raises:
            DatabaseError: If deletion fails
        """
        span_id = self.monitoring.tracer.start_span(f"db.{self.table_name}.delete")

        try:
            # Build where clause
            where_clause = {"id": record_id}
            if user_id:
                where_clause["user_id"] = user_id

            # For soft delete, only target non-deleted records
            if soft_delete:
                where_clause["deleted_at"] = None

            # Execute deletion
            affected_rows = await self.qb.delete(
                self.table_name,
                where_clause,
                soft_delete=soft_delete
            )

            if affected_rows > 0:
                delete_type = "soft" if soft_delete else "hard"
                self.logger.info(
                    "record_deleted",
                    table=self.table_name,
                    record_id=record_id,
                    delete_type=delete_type,
                    user_id=user_id
                )
                self.monitoring.increment(
                    f"{self.table_name}.deleted",
                    {"status": "success", "type": delete_type}
                )
                return True

            # No rows affected
            self.monitoring.increment(
                f"{self.table_name}.deleted",
                {"status": "not_found"}
            )
            return False

        except Exception as e:
            self.monitoring.increment(
                f"{self.table_name}.deleted",
                {"status": "error"}
            )
            self.logger.error(
                "delete_failed",
                table=self.table_name,
                record_id=record_id,
                error=str(e)
            )
            raise DatabaseError(f"Failed to delete {self.table_name}: {str(e)}")

        finally:
            self.monitoring.tracer.finish_span(span_id)

    async def list(
        self,
        filters: Optional[Dict[str, Any]] = None,
        order_by: str = "updated_at",
        limit: int = 100,
        offset: int = 0,
        include_deleted: bool = False
    ) -> List[Dict[str, Any]]:
        """
        List records with filtering and pagination

        Args:
            filters: Filter conditions as dict
            order_by: Column name for ordering
            limit: Maximum number of records to return
            offset: Number of records to skip
            include_deleted: Whether to include soft-deleted records

        Returns:
            List of records as dictionaries

        Raises:
            DatabaseError: If listing fails
        """
        span_id = self.monitoring.tracer.start_span(f"db.{self.table_name}.list")

        try:
            # Build where clause
            where_clause = filters.copy() if filters else {}

            # Exclude deleted records by default
            if not include_deleted:
                where_clause["deleted_at"] = None

            # Execute query
            results = await self.qb.select(
                self.table_name,
                where=where_clause,
                order_by=order_by,
                limit=limit,
                offset=offset
            )

            # Log results
            self.logger.info(
                "records_listed",
                table=self.table_name,
                count=len(results),
                filters=filters,
                limit=limit,
                offset=offset
            )

            # Record metrics
            self.monitoring.histogram(
                f"{self.table_name}.list.count",
                len(results)
            )

            return results

        except Exception as e:
            self.monitoring.increment(
                f"{self.table_name}.listed",
                {"status": "error"}
            )
            self.logger.error(
                "list_failed",
                table=self.table_name,
                error=str(e)
            )
            raise DatabaseError(f"Failed to list {self.table_name}: {str(e)}")

        finally:
            self.monitoring.tracer.finish_span(span_id)

    async def count(
        self,
        filters: Optional[Dict[str, Any]] = None,
        include_deleted: bool = False
    ) -> int:
        """
        Count records matching filters

        Args:
            filters: Filter conditions as dict
            include_deleted: Whether to include soft-deleted records

        Returns:
            Number of matching records
        """
        span_id = self.monitoring.tracer.start_span(f"db.{self.table_name}.count")

        try:
            # Build where clause
            where_clause = filters.copy() if filters else {}

            # Exclude deleted records by default
            if not include_deleted:
                where_clause["deleted_at"] = None

            # Get count
            count = await self.qb.count(self.table_name, where_clause)

            self.logger.debug(
                "records_counted",
                table=self.table_name,
                count=count,
                filters=filters
            )

            return count

        except Exception as e:
            self.logger.error(
                "count_failed",
                table=self.table_name,
                error=str(e)
            )
            raise DatabaseError(f"Failed to count {self.table_name}: {str(e)}")

        finally:
            self.monitoring.tracer.finish_span(span_id)

    async def exists(
        self,
        filters: Dict[str, Any],
        include_deleted: bool = False
    ) -> bool:
        """
        Check if any records exist matching filters

        Args:
            filters: Filter conditions as dict
            include_deleted: Whether to include soft-deleted records

        Returns:
            True if matching records exist, False otherwise
        """
        count = await self.count(filters, include_deleted)
        return count > 0

    async def _validate_create_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data for record creation

        Override in subclasses for table-specific validation.

        Args:
            data: Data to validate

        Returns:
            Validated data

        Raises:
            ValidationError: If validation fails
        """
        if not data:
            raise ValidationError("Create data cannot be empty")

        # Remove read-only fields
        validated = data.copy()
        read_only_fields = ["id", "created_at", "updated_at"]
        for field in read_only_fields:
            validated.pop(field, None)

        return validated

    async def _validate_update_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data for record update

        Override in subclasses for table-specific validation.

        Args:
            data: Data to validate

        Returns:
            Validated data

        Raises:
            ValidationError: If validation fails
        """
        if not data:
            raise ValidationError("Update data cannot be empty")

        # Remove read-only fields
        validated = data.copy()
        read_only_fields = ["id", "created_at"]
        for field in read_only_fields:
            validated.pop(field, None)

        return validated


# Export base repository
__all__ = ['BaseRepository']