/**
 * ESBuild configuration for ProtoThrive backend optimization
 * Optimizes bundle size for sub-10ms cold starts
 */

const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

const isProduction = process.env.NODE_ENV === 'production';

const buildConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  target: 'es2022',
  format: 'esm',
  platform: 'neutral',
  minify: isProduction,
  sourcemap: !isProduction,

  // Cloudflare Workers optimizations
  conditions: ['worker', 'browser'],
  mainFields: ['browser', 'module', 'main'],

  // Bundle size optimizations
  treeShaking: true,
  metafile: true,
  legalComments: 'none',

  // External dependencies (Cloudflare runtime provides these)
  external: [
    'cloudflare:workers',
    '__STATIC_CONTENT_MANIFEST'
  ],

  // Define environment variables at build time
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'global': 'globalThis'
  },

  // Optimize imports
  alias: {
    // Use ESM versions where available
    'jose': 'jose/dist/browser/index.js',
  },

  plugins: [
    // Exclude Node.js built-ins and large dependencies
    nodeExternalsPlugin({
      allowList: [
        'hono',
        'jose',
        'zod'
      ]
    }),

    // Custom plugin to optimize imports
    {
      name: 'optimize-imports',
      setup(build) {
        // Replace heavy crypto polyfills with Web Crypto API
        build.onResolve({ filter: /^crypto$/ }, (args) => {
          return { path: args.path, external: true };
        });

        // Optimize date libraries
        build.onResolve({ filter: /^date-fns/ }, (args) => {
          return { path: args.path, external: true };
        });
      }
    }
  ]
};

// Production-specific optimizations
if (isProduction) {
  buildConfig.drop = ['console', 'debugger'];
  buildConfig.mangleProps = /^_/;
  buildConfig.pure = ['console.log', 'console.debug'];
}

async function build() {
  try {
    const result = await esbuild.build(buildConfig);

    if (result.metafile) {
      const analysis = await esbuild.analyzeMetafile(result.metafile);
      console.log('Bundle analysis:', analysis);

      // Calculate bundle size
      const bundleSize = Object.values(result.metafile.outputs)[0].bytes;
      console.log(`Bundle size: ${(bundleSize / 1024).toFixed(2)} KB`);

      if (bundleSize > 1024 * 1024) { // 1MB warning
        console.warn('⚠️  Bundle size exceeds 1MB - may impact cold start performance');
      }
    }

    console.log('✅ Build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Watch mode for development
if (process.argv.includes('--watch')) {
  buildConfig.watch = {
    onRebuild(error, result) {
      if (error) {
        console.error('❌ Rebuild failed:', error);
      } else {
        console.log('✅ Rebuild completed');
      }
    }
  };
}

module.exports = buildConfig;

// Run build if this file is executed directly
if (require.main === module) {
  build();
}