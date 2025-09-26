// Ref: CLAUDE.md - Enhanced Super Admin Login with full accessibility and responsive design
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const AdminLogin = () => {
  console.log('Thermonuclear AdminLogin Rendered');
  
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Form validation
    if (!credentials.email.trim()) {
      setError('Email is required');
      setLoading(false);
      emailRef.current?.focus();
      return;
    }

    if (!credentials.password.trim()) {
      setError('Password is required');
      setLoading(false);
      passwordRef.current?.focus();
      return;
    }

    if (credentials.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      passwordRef.current?.focus();
      return;
    }

    // Check rate limiting
    if (rateLimitedUntil && new Date() < rateLimitedUntil) {
      const remainingTime = Math.ceil((rateLimitedUntil.getTime() - new Date().getTime()) / 1000);
      setError(`Too many attempts. Please wait ${remainingTime} seconds before trying again.`);
      setLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited
          setRateLimitedUntil(new Date(Date.now() + 30000)); // 30 second delay
          setError('Too many login attempts. Please wait 30 seconds.');
          return;
        }
        
        if (response.status === 401) {
          setRetryCount(prev => prev + 1);
          if (retryCount >= 2) {
            setRateLimitedUntil(new Date(Date.now() + 60000)); // 1 minute delay
            setError('Maximum retry attempts exceeded. Please wait 1 minute.');
            return;
          }
        }
      }

      const data = await response.json();

      if (response.ok) {
        // Validate response structure
        if (!data.token || !data.user?.role) {
          throw new Error('Invalid server response');
        }

        // Store auth token securely
        try {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('userRole', data.user.role);
          console.log('Thermonuclear: Admin login successful');
        } catch (storageError) {
          console.error('Failed to store auth data:', storageError);
          setError('Login successful but failed to store session. Please try again.');
          return;
        }
        
        // Announce success for screen readers
        const successMessage = document.createElement('div');
        successMessage.setAttribute('aria-live', 'polite');
        successMessage.textContent = 'Login successful. Redirecting to admin dashboard.';
        successMessage.className = 'sr-only';
        document.body.appendChild(successMessage);
        
        // Clean up after announcement
        setTimeout(() => {
          document.body.removeChild(successMessage);
          router.push('/admin');
        }, 1000);
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
        emailRef.current?.focus();
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please check your connection and try again.');
        } else {
          setError(`Login error: ${err.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error('Thermonuclear Error: Login failed', err);
      emailRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <>
      <Head>
        <title>Admin Login - ProtoThrive</title>
        <meta name="description" content="Secure admin access to ProtoThrive platform management." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Skip link for accessibility */}
      <a 
        href="#login-form" 
        className="skip-link"
        aria-label="Skip to login form"
      >
        Skip to login form
      </a>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-r from-neon-cyan/20 to-neon-pink/20"></div>
        </div>

        <div className="relative w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link 
              href="/"
              className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors focus-ring rounded-md p-2"
              aria-label="Return to homepage"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Login Card */}
          <div className="neon-card animate-fade-in-up">
            {/* Card Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">PT</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 neon-text">
                Super Admin Access
              </h1>
              <p className="text-gray-300 text-sm">
                Secure gateway to platform management
              </p>
            </div>
            
            {/* Login Form */}
            <form 
              id="login-form"
              onSubmit={handleLogin} 
              className="space-y-6"
              role="form"
              aria-labelledby="login-heading"
              noValidate
            >
              <h2 id="login-heading" className="sr-only">Admin Login Form</h2>
              
              {/* Email Field */}
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={credentials.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                    placeholder="admin@protothrive.com"
                    aria-describedby="email-help"
                    aria-invalid={error && !credentials.email ? 'true' : 'false'}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
                <div id="email-help" className="sr-only">
                  Enter your administrator email address
                </div>
              </div>
              
              {/* Password Field */}
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 pr-12"
                    placeholder="Enter your password"
                    aria-describedby="password-help"
                    aria-invalid={error && !credentials.password ? 'true' : 'false'}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white focus:outline-none focus:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div id="password-help" className="sr-only">
                  Enter your administrator password (minimum 8 characters)
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div 
                  className="p-3 bg-error-50/10 border border-error-500/30 rounded-lg text-error-400 text-sm flex items-center space-x-2"
                  role="alert"
                  aria-live="assertive"
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !credentials.email || !credentials.password}
                className="w-full btn bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg font-medium shadow-soft hover:shadow-medium transition-all duration-300 focus-ring"
                aria-describedby="submit-help"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Access Admin Portal'
                )}
              </button>
              <div id="submit-help" className="sr-only">
                Click to authenticate and access the admin dashboard
              </div>
            </form>

            {/* Development Credentials Notice */}
            <div className="mt-8 p-4 bg-warning-50/5 border border-warning-500/30 rounded-lg">
              <h3 className="text-warning-400 font-medium text-sm mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Development Environment
              </h3>
              <div className="text-gray-400 text-xs space-y-1">
                <p>Test credentials (development only):</p>
                <div className="font-mono bg-gray-800 p-2 rounded text-xs space-y-1">
                  <p>⚠️ Configure ADMIN_EMAIL and ADMIN_PASSWORD environment variables</p>
                  <p>Default credentials removed for security</p>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></div>
                <span>Thermonuclear Security Protocol Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLogin;