// Enterprise Error Handling System
// Centralized error definitions with consistent codes and HTTP status mapping

export enum ErrorCode {
  // Authentication & Authorization
  AUTH_MISSING_TOKEN = 'AUTH_001',
  AUTH_INVALID_TOKEN = 'AUTH_002',
  AUTH_EXPIRED_TOKEN = 'AUTH_003',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_004',

  // Validation
  VALIDATION_REQUIRED_FIELD = 'VAL_001',
  VALIDATION_INVALID_FORMAT = 'VAL_002',
  VALIDATION_OUT_OF_RANGE = 'VAL_003',
  VALIDATION_INVALID_JSON = 'VAL_004',

  // Business Logic
  BUSINESS_BUDGET_EXCEEDED = 'BIZ_001',
  BUSINESS_RATE_LIMITED = 'BIZ_002',
  BUSINESS_FEATURE_UNAVAILABLE = 'BIZ_003',
  BUSINESS_RESOURCE_LIMIT = 'BIZ_004',

  // API Management
  API_KEY_REQUIRED = 'API_001',
  API_KEY_INVALID = 'API_002',
  API_KEY_EXPIRED = 'API_003',
  API_KEY_PERMISSIONS = 'API_004',

  // Database & Storage
  DB_CONNECTION_FAILED = 'DB_001',
  DB_QUERY_FAILED = 'DB_002',
  DB_CONSTRAINT_VIOLATION = 'DB_003',
  DB_TRANSACTION_FAILED = 'DB_004',

  // External Services
  EXT_SERVICE_UNAVAILABLE = 'EXT_001',
  EXT_SERVICE_TIMEOUT = 'EXT_002',
  EXT_SERVICE_AUTH_FAILED = 'EXT_003',
  EXT_SERVICE_QUOTA_EXCEEDED = 'EXT_004',

  // AI & Orchestration
  AI_ORCHESTRATION_FAILED = 'AI_001',
  AI_MODEL_UNAVAILABLE = 'AI_002',
  AI_CONTEXT_TOO_LARGE = 'AI_003',
  AI_SAFETY_VIOLATION = 'AI_004',

  // System & Infrastructure
  SYS_INTERNAL_ERROR = 'SYS_001',
  SYS_SERVICE_UNAVAILABLE = 'SYS_002',
  SYS_CONFIGURATION_ERROR = 'SYS_003',
  SYS_RESOURCE_EXHAUSTED = 'SYS_004'
}

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
  value?: any;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details: ErrorDetail[];
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details: ErrorDetail[] = [],
    isOperational: boolean = true
  ) {
    super(message);

    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  // Factory methods for common error types
  static validation(message: string, details: ErrorDetail[] = []): AppError {
    return new AppError(ErrorCode.VALIDATION_INVALID_FORMAT, message, 400, details);
  }

  static authentication(message: string): AppError {
    return new AppError(ErrorCode.AUTH_INVALID_TOKEN, message, 401);
  }

  static authorization(message: string): AppError {
    return new AppError(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, message, 403);
  }

  static notFound(resource: string): AppError {
    return new AppError(ErrorCode.SYS_INTERNAL_ERROR, `${resource} not found`, 404);
  }

  static budgetExceeded(current: number, limit: number): AppError {
    return new AppError(
      ErrorCode.BUSINESS_BUDGET_EXCEEDED,
      'Daily budget limit exceeded',
      429,
      [
        { field: 'current_usage', message: `$${current.toFixed(3)}`, value: current },
        { field: 'budget_limit', message: `$${limit.toFixed(3)}`, value: limit }
      ]
    );
  }

  static rateLimited(limit: number, window: number): AppError {
    return new AppError(
      ErrorCode.BUSINESS_RATE_LIMITED,
      'Rate limit exceeded',
      429,
      [
        { field: 'limit', message: `${limit} requests`, value: limit },
        { field: 'window', message: `${window} seconds`, value: window }
      ]
    );
  }

  static apiKeyInvalid(reason: string = 'Invalid API key'): AppError {
    return new AppError(ErrorCode.API_KEY_INVALID, reason, 401);
  }

  static orchestrationFailed(reason: string, cost?: number): AppError {
    const details: ErrorDetail[] = [
      { field: 'reason', message: reason }
    ];

    if (cost !== undefined) {
      details.push({ field: 'cost_incurred', message: `$${cost.toFixed(3)}`, value: cost });
    }

    return new AppError(ErrorCode.AI_ORCHESTRATION_FAILED, 'AI orchestration failed', 500, details);
  }

  static externalService(service: string, error: string): AppError {
    return new AppError(
      ErrorCode.EXT_SERVICE_UNAVAILABLE,
      `External service error: ${service}`,
      502,
      [{ field: 'service', message: service }, { field: 'error', message: error }]
    );
  }

  // Convert to JSON response format
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
        ...(this.requestId && { request_id: this.requestId })
      }
    };
  }

  // Add request ID for tracing
  withRequestId(requestId: string): AppError {
    (this as any).requestId = requestId;
    return this;
  }

  // Check if error should be reported to external monitoring
  shouldReport(): boolean {
    return !this.isOperational || this.statusCode >= 500;
  }

  // Get severity level for logging
  getSeverity(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.statusCode >= 500) return 'critical';
    if (this.statusCode >= 400) return 'medium';
    return 'low';
  }
}

// Specialized error classes
export class ValidationError extends AppError {
  constructor(message: string, details: ErrorDetail[] = []) {
    super(ErrorCode.VALIDATION_INVALID_FORMAT, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(ErrorCode.AUTH_INVALID_TOKEN, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, message, 403);
  }
}

export class BusinessLogicError extends AppError {
  constructor(code: ErrorCode, message: string, details: ErrorDetail[] = []) {
    const statusCode = code.startsWith('BIZ') ? 400 : 500;
    super(code, message, statusCode, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, reason: string) {
    super(
      ErrorCode.EXT_SERVICE_UNAVAILABLE,
      `Service ${service} unavailable: ${reason}`,
      502,
      [{ field: 'service', message: service }, { field: 'reason', message: reason }]
    );
  }
}

// Error type guards
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthError(error: any): error is AuthenticationError | AuthorizationError {
  return error instanceof AuthenticationError || error instanceof AuthorizationError;
}