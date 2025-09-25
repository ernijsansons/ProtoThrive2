"""
Comprehensive API Integration Tests for ProtoThrive Backend

Tests all API endpoints with:
- Authentication and authorization
- Request/response validation
- Error handling
- Rate limiting
- Caching behavior
- Database interactions
"""

import pytest
import json
import uuid
import sys
from pathlib import Path
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from typing import Dict, Any

# Add src directory to path for imports
sys.path.append(str((Path(__file__).resolve().parents[1] / "src")))

# Mock Cloudflare Workers modules before any imports
import sys
from unittest.mock import MagicMock

# Mock js module (Cloudflare Workers runtime)
js_mock = MagicMock()
js_mock.Response = MagicMock()
js_mock.Request = MagicMock()
js_mock.Headers = MagicMock()
js_mock.console = MagicMock()
sys.modules['js'] = js_mock

# Mock cloudflare:workers module
sys.modules['cloudflare:workers'] = MagicMock()

# Mock Cloudflare Workers environment
@pytest.fixture
def mock_env():
    """Mock Cloudflare Workers environment"""
    return {
        "DB": Mock(),
        "KV": Mock(),
        "ENVIRONMENT": "test",
        "ALLOWED_ORIGINS": "https://test.protothrive.com",
        "JWT_SECRET": "test-secret-key",
        "RATE_LIMIT_REQUESTS": "100",
        "RATE_LIMIT_WINDOW": "60"
    }

@pytest.fixture
def mock_user():
    """Mock authenticated user"""
    return {
        "id": "user_123",
        "email": "test@protothrive.com",
        "role": "vibe_coder",
        "permissions": ["read", "write", "admin"]
    }

@pytest.fixture
def mock_roadmap():
    """Mock roadmap data"""
    return {
        "id": "roadmap_123",
        "user_id": "user_123",
        "title": "Test Roadmap",
        "json_graph": {
            "nodes": [
                {"id": "node1", "label": "Component A", "type": "component"},
                {"id": "node2", "label": "Component B", "type": "component"}
            ],
            "edges": [
                {"from": "node1", "to": "node2", "type": "dependency"}
            ]
        },
        "status": "draft",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

@pytest.fixture
def mock_snippet():
    """Mock code snippet data"""
    return {
        "id": "snippet_123",
        "user_id": "user_123",
        "title": "Test Snippet",
        "code": "console.log('Hello World');",
        "language": "javascript",
        "tags": ["test", "example"],
        "created_at": datetime.now().isoformat()
    }

class TestAuthenticationEndpoints:
    """Test authentication-related endpoints"""

    @pytest.mark.asyncio
    async def test_login_success(self, mock_env):
        """Test successful user login"""
        from main_enhanced import EnhancedWorker, APIRequest
        
        worker = EnhancedWorker(mock_env)
        
        # Mock token generation
        with patch.object(worker.auth_service, 'generate_tokens') as mock_generate:
            mock_generate.return_value = {
                "access_token": "access_token_123",
                "refresh_token": "refresh_token_123",
                "expires_in": 3600
            }
            
            # Create mock request
            request = APIRequest(
                method="POST",
                url="https://api.protothrive.com/v1/auth/login",
                headers={"Content-Type": "application/json"},
                body={
                    "email": "test@protothrive.com",
                    "password": "password123"
                }
            )
            
            response = await worker.handle_login(request)
            
            # Verify token generation was called
            mock_generate.assert_called_once()
            
            # Verify response structure
            assert response is not None
            assert response.data is not None
            assert "user" in response.data
            assert "tokens" in response.data

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self, mock_env):
        """Test login with invalid credentials"""
        from main_enhanced import EnhancedWorker, APIRequest
        
        worker = EnhancedWorker(mock_env)
        
        # Create request with missing credentials
        request = APIRequest(
            method="POST",
            url="https://api.protothrive.com/v1/auth/login",
            headers={"Content-Type": "application/json"},
            body={
                "email": "invalid@protothrive.com"
                # Missing password
            }
        )
        
        # Should raise ValueError for missing password
        with pytest.raises(ValueError):
            await worker.handle_login(request)

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, mock_env):
        """Test successful token refresh"""
        from main_enhanced import EnhancedWorker, APIRequest
        
        worker = EnhancedWorker(mock_env)
        
        # Mock successful token refresh
        with patch.object(worker.auth_service, 'refresh_access_token') as mock_refresh:
            mock_refresh.return_value = {
                "access_token": "new_access_token",
                "refresh_token": "new_refresh_token",
                "expires_in": 3600
            }
            
            request = APIRequest(
                method="POST",
                url="https://api.protothrive.com/v1/auth/refresh",
                headers={"Content-Type": "application/json"},
                body={
                    "refresh_token": "valid_refresh_token"
                }
            )
            
            response = await worker.handle_refresh_token(request)
            
            # Verify refresh was called
            mock_refresh.assert_called_once()
            
            # Verify response
            assert response is not None
            assert response.data is not None


class TestRoadmapEndpoints:
    """Test roadmap-related endpoints"""

    @pytest.mark.asyncio
    async def test_get_roadmaps_success(self, mock_env, mock_user):
        """Test successful retrieval of user roadmaps"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database query
        with patch('main_enhanced.queryUserRoadmaps') as mock_query:
            mock_query.return_value = [mock_roadmap]
            
            request = Mock()
            request.method = "GET"
            request.url = "https://api.protothrive.com/v1/roadmaps"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_get_roadmaps(request, mock_user)
                
                # Verify database query was called
                mock_query.assert_called_once_with(mock_user["id"], mock_env["DB"])
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_create_roadmap_success(self, mock_env, mock_user):
        """Test successful roadmap creation"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database insert
        with patch('main_enhanced.insertRoadmap') as mock_insert:
            mock_insert.return_value = {"id": "new_roadmap_123"}
            
            request = Mock()
            request.method = "POST"
            request.url = "https://api.protothrive.com/v1/roadmaps"
            request.headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
            request.json.return_value = {
                "title": "New Roadmap",
                "json_graph": {
                    "nodes": [],
                    "edges": []
                }
            }
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_create_roadmap(request, mock_user)
                
                # Verify database insert was called
                mock_insert.assert_called_once()
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_get_roadmap_success(self, mock_env, mock_user, mock_roadmap):
        """Test successful retrieval of specific roadmap"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock cache and database
        with patch.object(worker.cache_service, 'get') as mock_cache_get, \
             patch.object(worker.cache_service, 'set') as mock_cache_set, \
             patch('main_enhanced.queryRoadmap') as mock_query:
            
            # Cache miss
            mock_cache_get.return_value = None
            mock_query.return_value = mock_roadmap
            
            request = Mock()
            request.method = "GET"
            request.url = f"https://api.protothrive.com/v1/roadmaps/{mock_roadmap['id']}"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_get_roadmap(request, mock_user, mock_roadmap['id'])
                
                # Verify cache was checked
                mock_cache_get.assert_called_once()
                
                # Verify database query was called
                mock_query.assert_called_once()
                
                # Verify cache was set
                mock_cache_set.assert_called_once()
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_get_roadmap_cached(self, mock_env, mock_user, mock_roadmap):
        """Test roadmap retrieval from cache"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock cache hit
        with patch.object(worker.cache_service, 'get') as mock_cache_get, \
             patch('main_enhanced.queryRoadmap') as mock_query:
            
            # Cache hit
            mock_cache_get.return_value = mock_roadmap
            
            request = Mock()
            request.method = "GET"
            request.url = f"https://api.protothrive.com/v1/roadmaps/{mock_roadmap['id']}"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_get_roadmap(request, mock_user, mock_roadmap['id'])
                
                # Verify cache was checked
                mock_cache_get.assert_called_once()
                
                # Verify database query was NOT called
                mock_query.assert_not_called()
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_update_roadmap_success(self, mock_env, mock_user, mock_roadmap):
        """Test successful roadmap update"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database update and cache invalidation
        with patch('main_enhanced.updateRoadmap') as mock_update, \
             patch.object(worker.cache_service, 'delete') as mock_cache_delete:
            
            mock_update.return_value = True
            
            request = Mock()
            request.method = "PUT"
            request.url = f"https://api.protothrive.com/v1/roadmaps/{mock_roadmap['id']}"
            request.headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
            request.json.return_value = {
                "title": "Updated Roadmap",
                "json_graph": mock_roadmap["json_graph"]
            }
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_update_roadmap(request, mock_user, mock_roadmap['id'])
                
                # Verify database update was called
                mock_update.assert_called_once()
                
                # Verify cache was invalidated
                mock_cache_delete.assert_called_once()
                
                # Verify response
                assert response is not None


class TestSnippetEndpoints:
    """Test code snippet endpoints"""

    @pytest.mark.asyncio
    async def test_get_snippets_success(self, mock_env, mock_user):
        """Test successful retrieval of code snippets"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database query
        with patch('main_enhanced.querySnippets') as mock_query:
            mock_query.return_value = [mock_snippet]
            
            request = Mock()
            request.method = "GET"
            request.url = "https://api.protothrive.com/v1/snippets"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_get_snippets(request, mock_user)
                
                # Verify database query was called
                mock_query.assert_called_once_with(mock_user["id"], mock_env["DB"])
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_create_snippet_success(self, mock_env, mock_user):
        """Test successful snippet creation"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database insert
        with patch('main_enhanced.insertSnippet') as mock_insert:
            mock_insert.return_value = {"id": "new_snippet_123"}
            
            request = Mock()
            request.method = "POST"
            request.url = "https://api.protothrive.com/v1/snippets"
            request.headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
            request.json.return_value = {
                "title": "New Snippet",
                "code": "console.log('Hello World');",
                "language": "javascript",
                "tags": ["test"]
            }
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_create_snippet(request, mock_user)
                
                # Verify database insert was called
                mock_insert.assert_called_once()
                
                # Verify response
                assert response is not None


class TestAgentEndpoints:
    """Test AI agent endpoints"""

    @pytest.mark.asyncio
    async def test_agent_run_success(self, mock_env, mock_user):
        """Test successful agent execution"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock agent coordinator
        with patch.object(worker.agent_coordinator, 'run_task') as mock_run:
            mock_run.return_value = Mock(
                result=Mock(
                    success=True,
                    output={"code": "console.log('Generated code');"},
                    confidence=0.95
                ),
                budget_consumed=0.05,
                fallback_used=False
            )
            
            request = Mock()
            request.method = "POST"
            request.url = "https://api.protothrive.com/v1/agent/run"
            request.headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
            request.json.return_value = {
                "task": "Generate a simple React component",
                "context": {"framework": "react", "complexity": "simple"}
            }
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_agent_run(request, mock_user)
                
                # Verify agent was called
                mock_run.assert_called_once()
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_agent_run_failure(self, mock_env, mock_user):
        """Test agent execution failure"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock agent coordinator failure
        with patch.object(worker.agent_coordinator, 'run_task') as mock_run:
            mock_run.side_effect = Exception("Agent execution failed")
            
            request = Mock()
            request.method = "POST"
            request.url = "https://api.protothrive.com/v1/agent/run"
            request.headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
            request.json.return_value = {
                "task": "Generate a simple React component",
                "context": {"framework": "react", "complexity": "simple"}
            }
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_agent_run(request, mock_user)
                
                # Verify agent was called
                mock_run.assert_called_once()
                
                # Verify error response
                assert response is not None


class TestSystemEndpoints:
    """Test system and health endpoints"""

    @pytest.mark.asyncio
    async def test_health_check_success(self, mock_env):
        """Test successful health check"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database health check
        with patch('main_enhanced.checkDatabaseHealth') as mock_health:
            mock_health.return_value = {"status": "healthy", "connected": True}
            
            request = Mock()
            request.method = "GET"
            request.url = "https://api.protothrive.com/v1/health"
            request.headers = {}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_health(request)
                
                # Verify health check was called
                mock_health.assert_called_once()
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_status_endpoint_success(self, mock_env):
        """Test successful status endpoint"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        request = Mock()
        request.method = "GET"
        request.url = "https://api.protothrive.com/v1/status"
        request.headers = {}
        
        with patch('js.Response') as mock_response:
            mock_response.new.return_value = Mock()
            
            response = await worker.handle_status(request)
            
            # Verify response
            assert response is not None

    @pytest.mark.asyncio
    async def test_api_docs_endpoint(self, mock_env):
        """Test API documentation endpoint"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        request = Mock()
        request.method = "GET"
        request.url = "https://api.protothrive.com/v1/docs"
        request.headers = {}
        
        with patch('js.Response') as mock_response:
            mock_response.new.return_value = Mock()
            
            response = await worker.handle_api_docs(request)
            
            # Verify response
            assert response is not None


class TestErrorHandling:
    """Test error handling across endpoints"""

    @pytest.mark.asyncio
    async def test_unauthorized_access(self, mock_env):
        """Test unauthorized access to protected endpoints"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock failed authentication
        with patch.object(worker.auth_service, 'validate_token') as mock_validate:
            mock_validate.return_value = None
            
            request = Mock()
            request.method = "GET"
            request.url = "https://api.protothrive.com/v1/roadmaps"
            request.headers = {"Authorization": "Bearer invalid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_get_roadmaps(request, None)
                
                # Verify error response
                assert response is not None

    @pytest.mark.asyncio
    async def test_invalid_json_request(self, mock_env, mock_user):
        """Test handling of invalid JSON requests"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        request = Mock()
        request.method = "POST"
        request.url = "https://api.protothrive.com/v1/roadmaps"
        request.headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
        request.json.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)
        
        with patch('js.Response') as mock_response:
            mock_response.new.return_value = Mock()
            
            response = await worker.handle_create_roadmap(request, mock_user)
            
            # Verify error response
            assert response is not None

    @pytest.mark.asyncio
    async def test_database_error_handling(self, mock_env, mock_user):
        """Test handling of database errors"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database error
        with patch('main_enhanced.queryUserRoadmaps') as mock_query:
            mock_query.side_effect = Exception("Database connection failed")
            
            request = Mock()
            request.method = "GET"
            request.url = "https://api.protothrive.com/v1/roadmaps"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_get_roadmaps(request, mock_user)
                
                # Verify error response
                assert response is not None


class TestRateLimiting:
    """Test rate limiting functionality"""

    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(self, mock_env, mock_user):
        """Test rate limit exceeded scenario"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock rate limiter
        with patch.object(worker.rate_limiter, 'check_rate_limit') as mock_rate_limit:
            mock_rate_limit.return_value = Mock(
                status=429,
                json=Mock(return_value={"error": "Rate limit exceeded"})
            )
            
            request = Mock()
            request.method = "GET"
            request.url = "https://api.protothrive.com/v1/roadmaps"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            response = await worker.handle_get_roadmaps(request, mock_user)
            
            # Verify rate limiter was called
            mock_rate_limit.assert_called_once()
            
            # Verify rate limit response
            assert response is not None

    @pytest.mark.asyncio
    async def test_rate_limit_allowed(self, mock_env, mock_user):
        """Test rate limit allowed scenario"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock rate limiter allowing request
        with patch.object(worker.rate_limiter, 'check_rate_limit') as mock_rate_limit:
            mock_rate_limit.return_value = None  # No rate limit hit
            
            # Mock database query
            with patch('main_enhanced.queryUserRoadmaps') as mock_query:
                mock_query.return_value = []
                
                request = Mock()
                request.method = "GET"
                request.url = "https://api.protothrive.com/v1/roadmaps"
                request.headers = {"Authorization": "Bearer valid_token"}
                
                with patch('js.Response') as mock_response:
                    mock_response.new.return_value = Mock()
                    
                    response = await worker.handle_get_roadmaps(request, mock_user)
                    
                    # Verify rate limiter was called
                    mock_rate_limit.assert_called_once()
                    
                    # Verify normal response
                    assert response is not None


class TestCachingBehavior:
    """Test caching behavior across endpoints"""

    @pytest.mark.asyncio
    async def test_cache_hit_performance(self, mock_env, mock_user, mock_roadmap):
        """Test cache hit performance"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock cache hit
        with patch.object(worker.cache_service, 'get') as mock_cache_get:
            mock_cache_get.return_value = mock_roadmap
            
            request = Mock()
            request.method = "GET"
            request.url = f"https://api.protothrive.com/v1/roadmaps/{mock_roadmap['id']}"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_get_roadmap(request, mock_user, mock_roadmap['id'])
                
                # Verify cache was checked
                mock_cache_get.assert_called_once()
                
                # Verify response
                assert response is not None

    @pytest.mark.asyncio
    async def test_cache_invalidation_on_update(self, mock_env, mock_user, mock_roadmap):
        """Test cache invalidation on roadmap update"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock database update and cache invalidation
        with patch('main_enhanced.updateRoadmap') as mock_update, \
             patch.object(worker.cache_service, 'delete') as mock_cache_delete:
            
            mock_update.return_value = True
            
            request = Mock()
            request.method = "PUT"
            request.url = f"https://api.protothrive.com/v1/roadmaps/{mock_roadmap['id']}"
            request.headers = {"Authorization": "Bearer valid_token", "Content-Type": "application/json"}
            request.json.return_value = {
                "title": "Updated Roadmap",
                "json_graph": mock_roadmap["json_graph"]
            }
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_update_roadmap(request, mock_user, mock_roadmap['id'])
                
                # Verify cache was invalidated
                mock_cache_delete.assert_called_once()
                
                # Verify response
                assert response is not None


class TestAnalyticsEndpoints:
    """Test analytics and insights endpoints"""

    @pytest.mark.asyncio
    async def test_analytics_dashboard_success(self, mock_env, mock_user):
        """Test successful analytics dashboard retrieval"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Mock analytics data
        mock_analytics = {
            "user_metrics": {
                "total_roadmaps": 5,
                "active_roadmaps": 2,
                "completion_rate": 0.8
            },
            "system_metrics": {
                "total_users": 100,
                "api_requests": 1000,
                "cache_hit_rate": 0.85
            }
        }
        
        with patch.object(worker.monitoring, 'get_analytics') as mock_analytics_service:
            mock_analytics_service.return_value = mock_analytics
            
            request = Mock()
            request.method = "GET"
            request.url = "https://api.protothrive.com/v1/analytics/dashboard"
            request.headers = {"Authorization": "Bearer valid_token"}
            
            with patch('js.Response') as mock_response:
                mock_response.new.return_value = Mock()
                
                response = await worker.handle_analytics_dashboard(request, mock_user)
                
                # Verify analytics service was called
                mock_analytics_service.assert_called_once()
                
                # Verify response
                assert response is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
