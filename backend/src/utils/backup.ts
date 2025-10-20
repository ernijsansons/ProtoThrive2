/**
 * Database Backup and Recovery System
 * Automated backups to Cloudflare R2 with verification
 *
 * @fileoverview Backup management for ProtoThrive database
 * @version 1.0.0
 */

export interface BackupMetadata {
  backupId: string;
  timestamp: string;
  size: number;
  checksum: string;
  dbVersion: number;
  tables: string[];
}

export class BackupManager {
  private db: D1Database;
  private r2?: R2Bucket;

  constructor(db: D1Database, r2?: R2Bucket) {
    this.db = db;
    this.r2 = r2;
  }

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<BackupMetadata> {
    const backupId = `backup-${new Date().toISOString().split('T')[0]}-${Date.now()}`;
    const timestamp = new Date().toISOString();

    console.log(`Creating backup: ${backupId}`);

    // Export all tables
    const tables = await this.getTables();
    const backupData: Record<string, any[]> = {};

    for (const table of tables) {
      console.log(`  Exporting table: ${table}`);
      const data = await this.exportTable(table);
      backupData[table] = data;
    }

    // Get database version
    const dbVersion = await this.getDatabaseVersion();

    // Serialize backup data
    const backupJson = JSON.stringify({
      metadata: {
        backupId,
        timestamp,
        dbVersion,
        tables: tables.map(t => t)
      },
      data: backupData
    }, null, 2);

    // Calculate checksum
    const checksum = await this.calculateChecksum(backupJson);
    const size = new TextEncoder().encode(backupJson).length;

    // Save to R2 if available
    if (this.r2) {
      await this.uploadToR2(backupId, backupJson, checksum);
      console.log(`✅ Backup saved to R2: ${backupId}`);
    } else {
      console.warn('⚠️  R2 not configured, backup not uploaded');
    }

    return {
      backupId,
      timestamp,
      size,
      checksum,
      dbVersion,
      tables: tables.map(t => t)
    };
  }

  /**
   * Restore database from backup
   */
  async restoreFromBackup(backupId: string): Promise<void> {
    console.log(`Restoring from backup: ${backupId}`);

    if (!this.r2) {
      throw new Error('R2 not configured for backup restore');
    }

    // Download backup from R2
    const backupJson = await this.downloadFromR2(backupId);
    const backup = JSON.parse(backupJson);

    // Verify checksum
    const expectedChecksum = await this.getStoredChecksum(backupId);
    const actualChecksum = await this.calculateChecksum(backupJson);

    if (expectedChecksum !== actualChecksum) {
      throw new Error('Backup checksum mismatch - data may be corrupted');
    }

    // Restore tables
    for (const [table, data] of Object.entries(backup.data)) {
      console.log(`  Restoring table: ${table}`);
      await this.importTable(table, data as any[]);
    }

    console.log(`✅ Backup restored successfully`);
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    if (!this.r2) {
      console.warn('⚠️  R2 not configured, cannot verify backup');
      return false;
    }

    try {
      // Download backup
      const backupJson = await this.downloadFromR2(backupId);

      // Verify JSON is valid
      const backup = JSON.parse(backupJson);

      // Verify checksum
      const storedChecksum = await this.getStoredChecksum(backupId);
      const calculatedChecksum = await this.calculateChecksum(backupJson);

      if (storedChecksum !== calculatedChecksum) {
        console.error(`❌ Checksum mismatch for backup ${backupId}`);
        return false;
      }

      // Verify all tables present
      const tables = await this.getTables();
      for (const table of tables) {
        if (!backup.data[table]) {
          console.error(`❌ Table ${table} missing from backup`);
          return false;
        }
      }

      console.log(`✅ Backup ${backupId} verified successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Backup verification failed:`, error);
      return false;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    if (!this.r2) {
      return [];
    }

    const backups: BackupMetadata[] = [];

    // List objects in R2 bucket with backup prefix
    const listed = await this.r2.list({ prefix: 'backups/backup-' });

    for (const object of listed.objects) {
      // Parse metadata from object
      const metadata = object.customMetadata;
      if (metadata) {
        backups.push({
          backupId: metadata.backupId || object.key,
          timestamp: metadata.timestamp || object.uploaded.toISOString(),
          size: object.size,
          checksum: metadata.checksum || '',
          dbVersion: parseInt(metadata.dbVersion || '0', 10),
          tables: JSON.parse(metadata.tables || '[]')
        });
      }
    }

    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Delete old backups (retention policy)
   */
  async pruneOldBackups(retentionDays: number = 30): Promise<number> {
    if (!this.r2) {
      return 0;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const backups = await this.listBackups();
    let deletedCount = 0;

    for (const backup of backups) {
      if (new Date(backup.timestamp) < cutoffDate) {
        await this.r2.delete(`backups/${backup.backupId}`);
        console.log(`Deleted old backup: ${backup.backupId}`);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Private helper methods

  private async getTables(): Promise<string[]> {
    const result = await this.db
      .prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_cf_%'
        ORDER BY name
      `)
      .all<{ name: string }>();

    return result.results.map(r => r.name);
  }

  private async exportTable(tableName: string): Promise<any[]> {
    const result = await this.db
      .prepare(`SELECT * FROM ${tableName}`)
      .all();

    return result.results || [];
  }

  private async importTable(tableName: string, data: any[]): Promise<void> {
    if (data.length === 0) return;

    // Clear existing data
    await this.db.exec(`DELETE FROM ${tableName}`);

    // Get column names from first row
    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');

    // Batch insert
    for (const row of data) {
      const values = columns.map(col => row[col]);
      await this.db
        .prepare(`INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`)
        .bind(...values)
        .run();
    }
  }

  private async getDatabaseVersion(): Promise<number> {
    try {
      const result = await this.db
        .prepare('SELECT MAX(version) as version FROM schema_migrations')
        .first<{ version: number }>();

      return result?.version || 0;
    } catch (error) {
      return 0;
    }
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async uploadToR2(backupId: string, data: string, checksum: string): Promise<void> {
    if (!this.r2) return;

    await this.r2.put(`backups/${backupId}`, data, {
      customMetadata: {
        backupId,
        timestamp: new Date().toISOString(),
        checksum,
        dbVersion: (await this.getDatabaseVersion()).toString(),
        tables: JSON.stringify(await this.getTables())
      }
    });

    // Store checksum separately for verification
    await this.r2.put(`backups/${backupId}.checksum`, checksum);
  }

  private async downloadFromR2(backupId: string): Promise<string> {
    if (!this.r2) {
      throw new Error('R2 not configured');
    }

    const object = await this.r2.get(`backups/${backupId}`);

    if (!object) {
      throw new Error(`Backup ${backupId} not found`);
    }

    return await object.text();
  }

  private async getStoredChecksum(backupId: string): Promise<string> {
    if (!this.r2) {
      throw new Error('R2 not configured');
    }

    const checksumObject = await this.r2.get(`backups/${backupId}.checksum`);

    if (!checksumObject) {
      throw new Error(`Checksum for backup ${backupId} not found`);
    }

    return await checksumObject.text();
  }
}

/**
 * Create backup manager instance
 */
export function createBackupManager(db: D1Database, r2?: R2Bucket): BackupManager {
  return new BackupManager(db, r2);
}

/**
 * Scheduled backup job (to be called by Cloudflare Cron Trigger)
 */
export async function scheduledBackupJob(env: { DB: D1Database; R2_BUCKET?: R2Bucket }): Promise<void> {
  const backupManager = createBackupManager(env.DB, env.R2_BUCKET);

  // Create daily backup
  const backup = await backupManager.createBackup();
  console.log(`✅ Scheduled backup created: ${backup.backupId}`);

  // Prune backups older than 30 days
  const deleted = await backupManager.pruneOldBackups(30);
  console.log(`✅ Pruned ${deleted} old backups`);

  // Verify latest backup
  const isValid = await backupManager.verifyBackup(backup.backupId);
  if (!isValid) {
    throw new Error('Backup verification failed');
  }
}
