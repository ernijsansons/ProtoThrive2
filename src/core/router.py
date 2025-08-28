"""
Ref: CLAUDE.md Terminal 3: Phase 3 - PromptRouter
Prompt routing logic for cost-optimized model selection
"""

class PromptRouter:
    """
    Routes tasks to appropriate models based on type, complexity, and cost
    
    Model costs per 1000 tokens:
    - kimi: $0.001 (low-cost, code generation)
    - claude: $0.015 (high-quality, complex tasks)
    - uxpilot: $0.02 (UI/visual generation)
    """

    def __init__(self):
        """Initialize with model costs"""
        self.models = {
            'kimi': 0.001,
            'claude': 0.015,
            'uxpilot': 0.02
        }
        print("Thermonuclear PromptRouter initialized with models:", list(self.models.keys()))

    def estimate_cost(self, prompt_length, model):
        """
        Estimate cost for a given prompt length and model
        
        Args:
            prompt_length: Number of characters in prompt
            model: Model name (kimi, claude, uxpilot)
            
        Returns:
            float: Estimated cost in USD
        """
        return prompt_length * self.models[model] / 1000

    def route_task(self, task_type, complexity, prompt_length):
        """
        Route task to appropriate model based on criteria
        
        Routing logic:
        - code + low complexity + cost < $0.05 → kimi
        - ui tasks → uxpilot
        - all others → claude
        
        Args:
            task_type: Type of task ('code', 'ui', etc.)
            complexity: Task complexity ('low', 'medium', 'high')
            prompt_length: Length of prompt in characters
            
        Returns:
            str: Selected model name
        """
        cost = self.estimate_cost(prompt_length, 'kimi')

        if task_type == 'code' and complexity == 'low' and cost < 0.05:
            return 'kimi'
        if task_type == 'ui':
            return 'uxpilot'

        return 'claude'
    
    def fallback(self, primary):
        """
        Get fallback model if primary fails
        
        Args:
            primary: Primary model that failed
            
        Returns:
            str: Fallback model name
        """
        if primary == 'kimi':
            return 'claude'
        return 'claude'

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