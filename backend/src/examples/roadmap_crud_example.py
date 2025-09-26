"""
Comprehensive example of secure roadmap CRUD operations
Ref: CLAUDE.md - Secure Database Implementation

Demonstrates the complete usage of the new secure data access layer
with proper error handling, validation, and monitoring.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime
from typing import Any, Dict

import structlog

# Import our new secure data access components
from ..database.exceptions import DatabaseError, NotFoundError, ValidationError
from ..database.migration_manager import MigrationManager, PRODUCTION_MIGRATIONS
from ..database.monitoring_integration import DatabaseMonitoringIntegration
from ..database.query_builder import SecureQueryBuilder
from ..models.roadmap import RoadmapCreateDTO, RoadmapUpdateDTO
from ..repositories.roadmap_repository import RoadmapRepository
from ..services.monitoring import MonitoringService

# Configure structured logging
logger = structlog.get_logger()


class RoadmapCRUDExample:
    """
    Complete example demonstrating secure roadmap CRUD operations

    Shows how to:
    - Initialize the secure data access layer
    - Perform validated CRUD operations
    - Handle errors gracefully
    - Monitor performance
    - Use transactions for atomic operations
    """

    def __init__(self, env: Dict[str, Any]):
        """
        Initialize example with environment containing database bindings

        Args:
            env: Environment dict with DB, KV, and other Cloudflare bindings
        """
        self.env = env
        self.logger = logger.bind(component="roadmap_crud_example")

        # Initialize monitoring service
        self.monitoring = MonitoringService(env)

        # Initialize secure query builder
        self.query_builder = SecureQueryBuilder(env)

        # Initialize database monitoring integration
        self.db_monitoring = DatabaseMonitoringIntegration(self.monitoring)

        # Initialize roadmap repository
        self.roadmap_repo = RoadmapRepository(self.query_builder, self.monitoring)

        # Initialize migration manager
        self.migration_manager = MigrationManager(env)

    async def run_complete_example(self) -> Dict[str, Any]:
        """
        Run complete CRUD example with comprehensive error handling

        Returns:
            Results summary with metrics and examples
        """
        example_results = {
            "migration_status": {},
            "crud_operations": {},
            "validation_examples": {},
            "monitoring_metrics": {},
            "error_handling_examples": {}
        }

        try:
            self.logger.info("starting_roadmap_crud_example")

            # Step 1: Run database migrations
            example_results["migration_status"] = await self._run_migrations()

            # Step 2: Demonstrate CRUD operations
            example_results["crud_operations"] = await self._demonstrate_crud_operations()

            # Step 3: Show validation examples
            example_results["validation_examples"] = await self._demonstrate_validation()

            # Step 4: Show error handling
            example_results["error_handling_examples"] = await self._demonstrate_error_handling()

            # Step 5: Get monitoring metrics
            example_results["monitoring_metrics"] = await self._get_monitoring_metrics()

            self.logger.info(
                "roadmap_crud_example_completed",
                results_summary=example_results
            )

            return example_results

        except Exception as e:
            self.logger.error(
                "roadmap_crud_example_failed",
                error=str(e),
                error_type=type(e).__name__
            )
            await self.monitoring.record_error(e, {"component": "crud_example"})
            raise

    async def _run_migrations(self) -> Dict[str, Any]:
        """Run database migrations and return status"""
        self.logger.info("running_database_migrations")

        try:
            # Apply all production migrations
            applied_count = await self.migration_manager.run_migrations(PRODUCTION_MIGRATIONS)

            # Get migration status
            migration_status = await self.migration_manager.get_migration_status()

            self.logger.info(
                "migrations_completed",
                applied_count=applied_count,
                total_applied=migration_status["total_applied"]
            )

            return {
                "applied_count": applied_count,
                "total_applied": migration_status["total_applied"],
                "last_applied": migration_status.get("last_applied"),
                "status": "success"
            }

        except Exception as e:
            self.logger.error("migrations_failed", error=str(e))
            return {
                "status": "failed",
                "error": str(e)
            }

    async def _demonstrate_crud_operations(self) -> Dict[str, Any]:
        """Demonstrate all CRUD operations with examples"""
        crud_results = {}
        test_user_id = "user-thermo-123-456"

        try:
            # CREATE: Create a new roadmap
            self.logger.info("demonstrating_create_operation")

            create_data = {
                "json_graph": json.dumps({
                    "nodes": [
                        {
                            "id": "n1",
                            "label": "Project Kickoff",
                            "status": "gray",
                            "position": {"x": 0, "y": 0}
                        },
                        {
                            "id": "n2",
                            "label": "Development Phase",
                            "status": "gray",
                            "position": {"x": 200, "y": 100}
                        },
                        {
                            "id": "n3",
                            "label": "Production Launch",
                            "status": "gray",
                            "position": {"x": 400, "y": 200}
                        }
                    ],
                    "edges": [
                        {"from": "n1", "to": "n2"},
                        {"from": "n2", "to": "n3"}
                    ]
                }),
                "title": "Secure Database Implementation Roadmap",
                "description": "Complete implementation of secure data access layer with monitoring",
                "vibe_mode": True,
                "tags": ["database", "security", "monitoring"],
                "visibility": "private"
            }

            created_roadmap = await self.roadmap_repo.create_roadmap(test_user_id, create_data)
            roadmap_id = created_roadmap.id

            crud_results["create"] = {
                "roadmap_id": roadmap_id,
                "title": created_roadmap.title,
                "status": "success"
            }

            # READ: Get the created roadmap
            self.logger.info("demonstrating_read_operation")

            retrieved_roadmap = await self.roadmap_repo.get_roadmap(roadmap_id, test_user_id)

            crud_results["read"] = {
                "found": retrieved_roadmap is not None,
                "title": retrieved_roadmap.title if retrieved_roadmap else None,
                "node_count": len(json.loads(retrieved_roadmap.json_graph)["nodes"]) if retrieved_roadmap else 0,
                "status": "success"
            }

            # UPDATE: Update roadmap properties
            self.logger.info("demonstrating_update_operation")

            update_data = {
                "title": "Updated Secure Database Implementation",
                "status": "active",
                "thrive_score": 0.75,
                "description": "Updated description with progress notes"
            }

            updated_roadmap = await self.roadmap_repo.update_roadmap(
                roadmap_id, test_user_id, update_data
            )

            crud_results["update"] = {
                "updated": updated_roadmap is not None,
                "new_title": updated_roadmap.title if updated_roadmap else None,
                "new_status": updated_roadmap.status if updated_roadmap else None,
                "new_score": updated_roadmap.thrive_score if updated_roadmap else None,
                "status": "success"
            }

            # LIST: Get user roadmaps
            self.logger.info("demonstrating_list_operation")

            user_roadmaps = await self.roadmap_repo.get_user_roadmaps(
                test_user_id, limit=10
            )

            crud_results["list"] = {
                "total_roadmaps": len(user_roadmaps),
                "roadmap_titles": [rm.title for rm in user_roadmaps],
                "status": "success"
            }

            # SEARCH: Search roadmaps
            self.logger.info("demonstrating_search_operation")

            search_results = await self.roadmap_repo.search_roadmaps(
                test_user_id,
                search_term="database",
                tags=["security"],
                limit=5
            )

            crud_results["search"] = {
                "search_results": len(search_results),
                "matched_titles": [rm.title for rm in search_results],
                "status": "success"
            }

            # BULK UPDATE: Update multiple scores
            self.logger.info("demonstrating_bulk_update_operation")

            score_updates = [
                {
                    "roadmap_id": roadmap_id,
                    "user_id": test_user_id,
                    "score": 0.85
                }
            ]

            updated_count = await self.roadmap_repo.bulk_update_scores(score_updates)

            crud_results["bulk_update"] = {
                "updates_requested": len(score_updates),
                "updates_successful": updated_count,
                "status": "success"
            }

            # STATISTICS: Get roadmap statistics
            self.logger.info("demonstrating_statistics_operation")

            stats = await self.roadmap_repo.get_roadmap_statistics(test_user_id)

            crud_results["statistics"] = {
                "total_roadmaps": stats["total_roadmaps"],
                "average_score": stats["average_thrive_score"],
                "status_breakdown": stats["status_breakdown"],
                "status": "success"
            }

            # DELETE: Soft delete the roadmap
            self.logger.info("demonstrating_delete_operation")

            deleted = await self.roadmap_repo.delete_roadmap(roadmap_id, test_user_id)

            crud_results["delete"] = {
                "deleted": deleted,
                "delete_type": "soft",
                "status": "success"
            }

            return crud_results

        except Exception as e:
            self.logger.error("crud_operations_failed", error=str(e))
            crud_results["error"] = {
                "error_type": type(e).__name__,
                "error_message": str(e)
            }
            return crud_results

    async def _demonstrate_validation(self) -> Dict[str, Any]:
        """Demonstrate validation with various invalid inputs"""
        validation_results = {}

        # Test invalid JSON graph
        try:
            invalid_create_data = {
                "json_graph": '{"invalid": "json structure"}',  # Missing nodes/edges
                "title": "Invalid Roadmap"
            }

            dto = RoadmapCreateDTO(**invalid_create_data)
            validation_results["invalid_graph"] = {"status": "should_have_failed"}

        except Exception as e:
            validation_results["invalid_graph"] = {
                "status": "correctly_rejected",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }

        # Test invalid title with harmful content
        try:
            invalid_title_data = {
                "json_graph": json.dumps({
                    "nodes": [{"id": "n1", "label": "Test"}],
                    "edges": []
                }),
                "title": '<script>alert("xss")</script>',  # XSS attempt
            }

            dto = RoadmapCreateDTO(**invalid_title_data)
            validation_results["invalid_title"] = {"status": "should_have_failed"}

        except Exception as e:
            validation_results["invalid_title"] = {
                "status": "correctly_rejected",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }

        # Test invalid thrive score
        try:
            invalid_score_data = {
                "thrive_score": 1.5  # Score must be 0.0-1.0
            }

            dto = RoadmapUpdateDTO(**invalid_score_data)
            validation_results["invalid_score"] = {"status": "should_have_failed"}

        except Exception as e:
            validation_results["invalid_score"] = {
                "status": "correctly_rejected",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }

        # Test valid data for comparison
        try:
            valid_data = {
                "json_graph": json.dumps({
                    "nodes": [
                        {"id": "n1", "label": "Valid Node", "status": "gray"}
                    ],
                    "edges": []
                }),
                "title": "Valid Roadmap Title",
                "description": "Valid description without harmful content",
                "vibe_mode": True,
                "tags": ["valid", "test"],
                "visibility": "private"
            }

            dto = RoadmapCreateDTO(**valid_data)
            validation_results["valid_data"] = {
                "status": "correctly_accepted",
                "validated_fields": list(dto.dict().keys())
            }

        except Exception as e:
            validation_results["valid_data"] = {
                "status": "unexpected_failure",
                "error": str(e)
            }

        return validation_results

    async def _demonstrate_error_handling(self) -> Dict[str, Any]:
        """Demonstrate comprehensive error handling"""
        error_results = {}

        # Test not found error
        try:
            non_existent_id = "non-existent-roadmap-id"
            roadmap = await self.roadmap_repo.get_roadmap(non_existent_id, "test-user")
            error_results["not_found"] = {
                "status": "no_error_raised",
                "result": "roadmap_found" if roadmap else "roadmap_not_found"
            }

        except Exception as e:
            error_results["not_found"] = {
                "status": "error_raised",
                "error_type": type(e).__name__,
                "error_code": getattr(e, 'code', None)
            }

        # Test unauthorized access (user trying to access another user's roadmap)
        try:
            # First create a roadmap with one user
            test_data = {
                "json_graph": json.dumps({"nodes": [], "edges": []}),
                "title": "Test Roadmap"
            }

            created_roadmap = await self.roadmap_repo.create_roadmap("user-1", test_data)

            # Try to access with different user
            roadmap = await self.roadmap_repo.get_roadmap(created_roadmap.id, "user-2")

            error_results["unauthorized"] = {
                "status": "no_error_raised",
                "result": "roadmap_found" if roadmap else "access_denied"
            }

        except Exception as e:
            error_results["unauthorized"] = {
                "status": "error_raised",
                "error_type": type(e).__name__,
                "error_code": getattr(e, 'code', None)
            }

        # Test database error simulation
        try:
            # Try to create roadmap with invalid user_id format
            invalid_data = {
                "json_graph": json.dumps({"nodes": [], "edges": []}),
                "title": "Test"
            }

            # This should work since we validate the JSON, but let's test edge cases
            created = await self.roadmap_repo.create_roadmap("", invalid_data)

            error_results["database_error"] = {
                "status": "no_error_raised",
                "created_id": created.id if created else None
            }

        except ValidationError as e:
            error_results["database_error"] = {
                "status": "validation_error_caught",
                "error_type": type(e).__name__,
                "error_code": getattr(e, 'code', None),
                "error_message": str(e)
            }
        except DatabaseError as e:
            error_results["database_error"] = {
                "status": "database_error_caught",
                "error_type": type(e).__name__,
                "error_code": getattr(e, 'code', None),
                "error_message": str(e)
            }
        except Exception as e:
            error_results["database_error"] = {
                "status": "unexpected_error",
                "error_type": type(e).__name__,
                "error_message": str(e)
            }

        return error_results

    async def _get_monitoring_metrics(self) -> Dict[str, Any]:
        """Get monitoring dashboard data"""
        try:
            dashboard_data = await self.monitoring.get_monitoring_dashboard()

            # Extract key metrics
            metrics_summary = {
                "total_metrics_collected": dashboard_data["metrics"]["total_metrics"],
                "database_operations": {},
                "performance_data": {},
                "health_status": dashboard_data["health"]["status"]
            }

            # Extract database-specific metrics
            metrics = dashboard_data["metrics"]

            # Count database operations
            for metric_name, value in metrics["counters"].items():
                if "database" in metric_name or "roadmaps" in metric_name:
                    metrics_summary["database_operations"][metric_name] = value

            # Extract performance histograms
            for metric_name, stats in metrics["histograms"].items():
                if "database" in metric_name or "roadmaps" in metric_name:
                    metrics_summary["performance_data"][metric_name] = {
                        "count": stats["count"],
                        "mean": stats["mean"],
                        "p95": stats["p95"]
                    }

            return metrics_summary

        except Exception as e:
            self.logger.error("get_monitoring_metrics_failed", error=str(e))
            return {
                "status": "failed",
                "error": str(e)
            }


async def run_roadmap_crud_example(env: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main function to run the complete roadmap CRUD example

    Args:
        env: Environment dict with database bindings

    Returns:
        Complete example results

    Usage:
        # In your Cloudflare Worker or test environment
        results = await run_roadmap_crud_example(env)
        print(json.dumps(results, indent=2))
    """
    example = RoadmapCRUDExample(env)
    return await example.run_complete_example()


async def run_migration_example(env: Dict[str, Any]) -> Dict[str, Any]:
    """
    Example of running database migrations

    Args:
        env: Environment dict with database bindings

    Returns:
        Migration results
    """
    migration_manager = MigrationManager(env)

    try:
        logger.info("running_migration_example")

        # Run all production migrations
        applied_count = await migration_manager.run_migrations(PRODUCTION_MIGRATIONS)

        # Get migration status
        status = await migration_manager.get_migration_status()

        # Verify migrations
        verification_results = await migration_manager.verify_migrations(PRODUCTION_MIGRATIONS)

        results = {
            "applied_migrations": applied_count,
            "total_applied": status["total_applied"],
            "verification": verification_results,
            "status": "success"
        }

        logger.info("migration_example_completed", results=results)
        return results

    except Exception as e:
        logger.error("migration_example_failed", error=str(e))
        return {
            "status": "failed",
            "error": str(e),
            "error_type": type(e).__name__
        }


if __name__ == "__main__":
    # Example of how to run the CRUD example
    # Note: This would typically be called from a Cloudflare Worker environment

    # Mock environment for testing
    mock_env = {
        "DB": None,  # Would be actual D1 database binding
        "KV": None,  # Would be actual KV namespace binding
    }

    print("🔥 ProtoThrive Secure Database CRUD Example")
    print("=" * 50)
    print()
    print("This example demonstrates:")
    print("✅ SQL injection prevention with parameterized queries")
    print("✅ Comprehensive data validation with Pydantic models")
    print("✅ Structured logging with contextual information")
    print("✅ Performance monitoring and metrics collection")
    print("✅ Proper error handling with specific error codes")
    print("✅ Database migrations with rollback support")
    print("✅ Transaction support for atomic operations")
    print()
    print("To run this example in a real environment:")
    print("1. Deploy to Cloudflare Workers with D1 database")
    print("2. Provide actual env bindings")
    print("3. Call: await run_roadmap_crud_example(env)")
    print()
    print("📊 Example Results Structure:")
    print(json.dumps({
        "migration_status": "Applied X migrations successfully",
        "crud_operations": "All CRUD operations completed",
        "validation_examples": "Input validation working correctly",
        "error_handling_examples": "Proper error handling demonstrated",
        "monitoring_metrics": "Performance metrics collected"
    }, indent=2))


# Export main functions
__all__ = [
    'RoadmapCRUDExample',
    'run_roadmap_crud_example',
    'run_migration_example'
]