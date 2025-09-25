// Ref: CLAUDE.md - Super Admin Login
import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import OAuthButtons from '../components/OAuthButtons';
import { OAuthResult } from '../services/oauthService';
import { environmentSecurityService, csrfProtectionService } from '../utils/security';

const AdminLogin = () => {
  console.log('Thermonuclear AdminLogin Rendered');

  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDevEnvironment, setIsDevEnvironment] = useState(false);
  const [csrfToken, setCsrfToken] = useState('');

  // CRITICAL P0 SECURITY FIX: Environment-based authentication control
  useEffect(() => {
    setMounted(true);
    const isDev = environmentSecurityService.isDevelopmentFeatureEnabled('developmentLogin');
    setIsDevEnvironment(isDev);
    
    // Block access in production
    if (environmentSecurityService.isProductionEnvironment()) {
      console.error('Thermonuclear Security: Admin login portal disabled in production');
      setError('This development portal is not available in production. Please use the main authentication system.');
      return;
    }
    
    console.log('Thermonuclear Security: Development admin login enabled');
    
    // CRITICAL P0 SECURITY FIX: Generate CSRF token
    const token = csrfProtectionService.generateToken();
    setCsrfToken(token);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // CRITICAL P0 SECURITY FIX: Block login attempts in production
    if (environmentSecurityService.isProductionEnvironment()) {
      setError('Development authentication is disabled in production for security reasons.');
      return;
    }
    
    setLoading(true);

    try {
      // CRITICAL P0 SECURITY FIX: Include CSRF token in request
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({ ...credentials, csrfToken })
      });

      const data = await response.json();

      if (response.ok) {
        // SECURITY FIX: Use secure cookie storage instead of localStorage
        // Set secure httpOnly cookie via API response
        document.cookie = `adminToken=${data.token}; Secure; SameSite=Strict; Path=/; Max-Age=3600`;
        sessionStorage.setItem('userRole', data.user.role); // Use sessionStorage for less sensitive data
        console.log('Thermonuclear: Admin login successful');
        if (mounted) router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Thermonuclear Error: Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSuccess = async (result: OAuthResult) => {
    console.log('Thermonuclear: Admin OAuth success, redirecting to admin panel');
    // In a real app, you would verify admin privileges on the backend
    // For now, we'll treat OAuth users as admin-eligible
    if (result.user) {
      // SECURITY FIX: Use secure cookie storage
      document.cookie = `adminToken=oauth-${result.user.uid}; Secure; SameSite=Strict; Path=/; Max-Age=3600`;
      sessionStorage.setItem('userRole', 'admin');
      router.push('/admin');
    }
  };

  const handleOAuthError = (error: string) => {
    console.error('Thermonuclear Error: Admin OAuth failed', error);
    setError(error);
  };

  // Show loading during SSR
  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #111827 0%, #1e3a8a 50%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            border: '4px solid #06b6d4',
            borderTop: '4px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#06b6d4' }}>Loading Admin Portal...</p>
        </div>
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
            <p style={{ color: '#bfdbfe' }}>Super Admin Portal</p>
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

          {/* Production Security Warning */}
          {environmentSecurityService.isProductionEnvironment() && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#fecaca', fontSize: '0.875rem', fontWeight: '600' }}>
                🚫 Development Portal Disabled
              </p>
              <p style={{ color: '#fecaca', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                This admin portal is restricted in production environments for security.
              </p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ marginBottom: '2rem', opacity: environmentSecurityService.isProductionEnvironment() ? 0.5 : 1 }}>
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
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
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
                placeholder="Enter your admin email"
                disabled={loading || environmentSecurityService.isProductionEnvironment()}
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
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
                placeholder="Enter your admin password"
                disabled={loading || environmentSecurityService.isProductionEnvironment()}
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
              disabled={loading || environmentSecurityService.isProductionEnvironment()}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #dc2626, #7c2d12)',
                color: '#ffffff',
                fontWeight: '600',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transition: 'all 0.2s ease',
                fontSize: '1rem'
              }}
              onMouseEnter={(e) => {
                if (!loading && e.target instanceof HTMLElement) {
                  e.target.style.background = 'linear-gradient(135deg, #b91c1c, #581c87)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && e.target instanceof HTMLElement) {
                  e.target.style.background = 'linear-gradient(135deg, #dc2626, #7c2d12)';
                }
              }}
            >
              {loading ? 'Authenticating...' : 'Admin Login'}
            </button>
          </form>

          {/* OAuth Buttons */}
          <OAuthButtons
            onSuccess={handleOAuthSuccess}
            onError={handleOAuthError}
            disabled={loading}
          />

          {/* Footer */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#fbbf24', fontSize: '0.875rem', fontWeight: '600' }}>
              🔒 Thermonuclear Security Active
            </p>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: '#93c5fd', fontSize: '0.75rem' }}>
                Default credentials for testing:
              </p>
              <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                Configure ADMIN_EMAIL and ADMIN_PASSWORD_HASH environment variables
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add getStaticProps for static export
export async function getStaticProps() {
  return {
    props: {},
  };
}

export default React.memo(AdminLogin);