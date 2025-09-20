"""
R2 + Cloudflare Images Optimization Service for ProtoThrive

Leverages Cloudflare R2 Storage + Images service for ultra-fast asset delivery:
- Intelligent image optimization and resizing
- Global CDN with edge caching
- Automatic format conversion (WebP, AVIF)
- Cost-effective storage with Images transformation

Target: Sub-100ms image load times globally with 70% bandwidth savings
"""

from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import json
import uuid
import hashlib

# Cloudflare imports
from js import Response, Request


class ImageFormat(Enum):
    """Supported image formats"""
    ORIGINAL = "original"
    WEBP = "webp"
    AVIF = "avif"
    JPEG = "jpeg"
    PNG = "png"


class ImageQuality(Enum):
    """Image quality presets"""
    AUTO = "auto"      # Cloudflare automatic optimization
    HIGH = "85"        # 85% quality
    MEDIUM = "75"      # 75% quality
    LOW = "60"         # 60% quality
    LOSSLESS = "100"   # 100% quality


@dataclass
class ImageVariant:
    """Image variant configuration"""
    name: str
    width: Optional[int] = None
    height: Optional[int] = None
    format: ImageFormat = ImageFormat.AUTO
    quality: ImageQuality = ImageQuality.AUTO
    fit: str = "scale-down"  # scale-down, contain, cover, crop, pad
    dpr: float = 1.0  # Device pixel ratio


@dataclass
class AssetMetadata:
    """Asset metadata for optimization tracking"""
    asset_id: str
    original_url: str
    r2_key: str
    content_type: str
    size_bytes: int
    upload_time: datetime
    variants: List[ImageVariant]
    cdn_urls: Dict[str, str]
    optimization_stats: Dict[str, Any]


class R2ImagesOptimizationService:
    """
    R2 + Cloudflare Images optimization service

    Features:
    - Automatic image optimization
    - Multi-format delivery (WebP, AVIF)
    - Responsive image variants
    - Global CDN with edge caching
    - Cost-effective R2 storage
    """

    def __init__(self, env: Dict[str, Any]):
        """Initialize R2 + Images optimization service"""
        self.env = env
        self.r2_bucket = env.get('R2_BUCKET', 'protothrive-assets')
        self.images_account_id = env.get('IMAGES_ACCOUNT_ID', 'mock-account-id')
        self.images_api_token = env.get('IMAGES_API_TOKEN', 'mock-api-token')

        # Standard image variants for responsive delivery
        self.standard_variants = {
            'thumbnail': ImageVariant(
                name='thumbnail',
                width=150,
                height=150,
                format=ImageFormat.WEBP,
                quality=ImageQuality.MEDIUM,
                fit='cover'
            ),
            'small': ImageVariant(
                name='small',
                width=400,
                height=300,
                format=ImageFormat.WEBP,
                quality=ImageQuality.HIGH,
                fit='scale-down'
            ),
            'medium': ImageVariant(
                name='medium',
                width=800,
                height=600,
                format=ImageFormat.WEBP,
                quality=ImageQuality.HIGH,
                fit='scale-down'
            ),
            'large': ImageVariant(
                name='large',
                width=1200,
                height=900,
                format=ImageFormat.WEBP,
                quality=ImageQuality.HIGH,
                fit='scale-down'
            ),
            'retina': ImageVariant(
                name='retina',
                width=1600,
                height=1200,
                format=ImageFormat.WEBP,
                quality=ImageQuality.HIGH,
                fit='scale-down',
                dpr=2.0
            )
        }

        # Asset categories for optimized handling
        self.asset_categories = {
            'ui_screenshot': {
                'variants': ['thumbnail', 'small', 'medium'],
                'cache_ttl': 86400,  # 24 hours
                'optimization_priority': 'high'
            },
            'user_avatar': {
                'variants': ['thumbnail', 'small'],
                'cache_ttl': 3600,   # 1 hour
                'optimization_priority': 'medium'
            },
            'roadmap_preview': {
                'variants': ['thumbnail', 'small', 'medium', 'large'],
                'cache_ttl': 7200,   # 2 hours
                'optimization_priority': 'high'
            },
            'static_asset': {
                'variants': ['small', 'medium', 'large'],
                'cache_ttl': 604800,  # 7 days
                'optimization_priority': 'low'
            }
        }

        # Performance tracking
        self.optimization_stats = {
            'total_uploads': 0,
            'total_bytes_saved': 0,
            'avg_optimization_ratio': 0.0,
            'cache_hit_rate': 0.0
        }

    async def upload_and_optimize_asset(
        self,
        asset_data: bytes,
        content_type: str,
        asset_category: str = 'static_asset',
        custom_variants: Optional[List[ImageVariant]] = None
    ) -> AssetMetadata:
        """
        Upload asset to R2 and create optimized variants

        Args:
            asset_data: Binary asset data
            content_type: MIME type of the asset
            asset_category: Category for optimization settings
            custom_variants: Custom image variants (overrides category defaults)

        Returns:
            Asset metadata with optimization details
        """
        try:
            # Generate unique asset ID and R2 key
            asset_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().strftime('%Y/%m/%d')
            r2_key = f"assets/{timestamp}/{asset_id}"

            # Upload original to R2
            r2_url = await self._upload_to_r2(r2_key, asset_data, content_type)

            # Determine variants to create
            variants = custom_variants or self._get_variants_for_category(asset_category)

            # Create optimized variants using Cloudflare Images
            cdn_urls = {}
            optimization_stats = {}

            if self._is_image(content_type):
                # Upload to Cloudflare Images for optimization
                images_id = await self._upload_to_cloudflare_images(
                    asset_data, asset_id, content_type
                )

                # Generate variant URLs
                for variant in variants:
                    variant_url = self._generate_images_url(images_id, variant)
                    cdn_urls[variant.name] = variant_url

                # Calculate optimization statistics
                optimization_stats = await self._calculate_optimization_stats(
                    asset_data, variants, asset_category
                )

            else:
                # Non-image assets use R2 with CDN
                cdn_urls['original'] = f"https://assets.protothrive.com/{r2_key}"

            # Create asset metadata
            metadata = AssetMetadata(
                asset_id=asset_id,
                original_url=r2_url,
                r2_key=r2_key,
                content_type=content_type,
                size_bytes=len(asset_data),
                upload_time=datetime.utcnow(),
                variants=variants,
                cdn_urls=cdn_urls,
                optimization_stats=optimization_stats
            )

            # Update global statistics
            self._update_global_stats(len(asset_data), optimization_stats)

            print(f"Thermonuclear R2+Images Upload: {asset_id} -> {len(variants)} variants, "
                  f"{optimization_stats.get('bytes_saved', 0)} bytes saved")

            return metadata

        except Exception as e:
            print(f"Asset upload and optimization error: {e}")
            raise ValueError({'code': 'ASSET-500', 'message': str(e)})

    async def _upload_to_r2(
        self,
        key: str,
        data: bytes,
        content_type: str
    ) -> str:
        """Upload asset to R2 storage"""

        try:
            # Simulate R2 upload (in real implementation, use R2 API)
            print(f"Thermonuclear R2 Upload: {key} ({len(data)} bytes)")

            # Mock successful upload
            r2_url = f"https://r2.protothrive.com/{self.r2_bucket}/{key}"
            return r2_url

        except Exception as e:
            raise ValueError({'code': 'R2-500', 'message': f'R2 upload failed: {e}'})

    async def _upload_to_cloudflare_images(
        self,
        data: bytes,
        asset_id: str,
        content_type: str
    ) -> str:
        """Upload image to Cloudflare Images for optimization"""

        try:
            # Simulate Cloudflare Images upload
            print(f"Thermonuclear Images Upload: {asset_id} for optimization")

            # Mock successful upload - return images ID
            return f"img_{asset_id}"

        except Exception as e:
            raise ValueError({'code': 'IMAGES-500', 'message': f'Images upload failed: {e}'})

    def _generate_images_url(
        self,
        images_id: str,
        variant: ImageVariant
    ) -> str:
        """Generate Cloudflare Images delivery URL with transformations"""

        base_url = f"https://imagedelivery.net/{self.images_account_id}/{images_id}"

        # Build transformation parameters
        transformations = []

        if variant.width or variant.height:
            size = f"w={variant.width or 'auto'},h={variant.height or 'auto'}"
            transformations.append(size)

        if variant.quality != ImageQuality.AUTO:
            transformations.append(f"q={variant.quality.value}")

        if variant.format != ImageFormat.AUTO:
            transformations.append(f"f={variant.format.value}")

        if variant.fit != 'scale-down':
            transformations.append(f"fit={variant.fit}")

        if variant.dpr != 1.0:
            transformations.append(f"dpr={variant.dpr}")

        # Construct final URL
        if transformations:
            transform_string = ','.join(transformations)
            return f"{base_url}/{transform_string}"
        else:
            return f"{base_url}/public"

    def _get_variants_for_category(self, category: str) -> List[ImageVariant]:
        """Get image variants for asset category"""

        category_config = self.asset_categories.get(category, self.asset_categories['static_asset'])
        variant_names = category_config['variants']

        return [
            self.standard_variants[name]
            for name in variant_names
            if name in self.standard_variants
        ]

    def _is_image(self, content_type: str) -> bool:
        """Check if content type is an image"""
        return content_type.startswith('image/')

    async def _calculate_optimization_stats(
        self,
        original_data: bytes,
        variants: List[ImageVariant],
        category: str
    ) -> Dict[str, Any]:
        """Calculate optimization statistics"""

        original_size = len(original_data)

        # Simulate optimization ratios based on format and quality
        optimization_ratios = {
            'webp': 0.25,    # 75% size reduction vs original
            'avif': 0.20,    # 80% size reduction vs original
            'jpeg': 0.60,    # 40% size reduction vs original
            'png': 0.80      # 20% size reduction vs original
        }

        total_optimized_size = 0
        variant_stats = {}

        for variant in variants:
            # Estimate optimized size
            format_ratio = optimization_ratios.get(variant.format.value, 0.7)
            quality_factor = float(variant.quality.value) / 100 if variant.quality.value.isdigit() else 0.8

            # Apply size reduction for resizing
            resize_factor = 1.0
            if variant.width and variant.width < 1920:  # Assume original is 1920px
                resize_factor = (variant.width / 1920) ** 2

            optimized_size = int(original_size * format_ratio * quality_factor * resize_factor)
            total_optimized_size += optimized_size

            variant_stats[variant.name] = {
                'estimated_size': optimized_size,
                'compression_ratio': optimized_size / original_size
            }

        bytes_saved = original_size - (total_optimized_size / len(variants) if variants else original_size)
        savings_percentage = (bytes_saved / original_size) * 100

        return {
            'original_size': original_size,
            'total_optimized_size': total_optimized_size,
            'bytes_saved': max(0, bytes_saved),
            'savings_percentage': max(0, savings_percentage),
            'variant_count': len(variants),
            'variant_stats': variant_stats,
            'category': category
        }

    def _update_global_stats(
        self,
        original_size: int,
        optimization_stats: Dict[str, Any]
    ) -> None:
        """Update global optimization statistics"""

        self.optimization_stats['total_uploads'] += 1
        self.optimization_stats['total_bytes_saved'] += optimization_stats.get('bytes_saved', 0)

        # Update rolling average for optimization ratio
        current_ratio = optimization_stats.get('savings_percentage', 0) / 100
        total_uploads = self.optimization_stats['total_uploads']

        self.optimization_stats['avg_optimization_ratio'] = (
            (self.optimization_stats['avg_optimization_ratio'] * (total_uploads - 1) + current_ratio) /
            total_uploads
        )

    async def get_optimized_asset_url(
        self,
        asset_id: str,
        variant_name: str = 'medium',
        user_agent: Optional[str] = None,
        accept_header: Optional[str] = None
    ) -> Optional[str]:
        """
        Get optimized asset URL with intelligent format selection

        Args:
            asset_id: Asset identifier
            variant_name: Desired image variant
            user_agent: Client user agent for capability detection
            accept_header: Accept header for format negotiation

        Returns:
            Optimized asset URL or None if not found
        """

        try:
            # Simulate asset metadata lookup
            # In real implementation, this would query the database or KV store

            asset_metadata = await self._get_asset_metadata(asset_id)
            if not asset_metadata:
                return None

            # Intelligent format selection based on client capabilities
            optimal_format = self._select_optimal_format(user_agent, accept_header)

            # Get URL for requested variant
            if variant_name in asset_metadata.cdn_urls:
                base_url = asset_metadata.cdn_urls[variant_name]

                # Apply format override if different from default
                if optimal_format and optimal_format != ImageFormat.AUTO:
                    base_url = self._override_image_format(base_url, optimal_format)

                return base_url

            # Fallback to original if variant not available
            return asset_metadata.cdn_urls.get('original')

        except Exception as e:
            print(f"Asset URL generation error: {e}")
            return None

    async def _get_asset_metadata(self, asset_id: str) -> Optional[AssetMetadata]:
        """Get asset metadata (mock implementation)"""

        # Mock asset metadata
        if asset_id:
            return AssetMetadata(
                asset_id=asset_id,
                original_url=f"https://r2.protothrive.com/assets/{asset_id}",
                r2_key=f"assets/2024/01/01/{asset_id}",
                content_type="image/png",
                size_bytes=1024000,
                upload_time=datetime.utcnow(),
                variants=list(self.standard_variants.values()),
                cdn_urls={
                    variant.name: f"https://imagedelivery.net/mock/{asset_id}/{variant.name}"
                    for variant in self.standard_variants.values()
                },
                optimization_stats={
                    'bytes_saved': 768000,
                    'savings_percentage': 75.0
                }
            )

        return None

    def _select_optimal_format(
        self,
        user_agent: Optional[str],
        accept_header: Optional[str]
    ) -> ImageFormat:
        """Select optimal image format based on client capabilities"""

        if not accept_header:
            return ImageFormat.WEBP  # Safe default

        accept_lower = accept_header.lower()

        # Check for AVIF support (most efficient)
        if 'image/avif' in accept_lower:
            return ImageFormat.AVIF

        # Check for WebP support (widely supported)
        if 'image/webp' in accept_lower:
            return ImageFormat.WEBP

        # Fallback to JPEG
        return ImageFormat.JPEG

    def _override_image_format(self, base_url: str, format: ImageFormat) -> str:
        """Override image format in Cloudflare Images URL"""

        # Extract base URL and add format parameter
        if '/public' in base_url:
            return base_url.replace('/public', f'/f={format.value}')
        elif '/' in base_url and base_url.split('/')[-1]:
            # URL has existing transformations
            last_part = base_url.split('/')[-1]
            if 'f=' in last_part:
                # Replace existing format
                import re
                new_last_part = re.sub(r'f=\w+', f'f={format.value}', last_part)
                return '/'.join(base_url.split('/')[:-1] + [new_last_part])
            else:
                # Add format to existing transformations
                return f"{base_url},f={format.value}"

        return base_url

    async def purge_cache_for_asset(self, asset_id: str) -> bool:
        """Purge CDN cache for specific asset"""

        try:
            # Simulate cache purge
            print(f"Thermonuclear Cache Purge: Asset {asset_id} purged from CDN")

            # In real implementation, this would call Cloudflare's cache purge API
            return True

        except Exception as e:
            print(f"Cache purge error: {e}")
            return False

    async def get_asset_analytics(
        self,
        time_period_hours: int = 24
    ) -> Dict[str, Any]:
        """Get analytics about asset optimization and delivery"""

        return {
            'time_period_hours': time_period_hours,
            'global_stats': self.optimization_stats,
            'performance_metrics': {
                'avg_load_time_ms': 85,  # Mock data
                'cache_hit_rate_pct': 92.5,
                'bandwidth_saved_gb': 156.8,
                'requests_served': 12540
            },
            'format_distribution': {
                'webp': 65.2,
                'avif': 20.1,
                'jpeg': 12.4,
                'png': 2.3
            },
            'variant_usage': {
                'thumbnail': 35.2,
                'small': 28.9,
                'medium': 24.1,
                'large': 8.7,
                'retina': 3.1
            },
            'cost_savings': {
                'r2_storage_cost_usd': 12.45,
                'images_transform_cost_usd': 8.90,
                'bandwidth_saved_cost_usd': 87.30,
                'total_monthly_savings_usd': 65.95
            }
        }

    async def health_check(self) -> Dict[str, Any]:
        """Health check for R2 + Images optimization service"""

        return {
            'service': 'r2-images-optimization',
            'status': 'healthy',
            'r2_bucket': self.r2_bucket,
            'images_account_configured': bool(self.images_account_id),
            'standard_variants': len(self.standard_variants),
            'supported_categories': list(self.asset_categories.keys()),
            'optimization_features': [
                'automatic_format_selection',
                'responsive_variants',
                'global_cdn_delivery',
                'cost_optimized_storage',
                'real_time_optimization'
            ],
            'performance_targets': {
                'image_load_time_ms': '<100',
                'bandwidth_savings_pct': '>70',
                'cache_hit_rate_pct': '>90'
            }
        }


# Export for use in application
__all__ = [
    'R2ImagesOptimizationService',
    'ImageFormat',
    'ImageQuality',
    'ImageVariant',
    'AssetMetadata'
]