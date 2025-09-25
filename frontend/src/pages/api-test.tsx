/**
 * API Integration Test Page
 * Demonstrates connection to the new backend API
 *
 * Ref: CLAUDE.md Phase 2 - API Integration Testing
 */

import React from 'react';
import Head from 'next/head';
import { AuthProvider } from '../../lib/auth-context';
import DevLogin from '../components/DevLogin';
import RoadmapManager from '../components/RoadmapManager';

// Add getStaticProps for static export
export async function getStaticProps() {
  return {
    props: {},
  };
}

export default function ApiTestPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Head>
          <title>ProtoThrive API Test</title>
          <meta name="description" content="Test page for ProtoThrive backend API integration" />
        </Head>

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              🚀 ProtoThrive API Integration Test
            </h1>
            <p className="text-gray-600 mt-2">
              Test page for backend API connectivity and authentication
            </p>
          </div>

          {/* API Status */}
          <ApiStatus />

          {/* Authentication Section */}
          <DevLogin />

          {/* API Integration Demo */}
          <RoadmapManager />

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500">
            <p>ProtoThrive Backend API Integration • Phase 2 Testing</p>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}

// Component to show API connectivity status
function ApiStatus() {
  const [status, setStatus] = React.useState<{
    health?: any;
    apiInfo?: any;
    error?: string;
    loading: boolean;
  }>({ loading: true });

  React.useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { default: ProtoThriveApi } = await import('../../lib/api');

        const [health, apiInfo] = await Promise.all([
          ProtoThriveApi.getHealth().catch(err => ({ error: err.message })),
          ProtoThriveApi.getApiInfo().catch(err => ({ error: err.message }))
        ]);

        setStatus({ health, apiInfo, loading: false });
      } catch (error) {
        setStatus({
          error: error instanceof Error ? error.message : 'Unknown error',
          loading: false
        });
      }
    };

    checkApiStatus();
  }, []);

  if (status.loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-blue-700">Checking API status...</span>
        </div>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <span className="text-red-600 font-semibold">❌ API Connection Failed</span>
        </div>
        <p className="text-red-700 mt-1 text-sm">{status.error}</p>
        <p className="text-red-600 mt-2 text-sm">
          Make sure the backend is deployed and accessible at: https://backend-thermo-dev.ernijs-ansons.workers.dev
        </p>
      </div>
    );
  }

  const isHealthy = status.health && !status.health.error;
  const hasApiInfo = status.apiInfo && !status.apiInfo.error;

  return (
    <div className={`border rounded-lg p-4 mb-6 ${
      isHealthy ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${
          isHealthy ? 'text-green-800' : 'text-yellow-800'
        }`}>
          {isHealthy ? '✅ API Connected' : '⚠️ API Partial Connection'}
        </h3>
        <span className="text-xs text-gray-500">
          Backend: backend-thermo-dev.ernijs-ansons.workers.dev
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        {/* Health Check */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">Health Check</h4>
          {status.health.error ? (
            <p className="text-red-600">{status.health.error}</p>
          ) : (
            <div className="space-y-1">
              <p>Status: <span className="font-mono">{status.health.status}</span></p>
              <p>Database: <span className="font-mono">
                {status.health.database?.status || 'unknown'}
              </span></p>
              {status.health.connected !== undefined && (
                <p>Connected: <span className="font-mono">
                  {status.health.connected ? 'true' : 'false'}
                </span></p>
              )}
            </div>
          )}
        </div>

        {/* API Info */}
        <div>
          <h4 className="font-medium text-gray-700 mb-1">API Information</h4>
          {status.apiInfo.error ? (
            <p className="text-red-600">{status.apiInfo.error}</p>
          ) : (
            <div className="space-y-1">
              <p>Message: <span className="font-mono">{status.apiInfo.message}</span></p>
              <p>Version: <span className="font-mono">{status.apiInfo.version}</span></p>
              {status.apiInfo.features && (
                <p>Features: <span className="font-mono text-xs">
                  {status.apiInfo.features.join(', ')}
                </span></p>
              )}
            </div>
          )}
        </div>
      </div>

      {hasApiInfo && status.apiInfo.endpoints && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Available Endpoints</h4>
          <div className="text-xs text-gray-600">
            {Object.entries(status.apiInfo.endpoints).map(([category, endpoints]) => (
              <div key={category} className="mb-1">
                <strong>{category}:</strong> {Array.isArray(endpoints) ? endpoints.join(', ') : JSON.stringify(endpoints)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}