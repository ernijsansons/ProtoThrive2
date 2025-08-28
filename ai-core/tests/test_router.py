import pytest
import numpy as np
from src.router import PromptRouter

def test_router_initialization():
    router = PromptRouter()
    assert isinstance(router, PromptRouter)

def test_router_route_code_low_cost():
    router = PromptRouter()
    model = router.route_task('code', 'low', 50)
    assert model == 'kimi'

def test_router_route_ui_task():
    router = PromptRouter()
    model = router.route_task('ui', 'high', 2000)
    assert model == 'uxpilot'

def test_router_route_complex_code_task():
    router = PromptRouter()
    model = router.route_task('code', 'high', 10000)
    assert model == 'claude'

def test_router_fallback_kimi():
    router = PromptRouter()
    fallback_model = router.fallback('kimi')
    assert fallback_model == 'claude'

def test_router_fallback_other():
    router = PromptRouter()
    fallback_model = router.fallback('uxpilot')
    assert fallback_model == 'claude'

def test_router_estimate_cost_unknown_model():
    router = PromptRouter()
    with pytest.raises(ValueError, match="Model unknown_model not found in cost estimates."):
        router.estimate_cost(100, 'unknown_model')