/**
 * @fileoverview ProtoThrive Store - Secure state management with strongly typed auth
 * Enhanced with security best practices and JWT validation
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Strongly typed user profile
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  createdAt?: string;
  lastLogin?: string;
}

// Strongly typed auth tokens
interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

interface AppState {
  // UI state
  mode: '2d' | '3d';

  // Auth state (strongly typed)
  isAuthenticated: boolean;
  user: UserProfile | null;
  tokens: AuthTokens | null;

  // Actions
  toggleMode: () => void;
  login: (user: UserProfile, token: string, refreshToken?: string) => void;
  logout: () => void;
  validateAuth: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  fetchRoadmap: (id: string) => void;
  triggerDeploy: () => void;
  handleSave: () => void;
  handleExport: () => void;
  handleShare: () => void;
}

// JWT validation helper
const validateToken = (token: string): boolean => {
  try {
    // Basic JWT structure validation
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload
    const payload = JSON.parse(atob(parts[1]));

    // Check expiration
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) return false;

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

// Calculate token expiration (default 15 minutes)
const calculateExpiration = (expiresIn: number = 900): number => {
  return Date.now() + (expiresIn * 1000);
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      mode: '2d',
      isAuthenticated: false,
      user: null,
      tokens: null,

      // Actions
      toggleMode: () => set((state) => ({
        mode: state.mode === '2d' ? '3d' : '2d'
      })),

      login: (user, token, refreshToken) => {
        // Validate token before storing
        if (!validateToken(token)) {
          console.error('Invalid token provided to login');
          return;
        }

        const tokens: AuthTokens = {
          accessToken: token,
          refreshToken,
          expiresAt: calculateExpiration()
        };

        set({
          isAuthenticated: true,
          user: {
            ...user,
            lastLogin: new Date().toISOString()
          },
          tokens
        });
      },

      logout: () => {
        // Clear all auth state
        set({
          isAuthenticated: false,
          user: null,
          tokens: null
        });

        // Clear any persisted data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('protothrive-auth');
        }
      },

      validateAuth: async () => {
        const state = get();

        // Check if authenticated
        if (!state.isAuthenticated || !state.tokens) {
          return false;
        }

        // Check token expiration
        if (state.tokens.expiresAt < Date.now()) {
          // Try to refresh token if refresh token exists
          if (state.tokens.refreshToken) {
            try {
              await get().refreshToken();
              return true;
            } catch {
              get().logout();
              return false;
            }
          }

          get().logout();
          return false;
        }

        // Validate token structure
        if (!validateToken(state.tokens.accessToken)) {
          get().logout();
          return false;
        }

        return true;
      },

      refreshToken: async () => {
        const state = get();

        if (!state.tokens?.refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          // TODO: Call refresh endpoint
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${state.tokens.refreshToken}`
            }
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();

          // Update tokens
          set({
            tokens: {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken || state.tokens.refreshToken,
              expiresAt: calculateExpiration(data.expiresIn)
            }
          });
        } catch (error) {
          console.error('Token refresh error:', error);
          throw error;
        }
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));
      },

  fetchRoadmap: (id) => {
    console.log('Fetching roadmap:', id);
  },

  triggerDeploy: () => {
    console.log('Triggering deployment');
  },

  handleSave: () => {
    console.log('Saving');
  },

  handleExport: () => {
    console.log('Exporting');
  },

      handleShare: () => {
        console.log('Sharing');
      }
    }),
    {
      name: 'protothrive-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        tokens: state.tokens
      })
    }
  )
);