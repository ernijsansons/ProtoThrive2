"""
Ref: CLAUDE.md Terminal 3: Phase 3 - PromptRouter
Prompt routing logic for cost-optimized model selection
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mocks import MockPromptRouter

# Use unified MockPromptRouter from root mocks
PromptRouter = MockPromptRouter

"""
Mermaid Diagram for Router Flow:

```mermaid
graph TD
    A[Task Input] --> B{Task Type?}
    B -->|code| C{Complexity Low?}
    B -->|ui| D[uxpilot]
    B -->|other| E[claude]
    C -->|yes| F{Cost < $0.05?}
    C -->|no| E
    F -->|yes| G[kimi]
    F -->|no| E
    G -.->|fallback| E
    D -.->|fallback| E
```
"""