// Ref: CLAUDE.md - Workspace Settings Component for ProtoThrive
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { teamService, Workspace } from '../services/teamService';
import {
  CogIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  UserGroupIcon,
  CloudIcon,
  PaintBrushIcon,
  BellIcon,
  GlobeAltIcon,
  KeyIcon,
  DocumentTextIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

interface WorkspaceSettingsProps {
  workspaceId: string;
  currentUserId: string;
  className?: string;
}

interface WorkspaceForm {
  name: string;
  description: string;
  domain?: string;
  billingEmail: string;
}

interface SecuritySettings {
  ssoEnabled: boolean;
  enforceSSO: boolean;
  allowTeamCreation: boolean;
  dataRetention: number;
  auditLogging: boolean;
  ipWhitelist: string[];
}

interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  accentColor: string;
}

const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({
  workspaceId,
  currentUserId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'billing' | 'branding' | 'advanced'>('general');
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form states
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceForm>({
    name: '',
    description: '',
    billingEmail: '',
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    ssoEnabled: false,
    enforceSSO: false,
    allowTeamCreation: true,
    dataRetention: 90,
    auditLogging: true,
    ipWhitelist: [],
  });

  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    primaryColor: '#00ffff',
    accentColor: '#ff6b35',
  });

  const [newIpAddress, setNewIpAddress] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load workspace data
  useEffect(() => {
    loadWorkspace();
  }, [workspaceId]);

  const loadWorkspace = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const workspaceData = await teamService.getWorkspace(workspaceId);
      setWorkspace(workspaceData);

      // Populate form states
      setWorkspaceForm({
        name: workspaceData.name,
        description: workspaceData.description,
        domain: workspaceData.domain,
        billingEmail: workspaceData.billingEmail,
      });

      setSecuritySettings({
        ssoEnabled: workspaceData.settings.ssoEnabled,
        enforceSSO: workspaceData.settings.enforceSSO,
        allowTeamCreation: workspaceData.settings.allowTeamCreation,
        dataRetention: workspaceData.settings.dataRetention,
        auditLogging: workspaceData.settings.auditLogging,
        ipWhitelist: workspaceData.settings.ipWhitelist || [],
      });

      setBrandingSettings({
        logo: workspaceData.settings.customBranding?.logo,
        primaryColor: workspaceData.settings.customBranding?.primaryColor || '#00ffff',
        accentColor: workspaceData.settings.customBranding?.accentColor || '#ff6b35',
      });
    } catch (error) {
      console.error('Failed to load workspace:', error);
      setError('Failed to load workspace settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!workspace) return;

    setIsSaving(true);
    try {
      const updatedWorkspace = await teamService.updateWorkspace(workspaceId, {
        name: workspaceForm.name,
        description: workspaceForm.description,
        domain: workspaceForm.domain,
        billingEmail: workspaceForm.billingEmail,
      });

      setWorkspace(updatedWorkspace);
      setHasChanges(false);
      setSuccess('General settings saved successfully');
    } catch (error) {
      console.error('Failed to save general settings:', error);
      setError('Failed to save general settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    if (!workspace) return;

    setIsSaving(true);
    try {
      const updatedWorkspace = await teamService.updateWorkspace(workspaceId, {
        settings: {
          ...workspace.settings,
          ...securitySettings,
        },
      });

      setWorkspace(updatedWorkspace);
      setHasChanges(false);
      setSuccess('Security settings saved successfully');
    } catch (error) {
      console.error('Failed to save security settings:', error);
      setError('Failed to save security settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!workspace) return;

    setIsSaving(true);
    try {
      const updatedWorkspace = await teamService.updateWorkspace(workspaceId, {
        settings: {
          ...workspace.settings,
          customBranding: brandingSettings,
        },
      });

      setWorkspace(updatedWorkspace);
      setHasChanges(false);
      setSuccess('Branding settings saved successfully');
    } catch (error) {
      console.error('Failed to save branding settings:', error);
      setError('Failed to save branding settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddIpAddress = () => {
    if (newIpAddress.trim() && !securitySettings.ipWhitelist.includes(newIpAddress.trim())) {
      setSecuritySettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIpAddress.trim()],
      }));
      setNewIpAddress('');
      setHasChanges(true);
    }
  };

  const handleRemoveIpAddress = (ipAddress: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(ip => ip !== ipAddress),
    }));
    setHasChanges(true);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspace || deleteConfirmText !== workspace.name) {
      setError('Please type the workspace name exactly to confirm deletion');
      return;
    }

    setIsSaving(true);
    try {
      await teamService.deleteWorkspace(workspaceId);
      setSuccess('Workspace deleted successfully');
      // Redirect to workspace selection or home page
      window.location.href = '/workspaces';
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      setError('Failed to delete workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-300">Loading workspace settings...</span>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Workspace Not Found</h3>
          <p className="text-gray-400">The workspace you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Workspace Settings</h2>
          <p className="text-gray-300 mt-1">{workspace.name}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm ${
            workspace.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-300' :
            workspace.plan === 'pro' ? 'bg-blue-500/20 text-blue-300' :
            'bg-gray-500/20 text-gray-300'
          }`}>
            {workspace.plan.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={clearMessages} className="text-red-300 hover:text-red-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span>{success}</span>
            </div>
            <button onClick={clearMessages} className="text-green-300 hover:text-green-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
        {[
          { key: 'general', label: 'General', icon: CogIcon },
          { key: 'security', label: 'Security', icon: ShieldCheckIcon },
          { key: 'billing', label: 'Billing', icon: CreditCardIcon },
          { key: 'branding', label: 'Branding', icon: PaintBrushIcon },
          { key: 'advanced', label: 'Advanced', icon: GlobeAltIcon },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceForm.name}
                  onChange={(e) => {
                    setWorkspaceForm(prev => ({ ...prev, name: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Enter workspace name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Billing Email</label>
                <input
                  type="email"
                  value={workspaceForm.billingEmail}
                  onChange={(e) => {
                    setWorkspaceForm(prev => ({ ...prev, billingEmail: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="billing@company.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={workspaceForm.description}
                  onChange={(e) => {
                    setWorkspaceForm(prev => ({ ...prev, description: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none"
                  rows={3}
                  placeholder="Describe your workspace"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Custom Domain (Optional)</label>
                <input
                  type="text"
                  value={workspaceForm.domain || ''}
                  onChange={(e) => {
                    setWorkspaceForm(prev => ({ ...prev, domain: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="workspace.company.com"
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSaveGeneral}
                disabled={!hasChanges || isSaving}
                className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Usage Statistics</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{workspace.usage.teamsCount}</div>
                <div className="text-sm text-gray-300">Teams</div>
                <div className="text-xs text-gray-400">of {workspace.limits.maxTeams}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{workspace.usage.membersCount}</div>
                <div className="text-sm text-gray-300">Members</div>
                <div className="text-xs text-gray-400">of {workspace.limits.maxMembers}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{workspace.usage.storageUsed}MB</div>
                <div className="text-sm text-gray-300">Storage</div>
                <div className="text-xs text-gray-400">of {workspace.limits.maxStorage}MB</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{workspace.usage.integrationsCount}</div>
                <div className="text-sm text-gray-300">Integrations</div>
                <div className="text-xs text-gray-400">of {workspace.limits.maxIntegrations}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Authentication & Access</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Enable SSO</h4>
                  <p className="text-gray-400 text-sm">Allow single sign-on authentication</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.ssoEnabled}
                    onChange={(e) => {
                      setSecuritySettings(prev => ({ ...prev, ssoEnabled: e.target.checked }));
                      setHasChanges(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Enforce SSO</h4>
                  <p className="text-gray-400 text-sm">Require SSO for all workspace members</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.enforceSSO}
                    onChange={(e) => {
                      setSecuritySettings(prev => ({ ...prev, enforceSSO: e.target.checked }));
                      setHasChanges(true);
                    }}
                    disabled={!securitySettings.ssoEnabled}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 peer-disabled:opacity-50"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Allow Team Creation</h4>
                  <p className="text-gray-400 text-sm">Let members create new teams</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.allowTeamCreation}
                    onChange={(e) => {
                      setSecuritySettings(prev => ({ ...prev, allowTeamCreation: e.target.checked }));
                      setHasChanges(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium">Audit Logging</h4>
                  <p className="text-gray-400 text-sm">Track all workspace activities</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={securitySettings.auditLogging}
                    onChange={(e) => {
                      setSecuritySettings(prev => ({ ...prev, auditLogging: e.target.checked }));
                      setHasChanges(true);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Retention (days)</label>
              <input
                type="number"
                value={securitySettings.dataRetention}
                onChange={(e) => {
                  setSecuritySettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) || 90 }));
                  setHasChanges(true);
                }}
                className="w-32 bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none"
                min="30"
                max="2555"
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSaveSecurity}
                disabled={!hasChanges || isSaving}
                className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Security Settings'}
              </button>
            </div>
          </div>

          {/* IP Whitelist */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">IP Whitelist</h3>
            <p className="text-gray-400 text-sm mb-4">Restrict access to specific IP addresses</p>

            <div className="flex space-x-3 mb-4">
              <input
                type="text"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                className="flex-1 bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none"
                placeholder="192.168.1.1 or 10.0.0.0/24"
              />
              <button
                onClick={handleAddIpAddress}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg"
              >
                Add IP
              </button>
            </div>

            <div className="space-y-2">
              {securitySettings.ipWhitelist.map((ip, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-600 rounded-lg px-3 py-2">
                  <span className="text-white font-mono">{ip}</span>
                  <button
                    onClick={() => handleRemoveIpAddress(ip)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {securitySettings.ipWhitelist.length === 0 && (
                <p className="text-gray-400 text-sm">No IP restrictions configured</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Custom Branding</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Primary Color</label>
                <div className="flex space-x-3">
                  <input
                    type="color"
                    value={brandingSettings.primaryColor}
                    onChange={(e) => {
                      setBrandingSettings(prev => ({ ...prev, primaryColor: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="w-12 h-10 rounded border border-gray-500"
                  />
                  <input
                    type="text"
                    value={brandingSettings.primaryColor}
                    onChange={(e) => {
                      setBrandingSettings(prev => ({ ...prev, primaryColor: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="flex-1 bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none font-mono"
                    placeholder="#00ffff"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Accent Color</label>
                <div className="flex space-x-3">
                  <input
                    type="color"
                    value={brandingSettings.accentColor}
                    onChange={(e) => {
                      setBrandingSettings(prev => ({ ...prev, accentColor: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="w-12 h-10 rounded border border-gray-500"
                  />
                  <input
                    type="text"
                    value={brandingSettings.accentColor}
                    onChange={(e) => {
                      setBrandingSettings(prev => ({ ...prev, accentColor: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="flex-1 bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-cyan-500 focus:outline-none font-mono"
                    placeholder="#ff6b35"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo</label>
              <div className="flex items-center space-x-4">
                {brandingSettings.logo ? (
                  <img
                    src={brandingSettings.logo}
                    alt="Workspace Logo"
                    className="w-16 h-16 object-contain bg-gray-600 rounded-lg p-2"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center">
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex space-x-3">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                    Upload Logo
                  </button>
                  {brandingSettings.logo && (
                    <button
                      onClick={() => {
                        setBrandingSettings(prev => ({ ...prev, logo: undefined }));
                        setHasChanges(true);
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Preview</h4>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-600">
                <div
                  className="h-8 rounded-lg flex items-center px-4 text-white font-medium"
                  style={{ backgroundColor: brandingSettings.primaryColor }}
                >
                  Primary Color Sample
                </div>
                <div
                  className="h-6 rounded-lg flex items-center px-3 text-white text-sm mt-2"
                  style={{ backgroundColor: brandingSettings.accentColor }}
                >
                  Accent Color Sample
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSaveBranding}
                disabled={!hasChanges || isSaving}
                className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Branding'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-300 mb-4 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              Danger Zone
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-white font-medium mb-2">Delete Workspace</h4>
                <p className="text-gray-400 text-sm mb-4">
                  This action cannot be undone. This will permanently delete the workspace, all teams,
                  roadmaps, and remove all member associations.
                </p>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-red-500"
            >
              <div className="flex items-center space-x-3 mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                <h3 className="text-lg font-semibold text-white">Delete Workspace</h3>
              </div>

              <p className="text-gray-300 mb-4">
                This action cannot be undone. This will permanently delete <strong>{workspace.name}</strong>
                and all of its data.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type the workspace name to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-red-500 focus:outline-none"
                  placeholder={workspace.name}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteWorkspace}
                  disabled={deleteConfirmText !== workspace.name || isSaving}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  {isSaving ? 'Deleting...' : 'Delete Workspace'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceSettings;