# Ref: CLAUDE.md Section 3 - AI Core & Agent Orchestration

class MockKV:
    """Mock KV store with TTL support"""

    def __init__(self):
        self.store = {}

    def get(self, key):
        import time
        print(f"Thermonuclear Get {key}")
        val = self.store.get(key)
        if val and val['expire'] > time.time():
            return val['data']
        return None
        
    def put(self, key, data, ttl=3600):
        import time
        print(f"Thermonuclear Put {key} TTL {ttl}")
        self.store[key] = {'data': data, 'expire': time.time() + ttl}