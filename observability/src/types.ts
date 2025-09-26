export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export interface Config {
  serviceName: string;
  environment?: string;
  version?: string;
  instanceId?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
  uptime: number;
  version?: string;
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message?: string;
  responseTime?: number;
  details?: any;
}

export interface MetricOptions {
  name: string;
  help: string;
  labelNames?: string[];
  buckets?: number[];
}