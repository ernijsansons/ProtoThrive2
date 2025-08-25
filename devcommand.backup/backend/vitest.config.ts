import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        ENVIRONMENT: 'test',
        APP_URL: 'http://localhost:3000',
      },
      kvNamespaces: ['CACHE', 'SNIPPETS'],
      d1Databases: ['DB'],
      durableObjects: {
        ROADMAP_ROOMS: 'RoadmapRoom',
        WEBSOCKET_MANAGER: 'WebSocketManager',
        RATE_LIMITER: 'RateLimiter',
      },
    },
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@devcommand/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});