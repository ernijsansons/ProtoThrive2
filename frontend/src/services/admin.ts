/**
 * Admin User Management Service
 * Enterprise admin functionality for user and organization management
 * Ref: CLAUDE.md Phase 3 - Admin User Management
 */

import { SSOUser } from './sso';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'org_admin' | 'user_admin' | 'viewer';
  organization: {
    id: string;
    name: string;
    domain: string;
    plan: 'free' | 'pro' | 'enterprise';
  };
  permissions: AdminPermission[];
  status: 'active' | 'suspended' | 'pending';
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminPermission {
  id: string;
  resource: 'users' | 'organizations' | 'billing' | 'settings' | 'analytics' | 'security';
  actions: ('read' | 'write' | 'delete' | 'admin')[];
  scope: 'global' | 'organization' | 'team';
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'blocked';
  details?: Record<string, any>;
}

export interface OrganizationStats {
  id: string;
  name: string;
  userCount: number;
  activeUsers: number;
  planUsage: {
    plan: string;
    features: string[];
    limits: Record<string, number>;
    usage: Record<string, number>;
  };
  billing: {
    status: 'active' | 'past_due' | 'cancelled';
    nextBilling: Date;
    amount: number;
  };
  security: {
    mfaEnabled: boolean;
    ssoEnabled: boolean;
    lastSecurityAudit: Date;
    riskScore: number;
  };
}

class AdminUserService {
  private mockUsers: AdminUser[] = [];
  private mockActivities: UserActivity[] = [];
  private mockOrganizations: OrganizationStats[] = [];

  constructor() {
    this.initializeMockData();
    console.log('Thermonuclear Admin: Service initialized');
  }

  private initializeMockData() {
    // Mock admin users
    this.mockUsers = [
      {
        id: 'admin-1',
        email: 'admin@localhost.dev',
        name: 'Super Administrator',
        role: 'super_admin',
        organization: {
          id: 'org-protothrive',
          name: 'ProtoThrive Inc',
          domain: 'protothrive.com',
          plan: 'enterprise'
        },
        permissions: [
          {
            id: 'perm-1',
            resource: 'users',
            actions: ['read', 'write', 'delete', 'admin'],
            scope: 'global'
          },
          {
            id: 'perm-2',
            resource: 'organizations',
            actions: ['read', 'write', 'delete', 'admin'],
            scope: 'global'
          }
        ],
        status: 'active',
        lastLogin: new Date('2025-09-21T10:30:00Z'),
        createdAt: new Date('2025-01-15T00:00:00Z'),
        updatedAt: new Date('2025-09-21T10:30:00Z')
      },
      {
        id: 'admin-2',
        email: 'org.admin@techcorp.com',
        name: 'Organization Admin',
        role: 'org_admin',
        organization: {
          id: 'org-techcorp',
          name: 'Tech Corporation',
          domain: 'techcorp.com',
          plan: 'pro'
        },
        permissions: [
          {
            id: 'perm-3',
            resource: 'users',
            actions: ['read', 'write'],
            scope: 'organization'
          },
          {
            id: 'perm-4',
            resource: 'analytics',
            actions: ['read'],
            scope: 'organization'
          }
        ],
        status: 'active',
        lastLogin: new Date('2025-09-20T15:45:00Z'),
        createdAt: new Date('2025-03-10T00:00:00Z'),
        updatedAt: new Date('2025-09-20T15:45:00Z')
      }
    ];

    // Mock user activities
    this.mockActivities = [
      {
        id: 'activity-1',
        userId: 'admin-1',
        action: 'user.created',
        resource: 'users',
        timestamp: new Date('2025-09-21T10:30:00Z'),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        status: 'success',
        details: { targetUserId: 'user-123', email: 'newuser@example.com' }
      },
      {
        id: 'activity-2',
        userId: 'admin-2',
        action: 'organization.settings.updated',
        resource: 'organizations',
        timestamp: new Date('2025-09-21T09:15:00Z'),
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        status: 'success',
        details: { setting: 'sso_enabled', value: true }
      }
    ];

    // Mock organization stats
    this.mockOrganizations = [
      {
        id: 'org-protothrive',
        name: 'ProtoThrive Inc',
        userCount: 150,
        activeUsers: 142,
        planUsage: {
          plan: 'enterprise',
          features: ['sso', 'advanced_analytics', 'priority_support', 'custom_integrations'],
          limits: { users: 500, projects: 1000, storage_gb: 1000 },
          usage: { users: 150, projects: 234, storage_gb: 456 }
        },
        billing: {
          status: 'active',
          nextBilling: new Date('2025-10-01T00:00:00Z'),
          amount: 2999
        },
        security: {
          mfaEnabled: true,
          ssoEnabled: true,
          lastSecurityAudit: new Date('2025-09-01T00:00:00Z'),
          riskScore: 8.5
        }
      },
      {
        id: 'org-techcorp',
        name: 'Tech Corporation',
        userCount: 45,
        activeUsers: 38,
        planUsage: {
          plan: 'pro',
          features: ['analytics', 'team_collaboration', 'api_access'],
          limits: { users: 50, projects: 100, storage_gb: 100 },
          usage: { users: 45, projects: 67, storage_gb: 78 }
        },
        billing: {
          status: 'active',
          nextBilling: new Date('2025-09-25T00:00:00Z'),
          amount: 299
        },
        security: {
          mfaEnabled: false,
          ssoEnabled: true,
          lastSecurityAudit: new Date('2025-08-15T00:00:00Z'),
          riskScore: 6.2
        }
      }
    ];
  }

  // User Management
  async getUsers(filters?: {
    organizationId?: string;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<AdminUser[]> {
    console.log('Thermonuclear Admin: Getting users with filters', filters);

    let users = [...this.mockUsers];

    if (filters?.organizationId) {
      users = users.filter(u => u.organization.id === filters.organizationId);
    }

    if (filters?.role) {
      users = users.filter(u => u.role === filters.role);
    }

    if (filters?.status) {
      users = users.filter(u => u.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    return users;
  }

  async getUserById(id: string): Promise<AdminUser | null> {
    console.log(`Thermonuclear Admin: Getting user ${id}`);
    return this.mockUsers.find(u => u.id === id) || null;
  }

  async createUser(userData: Partial<AdminUser>): Promise<AdminUser> {
    console.log('Thermonuclear Admin: Creating user', userData.email);

    const newUser: AdminUser = {
      id: `admin-${Date.now()}`,
      email: userData.email || '',
      name: userData.name || '',
      role: userData.role || 'viewer',
      organization: userData.organization || this.mockUsers[0].organization,
      permissions: userData.permissions || [],
      status: 'pending',
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockUsers.push(newUser);

    // Log activity
    this.logActivity({
      userId: 'current-admin',
      action: 'user.created',
      resource: 'users',
      details: { targetUserId: newUser.id, email: newUser.email }
    });

    return newUser;
  }

  async updateUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser> {
    console.log(`Thermonuclear Admin: Updating user ${id}`, updates);

    const userIndex = this.mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User ${id} not found`);
    }

    this.mockUsers[userIndex] = {
      ...this.mockUsers[userIndex],
      ...updates,
      updatedAt: new Date()
    };

    this.logActivity({
      userId: 'current-admin',
      action: 'user.updated',
      resource: 'users',
      details: { targetUserId: id, updates }
    });

    return this.mockUsers[userIndex];
  }

  async deleteUser(id: string): Promise<boolean> {
    console.log(`Thermonuclear Admin: Deleting user ${id}`);

    const userIndex = this.mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error(`User ${id} not found`);
    }

    const deletedUser = this.mockUsers.splice(userIndex, 1)[0];

    this.logActivity({
      userId: 'current-admin',
      action: 'user.deleted',
      resource: 'users',
      details: { targetUserId: id, email: deletedUser.email }
    });

    return true;
  }

  // Activity Monitoring
  async getUserActivity(filters?: {
    userId?: string;
    action?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
  }): Promise<UserActivity[]> {
    console.log('Thermonuclear Admin: Getting user activity', filters);

    let activities = [...this.mockActivities];

    if (filters?.userId) {
      activities = activities.filter(a => a.userId === filters.userId);
    }

    if (filters?.action) {
      activities = activities.filter(a => a.action.includes(filters.action!));
    }

    if (filters?.timeRange) {
      activities = activities.filter(a =>
        a.timestamp >= filters.timeRange!.start &&
        a.timestamp <= filters.timeRange!.end
      );
    }

    if (filters?.limit) {
      activities = activities.slice(0, filters.limit);
    }

    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private logActivity(activity: Omit<UserActivity, 'id' | 'timestamp' | 'ipAddress' | 'userAgent' | 'status'>) {
    const newActivity: UserActivity = {
      id: `activity-${Date.now()}`,
      ...activity,
      timestamp: new Date(),
      ipAddress: '192.168.1.100', // Mock IP
      userAgent: 'ProtoThrive Admin Dashboard',
      status: 'success'
    };

    this.mockActivities.unshift(newActivity);
    console.log('Thermonuclear Admin: Activity logged', newActivity.action);
  }

  // Organization Management
  async getOrganizations(): Promise<OrganizationStats[]> {
    console.log('Thermonuclear Admin: Getting organization stats');
    return [...this.mockOrganizations];
  }

  async getOrganizationById(id: string): Promise<OrganizationStats | null> {
    console.log(`Thermonuclear Admin: Getting organization ${id}`);
    return this.mockOrganizations.find(o => o.id === id) || null;
  }

  async updateOrganization(id: string, updates: Partial<OrganizationStats>): Promise<OrganizationStats> {
    console.log(`Thermonuclear Admin: Updating organization ${id}`, updates);

    const orgIndex = this.mockOrganizations.findIndex(o => o.id === id);
    if (orgIndex === -1) {
      throw new Error(`Organization ${id} not found`);
    }

    this.mockOrganizations[orgIndex] = {
      ...this.mockOrganizations[orgIndex],
      ...updates
    };

    this.logActivity({
      userId: 'current-admin',
      action: 'organization.updated',
      resource: 'organizations',
      details: { organizationId: id, updates }
    });

    return this.mockOrganizations[orgIndex];
  }

  // Permission Management
  async getUserPermissions(userId: string): Promise<AdminPermission[]> {
    console.log(`Thermonuclear Admin: Getting permissions for user ${userId}`);
    const user = await this.getUserById(userId);
    return user?.permissions || [];
  }

  async updateUserPermissions(userId: string, permissions: AdminPermission[]): Promise<AdminUser> {
    console.log(`Thermonuclear Admin: Updating permissions for user ${userId}`);
    return this.updateUser(userId, { permissions });
  }

  // Security & Compliance
  async getSecuritySummary(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    mfaEnabledUsers: number;
    recentSuspiciousActivity: UserActivity[];
    organizationRiskScores: { id: string; name: string; riskScore: number }[];
  }> {
    console.log('Thermonuclear Admin: Getting security summary');

    const totalUsers = this.mockUsers.length;
    const activeUsers = this.mockUsers.filter(u => u.status === 'active').length;
    const suspendedUsers = this.mockUsers.filter(u => u.status === 'suspended').length;
    const mfaEnabledUsers = this.mockUsers.filter(u =>
      u.permissions.some(p => p.resource === 'security')
    ).length;

    const recentSuspiciousActivity = this.mockActivities
      .filter(a => a.status === 'failed' || a.action.includes('security'))
      .slice(0, 10);

    const organizationRiskScores = this.mockOrganizations.map(o => ({
      id: o.id,
      name: o.name,
      riskScore: o.security.riskScore
    }));

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      mfaEnabledUsers,
      recentSuspiciousActivity,
      organizationRiskScores
    };
  }
}

export const adminUserService = new AdminUserService();