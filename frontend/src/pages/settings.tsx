import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheckIcon,
  KeyIcon,
  UserIcon,
  BellIcon,
  EyeIcon,
  CogIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { TwoFactorSetup, TwoFactorVerify } from '@/components/TwoFactorAuth';

interface SettingsTabProps {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  current: boolean;
  onClick: (id: string) => void;
}

interface SecuritySetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  critical?: boolean;
}

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showSetup2FA, setShowSetup2FA] = useState(false);
  const [showVerify2FA, setShowVerify2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Load user settings
  useEffect(() => {
    if (user) {
      // In production, load from API
      setIs2FAEnabled(false); // Mock: user doesn't have 2FA enabled yet
    }
  }, [user]);

  const tabs = [
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon },
  ];

  const securitySettings: SecuritySetting[] = [
    {
      id: 'password',
      name: 'Password',
      description: 'Last changed 30 days ago',
      enabled: true,
      critical: true
    },
    {
      id: 'session-timeout',
      name: 'Session Timeout',
      description: 'Automatically log out after 8 hours of inactivity',
      enabled: true
    },
    {
      id: 'login-notifications',
      name: 'Login Notifications',
      description: 'Get notified of new logins to your account',
      enabled: true
    },
    {
      id: 'device-management',
      name: 'Device Management',
      description: 'Manage trusted devices and active sessions',
      enabled: false
    }
  ];

  const SettingsTab: React.FC<SettingsTabProps> = ({ id, name, icon: Icon, current, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center w-full px-4 py-3 text-left rounded-lg transition-all duration-200 ${
        current
          ? 'bg-blue-50 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {name}
    </button>
  );

  const handle2FASetup = () => {
    setShowSetup2FA(true);
  };

  const handle2FAComplete = (codes: string[]) => {
    setIs2FAEnabled(true);
    setBackupCodes(codes);
    setShowSetup2FA(false);

    // Show success toast
    console.log('2FA enabled successfully');
  };

  const handle2FADisable = () => {
    setShowVerify2FA(true);
  };

  const handle2FAVerifyForDisable = async (code: string): Promise<boolean> => {
    try {
      // Mock verification
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo, accept any 6-digit code
      if (code.match(/^\d{6}$/)) {
        setIs2FAEnabled(false);
        setShowVerify2FA(false);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-gray-700 font-medium">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <SettingsTab
                  key={tab.id}
                  {...tab}
                  current={activeTab === tab.id}
                  onClick={setActiveTab}
                />
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200"
            >
              {activeTab === 'security' && (
                <div className="p-6">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Security Settings</h2>
                    <p className="text-gray-600">Manage your account security and authentication preferences.</p>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${
                          is2FAEnabled
                            ? 'bg-green-100 text-green-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}>
                          <DevicePhoneMobileIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mr-2">
                              Two-Factor Authentication
                            </h3>
                            {is2FAEnabled ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckIcon className="w-3 h-3 mr-1" />
                                Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                Disabled
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {is2FAEnabled
                              ? 'Your account is protected with two-factor authentication. You\'ll need your phone to sign in.'
                              : 'Add an extra layer of security to your account by requiring a code from your phone when you sign in.'
                            }
                          </p>
                          {is2FAEnabled && backupCodes.length > 0 && (
                            <div className="mt-3">
                              <span className="text-sm text-gray-500">
                                You have {backupCodes.length} backup codes remaining
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {!is2FAEnabled ? (
                          <button
                            onClick={handle2FASetup}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            Enable 2FA
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handle2FADisable}
                              className="border border-red-300 text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
                            >
                              Disable 2FA
                            </button>
                            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm">
                              Regenerate Codes
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Other Security Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Security Options</h3>
                    {securitySettings.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                            setting.critical ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <KeyIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{setting.name}</h4>
                            <p className="text-sm text-gray-600">{setting.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <button
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              setting.enabled ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                setting.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Settings</h2>
                    <p className="text-gray-600">Update your personal information and preferences.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          placeholder="First name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          placeholder="Last name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        placeholder="Your company name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="pt-4">
                      <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="p-6">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
                    <p className="text-gray-600">Choose how you want to be notified about account activity.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                      Notification settings coming soon...
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="p-6">
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Application Preferences</h2>
                    <p className="text-gray-600">Customize your ProtoThrive experience.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                      Application preferences coming soon...
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TwoFactorSetup
        isOpen={showSetup2FA}
        onClose={() => setShowSetup2FA(false)}
        onComplete={handle2FAComplete}
        userEmail={user?.email || ''}
      />

      <TwoFactorVerify
        isOpen={showVerify2FA}
        onClose={() => setShowVerify2FA(false)}
        onVerify={handle2FAVerifyForDisable}
        title="Disable Two-Factor Authentication"
        description="Enter your current authentication code to disable 2FA"
      />
    </div>
  );
};

export default SettingsPage;