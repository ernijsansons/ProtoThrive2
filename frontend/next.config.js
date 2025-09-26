/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  i18n,
  
  // Cloudflare Workers optimized configuration - SSR Mode
  output: 'standalone',
  trailingSlash: true,
  distDir: '.next',
  
  // Generate unique build ID for cache busting
  generateBuildId: () => 'production-' + Date.now(),

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-slot',
      'reactflow',
      '@splinetool/react-spline',
      'class-variance-authority'
    ],
    scrollRestoration: true,
  },
  
  // Enable modularize imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}',
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}',
    },
  },

  // Image optimization for Cloudflare - Fix for PERF-004
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'protothrive-frontend.pages.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'backend-thermo-staging.ernijs-ansons.workers.dev',
        port: '',
        pathname: '/**',
      },
    ],
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
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), vr=(), accelerometer=(), gyroscope=(), magnetometer=(), fullscreen=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' *.cloudflare.com *.spline.design 'sha256-dOt+YXlqQ7B1YDQqJT5EqRop5SMdWJJwq2xkdWb9GtE=';
              style-src 'self' fonts.googleapis.com 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';
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

  // Build configuration - strict mode for production safety
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src', 'pages', 'components', 'lib', 'utils', 'hooks', 'services'],
  },
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.json',
  },
  
  // Enable Strict Mode for better error detection
  productionBrowserSourceMaps: false,

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