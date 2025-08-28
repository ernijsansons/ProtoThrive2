# Ref: CLAUDE.md Terminal 1 Phase 1 - Validation Utilities (Python Port)
# Thermonuclear Validation Schemas for ProtoThrive

from pydantic import BaseModel, Field, ValidationError, model_validator
from typing import Optional, Literal, Any
import json
import re

# Helper functions
def is_valid_json(v: str) -> str:
    try:
        json.loads(v)
        return v
    except json.JSONDecodeError:
        raise ValueError('Invalid JSON format')

def is_valid_uuid(v: str) -> str:
    uuid_regex = re.compile(r'^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$|uuid-[a-z0-9-]+$', re.IGNORECASE)
    if not uuid_regex.match(v):
        raise ValueError('Invalid UUID format')
    return v

# Enums
UserRoleEnum = Literal['vibe_coder', 'engineer', 'exec', 'super_admin']
RoadmapStatusEnum = Literal['draft', 'active', 'completed', 'archived']
AgentLogStatusEnum = Literal['success', 'fail', 'timeout', 'escalated']
InsightTypeEnum = Literal['performance', 'usage', 'quality', 'cost']

# Pydantic Models for Validation
class RoadmapBody(BaseModel):
    json_graph: str = Field(min_length=10)
    vibe_mode: bool

    @model_validator(mode='after')
    def validate_json_graph(self) -> 'RoadmapBody':
        is_valid_json(self.json_graph)
        return self

class RoadmapUpdate(BaseModel):
    json_graph: Optional[str] = Field(None, min_length=10)
    vibe_mode: Optional[bool] = None
    status: Optional[RoadmapStatusEnum] = None

    @model_validator(mode='after')
    def validate_json_graph(self) -> 'RoadmapUpdate':
        if self.json_graph:
            is_valid_json(self.json_graph)
        return self

class SnippetBody(BaseModel):
    category: str = Field(min_length=1, max_length=50)
    code: str = Field(min_length=1)
    ui_preview_url: Optional[str] = None

class AgentLogBody(BaseModel):
    roadmap_id: str
    task_type: str = Field(min_length=1)
    output: str = Field(min_length=1)
    status: AgentLogStatusEnum
    model_used: str = Field(min_length=1)
    token_count: int = Field(gt=0)

    @model_validator(mode='after')
    def validate_roadmap_id_uuid(self) -> 'AgentLogBody':
        is_valid_uuid(self.roadmap_id)
        return self

class InsightBody(BaseModel):
    roadmap_id: str
    type: InsightTypeEnum
    data: str = Field(min_length=1)
    score: float = Field(ge=0, le=1)

    @model_validator(mode='after')
    def validate_data_json(self) -> 'InsightBody':
        is_valid_json(self.data)
        return self
    
    @model_validator(mode='after')
    def validate_roadmap_id_uuid(self) -> 'InsightBody':
        is_valid_uuid(self.roadmap_id)
        return self

class QueryParams(BaseModel):
    limit: int = Field(20, gt=0, le=100)
    offset: int = Field(0, ge=0)
    status: Optional[RoadmapStatusEnum] = None
    category: Optional[str] = None

# Validation functions
def validate_data(model: BaseModel, data: Any) -> Any:
    try:
        return model.model_validate(data)
    except ValidationError as e:
        issues = ', '.join([f'{i["loc"][0]}: {i["msg"]}' for i in e.errors()])
        raise ValueError({'code': 'VAL-400', 'message': f'Validation Error: {issues}'})

def validate_roadmap_body(body: Any) -> RoadmapBody:
    return validate_data(RoadmapBody, body)

def validate_roadmap_update(body: Any) -> RoadmapUpdate:
    return validate_data(RoadmapUpdate, body)

def validate_snippet_body(body: Any) -> SnippetBody:
    return validate_data(SnippetBody, body)

def validate_agent_log_body(body: Any) -> AgentLogBody:
    return validate_data(AgentLogBody, body)

def validate_insight_body(body: Any) -> InsightBody:
    return validate_data(InsightBody, body)

def validate_query_params(params: Any) -> QueryParams:
    return validate_data(QueryParams, params)

def validate_uuid(id: str) -> bool:
    try:
        is_valid_uuid(id)
        return True
    except ValueError:
        return False
