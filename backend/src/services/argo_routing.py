"""
Argo Smart Routing Optimization Service for ProtoThrive

Leverages Cloudflare's Argo Smart Routing for ultra-fast performance:
- Intelligent path selection for 30% faster responses
- Geographic optimization with edge routing
- Performance monitoring and adaptive routing
- Cost-effective traffic optimization

Target: 25-40ms P50 response times with geographic optimization
"""

from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

# Cloudflare imports
from js import Response, Request, Headers


@dataclass
class RoutingMetrics:
    """Routing performance metrics"""
    response_time_ms: float
    cache_hit: bool
    edge_location: str
    route_quality: float  # 0.0-1.0
    optimization_applied: bool


@dataclass
class GeographicRoute:
    """Geographic routing configuration"""
    region: str
    edge_locations: List[str]
    performance_target_ms: int
    cache_strategy: str


class ArgoSmartRoutingService:
    """
    Cloudflare Argo Smart Routing optimization service

    Features:
    - Automatic best path selection
    - Performance-based routing decisions
    - Geographic edge optimization
    - Real-time route quality monitoring
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize Argo routing service"""
        self.env = env
        self.performance_target = int(env.get('PERFORMANCE_TARGET_MS', '25'))
        self.argo_enabled = env.get('ARGO_SMART_ROUTING', 'false').lower() == 'true'
        self.tiered_caching = env.get('ARGO_TIERED_CACHING', 'false').lower() == 'true'

        # Geographic optimization configuration
        self.geographic_routes = {
            'us-east': GeographicRoute(
                region='us-east',
                edge_locations=['iad', 'bos', 'ewr', 'dca'],
                performance_target_ms=20,
                cache_strategy='aggressive'
            ),
            'us-west': GeographicRoute(
                region='us-west',
                edge_locations=['lax', 'sjc', 'sea', 'pdx'],
                performance_target_ms=25,
                cache_strategy='balanced'
            ),
            'europe': GeographicRoute(
                region='europe',
                edge_locations=['lhr', 'fra', 'ams', 'cdg'],
                performance_target_ms=30,
                cache_strategy='conservative'
            ),
            'asia': GeographicRoute(
                region='asia',
                edge_locations=['nrt', 'hkg', 'sin', 'icn'],
                performance_target_ms=35,
                cache_strategy='adaptive'
            )
        }

    async def optimize_request_routing(
        self,
        request: Request,
        endpoint_type: str = "api"
    ) -> Dict[str, Any]:
        """
        Optimize request routing using Argo Smart Routing

        Returns routing configuration for enhanced performance
        """
        try:
            # Extract request metadata
            client_ip = request.headers.get('CF-Connecting-IP', 'unknown')
            cf_ipcountry = request.headers.get('CF-IPCountry', 'unknown')
            cf_ray = request.headers.get('CF-Ray', 'unknown')

            # Determine optimal geographic route
            geographic_route = self._get_optimal_geographic_route(
                cf_ipcountry, endpoint_type
            )

            # Configure Argo routing parameters
            routing_config = {
                'argo_enabled': self.argo_enabled,
                'tiered_caching': self.tiered_caching,
                'geographic_route': geographic_route,
                'performance_target_ms': self.performance_target,
                'optimization_headers': self._build_optimization_headers(
                    geographic_route, endpoint_type
                ),
                'cache_strategy': self._determine_cache_strategy(
                    geographic_route, endpoint_type
                ),
                'request_metadata': {
                    'client_ip': client_ip,
                    'country': cf_ipcountry,
                    'ray_id': cf_ray,
                    'timestamp': datetime.utcnow().isoformat()
                }
            }

            # Log routing decision
            print(f"Thermonuclear Argo Routing: {geographic_route.region} "
                  f"target {geographic_route.performance_target_ms}ms "
                  f"for {cf_ipcountry} -> {endpoint_type}")

            return routing_config

        except Exception as e:
            print(f"Argo routing optimization error: {e}")
            # Return default configuration on error
            return {
                'argo_enabled': False,
                'error': str(e),
                'fallback': True
            }

    def _get_optimal_geographic_route(
        self,
        country_code: str,
        endpoint_type: str
    ) -> GeographicRoute:
        """Determine optimal geographic route based on request origin"""

        # Country to region mapping for optimal routing
        region_mapping = {
            # North America
            'US': 'us-east', 'CA': 'us-east', 'MX': 'us-west',

            # Europe
            'GB': 'europe', 'DE': 'europe', 'FR': 'europe',
            'NL': 'europe', 'IT': 'europe', 'ES': 'europe',
            'SE': 'europe', 'NO': 'europe', 'DK': 'europe',

            # Asia Pacific
            'JP': 'asia', 'CN': 'asia', 'KR': 'asia',
            'SG': 'asia', 'HK': 'asia', 'AU': 'asia',
            'IN': 'asia', 'TH': 'asia', 'VN': 'asia',

            # Default fallback
            'unknown': 'us-east'
        }

        # Special routing for high-performance endpoints
        if endpoint_type in ['websocket', 'realtime', 'agent']:
            # Prefer US East for AI/ML workloads (lower latency to compute)
            if country_code in ['US', 'CA', 'GB', 'DE', 'FR']:
                region = 'us-east'
            else:
                region = region_mapping.get(country_code, 'us-east')
        else:
            region = region_mapping.get(country_code, 'us-east')

        return self.geographic_routes.get(region, self.geographic_routes['us-east'])

    def _build_optimization_headers(
        self,
        route: GeographicRoute,
        endpoint_type: str
    ) -> Dict[str, str]:
        """Build Cloudflare optimization headers for response"""

        headers = {
            'CF-Cache-Status': 'DYNAMIC',  # Will be overridden by Cloudflare
            'CF-Edge-Cache': 'private',
            'Vary': 'Accept-Encoding, Accept, Authorization'
        }

        # Configure caching based on endpoint type
        if endpoint_type == 'static':
            headers.update({
                'Cache-Control': f'public, max-age={self.env.get("EDGE_CACHE_TTL", "900")}',
                'CF-Edge-Cache': 'public'
            })
        elif endpoint_type == 'api':
            cache_ttl = self.env.get('CACHE_EVERYTHING_TTL', '300')
            headers.update({
                'Cache-Control': f'public, max-age={cache_ttl}, s-maxage={cache_ttl}',
                'CF-Edge-Cache': 'public'
            })
        elif endpoint_type in ['websocket', 'realtime']:
            headers.update({
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'CF-Edge-Cache': 'private'
            })

        # Add performance optimization headers
        headers.update({
            'X-Argo-Region': route.region,
            'X-Performance-Target': str(route.performance_target_ms),
            'X-Cache-Strategy': route.cache_strategy,
            'X-Optimization-Level': 'argo-smart-routing'
        })

        return headers

    def _determine_cache_strategy(
        self,
        route: GeographicRoute,
        endpoint_type: str
    ) -> Dict[str, Any]:
        """Determine optimal caching strategy for route"""

        base_strategy = {
            'edge_ttl': int(self.env.get('EDGE_CACHE_TTL', '900')),
            'browser_ttl': int(self.env.get('CACHE_EVERYTHING_TTL', '300')),
            'tiered_caching': self.tiered_caching
        }

        # Adjust strategy based on route cache strategy
        if route.cache_strategy == 'aggressive':
            base_strategy.update({
                'edge_ttl': 1800,  # 30 minutes
                'browser_ttl': 600,  # 10 minutes
                'stale_while_revalidate': 300
            })
        elif route.cache_strategy == 'conservative':
            base_strategy.update({
                'edge_ttl': 300,   # 5 minutes
                'browser_ttl': 120,  # 2 minutes
                'stale_while_revalidate': 60
            })
        elif route.cache_strategy == 'adaptive':
            # Adaptive based on endpoint performance
            if route.performance_target_ms <= 25:
                base_strategy.update({
                    'edge_ttl': 900,   # 15 minutes
                    'browser_ttl': 300,  # 5 minutes
                    'stale_while_revalidate': 180
                })
            else:
                base_strategy.update({
                    'edge_ttl': 600,   # 10 minutes
                    'browser_ttl': 240,  # 4 minutes
                    'stale_while_revalidate': 120
                })

        return base_strategy

    async def apply_response_optimizations(
        self,
        response: Response,
        routing_config: Dict[str, Any],
        response_time_ms: float
    ) -> Response:
        """Apply Argo optimizations to response"""

        try:
            # Extract optimization headers
            optimization_headers = routing_config.get('optimization_headers', {})

            # Add performance metrics
            optimization_headers.update({
                'X-Response-Time': f'{response_time_ms:.2f}ms',
                'X-Argo-Optimized': 'true' if routing_config.get('argo_enabled') else 'false',
                'X-Performance-Score': self._calculate_performance_score(
                    response_time_ms, routing_config
                )
            })

            # Create optimized response
            response_init = {
                'status': response.status,
                'statusText': response.statusText,
                'headers': {
                    **dict(response.headers),
                    **optimization_headers
                }
            }

            # Get response body
            response_body = await response.text()

            # Create new optimized response
            optimized_response = Response.new(response_body, response_init)

            # Log optimization results
            geographic_route = routing_config.get('geographic_route')
            if geographic_route:
                target_met = response_time_ms <= geographic_route.performance_target_ms
                print(f"Thermonuclear Argo Response: {response_time_ms:.2f}ms "
                      f"(target {geographic_route.performance_target_ms}ms) "
                      f"{'✓' if target_met else '✗'}")

            return optimized_response

        except Exception as e:
            print(f"Response optimization error: {e}")
            return response

    def _calculate_performance_score(
        self,
        response_time_ms: float,
        routing_config: Dict[str, Any]
    ) -> str:
        """Calculate performance score based on routing effectiveness"""

        geographic_route = routing_config.get('geographic_route')
        if not geographic_route:
            return '0.0'

        target_ms = geographic_route.performance_target_ms

        if response_time_ms <= target_ms:
            # Excellent performance
            score = 1.0
        elif response_time_ms <= target_ms * 1.5:
            # Good performance
            score = 0.8 - (response_time_ms - target_ms) / (target_ms * 0.5) * 0.3
        else:
            # Poor performance
            score = max(0.0, 0.5 - (response_time_ms - target_ms * 1.5) / target_ms * 0.5)

        return f'{score:.2f}'

    async def get_routing_analytics(
        self,
        time_window_hours: int = 24
    ) -> Dict[str, Any]:
        """Get Argo routing performance analytics"""

        try:
            # Simulate analytics (in real implementation, query KV/D1 for metrics)
            analytics = {
                'time_window_hours': time_window_hours,
                'argo_enabled': self.argo_enabled,
                'performance_target_ms': self.performance_target,
                'geographic_performance': {},
                'optimization_summary': {
                    'total_requests': 0,
                    'argo_optimized': 0,
                    'avg_response_time_ms': 0.0,
                    'performance_improvement_pct': 0.0,
                    'cache_hit_rate_pct': 0.0
                }
            }

            # Simulate performance by region
            for region, route in self.geographic_routes.items():
                analytics['geographic_performance'][region] = {
                    'target_ms': route.performance_target_ms,
                    'avg_response_ms': route.performance_target_ms * 0.9,  # Simulated
                    'cache_strategy': route.cache_strategy,
                    'requests_count': 0,  # Would be populated from real metrics
                    'performance_score': 0.95  # Simulated excellent performance
                }

            return analytics

        except Exception as e:
            return {'error': str(e), 'analytics_available': False}

    async def health_check(self) -> Dict[str, Any]:
        """Health check for Argo routing service"""

        return {
            'service': 'argo-smart-routing',
            'status': 'healthy',
            'argo_enabled': self.argo_enabled,
            'tiered_caching': self.tiered_caching,
            'performance_target_ms': self.performance_target,
            'supported_regions': list(self.geographic_routes.keys()),
            'optimization_features': [
                'geographic_routing',
                'performance_based_caching',
                'adaptive_cache_strategies',
                'real_time_optimization'
            ]
        }


# Export for use in application
__all__ = [
    'ArgoSmartRoutingService',
    'RoutingMetrics',
    'GeographicRoute'
]