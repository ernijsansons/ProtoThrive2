/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'framer-motion',
      'reactflow',
      '@splinetool/react-spline',
      'firebase',
      'lodash',
      'axios'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Webpack configuration for bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Bundle splitting optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Vendor chunk for stable dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
            enforce: true,
          },
          // React ecosystem chunk
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
            name: 'react',
            priority: 20,
            chunks: 'all',
            enforce: true,
          },
          // Next.js chunk
          nextjs: {
            test: /[\\/]node_modules[\\/](next)[\\/]/,
            name: 'nextjs',
            priority: 20,
            chunks: 'all',
            enforce: true,
          },
          // UI libraries chunk
          ui: {
            test: /[\\/]node_modules[\\/](framer-motion|reactflow|@splinetool|three)[\\/]/,
            name: 'ui-libs',
            priority: 15,
            chunks: 'all',
            enforce: true,
          },
          // Firebase chunk
          firebase: {
            test: /[\\/]node_modules[\\/](firebase)[\\/]/,
            name: 'firebase',
            priority: 15,
            chunks: 'all',
            enforce: true,
          },
          // Utility libraries chunk
          utils: {
            test: /[\\/]node_modules[\\/](lodash|axios|date-fns|uuid)[\\/]/,
            name: 'utils',
            priority: 10,
            chunks: 'all',
            enforce: true,
          },
          // Common chunk for shared code
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
            enforce: true,
          },
        },
      };

      // Performance budgets
      config.performance = {
        maxAssetSize: 500000, // 500KB
        maxEntrypointSize: 500000, // 500KB
        hints: 'warning',
      };
    }

    // Tree shaking optimization
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    // Module resolution optimization
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@components': require('path').resolve(__dirname, 'src/components'),
      '@utils': require('path').resolve(__dirname, 'src/utils'),
      '@services': require('path').resolve(__dirname, 'src/services'),
      '@styles': require('path').resolve(__dirname, 'src/styles'),
    };

    // Bundle analyzer (only in development)
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerPort: 8888,
          openAnalyzer: true,
        })
      );
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compression
  compress: true,

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard-rebuilt',
        permanent: true,
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Output configuration
  output: 'standalone',

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false,
  },

  // PoweredByHeader
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,

  // SWC minification
  swcMinify: true,

  // Trailing slash
  trailingSlash: false,

  // Base path (if needed)
  // basePath: '/protothrive',

  // Asset prefix (if using CDN)
  // assetPrefix: 'https://cdn.example.com',

  // Generate ETags
  generateEtags: true,

  // On demand entries
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;