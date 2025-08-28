# Ref: CLAUDE.md Terminal 3 Phase 3 - AI Core RAG
# Thermonuclear RAG with Mock Pinecone for ProtoThrive
import numpy as np

class MockPinecone:
    def __init__(self):
        self.index = {}
        self.dummy_snippets = [
            {'id': f'sn-{i}', 'vector': np.random.rand(768).tolist(), 'metadata': {'category': 'ui' if i % 2 else 'code', 'snippet': f'console.log("Thermo Snippet {i}");'}}
            for i in range(50)
        ]
        for s in self.dummy_snippets:
            self.upsert(s['id'], s['vector'], s['metadata'])
        print("Thermonuclear RAG Initialized with 50 dummy snippets.")

    def upsert(self, snippet_id, vector, metadata):
        print(f"Thermonuclear Upsert: {snippet_id}")
        self.index[snippet_id] = {'vector': np.array(vector), 'metadata': metadata}

    def query(self, query_vec, top_k=3, threshold=0.8):
        print(f"Thermonuclear Query: top_k={top_k}, threshold={threshold}")
        matches = []
        query_vec = np.array(query_vec)
        for k, v in self.index.items():
            # Cosine similarity
            score = np.dot(query_vec, v['vector']) / (np.linalg.norm(query_vec) * np.linalg.norm(v['vector']))
            if score > threshold:
                matches.append({'id': k, 'score': score, 'snippet': v['metadata']['snippet']})
        
        # Sort by score descending
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:top_k]


