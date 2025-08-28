import pytest
import numpy as np
from src.rag import MockPinecone

def test_rag_initialization():
    rag = MockPinecone()
    assert isinstance(rag, MockPinecone)
    assert len(rag.index) == 50

def test_rag_upsert():
    rag = MockPinecone()
    test_id = 'sn-test'
    test_vector = np.random.rand(768).tolist()
    test_meta = {'category': 'test', 'snippet': 'console.log("Test");'}
    rag.upsert(test_id, test_vector, test_meta)
    assert test_id in rag.index

def test_rag_query_known_vector():
    rag = MockPinecone()
    query_vector = rag.index['sn-1']['vector'].tolist()
    results = rag.query(query_vector, top_k=5, threshold=0.95)
    assert len(results) > 0
    assert results[0]['id'] == 'sn-1'
    assert results[0]['score'] > 0.99

def test_rag_query_no_results():
    rag = MockPinecone()
    random_vector = np.random.rand(768).tolist()
    results_none = rag.query(random_vector, threshold=0.99)
    assert len(results_none) == 0
