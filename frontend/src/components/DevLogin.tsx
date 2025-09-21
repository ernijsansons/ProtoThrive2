/**
 * Development Login Component
 * Provides easy access to JWT tokens for testing
 *
 * Ref: CLAUDE.md Phase 2 - Frontend Authentication
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import ProtoThriveApi, { AuthTokens, ApiError } from '../../lib/api';

export default function DevLogin() {
  const { user, login, logout, loading, error, isAuthenticated } = useAuth();
  const [devTokens, setDevTokens] = useState<AuthTokens | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const fetchDevTokens = async () => {
    try {
      setLoadingTokens(true);
      setTokenError(null);
      const response = await ProtoThriveApi.getDevTokens();
      setDevTokens(response.tokens);
    } catch (err) {
      console.error('Failed to fetch dev tokens:', err);
      setTokenError(err instanceof ApiError ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoadingTokens(false);
    }
  };

  const handleTokenLogin = async (token: string, label: string) => {
    try {
      await login(token);
      console.log(`Successfully logged in with ${label} token`);
    } catch (err) {
      console.error(`Failed to login with ${label} token:`, err);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-green-800 font-semibold">✅ Authenticated</h3>
            <p className="text-green-700">
              Logged in as <strong>{user?.email}</strong> ({user?.role})
            </p>
            <p className="text-sm text-green-600">User ID: {user?.id}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-blue-800 font-semibold mb-3">🔐 Development Login</h3>

      {error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-3">
          {error}
        </div>
      )}

      {tokenError && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-3">
          {tokenError}
        </div>
      )}

      {!devTokens ? (
        <div className="text-center">
          <button
            onClick={fetchDevTokens}
            disabled={loadingTokens}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded transition-colors"
          >
            {loadingTokens ? 'Loading...' : 'Get Development Tokens'}
          </button>
          <p className="text-sm text-blue-600 mt-2">
            Click to fetch JWT tokens from the backend for testing
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-blue-700 text-sm mb-3">
            Choose a test account to login with:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-gray-200 rounded p-3">
              <h4 className="font-semibold text-gray-800">Demo User</h4>
              <p className="text-sm text-gray-600 mb-2">Role: vibe_coder</p>
              <button
                onClick={() => handleTokenLogin(devTokens.demo, 'demo')}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {loading ? 'Logging in...' : 'Login as Demo'}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded p-3">
              <h4 className="font-semibold text-gray-800">Test User</h4>
              <p className="text-sm text-gray-600 mb-2">Role: engineer</p>
              <button
                onClick={() => handleTokenLogin(devTokens.test, 'test')}
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {loading ? 'Logging in...' : 'Login as Test'}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded p-3">
              <h4 className="font-semibold text-gray-800">Admin User</h4>
              <p className="text-sm text-gray-600 mb-2">Role: admin</p>
              <button
                onClick={() => handleTokenLogin(devTokens.admin, 'admin')}
                disabled={loading}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {loading ? 'Logging in...' : 'Login as Admin'}
              </button>
            </div>
          </div>

          <div className="text-center mt-4">
            <button
              onClick={() => setDevTokens(null)}
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Refresh Tokens
            </button>
          </div>
        </div>
      )}
    </div>
  );
}