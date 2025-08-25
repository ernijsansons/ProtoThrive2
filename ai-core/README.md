# AI Core & Agent Orchestration

Ref: CLAUDE.md Terminal 3: Phase 3

## Overview

This module implements the AI foundation for ProtoThrive with:
- **PromptRouter**: Cost-optimized model selection (Kimi/Claude/uxpilot)
- **MockPinecone**: RAG vector storage with 50 dummy snippets
- **CrewAI Agents**: Planner, Coder, and Auditor agents
- **MockKV**: Cache with TTL support
- **Orchestrator**: Coordinates all components

## Architecture

```
orchestrator.py
    ├── PlannerAgent (decompose graph → tasks)
    ├── PromptRouter (select model by cost/type)
    ├── MockPinecone (search code snippets)
    ├── MockKV (cache results)
    ├── CoderAgent (generate code)
    └── AuditorAgent (validate output)
```

## Installation

```bash
# Using Poetry (recommended)
poetry install

# Or using pip
pip install -r requirements.txt
```

## Usage

```python
from src.orchestrator import orchestrate

# Process a roadmap
json_graph = '{"nodes":[...], "edges":[...]}'
outputs = orchestrate(json_graph)
```

## Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=src --cov-report=term-missing

# Run pylint
pylint src/*.py --score=y
```

## Model Routing Logic

- **Kimi ($0.001/1K tokens)**: Low complexity code tasks under $0.05
- **uxpilot ($0.02/1K tokens)**: All UI generation tasks
- **Claude ($0.015/1K tokens)**: Complex tasks and fallback

## Dummy Data

Uses deterministic dummy data from `mocks.py`:
- User: uuid-thermo-1
- Roadmap: 3 nodes, 2 edges
- Snippets: 50 alternating ui/code

## Thermonuclear Features

- All operations log with "Thermonuclear" prefix
- 0 external API calls (fully mocked)
- Deterministic behavior (fixed seeds)
- >95% test coverage target
- Pylint score >9/10

## Phase 3 Complete
- ✅ Router with cost optimization
- ✅ RAG with vector similarity
- ✅ Agents with task processing
- ✅ Cache with TTL
- ✅ Full orchestration
- ✅ Comprehensive tests
- ✅ 0 errors