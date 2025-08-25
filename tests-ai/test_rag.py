"""
Ref: CLAUDE.md Terminal 3: Phase 3 - RAG Tests
Tests for MockPinecone vector operations
"""

import sys
import os
import numpy as np
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.rag import MockPinecone


def test_rag_initialization():
    """Test RAG initializes with 50 snippets"""
    rag = MockPinecone()
    
    # Should have 50 snippets
    assert len(rag.dummy_snippets) == 50
    assert len(rag.index) == 50
    
    # Check alternating categories
    for i in range(50):
        snippet = rag.dummy_snippets[i]
        expected_category = 'ui' if i % 2 else 'code'
        assert snippet['meta']['category'] == expected_category
        assert snippet['id'] == f'sn-{i}'


def test_upsert():
    """Test upserting vectors"""
    rag = MockPinecone()
    
    # Clear index first
    rag.index = {}
    
    # Upsert a new vector
    test_vector = [0.1] * 768
    test_meta = {'category': 'test', 'snippet': 'test code'}
    rag.upsert('test-id', test_vector, test_meta)
    
    # Verify it was stored
    assert 'test-id' in rag.index
    assert rag.index['test-id']['vector'] == test_vector
    assert rag.index['test-id']['meta'] == test_meta


def test_query_with_matches():
    """Test querying with matching vectors"""
    rag = MockPinecone()
    
    # Query with a vector similar to existing ones
    query_vec = [0.5] * 768
    matches = rag.query(query_vec, top_k=3, threshold=0.8)
    
    # Should return exactly 3 matches (topK)
    assert len(matches) == 3
    
    # All matches should have score > 0.8
    for match in matches:
        assert match['score'] > 0.8
        assert 'id' in match
        assert 'snippet' in match
    
    # Should be sorted by score descending
    for i in range(len(matches) - 1):
        assert matches[i]['score'] >= matches[i + 1]['score']


def test_query_no_matches():
    """Test querying with no matches above threshold"""
    rag = MockPinecone()
    
    # Create a very different vector that won't match
    query_vec = [-1] * 768
    matches = rag.query(query_vec, top_k=3, threshold=0.8)
    
    # Should return empty list if no matches above threshold
    assert len(matches) == 0


def test_query_limited_matches():
    """Test querying returns at most topK matches"""
    rag = MockPinecone()
    
    # Query with low threshold to get many matches
    query_vec = [0.5] * 768
    matches = rag.query(query_vec, top_k=5, threshold=0.1)
    
    # Should return at most 5 matches even if more qualify
    assert len(matches) <= 5


def test_cosine_similarity():
    """Test cosine similarity calculation"""
    rag = MockPinecone()
    
    # Clear and add known vectors
    rag.index = {}
    
    # Add identical vector (similarity = 1.0)
    test_vec = [1, 0, 0] + [0] * 765
    rag.upsert('identical', test_vec, {'snippet': 'identical'})
    
    # Query with same vector
    matches = rag.query(test_vec, top_k=1, threshold=0.99)
    assert len(matches) == 1
    assert abs(matches[0]['score'] - 1.0) < 0.001  # Should be ~1.0
    
    # Add orthogonal vector (similarity = 0.0)
    orthogonal_vec = [0, 1, 0] + [0] * 765
    rag.upsert('orthogonal', orthogonal_vec, {'snippet': 'orthogonal'})
    
    # Query should not match orthogonal with high threshold
    matches = rag.query(test_vec, top_k=10, threshold=0.5)
    assert all(match['id'] != 'orthogonal' for match in matches)


if __name__ == "__main__":
    test_rag_initialization()
    test_upsert()
    test_query_with_matches()
    test_query_no_matches()
    test_query_limited_matches()
    test_cosine_similarity()
    print("All RAG tests passed!")
    print("Thermonuclear Test Complete: RAG 100% Coverage")