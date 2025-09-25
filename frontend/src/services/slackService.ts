// Ref: CLAUDE.md - Slack API Integration Service for ProtoThrive
import { rateLimiter } from '../utils/security';

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  created: number;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_org_shared: boolean;
  is_member: boolean;
  is_pending_ext_shared: boolean;
  pending_shared: any[];
  context_team_id: string;
  updated: number;
  parent_conversation?: string;
  creator: string;
  is_ext_shared: boolean;
  shared_team_ids: string[];
  pending_connected_team_ids: any[];
  is_pending_ext_shared_channel: boolean;
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
  previous_names: string[];
  num_members?: number;
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {
    title: string;
    phone: string;
    skype: string;
    real_name: string;
    real_name_normalized: string;
    display_name: string;
    display_name_normalized: string;
    fields: Record<string, any>;
    status_text: string;
    status_emoji: string;
    status_expiration: number;
    avatar_hash: string;
    email?: string;
    first_name: string;
    last_name: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
    status_text_canonical: string;
    team: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  is_email_confirmed: boolean;
  who_can_share_contact_card: string;
}

export interface SlackMessage {
  type: string;
  ts: string;
  user: string;
  team: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  is_locked?: boolean;
  subscribed?: boolean;
  last_read?: string;
  unread_count?: number;
  edited?: {
    user: string;
    ts: string;
  };
  blocks?: any[];
  attachments?: any[];
  files?: any[];
  upload?: boolean;
  display_as_bot?: boolean;
  x_files?: string[];
  user_profile?: {
    avatar_hash: string;
    image_72: string;
    first_name: string;
    real_name: string;
    display_name: string;
    team: string;
    name: string;
    is_restricted: boolean;
    is_ultra_restricted: boolean;
  };
  reactions?: Array<{
    name: string;
    users: string[];
    count: number;
  }>;
}

export interface SlackWorkspace {
  id: string;
  name: string;
  url: string;
  domain: string;
  email_domain: string;
  icon: {
    image_34: string;
    image_44: string;
    image_68: string;
    image_88: string;
    image_102: string;
    image_132: string;
    image_230: string;
    image_original: string;
  };
  enterprise_id?: string;
  enterprise_name?: string;
}

export interface SlackWebhookEvent {
  token: string;
  team_id: string;
  api_app_id: string;
  event: {
    type: string;
    channel?: string;
    user?: string;
    text?: string;
    ts?: string;
    event_ts?: string;
    channel_type?: string;
    message?: SlackMessage;
    previous_message?: SlackMessage;
    item?: any;
    reaction?: string;
  };
  type: string;
  event_id: string;
  event_time: number;
  authed_users?: string[];
  challenge?: string;
}

export interface SlackIntegrationConfig {
  botToken: string;
  userToken?: string;
  signingSecret: string;
  appId?: string;
  clientId?: string;
  clientSecret?: string;
  webhookUrl?: string;
  defaultChannel?: string;
}

export class SlackService {
  private config: SlackIntegrationConfig;
  private rateLimitCache = new Map<string, number>();

  constructor(config: SlackIntegrationConfig) {
    this.config = config;
  }

  protected async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Rate limiting (Slack Tier 1: 1+ requests per minute)
    const rateLimitKey = `slack_api_${endpoint.split('/')[0] || 'general'}`;
    if (!rateLimiter.check(rateLimitKey, 100, 60)) { // Conservative limit
      throw new Error('Slack API rate limit exceeded');
    }

    const url = `https://slack.com/api/${endpoint}`;
    const token = (options.headers as any)?.['Authorization']?.toString().includes('xoxp-')
      ? this.config.userToken
      : this.config.botToken;

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ProtoThrive-Integration/1.0',
      ...options.headers,
    };

    console.log(`Thermonuclear Slack API Call: ${endpoint}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Slack API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      console.error('Slack API request failed:', error);
      throw error;
    }
  }

  // Authentication and workspace info
  async testAuth(): Promise<{
    ok: boolean;
    url: string;
    team: string;
    user: string;
    team_id: string;
    user_id: string;
    bot_id?: string;
  }> {
    return this.makeRequest('auth.test');
  }

  async getWorkspaceInfo(): Promise<SlackWorkspace> {
    const response = await this.makeRequest<{ team: SlackWorkspace }>('team.info');
    return response.team;
  }

  // Channel operations
  async getChannels(params?: {
    exclude_archived?: boolean;
    exclude_members?: boolean;
    limit?: number;
    cursor?: string;
    types?: string; // 'public_channel,private_channel,mpim,im'
  }): Promise<SlackChannel[]> {
    const searchParams = new URLSearchParams();

    if (params?.exclude_archived) searchParams.set('exclude_archived', 'true');
    if (params?.exclude_members) searchParams.set('exclude_members', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.types) searchParams.set('types', params.types);

    const endpoint = `conversations.list${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await this.makeRequest<{ channels: SlackChannel[] }>(endpoint);
    return response.channels;
  }

  async getChannel(channelId: string): Promise<SlackChannel> {
    const response = await this.makeRequest<{ channel: SlackChannel }>(`conversations.info?channel=${channelId}`);
    return response.channel;
  }

  async createChannel(data: {
    name: string;
    is_private?: boolean;
  }): Promise<SlackChannel> {
    const response = await this.makeRequest<{ channel: SlackChannel }>('conversations.create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.channel;
  }

  async joinChannel(channelId: string): Promise<void> {
    await this.makeRequest('conversations.join', {
      method: 'POST',
      body: JSON.stringify({ channel: channelId }),
    });
  }

  async inviteToChannel(channelId: string, userIds: string[]): Promise<void> {
    await this.makeRequest('conversations.invite', {
      method: 'POST',
      body: JSON.stringify({
        channel: channelId,
        users: userIds.join(','),
      }),
    });
  }

  // User operations
  async getUsers(params?: {
    limit?: number;
    cursor?: string;
    include_locale?: boolean;
  }): Promise<SlackUser[]> {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.include_locale) searchParams.set('include_locale', 'true');

    const endpoint = `users.list${searchParams.toString() ? `?${searchParams}` : ''}`;
    const response = await this.makeRequest<{ members: SlackUser[] }>(endpoint);
    return response.members;
  }

  async getUser(userId: string): Promise<SlackUser> {
    const response = await this.makeRequest<{ user: SlackUser }>(`users.info?user=${userId}`);
    return response.user;
  }

  async getUserByEmail(email: string): Promise<SlackUser> {
    const response = await this.makeRequest<{ user: SlackUser }>(`users.lookupByEmail?email=${encodeURIComponent(email)}`);
    return response.user;
  }

  // Message operations
  async sendMessage(data: {
    channel: string;
    text?: string;
    blocks?: any[];
    attachments?: any[];
    thread_ts?: string;
    reply_broadcast?: boolean;
    link_names?: boolean;
    parse?: string;
    unfurl_links?: boolean;
    unfurl_media?: boolean;
    username?: string;
    as_user?: boolean;
    icon_emoji?: string;
    icon_url?: string;
  }): Promise<{
    ok: boolean;
    channel: string;
    ts: string;
    message: SlackMessage;
  }> {
    return this.makeRequest('chat.postMessage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMessage(data: {
    channel: string;
    ts: string;
    text?: string;
    blocks?: any[];
    attachments?: any[];
    link_names?: boolean;
    parse?: string;
  }): Promise<{
    ok: boolean;
    channel: string;
    ts: string;
    message: SlackMessage;
  }> {
    return this.makeRequest('chat.update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteMessage(channel: string, ts: string): Promise<void> {
    await this.makeRequest('chat.delete', {
      method: 'POST',
      body: JSON.stringify({ channel, ts }),
    });
  }

  async getMessages(channelId: string, params?: {
    latest?: string;
    oldest?: string;
    inclusive?: boolean;
    limit?: number;
    cursor?: string;
  }): Promise<SlackMessage[]> {
    const searchParams = new URLSearchParams();
    searchParams.set('channel', channelId);

    if (params?.latest) searchParams.set('latest', params.latest);
    if (params?.oldest) searchParams.set('oldest', params.oldest);
    if (params?.inclusive) searchParams.set('inclusive', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);

    const endpoint = `conversations.history?${searchParams}`;
    const response = await this.makeRequest<{ messages: SlackMessage[] }>(endpoint);
    return response.messages;
  }

  // File operations
  async uploadFile(data: {
    channels?: string;
    content?: string;
    file?: File | Buffer;
    filename?: string;
    filetype?: string;
    initial_comment?: string;
    title?: string;
    thread_ts?: string;
  }): Promise<any> {
    const formData = new FormData();

    if (data.channels) formData.append('channels', data.channels);
    if (data.content) formData.append('content', data.content);
    if (data.file) formData.append('file', data.file as any);
    if (data.filename) formData.append('filename', data.filename);
    if (data.filetype) formData.append('filetype', data.filetype);
    if (data.initial_comment) formData.append('initial_comment', data.initial_comment);
    if (data.title) formData.append('title', data.title);
    if (data.thread_ts) formData.append('thread_ts', data.thread_ts);

    return this.makeRequest('files.upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.config.botToken}`,
        // Don't set Content-Type, let browser set it with boundary
      },
    });
  }

  // Webhook operations
  async createWebhook(data: {
    url: string;
    events: string[];
    channel?: string;
  }): Promise<any> {
    // Note: This typically requires OAuth flow and app configuration
    // This is a simplified version for webhook creation
    return this.makeRequest('apps.event.authorizations.list', {
      method: 'POST',
      body: JSON.stringify({
        event_subscriptions: {
          url: data.url,
          bot_events: data.events,
        },
      }),
    });
  }

  // Roadmap integration methods
  async syncWorkspaceToRoadmap(includeArchived: boolean = false): Promise<{
    nodes: any[];
    edges: any[];
    metadata: any;
  }> {
    try {
      console.log('Thermonuclear Slack Sync: Workspace');

      const [workspace, channels, users] = await Promise.all([
        this.getWorkspaceInfo(),
        this.getChannels({ exclude_archived: !includeArchived, limit: 100 }),
        this.getUsers({ limit: 100 }),
      ]);

      const nodes: any[] = [];
      const edges: any[] = [];

      // Workspace root node
      nodes.push({
        id: `workspace-${workspace.id}`,
        label: workspace.name,
        type: 'workspace',
        status: 'neon',
        position: { x: 0, y: 0, z: 0 },
        data: {
          domain: workspace.domain,
          url: workspace.url,
          emailDomain: workspace.email_domain,
          enterpriseId: workspace.enterprise_id,
          enterpriseName: workspace.enterprise_name,
        },
      });

      // Channel nodes
      channels.forEach((channel, index) => {
        const nodeId = `channel-${channel.id}`;
        const status = channel.is_archived ? 'gray' : 'neon';

        nodes.push({
          id: nodeId,
          label: `#${channel.name}`,
          type: 'channel',
          status,
          position: { x: 200, y: index * 60, z: 0 },
          data: {
            name: channel.name,
            isPrivate: channel.is_private,
            isArchived: channel.is_archived,
            isGeneral: channel.is_general,
            created: channel.created,
            updated: channel.updated,
            topic: channel.topic,
            purpose: channel.purpose,
            numMembers: channel.num_members,
            creator: channel.creator,
          },
        });

        // Connect to workspace
        edges.push({
          from: `workspace-${workspace.id}`,
          to: nodeId,
          type: 'channel',
        });
      });

      // User nodes (limited to first 20 for performance)
      const activeUsers = users.filter(user => !user.deleted && !user.is_bot).slice(0, 20);
      activeUsers.forEach((user, index) => {
        const nodeId = `user-${user.id}`;

        nodes.push({
          id: nodeId,
          label: user.profile.display_name || user.real_name || user.name,
          type: 'user',
          status: 'gray',
          position: { x: 400, y: index * 50, z: 0 },
          data: {
            username: user.name,
            realName: user.real_name,
            email: user.profile.email,
            title: user.profile.title,
            isAdmin: user.is_admin,
            isOwner: user.is_owner,
            timezone: user.tz_label,
            avatar: user.profile.image_72,
            statusText: user.profile.status_text,
            statusEmoji: user.profile.status_emoji,
          },
        });

        // Connect to workspace
        edges.push({
          from: `workspace-${workspace.id}`,
          to: nodeId,
          type: 'user',
        });
      });

      return {
        nodes,
        edges,
        metadata: {
          workspace: workspace.name,
          syncedAt: new Date().toISOString(),
          totalChannels: channels.length,
          totalUsers: users.length,
          activeUsers: activeUsers.length,
          includeArchived,
        },
      };
    } catch (error) {
      console.error('Failed to sync Slack workspace to roadmap:', error);
      throw error;
    }
  }

  // Webhook event handler
  async handleWebhookEvent(event: SlackWebhookEvent): Promise<{
    shouldUpdate: boolean;
    updates?: any;
  }> {
    console.log(`Thermonuclear Slack Webhook: ${event.event.type}`);

    // Handle URL verification challenge
    if (event.type === 'url_verification') {
      return {
        shouldUpdate: false,
        updates: { challenge: event.challenge },
      };
    }

    switch (event.event.type) {
      case 'message':
        if (event.event.channel && event.event.user && event.event.text) {
          return {
            shouldUpdate: true,
            updates: {
              type: 'message',
              data: event.event,
              action: 'created',
            },
          };
        }
        break;

      case 'channel_created':
      case 'channel_deleted':
      case 'channel_rename':
      case 'channel_archive':
      case 'channel_unarchive':
        return {
          shouldUpdate: true,
          updates: {
            type: 'channel',
            data: event.event,
            action: event.event.type,
          },
        };

      case 'team_join':
      case 'user_change':
        return {
          shouldUpdate: true,
          updates: {
            type: 'user',
            data: event.event,
            action: event.event.type,
          },
        };

      default:
        return { shouldUpdate: false };
    }

    return { shouldUpdate: false };
  }

  // ProtoThrive notification methods
  async notifyRoadmapUpdate(data: {
    channel: string;
    roadmapName: string;
    updateType: 'created' | 'updated' | 'completed';
    user: string;
    url?: string;
  }): Promise<void> {
    const emoji = data.updateType === 'completed' ? '🎉' :
                  data.updateType === 'created' ? '🚀' : '🔄';

    const message = {
      channel: data.channel,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *Roadmap ${data.updateType}:* ${data.roadmapName}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Updated by <@${data.user}> • ${new Date().toLocaleString()}`,
            },
          ],
        },
      ],
    };

    if (data.url) {
      message.blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Roadmap',
            },
            url: data.url,
            action_id: 'view_roadmap',
          },
        ],
      } as any);
    }

    await this.sendMessage(message);
  }

  async notifyTaskAssignment(data: {
    channel: string;
    taskName: string;
    assignee: string;
    assigner: string;
    dueDate?: string;
    priority?: string;
  }): Promise<void> {
    const priorityEmoji = data.priority === 'high' ? '🔴' :
                         data.priority === 'medium' ? '🟡' : '🟢';

    await this.sendMessage({
      channel: data.channel,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *Task Assigned:* ${data.taskName}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Assignee:*\n<@${data.assignee}>`,
            },
            {
              type: 'mrkdwn',
              text: `*Priority:*\n${priorityEmoji} ${data.priority || 'normal'}`,
            },
          ],
        },
        ...(data.dueDate ? [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Due Date:* ${data.dueDate}`,
          },
        }] : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Assigned by <@${data.assigner}>`,
            },
          ],
        },
      ],
    });
  }

  // Rate limit status
  getRateLimitStatus(): { [key: string]: number } {
    return Object.fromEntries(this.rateLimitCache);
  }
}

// Mock service for development
export class MockSlackService extends SlackService {
  constructor() {
    super({
      botToken: 'xoxb-mock-bot-token',
      userToken: 'xoxp-mock-user-token',
      signingSecret: 'mock-signing-secret',
    });
  }

  protected async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    console.log(`Thermonuclear Slack Mock: ${endpoint}`);

    // Return mock data based on endpoint
    if (endpoint.includes('auth.test')) {
      return {
        ok: true,
        url: 'https://protothrive.slack.com/',
        team: 'ProtoThrive',
        user: 'protothrive_bot',
        team_id: 'T12345',
        user_id: 'U12345',
        bot_id: 'B12345',
      } as any;
    }

    if (endpoint.includes('team.info')) {
      return {
        ok: true,
        team: {
          id: 'T12345',
          name: 'ProtoThrive',
          url: 'https://protothrive.slack.com/',
          domain: 'protothrive',
          email_domain: 'protothrive.com',
          icon: {
            image_34: 'https://example.com/icon.png',
            image_44: 'https://example.com/icon.png',
            image_68: 'https://example.com/icon.png',
            image_88: 'https://example.com/icon.png',
            image_102: 'https://example.com/icon.png',
            image_132: 'https://example.com/icon.png',
            image_230: 'https://example.com/icon.png',
            image_original: 'https://example.com/icon.png',
          },
        },
      } as any;
    }

    if (endpoint.includes('conversations.list')) {
      return {
        ok: true,
        channels: [
          {
            id: 'C12345',
            name: 'general',
            is_channel: true,
            is_group: false,
            is_im: false,
            is_mpim: false,
            is_private: false,
            created: Date.now() / 1000,
            is_archived: false,
            is_general: true,
            unlinked: 0,
            name_normalized: 'general',
            is_shared: false,
            is_org_shared: false,
            is_member: true,
            is_pending_ext_shared: false,
            pending_shared: [],
            context_team_id: 'T12345',
            updated: Date.now() / 1000,
            creator: 'U12345',
            is_ext_shared: false,
            shared_team_ids: ['T12345'],
            pending_connected_team_ids: [],
            is_pending_ext_shared_channel: false,
            topic: {
              value: 'Company-wide announcements and work-based matters',
              creator: 'U12345',
              last_set: Date.now() / 1000,
            },
            purpose: {
              value: 'This channel is for workspace-wide communication',
              creator: 'U12345',
              last_set: Date.now() / 1000,
            },
            previous_names: [],
            num_members: 10,
          },
          {
            id: 'C67890',
            name: 'protothrive-dev',
            is_channel: true,
            is_group: false,
            is_im: false,
            is_mpim: false,
            is_private: true,
            created: Date.now() / 1000,
            is_archived: false,
            is_general: false,
            unlinked: 0,
            name_normalized: 'protothrive-dev',
            is_shared: false,
            is_org_shared: false,
            is_member: true,
            is_pending_ext_shared: false,
            pending_shared: [],
            context_team_id: 'T12345',
            updated: Date.now() / 1000,
            creator: 'U12345',
            is_ext_shared: false,
            shared_team_ids: ['T12345'],
            pending_connected_team_ids: [],
            is_pending_ext_shared_channel: false,
            topic: {
              value: 'ProtoThrive development updates',
              creator: 'U12345',
              last_set: Date.now() / 1000,
            },
            purpose: {
              value: 'Development channel for ProtoThrive project',
              creator: 'U12345',
              last_set: Date.now() / 1000,
            },
            previous_names: [],
            num_members: 5,
          },
        ],
      } as any;
    }

    if (endpoint.includes('users.list')) {
      return {
        ok: true,
        members: [
          {
            id: 'U12345',
            team_id: 'T12345',
            name: 'protothrive_user',
            deleted: false,
            color: '9f69e7',
            real_name: 'ProtoThrive User',
            tz: 'America/Los_Angeles',
            tz_label: 'Pacific Standard Time',
            tz_offset: -28800,
            profile: {
              title: 'Developer',
              phone: '',
              skype: '',
              real_name: 'ProtoThrive User',
              real_name_normalized: 'ProtoThrive User',
              display_name: 'ProtoUser',
              display_name_normalized: 'ProtoUser',
              fields: {},
              status_text: 'Building the future',
              status_emoji: ':rocket:',
              status_expiration: 0,
              avatar_hash: 'g123456',
              email: 'user@protothrive.com',
              first_name: 'ProtoThrive',
              last_name: 'User',
              image_24: 'https://example.com/avatar24.png',
              image_32: 'https://example.com/avatar32.png',
              image_48: 'https://example.com/avatar48.png',
              image_72: 'https://example.com/avatar72.png',
              image_192: 'https://example.com/avatar192.png',
              image_512: 'https://example.com/avatar512.png',
              status_text_canonical: '',
              team: 'T12345',
            },
            is_admin: true,
            is_owner: true,
            is_primary_owner: true,
            is_restricted: false,
            is_ultra_restricted: false,
            is_bot: false,
            is_app_user: false,
            updated: Date.now() / 1000,
            is_email_confirmed: true,
            who_can_share_contact_card: 'EVERYONE',
          },
        ],
      } as any;
    }

    return { ok: true } as T;
  }
}

// Export singleton instance
export const slackService = process.env.NODE_ENV === 'production'
  ? new SlackService({
      botToken: process.env.SLACK_BOT_TOKEN || '',
      userToken: process.env.SLACK_USER_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET || '',
      appId: process.env.SLACK_APP_ID,
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      defaultChannel: process.env.SLACK_DEFAULT_CHANNEL,
    })
  : new MockSlackService();