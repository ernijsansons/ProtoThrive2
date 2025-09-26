/**
 * Mock Budget Service for Testing
 * Ref: CLAUDE.md - Test mock implementations
 */

import {
  IBudgetService,
  BudgetCheckResult,
  CostMetadata,
  BudgetStatus,
} from '../interfaces';

export class MockBudgetService implements IBudgetService {
  private usage: Map<string, number> = new Map();
  private readonly limit = 0.10;

  async checkBudget(taskCost: number, userId: string): Promise<BudgetCheckResult> {
    const currentUsage = this.usage.get(userId) || 0;
    const remainingBudget = this.limit - currentUsage;
    const allowed = taskCost <= remainingBudget;

    console.log(`Mock Budget Check: User ${userId}, Cost $${taskCost}, Allowed: ${allowed}`);

    return {
      allowed,
      currentUsage,
      limit: this.limit,
      remainingBudget,
      reason: allowed ? undefined : 'Mock budget exceeded'
    };
  }

  async recordCost(actualCost: number, userId: string, metadata?: CostMetadata): Promise<void> {
    const currentUsage = this.usage.get(userId) || 0;
    this.usage.set(userId, currentUsage + actualCost);
    console.log(`Mock Cost Recorded: User ${userId}, Cost $${actualCost}`);
  }

  async getBudgetStatus(userId: string): Promise<BudgetStatus> {
    return {
      userId,
      currentUsage: this.usage.get(userId) || 0,
      limit: this.limit,
      period: 'daily',
      resetAt: new Date(Date.now() + 86400000),
      history: []
    };
  }

  async resetBudget(userId?: string): Promise<void> {
    if (userId) {
      this.usage.delete(userId);
    } else {
      this.usage.clear();
    }
    console.log(`Mock Budget Reset: ${userId || 'all users'}`);
  }
}