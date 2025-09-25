import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import OAuthButtons from '../components/OAuthButtons';
import { OAuthResult } from '../services/oauthService';
import { environmentSecurityService } from '../utils/security';

const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, loginDevelopment, loginWithOAuth, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevelopmentLogin = async () => {
    // CRITICAL P0 SECURITY FIX: Block development login in production
    if (!environmentSecurityService.isDevelopmentFeatureEnabled('developmentLogin')) {
      setError('Development login is disabled in production environment');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await loginDevelopment();
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Development login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthSuccess = async (result: OAuthResult) => {
    try {
      console.log('Thermonuclear: OAuth success, processing login');
      await loginWithOAuth(result);
      router.push('/');
    } catch (err: any) {
      console.error('Thermonuclear Error: OAuth login failed', err);
      setError(err.message || 'OAuth login failed');
    }
  };

  const handleOAuthError = (error: string) => {
    console.error('Thermonuclear Error: OAuth failed', error);
    setError(error);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#111827',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#ffffff', fontSize: '1.125rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #111827 0%, #1e3a8a 50%, #7c3aed 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '28rem',
        opacity: 1,
        transform: 'translateY(0)',
        transition: 'all 0.6s ease'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Logo/Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '0.5rem',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}>
              ProtoThrive
            </h1>
            <p style={{ color: '#bfdbfe' }}>AI-Powered Development Platform</p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              opacity: 1,
              transform: 'scale(1)',
              transition: 'all 0.2s ease'
            }}>
              <p style={{ color: '#fecaca', fontSize: '0.875rem' }}>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#bfdbfe',
                marginBottom: '0.5rem'
              }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Enter your email"
                disabled={isSubmitting}
                onFocus={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#bfdbfe',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                placeholder="Enter your password"
                disabled={isSubmitting}
                onFocus={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }
                }}
                onBlur={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.5 : 1,
                transition: 'all 0.2s ease',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting && e.target instanceof HTMLElement) {
                  e.target.style.background = 'linear-gradient(135deg, #1d4ed8, #6d28d9)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting && e.target instanceof HTMLElement) {
                  e.target.style.background = 'linear-gradient(135deg, #2563eb, #7c3aed)';
                }
              }}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* OAuth Buttons */}
          <OAuthButtons
            onSuccess={handleOAuthSuccess}
            onError={handleOAuthError}
            disabled={isSubmitting}
          />

          {/* Beta Disclaimer - Required for compliance */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            *Beta software - features and pricing subject to change.
            <br />
            <a href="/terms" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              Terms of Service
            </a>
            {' • '}
            <a href="/privacy" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              Privacy Policy
            </a>
          </div>

          {/* Development Mode - SECURED: Only show in development environment */}
          {environmentSecurityService.isDevelopmentFeatureEnabled('developmentLogin') && (
            <div style={{
              paddingTop: '1.5rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <p style={{
                textAlign: 'center',
                color: '#bfdbfe',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                Development Mode
              </p>
              <button
                onClick={handleDevelopmentLogin}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669, #0d9488)',
                  color: '#ffffff',
                  fontWeight: '600',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  fontSize: '1rem',
                  marginBottom: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting && e.target instanceof HTMLElement) {
                    e.target.style.background = 'linear-gradient(135deg, #047857, #0f766e)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting && e.target instanceof HTMLElement) {
                    e.target.style.background = 'linear-gradient(135deg, #059669, #0d9488)';
                  }
                }}
              >
                {isSubmitting ? 'Connecting...' : 'Quick Start (Development)'}
              </button>
              <p style={{
                textAlign: 'center',
                color: '#93c5fd',
                fontSize: '0.75rem'
              }}>
                Skip authentication for development and testing
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#93c5fd', fontSize: '0.875rem' }}>
              Need an account?{' '}
              <button
                onClick={() => router.push('/signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60a5fa',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                onMouseEnter={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.color = '#93c5fd';
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.target instanceof HTMLElement) {
                    e.target.style.color = '#60a5fa';
                  }
                }}
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;// Add getStaticProps for static export
export async function getStaticProps() {
  return {
    props: {},
  };
}

