
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  experimental: {
    esmExternals: false
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.spline.design; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self'; connect-src 'self' https://api.protothrive.com wss://api.protothrive.com; media-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), fullscreen=(self), payment=(), usb=(), magnetometer=(), gyroscope=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Bundle optimization for <2MB target with aggressive code splitting
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        minSize: 20000,
        maxSize: 200000, // 200KB max per chunk
        cacheGroups: {
          // Core React dependencies
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 20,
          },
          // Essential vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 150000, // 150KB max per vendor chunk
            priority: 5,
          },
          // Heavy 3D libraries (optional, loaded on demand)
          three: {
            test: /[\\/]node_modules[\\/](@react-three|three|@splinetool)[\\/]/,
            name: 'three-libs',
            chunks: 'async', // Only load when needed
            priority: 15,
          },
          // Animation libraries (optional)
          animation: {
            test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
            name: 'animation',
            chunks: 'async',
            priority: 15,
          },
          // React Flow (load on demand)
          reactflow: {
            test: /[\\/]node_modules[\\/]reactflow[\\/]/,
            name: 'reactflow',
            chunks: 'async',
            priority: 15,
          },
          // Common components
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
            priority: 1,
          },
        },
      },
    };

    // Tree shaking optimization
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    return config;
  }
}

module.exports = nextConfig

// Bundle analysis - run with ANALYZE=true npm run build
if (process.env.ANALYZE) {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  module.exports = withBundleAnalyzer(nextConfig);
}
