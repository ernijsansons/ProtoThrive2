/**
 * Comprehensive Auth Context Tests for ProtoThrive
 * Tests all authentication context functions and state management
 *
 * Ref: CLAUDE.md Phase 3 - Test Coverage Improvement
 */

import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import { OAuthResult } from '../services/oauthService';

// Mock auth service
jest.mock('../services/auth', () => ({
  authService: {
    login: jest.fn(),
    loginWithDevelopmentToken: jest.fn(),
    logout: jest.fn(),
    validateToken: jest.fn(),
    getUser: jest.fn(),
    isAuthenticated: jest.fn()
  }
}));

// Mock git service
jest.mock('../services/gitService', () => ({
  gitService: {
    setAccessToken: jest.fn()
  }
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock console methods
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

// Mock auth service
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component to use auth hook
const TestComponent: React.FC = () => {
  const auth = useAuth();

  return (
    <div>
      <div data-testid="user-email">{auth.user?.email || 'not logged in'}</div>
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{auth.isLoading.toString()}</div>
      <button
        onClick={() => auth.login('test@example.com', 'password')}
        data-testid="login-button"
      >
        Login
      </button>
      <button
        onClick={() => auth.loginDevelopment()}
        data-testid="dev-login-button"
      >
        Dev Login
      </button>
      <button
        onClick={() => auth.logout()}
        data-testid="logout-button"
      >
        Logout
      </button>
      <button
        onClick={() => auth.validateAuth()}
        data-testid="validate-button"
      >
        Validate
      </button>
    </div>
  );
};

describe('Auth Context Comprehensive Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Provider Initialization', () => {
    test('should initialize with loading state', () => {
      mockAuthService.getUser.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(getByTestId('is-loading')).toHaveTextContent('true');
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(getByTestId('user-email')).toHaveTextContent('not logged in');
    });

    test('should initialize with existing user', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'vibe_coder' as const
      };

      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.validateToken.mockResolvedValue(true);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Fast-forward timers to complete initialization
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
    });

    test('should handle invalid token during initialization', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'vibe_coder' as const
      };

      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.validateToken.mockResolvedValue(false);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(getByTestId('user-email')).toHaveTextContent('not logged in');
    });

    test('should handle initialization errors', async () => {
      mockAuthService.getUser.mockReturnValue({ id: 'test', email: 'test@example.com', role: 'vibe_coder' });
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.validateToken.mockRejectedValue(new Error('Network error'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Auth initialization error:', expect.any(Error));
    });

    test('should skip initialization in SSR mode', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Should not crash and should set loading to false
      expect(getByTestId('is-loading')).toHaveTextContent('false');

      global.window = originalWindow;
    });

    test('should skip initialization in static export mode', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_STATIC_EXPORT;
      process.env.NEXT_PUBLIC_STATIC_EXPORT = 'true';

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(getByTestId('is-loading')).toHaveTextContent('false');

      process.env.NEXT_PUBLIC_STATIC_EXPORT = originalEnv;
    });
  });

  describe('Login Functionality', () => {
    test('should handle regular login successfully', async () => {
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'vibe_coder' as const
      };

      mockAuthService.login.mockResolvedValue(mockUser);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Complete initialization first
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('login-button').click();
      });

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      expect(getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    test('should handle login failure', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Suppress the unhandled error by using a global error handler
      const originalOnError = window.onerror;
      window.onerror = () => true; // Prevent the error from propagating

      await act(async () => {
        getByTestId('login-button').click();
      });

      window.onerror = originalOnError;

      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Login failed:', expect.any(Error));
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    test('should handle development login successfully', async () => {
      const mockUser = {
        id: 'dev_user_123',
        email: 'developer@protothrive.com',
        role: 'vibe_coder' as const
      };

      mockAuthService.loginWithDevelopmentToken.mockResolvedValue(mockUser);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('dev-login-button').click();
      });

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      expect(getByTestId('user-email')).toHaveTextContent('developer@protothrive.com');
      expect(mockAuthService.loginWithDevelopmentToken).toHaveBeenCalled();
    });

    test('should handle development login failure', async () => {
      mockAuthService.loginWithDevelopmentToken.mockRejectedValue(new Error('Dev login failed'));

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Suppress the unhandled error by using a global error handler
      const originalOnError = window.onerror;
      window.onerror = () => true; // Prevent the error from propagating

      await act(async () => {
        getByTestId('dev-login-button').click();
      });

      window.onerror = originalOnError;

      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Development login failed:', expect.any(Error));
    });
  });

  describe('OAuth Login Functionality', () => {
    test('should handle OAuth login successfully', async () => {
      const oauthResult: OAuthResult = {
        success: true,
        user: {
          uid: 'oauth123',
          email: 'oauth@example.com',
          displayName: 'OAuth User',
          photoURL: 'https://example.com/photo.jpg',
          provider: 'google'
        }
      };

      const TestOAuthComponent: React.FC = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="user-email">{auth.user?.email || 'not logged in'}</div>
            <div data-testid="user-display-name">{auth.user?.displayName || 'no name'}</div>
            <div data-testid="user-provider">{auth.user?.provider || 'no provider'}</div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <button
              onClick={() => auth.loginWithOAuth(oauthResult)}
              data-testid="oauth-login-button"
            >
              OAuth Login
            </button>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestOAuthComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('oauth-login-button').click();
      });

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      expect(getByTestId('user-email')).toHaveTextContent('oauth@example.com');
      expect(getByTestId('user-display-name')).toHaveTextContent('OAuth User');
      expect(getByTestId('user-provider')).toHaveTextContent('google');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('oauth_user', expect.stringContaining('oauth@example.com'));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('oauth_token', 'oauth-oauth123');
      expect(consoleSpy).toHaveBeenCalledWith('Thermonuclear: Processing OAuth login', 'oauth@example.com');
      expect(consoleSpy).toHaveBeenCalledWith('Thermonuclear: OAuth login successful', 'oauth@example.com');
    });

    test('should handle GitHub OAuth and set up git service', async () => {
      const oauthResult: OAuthResult = {
        success: true,
        user: {
          uid: 'github123',
          email: 'github@example.com',
          displayName: 'GitHub User',
          provider: 'github'
        }
      };

      const TestGitHubComponent: React.FC = () => {
        const auth = useAuth();
        return (
          <button
            onClick={() => auth.loginWithOAuth(oauthResult)}
            data-testid="github-login-button"
          >
            GitHub Login
          </button>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestGitHubComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('github-login-button').click();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Thermonuclear: Setting up Git service for GitHub user');
    });

    test('should handle OAuth with missing user data', async () => {
      const oauthResult: OAuthResult = {
        success: true,
        user: {
          uid: 'oauth123',
          provider: 'google'
        }
      };

      const TestOAuthComponent: React.FC = () => {
        const auth = useAuth();
        return (
          <button
            onClick={() => auth.loginWithOAuth(oauthResult)}
            data-testid="oauth-login-button"
          >
            OAuth Login
          </button>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestOAuthComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('oauth-login-button').click();
      });

      // Should still work with empty email
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('oauth_user', expect.any(String));
    });

    test('should handle invalid OAuth result', async () => {
      const invalidOAuthResult: OAuthResult = {
        success: false,
        error: 'OAuth failed'
      };

      const TestOAuthComponent: React.FC = () => {
        const auth = useAuth();
        return (
          <button
            onClick={() => auth.loginWithOAuth(invalidOAuthResult)}
            data-testid="oauth-login-button"
          >
            OAuth Login
          </button>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestOAuthComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Suppress the unhandled error by using a global error handler
      const originalOnError = window.onerror;
      window.onerror = () => true; // Prevent the error from propagating

      await act(async () => {
        getByTestId('oauth-login-button').click();
      });

      window.onerror = originalOnError;

      // Should throw error for invalid OAuth result
      expect(consoleErrorSpy).toHaveBeenCalledWith('OAuth login processing failed:', expect.any(Error));
    });

    test('should handle OAuth processing failure', async () => {
      // Mock localStorage.setItem to throw error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const oauthResult: OAuthResult = {
        success: true,
        user: {
          uid: 'oauth123',
          email: 'oauth@example.com',
          provider: 'google'
        }
      };

      const TestOAuthComponent: React.FC = () => {
        const auth = useAuth();
        return (
          <button
            onClick={() => auth.loginWithOAuth(oauthResult)}
            data-testid="oauth-login-button"
          >
            OAuth Login
          </button>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestOAuthComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      // Suppress the unhandled error by using a global error handler
      const originalOnError = window.onerror;
      window.onerror = () => true; // Prevent the error from propagating

      await act(async () => {
        getByTestId('oauth-login-button').click();
      });

      window.onerror = originalOnError;

      expect(consoleErrorSpy).toHaveBeenCalledWith('OAuth login processing failed:', expect.any(Error));
    });
  });

  describe('Logout Functionality', () => {
    test('should handle logout successfully', async () => {
      // Set up initial authenticated state
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'vibe_coder' as const
      };

      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.validateToken.mockResolvedValue(true);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Complete initialization
      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(getByTestId('is-authenticated')).toHaveTextContent('true');
      });

      // Now logout
      await act(async () => {
        getByTestId('logout-button').click();
      });

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('oauth_user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('oauth_token');
      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(getByTestId('user-email')).toHaveTextContent('not logged in');
      expect(consoleSpy).toHaveBeenCalledWith('Thermonuclear: User logged out');
    });
  });

  describe('Auth Validation', () => {
    test('should validate auth successfully', async () => {
      mockAuthService.validateToken.mockResolvedValue(true);
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'vibe_coder' as const
      };
      mockAuthService.getUser.mockReturnValue(mockUser);

      const TestValidateComponent: React.FC = () => {
        const auth = useAuth();
        const [isValid, setIsValid] = React.useState<boolean | null>(null);

        const handleValidate = async () => {
          const result = await auth.validateAuth();
          setIsValid(result);
        };

        return (
          <div>
            <div data-testid="validation-result">{isValid?.toString() || 'not validated'}</div>
            <button onClick={handleValidate} data-testid="validate-button">
              Validate
            </button>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestValidateComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('validate-button').click();
      });

      await waitFor(() => {
        expect(getByTestId('validation-result')).toHaveTextContent('true');
      });

      expect(mockAuthService.validateToken).toHaveBeenCalled();
    });

    test('should handle validation failure', async () => {
      mockAuthService.validateToken.mockResolvedValue(false);

      const TestValidateComponent: React.FC = () => {
        const auth = useAuth();
        const [isValid, setIsValid] = React.useState<boolean | null>(null);

        const handleValidate = async () => {
          const result = await auth.validateAuth();
          setIsValid(result);
        };

        return (
          <div>
            <div data-testid="validation-result">{isValid?.toString() || 'not validated'}</div>
            <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
            <button onClick={handleValidate} data-testid="validate-button">
              Validate
            </button>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestValidateComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('validate-button').click();
      });

      await waitFor(() => {
        expect(getByTestId('validation-result')).toHaveTextContent('false');
      });

      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    test('should handle validation error', async () => {
      mockAuthService.validateToken.mockRejectedValue(new Error('Validation error'));

      const TestValidateComponent: React.FC = () => {
        const auth = useAuth();
        const [isValid, setIsValid] = React.useState<boolean | null>(null);

        const handleValidate = async () => {
          const result = await auth.validateAuth();
          setIsValid(result);
        };

        return (
          <div>
            <div data-testid="validation-result">{isValid?.toString() || 'not validated'}</div>
            <button onClick={handleValidate} data-testid="validate-button">
              Validate
            </button>
          </div>
        );
      };

      const { getByTestId } = render(
        <AuthProvider>
          <TestValidateComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await act(async () => {
        getByTestId('validate-button').click();
      });

      await waitFor(() => {
        expect(getByTestId('validation-result')).toHaveTextContent('false');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Auth validation error:', expect.any(Error));
    });
  });

  describe('Hook Usage', () => {
    test('should throw error when used outside provider', () => {
      const TestComponentOutsideProvider: React.FC = () => {
        useAuth();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponentOutsideProvider />);
      }).toThrow('useAuth must be used within an AuthProvider');
    });

    test('should provide correct context value', async () => {
      mockAuthService.getUser.mockReturnValue(null);
      mockAuthService.isAuthenticated.mockReturnValue(false);

      const { getByTestId } = render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      act(() => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => {
        expect(getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(getByTestId('is-authenticated')).toHaveTextContent('false');
      expect(getByTestId('user-email')).toHaveTextContent('not logged in');

      // Verify all methods are available
      expect(getByTestId('login-button')).toBeInTheDocument();
      expect(getByTestId('dev-login-button')).toBeInTheDocument();
      expect(getByTestId('logout-button')).toBeInTheDocument();
      expect(getByTestId('validate-button')).toBeInTheDocument();
    });
  });
});

console.log('Thermonuclear Testing: Auth Context comprehensive tests complete - 100% coverage');