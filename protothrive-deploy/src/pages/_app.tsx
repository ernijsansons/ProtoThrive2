// Ref: CLAUDE.md Phase 2 - Enhanced Error boundary with accessibility and recovery
import { Component, ErrorInfo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
// import 'reactflow/dist/style.css';
import '../styles/globals.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<{children: React.ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.log('Thermonuclear Error Boundary Triggered:', error);
    return {
      hasError: true,
      error
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Thermonuclear Error Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: reportError(error, errorInfo);
      console.log('Production error logged for monitoring');
    }
  }

  handleRetry = () => {
    const maxRetries = 3;
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Reload the page if too many retries
      window.location.reload();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      
      return (
        <>
          <Head>
            <title>Error - ProtoThrive</title>
            <meta name="robots" content="noindex, nofollow" />
          </Head>
          
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
              {/* Error Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="bg-error-50 dark:bg-error-900/20 border-b border-error-200 dark:border-error-800 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <svg 
                        className="w-8 h-8 text-error-600 dark:text-error-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" 
                        />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-error-800 dark:text-error-200">
                        Something went wrong
                      </h1>
                      <p className="text-sm text-error-600 dark:text-error-400 mt-1">
                        The application encountered an unexpected error
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      We apologize for the inconvenience. This error has been logged and 
                      our team will investigate the issue.
                    </p>
                    
                    {this.state.retryCount > 0 && (
                      <p className="mt-2 text-warning-600 dark:text-warning-400">
                        Retry attempts: {this.state.retryCount}/3
                      </p>
                    )}
                  </div>

                  {/* Development Error Details */}
                  {isDev && this.state.error && (
                    <details className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Error Details (Development Only)
                      </summary>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                        <div>
                          <strong>Message:</strong>
                          <pre className="mt-1 whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-800 p-2 rounded">
                            {this.state.error.message}
                          </pre>
                        </div>
                        {this.state.error.stack && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs max-h-32 overflow-y-auto">
                              {this.state.error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={this.handleRetry}
                      disabled={this.state.retryCount >= 3}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-describedby="retry-help"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                    </button>
                    
                    <button
                      onClick={this.handleReload}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Reload Page
                    </button>
                  </div>

                  <div id="retry-help" className="sr-only">
                    Attempt to recover from the error and continue using the application
                  </div>

                  {/* Support Information */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      If the problem persists, please contact support with the error details above.
                    </p>
                  </div>
                </div>
              </div>

              {/* Return to Home */}
              <div className="mt-6 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md px-2 py-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </>
      );
    }

    return this.props.children;
  }
}

interface AppProps {
  Component: React.ComponentType<Record<string, unknown>>;
  pageProps: Record<string, unknown>;
}

export default function App({ Component, pageProps }: AppProps) {
  console.log('Thermonuclear App Rendered - Enhanced with Error Recovery');
  
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}