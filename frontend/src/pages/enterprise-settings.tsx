/**
 * Enterprise Settings Page
 * Advanced configuration for enterprise features
 * Ref: CLAUDE.md Phase 3 - Enterprise Features
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheckIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  KeyIcon,
  BellIcon,
  UsersIcon,
  ChartBarIcon,
  CloudIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
  config?: Record<string, any>;
}

const EnterpriseSettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('security');
  const [settings, setSettings] = useState<Record<string, SettingsSection>>({
    security: {
      id: 'security',
      title: 'Security & Compliance',
      description: 'Configure security policies, SSO, and compliance settings',
      icon: ShieldCheckIcon,
      enabled: true,
      config: {
        ssoEnabled: true,
        mfaRequired: true,
        passwordPolicy: 'strict',
        sessionTimeout: 8,
        auditLogging: true
      }
    },
    users: {
      id: 'users',
      title: 'User Management',
      description: 'User provisioning, roles, and permissions',
      icon: UsersIcon,
      enabled: true,
      config: {
        autoProvisioning: true,
        defaultRole: 'member',
        guestAccess: false,
        userInvites: true
      }
    },
    analytics: {
      id: 'analytics',
      title: 'Analytics & Reporting',
      description: 'Data collection, reports, and insights configuration',
      icon: ChartBarIcon,
      enabled: true,
      config: {
        realTimeMetrics: true,
        dataRetention: 365,
        exportEnabled: true,
        customDashboards: true
      }
    },
    notifications: {
      id: 'notifications',
      title: 'Notifications',
      description: 'Alert preferences and notification channels',
      icon: BellIcon,
      enabled: true,
      config: {
        emailNotifications: true,
        slackIntegration: false,
        webhooks: true,
        alertThresholds: {
          errorRate: 5,
          responseTime: 2000,
          usage: 80
        }
      }
    },
    deployment: {
      id: 'deployment',
      title: 'Global Deployment',
      description: 'Multi-region deployment and CDN configuration',
      icon: GlobeAltIcon,
      enabled: false,
      config: {
        regions: ['us-east-1', 'eu-west-1'],
        cdnEnabled: true,
        edgeCaching: true,
        loadBalancing: 'round-robin'
      }
    },
    integrations: {
      id: 'integrations',
      title: 'API & Integrations',
      description: 'Third-party integrations and API configuration',
      icon: CloudIcon,
      enabled: true,
      config: {
        apiRateLimit: 1000,
        webhookRetries: 3,
        corsOrigins: ['https://app.company.com'],
        apiVersion: 'v2'
      }
    }
  });

  const [saved, setSaved] = useState(false);

  const handleSettingUpdate = (sectionId: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        config: {
          ...prev[sectionId].config,
          [key]: value
        }
      }
    }));
  };

  const handleSectionToggle = (sectionId: string) => {
    setSettings(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        enabled: !prev[sectionId].enabled
      }
    }));
  };

  const handleSaveSettings = async () => {
    console.log('Thermonuclear Enterprise: Saving settings', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const currentSection = settings[activeSection];

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Single Sign-On (SSO)</h3>
          <p className="text-text-muted text-sm">Enable enterprise SSO authentication</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={currentSection.config?.ssoEnabled}
            onChange={(e) => handleSettingUpdate('security', 'ssoEnabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue-primary"></div>
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Multi-Factor Authentication</h3>
          <p className="text-text-muted text-sm">Require MFA for all users</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={currentSection.config?.mfaRequired}
            onChange={(e) => handleSettingUpdate('security', 'mfaRequired', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue-primary"></div>
        </label>
      </div>

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-2">Session Timeout</h3>
        <p className="text-text-muted text-sm mb-3">Automatically log out users after inactivity</p>
        <select
          value={currentSection.config?.sessionTimeout}
          onChange={(e) => handleSettingUpdate('security', 'sessionTimeout', parseInt(e.target.value))}
          className="w-full p-3 bg-dark-tertiary border border-border rounded-lg text-text-primary focus:border-neon-blue-primary focus:ring-1 focus:ring-neon-blue-primary"
        >
          <option value={1}>1 hour</option>
          <option value={4}>4 hours</option>
          <option value={8}>8 hours</option>
          <option value={24}>24 hours</option>
        </select>
      </div>
    </div>
  );

  const renderUsersSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-text-primary">Auto-Provisioning</h3>
          <p className="text-text-muted text-sm">Automatically create user accounts from SSO</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={currentSection.config?.autoProvisioning}
            onChange={(e) => handleSettingUpdate('users', 'autoProvisioning', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue-primary"></div>
        </label>
      </div>

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-2">Default Role</h3>
        <p className="text-text-muted text-sm mb-3">Default role for new users</p>
        <select
          value={currentSection.config?.defaultRole}
          onChange={(e) => handleSettingUpdate('users', 'defaultRole', e.target.value)}
          className="w-full p-3 bg-dark-tertiary border border-border rounded-lg text-text-primary focus:border-neon-blue-primary focus:ring-1 focus:ring-neon-blue-primary"
        >
          <option value="viewer">Viewer</option>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>
  );

  const renderGenericSettings = (sectionId: string) => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <currentSection.icon className="h-16 w-16 text-neon-blue-primary mx-auto mb-4" />
        <h3 className="text-xl font-medium text-text-primary mb-2">{currentSection.title}</h3>
        <p className="text-text-muted">{currentSection.description}</p>
        <p className="text-text-muted text-sm mt-4">Advanced configuration options coming soon...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Header */}
      <motion.header
        className="border-b border-border bg-dark-secondary/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-blue-primary to-neon-purple rounded-xl flex items-center justify-center">
                <Cog6ToothIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neon-blue-primary">Enterprise Settings</h1>
                <p className="text-text-muted">Configure advanced enterprise features</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {saved && (
                <div className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Settings saved</span>
                </div>
              )}
              <button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-neon-blue-primary hover:bg-neon-blue-primary/80 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="glass-elite rounded-xl border border-border p-4">
              <h2 className="font-semibold text-text-primary mb-4">Settings Categories</h2>
              <nav className="space-y-2">
                {Object.values(settings).map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                      activeSection === section.id
                        ? 'bg-neon-blue-primary text-white'
                        : 'text-text-secondary hover:text-text-primary hover:bg-dark-tertiary'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <section.icon className="h-5 w-5" />
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      section.enabled ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
                  </button>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Settings Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="glass-elite rounded-xl border border-border p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <currentSection.icon className="h-6 w-6 text-neon-blue-primary" />
                  <h2 className="text-xl font-semibold text-text-primary">{currentSection.title}</h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSection.enabled}
                    onChange={() => handleSectionToggle(activeSection)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neon-blue-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue-primary"></div>
                </label>
              </div>

              <p className="text-text-muted mb-8">{currentSection.description}</p>

              {currentSection.enabled ? (
                <>
                  {activeSection === 'security' && renderSecuritySettings()}
                  {activeSection === 'users' && renderUsersSettings()}
                  {(activeSection !== 'security' && activeSection !== 'users') && renderGenericSettings(activeSection)}
                </>
              ) : (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-text-primary mb-2">Feature Disabled</h3>
                  <p className="text-text-muted">Enable this feature to access configuration options.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSettingsPage;