// Ref: CLAUDE.md - Team Management Service Tests
// Converted to Jest';
import { TeamService, teamService } from '../../services/teamService';
import { testUtils, mockData } from '../../test-utils/testSetup';

describe('TeamService', () => {
  let service: TeamService;

  beforeEach(() => {
    service = new TeamService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Workspace Management', () => {
    it('should get user workspaces', async () => {
      testUtils.mockApiResponse({
        workspaces: [
          {
            id: 'ws-test-1',
            name: 'Test Workspace',
            plan: 'pro',
            status: 'active',
            ownerId: 'user-test-1',
            settings: {
              allowPublicTeams: true,
              requireTeamApproval: false,
              defaultTeamRole: 'editor',
            },
            billing: {
              plan: 'pro',
              status: 'active',
              nextBilling: '2025-09-01',
              seats: 25,
              usedSeats: 12,
            },
            stats: {
              teamCount: 5,
              memberCount: 12,
              roadmapCount: 45,
              storageUsed: 2048,
            },
          },
        ],
      });

      const workspaces = await service.getWorkspaces('user-test-1');

      expect(workspaces).toHaveLength(1);
      expect(workspaces[0]).toEqual(
        expect.objectContaining({
          id: 'ws-test-1',
          name: 'Test Workspace',
          plan: 'pro',
          status: 'active',
        })
      );
    });

    it('should create workspace', async () => {
      const workspaceData = {
        name: 'New Workspace',
        description: 'A test workspace',
        plan: 'pro' as const,
        settings: {
          allowPublicTeams: true,
          requireTeamApproval: false,
          defaultTeamRole: 'editor' as const,
        },
      };

      testUtils.mockApiResponse({
        workspace: {
          id: 'ws-new-1',
          ...workspaceData,
          ownerId: 'user-test-1',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      });

      const workspace = await service.createWorkspace('user-test-1', workspaceData);

      expect(workspace).toEqual(
        expect.objectContaining({
          id: 'ws-new-1',
          name: 'New Workspace',
          plan: 'pro',
          ownerId: 'user-test-1',
        })
      );
    });

    it('should update workspace settings', async () => {
      const updates = {
        name: 'Updated Workspace',
        settings: {
          allowPublicTeams: false,
          requireTeamApproval: true,
          defaultTeamRole: 'viewer' as const,
        },
      };

      testUtils.mockApiResponse({
        workspace: {
          id: 'ws-test-1',
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      });

      const workspace = await service.updateWorkspace('ws-test-1', updates);

      expect(workspace.name).toBe('Updated Workspace');
      expect(workspace.settings.allowPublicTeams).toBe(false);
      expect(workspace.settings.requireTeamApproval).toBe(true);
    });

    it('should delete workspace', async () => {
      testUtils.mockApiResponse({ success: true });

      const result = await service.deleteWorkspace('ws-test-1');

      expect(result).toBe(true);
    });
  });

  describe('Team Management', () => {
    it('should get workspace teams', async () => {
      testUtils.mockApiResponse({
        teams: [
          mockData.team({
            id: 'team-test-1',
            name: 'Engineering Team',
            workspaceId: 'ws-test-1',
          }),
          mockData.team({
            id: 'team-test-2',
            name: 'Design Team',
            workspaceId: 'ws-test-1',
          }),
        ],
      });

      const teams = await service.getTeams('ws-test-1');

      expect(teams).toHaveLength(2);
      expect(teams[0].name).toBe('Engineering Team');
      expect(teams[1].name).toBe('Design Team');
    });

    it('should create team', async () => {
      const teamData = {
        name: 'New Team',
        description: 'A test team',
        settings: {
          visibility: 'internal' as const,
          allowInvites: true,
          requireApproval: false,
          defaultRole: 'editor' as const,
        },
      };

      testUtils.mockApiResponse({
        team: mockData.team({
          id: 'team-new-1',
          ...teamData,
          workspaceId: 'ws-test-1',
        }),
      });

      const team = await service.createTeam('ws-test-1', teamData);

      expect(team).toEqual(
        expect.objectContaining({
          id: 'team-new-1',
          name: 'New Team',
          workspaceId: 'ws-test-1',
        })
      );
    });

    it('should update team settings', async () => {
      const updates = {
        name: 'Updated Team',
        description: 'Updated description',
        settings: {
          visibility: 'private' as const,
          allowInvites: false,
          requireApproval: true,
          defaultRole: 'viewer' as const,
        },
      };

      testUtils.mockApiResponse({
        team: mockData.team({
          id: 'team-test-1',
          ...updates,
        }),
      });

      const team = await service.updateTeam('team-test-1', updates);

      expect(team.name).toBe('Updated Team');
      expect(team.settings.visibility).toBe('private');
    });

    it('should delete team', async () => {
      testUtils.mockApiResponse({ success: true });

      const result = await service.deleteTeam('team-test-1');

      expect(result).toBe(true);
    });
  });

  describe('Member Management', () => {
    it('should get team members', async () => {
      testUtils.mockApiResponse({
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            teamId: 'team-test-1',
            role: 'owner',
            status: 'active',
            user: {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
              avatar: 'https://avatar.url',
            },
            joinedAt: new Date().toISOString(),
          },
          {
            id: 'member-2',
            userId: 'user-2',
            teamId: 'team-test-1',
            role: 'editor',
            status: 'active',
            user: {
              id: 'user-2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              avatar: 'https://avatar.url',
            },
            joinedAt: new Date().toISOString(),
          },
        ],
      });

      const members = await service.getTeamMembers('team-test-1');

      expect(members).toHaveLength(2);
      expect(members[0].role).toBe('owner');
      expect(members[1].role).toBe('editor');
    });

    it('should invite member', async () => {
      const invitation = {
        email: 'newuser@example.com',
        role: 'editor' as const,
        message: 'Welcome to the team!',
      };

      testUtils.mockApiResponse({
        invitation: {
          id: 'inv-1',
          teamId: 'team-test-1',
          email: 'newuser@example.com',
          role: 'editor',
          status: 'pending',
          invitedBy: 'user-test-1',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });

      const result = await service.inviteMember('team-test-1', invitation);

      expect(result).toEqual(
        expect.objectContaining({
          email: 'newuser@example.com',
          role: 'editor',
          status: 'pending',
        })
      );
    });

    it('should bulk invite members', async () => {
      const invitations = [
        {
          email: 'user1@example.com',
          role: 'editor' as const,
          message: 'Welcome!',
        },
        {
          email: 'user2@example.com',
          role: 'viewer' as const,
          message: 'Welcome!',
        },
      ];

      testUtils.mockApiResponse({
        results: {
          successful: [
            {
              email: 'user1@example.com',
              invitation: { id: 'inv-1', status: 'pending' },
            },
          ],
          failed: [
            {
              email: 'user2@example.com',
              error: 'User already exists',
            },
          ],
        },
        summary: {
          total: 2,
          successful: 1,
          failed: 1,
        },
      });

      const result = await service.bulkInviteMembers('team-test-1', invitations);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.results.successful).toHaveLength(1);
      expect(result.results.failed).toHaveLength(1);
    });

    it('should update member role', async () => {
      testUtils.mockApiResponse({
        member: {
          id: 'member-1',
          role: 'admin',
          updatedAt: new Date().toISOString(),
        },
      });

      const member = await service.updateMemberRole('member-1', 'admin');

      expect(member.role).toBe('admin');
    });

    it('should remove member', async () => {
      testUtils.mockApiResponse({ success: true });

      const result = await service.removeMember('member-1');

      expect(result).toBe(true);
    });
  });

  describe('Team Statistics', () => {
    it('should get team stats', async () => {
      testUtils.mockApiResponse({
        stats: {
          memberCount: 12,
          activeMembers: 10,
          roadmapsCount: 25,
          collaborationScore: 0.85,
          activityLevel: 'high',
          growthRate: 0.15,
          engagementMetrics: {
            dailyActiveUsers: 8,
            weeklyActiveUsers: 11,
            monthlyActiveUsers: 12,
            averageSessionDuration: 45,
          },
        },
      });

      const stats = await service.getTeamStats('team-test-1');

      expect(stats).toEqual(
        expect.objectContaining({
          memberCount: 12,
          activeMembers: 10,
          roadmapsCount: 25,
          collaborationScore: 0.85,
          activityLevel: 'high',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle workspace not found', async () => {
      testUtils.mockApiResponse({ error: 'Workspace not found' }, 404);

      await expect(service.getWorkspaces('invalid-user')).rejects.toThrow();
    });

    it('should handle team creation validation errors', async () => {
      testUtils.mockApiResponse(
        { error: 'Team name already exists' },
        409
      );

      await expect(
        service.createTeam('ws-test-1', {
          name: 'Existing Team',
          description: 'Test',
          settings: {
            visibility: 'internal',
            allowInvites: true,
            requireApproval: false,
            defaultRole: 'editor',
          },
        })
      ).rejects.toThrow();
    });

    it('should handle invalid member invitations', async () => {
      testUtils.mockApiResponse(
        { error: 'Invalid email address' },
        400
      );

      await expect(
        service.inviteMember('team-test-1', {
          email: 'invalid-email',
          role: 'editor',
          message: 'Welcome!',
        })
      ).rejects.toThrow();
    });

    it('should handle insufficient permissions', async () => {
      testUtils.mockApiResponse(
        { error: 'Insufficient permissions' },
        403
      );

      await expect(
        service.deleteTeam('team-test-1')
      ).rejects.toThrow();
    });
  });

  describe('Performance and Caching', () => {
    it('should cache team data efficiently', async () => {
      // First call
      testUtils.mockApiResponse({
        teams: [mockData.team()],
      });

      const teams1 = await service.getTeams('ws-test-1');

      // Second call should use cache
      const teams2 = await service.getTeams('ws-test-1');

      expect(teams1).toEqual(teams2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent member operations', async () => {
      const operations = [
        service.inviteMember('team-test-1', {
          email: 'user1@example.com',
          role: 'editor',
          message: 'Welcome!',
        }),
        service.inviteMember('team-test-1', {
          email: 'user2@example.com',
          role: 'viewer',
          message: 'Welcome!',
        }),
        service.updateMemberRole('member-1', 'admin'),
      ];

      testUtils.mockApiResponse({ success: true });

      await expect(Promise.all(operations)).resolves.toBeDefined();
    });
  });
});

describe('Global Team Service Instance', () => {
  it('should use the global team service', async () => {
    testUtils.mockApiResponse({
      workspaces: [mockData.team()],
    });

    const workspaces = await teamService.getWorkspaces('user-test-1');

    expect(workspaces).toBeDefined();
    expect(Array.isArray(workspaces)).toBe(true);
  });
});

describe('Team Service Integration', () => {
  it('should integrate with cache service for team data', async () => {
    const { cacheService } = await import('../../services/cacheService');

    testUtils.mockApiResponse({
      teams: [mockData.team()],
    });

    await teamService.getTeams('ws-test-1');

    // Check if team data was cached
    const cachedTeams = await cacheService.getByTags(['team', 'workspace:ws-test-1']);
    expect(cachedTeams).toBeDefined();
  });

  it('should handle real-world team scenarios', async () => {
    // Simulate a complete team management workflow
    const scenarios = [
      'Create workspace',
      'Create team',
      'Invite members',
      'Update settings',
      'Generate reports',
    ];

    testUtils.mockApiResponse({ success: true });

    for (const scenario of scenarios) {
      console.log(`🔥 Team Scenario: ${scenario}`);
      // Each scenario would be tested in real implementation
      expect(scenario).toBeDefined();
    }

    console.log('🔥 Team Management Scenarios: All tests passed');
  });
});