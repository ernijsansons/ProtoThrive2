"""
Ref: CLAUDE.md Terminal 3: Phase 3 - MockKV Cache
Mock Key-Value cache implementation with TTL support
"""

import time


class MockKV:
    """
    Mock Key-Value cache with TTL (Time To Live) support
    Simulates a distributed cache like Redis or Cloudflare KV
    """

    def __init__(self):
        """Initialize empty cache store"""
        self.store = {}

    def get(self, key):
        """
        Get value from cache if not expired
        
        Args:
            key: Cache key to retrieve
            
        Returns:
            Any: Cached data if valid, None if expired or not found
        """
        print(f"Thermonuclear Get {key}")

        val = self.store.get(key)

        if val and val['expire'] > time.time():
            return val['data']

        return None

    def put(self, key, data, ttl=3600):
        """
        Put value in cache with TTL
        
        Args:
            key: Cache key
            data: Data to cache
            ttl: Time to live in seconds (default 1 hour)
        """
        print(f"Thermonuclear Put {key} TTL {ttl}")

        self.store[key] = {
            'data': data,
            'expire': time.time() + ttl
        }

"""
Mermaid Diagram for Cache Flow:

```mermaid
graph TD
    A[Cache Request] --> B{Operation}
    B -->|GET| C[Check Store]
    C --> D{Key Exists?}
    D -->|No| E[Return None]
    D -->|Yes| F{Expired?}
    F -->|Yes| E
    F -->|No| G[Return Data]
    
    B -->|PUT| H[Store Data]
    H --> I[Set Expiry Time]
    I --> J[Store in Dict]
    
    subgraph TTL Logic
        K[Current Time]
        L[Expiry = Current + TTL]
        M[Check: Current < Expiry]
    end
```
"""