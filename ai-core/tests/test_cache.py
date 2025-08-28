import pytest
import time
from src.cache import MockKV

def test_cache_put_and_get():
    kv = MockKV()
    kv.put('test_key', 'test_value', ttl=2)
    value = kv.get('test_key')
    assert value == 'test_value'

def test_cache_ttl_expiration():
    kv = MockKV()
    kv.put('test_key', 'test_value', ttl=1)
    time.sleep(1.1) # Wait for TTL to expire
    expired_value = kv.get('test_key')
    assert expired_value is None

def test_cache_get_non_existent_key():
    kv = MockKV()
    not_found_value = kv.get('not_a_key')
    assert not_found_value is None
