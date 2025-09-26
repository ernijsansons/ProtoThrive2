/**
 * Budget Service Implementation
 * Ref: CLAUDE.md - Real budget management with database persistence
 */

import {
  IBudgetService,
  BudgetCheckResult,
  CostMetadata,
  BudgetStatus,
  CostRecord,
} from './interfaces';

export class BudgetService implements IBudgetService {
  private db: any; // D1 database instance
  private kv: any; // KV store for caching
  private readonly DEFAULT_LIMIT = 0.10; // USD per task
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(env: any) {
    this.db = env.DB;
    this.kv = env.KV;
  }

  async checkBudget(taskCost: number, userId: string): Promise<BudgetCheckResult> {
    try {
      // Check cache first
      const cacheKey = `budget:${userId}`;
      const cached = await this.getCachedBudget(cacheKey);

      let currentUsage: number;
      let limit: number;

      if (cached) {
        currentUsage = cached.currentUsage;
        limit = cached.limit;
      } else {
        // Query database for current usage
        const result = await this.db.prepare(`
          SELECT
            COALESCE(SUM(cost), 0) as total_usage,
            COALESCE(MAX(budget_limit), ?) as budget_limit
          FROM agent_logs
          WHERE user_id = ?
            AND timestamp >= datetime('now', '-1 day')
            AND cost IS NOT NULL
        `).bind(this.DEFAULT_LIMIT, userId).first();

        currentUsage = result?.total_usage || 0;
        limit = result?.budget_limit || this.DEFAULT_LIMIT;

        // Cache the result
        await this.cacheBudget(cacheKey, { currentUsage, limit });
      }

      const remainingBudget = limit - currentUsage;
      const allowed = taskCost <= remainingBudget;

      // Log budget check
      await this.logBudgetCheck(userId, taskCost, allowed);

      return {
        allowed,
        currentUsage,
        limit,
        remainingBudget,
        reason: allowed ? undefined : `Task cost $${taskCost.toFixed(4)} exceeds remaining budget $${remainingBudget.toFixed(4)}`
      };
    } catch (error) {
      console.error('BudgetService.checkBudget error:', error);
      // Fail open in case of error (allow but log)
      await this.logError('checkBudget', error, { userId, taskCost });
      return {
        allowed: true,
        currentUsage: 0,
        limit: this.DEFAULT_LIMIT,
        remainingBudget: this.DEFAULT_LIMIT,
        reason: 'Budget check failed, allowing by default'
      };
    }
  }

  async recordCost(actualCost: number, userId: string, metadata?: CostMetadata): Promise<void> {
    try {
      const id = crypto.randomUUID();

      await this.db.prepare(`
        INSERT INTO agent_logs (
          id, user_id, task_type, model_used, token_count, cost, status, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
      `).bind(
        id,
        userId,
        metadata?.taskType || 'unknown',
        metadata?.model || 'unknown',
        metadata?.tokenCount || 0,
        actualCost
      ).run();

      // Invalidate cache
      await this.invalidateCache(`budget:${userId}`);

      // Check if user is approaching limit
      const status = await this.getBudgetStatus(userId);
      if (status.currentUsage / status.limit > 0.8) {
        await this.sendBudgetWarning(userId, status);
      }

    } catch (error) {
      console.error('BudgetService.recordCost error:', error);
      await this.logError('recordCost', error, { userId, actualCost, metadata });
    }
  }

  async getBudgetStatus(userId: string): Promise<BudgetStatus> {
    try {
      // Get current usage and history
      const [summary, history] = await Promise.all([
        this.db.prepare(`
          SELECT
            COALESCE(SUM(cost), 0) as total_usage,
            COALESCE(MAX(budget_limit), ?) as budget_limit,
            COUNT(*) as task_count
          FROM agent_logs
          WHERE user_id = ?
            AND timestamp >= datetime('now', '-1 day')
            AND cost IS NOT NULL
        `).bind(this.DEFAULT_LIMIT, userId).first(),

        this.db.prepare(`
          SELECT
            timestamp,
            cost,
            task_type,
            model_used,
            token_count
          FROM agent_logs
          WHERE user_id = ?
            AND timestamp >= datetime('now', '-1 day')
            AND cost IS NOT NULL
          ORDER BY timestamp DESC
          LIMIT 100
        `).bind(userId).all()
      ]);

      const currentUsage = summary?.total_usage || 0;
      const limit = summary?.budget_limit || this.DEFAULT_LIMIT;

      const costHistory: CostRecord[] = (history?.results || []).map(record => ({
        timestamp: new Date(record.timestamp),
        cost: record.cost,
        metadata: {
          taskType: record.task_type,
          model: record.model_used,
          tokenCount: record.token_count
        }
      }));

      return {
        userId,
        currentUsage,
        limit,
        period: 'daily',
        resetAt: this.getNextResetTime(),
        history: costHistory
      };

    } catch (error) {
      console.error('BudgetService.getBudgetStatus error:', error);
      throw new Error(`Failed to get budget status: ${error}`);
    }
  }

  async resetBudget(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Reset specific user
        await this.db.prepare(`
          UPDATE agent_logs
          SET archived = 1
          WHERE user_id = ?
            AND timestamp < datetime('now', '-1 day')
        `).bind(userId).run();

        await this.invalidateCache(`budget:${userId}`);
      } else {
        // Reset all users (admin operation)
        await this.db.prepare(`
          UPDATE agent_logs
          SET archived = 1
          WHERE timestamp < datetime('now', '-1 day')
        `).run();

        // Clear all budget caches
        if (this.kv) {
          const keys = await this.kv.list({ prefix: 'budget:' });
          await Promise.all(keys.keys.map(key => this.kv.delete(key.name)));
        }
      }

      console.log(`Budget reset completed for ${userId || 'all users'}`);
    } catch (error) {
      console.error('BudgetService.resetBudget error:', error);
      throw new Error(`Failed to reset budget: ${error}`);
    }
  }

  // Private helper methods

  private async getCachedBudget(key: string): Promise<any> {
    if (!this.kv) return null;

    try {
      const cached = await this.kv.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private async cacheBudget(key: string, data: any): Promise<void> {
    if (!this.kv) return;

    try {
      await this.kv.put(key, JSON.stringify(data), {
        expirationTtl: this.CACHE_TTL
      });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private async invalidateCache(key: string): Promise<void> {
    if (!this.kv) return;

    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  private async logBudgetCheck(userId: string, taskCost: number, allowed: boolean): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO audit_logs (id, user_id, action, details, timestamp)
        VALUES (?, ?, 'budget_check', ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        userId,
        JSON.stringify({ taskCost, allowed })
      ).run();
    } catch (error) {
      console.error('Failed to log budget check:', error);
    }
  }

  private async sendBudgetWarning(userId: string, status: BudgetStatus): Promise<void> {
    const percentage = (status.currentUsage / status.limit * 100).toFixed(0);
    console.warn(`Budget warning for user ${userId}: ${percentage}% used`);

    // In production, this would send to Slack or email
    if (this.kv) {
      await this.kv.put(
        `budget_warning:${userId}`,
        JSON.stringify({
          percentage,
          timestamp: Date.now(),
          currentUsage: status.currentUsage,
          limit: status.limit
        }),
        { expirationTtl: 3600 } // 1 hour
      );
    }
  }

  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private async logError(method: string, error: any, context: any): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO error_logs (id, service, method, error, context, timestamp)
        VALUES (?, 'BudgetService', ?, ?, ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        method,
        error.toString(),
        JSON.stringify(context)
      ).run();
    } catch {
      // Silently fail if error logging fails
    }
  }
}