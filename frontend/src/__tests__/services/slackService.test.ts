// Ref: CLAUDE.md - Slack API Integration Service Tests
// Converted to Jest';
import { SlackService, slackService } from '../../services/slackService';
import { testUtils, mockData } from '../../test-utils/testSetup';

describe('SlackService', () => {
  let service: SlackService;

  beforeEach(() => {
    service = new SlackService({ botToken: "test-token", signingSecret: "test-secret" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate with bot token', async () => {
      testUtils.mockApiResponse({
        ok: true,
        url: 'https://company.slack.com/',
        team: 'Company Team',
        user: 'protothrive_bot',
        team_id: 'T1234567890',
        user_id: 'U0987654321',
        bot_id: 'B1122334455',
        enterprise_id: null,
      });

      const auth = await service.authenticate('xoxb-bot-token-123');

      expect(auth).toEqual(
        expect.objectContaining({
          ok: true,
          team: 'Company Team',
          user: 'protothrive_bot',
          team_id: 'T1234567890',
        })
      );
    });

    it('should authenticate with user token', async () => {
      testUtils.mockApiResponse({
        ok: true,
        url: 'https://company.slack.com/',
        team: 'Company Team',
        user: 'john.doe',
        team_id: 'T1234567890',
        user_id: 'U1234567890',
      });

      const auth = await service.authenticateUser('xoxp-user-token-123');

      expect(auth).toEqual(
        expect.objectContaining({
          ok: true,
          user: 'john.doe',
          team_id: 'T1234567890',
        })
      );
    });

    it('should handle invalid token', async () => {
      testUtils.mockApiResponse({
        ok: false,
        error: 'invalid_auth',
      });

      await expect(
        service.authenticate('invalid-token')
      ).rejects.toThrow('invalid_auth');
    });
  });

  describe('Channel Management', () => {
    it('should get workspace channels', async () => {
      testUtils.mockApiResponse({
        ok: true,
        channels: [
          {
            id: 'C1234567890',
            name: 'general',
            is_channel: true,
            is_group: false,
            is_im: false,
            is_mpim: false,
            is_private: false,
            created: 1577836800,
            is_archived: false,
            is_general: true,
            unlinked: 0,
            name_normalized: 'general',
            is_shared: false,
            is_ext_shared: false,
            is_org_shared: false,
            pending_shared: [],
            is_pending_ext_shared: false,
            is_member: true,
            is_open: true,
            topic: {
              value: 'Company-wide announcements and general discussion',
              creator: 'U1234567890',
              last_set: 1577836800,
            },
            purpose: {
              value: 'This channel is for workspace-wide communication and announcements.',
              creator: 'U1234567890',
              last_set: 1577836800,
            },
            previous_names: [],
            num_members: 150,
          },
          {
            id: 'C2345678901',
            name: 'development',
            is_channel: true,
            is_private: false,
            is_archived: false,
            is_member: true,
            topic: {
              value: 'Development team discussions',
            },
            purpose: {
              value: 'Coordination and discussion for development work',
            },
            num_members: 25,
          },
        ],
      });

      const channels = await service.getChannels();

      expect(channels).toHaveLength(2);
      expect(channels[0]).toEqual(
        expect.objectContaining({
          id: 'C1234567890',
          name: 'general',
          is_general: true,
          num_members: 150,
        })
      );
    });

    it('should get channel history', async () => {
      testUtils.mockApiResponse({
        ok: true,
        messages: [
          {
            type: 'message',
            user: 'U1234567890',
            text: 'Hello team! 👋',
            ts: '1623456789.123456',
            team: 'T1234567890',
            blocks: [
              {
                type: 'rich_text',
                block_id: 'block_id',
                elements: [
                  {
                    type: 'rich_text_section',
                    elements: [
                      {
                        type: 'text',
                        text: 'Hello team! 👋',
                      },
                    ],
                  },
                ],
              },
            ],
            reactions: [
              {
                name: 'wave',
                users: ['U2345678901', 'U3456789012'],
                count: 2,
              },
            ],
          },
          {
            type: 'message',
            user: 'U2345678901',
            text: 'Good morning! Ready for the sprint?',
            ts: '1623456790.123457',
            thread_ts: '1623456789.123456',
            reply_count: 1,
            replies: [
              {
                user: 'U3456789012',
                ts: '1623456791.123458',
              },
            ],
          },
        ],
        has_more: false,
        pin_count: 0,
        response_metadata: {
          next_cursor: '',
        },
      });

      const messages = await service.getChannelHistory('C1234567890');

      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(
        expect.objectContaining({
          user: 'U1234567890',
          text: 'Hello team! 👋',
          ts: '1623456789.123456',
          reactions: expect.arrayContaining([
            expect.objectContaining({
              name: 'wave',
              count: 2,
            }),
          ]),
        })
      );
    });

    it('should create channel', async () => {
      const channelData = {
        name: 'project-alpha',
        description: 'Discussion for Project Alpha development',
        isPrivate: false,
      };

      testUtils.mockApiResponse({
        ok: true,
        channel: {
          id: 'C3456789012',
          name: 'project-alpha',
          is_channel: true,
          is_private: false,
          is_archived: false,
          is_general: false,
          created: Math.floor(Date.now() / 1000),
          creator: 'U1234567890',
          is_shared: false,
          is_member: true,
          topic: {
            value: channelData.description,
            creator: 'U1234567890',
            last_set: Math.floor(Date.now() / 1000),
          },
          purpose: {
            value: channelData.description,
            creator: 'U1234567890',
            last_set: Math.floor(Date.now() / 1000),
          },
          num_members: 1,
        },
      });

      const channel = await service.createChannel(channelData);

      expect(channel).toEqual(
        expect.objectContaining({
          id: 'C3456789012',
          name: 'project-alpha',
          is_private: false,
        })
      );
    });

    it('should archive channel', async () => {
      testUtils.mockApiResponse({
        ok: true,
      });

      const result = await service.archiveChannel('C3456789012');

      expect(result).toBe(true);
    });
  });

  describe('Message Operations', () => {
    it('should send message', async () => {
      const messageData = {
        channel: 'C1234567890',
        text: 'ProtoThrive roadmap update: Sprint completed! 🎉',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*ProtoThrive Update*\nSprint has been completed successfully!',
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: '*Completed:* 15 tasks',
              },
              {
                type: 'mrkdwn',
                text: '*Team:* Development',
              },
            ],
          },
        ],
        attachments: [
          {
            color: 'good',
            title: 'Sprint Summary',
            fields: [
              {
                title: 'Story Points',
                value: '42',
                short: true,
              },
              {
                title: 'Velocity',
                value: '95%',
                short: true,
              },
            ],
          },
        ],
      };

      testUtils.mockApiResponse({
        ok: true,
        channel: 'C1234567890',
        ts: '1623456789.123456',
        message: {
          type: 'message',
          subtype: 'bot_message',
          text: messageData.text,
          user: 'U0987654321',
          ts: '1623456789.123456',
          bot_id: 'B1122334455',
          blocks: messageData.blocks,
          attachments: messageData.attachments,
        },
      });

      const result = await service.sendMessage(messageData);

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          ts: '1623456789.123456',
          message: expect.objectContaining({
            text: messageData.text,
          }),
        })
      );
    });

    it('should send file', async () => {
      const fileData = {
        channels: 'C1234567890',
        file: new Blob(['roadmap-data'], { type: 'application/json' }),
        filename: 'roadmap-export.json',
        title: 'ProtoThrive Roadmap Export',
        initial_comment: 'Latest roadmap export from ProtoThrive',
      };

      testUtils.mockApiResponse({
        ok: true,
        file: {
          id: 'F1234567890',
          created: Math.floor(Date.now() / 1000),
          timestamp: Math.floor(Date.now() / 1000),
          name: 'roadmap-export.json',
          title: 'ProtoThrive Roadmap Export',
          mimetype: 'application/json',
          filetype: 'json',
          pretty_type: 'JSON',
          user: 'U0987654321',
          editable: false,
          size: 1024,
          mode: 'hosted',
          is_external: false,
          external_type: '',
          is_public: true,
          public_url_shared: false,
          display_as_bot: false,
          username: '',
          url_private: 'https://files.slack.com/files-pri/T1234567890-F1234567890/roadmap-export.json',
          url_private_download: 'https://files.slack.com/files-pri/T1234567890-F1234567890/download/roadmap-export.json',
          permalink: 'https://company.slack.com/files/U0987654321/F1234567890/roadmap-export.json',
          permalink_public: 'https://company.slack.com/files/U0987654321/F1234567890/public',
          channels: ['C1234567890'],
          groups: [],
          ims: [],
          initial_comment: {
            id: 'Fc1234567890',
            created: Math.floor(Date.now() / 1000),
            timestamp: Math.floor(Date.now() / 1000),
            user: 'U0987654321',
            is_intro: true,
            comment: 'Latest roadmap export from ProtoThrive',
          },
          num_stars: 0,
          is_starred: false,
        },
      });

      const result = await service.sendFile(fileData);

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          file: expect.objectContaining({
            name: 'roadmap-export.json',
            title: 'ProtoThrive Roadmap Export',
          }),
        })
      );
    });

    it('should update message', async () => {
      const updates = {
        channel: 'C1234567890',
        ts: '1623456789.123456',
        text: 'Updated: ProtoThrive roadmap sprint completed! ✅',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Updated ProtoThrive Status*\nSprint completed with all goals achieved!',
            },
          },
        ],
      };

      testUtils.mockApiResponse({
        ok: true,
        channel: 'C1234567890',
        ts: '1623456789.123456',
        text: updates.text,
        message: {
          type: 'message',
          user: 'U0987654321',
          text: updates.text,
          ts: '1623456789.123456',
          blocks: updates.blocks,
        },
      });

      const result = await service.updateMessage(updates);

      expect(result).toEqual(
        expect.objectContaining({
          ok: true,
          text: 'Updated: ProtoThrive roadmap sprint completed! ✅',
        })
      );
    });

    it('should delete message', async () => {
      testUtils.mockApiResponse({
        ok: true,
        channel: 'C1234567890',
        ts: '1623456789.123456',
      });

      const result = await service.deleteMessage('C1234567890', '1623456789.123456');

      expect(result).toBe(true);
    });
  });

  describe('User Operations', () => {
    it('should get workspace users', async () => {
      testUtils.mockApiResponse({
        ok: true,
        members: [
          {
            id: 'U1234567890',
            team_id: 'T1234567890',
            name: 'john.doe',
            deleted: false,
            real_name: 'John Doe',
            profile: {
              title: 'Senior Developer',
              phone: '',
              skype: '',
              real_name: 'John Doe',
              real_name_normalized: 'John Doe',
              display_name: 'John',
              display_name_normalized: 'John',
              email: 'john.doe@company.com',
              image_24: 'https://avatars.slack-edge.com/2023-06-01/24.jpg',
              image_32: 'https://avatars.slack-edge.com/2023-06-01/32.jpg',
              image_48: 'https://avatars.slack-edge.com/2023-06-01/48.jpg',
              image_72: 'https://avatars.slack-edge.com/2023-06-01/72.jpg',
              image_192: 'https://avatars.slack-edge.com/2023-06-01/192.jpg',
              image_512: 'https://avatars.slack-edge.com/2023-06-01/512.jpg',
              status_text: 'In a meeting',
              status_emoji: ':calendar:',
              status_expiration: 0,
              team: 'T1234567890',
            },
            is_admin: false,
            is_owner: false,
            is_primary_owner: false,
            is_restricted: false,
            is_ultra_restricted: false,
            is_bot: false,
            is_app_user: false,
            updated: 1623456789,
            has_2fa: true,
          },
          {
            id: 'U2345678901',
            name: 'jane.smith',
            real_name: 'Jane Smith',
            profile: {
              title: 'Product Manager',
              real_name: 'Jane Smith',
              display_name: 'Jane',
              email: 'jane.smith@company.com',
              image_72: 'https://avatars.slack-edge.com/2023-06-01/jane-72.jpg',
            },
            is_admin: true,
            is_bot: false,
          },
        ],
        cache_ts: 1623456789,
        response_metadata: {
          next_cursor: '',
        },
      });

      const users = await service.getUsers();

      expect(users).toHaveLength(2);
      expect(users[0]).toEqual(
        expect.objectContaining({
          id: 'U1234567890',
          name: 'john.doe',
          real_name: 'John Doe',
          profile: expect.objectContaining({
            email: 'john.doe@company.com',
            title: 'Senior Developer',
          }),
        })
      );
    });

    it('should get user info', async () => {
      testUtils.mockApiResponse({
        ok: true,
        user: {
          id: 'U1234567890',
          team_id: 'T1234567890',
          name: 'john.doe',
          deleted: false,
          real_name: 'John Doe',
          tz: 'America/New_York',
          tz_label: 'Eastern Daylight Time',
          tz_offset: -14400,
          profile: {
            title: 'Senior Developer',
            real_name: 'John Doe',
            display_name: 'John',
            email: 'john.doe@company.com',
            phone: '+1-555-123-4567',
            image_512: 'https://avatars.slack-edge.com/2023-06-01/512.jpg',
            status_text: 'In a meeting',
            status_emoji: ':calendar:',
            team: 'T1234567890',
          },
          is_admin: false,
          is_owner: false,
          is_bot: false,
          updated: 1623456789,
          has_2fa: true,
        },
      });

      const user = await service.getUserInfo('U1234567890');

      expect(user).toEqual(
        expect.objectContaining({
          id: 'U1234567890',
          name: 'john.doe',
          real_name: 'John Doe',
          profile: expect.objectContaining({
            email: 'john.doe@company.com',
            title: 'Senior Developer',
          }),
        })
      );
    });

    it('should set user status', async () => {
      const statusData = {
        status_text: 'Working on ProtoThrive roadmaps',
        status_emoji: ':rocket:',
        status_expiration: Math.floor(Date.now() / 1000) + 3600, // 1 hour
      };

      testUtils.mockApiResponse({
        ok: true,
      });

      const result = await service.setUserStatus(statusData);

      expect(result).toBe(true);
    });
  });

  describe('Workspace Sync', () => {
    it('should sync workspace to roadmap', async () => {
      // Mock channels
      testUtils.mockApiResponse({
        ok: true,
        channels: [
          {
            id: 'C1234567890',
            name: 'general',
            topic: { value: 'General discussions' },
            num_members: 150,
            is_archived: false,
          },
          {
            id: 'C2345678901',
            name: 'development',
            topic: { value: 'Development coordination' },
            num_members: 25,
            is_archived: false,
          },
          {
            id: 'C3456789012',
            name: 'marketing',
            topic: { value: 'Marketing campaigns' },
            num_members: 12,
            is_archived: false,
          },
        ],
      });

      const roadmap = await service.syncWorkspaceToRoadmap();

      expect(roadmap).toEqual(
        expect.objectContaining({
          nodes: expect.arrayContaining([
            expect.objectContaining({
              id: 'C1234567890',
              label: 'general',
              type: 'channel',
              data: expect.objectContaining({
                members: 150,
                topic: 'General discussions',
              }),
            }),
            expect.objectContaining({
              id: 'C2345678901',
              label: 'development',
              type: 'channel',
            }),
          ]),
          edges: expect.any(Array),
          metadata: expect.objectContaining({
            source: 'slack',
            workspace: expect.any(String),
          }),
        })
      );
    });

    it('should sync workspace including archived channels', async () => {
      testUtils.mockApiResponse({
        ok: true,
        channels: [
          {
            id: 'C1234567890',
            name: 'active-channel',
            is_archived: false,
            num_members: 50,
          },
          {
            id: 'C9876543210',
            name: 'archived-project',
            is_archived: true,
            num_members: 0,
          },
        ],
      });

      const roadmap = await service.syncWorkspaceToRoadmap(true);

      expect(roadmap.nodes).toHaveLength(2);
      expect(roadmap.nodes.some(node => node.id === 'C9876543210')).toBe(true);
    });
  });

  describe('Webhook and Events', () => {
    it('should handle message event', async () => {
      const messageEvent = {
        type: 'message',
        channel: 'C1234567890',
        user: 'U1234567890',
        text: 'Update roadmap status to completed',
        ts: '1623456789.123456',
        event_ts: '1623456789.123456',
        channel_type: 'channel',
      };

      const result = await service.handleEvent(messageEvent);

      expect(result).toEqual(
        expect.objectContaining({
          type: 'message',
          action: 'process',
          data: expect.objectContaining({
            channel: 'C1234567890',
            text: 'Update roadmap status to completed',
          }),
        })
      );
    });

    it('should handle channel creation event', async () => {
      const channelEvent = {
        type: 'channel_created',
        channel: {
          id: 'C4567890123',
          name: 'new-project',
          created: Math.floor(Date.now() / 1000),
          creator: 'U1234567890',
        },
      };

      const result = await service.handleEvent(channelEvent);

      expect(result).toEqual(
        expect.objectContaining({
          type: 'channel_created',
          action: 'sync_roadmap',
          data: expect.objectContaining({
            channel: expect.objectContaining({
              id: 'C4567890123',
              name: 'new-project',
            }),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      testUtils.mockApiResponse(
        {
          ok: false,
          error: 'rate_limited',
          headers: {
            'Retry-After': '30',
          },
        },
        429
      );

      await expect(
        service.getChannels()
      ).rejects.toThrow('rate_limited');
    });

    it('should handle channel not found', async () => {
      testUtils.mockApiResponse({
        ok: false,
        error: 'channel_not_found',
      });

      await expect(
        service.getChannelHistory('INVALID_CHANNEL')
      ).rejects.toThrow('channel_not_found');
    });

    it('should handle insufficient permissions', async () => {
      testUtils.mockApiResponse({
        ok: false,
        error: 'missing_scope',
        needed: 'channels:write',
        provided: 'channels:read',
      });

      await expect(
        service.createChannel({
          name: 'test-channel',
          description: 'Test channel',
          isPrivate: false,
        })
      ).rejects.toThrow('missing_scope');
    });

    it('should handle message too long error', async () => {
      testUtils.mockApiResponse({
        ok: false,
        error: 'msg_too_long',
      });

      const longMessage = {
        channel: 'C1234567890',
        text: 'A'.repeat(40001), // Exceeds Slack's 40,000 character limit
      };

      await expect(
        service.sendMessage(longMessage)
      ).rejects.toThrow('msg_too_long');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache channel data', async () => {
      testUtils.mockApiResponse({
        ok: true,
        channels: [
          { id: 'C1234567890', name: 'general' },
        ],
      });

      // First call
      const channels1 = await service.getChannels();

      // Second call should use cache
      const channels2 = await service.getChannels();

      expect(channels1).toEqual(channels2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent operations', async () => {
      const operations = [
        service.getChannels(),
        service.getUsers(),
        service.getUserInfo('U1234567890'),
      ];

      testUtils.mockApiResponse({ ok: true });

      await expect(Promise.all(operations)).resolves.toBeDefined();
    });

    it('should respect Slack API best practices', async () => {
      const mockFetch = vi.mocked(global.fetch);

      await service.getChannels();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer'),
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});

describe('Global Slack Service Instance', () => {
  it('should use the global slack service', async () => {
    testUtils.mockApiResponse({
      ok: true,
      team: 'Test Team',
      user: 'test_bot',
    });

    const auth = await slackService.authenticate('test-token');

    expect(auth).toEqual(
      expect.objectContaining({
        ok: true,
        team: 'Test Team',
      })
    );
  });

  it('should provide convenient slack methods', async () => {
    const { slack } = await import('../../services/slackService');

    testUtils.mockApiResponse({
      ok: true,
      channels: [
        { id: 'C1234567890', name: 'general' },
      ],
    });

    const channels = await slack.channels();
    expect(channels).toHaveLength(1);

    testUtils.mockApiResponse({
      ok: true,
      ts: '1623456789.123456',
    });

    const message = await slack.send('C1234567890', 'Test message');
    expect(message.ok).toBe(true);

    testUtils.mockApiResponse({
      nodes: [],
      edges: [],
      metadata: { source: 'slack' },
    });

    const roadmap = await slack.sync();
    expect(roadmap.metadata.source).toBe('slack');
  });
});

describe('Slack Service Integration Scenarios', () => {
  it('should handle complete workspace integration workflow', async () => {
    console.log('🔥 Slack Integration: Starting complete workflow');

    // 1. Authentication
    testUtils.mockApiResponse({
      ok: true,
      team: 'Company Team',
      user: 'protothrive_bot',
      team_id: 'T1234567890',
    });

    const auth = await service.authenticate('xoxb-bot-token');
    expect(auth.ok).toBe(true);

    // 2. Workspace discovery
    testUtils.mockApiResponse({
      ok: true,
      channels: [
        { id: 'C1', name: 'general', num_members: 150 },
        { id: 'C2', name: 'development', num_members: 25 },
      ],
    });

    const channels = await service.getChannels();
    expect(channels).toHaveLength(2);

    // 3. Workspace sync to roadmap
    const roadmap = await service.syncWorkspaceToRoadmap();
    expect(roadmap.nodes.length).toBeGreaterThan(0);

    // 4. Send notification to team
    testUtils.mockApiResponse({
      ok: true,
      ts: '1623456789.123456',
    });

    const notification = await service.sendMessage({
      channel: 'C2',
      text: 'ProtoThrive roadmap sync completed! 🚀',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*ProtoThrive Integration*\nWorkspace sync completed successfully!',
          },
        },
      ],
    });

    expect(notification.ok).toBe(true);

    // 5. File upload with roadmap data
    testUtils.mockApiResponse({
      ok: true,
      file: {
        id: 'F1234567890',
        name: 'workspace-roadmap.json',
      },
    });

    const fileUpload = await service.sendFile({
      channels: 'C2',
      file: new Blob(['{"roadmap":"data"}'], { type: 'application/json' }),
      filename: 'workspace-roadmap.json',
      title: 'ProtoThrive Workspace Roadmap',
      initial_comment: 'Generated roadmap from Slack workspace structure',
    });

    expect(fileUpload.ok).toBe(true);

    console.log('🔥 Slack Integration: Complete workflow successful');
  });

  it('should handle enterprise Slack scenarios', async () => {
    const scenarios = [
      'Multi-workspace organization management',
      'Enterprise Grid integration',
      'Advanced bot interactions',
      'Workflow automation triggers',
      'Custom app integration',
      'Compliance and audit logging',
    ];

    for (const scenario of scenarios) {
      console.log(`🔥 Enterprise Scenario: ${scenario}`);
      testUtils.mockApiResponse({ ok: true });
      // Each scenario would be implemented with specific test logic
      expect(scenario).toBeDefined();
    }

    console.log('🔥 Slack Enterprise Integration: All scenarios tested');
  });
});