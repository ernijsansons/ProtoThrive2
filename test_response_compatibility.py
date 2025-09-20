#!/usr/bin/env python3
"""
Test that agent coordinator responses match frontend expectations
"""
import asyncio
import json
import sys
import os

# Add backend src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'src'))

from agent_coordinator import AgentCoordinator, AgentResult

class MockAdapter:
    """Mock adapter for testing"""
    def __init__(self, name, result, estimate=0.05):
        self.name = name
        self._result = result
        self._estimate = estimate
    
    def estimate_cost(self, request):
        return self._estimate
    
    async def run(self, request, remaining_budget, metadata):
        return self._result

def validate_agent_report_format(agent_report):
    """Validate that agent report matches frontend expectations"""
    print("🔍 Validating agent report format...")
    
    # Required fields for frontend
    required_fields = ['agent', 'confidence', 'cost', 'fallback_used', 'trace']
    missing_fields = [field for field in required_fields if field not in agent_report]
    
    if missing_fields:
        print(f"❌ Missing required fields: {missing_fields}")
        return False
    
    # Validate cost structure
    cost_fields = ['estimate', 'actual', 'consumed', 'remaining']
    missing_cost_fields = [field for field in cost_fields if field not in agent_report['cost']]
    
    if missing_cost_fields:
        print(f"❌ Missing cost fields: {missing_cost_fields}")
        return False
    
    # Validate trace structure
    if not isinstance(agent_report['trace'], list):
        print("❌ Trace must be a list")
        return False
    
    for i, trace_item in enumerate(agent_report['trace']):
        trace_fields = ['agent', 'success', 'confidence', 'cost']
        missing_trace_fields = [field for field in trace_fields if field not in trace_item]
        
        if missing_trace_fields:
            print(f"❌ Trace item {i} missing fields: {missing_trace_fields}")
            return False
    
    print("✅ Agent report format is valid")
    return True

def validate_api_response_format(api_response):
    """Validate that API response matches frontend expectations"""
    print("🔍 Validating API response format...")
    
    # Check if response has agent_report field
    if 'agent_report' in api_response:
        return validate_agent_report_format(api_response['agent_report'])
    
    # If no agent_report, check if it's a direct agent report
    return validate_agent_report_format(api_response)

async def test_response_formats():
    """Test various response formats"""
    print("📡 Testing Response Format Compatibility...")
    
    env = {
        "AGENT_MODE": "fallback",
        "AGENT_BUDGET_DEFAULT": "0.30",
        "AGENT_BUDGET_MAX": "0.50",
        "AGENT_CONFIDENCE_THRESHOLD": "0.8"
    }
    
    coordinator = AgentCoordinator(env)
    
    # Test 1: Single mode success
    print("\n1. Testing single mode success response...")
    single_result = AgentResult(
        success=True,
        output={"analysis": "Single agent analysis", "recommendations": ["Do this", "Try that"]},
        confidence=0.85,
        cost_estimate=0.12,
        cost_actual=0.10,
        validation={},
        agent="enterprise"
    )
    
    coordinator.primary_adapter = MockAdapter("enterprise", single_result, 0.12)
    
    outcome = await coordinator.run_task(
        "Analyze this roadmap",
        context={"json_graph": '{"nodes":[{"id":"n1","label":"Start"}],"edges":[]}'},
        budget=0.30,
        mode_override="single"
    )
    
    # Convert to API response format
    api_response = {
        "success": outcome.result.success,
        "agent": outcome.result.agent,
        "confidence": outcome.result.confidence,
        "cost": {
            "estimate": outcome.result.cost_estimate,
            "actual": outcome.result.cost_actual,
            "consumed": outcome.budget_consumed,
            "remaining": outcome.budget_remaining,
        },
        "output": outcome.result.output,
        "fallback_used": outcome.fallback_used,
        "trace": [
            {
                "agent": item.agent,
                "success": item.success,
                "confidence": item.confidence,
                "cost": item.cost_actual,
                "error": getattr(item, 'error', None),
            }
            for item in outcome.trace
        ],
    }
    
    if not validate_api_response_format(api_response):
        return False
    
    print(f"   - Agent: {api_response['agent']}")
    print(f"   - Confidence: {api_response['confidence']}")
    print(f"   - Cost: ${api_response['cost']['actual']:.3f}")
    print(f"   - Trace entries: {len(api_response['trace'])}")
    
    # Test 2: Fallback mode with both agents
    print("\n2. Testing fallback mode response...")
    env["AGENT_MODE"] = "fallback"
    coordinator = AgentCoordinator(env)
    
    # Low confidence primary
    primary_result = AgentResult(
        success=True,
        output={"analysis": "Low confidence analysis"},
        confidence=0.3,
        cost_estimate=0.12,
        cost_actual=0.12,
        validation={},
        agent="enterprise"
    )
    
    # High confidence secondary
    secondary_result = AgentResult(
        success=True,
        output={"analysis": "High confidence analysis", "score": 0.9},
        confidence=0.9,
        cost_estimate=0.02,
        cost_actual=0.02,
        validation={},
        agent="lightweight"
    )
    
    coordinator.primary_adapter = MockAdapter("enterprise", primary_result, 0.12)
    coordinator.secondary_adapter = MockAdapter("lightweight", secondary_result, 0.02)
    
    outcome = await coordinator.run_task(
        "Analyze this roadmap",
        context={"json_graph": '{"nodes":[{"id":"n1","label":"Start"}],"edges":[]}'},
        budget=0.30,
        mode_override="fallback"
    )
    
    # Convert to API response format
    api_response = {
        "success": outcome.result.success,
        "agent": outcome.result.agent,
        "confidence": outcome.result.confidence,
        "cost": {
            "estimate": outcome.result.cost_estimate,
            "actual": outcome.result.cost_actual,
            "consumed": outcome.budget_consumed,
            "remaining": outcome.budget_remaining,
        },
        "output": outcome.result.output,
        "fallback_used": outcome.fallback_used,
        "trace": [
            {
                "agent": item.agent,
                "success": item.success,
                "confidence": item.confidence,
                "cost": item.cost_actual,
                "error": getattr(item, 'error', None),
            }
            for item in outcome.trace
        ],
    }
    
    if not validate_api_response_format(api_response):
        return False
    
    print(f"   - Agent: {api_response['agent']}")
    print(f"   - Confidence: {api_response['confidence']}")
    print(f"   - Fallback used: {api_response['fallback_used']}")
    print(f"   - Trace entries: {len(api_response['trace'])}")
    print(f"   - Total cost: ${api_response['cost']['consumed']:.3f}")
    
    # Test 3: Error response format
    print("\n3. Testing error response format...")
    error_response = {
        "success": False,
        "error": "Agent execution failed",
        "code": "AGENT-500",
        "metadata": {"detail": "Network timeout"},
        "agent_report": {
            "agent": "error",
            "confidence": 0,
            "cost": {
                "estimate": 0,
                "actual": 0,
                "consumed": 0,
                "remaining": 0
            },
            "fallback_used": False,
            "trace": [],
            "error": "Agent execution failed"
        }
    }
    
    if not validate_api_response_format(error_response):
        return False
    
    print(f"   - Error: {error_response['error']}")
    print(f"   - Code: {error_response['code']}")
    print(f"   - Agent report present: {'agent_report' in error_response}")
    
    return True

async def test_frontend_integration_scenarios():
    """Test scenarios that the frontend will encounter"""
    print("\n🎯 Testing Frontend Integration Scenarios...")
    
    # Scenario 1: Roadmap with agent report
    print("\n1. Testing roadmap response with agent report...")
    roadmap_response = {
        "json_graph": '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}}],"edges":[]}',
        "thrive_score": 0.82,
        "user": {"role": "engineer"},
        "agent_report": {
            "agent": "enterprise",
            "confidence": 0.85,
            "cost": {
                "estimate": 0.12,
                "actual": 0.10,
                "consumed": 0.10,
                "remaining": 0.20
            },
            "fallback_used": False,
            "trace": [
                {
                    "agent": "enterprise",
                    "success": True,
                    "confidence": 0.85,
                    "cost": 0.10
                }
            ]
        }
    }
    
    if not validate_api_response_format(roadmap_response):
        return False
    
    print("   ✅ Roadmap response with agent report is valid")
    
    # Scenario 2: Agent analysis API response
    print("\n2. Testing agent analysis API response...")
    agent_analysis_response = {
        "agent_report": {
            "agent": "lightweight",
            "confidence": 0.9,
            "cost": {
                "estimate": 0.02,
                "actual": 0.02,
                "consumed": 0.02,
                "remaining": 0.28
            },
            "fallback_used": True,
            "trace": [
                {
                    "agent": "enterprise",
                    "success": True,
                    "confidence": 0.3,
                    "cost": 0.12
                },
                {
                    "agent": "lightweight",
                    "success": True,
                    "confidence": 0.9,
                    "cost": 0.02
                }
            ]
        }
    }
    
    if not validate_api_response_format(agent_analysis_response):
        return False
    
    print("   ✅ Agent analysis API response is valid")
    
    # Scenario 3: Error response
    print("\n3. Testing error response...")
    error_response = {
        "error": "Internal server error",
        "code": "SERVER-500"
    }
    
    # Error responses don't need agent_report validation
    required_error_fields = ['error', 'code']
    missing_error_fields = [field for field in required_error_fields if field not in error_response]
    
    if missing_error_fields:
        print(f"   ❌ Error response missing fields: {missing_error_fields}")
        return False
    
    print("   ✅ Error response is valid")
    
    return True

async def main():
    """Run all response compatibility tests"""
    print("🔗 Starting Response Compatibility Tests...")
    print("=" * 50)
    
    # Test response formats
    format_success = await test_response_formats()
    
    # Test frontend integration scenarios
    integration_success = await test_frontend_integration_scenarios()
    
    print("\n" + "=" * 50)
    if format_success and integration_success:
        print("🎉 ALL RESPONSE COMPATIBILITY TESTS PASSED!")
        print("✅ Agent coordinator responses match frontend expectations")
        print("✅ API response formats are consistent")
        print("✅ Error responses are properly structured")
        print("✅ Frontend integration scenarios are supported")
        return True
    else:
        print("❌ SOME COMPATIBILITY TESTS FAILED!")
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
