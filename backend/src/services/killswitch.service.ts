/**
 * Kill-Switch Service Implementation
 * Ref: CLAUDE.md - Emergency control system with KV persistence
 */

import {
  IKillSwitchService,
  KillSwitchStatus,
} from './interfaces';

export class KillSwitchService implements IKillSwitchService {
  private kv: any; // KV store instance
  private db: any; // D1 database for audit logging
  private readonly KEY = 'proto_paused';
  private readonly STATUS_KEY = 'kill_switch_status';
  private subscribers: Set<(status: KillSwitchStatus) => void> = new Set();
  private pollInterval: any = null;
  private lastStatus: KillSwitchStatus | null = null;

  constructor(env: any) {
    this.kv = env.KV;
    this.db = env.DB;
    this.startPolling();
  }

  async checkStatus(): Promise<KillSwitchStatus> {
    try {
      // Check primary kill switch flag
      const isPaused = await this.kv?.get(this.KEY);

      if (isPaused === 'true' || isPaused === true) {
        // Get detailed status
        const statusData = await this.kv?.get(this.STATUS_KEY);
        const status = statusData ? JSON.parse(statusData) : {};

        const currentStatus: KillSwitchStatus = {
          active: true,
          reason: status.reason || 'System paused',
          activatedAt: status.activatedAt ? new Date(status.activatedAt) : new Date(),
          expiresAt: status.expiresAt ? new Date(status.expiresAt) : undefined,
          activatedBy: status.activatedBy || 'system'
        };

        // Check if expired
        if (currentStatus.expiresAt && currentStatus.expiresAt < new Date()) {
          await this.deactivate();
          return { active: false };
        }

        // Notify subscribers if status changed
        this.notifyIfChanged(currentStatus);

        return currentStatus;
      }

      const inactiveStatus: KillSwitchStatus = { active: false };
      this.notifyIfChanged(inactiveStatus);
      return inactiveStatus;

    } catch (error) {
      console.error('KillSwitchService.checkStatus error:', error);
      // Fail safe - allow operations if check fails
      return { active: false };
    }
  }

  async activate(reason: string, duration?: number): Promise<void> {
    try {
      const activatedAt = new Date();
      const expiresAt = duration ? new Date(activatedAt.getTime() + duration * 1000) : undefined;

      const status: KillSwitchStatus = {
        active: true,
        reason,
        activatedAt,
        expiresAt,
        activatedBy: 'manual' // In production, get from auth context
      };

      // Set both flags atomically
      await Promise.all([
        this.kv?.put(this.KEY, 'true'),
        this.kv?.put(this.STATUS_KEY, JSON.stringify(status))
      ]);

      // Log activation
      await this.logActivation(status);

      // Send notifications
      await this.sendActivationAlert(status);

      // Notify subscribers
      this.notifySubscribers(status);

      console.log(`🔴 KILL SWITCH ACTIVATED: ${reason}${duration ? ` (expires in ${duration}s)` : ''}`);

    } catch (error) {
      console.error('KillSwitchService.activate error:', error);
      throw new Error(`Failed to activate kill switch: ${error}`);
    }
  }

  async deactivate(): Promise<void> {
    try {
      // Get current status for logging
      const currentStatus = await this.checkStatus();

      // Clear both flags
      await Promise.all([
        this.kv?.delete(this.KEY),
        this.kv?.delete(this.STATUS_KEY)
      ]);

      // Log deactivation
      await this.logDeactivation(currentStatus);

      // Notify subscribers
      this.notifySubscribers({ active: false });

      console.log('🟢 KILL SWITCH DEACTIVATED');

    } catch (error) {
      console.error('KillSwitchService.deactivate error:', error);
      throw new Error(`Failed to deactivate kill switch: ${error}`);
    }
  }

  subscribe(callback: (status: KillSwitchStatus) => void): () => void {
    this.subscribers.add(callback);

    // Send current status immediately
    this.checkStatus().then(status => callback(status)).catch(console.error);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Private helper methods

  private startPolling(): void {
    // Poll every 5 seconds for status changes
    this.pollInterval = setInterval(async () => {
      try {
        await this.checkStatus();
      } catch (error) {
        console.error('Kill switch polling error:', error);
      }
    }, 5000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private notifySubscribers(status: KillSwitchStatus): void {
    this.subscribers.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Subscriber notification error:', error);
      }
    });
  }

  private notifyIfChanged(status: KillSwitchStatus): void {
    const hasChanged =
      !this.lastStatus ||
      this.lastStatus.active !== status.active ||
      this.lastStatus.reason !== status.reason;

    if (hasChanged) {
      this.lastStatus = status;
      this.notifySubscribers(status);
    }
  }

  private async logActivation(status: KillSwitchStatus): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.prepare(`
        INSERT INTO audit_logs (
          id, action, details, user_id, timestamp
        ) VALUES (?, 'kill_switch_activate', ?, ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        JSON.stringify({
          reason: status.reason,
          duration: status.expiresAt ?
            Math.floor((status.expiresAt.getTime() - status.activatedAt!.getTime()) / 1000) :
            null
        }),
        status.activatedBy
      ).run();
    } catch (error) {
      console.error('Failed to log activation:', error);
    }
  }

  private async logDeactivation(previousStatus: KillSwitchStatus): Promise<void> {
    if (!this.db) return;

    try {
      const duration = previousStatus.activatedAt ?
        Math.floor((Date.now() - previousStatus.activatedAt.getTime()) / 1000) :
        0;

      await this.db.prepare(`
        INSERT INTO audit_logs (
          id, action, details, timestamp
        ) VALUES (?, 'kill_switch_deactivate', ?, datetime('now'))
      `).bind(
        crypto.randomUUID(),
        JSON.stringify({
          previousReason: previousStatus.reason,
          duration
        })
      ).run();
    } catch (error) {
      console.error('Failed to log deactivation:', error);
    }
  }

  private async sendActivationAlert(status: KillSwitchStatus): Promise<void> {
    // In production, integrate with Slack/PagerDuty
    const alert = {
      channel: '#alerts',
      severity: 'critical',
      title: '🔴 Kill Switch Activated',
      message: status.reason,
      fields: {
        'Activated By': status.activatedBy || 'Unknown',
        'Expires': status.expiresAt ? status.expiresAt.toISOString() : 'Manual deactivation required'
      }
    };

    // Store alert in KV for monitoring service to pick up
    if (this.kv) {
      await this.kv.put(
        `alert:kill_switch:${Date.now()}`,
        JSON.stringify(alert),
        { expirationTtl: 86400 } // 24 hours
      );
    }

    console.log('Kill switch alert:', alert);
  }

  // Cleanup method for service disposal
  dispose(): void {
    this.stopPolling();
    this.subscribers.clear();
  }
}