/**
 * Mock Kill-Switch Service for Testing
 * Ref: CLAUDE.md - Test mock implementations
 */

import {
  IKillSwitchService,
  KillSwitchStatus,
} from '../interfaces';

export class MockKillSwitchService implements IKillSwitchService {
  private status: KillSwitchStatus = { active: false };
  private subscribers: Set<(status: KillSwitchStatus) => void> = new Set();

  async checkStatus(): Promise<KillSwitchStatus> {
    console.log(`Mock Kill Switch Status: ${this.status.active ? 'ACTIVE' : 'INACTIVE'}`);
    return this.status;
  }

  async activate(reason: string, duration?: number): Promise<void> {
    this.status = {
      active: true,
      reason,
      activatedAt: new Date(),
      expiresAt: duration ? new Date(Date.now() + duration * 1000) : undefined,
      activatedBy: 'mock'
    };

    console.log(`Mock Kill Switch ACTIVATED: ${reason}`);
    this.notifySubscribers();

    // Auto-deactivate after duration
    if (duration) {
      setTimeout(() => {
        this.deactivate();
      }, duration * 1000);
    }
  }

  async deactivate(): Promise<void> {
    this.status = { active: false };
    console.log('Mock Kill Switch DEACTIVATED');
    this.notifySubscribers();
  }

  subscribe(callback: (status: KillSwitchStatus) => void): () => void {
    this.subscribers.add(callback);
    callback(this.status); // Send current status immediately
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback(this.status));
  }

  dispose(): void {
    this.subscribers.clear();
  }
}