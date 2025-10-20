/**
 * Enhanced Error Boundary Component
 * Ref: CLAUDE.md - Production-grade error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export class EnhancedErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private previousResetKeys: Array<string | number> = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId } = this.state;

    // Log error with context
    console.group(`🚨 Error Boundary [${level}] - ${errorId}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Props:', this.props);
    console.groupEnd();

    // Update state with error info
    this.setState({ errorInfo });

    // Custom error handler
    if (onError) {
      try {
        onError(error, errorInfo);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    // Auto-retry for component-level errors
    if (level === 'component' && this.state.retryCount < 2) {
      this.scheduleRetry();
    }

    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportToMonitoring(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    // Reset error state when resetKeys change
    if (hasError && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => this.previousResetKeys[idx] !== resetKey
      );

      if (hasResetKeyChanged) {
        this.previousResetKeys = resetKeys;
        this.resetErrorBoundary();
      }
    }

    // Reset on any props change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  private scheduleRetry = () => {
    this.resetTimeoutId = window.setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));
    }, 3000); // Retry after 3 seconds
  };

  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    });
  };

  private reportToMonitoring = (error: Error, errorInfo: ErrorInfo) => {
    // In production, send to monitoring service (e.g., Sentry)
    try {
      // Example monitoring service integration
      if ((window as any).Sentry) {
        (window as any).Sentry.withScope((scope: any) => {
          scope.setTag('errorBoundary', true);
          scope.setLevel('error');
          scope.setContext('errorInfo', {
            componentStack: errorInfo.componentStack
          });
          (window as any).Sentry.captureException(error);
        });
      }
    } catch (monitoringError) {
      console.error('Failed to report to monitoring:', monitoringError);
    }
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReportProblem = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Generate report data
    const reportData = {
      errorId,
      timestamp: new Date().toISOString(),
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      },
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('protothrive_userId') || 'anonymous'
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2)).then(() => {
      alert('Error report copied to clipboard. Please send this to support.');
    }).catch(() => {
      console.error('Failed to copy error report to clipboard');
      alert('Failed to copy error report. Please take a screenshot and report manually.');
    });
  };

  render() {
    const { hasError, error, errorId, retryCount } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError && error) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI based on level
      if (level === 'critical') {
        return (
          <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Application Error
              </h1>
              <p className="text-gray-600 mb-6">
                The application has encountered a critical error and cannot continue.
                Please refresh the page or contact support if the problem persists.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={this.handleReportProblem}
                  className="w-full bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Report Problem
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Error ID: {errorId}
              </p>
            </div>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="min-h-96 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-4">
                This page encountered an error. Please try again or go back.
              </p>
              <div className="space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Back
                </button>
              </div>
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs bg-red-50 p-3 rounded overflow-auto text-red-800">
                    {error.message}
                    {'\n'}
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        );
      }

      // Component level error
      return (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 m-2">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Component Error
              </h3>
              <p className="text-sm text-red-700 mt-1">
                This component failed to render. {retryCount > 0 && `(Retry ${retryCount}/2)`}
              </p>
              {retryCount < 2 && (
                <p className="text-xs text-red-600 mt-2">
                  Automatic retry in progress...
                </p>
              )}
              {retryCount >= 2 && (
                <button
                  onClick={this.handleRetry}
                  className="text-xs text-red-600 underline hover:text-red-800 mt-2"
                >
                  Manual Retry
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default EnhancedErrorBoundary;