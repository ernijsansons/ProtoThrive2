/**
 * Migration CLI Tool
 * Usage:
 *   npm run db:migrate:status  - Show migration status
 *   npm run db:migrate:up      - Apply pending migrations
 *   npm run db:migrate:down    - Rollback last migration
 */

import { createMigrationManager } from '../src/utils/migrations';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
  checksum: string;
}

/**
 * Load all migration files from migrations directory
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsDir = path.join(__dirname, '../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const migrations: Migration[] = [];

  for (const file of files) {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) continue;

    const version = parseInt(match[1], 10);
    const name = match[2].replace(/_/g, ' ');
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    // Calculate checksum
    const encoder = new TextEncoder();
    const data = encoder.encode(sql);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    migrations.push({
      version,
      name,
      up: sql,
      down: '', // TODO: Add rollback SQL if needed
      checksum
    });
  }

  return migrations;
}

/**
 * Get mock D1Database for local testing
 * In production, this would use actual Wrangler bindings
 */
function getMockDatabase(): D1Database {
  console.log('⚠️  Using mock database for local testing');
  console.log('⚠️  In production, use: wrangler d1 migrations apply');

  // This is a mock - actual implementation would use Wrangler
  return {
    prepare: () => ({
      bind: () => ({
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => ({ success: true })
      })
    }),
    exec: async (sql: string) => {
      console.log(`[MOCK] Executing SQL:\n${sql.substring(0, 100)}...`);
    }
  } as any;
}

/**
 * Main CLI execution
 */
async function main() {
  const command = process.argv[2] || 'status';

  const db = getMockDatabase();
  const manager = createMigrationManager(db);
  const migrations = await loadMigrations();

  console.log(`\n📦 Loaded ${migrations.length} migration files\n`);

  switch (command) {
    case 'status':
      const status = await manager.getStatus(migrations);
      console.log(status);
      break;

    case 'up':
      console.log('🚀 Applying pending migrations...\n');
      await manager.applyPendingMigrations(migrations);
      break;

    case 'down':
      const currentVersion = await manager.getCurrentVersion();
      if (currentVersion === 0) {
        console.log('No migrations to rollback');
        break;
      }
      console.log(`⏪ Rolling back to version ${currentVersion - 1}...\n`);
      await manager.rollback(currentVersion - 1, migrations);
      break;

    case 'validate':
      console.log('🔍 Validating migrations...\n');
      const isValid = await manager.validateMigrations(migrations);
      if (isValid) {
        console.log('✅ All migrations are valid');
        process.exit(0);
      } else {
        console.log('❌ Migration validation failed');
        process.exit(1);
      }
      break;

    default:
      console.log('Unknown command. Use: status, up, down, or validate');
      process.exit(1);
  }
}

// Run CLI
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
