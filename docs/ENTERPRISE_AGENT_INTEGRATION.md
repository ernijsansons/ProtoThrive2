# Enterprise Agent Integration Guide

## Overview
The ProtoThrive Enterprise Agent v3.4 is a sophisticated multi-domain AI orchestration system that coordinates specialized roles (Planner, Coder, Validator, Reflector, Reviewer) to deliver high-quality, production-ready outputs across various domains including software development, UI design, social media, content creation, trading, and real estate.

## Architecture

### Agent Orchestrator
The core orchestration system manages the entire workflow from task decomposition to final delivery.

**File:** `enterprise-agent/src/agent_orchestrator.py`

```python
from src.agent_orchestrator import AgentOrchestrator

# Initialize with configuration
orchestrator = AgentOrchestrator(config_path="configs/agent_config_v3.4.yaml")

# Run a coding task
result = orchestrator.run_mode(
    domain="coding",
    task="Build a REST API for user management",
    vuln_flag=False
)
```

### Multi-Role Architecture

#### 1. Planner Role
Decomposes complex tasks into actionable epics and steps.

```python
# Example planning output for a coding task
{
    "text": "1. Design API endpoints\n2. Implement authentication\n3. Add validation\n4. Write tests",
    "epics": [
        {"name": "API Design", "priority": "high"},
        {"name": "Authentication", "priority": "high"},
        {"name": "Validation", "priority": "medium"},
        {"name": "Testing", "priority": "high"}
    ],
    "model": "claude_sonnet_4"
}
```

#### 2. Coder Role
Generates implementation code based on the plan.

```python
# Coding output with source tracking
{
    "output": "# User Management API\nfrom fastapi import FastAPI...",
    "source": "llm",  # or "codex_cli"
    "model": "openai_gpt_5_codex"
}
```

#### 3. Validator Role
Validates code quality, syntax, and coverage.

```python
# Validation results
{
    "passes": True,
    "coverage": 0.95,
    "issues": [],
    "syntax_valid": True
}
```

#### 4. Reflector Role
Analyzes failures and suggests improvements.

```python
# Reflection analysis with iterations
{
    "analysis": "Code lacks error handling in user creation endpoint",
    "fixes": ["Add try-catch blocks", "Implement input validation"],
    "selected_fix": 0,
    "revised_output": "# Improved code with error handling...",
    "confidence": 0.85,
    "iterations": 2,
    "halt": False
}
```

#### 5. Reviewer Role
Provides final quality assessment and confidence scoring.

```python
# Review results
{
    "confidence": 0.92,
    "scores": [0.9, 0.85, 0.95],
    "models": ["claude_opus_4", "openai_gpt_5"],
    "rationale": "High-quality implementation with proper error handling"
}
```

## Domain Support

### 1. Coding Domain
Full-stack software development with testing and documentation.

```python
result = orchestrator.run_mode(
    domain="coding", 
    task="Create a FastAPI microservice with PostgreSQL integration"
)

# Output includes:
# - Complete application code
# - Database schemas
# - API documentation
# - Test suites
# - Deployment configurations
```

**Key Features:**
- Multi-language support (Python, JavaScript, Go, Rust)
- Framework expertise (FastAPI, React, Next.js)
- Database integration
- Testing coverage >97%
- Security best practices

### 2. UI Domain
Modern frontend development with accessibility and performance focus.

```python
result = orchestrator.run_mode(
    domain="ui", 
    task="Design an analytics dashboard with dark mode"
)

# Output includes:
# - React/Next.js components
# - Tailwind CSS styling  
# - 3D visualizations (Three.js/Spline)
# - Accessibility features (WCAG 2.1 AA)
# - Responsive design
# - Performance optimizations
```

**Thermonuclear UI Features:**
- Neon color schemes with glowing effects
- 3D depth and micro-interactions
- Advanced animations and transitions
- Component libraries (shadcn/ui, Mantine)
- Mobile-first responsive design

### 3. Social Media Domain
Campaign planning and content creation.

```python
result = orchestrator.run_mode(
    domain="social_media", 
    task="Launch campaign for B2B SaaS product"
)

# Output includes:
# - Campaign strategy
# - Platform-specific content
# - Posting schedules
# - Engagement metrics
# - A/B testing plans
```

### 4. Content Domain
SEO-optimized content creation and structuring.

```python
result = orchestrator.run_mode(
    domain="content", 
    task="Write technical blog series on microservices"
)

# Output includes:
# - Article outlines
# - SEO-optimized content
# - Code examples
# - Meta descriptions
# - Internal linking strategy
```

### 5. Trading Domain
Financial analysis and algorithmic trading strategies.

```python
result = orchestrator.run_mode(
    domain="trading", 
    task="Develop momentum trading strategy for crypto"
)

# Output includes:
# - Strategy algorithms
# - Backtesting code
# - Risk management rules
# - Performance metrics
# - Alert systems
```

### 6. Real Estate Domain
Property analysis and investment strategies.

```python
result = orchestrator.run_mode(
    domain="real_estate", 
    task="Analyze rental property investment opportunities"
)

# Output includes:
# - Market analysis
# - Cash flow projections
# - Comparative market analysis
# - Investment recommendations
# - Risk assessments
```

## Configuration

### Agent Configuration
**File:** `configs/agent_config_v3.4.yaml`

```yaml
enterprise_coding_agent:
  orchestration:
    max_iterations: 5
    confidence_threshold: 0.8
    runtime_optimizer:
      cost_limit: 2.0
      performance_target: 0.95
      
  memory:
    retention_hours: 24
    max_entries: 1000
    
  governance:
    quality_gates: true
    security_checks: true
    compliance_validation: true
    
  prompt_enhancements:
    planner: "Focus on enterprise-grade solutions with scalability in mind."
    coder: "Follow SOLID principles and implement comprehensive error handling."
    validator: "Ensure 97%+ test coverage and security best practices."
    
  cli_enhancements:
    coder: "--optimize-performance --security-first"
```

### Domain-Specific Configuration
**Files:** `configs/domains/{domain}.yaml`

```yaml
# coding.yaml
domain: coding
frameworks:
  - fastapi
  - react
  - nextjs
  - tailwindcss
languages:
  - python
  - typescript
  - javascript
testing_frameworks:
  - pytest
  - jest
  - playwright
security_tools:
  - bandit
  - semgrep
  - snyk
quality_thresholds:
  coverage: 0.97
  complexity: 10
  maintainability: 8.0
```

## Integration with ProtoThrive Backend

### API Integration
The backend can communicate with the Enterprise Agent through HTTP endpoints.

```python
# backend/src/agent_coordinator.py
import asyncio
import httpx
from enterprise_agent import AgentOrchestrator

class AgentCoordinator:
    def __init__(self):
        self.orchestrator = AgentOrchestrator()
        self.fallback_enabled = True
        
    async def process_roadmap_task(self, roadmap_data: dict) -> dict:
        """Process roadmap using Enterprise Agent with fallback."""
        try:
            # Extract task from roadmap
            task = self.extract_task_from_roadmap(roadmap_data)
            
            # Run enterprise agent
            result = self.orchestrator.run_mode(
                domain="coding",
                task=task,
                vuln_flag=roadmap_data.get("security_scan", False)
            )
            
            # Transform result for API response
            return self.transform_agent_result(result)
            
        except Exception as e:
            if self.fallback_enabled:
                return await self.fallback_processing(roadmap_data)
            raise e
```

### Backend API Endpoint
```typescript
// backend/src/index.ts - Agent integration endpoint
app.post('/api/agent/run', async (c) => {
  try {
    const body = await c.req.json();
    const {
      task,
      domain = 'coding',
      context = {},
      budget = 0.40,
      mode = 'enterprise'
    } = body;

    // Run Enterprise Agent
    const agentResult = await runEnterpriseAgent({
      task,
      domain,
      context,
      budget,
      vuln_flag: context.security_scan || false
    });

    return c.json({
      success: true,
      result: agentResult,
      agent_used: 'enterprise_v3.4',
      confidence: agentResult.confidence,
      cost: agentResult.cost_summary.total_cost,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Agent execution failed:', error);
    return c.json({
      error: 'Agent execution failed',
      code: 'AGENT-500',
      message: error.message
    }, 500);
  }
});
```

## Cost Management

### Budget Controls
The agent includes sophisticated cost management and tracking.

```python
# Cost estimation and tracking
class CostEstimator:
    def __init__(self, config):
        self.budget_limit = config.get("cost_limit", 2.0)
        self.current_cost = 0.0
        
    def estimate(self, complexity: int, domain: str) -> float:
        """Estimate cost based on task complexity and domain."""
        base_cost = complexity / 1000.0 * 0.05
        domain_multiplier = {
            "coding": 1.2,
            "ui": 1.5,  # Higher due to visual generation
            "trading": 2.0,  # Complex analysis required
            "social_media": 0.8,
            "content": 0.6,
            "real_estate": 1.0
        }
        return base_cost * domain_multiplier.get(domain, 1.0)
        
    def track(self, tokens: int, role: str, operation: str, **extra):
        """Track actual costs during execution."""
        cost = tokens * 2e-6  # Approximate cost per token
        self.current_cost += cost
        
        if self.current_cost > self.budget_limit:
            raise BudgetExceededException(
                f"Budget limit {self.budget_limit} exceeded"
            )
```

### Model Routing
Intelligent routing to optimize cost and performance.

```python
def route_to_model(self, text: str, domain: str, vuln_flag: bool = False) -> str:
    """Route requests to appropriate model based on cost and requirements."""
    complexity = len(text or "")
    cost = self.cost_estimator.estimate(complexity, domain)
    
    # Security-sensitive tasks use premium models
    if vuln_flag and self.anthropic_client:
        return "claude_opus_4"
    
    # Low-cost tasks can use Codex CLI
    if cost <= 0.05 and self._codex_available:
        return "openai_gpt_5_codex"
    
    # Default routing based on availability
    if self.openai_client:
        return "openai_gpt_5"
    elif self.anthropic_client:
        return "claude_sonnet_4"
    elif self.gemini_client:
        return "gemini-2.5-pro"
    
    return ""  # Fallback to offline mode
```

## Safety and Governance

### Security Features
- PII scrubbing in all outputs
- Vulnerability scanning for security-sensitive tasks
- Input validation and sanitization
- Safe execution environments

```python
# PII scrubbing example
from src.utils.safety import scrub_pii

def _call_model(self, model: str, prompt: str, role: str, operation: str) -> str:
    # ... model call logic ...
    output = model_response.content
    
    # Always scrub PII from outputs
    return scrub_pii(output)
```

### Governance Checks
- Quality gate enforcement
- Compliance validation
- Human-in-the-loop (HITL) escalation
- Audit trail maintenance

```python
class GovernanceChecker:
    def check(self, result: dict) -> bool:
        """Validate result against governance policies."""
        
        # Check quality thresholds
        confidence = result.get("confidence", 0.0)
        if confidence < 0.8:
            return False
            
        # Security validation for sensitive domains
        if result.get("domain") in ["trading", "real_estate"]:
            return self.security_scan(result)
            
        return True
        
    def hitl_check(self, risk_level: str, state: dict) -> bool:
        """Escalate to human review for high-risk scenarios."""
        if risk_level == "high":
            # Log escalation request
            logger.warning("HITL escalation requested", extra={
                "domain": state.get("domain"),
                "confidence": state.get("confidence"),
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # In production, this would trigger actual human review
            return True
            
        return False
```

## Performance and Monitoring

### Telemetry
Comprehensive tracking of agent performance and costs.

```python
from src.utils.telemetry import record_event, record_metric

# Event tracking
record_event("agent.run_completed", 
    domain=domain,
    confidence=result.confidence,
    cost=result.cost_summary.total_cost
)

# Metric tracking
record_metric("review.confidence", 
    state["confidence"], 
    domain=state.get("domain")
)
```

### Memory Management
Efficient context management and pruning.

```python
class MemoryStore:
    def __init__(self, config):
        self.retention_hours = config.get("retention_hours", 24)
        self.max_entries = config.get("max_entries", 1000)
        
    def store(self, scope: str, key: str, value: Any) -> None:
        """Store data with automatic expiration."""
        self._data.setdefault(scope, {})[key] = {
            "value": value,
            "timestamp": datetime.utcnow(),
            "access_count": 0
        }
        
    def prune(self) -> None:
        """Remove expired and least-accessed entries."""
        now = datetime.utcnow()
        cutoff = now - timedelta(hours=self.retention_hours)
        
        # Remove expired entries
        for scope in list(self._data.keys()):
            for key in list(self._data[scope].keys()):
                entry = self._data[scope][key]
                if entry["timestamp"] < cutoff:
                    del self._data[scope][key]
```

## Development and Testing

### Running Tests
```bash
# Full test suite
make test

# Specific domain tests
pytest tests/unit/test_roles.py -k coding

# Integration tests with real API calls
pytest tests/integration/ --api-tests

# Benchmark tests
python benchmarks/run_benchmarks.py
```

### Development Setup
```bash
# Install dependencies
make setup

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run demo
make run --domain=coding --input="Build a todo app with FastAPI"
```

### Custom Domain Development
```yaml
# Create configs/domains/custom.yaml
domain: custom
description: "Custom domain for specialized tasks"
models:
  preferred: "claude_sonnet_4"
  fallback: "openai_gpt_5"
quality_thresholds:
  confidence: 0.85
  coverage: 0.90
prompts:
  planner: "Custom planning instructions..."
  coder: "Custom coding guidelines..."
```

## Error Handling and Fallbacks

### Graceful Degradation
```python
class AgentOrchestrator:
    def run_mode(self, domain: str, task: str, vuln_flag: bool = False) -> dict:
        try:
            # Primary execution path
            if any([self.openai_client, self.anthropic_client, self.gemini_client]):
                return self.graph.invoke(initial_state)
            else:
                # Fallback to offline pipeline
                return self._run_offline_pipeline(initial_state)
                
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            
            # Fallback with minimal functionality
            return {
                "code": f"# Error: {e}\n# Fallback stub implementation",
                "confidence": 0.1,
                "status": "degraded",
                "error": str(e)
            }
```

### Retry Logic
```python
async def retry_with_backoff(func, max_retries=3):
    """Retry function with exponential backoff."""
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            
            wait_time = 2 ** attempt
            logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s")
            await asyncio.sleep(wait_time)
```

## Integration Examples

### Frontend Integration
```typescript
// Frontend API call to enterprise agent
const generateRoadmapWithAI = async (requirements: string) => {
  const response = await fetch('/api/agent/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      task: `Generate roadmap for: ${requirements}`,
      domain: 'coding',
      context: {
        framework: 'nextjs',
        database: 'postgresql',
        security_scan: true
      },
      budget: 1.0
    })
  });
  
  const result = await response.json();
  return result;
};
```

### Workflow Automation
```javascript
// n8n workflow integration
{
  "nodes": [
    {
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$env.BACKEND_URL}}/api/agent/run",
        "headers": {
          "Authorization": "Bearer {{$env.API_TOKEN}}"
        },
        "body": {
          "task": "{{$json.task}}",
          "domain": "{{$json.domain}}",
          "budget": 0.5
        }
      }
    }
  ]
}
```

This comprehensive integration guide provides everything needed to effectively utilize the Enterprise Agent v3.4 within the ProtoThrive ecosystem, from basic usage to advanced customization and monitoring.