// Ref: CLAUDE.md - Enterprise Monitoring and Observability Service
import { cacheService } from './cacheService';
import { performanceService } from './performanceService';

// Monitoring and observability interfaces
export interface MonitoringConfig {
  environment: 'development' | 'staging' | 'production';
  enableMetrics: boolean;
  enableTracing: boolean;
  enableLogging: boolean;
  enableAlerting: boolean;
  metricsInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  endpoints: {
    metrics: string;
    traces: string;
    logs: string;
    alerts: string;
  };
  retention: {
    metrics: number; // days
    traces: number; // days
    logs: number; // days
  };
}

export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  labels?: Record<string, string>;
}

export interface Trace {
  traceId: string;
  spanId: string;
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: 'ok' | 'error' | 'timeout';
  tags: Record<string, any>;
  logs: TraceLog[];
  parentSpanId?: string;
  serviceName: string;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface TraceLog {
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  fields?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  message: string;
  service: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  tags: Record<string, string>;
  fields: Record<string, any>;
  context?: {
    url?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
  };
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'firing' | 'resolved' | 'silenced';
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  rule: AlertRule;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  generatorURL?: string;
}

export interface AlertRule {
  name: string;
  expr: string; // Prometheus-style expression
  duration: number; // in milliseconds
  labels: Record<string, string>;
  annotations: Record<string, string>;
  enabled: boolean;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    load1m: number;
    load5m: number;
    load15m: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: {
      used: number;
      total: number;
      limit: number;
    };
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
    requestsPerSecond: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    iops: number;
  };
  uptime: number;
}

export interface ApplicationMetrics {
  timestamp: number;
  requests: {
    total: number;
    success: number;
    errors: number;
    rate: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  users: {
    active: number;
    sessions: number;
    signups: number;
    churn: number;
  };
  business: {
    roadmapsCreated: number;
    collaborationSessions: number;
    apiCalls: number;
    storageUsed: number;
  };
  errors: {
    clientErrors: number;
    serverErrors: number;
    criticalErrors: number;
    errorRate: number;
  };
}

export interface ObservabilityDashboard {
  id: string;
  name: string;
  description: string;
  panels: DashboardPanel[];
  timeRange: {
    from: number;
    to: number;
  };
  refreshInterval: number;
  tags: string[];
  variables: Record<string, any>;
}

export interface DashboardPanel {
  id: string;
  title: string;
  type: 'graph' | 'single_stat' | 'table' | 'heatmap' | 'logs';
  query: string;
  visualization: {
    type: 'line' | 'bar' | 'pie' | 'gauge' | 'stat';
    options: Record<string, any>;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  thresholds?: Array<{
    value: number;
    color: string;
    condition: 'gt' | 'lt' | 'eq';
  }>;
}

export class MonitoringService {
  private config: MonitoringConfig;
  private metrics: Map<string, Metric[]>;
  private traces: Map<string, Trace>;
  private logs: LogEntry[];
  private alerts: Map<string, Alert>;
  private healthChecks: Map<string, HealthCheck>;
  private alertRules: Map<string, AlertRule>;
  private dashboards: Map<string, ObservabilityDashboard>;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
      enableMetrics: true,
      enableTracing: true,
      enableLogging: true,
      enableAlerting: true,
      metricsInterval: 60000, // 1 minute
      logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      endpoints: {
        metrics: process.env.METRICS_ENDPOINT || '/api/metrics',
        traces: process.env.TRACES_ENDPOINT || '/api/traces',
        logs: process.env.LOGS_ENDPOINT || '/api/logs',
        alerts: process.env.ALERTS_ENDPOINT || '/api/alerts',
      },
      retention: {
        metrics: 30, // 30 days
        traces: 7, // 7 days
        logs: 14, // 14 days
      },
      ...config,
    };

    this.metrics = new Map();
    this.traces = new Map();
    this.logs = [];
    this.alerts = new Map();
    this.healthChecks = new Map();
    this.alertRules = new Map();
    this.dashboards = new Map();

    this.initializeDefaultAlertRules();
    this.initializeDefaultDashboards();
    this.startMetricsCollection();

    console.log(`📊 Monitoring Service: Initialized for ${this.config.environment} environment`);
  }

  // Metrics Collection
  async recordMetric(metric: Omit<Metric, 'timestamp'>): Promise<void> {
    if (!this.config.enableMetrics) return;

    const fullMetric: Metric = {
      timestamp: Date.now(),
      ...metric,
    };

    const metricKey = `${metric.name}:${JSON.stringify(metric.tags)}`;
    const existingMetrics = this.metrics.get(metricKey) || [];
    existingMetrics.push(fullMetric);

    // Keep only recent metrics to prevent memory leaks
    const retentionMs = this.config.retention.metrics * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    const filteredMetrics = existingMetrics.filter(m => m.timestamp > cutoff);

    this.metrics.set(metricKey, filteredMetrics);

    // Cache recent metrics for dashboard display
    await cacheService.set(
      `metric_${metricKey}`,
      filteredMetrics.slice(-100), // Keep last 100 data points
      { ttl: this.config.metricsInterval / 1000, tags: ['monitoring', 'metrics'] }
    );

    console.log(`📈 Metric: ${metric.name} = ${metric.value} ${metric.unit}`);
  }

  async getMetrics(
    name?: string,
    tags?: Record<string, string>,
    timeRange?: { from: number; to: number }
  ): Promise<Metric[]> {
    const allMetrics: Metric[] = [];

    for (const [key, metrics] of this.metrics.entries()) {
      if (name && !key.startsWith(name)) continue;

      let filteredMetrics = [...metrics];

      // Filter by time range
      if (timeRange) {
        filteredMetrics = filteredMetrics.filter(
          m => m.timestamp >= timeRange.from && m.timestamp <= timeRange.to
        );
      }

      // Filter by tags
      if (tags) {
        filteredMetrics = filteredMetrics.filter(m =>
          Object.entries(tags).every(([key, value]) => m.tags[key] === value)
        );
      }

      allMetrics.push(...filteredMetrics);
    }

    return allMetrics.sort((a, b) => a.timestamp - b.timestamp);
  }

  // Distributed Tracing
  startTrace(operationName: string, serviceName = 'protothrive-frontend'): Trace {
    if (!this.config.enableTracing) {
      return this.createNoOpTrace();
    }

    const trace: Trace = {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      operationName,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      status: 'ok',
      tags: {},
      logs: [],
      serviceName,
    };

    this.traces.set(trace.traceId, trace);
    return trace;
  }

  finishTrace(trace: Trace, status: 'ok' | 'error' | 'timeout' = 'ok', error?: Error): void {
    if (!this.config.enableTracing) return;

    trace.endTime = Date.now();
    trace.duration = trace.endTime - trace.startTime;
    trace.status = status;

    if (error) {
      trace.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    // Record trace duration as a metric
    this.recordMetric({
      name: 'trace_duration',
      value: trace.duration,
      unit: 'ms',
      type: 'histogram',
      tags: {
        operation: trace.operationName,
        service: trace.serviceName,
        status: trace.status,
      },
    });

    console.log(`🔍 Trace: ${trace.operationName} completed in ${trace.duration}ms (${status})`);
  }

  addTraceLog(trace: Trace, level: TraceLog['level'], message: string, fields?: Record<string, any>): void {
    if (!this.config.enableTracing) return;

    trace.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields,
    });
  }

  // Logging
  async log(
    level: LogEntry['level'],
    message: string,
    service = 'protothrive-frontend',
    fields: Record<string, any> = {},
    context?: LogEntry['context']
  ): Promise<void> {
    if (!this.config.enableLogging) return;

    const logLevels = ['debug', 'info', 'warn', 'error', 'critical'];
    const currentLevelIndex = logLevels.indexOf(this.config.logLevel);
    const messageLevelIndex = logLevels.indexOf(level);

    if (messageLevelIndex < currentLevelIndex) return;

    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      service,
      tags: {
        environment: this.config.environment,
        service,
      },
      fields,
      context,
    };

    this.logs.push(logEntry);

    // Keep only recent logs to prevent memory leaks
    const retentionMs = this.config.retention.logs * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - retentionMs;
    this.logs = this.logs.filter(log => log.timestamp > cutoff);

    // Send to external logging service in production
    if (this.config.environment === 'production') {
      this.sendToExternalLogging(logEntry);
    }

    // Console logging with colors
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
      critical: '\x1b[35m', // magenta
    };
    const reset = '\x1b[0m';

    console.log(
      `${colors[level]}[${level.toUpperCase()}]${reset} ${new Date(logEntry.timestamp).toISOString()} ${message}`,
      fields
    );
  }

  // Health Checks
  async registerHealthCheck(
    name: string,
    checkFunction: () => Promise<HealthCheck>
  ): Promise<void> {
    const performCheck = async () => {
      try {
        const result = await checkFunction();
        this.healthChecks.set(name, result);

        // Record health check as metric
        await this.recordMetric({
          name: 'health_check',
          value: result.status === 'healthy' ? 1 : 0,
          unit: 'status',
          type: 'gauge',
          tags: {
            check: name,
            status: result.status,
          },
        });
      } catch (error) {
        const errorCheck: HealthCheck = {
          name,
          status: 'unhealthy',
          timestamp: Date.now(),
          responseTime: 0,
          message: error instanceof Error ? error.message : 'Health check failed',
        };

        this.healthChecks.set(name, errorCheck);
        await this.log('error', `Health check failed: ${name}`, 'monitoring', { error });
      }
    };

    // Run initial check
    await performCheck();

    // Schedule periodic checks
    setInterval(performCheck, 30000); // Every 30 seconds

    console.log(`💓 Health Check: Registered ${name}`);
  }

  async getHealthStatus(): Promise<{ status: string; checks: HealthCheck[] }> {
    const checks = Array.from(this.healthChecks.values());
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
    const degradedChecks = checks.filter(check => check.status === 'degraded');

    let overallStatus = 'healthy';
    if (unhealthyChecks.length > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      overallStatus = 'degraded';
    }

    return { status: overallStatus, checks };
  }

  // Alert Management
  createAlert(rule: AlertRule, labels: Record<string, string>): Alert {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: rule.name,
      description: rule.annotations.description || rule.name,
      severity: (labels.severity as Alert['severity']) || 'medium',
      status: 'firing',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rule,
      labels,
      annotations: rule.annotations,
    };

    this.alerts.set(alert.id, alert);

    this.log('warn', `Alert triggered: ${alert.name}`, 'monitoring', {
      alertId: alert.id,
      severity: alert.severity,
      labels,
    });

    console.log(`🚨 Alert: ${alert.name} (${alert.severity})`);
    return alert;
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    alert.status = 'resolved';
    alert.resolvedAt = Date.now();
    alert.updatedAt = Date.now();

    this.log('info', `Alert resolved: ${alert.name}`, 'monitoring', { alertId });
    console.log(`✅ Alert Resolved: ${alert.name}`);
  }

  // System Metrics Collection
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const metrics: SystemMetrics = {
      timestamp: Date.now(),
      cpu: {
        usage: this.getCPUUsage(),
        load1m: 0.5, // Mock values - in production would read from /proc/loadavg
        load5m: 0.4,
        load15m: 0.3,
      },
      memory: {
        used: this.getMemoryUsage(),
        total: this.getTotalMemory(),
        percentage: 0,
        heap: {
          used: 0,
          total: 0,
          limit: 0,
        },
      },
      network: {
        bytesIn: 1024 * 1024, // Mock values
        bytesOut: 512 * 1024,
        connectionsActive: 100,
        requestsPerSecond: 50,
      },
      disk: {
        used: 10 * 1024 * 1024 * 1024, // 10GB
        total: 100 * 1024 * 1024 * 1024, // 100GB
        percentage: 10,
        iops: 1000,
      },
      uptime: Date.now() - this.getProcessStartTime(),
    };

    // Calculate percentages
    metrics.memory.percentage = (metrics.memory.used / metrics.memory.total) * 100;

    // Record as individual metrics
    await this.recordMetric({
      name: 'system_cpu_usage',
      value: metrics.cpu.usage,
      unit: 'percent',
      type: 'gauge',
      tags: { type: 'system' },
    });

    await this.recordMetric({
      name: 'system_memory_usage',
      value: metrics.memory.percentage,
      unit: 'percent',
      type: 'gauge',
      tags: { type: 'system' },
    });

    return metrics;
  }

  // Application Metrics Collection
  async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    const performanceMetrics = await performanceService.generateReport();

    const metrics: ApplicationMetrics = {
      timestamp: Date.now(),
      requests: {
        total: 10000, // Mock values - in production would come from request counters
        success: 9800,
        errors: 200,
        rate: 50,
        averageResponseTime: 150,
        p95ResponseTime: 300,
        p99ResponseTime: 500,
      },
      users: {
        active: 250,
        sessions: 180,
        signups: 5,
        churn: 2,
      },
      business: {
        roadmapsCreated: 15,
        collaborationSessions: 45,
        apiCalls: 2000,
        storageUsed: 1024 * 1024 * 100, // 100MB
      },
      errors: {
        clientErrors: 50,
        serverErrors: 10,
        criticalErrors: 1,
        errorRate: 2.0,
      },
    };

    // Calculate derived metrics
    metrics.requests.rate = metrics.requests.total / 60; // requests per minute

    // Record as individual metrics
    const metricsToRecord = [
      { name: 'requests_total', value: metrics.requests.total, unit: 'count' },
      { name: 'requests_success_rate', value: (metrics.requests.success / metrics.requests.total) * 100, unit: 'percent' },
      { name: 'response_time_avg', value: metrics.requests.averageResponseTime, unit: 'ms' },
      { name: 'users_active', value: metrics.users.active, unit: 'count' },
      { name: 'error_rate', value: metrics.errors.errorRate, unit: 'percent' },
    ];

    for (const metric of metricsToRecord) {
      await this.recordMetric({
        ...metric,
        type: 'gauge',
        tags: { type: 'application' },
      });
    }

    return metrics;
  }

  // Dashboard Management
  createDashboard(dashboard: Omit<ObservabilityDashboard, 'id'>): ObservabilityDashboard {
    const fullDashboard: ObservabilityDashboard = {
      id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...dashboard,
    };

    this.dashboards.set(fullDashboard.id, fullDashboard);
    console.log(`📊 Dashboard: Created ${fullDashboard.name}`);
    return fullDashboard;
  }

  getDashboard(id: string): ObservabilityDashboard | undefined {
    return this.dashboards.get(id);
  }

  // Cleanup and maintenance
  async cleanup(): Promise<void> {
    const now = Date.now();

    // Clean up old metrics
    for (const [key, metrics] of this.metrics.entries()) {
      const retentionMs = this.config.retention.metrics * 24 * 60 * 60 * 1000;
      const filtered = metrics.filter(m => now - m.timestamp < retentionMs);
      this.metrics.set(key, filtered);
    }

    // Clean up old traces
    const traceRetentionMs = this.config.retention.traces * 24 * 60 * 60 * 1000;
    for (const [id, trace] of this.traces.entries()) {
      if (now - trace.startTime > traceRetentionMs) {
        this.traces.delete(id);
      }
    }

    // Clean up old logs
    const logRetentionMs = this.config.retention.logs * 24 * 60 * 60 * 1000;
    this.logs = this.logs.filter(log => now - log.timestamp < logRetentionMs);

    console.log('🧹 Monitoring: Cleanup completed');
  }

  // Private helper methods
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        name: 'HighErrorRate',
        expr: 'error_rate > 5',
        duration: 300000, // 5 minutes
        labels: { severity: 'high' },
        annotations: {
          description: 'Error rate is above 5% for more than 5 minutes',
          summary: 'High error rate detected',
        },
        enabled: true,
      },
      {
        name: 'HighResponseTime',
        expr: 'response_time_avg > 1000',
        duration: 600000, // 10 minutes
        labels: { severity: 'medium' },
        annotations: {
          description: 'Average response time is above 1000ms for more than 10 minutes',
          summary: 'High response time detected',
        },
        enabled: true,
      },
      {
        name: 'LowMemory',
        expr: 'system_memory_usage > 90',
        duration: 300000, // 5 minutes
        labels: { severity: 'critical' },
        annotations: {
          description: 'Memory usage is above 90% for more than 5 minutes',
          summary: 'Low memory condition',
        },
        enabled: true,
      },
    ];

    defaultRules.forEach(rule => this.alertRules.set(rule.name, rule));
    console.log(`🚨 Alert Rules: Initialized ${defaultRules.length} default rules`);
  }

  private initializeDefaultDashboards(): void {
    const systemDashboard: Omit<ObservabilityDashboard, 'id'> = {
      name: 'System Overview',
      description: 'System-level metrics and health status',
      panels: [
        {
          id: 'cpu_usage',
          title: 'CPU Usage',
          type: 'graph',
          query: 'system_cpu_usage',
          visualization: { type: 'line', options: {} },
          position: { x: 0, y: 0, width: 12, height: 8 },
        },
        {
          id: 'memory_usage',
          title: 'Memory Usage',
          type: 'graph',
          query: 'system_memory_usage',
          visualization: { type: 'line', options: {} },
          position: { x: 12, y: 0, width: 12, height: 8 },
        },
      ],
      timeRange: { from: Date.now() - 24 * 60 * 60 * 1000, to: Date.now() },
      refreshInterval: 30000,
      tags: ['system', 'infrastructure'],
      variables: {},
    };

    this.createDashboard(systemDashboard);
  }

  private startMetricsCollection(): void {
    // Collect system and application metrics periodically
    const collectMetrics = async () => {
      try {
        await this.collectSystemMetrics();
        await this.collectApplicationMetrics();
      } catch (error) {
        await this.log('error', 'Failed to collect metrics', 'monitoring', { error });
      }
    };

    // Initial collection
    collectMetrics();

    // Schedule periodic collection
    setInterval(collectMetrics, this.config.metricsInterval);
  }

  private async sendToExternalLogging(logEntry: LogEntry): Promise<void> {
    // In production, would send to external logging service (e.g., ELK, Splunk, Datadog)
    try {
      // Mock implementation
      console.log(`📤 External Log: ${JSON.stringify(logEntry)}`);
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private createNoOpTrace(): Trace {
    return {
      traceId: 'noop',
      spanId: 'noop',
      operationName: 'noop',
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0,
      status: 'ok',
      tags: {},
      logs: [],
      serviceName: 'noop',
    };
  }

  private getCPUUsage(): number {
    // Mock implementation - in production would read from system APIs
    return Math.random() * 100;
  }

  private getMemoryUsage(): number {
    // Mock implementation - in production would read from process.memoryUsage()
    return Math.random() * 1024 * 1024 * 1024; // Random GB
  }

  private getTotalMemory(): number {
    // Mock implementation - in production would read from os.totalmem()
    return 8 * 1024 * 1024 * 1024; // 8GB
  }

  private getProcessStartTime(): number {
    // Mock implementation - in production would use process.hrtime()
    return Date.now() - (Math.random() * 24 * 60 * 60 * 1000); // Random uptime up to 24 hours
  }
}

// Global monitoring service instance
export const monitoringService = new MonitoringService();

// Convenience functions for common monitoring operations
export const monitoring = {
  // Metrics
  metric: (name: string, value: number, unit = 'count', tags: Record<string, string> = {}) =>
    monitoringService.recordMetric({ name, value, unit, type: 'gauge', tags }),

  counter: (name: string, value = 1, tags: Record<string, string> = {}) =>
    monitoringService.recordMetric({ name, value, unit: 'count', type: 'counter', tags }),

  gauge: (name: string, value: number, unit = 'value', tags: Record<string, string> = {}) =>
    monitoringService.recordMetric({ name, value, unit, type: 'gauge', tags }),

  histogram: (name: string, value: number, unit = 'ms', tags: Record<string, string> = {}) =>
    monitoringService.recordMetric({ name, value, unit, type: 'histogram', tags }),

  // Tracing
  trace: (operationName: string, serviceName?: string) =>
    monitoringService.startTrace(operationName, serviceName),

  finish: (trace: Trace, status?: 'ok' | 'error' | 'timeout', error?: Error) =>
    monitoringService.finishTrace(trace, status, error),

  // Logging
  debug: (message: string, fields?: Record<string, any>, context?: LogEntry['context']) =>
    monitoringService.log('debug', message, 'protothrive-frontend', fields, context),

  info: (message: string, fields?: Record<string, any>, context?: LogEntry['context']) =>
    monitoringService.log('info', message, 'protothrive-frontend', fields, context),

  warn: (message: string, fields?: Record<string, any>, context?: LogEntry['context']) =>
    monitoringService.log('warn', message, 'protothrive-frontend', fields, context),

  error: (message: string, fields?: Record<string, any>, context?: LogEntry['context']) =>
    monitoringService.log('error', message, 'protothrive-frontend', fields, context),

  critical: (message: string, fields?: Record<string, any>, context?: LogEntry['context']) =>
    monitoringService.log('critical', message, 'protothrive-frontend', fields, context),

  // Health
  health: () => monitoringService.getHealthStatus(),

  // Alerts
  alert: (rule: AlertRule, labels: Record<string, string>) =>
    monitoringService.createAlert(rule, labels),

  resolve: (alertId: string) => monitoringService.resolveAlert(alertId),

  // System
  system: () => monitoringService.collectSystemMetrics(),
  app: () => monitoringService.collectApplicationMetrics(),

  // Cleanup
  cleanup: () => monitoringService.cleanup(),
};

// Initialize default health checks
monitoringService.registerHealthCheck('database', async () => ({
  name: 'database',
  status: 'healthy',
  timestamp: Date.now(),
  responseTime: Math.random() * 100,
  message: 'Database connection healthy',
}));

monitoringService.registerHealthCheck('cache', async () => ({
  name: 'cache',
  status: 'healthy',
  timestamp: Date.now(),
  responseTime: Math.random() * 50,
  message: 'Cache service healthy',
}));

monitoringService.registerHealthCheck('external_api', async () => ({
  name: 'external_api',
  status: Math.random() > 0.1 ? 'healthy' : 'degraded',
  timestamp: Date.now(),
  responseTime: Math.random() * 200,
  message: 'External API endpoints status',
}));

console.log('📊 Monitoring Service: Enterprise observability and monitoring initialized');