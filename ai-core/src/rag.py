"""
Ref: CLAUDE.md Terminal 3: Phase 3 - MockPinecone RAG
Mock Pinecone implementation for vector storage and retrieval
"""

import numpy as np


class MockPinecone:
    """
    Mock implementation of Pinecone vector database
    Stores and retrieves code snippets using vector similarity
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

"""
Mermaid Diagram for RAG Flow:

```mermaid
graph TD
    A[Initialize MockPinecone] --> B[Generate 50 Snippets]
    B --> C[Upsert to Index]
    D[Query Vector] --> E{Calculate Similarity}
    E -->|For Each Vector| F[Cosine Similarity]
    F --> G{Score > 0.8?}
    G -->|Yes| H[Add to Matches]
    G -->|No| I[Skip]
    H --> J[Sort by Score]
    J --> K[Return Top 3]
```
"""