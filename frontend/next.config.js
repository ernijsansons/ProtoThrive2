/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Static export for Cloudflare Pages
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  
  // TypeScript and ESLint
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ['src/pages', 'src/components', 'src/lib', 'src/hooks', 'src/styles'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5000',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
    SPLINE_SCENE: process.env.SPLINE_SCENE || 'https://prod.spline.design/neon-cube-thermo/scene.splinecode',
  },

  // Image optimization - disabled for static export
  images: {
    unoptimized: true,
    domains: ['localhost', 'devcommand.com', 'spline.design', 'uxpilot.ai'],
    formats: ['image/avif', 'image/webp'],
  },

  // Note: headers() and redirects() are disabled for static export
  // These would be handled by Cloudflare Pages configuration instead

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Handle CSS imports from node_modules
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
