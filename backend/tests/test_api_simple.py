"""
Simple API Integration Tests for ProtoThrive Backend

Basic integration tests that verify core API functionality without complex mocking.
"""

import pytest
import json
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add src directory to path for imports
sys.path.append(str((Path(__file__).resolve().parents[1] / "src")))

# Mock Cloudflare Workers modules before any imports
js_mock = MagicMock()
js_mock.Response = MagicMock()
js_mock.Request = MagicMock()
js_mock.Headers = MagicMock()
js_mock.console = MagicMock()
sys.modules['js'] = js_mock
sys.modules['cloudflare:workers'] = MagicMock()


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


class TestBasicAPI:
    """Test basic API functionality"""

    def test_enhanced_worker_initialization(self, mock_env):
        """Test that EnhancedWorker can be initialized"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Verify worker was created
        assert worker is not None
        assert worker.env == mock_env
        
        # Verify services were initialized
        assert worker.auth_service is not None
        assert worker.cache_service is not None
        assert worker.monitoring is not None

    def test_auth_service_methods(self, mock_env):
        """Test that auth service has required methods"""
        from services.auth import AuthenticationService
        
        auth_service = AuthenticationService(mock_env)
        
        # Verify required methods exist
        assert hasattr(auth_service, 'validate_token')
        assert hasattr(auth_service, 'generate_tokens')
        assert hasattr(auth_service, 'refresh_access_token')
        assert hasattr(auth_service, 'revoke_token')

    def test_cache_service_methods(self, mock_env):
        """Test that cache service has required methods"""
        from services.cache import CacheService
        
        cache_service = CacheService(mock_env)
        
        # Verify required methods exist
        assert hasattr(cache_service, 'get')
        assert hasattr(cache_service, 'set')
        assert hasattr(cache_service, 'delete')
        assert hasattr(cache_service, 'get_stats')

    def test_monitoring_service_methods(self, mock_env):
        """Test that monitoring service has required methods"""
        from services.monitoring import MonitoringService
        
        monitoring_service = MonitoringService(mock_env)
        
        # Verify required methods exist
        assert hasattr(monitoring_service, 'track_business_metrics')
        assert hasattr(monitoring_service, 'get_analytics')

    @pytest.mark.asyncio
    async def test_auth_token_generation(self, mock_env):
        """Test token generation functionality"""
        from services.auth import AuthenticationService
        
        auth_service = AuthenticationService(mock_env)
        
        # Test token generation
        tokens = await auth_service.generate_tokens(
            "user_123", "vibe_coder", "test@protothrive.com"
        )
        
        # Verify tokens were generated
        assert tokens is not None
        assert "access_token" in tokens
        assert "refresh_token" in tokens
        assert "expires_in" in tokens

    @pytest.mark.asyncio
    async def test_cache_operations(self, mock_env):
        """Test basic cache operations"""
        from services.cache import CacheService
        
        cache_service = CacheService(mock_env)
        
        # Test cache set
        await cache_service.set("test_key", {"data": "test_value"}, ttl=300)
        
        # Test cache get
        result = await cache_service.get("test_key", "test")
        
        # Verify cache operations
        assert result is not None
        assert result["data"] == "test_value"

    @pytest.mark.asyncio
    async def test_monitoring_tracking(self, mock_env):
        """Test monitoring functionality"""
        from services.monitoring import MonitoringService
        
        monitoring_service = MonitoringService(mock_env)
        
        # Test business metrics tracking
        await monitoring_service.track_business_metrics("test_event", {"key": "value"})
        
        # Test analytics retrieval
        analytics = await monitoring_service.get_analytics()
        
        # Verify monitoring operations
        assert analytics is not None

    def test_database_utilities_import(self, mock_env):
        """Test that database utilities can be imported"""
        try:
            from utils.db import queryRoadmap, insertRoadmap, updateRoadmap
            assert True  # Import successful
        except ImportError:
            # Fallback to adapted utilities
            from utils.db_adapted import queryRoadmap, insertRoadmap, updateRoadmap
            assert True  # Import successful

    def test_validation_utilities_import(self, mock_env):
        """Test that validation utilities can be imported"""
        try:
            from utils.validation import validate_roadmap_body, validate_uuid
            assert True  # Import successful
        except ImportError:
            # Fallback to security utilities
            from utils.security import validate_uuid
            assert True  # Import successful

    def test_middleware_imports(self, mock_env):
        """Test that middleware can be imported"""
        from middleware.cors import CORSMiddleware
        from middleware.rate_limit import RateLimitMiddleware
        from middleware.error_handler import ErrorHandler
        
        assert CORSMiddleware is not None
        assert RateLimitMiddleware is not None
        assert ErrorHandler is not None

    def test_gateway_imports(self, mock_env):
        """Test that API gateway can be imported"""
        from gateway.api_gateway import APIGateway, Route, APIRequest, APIResponse
        
        assert APIGateway is not None
        assert Route is not None
        assert APIRequest is not None
        assert APIResponse is not None

    @pytest.mark.asyncio
    async def test_agent_coordinator_import(self, mock_env):
        """Test that agent coordinator can be imported and initialized"""
        from agent_coordinator import AgentCoordinator
        
        coordinator = AgentCoordinator(mock_env)
        
        assert coordinator is not None
        assert hasattr(coordinator, 'run_task')

    def test_services_import(self, mock_env):
        """Test that all services can be imported"""
        from services.query_optimizer import QueryOptimizer
        from services.argo_routing import ArgoSmartRoutingService
        
        assert QueryOptimizer is not None
        assert ArgoSmartRoutingService is not None

    def test_enhanced_worker_route_registration(self, mock_env):
        """Test that EnhancedWorker can register routes"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Verify API gateway was initialized
        assert worker.api_gateway is not None
        
        # Verify routes were registered
        assert len(worker.api_gateway.routes) > 0

    def test_health_check_structure(self, mock_env):
        """Test health check endpoint structure"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Verify health check method exists
        assert hasattr(worker, 'handle_health')
        assert hasattr(worker, 'handle_status')

    def test_roadmap_endpoints_structure(self, mock_env):
        """Test roadmap endpoints structure"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Verify roadmap methods exist
        assert hasattr(worker, 'handle_get_roadmaps')
        assert hasattr(worker, 'handle_create_roadmap')
        assert hasattr(worker, 'handle_get_roadmap')
        assert hasattr(worker, 'handle_update_roadmap')

    def test_snippet_endpoints_structure(self, mock_env):
        """Test snippet endpoints structure"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Verify snippet methods exist
        assert hasattr(worker, 'handle_get_snippets')
        assert hasattr(worker, 'handle_create_snippet')

    def test_agent_endpoints_structure(self, mock_env):
        """Test agent endpoints structure"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Verify agent methods exist
        assert hasattr(worker, 'handle_agent_run')

    def test_analytics_endpoints_structure(self, mock_env):
        """Test analytics endpoints structure"""
        from main_enhanced import EnhancedWorker
        
        worker = EnhancedWorker(mock_env)
        
        # Verify analytics methods exist
        assert hasattr(worker, 'handle_analytics_dashboard')


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

