"""
Comprehensive validation models for roadmap data
Ref: CLAUDE.md - Secure Database Implementation

Provides Pydantic models for roadmap data validation with security checks.
"""
from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, validator


class RoadmapValidator:
    """Comprehensive roadmap validation with security checks"""

    @staticmethod
    def validate_graph_structure(graph_data: Dict[str, Any]) -> bool:
        """
        Validate JSON graph structure with comprehensive security checks

        Args:
            graph_data: Graph data to validate

        Returns:
            True if graph structure is valid, False otherwise
        """
        try:
            # Must be a dictionary
            if not isinstance(graph_data, dict):
                return False

            # Required top-level keys
            required_keys = ["nodes", "edges"]
            for key in required_keys:
                if key not in graph_data:
                    return False

            # Validate nodes array
            nodes = graph_data["nodes"]
            if not isinstance(nodes, list):
                return False

            # Limit number of nodes for performance and security
            if len(nodes) > 1000:
                return False

            # Track node IDs for edge validation
            node_ids = set()

            for node in nodes:
                if not isinstance(node, dict):
                    return False

                # Required node fields
                if "id" not in node or "label" not in node:
                    return False

                # Validate node ID format (alphanumeric, hyphens, underscores only)
                node_id = node["id"]
                if not isinstance(node_id, str):
                    return False

                if not re.match(r'^[a-zA-Z0-9_-]+$', node_id):
                    return False

                # Node ID length limit
                if len(node_id) > 50:
                    return False

                # Check for duplicate IDs
                if node_id in node_ids:
                    return False
                node_ids.add(node_id)

                # Validate label
                label = node["label"]
                if not isinstance(label, str):
                    return False

                # Label length limit
                if len(label) > 200:
                    return False

                # Validate optional position data
                if "position" in node:
                    position = node["position"]
                    if not isinstance(position, dict):
                        return False

                    # Check position coordinates
                    for coord in ["x", "y"]:
                        if coord in position:
                            if not isinstance(position[coord], (int, float)):
                                return False
                            # Reasonable coordinate limits
                            if abs(position[coord]) > 100000:
                                return False

                # Validate optional status
                if "status" in node:
                    status = node["status"]
                    if not isinstance(status, str):
                        return False
                    # Valid status values
                    valid_statuses = ["gray", "neon", "active", "completed", "pending"]
                    if status not in valid_statuses:
                        return False

            # Validate edges array
            edges = graph_data["edges"]
            if not isinstance(edges, list):
                return False

            # Limit number of edges for performance
            if len(edges) > 5000:
                return False

            for edge in edges:
                if not isinstance(edge, dict):
                    return False

                # Required edge fields
                required_edge_fields = ["from", "to"]
                for field in required_edge_fields:
                    if field not in edge:
                        return False

                # Validate edge references
                from_id = edge["from"]
                to_id = edge["to"]

                if not isinstance(from_id, str) or not isinstance(to_id, str):
                    return False

                # Edge IDs must reference existing nodes
                if from_id not in node_ids or to_id not in node_ids:
                    return False

                # Validate optional edge properties
                if "label" in edge:
                    edge_label = edge["label"]
                    if not isinstance(edge_label, str) or len(edge_label) > 100:
                        return False

            return True

        except Exception:
            # Any exception during validation means invalid structure
            return False

    @staticmethod
    def validate_tags(tags: List[str]) -> bool:
        """
        Validate tags array

        Args:
            tags: List of tag strings to validate

        Returns:
            True if tags are valid, False otherwise
        """
        if not isinstance(tags, list):
            return False

        # Limit number of tags
        if len(tags) > 20:
            return False

        for tag in tags:
            if not isinstance(tag, str):
                return False

            # Tag length limit
            if len(tag) > 50:
                return False

            # Tag format validation (alphanumeric, hyphens, underscores)
            if not re.match(r'^[a-zA-Z0-9_-]+$', tag):
                return False

        return True


class RoadmapCreateDTO(BaseModel):
    """Data transfer object for roadmap creation with comprehensive validation"""

    json_graph: str = Field(
        ...,
        min_length=1,
        max_length=500000,
        description="JSON graph data representing the roadmap structure"
    )
    title: Optional[str] = Field(
        None,
        max_length=255,
        description="Roadmap title"
    )
    description: Optional[str] = Field(
        None,
        max_length=10000,
        description="Detailed roadmap description"
    )
    vibe_mode: bool = Field(
        False,
        description="Whether vibe mode is enabled for this roadmap"
    )
    tags: Optional[List[str]] = Field(
        default_factory=list,
        max_items=20,
        description="List of tags for categorization"
    )
    visibility: str = Field(
        "private",
        regex="^(private|team|public)$",
        description="Roadmap visibility level"
    )

    @validator('json_graph')
    def validate_json_graph(cls, v):
        """Validate JSON graph structure and content"""
        try:
            # Parse JSON
            graph_data = json.loads(v)

            # Validate structure using our comprehensive validator
            if not RoadmapValidator.validate_graph_structure(graph_data):
                raise ValueError("Invalid graph structure or content")

            return v

        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {str(e)}")

    @validator('title')
    def validate_title(cls, v):
        """Validate title content"""
        if v is not None:
            # Remove leading/trailing whitespace
            v = v.strip()

            if not v:
                raise ValueError("Title cannot be empty")

            # Check for potentially harmful content
            if re.search(r'[<>"\']', v):
                raise ValueError("Title contains invalid characters")

        return v

    @validator('description')
    def validate_description(cls, v):
        """Validate description content"""
        if v is not None:
            # Remove leading/trailing whitespace
            v = v.strip()

            # Check for potentially harmful content
            suspicious_patterns = [
                r'<script[^>]*>.*?</script>',
                r'javascript:',
                r'vbscript:',
                r'data:text/html'
            ]

            for pattern in suspicious_patterns:
                if re.search(pattern, v, re.IGNORECASE):
                    raise ValueError("Description contains potentially harmful content")

        return v

    @validator('tags')
    def validate_tags(cls, v):
        """Validate tags array"""
        if v is not None:
            if not RoadmapValidator.validate_tags(v):
                raise ValueError("Invalid tags format or content")

            # Remove duplicates while preserving order
            seen = set()
            unique_tags = []
            for tag in v:
                if tag.lower() not in seen:
                    seen.add(tag.lower())
                    unique_tags.append(tag)

            return unique_tags

        return v

    class Config:
        """Pydantic configuration"""
        str_strip_whitespace = True
        validate_assignment = True


class RoadmapUpdateDTO(BaseModel):
    """Data transfer object for roadmap updates with validation"""

    json_graph: Optional[str] = Field(
        None,
        max_length=500000,
        description="Updated JSON graph data"
    )
    title: Optional[str] = Field(
        None,
        max_length=255,
        description="Updated roadmap title"
    )
    description: Optional[str] = Field(
        None,
        max_length=10000,
        description="Updated roadmap description"
    )
    status: Optional[str] = Field(
        None,
        regex="^(draft|active|completed|archived)$",
        description="Updated roadmap status"
    )
    vibe_mode: Optional[bool] = Field(
        None,
        description="Updated vibe mode setting"
    )
    thrive_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Updated thrive score (0.0 to 1.0)"
    )
    tags: Optional[List[str]] = Field(
        None,
        max_items=20,
        description="Updated tags list"
    )
    visibility: Optional[str] = Field(
        None,
        regex="^(private|team|public)$",
        description="Updated visibility level"
    )

    @validator('json_graph')
    def validate_json_graph(cls, v):
        """Validate JSON graph if provided"""
        if v is not None:
            try:
                graph_data = json.loads(v)
                if not RoadmapValidator.validate_graph_structure(graph_data):
                    raise ValueError("Invalid graph structure or content")
            except json.JSONDecodeError as e:
                raise ValueError(f"Invalid JSON format: {str(e)}")
        return v

    @validator('title')
    def validate_title(cls, v):
        """Validate title if provided"""
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Title cannot be empty")
            if re.search(r'[<>"\']', v):
                raise ValueError("Title contains invalid characters")
        return v

    @validator('description')
    def validate_description(cls, v):
        """Validate description if provided"""
        if v is not None:
            v = v.strip()
            suspicious_patterns = [
                r'<script[^>]*>.*?</script>',
                r'javascript:',
                r'vbscript:',
                r'data:text/html'
            ]
            for pattern in suspicious_patterns:
                if re.search(pattern, v, re.IGNORECASE):
                    raise ValueError("Description contains potentially harmful content")
        return v

    @validator('tags')
    def validate_tags(cls, v):
        """Validate tags if provided"""
        if v is not None:
            if not RoadmapValidator.validate_tags(v):
                raise ValueError("Invalid tags format or content")
            # Remove duplicates
            seen = set()
            unique_tags = []
            for tag in v:
                if tag.lower() not in seen:
                    seen.add(tag.lower())
                    unique_tags.append(tag)
            return unique_tags
        return v

    class Config:
        """Pydantic configuration"""
        str_strip_whitespace = True
        validate_assignment = True


class RoadmapModel(BaseModel):
    """Complete roadmap model for database records"""

    id: str
    user_id: str
    json_graph: str
    status: str
    vibe_mode: bool
    thrive_score: float
    title: str
    description: Optional[str]
    tags: List[str]
    shared_with: List[str]
    visibility: str
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

    @classmethod
    def from_orm(cls, db_record: Dict[str, Any]) -> RoadmapModel:
        """
        Create model from database record with proper type conversion

        Args:
            db_record: Raw database record as dict

        Returns:
            Validated RoadmapModel instance
        """
        # Parse JSON fields safely
        try:
            tags = json.loads(db_record.get("tags", "[]"))
            if not isinstance(tags, list):
                tags = []
        except (json.JSONDecodeError, TypeError):
            tags = []

        try:
            shared_with = json.loads(db_record.get("shared_with", "[]"))
            if not isinstance(shared_with, list):
                shared_with = []
        except (json.JSONDecodeError, TypeError):
            shared_with = []

        # Handle datetime fields
        created_at = db_record["created_at"]
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))

        updated_at = db_record["updated_at"]
        if isinstance(updated_at, str):
            updated_at = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))

        deleted_at = db_record.get("deleted_at")
        if deleted_at and isinstance(deleted_at, str):
            deleted_at = datetime.fromisoformat(deleted_at.replace('Z', '+00:00'))

        return cls(
            id=db_record["id"],
            user_id=db_record["user_id"],
            json_graph=db_record["json_graph"],
            status=db_record["status"],
            vibe_mode=bool(db_record["vibe_mode"]),
            thrive_score=float(db_record["thrive_score"]),
            title=db_record["title"],
            description=db_record.get("description"),
            tags=tags,
            shared_with=shared_with,
            visibility=db_record["visibility"],
            created_at=created_at,
            updated_at=updated_at,
            deleted_at=deleted_at
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for API responses"""
        data = self.dict()

        # Convert datetime objects to ISO strings
        if self.created_at:
            data["created_at"] = self.created_at.isoformat()
        if self.updated_at:
            data["updated_at"] = self.updated_at.isoformat()
        if self.deleted_at:
            data["deleted_at"] = self.deleted_at.isoformat()

        return data

    class Config:
        """Pydantic configuration"""
        validate_assignment = True
        use_enum_values = True


# Export all models and validators
__all__ = [
    'RoadmapValidator',
    'RoadmapCreateDTO',
    'RoadmapUpdateDTO',
    'RoadmapModel'
]