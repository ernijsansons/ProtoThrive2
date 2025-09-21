/**
 * ProtoThrive Authentication Context
 * React context for managing user authentication state
 *
 * Ref: CLAUDE.md Phase 2 - Frontend Authentication Flow
 */

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import ProtoThriveApi, { User, AuthError, tokenStorage } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = tokenStorage.getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        // Validate existing token
        const currentUser = await ProtoThriveApi.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (err instanceof AuthError) {
          // Clear invalid token
          tokenStorage.removeToken();
          setError('Session expired. Please log in again.');
        } else {
          setError('Authentication check failed');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      // Store the token
      ProtoThriveApi.setAuthToken(token);

      // Validate and get user info
      const result = await ProtoThriveApi.validateToken(token);
      if (result.valid && result.user) {
        setUser(result.user);
      } else {
        throw new AuthError('Invalid token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      ProtoThriveApi.logout();
      setUser(null);

      if (err instanceof AuthError) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    ProtoThriveApi.logout();
    setUser(null);
    setError(null);
  };

  const refreshUser = async () => {
    try {
      setError(null);
      const currentUser = await ProtoThriveApi.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('User refresh error:', err);
      if (err instanceof AuthError) {
        logout();
        setError('Session expired. Please log in again.');
      } else {
        setError('Failed to refresh user data');
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for components that require authentication
export function useRequireAuth(): AuthContextType {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      // In a real app, you might redirect to login page here
      console.warn('Component requires authentication but user is not logged in');
    }
  }, [auth.loading, auth.isAuthenticated]);

  return auth;
}

// HOC for protecting routes
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const auth = useRequireAuth();

    if (auth.loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading...</span>
        </div>
      );
    }

    if (!auth.isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
            {auth.error && (
              <p className="text-red-500 mt-2">{auth.error}</p>
            )}
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;