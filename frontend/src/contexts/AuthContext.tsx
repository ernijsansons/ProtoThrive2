/**
 * Authentication Context for ProtoThrive
 * Provides authentication state and methods to the entire app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth';

interface User {
  id: string;
  email: string;
  role: 'vibe_coder' | 'engineer' | 'exec';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDevelopment: () => Promise<void>;
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

    initAuth();
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

  const logout = (): void => {
    authService.logout();
    setUser(null);
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