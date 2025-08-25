"""
Ref: CLAUDE.md Thermonuclear Unified Mocks - All Phases Consolidated
ProtoThrive Root mocks.py - Complete Python Mock Library
Generated: 2025-08-24 by Thermonuclear Integration Terminal
"""

import json
import time
import uuid
import numpy as np
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timezone

# ======================
# AI CORE MOCKS (From ai-core/src/*)
# ======================

def mock_api_call(endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock external API calls for AI services
    Ref: CLAUDE.md Global Configs & Mocks - AI Phase
    """
    print(f"THERMONUCLEAR MOCK CALL: {endpoint} - Payload: {payload}")
    
    # Simulate different responses based on endpoint
    if 'claude' in endpoint.lower():
        return {
            'success': True,
            'data': '// Thermonuclear Claude Response\nconsole.log("AI generated with Claude");',
            'model': 'claude-3-sonnet',
            'tokens': 150,
            'cost': 0.002
        }
    elif 'kimi' in endpoint.lower():
        return {
            'success': True,
            'data': '// Thermonuclear Kimi Response\nfunction thermoFunction() { return "kimi"; }',
            'model': 'kimi-chat',
            'tokens': 75,
            'cost': 0.001
        }
    elif 'uxpilot' in endpoint.lower():
        return {
            'success': True,
            'data': {
                'ui_preview': 'neon_ui_thermo.png',
                'css': 'background: linear-gradient(45deg, #00ffff, #ff00ff);',
                'html': '<div class="thermo-neon">Thermonuclear UI</div>'
            },
            'model': 'uxpilot-ai',
            'cost': 0.02
        }
    else:
        return {
            'success': True,
            'data': 'thermo_mock_response',
            'id': f'uuid-thermo-mock-{uuid.uuid4().hex[:8]}'
        }

def mock_db_query(query: str, binds: Optional[List[Any]] = None) -> List[Dict[str, Any]]:
    """
    Mock database queries for AI operations
    Ref: CLAUDE.md Global Configs & Mocks - AI Phase
    """
    print(f"THERMONUCLEAR MOCK DB: {query} - Binds: {binds}")
    
    if 'roadmap' in query.lower():
        return [{
            'id': 'uuid-thermo',
            'user_id': 'uuid-thermo-1',
            'json_graph': '{"nodes":[{"id":"n1","label":"Thermo Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
            'vibe_mode': True,
            'thrive_score': 0.45,
            'status': 'draft'
        }]
    elif 'snippet' in query.lower():
        return [
            {
                'id': f'sn-thermo-{i}',
                'category': ['ui', 'auth', 'deploy', 'api'][i % 4],
                'code': f'console.log("Thermo Snippet {i}");',
                'ui_preview_url': 'mock_neon.png',
                'version': 1
            }
            for i in range(50)
        ]
    else:
        return [{'id': 'mock-result', 'data': 'thermo_mock'}]

class MockPinecone:
    """
    Mock implementation of Pinecone vector database
    From ai-core/src/rag.py - Ref: CLAUDE.md Terminal 3: Phase 3 - MockPinecone RAG
    """

    def __init__(self):
        """Initialize with 50 dummy snippets as specified"""
        self.index = {}

        # Generate 50 dummy snippets with alternating categories
        self.dummy_snippets = []
        for i in range(50):
            snippet = {
                'id': f'sn-{i}',
                'vector': [0.1 * i] * 768,  # 768-dimensional vector (standard embedding size)
                'meta': {
                    'category': 'ui' if i % 2 else 'code',
                    'snippet': f'console.log("Thermo Snippet {i}");'
                }
            }
            self.dummy_snippets.append(snippet)

        # Upsert all dummy snippets
        for snippet in self.dummy_snippets:
            self.upsert(snippet['id'], snippet['vector'], snippet['meta'])

    def upsert(self, snippet_id, vector, metadata):
        """
        Insert or update a vector in the index

        Args:
            snippet_id: Unique identifier for the vector
            vector: 768-dimensional numpy array
            metadata: Dictionary with snippet information
        """
        print(f"Thermonuclear Upsert {snippet_id}")
        self.index[snippet_id] = {
            'vector': vector,
            'meta': metadata
        }

    def query(self, query_vec, top_k=3, threshold=0.8):
        """
        Query for similar vectors using cosine similarity

        Args:
            query_vec: Query vector (768-dimensional)
            top_k: Number of top results to return
            threshold: Minimum similarity score threshold

        Returns:
            list: Top matching snippets sorted by score
        """
        matches = []

        for k, v in self.index.items():
            # Calculate cosine similarity
            dot_product = np.dot(query_vec, v['vector'])
            norm_query = np.linalg.norm(query_vec)
            norm_vector = np.linalg.norm(v['vector'])

            # Avoid division by zero
            if norm_query > 0 and norm_vector > 0:
                score = dot_product / (norm_query * norm_vector)
            else:
                score = 0

            if score > threshold:
                matches.append({
                    'id': k,
                    'score': score,
                    'snippet': v['meta']['snippet']
                })

        # Sort by score descending and return top K
        sorted_matches = sorted(matches, key=lambda x: x['score'], reverse=True)
        return sorted_matches[:top_k]


class MockKV:
    """
    Mock Key-Value cache with TTL (Time To Live) support
    From ai-core/src/cache.py - Ref: CLAUDE.md Terminal 3: Phase 3 - MockKV Cache
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


class MockPromptRouter:
    """
    Mock prompt router for model selection
    From ai-core/src/router.py - Routes tasks to appropriate models based on type, complexity, and cost
    """

    def __init__(self):
        self.models = {
            'kimi': 0.001,      # Cost per 1K tokens
            'claude': 0.015,
            'uxpilot': 0.02
        }
        print(f"Thermonuclear PromptRouter initialized with models: {list(self.models.keys())}")

    def estimate_cost(self, prompt_length: int, model: str) -> float:
        """Estimate cost for prompt with given model"""
        return prompt_length * self.models[model] / 1000

    def route_task(self, task_type: str, complexity: str, prompt_length: int) -> str:
        """Route task to appropriate model based on type and complexity with cost checking"""
        print(f"Thermonuclear AI Router: Evaluating task {task_type}/{complexity} with prompt length {prompt_length}")
        
        # Calculate costs for all models
        cost_kimi = self.estimate_cost(prompt_length, 'kimi')
        cost_claude = self.estimate_cost(prompt_length, 'claude')
        cost_uxpilot = self.estimate_cost(prompt_length, 'uxpilot')
        
        print(f"Thermonuclear Routing: Task {task_type}/{complexity} - Costs: kimi=${cost_kimi:.4f}, claude=${cost_claude:.4f}, uxpilot=${cost_uxpilot:.4f}")
        
        # Cost check integration - ensure task doesn't exceed budget
        try:
            current_session_cost = 0.02  # Mock session tracking
            selected_cost = cost_kimi if task_type == 'code' and complexity == 'low' else (cost_uxpilot if task_type == 'ui' else cost_claude)
            
            # Use the checkBudget function from this same file
            total = current_session_cost + selected_cost
            if total > 0.10:
                raise Exception(f"BUDGET-429: Task cost ${total:.4f} exceeds limit $0.10")
            
            print(f"Thermonuclear Cost Check: Task cost ${selected_cost:.4f} within budget")
        except Exception as e:
            print(f"Thermonuclear Cost Check: Budget exceeded - {e}")
            # Fallback to cheapest option
            return 'kimi'

        # Route based on task type and cost efficiency
        if task_type == 'code' and complexity == 'low' and cost_kimi < 0.05:
            selected_model = 'kimi'
        elif task_type == 'ui':
            selected_model = 'uxpilot'
        else:
            selected_model = 'claude'
            
        print(f"Thermonuclear Router: Selected model '{selected_model}' for {task_type} task")
        return selected_model

    def fallback(self, primary: str) -> str:
        """Get fallback model for primary choice"""
        if primary == 'kimi':
            return 'claude'
        return 'claude'


# Legacy aliases for backward compatibility
MockPineconeIndex = MockPinecone
MockKVStore = MockKV

# ======================
# AUTOMATION MOCKS
# ======================

def mock_workflow_execution(workflow_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Mock n8n workflow execution"""
    print(f"THERMONUCLEAR MOCK WORKFLOW: {workflow_id} - Payload: {payload}")
    
    return {
        'success': True,
        'execution_id': f'exec-thermo-{uuid.uuid4().hex[:8]}',
        'status': 'completed',
        'outputs': ['task_completed', 'notification_sent', 'metrics_updated'],
        'duration_ms': 2500
    }

def mock_deploy_trigger(code: str, target: str = 'vercel') -> Dict[str, Any]:
    """Mock deployment trigger"""
    print(f"THERMONUCLEAR MOCK DEPLOY: {target} - Code length: {len(code)}")
    
    return {
        'success': True,
        'deployment_id': f'deploy-thermo-{uuid.uuid4().hex[:8]}',
        'url': f'https://proto-thermo-{uuid.uuid4().hex[:6]}.vercel.app',
        'status': 'ready'
    }

# ======================
# SECURITY MOCKS
# ======================

def mock_jwt_validation(token: str) -> Dict[str, Any]:
    """Mock JWT token validation"""
    print(f"THERMONUCLEAR MOCK JWT: Validating token")
    
    if token and 'mock' in token:
        return {
            'valid': True,
            'payload': {
                'id': 'uuid-thermo-1',
                'role': 'vibe_coder',
                'email': 'test@proto.com',
                'exp': int(time.time()) + 3600  # 1 hour from now
            }
        }
    return {'valid': False}

class MockVault:
    """Mock vault for secret management"""
    
    def __init__(self):
        self.store = {
            'claude_key': 'sk-ant-mock_claude_thermo',
            'kimi_key': 'mock_kimi_nuclear',
            'uxpilot_key': 'mock_ux_thermo',
            'jwt_secret': 'mock_jwt_secret_thermonuclear'
        }
        self.rotated = time.time()
    
    def get(self, key: str) -> Optional[str]:
        """Get secret from mock vault"""
        print(f"Thermonuclear Get {key}")
        return self.store.get(key)
    
    def put(self, key: str, value: str):
        """Put secret into mock vault"""
        print(f"Thermonuclear Put {key}")
        self.store[key] = value
        self.rotated = time.time()
    
    def rotate(self):
        """Rotate all keys in mock vault"""
        print("Thermonuclear Rotate Keys")
        for key in self.store:
            self.store[key] = f"rotated_{self.store[key]}_{int(time.time())}"
        self.rotated = time.time()

# ======================
# UTILITY FUNCTIONS
# ======================

def calculate_thrive_score(logs: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculate Thrive Score from agent logs
    Ref: CLAUDE.md Global Dummy Data & Thrive Score Formula
    """
    if not logs:
        return {'score': 0.0, 'status': 'gray'}
    
    total = len(logs)
    success_count = len([l for l in logs if l.get('status') == 'success'])
    ui_count = len([l for l in logs if l.get('type') == 'ui'])
    fail_count = len([l for l in logs if l.get('status') == 'fail'])
    
    completion = success_count / total * 0.6
    ui_polish = ui_count / total * 0.3
    risk = 1 - (fail_count / total) * 0.1
    
    score = completion + ui_polish + risk
    status = 'neon' if score > 0.5 else 'gray'
    
    print(f"Thermonuclear Thrive Score: {score:.2f} - Status: {status}")
    
    return {
        'score': round(score, 2),
        'status': status,
        'breakdown': {
            'completion': completion,
            'ui_polish': ui_polish,
            'risk': risk
        }
    }

def check_budget(current_cost: float, additional_cost: float, limit: float = 0.10) -> bool:
    """Check if task cost is within budget"""
    total = current_cost + additional_cost
    print(f"Thermonuclear Budget: {total:.4f}")
    
    if total > limit:
        raise Exception(f'BUDGET-429: Task cost ${total:.4f} exceeds limit ${limit}')
    
    return True

def mock_compliance_delete(user_id: str, soft: bool = True) -> Dict[str, Any]:
    """Mock GDPR compliant user deletion"""
    if soft:
        print(f"Thermonuclear Soft Delete {user_id} - Set deleted_at")
        action = 'soft_delete'
    else:
        print(f"Thermonuclear Hard Purge {user_id}")
        action = 'hard_purge'
    
    return {
        'success': True,
        'user_id': user_id,
        'action': action,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }

def scan_pii(data: str) -> str:
    """Scan text for PII data"""
    if 'email' in data.lower() or '@' in data:
        return 'PII Detected - Redact'
    return 'Safe'

# ======================
# DUMMY DATA CONSTANTS (From ai-core/mocks.py)
# ======================

DUMMY_USER = {
    'id': 'uuid-thermo-1',
    'role': 'vibe_coder',
    'email': 'test@proto.com'
}

DUMMY_ROADMAP = {
    'id': 'rm-thermo-1',
    'json_graph': '{"nodes":[{"id":"n1","label":"Start","status":"gray","position":{"x":0,"y":0,"z":0}},{"id":"n2","label":"Middle","status":"gray","position":{"x":100,"y":100,"z":0}},{"id":"n3","label":"End","status":"gray","position":{"x":200,"y":200,"z":0}}],"edges":[{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]}',
    'vibe_mode': True,
    'thrive_score': 0.45
}

DUMMY_SNIPPET = {
    'id': 'sn-thermo-1',
    'category': 'ui',
    'code': 'console.log("Thermo UI Dummy");',
    'ui_preview_url': 'mock_neon.png'
}

DUMMY_AGENT_LOG = {
    'roadmap_id': 'rm-thermo-1',
    'task_type': 'ui',
    'output': '// Thermo Code',
    'status': 'success',
    'model_used': 'kimi',
    'token_count': 50
}

# ======================
# VALIDATION & TESTING
# ======================

def validate_python_mocks() -> bool:
    """Validate all Python mocks are working correctly"""
    try:
        print("THERMONUCLEAR: Validating unified Python mocks...")
        
        # Test API call mock
        api_result = mock_api_call('https://api.claude.ai/test', {'prompt': 'test'})
        if not api_result['success']:
            raise Exception('API mock failed')
        
        # Test DB query mock
        db_result = mock_db_query('SELECT * FROM roadmaps')
        if not db_result:
            raise Exception('DB mock failed')
        
        # Test Pinecone mock
        pinecone = MockPinecone()
        matches = pinecone.query([0.5] * 768)
        if not isinstance(matches, list):
            raise Exception('Pinecone mock failed')
        
        # Test KV store mock
        kv = MockKV()
        kv.put('test', 'value')
        if kv.get('test') != 'value':
            raise Exception('KV mock failed')
        
        # Test Thrive Score
        thrive_result = calculate_thrive_score([
            {'status': 'success', 'type': 'ui'},
            {'status': 'success', 'type': 'api'}
        ])
        if thrive_result['score'] <= 0:
            raise Exception('Thrive Score mock failed')
        
        print("✅ THERMONUCLEAR: All unified Python mocks validated successfully")
        return True
        
    except Exception as error:
        print(f"❌ THERMONUCLEAR PYTHON MOCK VALIDATION FAILED: {error}")
        return False

# Initialize on import
print("🚀 THERMONUCLEAR UNIFIED MOCKS: Python complete mock library loaded - All phases consolidated")

# Export commonly used instances
mock_pinecone = MockPinecone()
mock_kv = MockKV()
mock_router = MockPromptRouter()
mock_vault = MockVault()