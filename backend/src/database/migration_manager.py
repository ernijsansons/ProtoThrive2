"""
Production-ready migration system for Cloudflare D1
Ref: CLAUDE.md - Secure Database Implementation

Handles schema versioning, rollbacks, and data migration with comprehensive logging.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any, Dict, List, Optional

import structlog

from .exceptions import DatabaseError, ValidationError

logger = structlog.get_logger()


class MigrationManager:
    """
    Manages database schema migrations with versioning and rollback support

    Features:
    - Version-controlled schema changes
    - Automatic rollback capabilities
    - Migration integrity verification
    - Comprehensive logging and error handling
    - Production-safe migration execution
    """

    def __init__(self, env: Dict[str, Any]):
        """
        Initialize migration manager

        Args:
            env: Environment containing database bindings
        """
        self.env = env
        self.logger = logger.bind(component="migration_manager")

        if not self.env.get("DB"):
            raise DatabaseError("Database not configured in environment")

    async def initialize_migration_table(self) -> None:
        """
        Create migration tracking table if it doesn't exist

        This table tracks which migrations have been applied and provides
        rollback information for each migration.
        """
        migration_table_sql = """
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            rollback_sql TEXT,
            checksum TEXT NOT NULL,
            execution_time_ms INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_migrations_version ON _migrations(version);
        CREATE INDEX IF NOT EXISTS idx_migrations_applied_at ON _migrations(applied_at);
        """

        try:
            await self.env["DB"].exec(migration_table_sql)
            self.logger.info("migration_table_initialized")
        except Exception as e:
            self.logger.error("migration_table_init_failed", error=str(e))
            raise DatabaseError(f"Failed to initialize migration table: {str(e)}")

    async def get_applied_migrations(self) -> List[str]:
        """
        Get list of applied migration versions in chronological order

        Returns:
            List of migration versions that have been applied
        """
        try:
            stmt = self.env["DB"].prepare(
                "SELECT version FROM _migrations ORDER BY applied_at"
            )
            results = await stmt.all()
            return [row["version"] for row in results]

        except Exception as e:
            # Table might not exist yet
            self.logger.info("migration_table_not_found", error=str(e))
            await self.initialize_migration_table()
            return []

    async def get_migration_info(self, version: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific migration

        Args:
            version: Migration version to get info for

        Returns:
            Migration information dict or None if not found
        """
        try:
            stmt = self.env["DB"].prepare(
                "SELECT * FROM _migrations WHERE version = ?"
            )
            result = await stmt.bind(version).first()

            if result:
                return dict(result)
            return None

        except Exception as e:
            self.logger.error("get_migration_info_failed", version=version, error=str(e))
            raise DatabaseError(f"Failed to get migration info: {str(e)}")

    async def apply_migration(
        self,
        version: str,
        name: str,
        up_sql: str,
        down_sql: Optional[str] = None
    ) -> bool:
        """
        Apply a single migration with comprehensive error handling

        Args:
            version: Unique migration version identifier
            name: Human-readable migration name
            up_sql: SQL to execute for migration
            down_sql: SQL to execute for rollback (optional)

        Returns:
            True if migration applied successfully

        Raises:
            DatabaseError: If migration fails
            ValidationError: If migration parameters are invalid
        """
        # Validate inputs
        if not version or not name or not up_sql:
            raise ValidationError("Migration version, name, and up_sql are required")

        if not isinstance(version, str) or len(version) > 50:
            raise ValidationError("Migration version must be a string (max 50 chars)")

        start_time = datetime.utcnow()

        try:
            self.logger.info(
                "applying_migration",
                version=version,
                name=name,
                sql_length=len(up_sql)
            )

            # Check if migration already applied
            existing = await self.get_migration_info(version)
            if existing:
                self.logger.warning("migration_already_applied", version=version)
                return True

            # Calculate checksum for integrity verification
            checksum = self._calculate_checksum(up_sql)

            # Execute migration SQL
            await self.env["DB"].exec(up_sql)

            # Calculate execution time
            execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            # Record migration in tracking table
            record_sql = """
            INSERT INTO _migrations (version, name, rollback_sql, checksum, execution_time_ms)
            VALUES (?, ?, ?, ?, ?)
            """

            stmt = self.env["DB"].prepare(record_sql)
            await stmt.bind(version, name, down_sql, checksum, execution_time_ms).run()

            self.logger.info(
                "migration_applied",
                version=version,
                name=name,
                execution_time_ms=execution_time_ms
            )

            return True

        except Exception as e:
            execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            self.logger.error(
                "migration_failed",
                version=version,
                name=name,
                error=str(e),
                execution_time_ms=execution_time_ms
            )

            raise DatabaseError(f"Migration {version} failed: {str(e)}")

    async def rollback_migration(self, version: str) -> bool:
        """
        Rollback a specific migration using stored rollback SQL

        Args:
            version: Version of migration to rollback

        Returns:
            True if rollback successful

        Raises:
            DatabaseError: If rollback fails
            ValidationError: If rollback SQL not available
        """
        try:
            # Get migration info
            migration_info = await self.get_migration_info(version)
            if not migration_info:
                raise ValidationError(f"Migration {version} not found")

            rollback_sql = migration_info.get("rollback_sql")
            if not rollback_sql:
                raise ValidationError(f"No rollback SQL available for migration {version}")

            start_time = datetime.utcnow()

            self.logger.info("rolling_back_migration", version=version)

            # Execute rollback SQL
            await self.env["DB"].exec(rollback_sql)

            # Remove migration record
            delete_stmt = self.env["DB"].prepare(
                "DELETE FROM _migrations WHERE version = ?"
            )
            await delete_stmt.bind(version).run()

            execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

            self.logger.info(
                "migration_rolled_back",
                version=version,
                execution_time_ms=execution_time_ms
            )

            return True

        except Exception as e:
            self.logger.error("rollback_failed", version=version, error=str(e))
            raise DatabaseError(f"Rollback of migration {version} failed: {str(e)}")

    async def run_migrations(self, migrations: List[Dict[str, str]]) -> int:
        """
        Run multiple migrations in order with comprehensive error handling

        Args:
            migrations: List of migration dictionaries with version, name, up_sql, down_sql

        Returns:
            Number of migrations applied

        Raises:
            DatabaseError: If any migration fails
        """
        if not migrations:
            self.logger.info("no_migrations_to_run")
            return 0

        # Validate migration format
        for migration in migrations:
            required_fields = ["version", "name", "up_sql"]
            for field in required_fields:
                if field not in migration:
                    raise ValidationError(f"Migration missing required field: {field}")

        applied_migrations = await self.get_applied_migrations()
        applied_count = 0
        total_start_time = datetime.utcnow()

        try:
            for migration in migrations:
                version = migration["version"]

                if version not in applied_migrations:
                    await self.apply_migration(
                        version=version,
                        name=migration["name"],
                        up_sql=migration["up_sql"],
                        down_sql=migration.get("down_sql")
                    )
                    applied_count += 1
                else:
                    self.logger.debug("migration_already_applied", version=version)

            total_time_ms = int((datetime.utcnow() - total_start_time).total_seconds() * 1000)

            self.logger.info(
                "migrations_completed",
                total_migrations=len(migrations),
                applied_count=applied_count,
                total_time_ms=total_time_ms
            )

            return applied_count

        except Exception as e:
            self.logger.error(
                "migrations_batch_failed",
                applied_count=applied_count,
                total_migrations=len(migrations),
                error=str(e)
            )
            raise

    async def verify_migrations(self, migrations: List[Dict[str, str]]) -> Dict[str, Any]:
        """
        Verify integrity of applied migrations by checking checksums

        Args:
            migrations: List of migration definitions

        Returns:
            Verification results with any discrepancies found
        """
        verification_results = {
            "verified_count": 0,
            "discrepancies": [],
            "missing_migrations": [],
            "extra_migrations": []
        }

        try:
            applied_migrations = await self.get_applied_migrations()

            # Create lookup for migration definitions
            migration_lookup = {m["version"]: m for m in migrations}

            # Check each applied migration
            for version in applied_migrations:
                migration_info = await self.get_migration_info(version)
                if not migration_info:
                    verification_results["discrepancies"].append({
                        "version": version,
                        "issue": "Missing migration info"
                    })
                    continue

                if version in migration_lookup:
                    # Verify checksum
                    expected_checksum = self._calculate_checksum(
                        migration_lookup[version]["up_sql"]
                    )
                    actual_checksum = migration_info["checksum"]

                    if expected_checksum != actual_checksum:
                        verification_results["discrepancies"].append({
                            "version": version,
                            "issue": "Checksum mismatch",
                            "expected": expected_checksum,
                            "actual": actual_checksum
                        })
                    else:
                        verification_results["verified_count"] += 1
                else:
                    verification_results["extra_migrations"].append(version)

            # Check for missing migrations
            for migration in migrations:
                version = migration["version"]
                if version not in applied_migrations:
                    verification_results["missing_migrations"].append(version)

            self.logger.info(
                "migrations_verified",
                results=verification_results
            )

            return verification_results

        except Exception as e:
            self.logger.error("migration_verification_failed", error=str(e))
            raise DatabaseError(f"Migration verification failed: {str(e)}")

    async def get_migration_status(self) -> Dict[str, Any]:
        """
        Get comprehensive migration status information

        Returns:
            Dictionary with migration status details
        """
        try:
            applied_migrations = await self.get_applied_migrations()

            # Get detailed info for each migration
            migration_details = []
            for version in applied_migrations:
                info = await self.get_migration_info(version)
                if info:
                    migration_details.append({
                        "version": version,
                        "name": info["name"],
                        "applied_at": info["applied_at"],
                        "execution_time_ms": info.get("execution_time_ms", 0),
                        "has_rollback": bool(info.get("rollback_sql"))
                    })

            status = {
                "total_applied": len(applied_migrations),
                "migrations": migration_details,
                "last_applied": migration_details[-1] if migration_details else None
            }

            return status

        except Exception as e:
            self.logger.error("get_migration_status_failed", error=str(e))
            raise DatabaseError(f"Failed to get migration status: {str(e)}")

    def _calculate_checksum(self, sql: str) -> str:
        """
        Calculate SHA-256 checksum for migration verification

        Args:
            sql: SQL content to checksum

        Returns:
            Hexadecimal checksum string (first 16 characters)
        """
        return hashlib.sha256(sql.encode('utf-8')).hexdigest()[:16]


# Production migration definitions
PRODUCTION_MIGRATIONS = [
    {
        "version": "001",
        "name": "Initial schema with security enhancements",
        "up_sql": """
        -- Enable foreign key constraints for data integrity
        PRAGMA foreign_keys = ON;

        -- Users table with comprehensive security and audit features
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            email TEXT NOT NULL UNIQUE,
            role TEXT CHECK (role IN ('vibe_coder', 'engineer', 'exec', 'admin')) NOT NULL DEFAULT 'vibe_coder',
            enterprise_id TEXT NULL,
            auth_provider TEXT DEFAULT 'local',
            last_login TIMESTAMP NULL,
            settings TEXT DEFAULT '{}' CHECK (json_valid(settings)),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL
        );

        -- Security and performance indexes for users
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_enterprise ON users(enterprise_id) WHERE enterprise_id IS NOT NULL;
        CREATE INDEX IF NOT EXISTS idx_users_active ON users(deleted_at) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

        -- Roadmaps table with enhanced validation and security
        CREATE TABLE IF NOT EXISTS roadmaps (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            user_id TEXT NOT NULL,
            json_graph TEXT NOT NULL CHECK(json_valid(json_graph)),
            status TEXT CHECK (status IN ('draft', 'active', 'completed', 'archived')) NOT NULL DEFAULT 'draft',
            vibe_mode INTEGER NOT NULL DEFAULT 0 CHECK(vibe_mode IN (0, 1)),
            thrive_score REAL NOT NULL DEFAULT 0.0 CHECK(thrive_score >= 0.0 AND thrive_score <= 1.0),
            title TEXT DEFAULT 'Untitled Roadmap' CHECK(length(title) <= 255),
            description TEXT CHECK(length(description) <= 10000),
            tags TEXT DEFAULT '[]' CHECK(json_valid(tags)),
            shared_with TEXT DEFAULT '[]' CHECK(json_valid(shared_with)),
            visibility TEXT CHECK (visibility IN ('private', 'team', 'public')) DEFAULT 'private',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Performance indexes for roadmaps
        CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON roadmaps(user_id);
        CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON roadmaps(status);
        CREATE INDEX IF NOT EXISTS idx_roadmaps_updated_at ON roadmaps(updated_at);
        CREATE INDEX IF NOT EXISTS idx_roadmaps_composite ON roadmaps(user_id, status, updated_at);
        CREATE INDEX IF NOT EXISTS idx_roadmaps_active ON roadmaps(deleted_at) WHERE deleted_at IS NULL;
        CREATE INDEX IF NOT EXISTS idx_roadmaps_visibility ON roadmaps(visibility);

        -- Snippets table for code templates with versioning
        CREATE TABLE IF NOT EXISTS snippets (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            category TEXT NOT NULL,
            code TEXT NOT NULL CHECK(length(code) <= 100000),
            ui_preview_url TEXT,
            version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
            title TEXT CHECK(length(title) <= 255),
            description TEXT CHECK(length(description) <= 5000),
            tags TEXT DEFAULT '[]' CHECK(json_valid(tags)),
            language TEXT DEFAULT 'javascript',
            created_by TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        -- Indexes for snippets
        CREATE INDEX IF NOT EXISTS idx_snippets_category ON snippets(category);
        CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
        CREATE INDEX IF NOT EXISTS idx_snippets_created_by ON snippets(created_by);

        -- Agent logs table for tracking AI operations
        CREATE TABLE IF NOT EXISTS agent_logs (
            id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
            roadmap_id TEXT NOT NULL,
            task_type TEXT NOT NULL,
            output TEXT NOT NULL,
            status TEXT CHECK (status IN ('success', 'fail', 'timeout', 'escalated', 'retry')) NOT NULL,
            model_used TEXT NOT NULL,
            token_count INTEGER NOT NULL DEFAULT 0,
            cost_usd REAL DEFAULT 0.0,
            duration_ms INTEGER DEFAULT 0,
            error_code TEXT,
            metadata TEXT DEFAULT '{}' CHECK(json_valid(metadata)),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
        );

        -- Indexes for agent logs
        CREATE INDEX IF NOT EXISTS idx_agent_logs_roadmap_id ON agent_logs(roadmap_id);
        CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);
        CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_agent_logs_model ON agent_logs(model_used);

        -- Update triggers for automatic timestamp management
        CREATE TRIGGER IF NOT EXISTS update_users_updated_at
        AFTER UPDATE ON users
        FOR EACH ROW
        BEGIN
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS update_roadmaps_updated_at
        AFTER UPDATE ON roadmaps
        FOR EACH ROW
        BEGIN
            UPDATE roadmaps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

        CREATE TRIGGER IF NOT EXISTS update_snippets_updated_at
        AFTER UPDATE ON snippets
        FOR EACH ROW
        BEGIN
            UPDATE snippets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

        -- Console log for migration success
        SELECT 'Thermonuclear Migration 001: Initial schema applied successfully - 0 Errors' as status;
        """,
        "down_sql": """
        -- Drop triggers
        DROP TRIGGER IF EXISTS update_snippets_updated_at;
        DROP TRIGGER IF EXISTS update_roadmaps_updated_at;
        DROP TRIGGER IF EXISTS update_users_updated_at;

        -- Drop tables in reverse dependency order
        DROP TABLE IF EXISTS agent_logs;
        DROP TABLE IF EXISTS snippets;
        DROP TABLE IF EXISTS roadmaps;
        DROP TABLE IF EXISTS users;

        -- Disable foreign keys
        PRAGMA foreign_keys = OFF;
        """
    },
    {
        "version": "002",
        "name": "Add audit log table for compliance",
        "up_sql": """
        -- Audit logs for comprehensive compliance tracking
        CREATE TABLE IF NOT EXISTS _audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id TEXT NOT NULL,
            action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
            old_values TEXT CHECK(json_valid(old_values)),
            new_values TEXT CHECK(json_valid(new_values)),
            changed_by TEXT,
            ip_address TEXT,
            user_agent TEXT,
            changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
        );

        -- Indexes for audit log performance
        CREATE INDEX IF NOT EXISTS idx_audit_table_record ON _audit_log(table_name, record_id);
        CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON _audit_log(changed_at);
        CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON _audit_log(changed_by);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON _audit_log(action);

        -- Audit trigger for roadmap changes
        CREATE TRIGGER IF NOT EXISTS audit_roadmap_changes
        AFTER UPDATE ON roadmaps
        FOR EACH ROW
        BEGIN
            INSERT INTO _audit_log (table_name, record_id, action, old_values, new_values, changed_by)
            VALUES ('roadmaps', NEW.id, 'UPDATE',
                    json_object('status', OLD.status, 'thrive_score', OLD.thrive_score, 'title', OLD.title),
                    json_object('status', NEW.status, 'thrive_score', NEW.thrive_score, 'title', NEW.title),
                    NEW.user_id);
        END;

        SELECT 'Thermonuclear Migration 002: Audit log table created successfully' as status;
        """,
        "down_sql": """
        DROP TRIGGER IF EXISTS audit_roadmap_changes;
        DROP TABLE IF EXISTS _audit_log;
        """
    },
    {
        "version": "003",
        "name": "Add performance optimization indexes",
        "up_sql": """
        -- Additional performance indexes based on query patterns

        -- Composite index for roadmap filtering and sorting
        CREATE INDEX IF NOT EXISTS idx_roadmaps_user_status_updated ON roadmaps(user_id, status, updated_at DESC);

        -- Index for roadmap search by title
        CREATE INDEX IF NOT EXISTS idx_roadmaps_title ON roadmaps(title) WHERE deleted_at IS NULL;

        -- Index for agent logs performance analysis
        CREATE INDEX IF NOT EXISTS idx_agent_logs_model_timestamp ON agent_logs(model_used, timestamp DESC);

        -- Index for cost analysis
        CREATE INDEX IF NOT EXISTS idx_agent_logs_cost ON agent_logs(cost_usd, timestamp DESC) WHERE cost_usd > 0;

        SELECT 'Thermonuclear Migration 003: Performance indexes added successfully' as status;
        """,
        "down_sql": """
        DROP INDEX IF EXISTS idx_agent_logs_cost;
        DROP INDEX IF EXISTS idx_agent_logs_model_timestamp;
        DROP INDEX IF EXISTS idx_roadmaps_title;
        DROP INDEX IF EXISTS idx_roadmaps_user_status_updated;
        """
    }
]


# Export migration manager and migrations
__all__ = ['MigrationManager', 'PRODUCTION_MIGRATIONS']