/**
 * Real Metrics Service for Legal Compliance
 * Fetches actual metrics from backend to avoid false claims
 * Ref: LEGAL_MARKETING_GUIDELINES.md
 */

import { useState, useEffect } from 'react';

interface MetricsData {
  waitlistCount: number;
  betaUserCount: number;
  activeProjects: number;
  lastUpdated: string;
}

interface MetricsConfig {
  apiEndpoint?: string;
  cacheTimeout?: number;
  fallbackToMock?: boolean;
}

class MetricsService {
  private cache: MetricsData | null = null;
  private lastFetch: number = 0;
  private cacheTimeout: number = 60000; // 1 minute cache
  private apiEndpoint: string = '/api/metrics';

  constructor(config?: MetricsConfig) {
    if (config?.apiEndpoint) this.apiEndpoint = config.apiEndpoint;
    if (config?.cacheTimeout) this.cacheTimeout = config.cacheTimeout;
  }

  /**
   * Fetch real metrics from backend
   * Returns null if API is unavailable to avoid false claims
   */
  async getMetrics(): Promise<MetricsData | null> {
    try {
      // Check cache first
      if (this.cache && Date.now() - this.lastFetch < this.cacheTimeout) {
        return this.cache;
      }

      // Fetch from backend
      const response = await fetch(this.apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn('Metrics API unavailable, returning null to avoid false claims');
        return null;
      }

      const data = await response.json();

      // Validate data structure
      if (!this.isValidMetricsData(data)) {
        console.error('Invalid metrics data received');
        return null;
      }

      // Update cache
      this.cache = data;
      this.lastFetch = Date.now();

      return data;
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Return null instead of fake data - better to show nothing than lie
      return null;
    }
  }

  /**
   * Get waitlist count only
   * Returns null if unavailable - never returns fake numbers
   */
  async getWaitlistCount(): Promise<number | null> {
    const metrics = await this.getMetrics();
    return metrics?.waitlistCount ?? null;
  }

  /**
   * Get beta user count
   * Returns null if unavailable
   */
  async getBetaUserCount(): Promise<number | null> {
    const metrics = await this.getMetrics();
    return metrics?.betaUserCount ?? null;
  }

  /**
   * Validate metrics data structure
   */
  private isValidMetricsData(data: any): data is MetricsData {
    return (
      typeof data === 'object' &&
      typeof data.waitlistCount === 'number' &&
      data.waitlistCount >= 0 &&
      typeof data.betaUserCount === 'number' &&
      data.betaUserCount >= 0 &&
      typeof data.activeProjects === 'number' &&
      data.activeProjects >= 0 &&
      typeof data.lastUpdated === 'string'
    );
  }

  /**
   * Format count for display with legal compliance
   * Never exaggerates or rounds up misleadingly
   */
  formatCount(count: number | null): string {
    if (count === null || count === undefined) {
      return 'Join our community'; // Generic, non-misleading fallback
    }

    if (count === 0) {
      return 'Be the first to join';
    }

    if (count < 10) {
      return `${count} early adopters`;
    }

    if (count < 100) {
      // Show exact count for small numbers
      return `${count} beta testers`;
    }

    if (count < 1000) {
      // Round down to nearest 10 for transparency
      const rounded = Math.floor(count / 10) * 10;
      return `${rounded}+ beta users`;
    }

    // For larger numbers, round down to nearest 100
    const rounded = Math.floor(count / 100) * 100;
    return `${rounded.toLocaleString()}+ in waitlist`;
  }

  /**
   * Get display-ready metrics with compliance-safe fallbacks
   */
  async getDisplayMetrics() {
    const metrics = await this.getMetrics();

    return {
      waitlistText: this.formatCount(metrics?.waitlistCount ?? null),
      betaUsersText: this.formatCount(metrics?.betaUserCount ?? null),
      projectsText: metrics?.activeProjects
        ? `${metrics.activeProjects} active projects`
        : 'Projects being built',
      isDataAvailable: metrics !== null,
      lastUpdated: metrics?.lastUpdated ?? 'Recently',
    };
  }

  /**
   * Clear cache - useful for testing or force refresh
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

// Export singleton instance
export const metricsService = new MetricsService();

// Export class for testing
export { MetricsService };

// Export types
export type { MetricsData, MetricsConfig };

// Mock API endpoint for development
// This should be replaced with real backend endpoint
export const mockMetricsEndpoint = '/api/metrics';

/**
 * Hook for React components to use metrics
 */
export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await metricsService.getMetrics();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError('Failed to load metrics');
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Refresh metrics periodically
    const interval = setInterval(fetchMetrics, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error };
}

// React hook for display-ready metrics
export function useDisplayMetrics() {
  const [displayMetrics, setDisplayMetrics] = useState({
    waitlistText: 'Loading...',
    betaUsersText: 'Loading...',
    projectsText: 'Loading...',
    isDataAvailable: false,
    lastUpdated: 'Loading...',
  });

  useEffect(() => {
    const fetchDisplayMetrics = async () => {
      const metrics = await metricsService.getDisplayMetrics();
      setDisplayMetrics(metrics);
    };

    fetchDisplayMetrics();

    // Refresh every minute
    const interval = setInterval(fetchDisplayMetrics, 60000);

    return () => clearInterval(interval);
  }, []);

  return displayMetrics;
}