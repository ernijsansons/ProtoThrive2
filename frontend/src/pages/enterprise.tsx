/**
 * Enterprise Dashboard Page
 * Demonstrates SSO integration and enterprise features
 * Ref: CLAUDE.md Phase 3 - Enterprise Features
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { enterpriseSSO, SSOUser } from '../services/sso';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  BellIcon
} from '@heroicons/react/24/outline';

// Dynamically import EnterpriseLogin to avoid SSR issues
const EnterpriseLogin = dynamic(() => import('../components/EnterpriseLogin'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="spinner-elite mb-4"></div>
    </div>
  )
});

interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ComponentType<any>;
}

interface EnterprisePage {
  isAuthenticated: boolean;
  user: SSOUser | null;
}

const EnterprisePage: React.FC = () => {
  const [authState, setAuthState] = useState<EnterprisePage>({
    isAuthenticated: false,
    user: null
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      const sessionValid = await (enterpriseSSO as any).validateSession();
      if (sessionValid) {
        const currentUser = (enterpriseSSO as any).getCurrentUser();
        if (!currentUser) return;
        setAuthState({
          isAuthenticated: true,
          user: currentUser as SSOUser
        });
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (user: SSOUser) => {
    setAuthState({
      isAuthenticated: true,
      user
    });
    console.log('Thermonuclear Enterprise: Login success for', user.email);
  };

  const handleLoginError = (error: string) => {
    console.error('Thermonuclear Enterprise: Login error', error);
  };

  const handleLogout = async () => {
    await enterpriseSSO.logout();
    setAuthState({
      isAuthenticated: false,
      user: null
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-elite mb-4 mx-auto"></div>
          <p className="text-neon-blue-primary animate-neon-glow">Loading Enterprise Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authState.isAuthenticated) {
    return (
      <EnterpriseLogin
        onLoginSuccess={handleLoginSuccess}
        onLoginError={handleLoginError}
        redirectUrl="/enterprise"
      />
    );
  }

  const { user } = authState;

  const dashboardMetrics: DashboardMetric[] = [
    {
      label: 'Active Projects',
      value: '24',
      change: '+12%',
      positive: true,
      icon: ChartBarIcon
    },
    {
      label: 'Team Members',
      value: '156',
      change: '+8%',
      positive: true,
      icon: UserGroupIcon
    },
    {
      label: 'Deployment Success',
      value: '98.5%',
      change: '+2.1%',
      positive: true,
      icon: CheckCircleIcon
    },
    {
      label: 'Security Score',
      value: '96/100',
      change: 'Excellent',
      positive: true,
      icon: ShieldCheckIcon
    }
  ];

  const enterpriseFeatures = [
    {
      title: 'Advanced Analytics',
      description: 'Comprehensive insights into team productivity and project performance',
      icon: ChartBarIcon,
      status: 'Available',
      color: 'neon-blue-primary'
    },
    {
      title: 'User Management',
      description: 'Role-based access control and team administration',
      icon: UserGroupIcon,
      status: 'Available',
      color: 'neon-green-primary'
    },
    {
      title: 'Global Deployment',
      description: 'Multi-region infrastructure with CDN optimization',
      icon: GlobeAltIcon,
      status: 'Available',
      color: 'neon-purple'
    },
    {
      title: 'Enterprise Security',
      description: 'Advanced threat protection and compliance monitoring',
      icon: ShieldCheckIcon,
      status: 'Available',
      color: 'neon-orange'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Header */}
      <motion.header
        className="border-b border-border bg-dark-secondary/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-neon-blue-primary to-neon-purple rounded-lg flex items-center justify-center">
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neon-blue-primary">Enterprise Dashboard</h1>
                <p className="text-sm text-text-muted">{user?.organization?.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">{user?.name}</div>
                  <div className="text-xs text-text-muted">{user?.roles?.[0]}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-neon-blue-primary/20 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-neon-blue-primary" />
                </div>
              </div>

              {/* Notifications */}
              <button className="p-2 rounded-lg bg-dark-tertiary hover:bg-dark-secondary transition-colors">
                <BellIcon className="h-5 w-5 text-text-muted" />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="glass-elite p-6 rounded-xl border border-neon-blue-primary/30">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neon-blue-primary mb-2">
                  Welcome back, {user?.profile?.firstName}!
                </h2>
                <p className="text-text-secondary mb-4">
                  You're signed in with {user?.provider} SSO as {user?.roles?.[0]}
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-text-muted">Organization: {user?.organization?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-text-muted">Plan: {user?.organization?.plan}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-text-muted">Last login</div>
                <div className="text-text-primary">{user?.lastLogin.toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Metrics Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-bold text-text-primary mb-4">Organization Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass-elite p-4 rounded-lg border border-border hover:border-neon-blue-primary/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <metric.icon className="h-6 w-6 text-neon-blue-primary" />
                  <span className={`text-xs px-2 py-1 rounded ${
                    metric.positive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-text-primary mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-text-muted">
                  {metric.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Enterprise Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="text-xl font-bold text-text-primary mb-4">Enterprise Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {enterpriseFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="glass-elite p-6 rounded-xl border border-border hover:border-neon-blue-primary/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-${feature.color}/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-text-primary group-hover:text-neon-blue-primary transition-colors">
                        {feature.title}
                      </h4>
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        {feature.status}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mb-3">
                      {feature.description}
                    </p>
                    <div className="flex items-center text-neon-blue-primary text-sm group-hover:text-white transition-colors">
                      <span>Explore feature</span>
                      <ArrowRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Permissions Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-text-primary mb-4">Your Access Permissions</h3>
          <div className="glass-elite p-6 rounded-xl border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-text-primary mb-3">Roles</h4>
                <div className="space-y-2">
                  {user?.roles?.map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-text-secondary capitalize">{role}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-3">Permissions</h4>
                <div className="space-y-2">
                  {user?.permissions?.map(permission => (
                    <div key={permission} className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-neon-blue-primary" />
                      <span className="text-text-secondary capitalize">{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default EnterprisePage;