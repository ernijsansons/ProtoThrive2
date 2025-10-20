import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon, SparklesIcon, ExclamationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store';
import { api } from '../utils/api';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Call production backend API (Phase 2: Enhanced auth routes)
      const response: any = await api.login({ email, password });

      // Backend returns: { data: { user: {...}, accessToken, refreshToken } }
      if (response.data?.user && response.data?.accessToken) {
        login({
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name,
        role: response.data.user.role || 'user',
        permissions: response.data.user.permissions || [],
        }, response.data.accessToken, response.data.refreshToken);

        router.push('/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Invalid email or password. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    // SECURITY FIX: Use proper authentication flow instead of hardcoded token
    setLoading(true);
    setErrors({});

    try {
      // Use the proper API to authenticate demo account (Phase 2: Enhanced auth)
      const response: any = await api.login({
        email: 'demo@protothrive.com',
        password: 'demo123456' // Demo account with limited permissions
      });

      // Backend returns: { data: { user: {...}, accessToken, refreshToken } }
      if (response.data?.user && response.data?.accessToken) {
        login({
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role || 'user',
          permissions: response.data.user.permissions || [],
        }, response.data.accessToken, response.data.refreshToken);

        router.push('/dashboard');
      } else {
        throw new Error('Demo login failed');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      setErrors({
        general: 'Demo account temporarily unavailable. Please try regular login.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - ProtoThrive</title>
        <meta name="description" content="Sign in to your ProtoThrive account" />
      </Head>

      <div className="min-h-screen bg-auth-gradient-smooth flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Pattern Overlay */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/5"></div>
        <div className="w-full max-w-md relative z-10">
          {/* Login Form Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center space-x-2 group mb-6 justify-center w-full">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
            </Link>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                Welcome back
              </h1>
              <p className="text-gray-600">
                Sign in to your account to continue building
              </p>
            </div>

            {/* General Error */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700 text-sm">{errors.general}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  {errors.email && (
                    <p id="email-error" className="mt-2 text-sm text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 pr-12 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      placeholder="Enter your password"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="mt-2 text-sm text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>

                  <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                {/* Demo Login Button */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full py-3 px-4 border-2 border-gray-300 hover:border-blue-500 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Try Demo Account
                </button>
              </form>

            {/* Sign Up Link */}
            <div className="mt-6 pt-5 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700">
                  Sign up for free
                </Link>
              </p>
            </div>

            {/* Trust Signals */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-2 flex-wrap">
                <span>✓ No credit card required</span>
                <span className="text-gray-300">•</span>
                <span>✓ 14-day free trial</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
