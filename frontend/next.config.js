/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Cloudflare Workers optimized configuration - SSR Mode
  output: 'standalone',
  trailingSlash: true,
  distDir: '.next',
  
  // Generate unique build ID for cache busting
  generateBuildId: () => 'production-' + Date.now(),

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@heroicons/react', 'lucide-react', 'framer-motion'],
  },

  // Image optimization for Cloudflare
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Security headers for production
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), vr=(), accelerometer=(), gyroscope=(), magnetometer=(), fullscreen=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' *.cloudflare.com *.spline.design;
              style-src 'self' 'unsafe-inline' fonts.googleapis.com;
              font-src 'self' fonts.gstatic.com;
              img-src 'self' data: blob: *.amazonaws.com *.cloudflare.com *.spline.design;
              connect-src 'self' *.cloudflare.com wss: ws:;
              frame-src 'self' *.spline.design;
              worker-src 'self' blob:;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              block-all-mixed-content;
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim()
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Build configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack optimizations for Cloudflare Workers
  webpack: (config, { buildId, dev, isServer, defaultLoaders }) => {
    // Client-side optimizations
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
      };

      // Bundle splitting optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = require('crypto').createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name: false,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Tree shaking optimizations
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    // Production optimizations
    if (!dev) {
      config.optimization.minimize = true;
      config.optimization.concatenateModules = true;
      config.optimization.providedExports = true;
    }

    return config;
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
  },
};

module.exports = nextConfig;