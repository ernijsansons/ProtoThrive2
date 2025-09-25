import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  BugAntIcon,
  InformationCircleIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string;
  showDetails: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    const { errorId } = this.state;

    // Log comprehensive error info
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: 'current-user-id', // In production, get from auth context
    };

    console.error('Error Boundary - Comprehensive Log:', errorData);

    // Send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        error_id: errorId,
      });
    }

    // In production, send to error monitoring service like Sentry
    // Example: Sentry.captureException(error, { extra: errorData });
  };

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      showDetails: false,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error!} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleRetry = async () => {
    setIsRetrying(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate retry delay
    resetError();
    setIsRetrying(false);
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleCopyError = async () => {
    const errorInfo = {
      errorId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error info:', err);
    }
  };

  const handleReportBug = () => {
    const subject = encodeURIComponent(`Error Report: ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Message: ${error.message}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}

Stack Trace:
${error.stack || 'No stack trace available'}

Please describe what you were doing when this error occurred:
[Your description here]
    `);

    window.open(`mailto:support@protothrive.com?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-gray-900 flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 bg-red-900/20 border border-red-500/30 rounded-full flex items-center justify-center"
        >
          <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">
            We're sorry, but something unexpected happened. Please try again.
          </p>
        </motion.div>

        {/* Error ID */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ delay: 0.4 }}
          className="mb-6 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-1">Error ID</h3>
              <code className="text-sm text-blue-400 font-mono">{errorId}</code>
            </div>
            <button
              onClick={handleCopyError}
              className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-4 h-4" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Collapsible Error Details */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-left text-gray-300 hover:text-white transition-colors"
          >
            <div className="flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Technical Details</span>
            </div>
            <motion.div
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-4 bg-gray-900/50 border border-gray-700/50 rounded-lg text-left">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-red-400 mb-2">Error Message:</h4>
                      <pre className="text-xs text-gray-300 bg-red-900/20 p-2 rounded border border-red-500/30 overflow-auto">
                        {error.message}
                      </pre>
                    </div>
                    {error.stack && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-400 mb-2">Stack Trace:</h4>
                        <pre className="text-xs text-gray-300 bg-gray-800/50 p-2 rounded border border-gray-600/50 overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <motion.button
            onClick={handleRetry}
            disabled={isRetrying}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-neon-blue-primary to-neon-purple-primary text-white rounded-lg hover:shadow-glow-blue transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRetrying ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <ArrowPathIcon className="w-4 h-4" />
            )}
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </motion.button>

          <motion.button
            onClick={handleReportBug}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600/80 border border-orange-500/50 text-white rounded-lg hover:bg-orange-500/80 transition-all duration-300"
          >
            <BugAntIcon className="w-4 h-4" />
            <span>Report Bug</span>
          </motion.button>

          <motion.button
            onClick={handleGoHome}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-700/50 border border-gray-600/50 text-white rounded-lg hover:bg-gray-600/50 transition-all duration-300"
          >
            <HomeIcon className="w-4 h-4" />
            <span>Go Home</span>
          </motion.button>
        </motion.div>

        {/* Support Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-xs text-gray-500 text-center"
        >
          If this problem persists, please{' '}
          <button
            onClick={handleReportBug}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            contact our support team
          </button>{' '}
          with the error ID above.
        </motion.div>
      </div>
    </motion.div>
  );
};

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Hook for handling async errors in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error | string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Log to console
    console.error('Async Error Captured:', errorObj);

    // Track in analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: errorObj.message,
        fatal: false
      });
    }

    setError(errorObj);
  }, []);

  // Throw error to be caught by error boundary
  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

// Hook for safe async operations
export function useSafeAsync() {
  const { captureError } = useErrorHandler();
  const [isLoading, setIsLoading] = React.useState(false);

  const executeAsync = React.useCallback(
    async (asyncFn: () => Promise<any>, onSuccess?: (result: any) => void, onError?: (error: Error) => void) => {
      setIsLoading(true);

      try {
        const result = await asyncFn();
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));

        if (onError) {
          onError(errorObj);
        } else {
          captureError(errorObj);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [captureError]
  );

  return { executeAsync, isLoading };
}

export default ErrorBoundary;