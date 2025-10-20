/**
 * Migration Management System for ProtoThrive
 * Handles database schema versioning, migrations, and rollbacks
 *
 * @fileoverview Database migration management with versioning and validation
 * @version 1.0.0
 */

interface Migration {
  version: number;
  name: string;
  up: string;    // SQL for applying migration
  down: string;  // SQL for rolling back
  checksum: string; // SHA-256 of SQL for validation
}

interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
  checksum: string;
  execution_time_ms: number;
}

export class MigrationManager {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Ensure migration tracking table exists
   */
  async ensureMigrationTable(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT NOT NULL,
        execution_time_ms INTEGER,
        applied_by TEXT DEFAULT 'system'
      );

      CREATE INDEX IF NOT EXISTS idx_migrations_applied ON schema_migrations(applied_at DESC);
    `);

    console.log('Migration tracking table ensured');
  }

  /**
   * Get current database schema version
   */
  async getCurrentVersion(): Promise<number> {
    try {
      const result = await this.db
        .prepare('SELECT MAX(version) as version FROM schema_migrations')
        .first<{ version: number | null }>();

      return result?.version || 0;
    } catch (error) {
      // Table doesn't exist yet
      return 0;
    }
  }

  /**
   * Get all applied migrations
   */
  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    try {
      const result = await this.db
        .prepare('SELECT * FROM schema_migrations ORDER BY version')
        .all<MigrationRecord>();

      return result.results || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if migration has already been applied
   */
  async isMigrationApplied(version: number): Promise<boolean> {
    try {
      const result = await this.db
        .prepare('SELECT 1 FROM schema_migrations WHERE version = ?')
        .bind(version)
        .first();

      return result !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate checksum of SQL content
   */
  async calculateChecksum(sql: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(sql);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration: Migration): Promise<void> {
    const start = Date.now();

    // Check if already applied
    const alreadyApplied = await this.isMigrationApplied(migration.version);
    if (alreadyApplied) {
      console.log(`Migration ${migration.version} (${migration.name}) already applied, skipping`);
      return;
    }

    console.log(`Applying migration ${migration.version}: ${migration.name}`);

    try {
      // Execute migration SQL
      await this.db.exec(migration.up);

      const executionTime = Date.now() - start;

      // Record migration
      await this.db
        .prepare(`
          INSERT INTO schema_migrations (version, name, checksum, execution_time_ms)
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          migration.version,
          migration.name,
          migration.checksum,
          executionTime
        )
        .run();

      console.log(`✅ Migration ${migration.version} applied successfully in ${executionTime}ms`);
    } catch (error) {
      console.error(`❌ Migration ${migration.version} failed:`, error);
      throw new Error(`Migration ${migration.version} (${migration.name}) failed: ${error}`);
    }
  }

  /**
   * Apply all pending migrations
   */
  async applyPendingMigrations(migrations: Migration[]): Promise<void> {
    await this.ensureMigrationTable();

    const currentVersion = await this.getCurrentVersion();
    console.log(`Current database version: ${currentVersion}`);

    const pendingMigrations = migrations
      .filter(m => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      await this.applyMigration(migration);
    }

    console.log(`✅ All migrations applied. Current version: ${await this.getCurrentVersion()}`);
  }

  /**
   * Rollback to a specific version
   */
  async rollback(targetVersion: number, migrations: Migration[]): Promise<void> {
    const currentVersion = await this.getCurrentVersion();

    if (targetVersion >= currentVersion) {
      throw new Error(`Target version ${targetVersion} must be less than current version ${currentVersion}`);
    }

    console.log(`Rolling back from version ${currentVersion} to ${targetVersion}`);

    // Get migrations to rollback (in reverse order)
    const migrationsToRollback = migrations
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version);

    for (const migration of migrationsToRollback) {
      await this.applyRollback(migration);
    }

    console.log(`✅ Rollback complete. Current version: ${await this.getCurrentVersion()}`);
  }

  /**
   * Apply rollback for a single migration
   */
  private async applyRollback(migration: Migration): Promise<void> {
    console.log(`Rolling back migration ${migration.version}: ${migration.name}`);

    try {
      // Execute rollback SQL
      if (migration.down) {
        await this.db.exec(migration.down);
      }

      // Remove migration record
      await this.db
        .prepare('DELETE FROM schema_migrations WHERE version = ?')
        .bind(migration.version)
        .run();

      console.log(`✅ Migration ${migration.version} rolled back successfully`);
    } catch (error) {
      console.error(`❌ Rollback of migration ${migration.version} failed:`, error);
      throw new Error(`Rollback of migration ${migration.version} failed: ${error}`);
    }
  }

  /**
   * Validate migration checksums
   */
  async validateMigrations(migrations: Migration[]): Promise<boolean> {
    const appliedMigrations = await this.getAppliedMigrations();

    for (const applied of appliedMigrations) {
      const migration = migrations.find(m => m.version === applied.version);

      if (!migration) {
        console.error(`❌ Applied migration ${applied.version} not found in migration files`);
        return false;
      }

      if (migration.checksum !== applied.checksum) {
        console.error(`❌ Checksum mismatch for migration ${applied.version}`);
        console.error(`  Expected: ${applied.checksum}`);
        console.error(`  Got: ${migration.checksum}`);
        return false;
      }
    }

    console.log('✅ All migration checksums valid');
    return true;
  }

  /**
   * Get migration status report
   */
  async getStatus(migrations: Migration[]): Promise<string> {
    const currentVersion = await this.getCurrentVersion();
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);

    let report = '\n';
    report += '='.repeat(60) + '\n';
    report += '             DATABASE MIGRATION STATUS\n';
    report += '='.repeat(60) + '\n\n';
    report += `Current Version: ${currentVersion}\n`;
    report += `Applied Migrations: ${appliedMigrations.length}\n`;
    report += `Pending Migrations: ${pendingMigrations.length}\n\n`;

    if (appliedMigrations.length > 0) {
      report += 'Applied Migrations:\n';
      report += '-'.repeat(60) + '\n';
      for (const m of appliedMigrations) {
        report += `  ✅ v${m.version.toString().padStart(3, '0')} - ${m.name}\n`;
        report += `     Applied: ${m.applied_at}\n`;
        report += `     Duration: ${m.execution_time_ms}ms\n\n`;
      }
    }

    if (pendingMigrations.length > 0) {
      report += 'Pending Migrations:\n';
      report += '-'.repeat(60) + '\n';
      for (const m of pendingMigrations) {
        report += `  ⏳ v${m.version.toString().padStart(3, '0')} - ${m.name}\n\n`;
      }
    }

    report += '='.repeat(60) + '\n';

    return report;
  }
}

/**
 * Create migration manager instance
 */
export function createMigrationManager(db: D1Database): MigrationManager {
  return new MigrationManager(db);
}
