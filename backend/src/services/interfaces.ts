/**
 * ProtoThrive Service Interfaces
 * Ref: CLAUDE.md - Service Architecture with Dependency Injection
 *
 * This file defines the core service interfaces for:
 * - Budget management
 * - Kill-switch control
 * - AI orchestration
 * - Monitoring and metrics
 */

/**
 * Budget Service Interface
 * Manages cost tracking and budget enforcement
 */
export interface IBudgetService {
  /**
   * Check if a task can proceed within budget constraints
   * @param taskCost Estimated cost of the task in USD
   * @param userId User ID for per-user budget tracking
   * @returns Promise resolving to budget check result
   */
  checkBudget(taskCost: number, userId: string): Promise<BudgetCheckResult>;

  /**
   * Record actual task cost after completion
   * @param actualCost Actual cost incurred
   * @param userId User ID
   * @param metadata Additional metadata about the task
   */
  recordCost(actualCost: number, userId: string, metadata?: CostMetadata): Promise<void>;

  /**
   * Get current budget status for a user
   * @param userId User ID
   * @returns Current budget status
   */
  getBudgetStatus(userId: string): Promise<BudgetStatus>;

  /**
   * Reset budget for a new billing period
   * @param userId User ID (optional, resets all if not provided)
   */
  resetBudget(userId?: string): Promise<void>;
}

/**
 * Kill-Switch Service Interface
 * Emergency control system for halting operations
 */
export interface IKillSwitchService {
  /**
   * Check if system operations should be paused
   * @returns Promise resolving to pause status
   */
  checkStatus(): Promise<KillSwitchStatus>;

  /**
   * Activate the kill switch with a reason
   * @param reason Reason for activation
   * @param duration Optional duration in seconds
   */
  activate(reason: string, duration?: number): Promise<void>;

  /**
   * Deactivate the kill switch
   */
  deactivate(): Promise<void>;

  /**
   * Subscribe to kill switch status changes
   * @param callback Callback function for status changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (status: KillSwitchStatus) => void): () => void;
}

/**
 * AI Executor Service Interface
 * Orchestrates AI model invocations
 */
export interface IAIExecutor {
  /**
   * Execute an AI task with automatic model selection
   * @param task Task to execute
   * @param options Execution options
   * @returns Promise resolving to task result
   */
  execute(task: AITask, options?: ExecutionOptions): Promise<AITaskResult>;

  /**
   * Execute multiple tasks in parallel
   * @param tasks Array of tasks to execute
   * @param options Execution options
   * @returns Promise resolving to array of results
   */
  executeBatch(tasks: AITask[], options?: ExecutionOptions): Promise<AITaskResult[]>;

  /**
   * Get available models and their status
   * @returns Promise resolving to model status map
   */
  getModelsStatus(): Promise<ModelStatusMap>;

  /**
   * Cancel a running task
   * @param taskId Task ID to cancel
   */
  cancel(taskId: string): Promise<void>;
}

/**
 * Monitoring Service Interface
 * Tracks system metrics and performance
 */
export interface IMonitoringService {
  /**
   * Record a metric
   * @param metric Metric to record
   */
  recordMetric(metric: Metric): Promise<void>;

  /**
   * Record an error
   * @param error Error to record
   * @param context Additional context
   */
  recordError(error: Error, context?: ErrorContext): Promise<void>;

  /**
   * Get current system health status
   * @returns Promise resolving to health status
   */
  getHealthStatus(): Promise<HealthStatus>;

  /**
   * Start a performance trace
   * @param name Trace name
   * @returns Trace handle for ending the trace
   */
  startTrace(name: string): TraceHandle;
}

// Type definitions

export interface BudgetCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number;
  remainingBudget: number;
  reason?: string;
}

export interface CostMetadata {
  taskType: string;
  model?: string;
  tokenCount?: number;
  duration?: number;
}

export interface BudgetStatus {
  userId: string;
  currentUsage: number;
  limit: number;
  period: string;
  resetAt: Date;
  history: CostRecord[];
}

export interface CostRecord {
  timestamp: Date;
  cost: number;
  metadata?: CostMetadata;
}

export interface KillSwitchStatus {
  active: boolean;
  reason?: string;
  activatedAt?: Date;
  expiresAt?: Date;
  activatedBy?: string;
}

export interface AITask {
  id?: string;
  type: 'code' | 'ui' | 'analysis' | 'generation';
  prompt: string;
  context?: Record<string, any>;
  preferredModel?: string;
  maxRetries?: number;
}

export interface ExecutionOptions {
  timeout?: number;
  priority?: 'low' | 'normal' | 'high';
  costLimit?: number;
  requireApproval?: boolean;
  callback?: (progress: ExecutionProgress) => void;
}

export interface ExecutionProgress {
  taskId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
}

export interface AITaskResult {
  taskId: string;
  status: 'success' | 'failure' | 'timeout' | 'cancelled';
  output?: string;
  error?: string;
  model: string;
  tokenCount: number;
  cost: number;
  duration: number;
  retries: number;
}

export interface ModelStatusMap {
  [modelName: string]: {
    available: boolean;
    responseTime: number;
    costPerToken: number;
    maxTokens: number;
    queue: number;
  };
}

export interface Metric {
  name: string;
  value: number;
  type: 'counter' | 'gauge' | 'histogram' | 'timing';
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface ErrorContext {
  userId?: string;
  taskId?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    [serviceName: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      latency: number;
      errorRate: number;
      lastCheck: Date;
    };
  };
  metrics: {
    requestRate: number;
    errorRate: number;
    avgResponseTime: number;
    activeConnections: number;
  };
}

export interface TraceHandle {
  end(): void;
  addMetadata(metadata: Record<string, any>): void;
  recordEvent(name: string, data?: any): void;
}

/**
 * Service Container Interface
 * Main dependency injection container
 */
export interface IServiceContainer {
  register<T>(token: string | symbol, factory: ServiceFactory<T>, options?: ServiceOptions): void;
  registerSingleton<T>(token: string | symbol, factory: ServiceFactory<T>): void;
  registerTransient<T>(token: string | symbol, factory: ServiceFactory<T>): void;
  resolve<T>(token: string | symbol): T;
  resolveAll<T>(token: string | symbol): T[];
  createScope(): IServiceContainer;
}

export type ServiceFactory<T> = (container: IServiceContainer) => T;

export interface ServiceOptions {
  lifecycle?: 'singleton' | 'transient' | 'scoped';
  tags?: string[];
}

// Service tokens for dependency injection
export const SERVICE_TOKENS = {
  BUDGET: Symbol('BudgetService'),
  KILL_SWITCH: Symbol('KillSwitchService'),
  AI_EXECUTOR: Symbol('AIExecutor'),
  MONITORING: Symbol('MonitoringService'),
  DATABASE: Symbol('DatabaseService'),
  CACHE: Symbol('CacheService'),
  AUTH: Symbol('AuthService'),
} as const;