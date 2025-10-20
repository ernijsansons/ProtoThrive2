/**
 * Admin Dashboard Component
 * Enterprise admin interface for user and organization management
 * Ref: CLAUDE.md Phase 3 - Admin User Management
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  adminUserService,
  AdminUser,
  UserActivity,
  OrganizationStats,
  AdminPermission
} from '../services/admin';
import {
  UsersIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BellIcon
} from '@heroicons/react/24/outline';

type TabType = 'users' | 'organizations' | 'activity' | 'security' | 'settings';

interface AdminDashboardProps {
  currentUser?: AdminUser;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationStats[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [securitySummary, setSecuritySummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [usersData, orgsData, activitiesData, securityData] = await Promise.all([
        adminUserService.getUsers(),
        adminUserService.getOrganizations(),
        adminUserService.getUserActivity({ limit: 50 }),
        adminUserService.getSecuritySummary()
      ]);

      setUsers(usersData);
      setOrganizations(orgsData);
      setActivities(activitiesData);
      setSecuritySummary(securityData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (action: string, userId: string) => {
    try {
      switch (action) {
        case 'suspend':
          await adminUserService.updateUser(userId, { status: 'suspended' });
          break;
        case 'activate':
          await adminUserService.updateUser(userId, { status: 'active' });
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this user?')) {
            await adminUserService.deleteUser(userId);
          }
          break;
      }
      loadDashboardData();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.organization.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: UsersIcon, count: users.length },
    { id: 'organizations', label: 'Organizations', icon: BuildingOfficeIcon, count: organizations.length },
    { id: 'activity', label: 'Activity', icon: ChartBarIcon, count: activities.length },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon, badge: securitySummary?.recentSuspiciousActivity?.length || 0 },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon }
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400 border-green-500/50',
      suspended: 'bg-red-500/20 text-red-400 border-red-500/50',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      org_admin: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      user_admin: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      viewer: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };
    return styles[role as keyof typeof styles] || styles.viewer;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-elite mb-4 mx-auto"></div>
          <p className="text-neon-blue-primary animate-neon-glow">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Header */}
      <motion.header
        className="border-b border-border bg-dark-secondary/50 backdrop-blur-sm sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neon-blue-primary">Admin Dashboard</h1>
                <p className="text-sm text-text-muted">Enterprise Management Console</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-dark-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-neon-blue-primary focus:ring-1 focus:ring-neon-blue-primary"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-lg bg-dark-tertiary hover:bg-dark-secondary transition-colors">
                  <BellIcon className="h-5 w-5 text-text-muted" />
                  {securitySummary?.recentSuspiciousActivity?.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {securitySummary.recentSuspiciousActivity.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-elite p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-neon-blue-primary">{securitySummary?.totalUsers || 0}</p>
                </div>
                <UsersIcon className="h-8 w-8 text-neon-blue-primary" />
              </div>
            </div>

            <div className="glass-elite p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-green-400">{securitySummary?.activeUsers || 0}</p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="glass-elite p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-sm">Organizations</p>
                  <p className="text-2xl font-bold text-purple-400">{organizations.length}</p>
                </div>
                <BuildingOfficeIcon className="h-8 w-8 text-purple-400" />
              </div>
            </div>

            <div className="glass-elite p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-muted text-sm">Security Alerts</p>
                  <p className="text-2xl font-bold text-orange-400">{securitySummary?.recentSuspiciousActivity?.length || 0}</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-orange-400" />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex space-x-1 bg-dark-secondary rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-neon-blue-primary text-white'
                    : 'text-text-muted hover:text-text-primary hover:bg-dark-tertiary'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-dark-tertiary text-text-muted px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
                {tab.badge > 0 && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-elite rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-text-primary">User Management</h3>
                  <button
                    onClick={() => setShowUserModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-neon-blue-primary hover:bg-neon-blue-primary/80 text-white rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Organization</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Last Login</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-dark-secondary/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-text-primary">{user.name}</div>
                              <div className="text-sm text-text-muted">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${getRoleBadge(user.role)}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-text-primary">{user.organization.name}</div>
                            <div className="text-sm text-text-muted">{user.organization.plan}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full border ${getStatusBadge(user.status)}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted">
                            {user.lastLogin.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="text-neon-blue-primary hover:text-neon-blue-primary/80"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowUserModal(true);
                                }}
                                className="text-text-muted hover:text-text-primary"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleUserAction('suspend', user.id)}
                                  className="text-orange-400 hover:text-orange-300"
                                >
                                  <XCircleIcon className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction('activate', user.id)}
                                  className="text-green-400 hover:text-green-300"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleUserAction('delete', user.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'organizations' && (
            <motion.div
              key="organizations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {organizations.map((org) => (
                  <div key={org.id} className="glass-elite p-6 rounded-xl border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">{org.name}</h3>
                        <p className="text-text-muted text-sm">{org.planUsage.plan} plan</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        org.billing.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {org.billing.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Users</span>
                        <span className="text-text-primary">{org.userCount} / {org.planUsage.limits.users}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Active Users</span>
                        <span className="text-green-400">{org.activeUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Storage</span>
                        <span className="text-text-primary">{org.planUsage.usage.storage_gb}GB / {org.planUsage.limits.storage_gb}GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Security Score</span>
                        <span className={`font-medium ${
                          org.security.riskScore >= 8 ? 'text-green-400' :
                          org.security.riskScore >= 6 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {org.security.riskScore}/10
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-text-muted">Next Billing</span>
                        <span className="text-text-primary">{org.billing.nextBilling.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-elite rounded-xl border border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
                </div>

                <div className="divide-y divide-border">
                  {activities.slice(0, 20).map((activity) => (
                    <div key={activity.id} className="p-6 hover:bg-dark-secondary/50">
                      <div className="flex items-start space-x-4">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          activity.status === 'success' ? 'bg-green-400' :
                          activity.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-text-primary">
                              {activity.action.replace(/\./g, ' ').replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-text-muted">
                              {activity.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm text-text-muted mt-1">
                            User: {activity.userId} • Resource: {activity.resource}
                          </p>
                          {activity.details && (
                            <p className="text-xs text-text-muted mt-1">
                              {JSON.stringify(activity.details)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {/* Security Overview */}
                <div className="glass-elite p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Security Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{securitySummary?.mfaEnabledUsers || 0}</div>
                      <div className="text-sm text-text-muted">MFA Enabled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{securitySummary?.suspendedUsers || 0}</div>
                      <div className="text-sm text-text-muted">Suspended Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{securitySummary?.recentSuspiciousActivity?.length || 0}</div>
                      <div className="text-sm text-text-muted">Security Alerts</div>
                    </div>
                  </div>
                </div>

                {/* Organization Risk Scores */}
                <div className="glass-elite p-6 rounded-xl border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Organization Risk Scores</h3>
                  <div className="space-y-3">
                    {securitySummary?.organizationRiskScores?.map((org: any) => (
                      <div key={org.id} className="flex items-center justify-between">
                        <span className="text-text-primary">{org.name}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-dark-tertiary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                org.riskScore >= 8 ? 'bg-green-400' :
                                org.riskScore >= 6 ? 'bg-yellow-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${org.riskScore * 10}%` }}
                            />
                          </div>
                          <span className="text-text-muted text-sm">{org.riskScore}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-elite p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Admin Settings</h3>
                <p className="text-text-muted">Admin settings functionality coming soon...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;