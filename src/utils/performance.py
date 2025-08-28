# Performance Optimization Utilities
import asyncio
import functools
from typing import Any, Callable, TypeVar
from concurrent.futures import ThreadPoolExecutor
import time

T = TypeVar('T')

def memoize(maxsize: int = 128, ttl: int = 300):
    """Memoization decorator with TTL"""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        cache = {}
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            key = str(args) + str(sorted(kwargs.items()))
            now = time.time()
            
            if key in cache:
                result, timestamp = cache[key]
                if now - timestamp < ttl:
                    return result
            
            result = func(*args, **kwargs)
            cache[key] = (result, now)
            
            # Clean up old entries
            if len(cache) > maxsize:
                oldest_key = min(cache.keys(), key=lambda k: cache[k][1])
                del cache[oldest_key]
            
            return result
        return wrapper
    return decorator

async def run_in_threadpool(func: Callable[..., T], *args, **kwargs) -> T:
    """Run CPU-intensive function in thread pool"""
    loop = asyncio.get_event_loop()
    with ThreadPoolExecutor() as executor:
        return await loop.run_in_executor(executor, func, *args, **kwargs)

def batch_process(items: list, batch_size: int = 100):
    """Process items in batches"""
    for i in range(0, len(items), batch_size):
        yield items[i:i + batch_size]

class PerformanceMonitor:
    """Simple performance monitoring"""
    
    def __init__(self):
        self.metrics = {}
    
    def start_timer(self, name: str):
        """Start timing an operation"""
        self.metrics[name] = {'start': time.time()}
    
    def end_timer(self, name: str) -> float:
        """End timing and return duration"""
        if name in self.metrics:
            duration = time.time() - self.metrics[name]['start']
            self.metrics[name]['duration'] = duration
            return duration
        return 0.0
    
    def get_metrics(self) -> dict:
        """Get all performance metrics"""
        return self.metrics.copy()
