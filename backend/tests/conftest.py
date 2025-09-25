# pytest configuration and global fixtures for ProtoThrive backend tests

import sys
from unittest.mock import Mock, MagicMock
import pytest

# Mock Cloudflare Workers-specific modules before any imports
class MockJS:
    Response = MagicMock()
    Request = MagicMock()
    console = MagicMock()

# Install the mock before any imports
sys.modules['js'] = MockJS()

# Mock additional Cloudflare Workers modules
sys.modules['cloudflare:workers'] = MagicMock()

# Global mock for console for compatibility
console = MagicMock()

@pytest.fixture(autouse=True)
def mock_cloudflare_env():
    """Auto-use fixture to mock Cloudflare environment for all tests"""
    # Mock environment variables and Cloudflare-specific globals
    yield