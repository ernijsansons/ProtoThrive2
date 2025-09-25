// Ref: CLAUDE.md - Team Management Service for ProtoThrive
import { rateLimiter } from '../utils/security';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  joinedAt: string;
  lastActiveAt?: string;
  permissions: string[];
  departmentId?: string;
  title?: string;
  timezone?: string;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
  integrations: {
    github?: string;
    jira?: string;
    slack?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  workspaceId: string;
  ownerId: string;
  members: TeamMember[];
  settings: {
    visibility: 'private' | 'internal' | 'public';
    allowInvites: boolean;
    requireApproval: boolean;
    defaultRole: 'editor' | 'viewer';
    maxMembers?: number;
  };
  integrations: {
    github?: {
      organizationId: string;
      repositories: string[];
    };
    jira?: {
      projectKeys: string[];
      boardIds: number[];
    };
    slack?: {
      channelIds: string[];
      workspaceId: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  stats: {
    memberCount: number;
    activeMembers: number;
    roadmapsCount: number;
    collaborationScore: number;
  };
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatar?: string;
  ownerId: string;
  plan: 'free' | 'pro' | 'enterprise';
  billingEmail: string;
  domain?: string;
  teams: Team[];
  settings: {
    ssoEnabled: boolean;
    ssoProviders: string[];
    enforceSSO: boolean;
    allowTeamCreation: boolean;
    dataRetention: number; // days
    auditLogging: boolean;
    ipWhitelist?: string[];
    customBranding: {
      logo?: string;
      primaryColor?: string;
      accentColor?: string;
    };
  };
  limits: {
    maxTeams: number;
    maxMembers: number;
    maxStorage: number; // MB
    maxIntegrations: number;
  };
  usage: {
    teamsCount: number;
    membersCount: number;
    storageUsed: number; // MB
    integrationsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  managerId?: string;
  members: string[]; // member IDs
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  goals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  workspaceId?: string;
  teamId?: string;
  role: TeamMember['role'];
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface TeamActivity {
  id: string;
  type: 'member_added' | 'member_removed' | 'role_changed' | 'team_created' | 'team_updated' | 'roadmap_shared' | 'integration_added';
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  teamId: string;
  workspaceId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export class TeamService {
  private rateLimitCache = new Map<string, number>();

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Rate limiting
    const rateLimitKey = `team_api_${endpoint.split('/')[1] || 'general'}`;
    if (!rateLimiter.check(rateLimitKey, 1000, 3600)) {
      throw new Error('Team API rate limit exceeded');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      ...options.headers,
    };

    console.log(`Thermonuclear Team API Call: ${endpoint}`);

    // Mock mode for development
    if (process.env.NODE_ENV !== 'production') {
      return this.getMockResponse(endpoint, options) as T;
    }

    try {
      const response = await fetch(`/api/teams${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Team API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Team API request failed:', error);
      throw error;
    }
  }

  private getMockResponse(endpoint: string, options: RequestInit = {}): any {
    console.log(`Thermonuclear Team Mock: ${endpoint}`);

    if (endpoint.includes('/workspaces')) {
      if (options.method === 'POST') {
        return {
          id: 'ws-thermo-1',
          name: 'ProtoThrive Workspace',
          slug: 'protothrive',
          description: 'Thermonuclear workspace for innovation',
          ownerId: 'user-thermo-1',
          plan: 'enterprise',
          billingEmail: 'billing@protothrive.com',
          teams: [],
          settings: {
            ssoEnabled: true,
            ssoProviders: ['azure', 'google'],
            enforceSSO: false,
            allowTeamCreation: true,
            dataRetention: 90,
            auditLogging: true,
            customBranding: {
              primaryColor: '#00ffff',
              accentColor: '#ff6b35',
            },
          },
          limits: {
            maxTeams: 50,
            maxMembers: 500,
            maxStorage: 100000,
            maxIntegrations: 20,
          },
          usage: {
            teamsCount: 3,
            membersCount: 15,
            storageUsed: 2500,
            integrationsCount: 5,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return [{
        id: 'ws-thermo-1',
        name: 'ProtoThrive Workspace',
        slug: 'protothrive',
        description: 'Thermonuclear workspace for innovation',
        ownerId: 'user-thermo-1',
        plan: 'enterprise',
        teams: [],
        usage: { teamsCount: 3, membersCount: 15 },
        createdAt: new Date().toISOString(),
      }];
    }

    if (endpoint.includes('/teams')) {
      if (options.method === 'POST') {
        return {
          id: 'team-thermo-1',
          name: 'Frontend Team',
          description: 'Thermonuclear UI development team',
          workspaceId: 'ws-thermo-1',
          ownerId: 'user-thermo-1',
          members: [],
          settings: {
            visibility: 'internal',
            allowInvites: true,
            requireApproval: false,
            defaultRole: 'editor',
          },
          stats: {
            memberCount: 5,
            activeMembers: 4,
            roadmapsCount: 12,
            collaborationScore: 0.85,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return [{
        id: 'team-thermo-1',
        name: 'Frontend Team',
        description: 'Thermonuclear UI development team',
        workspaceId: 'ws-thermo-1',
        ownerId: 'user-thermo-1',
        members: [
          {
            id: 'user-thermo-1',
            email: 'lead@protothrive.com',
            name: 'Tech Lead',
            role: 'owner',
            status: 'active',
            joinedAt: new Date().toISOString(),
            permissions: ['all'],
            preferences: {
              notifications: true,
              emailUpdates: true,
              theme: 'dark',
              language: 'en',
            },
            integrations: {
              github: 'tech-lead',
              jira: 'tech.lead@company.com',
              slack: 'U12345',
            },
          },
          {
            id: 'user-thermo-2',
            email: 'dev@protothrive.com',
            name: 'Frontend Developer',
            role: 'editor',
            status: 'active',
            joinedAt: new Date().toISOString(),
            permissions: ['read', 'write'],
            preferences: {
              notifications: true,
              emailUpdates: false,
              theme: 'auto',
              language: 'en',
            },
            integrations: {
              github: 'frontend-dev',
              slack: 'U67890',
            },
          },
        ],
        settings: {
          visibility: 'internal',
          allowInvites: true,
          requireApproval: false,
          defaultRole: 'editor',
        },
        integrations: {
          github: {
            organizationId: 'protothrive',
            repositories: ['frontend', 'ui-components'],
          },
          jira: {
            projectKeys: ['PROTO'],
            boardIds: [123],
          },
          slack: {
            channelIds: ['C12345', 'C67890'],
            workspaceId: 'T12345',
          },
        },
        stats: {
          memberCount: 2,
          activeMembers: 2,
          roadmapsCount: 12,
          collaborationScore: 0.85,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
    }

    if (endpoint.includes('/members')) {
      return [{
        id: 'user-thermo-1',
        email: 'lead@protothrive.com',
        name: 'Tech Lead',
        role: 'owner',
        status: 'active',
        joinedAt: new Date().toISOString(),
        permissions: ['all'],
        preferences: {
          notifications: true,
          emailUpdates: true,
          theme: 'dark',
          language: 'en',
        },
      }];
    }

    return { success: true };
  }

  // Workspace operations
  async getWorkspaces(userId: string): Promise<Workspace[]> {
    return this.makeRequest('/workspaces');
  }

  async getWorkspace(workspaceId: string): Promise<Workspace> {
    return this.makeRequest(`/workspaces/${workspaceId}`);
  }

  async createWorkspace(data: {
    name: string;
    slug: string;
    description: string;
    plan: Workspace['plan'];
    billingEmail: string;
  }): Promise<Workspace> {
    return this.makeRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkspace(workspaceId: string, data: Partial<Workspace>): Promise<Workspace> {
    return this.makeRequest(`/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    await this.makeRequest(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
  }

  // Team operations
  async getTeams(workspaceId: string): Promise<Team[]> {
    return this.makeRequest(`/workspaces/${workspaceId}/teams`);
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.makeRequest(`/teams/${teamId}`);
  }

  async createTeam(workspaceId: string, data: {
    name: string;
    description: string;
    visibility: Team['settings']['visibility'];
    defaultRole: Team['settings']['defaultRole'];
  }): Promise<Team> {
    return this.makeRequest(`/workspaces/${workspaceId}/teams`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeam(teamId: string, data: Partial<Team>): Promise<Team> {
    return this.makeRequest(`/teams/${teamId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTeam(teamId: string): Promise<void> {
    await this.makeRequest(`/teams/${teamId}`, {
      method: 'DELETE',
    });
  }

  // Member operations
  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    return this.makeRequest(`/teams/${teamId}/members`);
  }

  async addTeamMember(teamId: string, data: {
    email: string;
    role: TeamMember['role'];
    departmentId?: string;
  }): Promise<TeamMember> {
    return this.makeRequest(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(teamId: string, memberId: string, data: {
    role?: TeamMember['role'];
    permissions?: string[];
    departmentId?: string;
  }): Promise<TeamMember> {
    return this.makeRequest(`/teams/${teamId}/members/${memberId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    await this.makeRequest(`/teams/${teamId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  // Invitation operations
  async createInvitation(data: {
    email: string;
    workspaceId?: string;
    teamId?: string;
    role: TeamMember['role'];
    message?: string;
  }): Promise<Invitation> {
    return this.makeRequest('/invitations', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }),
    });
  }

  async getInvitations(workspaceId?: string, teamId?: string): Promise<Invitation[]> {
    const params = new URLSearchParams();
    if (workspaceId) params.set('workspaceId', workspaceId);
    if (teamId) params.set('teamId', teamId);

    return this.makeRequest(`/invitations?${params}`);
  }

  async acceptInvitation(invitationId: string): Promise<void> {
    await this.makeRequest(`/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
  }

  async declineInvitation(invitationId: string): Promise<void> {
    await this.makeRequest(`/invitations/${invitationId}/decline`, {
      method: 'POST',
    });
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    await this.makeRequest(`/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  }

  // Department operations
  async getDepartments(workspaceId: string): Promise<Department[]> {
    return this.makeRequest(`/workspaces/${workspaceId}/departments`);
  }

  async createDepartment(workspaceId: string, data: {
    name: string;
    description: string;
    managerId?: string;
  }): Promise<Department> {
    return this.makeRequest(`/workspaces/${workspaceId}/departments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(departmentId: string, data: Partial<Department>): Promise<Department> {
    return this.makeRequest(`/departments/${departmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Activity tracking
  async getTeamActivity(teamId: string, limit: number = 50): Promise<TeamActivity[]> {
    return this.makeRequest(`/teams/${teamId}/activity?limit=${limit}`);
  }

  async getWorkspaceActivity(workspaceId: string, limit: number = 50): Promise<TeamActivity[]> {
    return this.makeRequest(`/workspaces/${workspaceId}/activity?limit=${limit}`);
  }

  // Integration management
  async updateTeamIntegrations(teamId: string, integrations: Team['integrations']): Promise<Team> {
    return this.makeRequest(`/teams/${teamId}/integrations`, {
      method: 'PUT',
      body: JSON.stringify(integrations),
    });
  }

  async syncTeamFromIntegration(teamId: string, integration: 'github' | 'jira' | 'slack', config: any): Promise<{
    membersAdded: number;
    membersUpdated: number;
    errors: string[];
  }> {
    return this.makeRequest(`/teams/${teamId}/sync/${integration}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Permission management
  async getAvailablePermissions(): Promise<{
    [role: string]: string[];
  }> {
    return this.makeRequest('/permissions');
  }

  async updateMemberPermissions(teamId: string, memberId: string, permissions: string[]): Promise<TeamMember> {
    return this.makeRequest(`/teams/${teamId}/members/${memberId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  // Bulk operations
  async bulkInviteMembers(teamId: string, invitations: Array<{
    email: string;
    role: TeamMember['role'];
    departmentId?: string;
  }>): Promise<{
    successful: Invitation[];
    failed: Array<{ email: string; error: string }>;
  }> {
    return this.makeRequest(`/teams/${teamId}/members/bulk-invite`, {
      method: 'POST',
      body: JSON.stringify({ invitations }),
    });
  }

  async bulkUpdateMembers(teamId: string, updates: Array<{
    memberId: string;
    role?: TeamMember['role'];
    permissions?: string[];
    status?: TeamMember['status'];
  }>): Promise<{
    successful: TeamMember[];
    failed: Array<{ memberId: string; error: string }>;
  }> {
    return this.makeRequest(`/teams/${teamId}/members/bulk-update`, {
      method: 'PUT',
      body: JSON.stringify({ updates }),
    });
  }

  // Analytics and insights
  async getTeamAnalytics(teamId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<{
    collaboration: {
      score: number;
      trend: number;
      activeMembers: number;
      roadmapsCreated: number;
      commentsCount: number;
    };
    productivity: {
      tasksCompleted: number;
      averageTaskTime: number;
      roadmapsCompleted: number;
      integrationUsage: Record<string, number>;
    };
    engagement: {
      dailyActiveUsers: number[];
      sessionDuration: number;
      featureUsage: Record<string, number>;
    };
  }> {
    return this.makeRequest(`/teams/${teamId}/analytics?period=${period}`);
  }

  async getWorkspaceAnalytics(workspaceId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<{
    teams: {
      total: number;
      active: number;
      averageSize: number;
    };
    members: {
      total: number;
      active: number;
      newJoins: number;
      churnRate: number;
    };
    usage: {
      storageUsed: number;
      storageLimit: number;
      apiCalls: number;
      integrations: number;
    };
    collaboration: {
      overallScore: number;
      topTeams: Array<{ teamId: string; name: string; score: number }>;
    };
  }> {
    return this.makeRequest(`/workspaces/${workspaceId}/analytics?period=${period}`);
  }

  // Rate limit status
  getRateLimitStatus(): { [key: string]: number } {
    return Object.fromEntries(this.rateLimitCache);
  }
}

// Export singleton instance
export const teamService = new TeamService();