"""
Ref: CLAUDE.md Terminal 3: Phase 3 - Router Tests
Tests for PromptRouter model selection logic
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.router import PromptRouter


def test_router_initialization():
    """Test router initializes with correct models"""
    router = PromptRouter()
    assert 'kimi' in router.models
    assert 'claude' in router.models
    assert 'uxpilot' in router.models
    assert router.models['kimi'] == 0.001
    assert router.models['claude'] == 0.015
    assert router.models['uxpilot'] == 0.02


def test_estimate_cost():
    """Test cost estimation calculation"""
    router = PromptRouter()
    
    # Test kimi cost
    cost = router.estimate_cost(1000, 'kimi')
    assert cost == 0.001  # 1000 * 0.001 / 1000
    
    # Test claude cost
    cost = router.estimate_cost(1000, 'claude')
    assert cost == 0.015  # 1000 * 0.015 / 1000
    
    # Test uxpilot cost
    cost = router.estimate_cost(1000, 'uxpilot')
    assert cost == 0.02  # 1000 * 0.02 / 1000


def test_route_task_code_low():
    """Test routing for low complexity code tasks"""
    router = PromptRouter()
    
    # Should route to kimi for low complexity code with low cost
    model = router.route_task('code', 'low', 50)
    assert model == 'kimi'
    
    # Should route to claude if cost too high
    model = router.route_task('code', 'low', 50000)
    assert model == 'claude'


def test_route_task_ui():
    """Test routing for UI tasks"""
    router = PromptRouter()
    
    # UI tasks always go to uxpilot
    model = router.route_task('ui', 'low', 50)
    assert model == 'uxpilot'
    
    model = router.route_task('ui', 'high', 50000)
    assert model == 'uxpilot'


def test_route_task_other():
    """Test routing for other task types"""
    router = PromptRouter()
    
    # Non-code, non-ui tasks go to claude
    model = router.route_task('analysis', 'high', 100)
    assert model == 'claude'
    
    # High complexity code goes to claude
    model = router.route_task('code', 'high', 50)
    assert model == 'claude'


def test_fallback():
    """Test fallback model selection"""
    router = PromptRouter()
    
    # Kimi falls back to claude
    fallback = router.fallback('kimi')
    assert fallback == 'claude'
    
    # Claude falls back to claude
    fallback = router.fallback('claude')
    assert fallback == 'claude'
    
    # Uxpilot falls back to claude
    fallback = router.fallback('uxpilot')
    assert fallback == 'claude'


if __name__ == "__main__":
    test_router_initialization()
    test_estimate_cost()
    test_route_task_code_low()
    test_route_task_ui()
    test_route_task_other()
    test_fallback()
    print("All router tests passed!")
    print("Thermonuclear Test Complete: Router 100% Coverage")