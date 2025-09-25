/**
 * Enterprise SSO Login Component
 * Multi-provider authentication with RBAC support
 * Ref: CLAUDE.md Phase 3 - Enterprise Authentication
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enterpriseAuthService, SSOProvider, SSOUser } from '../services/sso';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface EnterpriseLoginProps {
  onLoginSuccess?: (user: SSOUser) => void;
  onLoginError?: (error: string) => void;
  redirectUrl?: string;
  theme?: 'light' | 'dark';
}

const EnterpriseLogin: React.FC<EnterpriseLoginProps> = ({
  onLoginSuccess,
  onLoginError,
  redirectUrl = '/dashboard',
  theme = 'dark'
}) => {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackCredentials, setFallbackCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Load available SSO providers
    const availableProviders = enterpriseAuthService.getProviders();
    setProviders(availableProviders);

    // Try to restore existing session
    enterpriseAuthService.restoreSession().then(restored => {
      if (restored) {
        enterpriseAuthService.getCurrentUser().then(user => {
          if (user && onLoginSuccess) {
            onLoginSuccess(user);
          }
        });
      }
    });

    console.log('Thermonuclear Enterprise Login: Initialized with', availableProviders.length, 'providers');
  }, [onLoginSuccess]);

  const handleSSOLogin = async (providerId: string) => {
    setLoading(true);
    setSelectedProvider(providerId);
    setError(null);

    try {
      await enterpriseAuthService.initiateSSO('test@example.com');

      // After successful SSO simulation
      const user = await enterpriseAuthService.getCurrentUser();
      if (user) {
        console.log('Thermonuclear Enterprise Login: Success for', user.email);
        if (onLoginSuccess) {
          onLoginSuccess(user);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'SSO login failed';
      setError(errorMessage);
      console.error('Thermonuclear Enterprise Login: Error', errorMessage);
      if (onLoginError) {
        onLoginError(errorMessage);
      }
    } finally {
      setLoading(false);
      setSelectedProvider(null);
    }
  };

  const handleFallbackLogin = async () => {
    if (!fallbackCredentials.email || !fallbackCredentials.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate fallback authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful authentication
      await enterpriseAuthService.initiateSSO('test@example.com');

      const user = await enterpriseAuthService.getCurrentUser();
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      const errorMessage = 'Fallback authentication failed';
      setError(errorMessage);
      if (onLoginError) {
        onLoginError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getProviderIcon = (provider: SSOProvider) => {
    const iconMap: Record<string, string> = {
      google: '🔵',
      microsoft: '🟦',
      github: '⚫',
      'azure-ad': '🔷',
      okta: '🟢',
      auth0: '🟠'
    };
    return iconMap[provider.id] || '🔐';
  };

  const getProviderColor = (provider: SSOProvider) => {
    const colorMap: Record<string, string> = {
      google: 'border-blue-500 hover:bg-blue-500/10',
      microsoft: 'border-indigo-500 hover:bg-indigo-500/10',
      github: 'border-gray-600 hover:bg-gray-600/10',
      'azure-ad': 'border-cyan-500 hover:bg-cyan-500/10',
      okta: 'border-green-500 hover:bg-green-500/10',
      auth0: 'border-orange-500 hover:bg-orange-500/10'
    };
    return colorMap[provider.id] || 'border-neon-blue-primary hover:bg-neon-blue-primary/10';
  };

  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-neon-blue-primary to-neon-purple rounded-xl flex items-center justify-center mb-4"
          >
            <BuildingOfficeIcon className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-neon-blue-primary mb-2">
            Enterprise Login
          </h1>
          <p className="text-text-secondary">
            Sign in with your organization account
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-3"
            >
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SSO Providers */}
        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-medium text-text-secondary mb-3">
            Single Sign-On Providers
          </h3>

          {providers.map((provider, index) => (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => handleSSOLogin(provider.id)}
              disabled={loading}
              className={`w-full p-4 glass-elite border-2 ${getProviderColor(provider)} rounded-lg transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getProviderIcon(provider)}</span>
                  <div className="text-left">
                    <div className="font-medium text-text-primary group-hover:text-white transition-colors">
                      {provider.name}
                    </div>
                    {provider.enterpriseConfig?.domain && (
                      <div className="text-xs text-text-muted">
                        {provider.enterpriseConfig.domain}
                      </div>
                    )}
                  </div>
                </div>

                {loading && selectedProvider === provider.id ? (
                  <div className="spinner-sm" />
                ) : (
                  <ArrowRightIcon className="h-5 w-5 text-text-muted group-hover:text-white transition-colors" />
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Fallback Authentication */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-dark-primary px-2 text-text-muted">
              or
            </span>
          </div>
        </div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => setShowFallback(!showFallback)}
          className="w-full mt-6 p-3 glass-elite border border-border rounded-lg hover:border-neon-blue-primary/50 transition-all text-sm text-text-secondary hover:text-text-primary"
        >
          Use email and password instead
        </motion.button>

        {/* Fallback Form */}
        <AnimatePresence>
          {showFallback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={fallbackCredentials.email}
                  onChange={(e) => setFallbackCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 bg-dark-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-neon-blue-primary focus:ring-1 focus:ring-neon-blue-primary"
                  placeholder="admin@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={fallbackCredentials.password}
                    onChange={(e) => setFallbackCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full p-3 bg-dark-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-neon-blue-primary focus:ring-1 focus:ring-neon-blue-primary pr-10"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleFallbackLogin}
                disabled={loading}
                className="w-full p-3 bg-neon-blue-primary hover:bg-neon-blue-primary/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner-sm" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enterprise Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-4 glass-elite border border-border rounded-lg"
        >
          <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center">
            <ShieldCheckIcon className="h-4 w-4 mr-2" />
            Enterprise Security
          </h4>
          <div className="space-y-2 text-xs text-text-muted">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-3 w-3 text-green-500" />
              <span>Multi-factor authentication</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-3 w-3 text-green-500" />
              <span>Role-based access control</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-3 w-3 text-green-500" />
              <span>Session management</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-3 w-3 text-green-500" />
              <span>Audit logging</span>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-text-muted">
          <p>
            Powered by ProtoThrive Enterprise Authentication
          </p>
          <p className="mt-1">
            Need help? Contact your IT administrator
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default EnterpriseLogin;