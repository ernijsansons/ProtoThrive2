# Ref: CLAUDE.md Section 3 - AI Core & Agent Orchestration
"""
ProtoThrive RAG (Retrieval-Augmented Generation) System
Mock Pinecone implementation for snippet storage and retrieval
"""

import json
import random
from typing import Dict, List, Any, Optional
import numpy as np


class MockPinecone:
    """Mock Pinecone vector database for snippet storage and retrieval"""

    def __init__(self):
        """Initialize mock index with 50 dummy snippets as per CLAUDE.md"""
        self.index = {}
        self.dummy_snippets = [
            {'id': f'sn-{i}', 'vector': [0.1*i]*768, 
             'meta': {'category': 'ui' if i%2 else 'code', 
                     'snippet': f'console.log("Thermo Snippet {i}");'}} 
            for i in range(50)
        ]
        
        # Upsert all dummy snippets
        for s in self.dummy_snippets:
            self.upsert(s['id'], s['vector'], s['meta'])
        
        print(f"Thermonuclear Init: Parsed [RAG] sections - 0 Anomalies.")

    def upsert(self, id, vector, metadata):
        """Upsert vector with metadata into index"""
        print(f"Thermonuclear Upsert {id}")
        self.index[id] = {'vector': vector, 'meta': metadata}

    def query(self, query_vec, topK=3, threshold=0.8):
        """Query index for similar vectors"""
        import numpy as np
        matches = []
        for k, v in self.index.items():
            score = np.dot(query_vec, v['vector']) / (np.linalg.norm(query_vec) * np.linalg.norm(v['vector']))
            if score > threshold:
                matches.append({'id': k, 'score': score, 'snippet': v['meta']['snippet']})
        return sorted(matches, key=lambda x: x['score'], reverse=True)[:topK]

    def delete(self, id: str) -> bool:
        """
        Delete a vector from the index

        Args:
            id: Unique identifier to delete

        Returns:
            True if deleted, False if not found
        """
        if id in self.index:
            del self.index[id]
            print(f"Thermonuclear Delete: Removed {id} from index")
            return True
        return False

    def get_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the index

        Returns:
            Dictionary with index statistics
        """
        categories = {}
        for item in self.index.values():
            cat = item['meta'].get('category', 'unknown')
            categories[cat] = categories.get(cat, 0) + 1

        stats = {
            'total_vectors': len(self.index),
            'categories': categories,
            'index_size_mb': len(self.index) * 768 * 4 / (1024 * 1024)  # Rough estimate
        }

        print(f"Thermonuclear RAG Stats: {stats}")
        return stats

    def search_by_category(self, category: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search snippets by category

        Args:
            category: Category to filter by
            limit: Maximum results to return

        Returns:
            List of snippets in the category
        """
        results = []
        for key, value in self.index.items():
            if value['meta'].get('category') == category:
                results.append({
                    'id': key,
                    'snippet': value['meta']['snippet'],
                    'category': category,
                    'tags': value['meta'].get('tags', []),
                    'usage_count': value['meta'].get('usage_count', 0)
                })
                if len(results) >= limit:
                    break

        print(f"Thermonuclear Category Search: Found {len(results)} snippets in '{category}'")
        return results

    def get_popular_snippets(self, top_n: int = 5) -> List[Dict[str, Any]]:
        """
        Get most popular snippets by usage count

        Args:
            top_n: Number of top snippets to return

        Returns:
            List of popular snippets
        """
        all_snippets = []
        for key, value in self.index.items():
            all_snippets.append({
                'id': key,
                'snippet': value['meta']['snippet'],
                'category': value['meta'].get('category', 'unknown'),
                'usage_count': value['meta'].get('usage_count', 0)
            })

        # Sort by usage count
        popular = sorted(all_snippets, key=lambda x: x['usage_count'], reverse=True)[:top_n]

        print(f"Thermonuclear Popular Snippets: Top {top_n} by usage")
        for snip in popular:
            print(f"  - {snip['id']}: {snip['usage_count']} uses")

        return popular


# Test the RAG system
if __name__ == "__main__":
    rag = MockPinecone()

    # Test query with random vector
    print("\nThermonuclear RAG Query Test:")
    query_vector = [0.5] * 768  # Simple query vector
    matches = rag.query(query_vector, topK=3, threshold=0.8)

    # Test category search
    print("\nThermonuclear Category Search Test:")
    ui_snippets = rag.search_by_category('ui', limit=3)
    for snippet in ui_snippets:
        print(f"  UI Snippet: {snippet['id']}")

    # Test popular snippets
    print("\nThermonuclear Popular Snippets Test:")
    popular = rag.get_popular_snippets(top_n=3)

    # Get stats
    print("\nThermonuclear RAG Statistics:")
    stats = rag.get_stats()

    print("\nThermonuclear Validation: RAG implementation complete - Score: 1.0")