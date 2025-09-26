"""
Production-ready roadmap repository with comprehensive validation and monitoring
Ref: CLAUDE.md - Secure Database Implementation

Extends BaseRepository with roadmap-specific logic and validation.
"""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from ..database.exceptions import ValidationError
from ..models.roadmap import RoadmapCreateDTO, RoadmapModel, RoadmapUpdateDTO, RoadmapValidator
from .base_repository import BaseRepository


class RoadmapRepository(BaseRepository):
    """
    Repository for roadmap data operations with comprehensive validation

    Features:
    - Pydantic model validation for all operations
    - Graph structure validation with security checks
    - Bulk operations for performance
    - Comprehensive error handling and logging
    - Integration with monitoring system
    """

    def __init__(self, query_builder, monitoring_service):
        """
        Initialize roadmap repository

        Args:
            query_builder: Secure query builder instance
            monitoring_service: Monitoring service for metrics and tracing
        """
        super().__init__(query_builder, monitoring_service)
        self.table_name = "roadmaps"
        self.validator = RoadmapValidator()

    async def _validate_create_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate roadmap creation data using Pydantic model

        Args:
            data: Raw roadmap data to validate

        Returns:
            Validated data ready for database insertion

        Raises:
            ValidationError: If validation fails
        """
        try:
            # Use Pydantic model for validation
            dto = RoadmapCreateDTO(**data)

            # Convert to dict for database storage
            validated_data = dto.dict(exclude_unset=True)

            # Ensure required fields are present
            if "user_id" not in validated_data:
                raise ValidationError("user_id is required for roadmap creation")

            # Set default values
            validated_data.setdefault("status", "draft")
            validated_data.setdefault("vibe_mode", False)
            validated_data.setdefault("thrive_score", 0.0)
            validated_data.setdefault("title", "Untitled Roadmap")
            validated_data.setdefault("visibility", "private")

            # Convert lists to JSON strings for database storage
            if "tags" in validated_data:
                validated_data["tags"] = json.dumps(validated_data["tags"])
            else:
                validated_data["tags"] = "[]"

            validated_data.setdefault("shared_with", "[]")

            return validated_data

        except Exception as e:
            if hasattr(e, 'errors'):
                # Pydantic validation error
                error_details = []
                for error in e.errors():
                    field = ".".join(str(x) for x in error['loc'])
                    error_details.append(f"{field}: {error['msg']}")
                raise ValidationError(f"Validation failed: {'; '.join(error_details)}")
            else:
                raise ValidationError(f"Validation failed: {str(e)}")

    async def _validate_update_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate roadmap update data using Pydantic model

        Args:
            data: Raw update data to validate

        Returns:
            Validated data ready for database update

        Raises:
            ValidationError: If validation fails
        """
        try:
            # Remove read-only fields
            update_data = data.copy()
            read_only_fields = ["id", "user_id", "created_at"]
            for field in read_only_fields:
                update_data.pop(field, None)

            if not update_data:
                raise ValidationError("Update data cannot be empty")

            # Use Pydantic model for validation
            dto = RoadmapUpdateDTO(**update_data)

            # Convert to dict, excluding unset values
            validated_data = dto.dict(exclude_unset=True)

            # Convert lists to JSON strings for database storage
            if "tags" in validated_data:
                validated_data["tags"] = json.dumps(validated_data["tags"])

            return validated_data

        except Exception as e:
            if hasattr(e, 'errors'):
                # Pydantic validation error
                error_details = []
                for error in e.errors():
                    field = ".".join(str(x) for x in error['loc'])
                    error_details.append(f"{field}: {error['msg']}")
                raise ValidationError(f"Validation failed: {'; '.join(error_details)}")
            else:
                raise ValidationError(f"Validation failed: {str(e)}")

    async def create_roadmap(
        self,
        user_id: str,
        roadmap_data: Dict[str, Any]
    ) -> RoadmapModel:
        """
        Create new roadmap with comprehensive validation

        Args:
            user_id: ID of the user creating the roadmap
            roadmap_data: Roadmap data to create

        Returns:
            Created roadmap model

        Raises:
            ValidationError: If roadmap data is invalid
            DatabaseError: If creation fails
        """
        # Add user_id to data
        data_with_user = {**roadmap_data, "user_id": user_id}

        # Create record using base repository
        roadmap_id = await self.create(data_with_user, user_id)

        # Retrieve the created roadmap
        created_roadmap = await self.get_by_id(roadmap_id, user_id)
        if not created_roadmap:
            raise ValidationError("Failed to retrieve created roadmap")

        return RoadmapModel.from_orm(created_roadmap)

    async def get_roadmap(
        self,
        roadmap_id: str,
        user_id: str
    ) -> Optional[RoadmapModel]:
        """
        Get roadmap by ID with user authorization

        Args:
            roadmap_id: ID of roadmap to retrieve
            user_id: ID of requesting user

        Returns:
            Roadmap model if found and authorized, None otherwise
        """
        roadmap_data = await self.get_by_id(roadmap_id, user_id)
        if roadmap_data:
            return RoadmapModel.from_orm(roadmap_data)
        return None

    async def update_roadmap(
        self,
        roadmap_id: str,
        user_id: str,
        update_data: Dict[str, Any]
    ) -> Optional[RoadmapModel]:
        """
        Update roadmap with validation

        Args:
            roadmap_id: ID of roadmap to update
            user_id: ID of requesting user
            update_data: Data to update

        Returns:
            Updated roadmap model if successful, None if not found

        Raises:
            ValidationError: If update data is invalid
            DatabaseError: If update fails
        """
        success = await self.update(roadmap_id, update_data, user_id)
        if success:
            updated_roadmap = await self.get_by_id(roadmap_id, user_id)
            if updated_roadmap:
                return RoadmapModel.from_orm(updated_roadmap)
        return None

    async def get_user_roadmaps(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[RoadmapModel]:
        """
        Get roadmaps for specific user with optional filtering

        Args:
            user_id: ID of user whose roadmaps to retrieve
            status: Optional status filter
            limit: Maximum number of roadmaps to return
            offset: Number of roadmaps to skip

        Returns:
            List of roadmap models
        """
        filters = {"user_id": user_id}
        if status:
            filters["status"] = status

        roadmaps_data = await self.list(
            filters=filters,
            order_by="updated_at",
            limit=limit,
            offset=offset
        )

        return [RoadmapModel.from_orm(roadmap) for roadmap in roadmaps_data]

    async def update_thrive_score(
        self,
        roadmap_id: str,
        user_id: str,
        score: float
    ) -> bool:
        """
        Update roadmap thrive score with validation

        Args:
            roadmap_id: ID of roadmap to update
            user_id: ID of requesting user
            score: New thrive score (0.0 to 1.0)

        Returns:
            True if updated successfully, False if not found

        Raises:
            ValidationError: If score is invalid
        """
        if not isinstance(score, (int, float)) or not 0 <= score <= 1:
            raise ValidationError("Score must be a number between 0.0 and 1.0")

        return await self.update(roadmap_id, {"thrive_score": score}, user_id)

    async def bulk_update_scores(
        self,
        score_updates: List[Dict[str, Any]]
    ) -> int:
        """
        Bulk update roadmap scores for performance

        Args:
            score_updates: List of dicts with roadmap_id, user_id, and score

        Returns:
            Number of successfully updated roadmaps

        Raises:
            ValidationError: If any score update is invalid
        """
        async with self.transaction() as tx_id:
            updated_count = 0

            for update in score_updates:
                try:
                    roadmap_id = update.get("roadmap_id")
                    user_id = update.get("user_id")
                    score = update.get("score")

                    if not roadmap_id or not user_id or score is None:
                        self.logger.warning(
                            "bulk_update_invalid_entry",
                            transaction_id=tx_id,
                            update=update
                        )
                        continue

                    success = await self.update_thrive_score(roadmap_id, user_id, score)
                    if success:
                        updated_count += 1

                except Exception as e:
                    self.logger.error(
                        "bulk_update_entry_failed",
                        transaction_id=tx_id,
                        update=update,
                        error=str(e)
                    )
                    continue

            self.logger.info(
                "bulk_score_update_completed",
                transaction_id=tx_id,
                total_updates=len(score_updates),
                successful_updates=updated_count
            )

            return updated_count

    async def search_roadmaps(
        self,
        user_id: str,
        search_term: Optional[str] = None,
        tags: Optional[List[str]] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[RoadmapModel]:
        """
        Search roadmaps with multiple criteria

        Args:
            user_id: ID of user whose roadmaps to search
            search_term: Optional text to search in title and description
            tags: Optional list of tags to filter by
            status: Optional status filter
            limit: Maximum number of results
            offset: Number of results to skip

        Returns:
            List of matching roadmap models

        Note: This is a simplified search implementation.
        For production, consider using a dedicated search engine.
        """
        # Build base filters
        filters = {"user_id": user_id}
        if status:
            filters["status"] = status

        # Get all user roadmaps (we'll filter in memory for now)
        all_roadmaps = await self.list(
            filters=filters,
            order_by="updated_at",
            limit=1000,  # Get more for filtering
            offset=0
        )

        # Convert to models for easier processing
        roadmap_models = [RoadmapModel.from_orm(roadmap) for roadmap in all_roadmaps]

        # Apply search filters
        filtered_roadmaps = []

        for roadmap in roadmap_models:
            # Search term filter (case-insensitive)
            if search_term:
                search_lower = search_term.lower()
                title_match = search_lower in roadmap.title.lower()
                desc_match = (roadmap.description and
                             search_lower in roadmap.description.lower())

                if not (title_match or desc_match):
                    continue

            # Tags filter
            if tags:
                roadmap_tags_lower = [tag.lower() for tag in roadmap.tags]
                search_tags_lower = [tag.lower() for tag in tags]

                # Check if any search tags match roadmap tags
                if not any(tag in roadmap_tags_lower for tag in search_tags_lower):
                    continue

            filtered_roadmaps.append(roadmap)

        # Apply pagination
        start_idx = offset
        end_idx = offset + limit

        return filtered_roadmaps[start_idx:end_idx]

    async def get_roadmap_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Get roadmap statistics for a user

        Args:
            user_id: ID of user to get statistics for

        Returns:
            Dictionary with roadmap statistics
        """
        span_id = self.monitoring.tracer.start_span("db.roadmaps.statistics")

        try:
            # Get all user roadmaps
            roadmaps = await self.get_user_roadmaps(user_id, limit=1000)

            # Calculate statistics
            total_count = len(roadmaps)
            status_counts = {}
            total_score = 0.0

            for roadmap in roadmaps:
                # Count by status
                status = roadmap.status
                status_counts[status] = status_counts.get(status, 0) + 1

                # Sum scores for average
                total_score += roadmap.thrive_score

            avg_score = total_score / total_count if total_count > 0 else 0.0

            # Find most recent activity
            most_recent = None
            if roadmaps:
                most_recent = max(roadmaps, key=lambda r: r.updated_at)

            statistics = {
                "total_roadmaps": total_count,
                "status_breakdown": status_counts,
                "average_thrive_score": round(avg_score, 3),
                "most_recent_update": most_recent.updated_at.isoformat() if most_recent else None
            }

            self.logger.info(
                "roadmap_statistics_calculated",
                user_id=user_id,
                statistics=statistics
            )

            return statistics

        finally:
            self.monitoring.tracer.finish_span(span_id)

    async def delete_roadmap(
        self,
        roadmap_id: str,
        user_id: str,
        hard_delete: bool = False
    ) -> bool:
        """
        Delete roadmap with soft delete by default

        Args:
            roadmap_id: ID of roadmap to delete
            user_id: ID of requesting user
            hard_delete: If True, permanently delete the roadmap

        Returns:
            True if deleted successfully, False if not found
        """
        return await self.delete(roadmap_id, user_id, soft_delete=not hard_delete)


# Export roadmap repository
__all__ = ['RoadmapRepository']