/**
 * Authentication Context for ProtoThrive - SECURITY ENHANCED
 * Provides authentication state and methods to the entire app
 * Ref: CLAUDE.md Security - P0 secure token storage implementation
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';
import { OAuthResult, OAuthUser } from '../services/oauthService';
import { gitService } from '../services/gitService';
import { secureStorage } from '../utils/security';

interface User {
  id: string;
  email: string;
  role: 'vibe_coder' | 'engineer' | 'exec';
  displayName?: string;
  photoURL?: string;
  provider?: 'email' | 'google' | 'github';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDevelopment: () => Promise<void>;
  loginWithOAuth: (oauthResult: OAuthResult) => Promise<void>;
  logout: () => void;
  validateAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // In static export mode, skip server-side auth validation
        if (typeof window === 'undefined' || process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true') {
          setIsLoading(false);
          return;
        }

        // Check if user is already logged in
        const currentUser = authService.getUser();
        if (currentUser && authService.isAuthenticated()) {
          // Validate token
          const isValid = await authService.validateToken();
          if (isValid) {
            setUser(authService.getUser());
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay for static export to ensure client hydration
    const timer = setTimeout(initAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.login({ email, password });
      setUser(loggedInUser);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDevelopment = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const loggedInUser = await authService.loginWithDevelopmentToken();
      setUser(loggedInUser);
    } catch (error) {
      console.error('Development login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOAuth = async (oauthResult: OAuthResult): Promise<void> => {
    if (!oauthResult.success || !oauthResult.user) {
      throw new Error('Invalid OAuth result');
    }

    setIsLoading(true);
    try {
      console.log('Thermonuclear: Processing OAuth login', oauthResult.user.email);

      // Convert OAuth user to internal user format
      const user: User = {
        id: oauthResult.user.uid,
        email: oauthResult.user.email || '',
        role: 'vibe_coder', // Default role for OAuth users
        displayName: oauthResult.user.displayName || undefined,
        photoURL: oauthResult.user.photoURL || undefined,
        provider: oauthResult.user.provider
      };

      // CRITICAL P0 SECURITY FIX: Use secure storage instead of localStorage for tokens
      // In production, these should be httpOnly cookies set by the backend
      console.warn('Thermonuclear Security: Using secure storage for OAuth data');
      secureStorage.setItem('oauth_user', JSON.stringify(user));
      secureStorage.setItem('oauth_token', `oauth-${user.id}`);

      setUser(user);

      // Set up Git service for GitHub users
      if (oauthResult.user.provider === 'github') {
        // In a real app, you would extract the GitHub access token from the OAuth result
        // For now, we'll set up the service to work with mock mode
        console.log('Thermonuclear: Setting up Git service for GitHub user');
        // gitService.setAccessToken(githubAccessToken); // Would be real token in production
      }

      console.log('Thermonuclear: OAuth login successful', user.email);
    } catch (error) {
      console.error('OAuth login processing failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    // SECURITY FIX: Clear OAuth data from secure storage
    secureStorage.removeItem('oauth_user');
    secureStorage.removeItem('oauth_token');
    setUser(null);
    console.log('Thermonuclear: User logged out');
  };

  const validateAuth = async (): Promise<boolean> => {
    try {
      const isValid = await authService.validateToken();
      if (!isValid) {
        setUser(null);
      } else {
        setUser(authService.getUser());
      }
      return isValid;
    } catch (error) {
      console.error('Auth validation error:', error);
      setUser(null);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginDevelopment,
    loginWithOAuth,
    logout,
    validateAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;