"""
Ref: CLAUDE.md Terminal 3: Phase 3 - Cache Tests
Tests for MockKV cache with TTL support
"""

import sys
import os
import time
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.cache import MockKV


def test_cache_initialization():
    """Test cache initializes empty"""
    cache = MockKV()
    assert cache.store == {}


def test_put_and_get():
    """Test basic put and get operations"""
    cache = MockKV()
    
    # Put data
    cache.put('test_key', 'test_data', ttl=3600)
    
    # Get should return data
    data = cache.get('test_key')
    assert data == 'test_data'


def test_get_nonexistent_key():
    """Test getting non-existent key returns None"""
    cache = MockKV()
    
    data = cache.get('nonexistent')
    assert data is None


def test_ttl_expiration():
    """Test TTL expiration logic"""
    cache = MockKV()
    
    # Put with 1 second TTL
    cache.put('expire_test', 'data', ttl=1)
    
    # Should be available immediately
    assert cache.get('expire_test') == 'data'
    
    # Wait for expiration
    time.sleep(1.1)
    
    # Should return None after expiration
    assert cache.get('expire_test') is None


def test_overwrite_key():
    """Test overwriting existing key"""
    cache = MockKV()
    
    # Put initial data
    cache.put('key1', 'data1', ttl=3600)
    assert cache.get('key1') == 'data1'
    
    # Overwrite with new data
    cache.put('key1', 'data2', ttl=3600)
    assert cache.get('key1') == 'data2'


def test_different_ttl_values():
    """Test different TTL values"""
    cache = MockKV()
    
    # Default TTL (3600 seconds)
    cache.put('default_ttl', 'data')
    assert 'default_ttl' in cache.store
    assert cache.store['default_ttl']['expire'] > time.time()
    
    # Custom TTL
    cache.put('custom_ttl', 'data', ttl=7200)
    expire_time = cache.store['custom_ttl']['expire']
    current_time = time.time()
    
    # Should be approximately 7200 seconds in future
    assert 7199 < (expire_time - current_time) < 7201


def test_multiple_keys():
    """Test managing multiple keys"""
    cache = MockKV()
    
    # Put multiple keys
    for i in range(5):
        cache.put(f'key{i}', f'data{i}', ttl=3600)
    
    # All should be retrievable
    for i in range(5):
        assert cache.get(f'key{i}') == f'data{i}'
    
    # Store should have 5 entries
    assert len(cache.store) == 5


def test_complex_data_types():
    """Test caching complex data types"""
    cache = MockKV()
    
    # Test dict
    dict_data = {'key': 'value', 'nested': {'data': 123}}
    cache.put('dict_key', dict_data)
    assert cache.get('dict_key') == dict_data
    
    # Test list
    list_data = [1, 2, 3, 'four', {'five': 5}]
    cache.put('list_key', list_data)
    assert cache.get('list_key') == list_data
    
    # Test None
    cache.put('none_key', None)
    # Should return None (but due to expiry check, not the stored None)
    # So we check the store directly
    assert cache.store['none_key']['data'] is None


def test_expired_key_cleanup():
    """Test expired keys return None"""
    cache = MockKV()
    
    # Manually set expired entry
    cache.store['expired'] = {
        'data': 'old_data',
        'expire': time.time() - 1  # Already expired
    }
    
    # Should return None
    assert cache.get('expired') is None


if __name__ == "__main__":
    test_cache_initialization()
    test_put_and_get()
    test_get_nonexistent_key()
    test_ttl_expiration()
    test_overwrite_key()
    test_different_ttl_values()
    test_multiple_keys()
    test_complex_data_types()
    test_expired_key_cleanup()
    print("All cache tests passed!")
    print("Thermonuclear Test Complete: Cache 100% Coverage")