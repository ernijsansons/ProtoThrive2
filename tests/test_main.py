import pytest
import json
from unittest.mock import AsyncMock, MagicMock

# Mock the environment for testing
@pytest.fixture
def mock_env():
    mock_db = MagicMock()
    mock_db.prepare.return_value.first.return_value = {'test': 1}
    mock_db.prepare.return_value.run.return_value = {'meta': {'changes': 1}}
    mock_db.prepare.return_value.all.return_value = [] # Default for queries

    mock_kv = MagicMock()
    mock_kv.get.return_value = None
    mock_kv.put.return_value = None

    return {"DB": mock_db, "KV": mock_kv}

# Mock the orchestrate function from ai_core
@pytest.fixture(autouse=True)
def mock_orchestrate(monkeypatch):
    mock_func = AsyncMock(return_value="Simulated AI Output")
    monkeypatch.setattr("main.orchestrate", mock_func)
    return mock_func

# Import the Worker after mocks are set up
from main import Worker

@pytest.mark.asyncio
async def test_health_endpoint(mock_env):
    worker = Worker(mock_env)
    request = Request("http://localhost/health", method="GET")
    response = await worker.fetch(request)
    assert response.status == 200
    assert await response.json() == {"status": "ok", "service": "protothrive-backend-python"}

@pytest.mark.asyncio
async def test_root_endpoint_db_connected(mock_env):
    worker = Worker(mock_env)
    request = Request("http://localhost/", method="GET")
    response = await worker.fetch(request)
    assert response.status == 200
    data = await response.json()
    assert data["status"] == "Thermonuclear Backend Up - Ready"
    assert data["db"] == "Connected"

@pytest.mark.asyncio
async def test_root_endpoint_db_error(mock_env):
    mock_env["DB"].prepare.return_value.first.side_effect = Exception("DB Error")
    worker = Worker(mock_env)
    request = Request("http://localhost/", method="GET")
    response = await worker.fetch(request)
    assert response.status == 200
    data = await response.json()
    assert data["status"] == "Thermonuclear Backend Up - Ready"
    assert data["db"] == "Error"

@pytest.mark.asyncio
async def test_post_roadmap_success(mock_env, mock_orchestrate):
    worker = Worker(mock_env)
    roadmap_data = {
        "json_graph": json.dumps({"nodes": [{"id": "n1"}], "edges": []}),
        "vibe_mode": True
    }
    request = Request("http://localhost/api/roadmaps", method="POST", headers={
        "Authorization": "Bearer mock.uuid-thermo-1.mock"
    }, body=json.dumps(roadmap_data))
    
    # Mock D1 insert to return a result with an ID
    mock_env["DB"].prepare.return_value.run.return_value = {'meta': {'changes': 1}}
    mock_env["DB"].prepare.return_value.first.return_value = {
        "id": "new-roadmap-id",
        "user_id": "uuid-thermo-1",
        "json_graph": roadmap_data["json_graph"],
        "status": "draft",
        "vibe_mode": 1,
        "thrive_score": 0.0,
        "created_at": "2025-08-26T12:00:00Z",
        "updated_at": "2025-08-26T12:00:00Z"
    }

    response = await worker.fetch(request)
    assert response.status == 201
    data = await response.json()
    assert data["id"] == "new-roadmap-id"
    mock_orchestrate.assert_called_once_with(roadmap_data["json_graph"])
    # Verify updateRoadmapStatus and updateRoadmapScore were called
    mock_env["DB"].prepare.assert_any_call('UPDATE roadmaps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
    mock_env["DB"].prepare.assert_any_call('UPDATE roadmaps SET thrive_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')

@pytest.mark.asyncio
async def test_post_roadmap_invalid_body(mock_env):
    worker = Worker(mock_env)
    roadmap_data = {"json_graph": "invalid", "vibe_mode": "not_bool"}
    request = Request("http://localhost/api/roadmaps", method="POST", headers={
        "Authorization": "Bearer mock.uuid-thermo-1.mock"
    }, body=json.dumps(roadmap_data))
    response = await worker.fetch(request)
    assert response.status == 400
    data = await response.json()
    assert data["code"] == "VAL-400"

@pytest.mark.asyncio
async def test_get_roadmap_by_id_success(mock_env):
    worker = Worker(mock_env)
    roadmap_id = "rm-thermo-1"
    mock_env["DB"].prepare.return_value.first.return_value = {
        "id": roadmap_id,
        "user_id": "uuid-thermo-1",
        "json_graph": '{}',
        "status": "draft",
        "vibe_mode": 1,
        "thrive_score": 0.0,
        "created_at": "2025-08-26T12:00:00Z",
        "updated_at": "2025-08-26T12:00:00Z"
    }
    request = Request(f"http://localhost/api/roadmaps/{roadmap_id}", method="GET", headers={
        "Authorization": "Bearer mock.uuid-thermo-1.mock"
    })
    response = await worker.fetch(request)
    assert response.status == 200
    data = await response.json()
    assert data["id"] == roadmap_id

@pytest.mark.asyncio
async def test_get_roadmap_by_id_not_found(mock_env):
    worker = Worker(mock_env)
    roadmap_id = "non-existent-id"
    mock_env["DB"].prepare.return_value.first.return_value = None
    request = Request(f"http://localhost/api/roadmaps/{roadmap_id}", method="GET", headers={
        "Authorization": "Bearer mock.uuid-thermo-1.mock"
    })
    response = await worker.fetch(request)
    assert response.status == 404
    data = await response.json()
    assert data["code"] == "GRAPH-404"

@pytest.mark.asyncio
async def test_graphql_query_roadmap_success(mock_env):
    worker = Worker(mock_env)
    roadmap_id = "rm-thermo-1"
    mock_env["DB"].prepare.return_value.first.return_value = {
        "id": roadmap_id,
        "user_id": "uuid-thermo-1",
        "json_graph": '{}',
        "status": "draft",
        "vibe_mode": 1,
        "thrive_score": 0.0,
        "created_at": "2025-08-26T12:00:00Z",
        "updated_at": "2025-08-26T12:00:00Z"
    }
    query = """
        query GetRoadmap($id: String!) {
            getRoadmap(id: $id) {
                id
                status
            }
        }
    """
    request_body = {"query": query, "variables": {"id": roadmap_id}}
    request = Request("http://localhost/graphql", method="POST", headers={
        "Authorization": "Bearer mock.uuid-thermo-1.mock",
        "Content-Type": "application/json"
    }, body=json.dumps(request_body))
    response = await worker.fetch(request)
    assert response.status == 200
    data = await response.json()
    assert data["getRoadmap"]["id"] == roadmap_id

@pytest.mark.asyncio
async def test_graphql_mutation_create_roadmap_success(mock_env, mock_orchestrate):
    worker = Worker(mock_env)
    roadmap_data = {
        "json_graph": json.dumps({"nodes": [{"id": "n1"}], "edges": []}),
        "vibe_mode": True
    }
    query = """
        mutation CreateRoadmap($input: CreateRoadmapInput!) {
            createRoadmap(input: $input) {
                id
                status
                thriveScore
            }
        }
    """
    request_body = {"query": query, "variables": {"input": roadmap_data}}
    request = Request("http://localhost/graphql", method="POST", headers={
        "Authorization": "Bearer mock.uuid-thermo-1.mock",
        "Content-Type": "application/json"
    }, body=json.dumps(request_body))

    # Mock D1 insert to return a result with an ID
    mock_env["DB"].prepare.return_value.run.return_value = {'meta': {'changes': 1}}
    mock_env["DB"].prepare.return_value.first.return_value = {
        "id": "new-graphql-roadmap-id",
        "user_id": "uuid-thermo-1",
        "json_graph": roadmap_data["json_graph"],
        "status": "draft",
        "vibe_mode": 1,
        "thrive_score": 0.0,
        "created_at": "2025-08-26T12:00:00Z",
        "updated_at": "2025-08-26T12:00:00Z"
    }

    response = await worker.fetch(request)
    assert response.status == 200
    data = await response.json()
    assert data["createRoadmap"]["id"] == "new-graphql-roadmap-id"
    mock_orchestrate.assert_called_once_with(roadmap_data["json_graph"])
    # Verify updateRoadmapStatus and updateRoadmapScore were called
    mock_env["DB"].prepare.assert_any_call('UPDATE roadmaps SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
    mock_env["DB"].prepare.assert_any_call('UPDATE roadmaps SET thrive_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')

@pytest.mark.asyncio
async def test_unauthorized_access(mock_env):
    worker = Worker(mock_env)
    request = Request("http://localhost/api/roadmaps", method="GET") # No auth header
    response = await worker.fetch(request)
    assert response.status == 401
    data = await response.json()
    assert data["code"] == "AUTH-401"

@pytest.mark.asyncio
async def test_invalid_auth_token(mock_env):
    worker = Worker(mock_env)
    request = Request("http://localhost/api/roadmaps", method="GET", headers={
        "Authorization": "Bearer invalid-token"
    })
    response = await worker.fetch(request)
    assert response.status == 401
    data = await response.json()
    assert data["code"] == "AUTH-401"

# Helper for creating a mock Request object
class Request:
    def __init__(self, url, method="GET", headers=None, body=None):
        self.url = url
        self.method = method
        self.headers = headers if headers is not None else {}
        self._body = body

    async def json(self):
        if self._body:
            return json.loads(self._body)
        return {}

    async def text(self):
        if self._body:
            return self._body
        return ""

class Response:
    def __init__(self, body, status=200, headers=None):
        self._body = body
        self.status = status
        self.headers = headers if headers is not None else {}

    async def json(self):
        return json.loads(self._body)

    async def text(self):
        return self._body
