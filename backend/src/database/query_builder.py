"""
Secure Query Builder for Cloudflare D1
Ref: CLAUDE.md - Secure Database Implementation

Prevents SQL injection while maintaining performance and compatibility
with Cloudflare Workers D1 environment.
"""
from __future__ import annotations

import json
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

import structlog

from .exceptions import DatabaseError, QueryError, ValidationError

logger = structlog.get_logger()


class SecureQueryBuilder:
    """SQL injection-safe query builder optimized for Cloudflare D1"""

    def __init__(self, env: Dict[str, Any]):
        """Initialize query builder with D1 environment"""
        self.env = env
        self.logger = logger.bind(component="query_builder")

        if not self.env.get("DB"):
            raise DatabaseError("Database not configured in environment")

    def _sanitize_identifier(self, identifier: str) -> str:
        """
        Sanitize SQL identifiers (table/column names)

        Args:
            identifier: Table or column name to sanitize

        Returns:
            Sanitized identifier

        Raises:
            ValidationError: If identifier format is invalid
        """
        if not isinstance(identifier, str):
            raise ValidationError("Identifier must be a string")

        # Only allow alphanumeric characters, underscores, and valid SQL names
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', identifier):
            raise ValidationError(f"Invalid identifier format: {identifier}")

        # Check against reserved SQL keywords
        reserved_keywords = {
            'select', 'insert', 'update', 'delete', 'drop', 'create', 'alter',
            'table', 'index', 'view', 'database', 'schema', 'function', 'procedure'
        }

        if identifier.lower() in reserved_keywords:
            raise ValidationError(f"Identifier cannot be a reserved keyword: {identifier}")

        return identifier

    def _format_value(self, value: Any) -> Any:
        """
        Format and validate value for SQL parameter binding

        Args:
            value: Value to format and validate

        Returns:
            Formatted value ready for parameter binding

        Raises:
            ValidationError: If value is invalid or too large
        """
        if value is None:
            return None
        elif isinstance(value, bool):
            return 1 if value else 0
        elif isinstance(value, (int, float)):
            # Validate numeric ranges to prevent overflow
            if isinstance(value, int) and (value < -2**63 or value > 2**63 - 1):
                raise ValidationError("Integer value out of range")
            if isinstance(value, float) and abs(value) > 1e308:
                raise ValidationError("Float value out of range")
            return value
        elif isinstance(value, str):
            # Validate string length to prevent memory issues
            if len(value) > 100000:  # 100KB limit
                raise ValidationError("String value too long (max 100KB)")
            return value
        elif isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, (dict, list)):
            # Convert to JSON and validate size
            json_str = json.dumps(value, separators=(',', ':'))
            if len(json_str) > 500000:  # 500KB limit for JSON
                raise ValidationError("JSON value too large (max 500KB)")
            return json_str
        else:
            # Convert other types to string with length validation
            str_value = str(value)
            if len(str_value) > 10000:
                raise ValidationError("Converted string value too long")
            return str_value

    async def select(
        self,
        table: str,
        columns: Optional[List[str]] = None,
        where: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute secure SELECT query

        Args:
            table: Table name to query
            columns: List of columns to select (defaults to all)
            where: WHERE clause conditions as dict
            order_by: Column name for ORDER BY
            limit: Maximum number of rows to return
            offset: Number of rows to skip

        Returns:
            List of result rows as dictionaries

        Raises:
            ValidationError: If parameters are invalid
            QueryError: If query execution fails
        """
        # Sanitize and validate inputs
        table = self._sanitize_identifier(table)

        # Build column list
        if columns:
            column_list = []
            for col in columns:
                column_list.append(self._sanitize_identifier(col))
            cols = ", ".join(column_list)
        else:
            cols = "*"

        # Build base query
        query = f"SELECT {cols} FROM {table}"
        params = []

        # Add WHERE clause with parameterized conditions
        if where:
            conditions = []
            for key, value in where.items():
                key = self._sanitize_identifier(key)
                if value is None:
                    conditions.append(f"{key} IS NULL")
                else:
                    conditions.append(f"{key} = ?")
                    params.append(self._format_value(value))

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

        # Add ORDER BY clause
        if order_by:
            order_by = self._sanitize_identifier(order_by)
            query += f" ORDER BY {order_by}"

        # Add LIMIT and OFFSET
        if limit is not None:
            if not isinstance(limit, int) or limit < 0 or limit > 10000:
                raise ValidationError("Limit must be integer between 0 and 10000")
            query += f" LIMIT {limit}"

            if offset is not None:
                if not isinstance(offset, int) or offset < 0:
                    raise ValidationError("Offset must be non-negative integer")
                query += f" OFFSET {offset}"

        return await self._execute_query(query, params)

    async def insert(
        self,
        table: str,
        data: Dict[str, Any],
        return_id: bool = True
    ) -> Optional[str]:
        """
        Execute secure INSERT query

        Args:
            table: Table name for insertion
            data: Data to insert as dict
            return_id: Whether to generate and return an ID

        Returns:
            Generated ID if return_id is True, None otherwise

        Raises:
            ValidationError: If data is invalid
            QueryError: If insertion fails
        """
        table = self._sanitize_identifier(table)

        if not data:
            raise ValidationError("Insert data cannot be empty")

        # Prepare columns and values
        columns = []
        placeholders = []
        params = []

        # Add ID if requested and not provided
        record_id = None
        if return_id and "id" not in data:
            record_id = str(uuid.uuid4())
            columns.append("id")
            placeholders.append("?")
            params.append(record_id)

        # Process data columns
        for key, value in data.items():
            columns.append(self._sanitize_identifier(key))
            placeholders.append("?")
            params.append(self._format_value(value))

        # Build and execute query
        query = f"""
        INSERT INTO {table} ({', '.join(columns)})
        VALUES ({', '.join(placeholders)})
        """

        await self._execute_query(query, params)
        return record_id if return_id else None

    async def update(
        self,
        table: str,
        data: Dict[str, Any],
        where: Dict[str, Any]
    ) -> int:
        """
        Execute secure UPDATE query

        Args:
            table: Table name to update
            data: Data to update as dict
            where: WHERE clause conditions as dict

        Returns:
            Number of affected rows

        Raises:
            ValidationError: If data is invalid
            QueryError: If update fails
        """
        table = self._sanitize_identifier(table)

        if not data:
            raise ValidationError("Update data cannot be empty")

        if not where:
            raise ValidationError("WHERE clause is required for UPDATE operations")

        # Build SET clause
        set_clauses = []
        params = []

        for key, value in data.items():
            key = self._sanitize_identifier(key)
            set_clauses.append(f"{key} = ?")
            params.append(self._format_value(value))

        # Build WHERE clause
        where_clauses = []
        for key, value in where.items():
            key = self._sanitize_identifier(key)
            if value is None:
                where_clauses.append(f"{key} IS NULL")
            else:
                where_clauses.append(f"{key} = ?")
                params.append(self._format_value(value))

        # Build and execute query
        query = f"""
        UPDATE {table}
        SET {', '.join(set_clauses)}
        WHERE {' AND '.join(where_clauses)}
        """

        result = await self._execute_query(query, params)

        # Extract affected row count from D1 response
        if isinstance(result, dict) and "meta" in result:
            return result["meta"].get("changes", 0)
        return 0

    async def delete(
        self,
        table: str,
        where: Dict[str, Any],
        soft_delete: bool = True
    ) -> int:
        """
        Execute secure DELETE query with soft delete option

        Args:
            table: Table name for deletion
            where: WHERE clause conditions as dict
            soft_delete: If True, performs soft delete by setting deleted_at

        Returns:
            Number of affected rows

        Raises:
            ValidationError: If parameters are invalid
            QueryError: If deletion fails
        """
        if not where:
            raise ValidationError("WHERE clause is required for DELETE operations")

        # Perform soft delete by updating deleted_at timestamp
        if soft_delete:
            return await self.update(
                table,
                {"deleted_at": datetime.utcnow()},
                where
            )

        # Perform hard delete
        table = self._sanitize_identifier(table)

        # Build WHERE clause
        where_clauses = []
        params = []

        for key, value in where.items():
            key = self._sanitize_identifier(key)
            if value is None:
                where_clauses.append(f"{key} IS NULL")
            else:
                where_clauses.append(f"{key} = ?")
                params.append(self._format_value(value))

        # Build and execute query
        query = f"DELETE FROM {table} WHERE {' AND '.join(where_clauses)}"

        result = await self._execute_query(query, params)

        # Extract affected row count from D1 response
        if isinstance(result, dict) and "meta" in result:
            return result["meta"].get("changes", 0)
        return 0

    async def _execute_query(
        self,
        query: str,
        params: Optional[List[Any]] = None
    ) -> Any:
        """
        Execute query with comprehensive logging and error handling

        Args:
            query: SQL query to execute
            params: Query parameters for binding

        Returns:
            Query results

        Raises:
            QueryError: If query execution fails
        """
        start_time = datetime.utcnow()
        params = params or []

        try:
            # Log query execution with truncated query for security
            query_preview = query[:200] + "..." if len(query) > 200 else query
            self.logger.info(
                "executing_query",
                query_preview=query_preview,
                param_count=len(params)
            )

            # Prepare and execute statement using D1 binding
            stmt = self.env["DB"].prepare(query)
            if params:
                stmt = stmt.bind(*params)

            # Execute based on query type
            if query.strip().upper().startswith(('SELECT', 'WITH')):
                result = await stmt.all()
            else:
                result = await stmt.run()

            # Log successful execution
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            if isinstance(result, list):
                row_count = len(result)
            elif isinstance(result, dict) and "meta" in result:
                row_count = result["meta"].get("changes", 0)
            else:
                row_count = 1

            self.logger.info(
                "query_executed",
                duration_ms=duration_ms,
                rows_affected=row_count
            )

            return result

        except Exception as e:
            # Log error with context but without exposing sensitive data
            duration_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

            self.logger.error(
                "query_failed",
                error=str(e),
                error_type=type(e).__name__,
                duration_ms=duration_ms,
                query_preview=query[:100] + "..." if len(query) > 100 else query
            )

            # Re-raise as QueryError with context
            raise QueryError(
                f"Query execution failed: {str(e)}",
                query=query,
                params=params
            )

    async def count(
        self,
        table: str,
        where: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Get count of rows matching conditions

        Args:
            table: Table name to count
            where: WHERE clause conditions as dict

        Returns:
            Number of matching rows
        """
        result = await self.select(
            table,
            columns=["COUNT(*) as count"],
            where=where
        )

        if result and len(result) > 0:
            return result[0].get("count", 0)
        return 0

    async def exists(
        self,
        table: str,
        where: Dict[str, Any]
    ) -> bool:
        """
        Check if any rows exist matching conditions

        Args:
            table: Table name to check
            where: WHERE clause conditions as dict

        Returns:
            True if matching rows exist, False otherwise
        """
        count = await self.count(table, where)
        return count > 0


# Export main class
__all__ = ['SecureQueryBuilder']