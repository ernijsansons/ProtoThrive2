// Ref: CLAUDE.md - Jira API Integration Service for ProtoThrive
import { rateLimiter } from '../utils/security';

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description: string;
  lead: {
    displayName: string;
    emailAddress: string;
    avatarUrls: Record<string, string>;
  };
  projectTypeKey: string;
  simplified: boolean;
  style: string;
  isPrivate: boolean;
  properties: Record<string, any>;
  entityId: string;
  uuid: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: {
      content: any[];
      type: string;
      version: number;
    };
    status: {
      name: string;
      statusCategory: {
        name: string;
        colorName: string;
      };
    };
    priority?: {
      name: string;
      iconUrl: string;
    };
    issuetype: {
      name: string;
      iconUrl: string;
      subtask: boolean;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
      avatarUrls: Record<string, string>;
    };
    reporter: {
      displayName: string;
      emailAddress: string;
      avatarUrls: Record<string, string>;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    labels: string[];
    components: Array<{
      name: string;
      description?: string;
    }>;
    fixVersions: Array<{
      name: string;
      description?: string;
      releaseDate?: string;
      released: boolean;
    }>;
    parent?: {
      key: string;
      fields: {
        summary: string;
        status: {
          name: string;
        };
      };
    };
    subtasks: Array<{
      key: string;
      fields: {
        summary: string;
        status: {
          name: string;
        };
      };
    }>;
  };
}

export interface JiraBoard {
  id: number;
  name: string;
  type: 'scrum' | 'kanban' | 'simple';
  location: {
    projectId: number;
    projectKey: string;
    projectName: string;
  };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'closed' | 'future';
  startDate?: string;
  endDate?: string;
  completeDate?: string;
  originBoardId: number;
  goal?: string;
}

export interface JiraVersion {
  id: string;
  name: string;
  description?: string;
  archived: boolean;
  released: boolean;
  releaseDate?: string;
  userReleaseDate?: string;
  projectId: number;
}

export interface JiraComponent {
  id: string;
  name: string;
  description?: string;
  lead?: {
    displayName: string;
    emailAddress: string;
  };
  assigneeType: string;
  realAssigneeType: string;
  isAssigneeTypeValid: boolean;
  project: string;
  projectId: number;
}

export interface JiraWebhookEvent {
  timestamp: number;
  webhookEvent: string;
  user: {
    name: string;
    displayName: string;
    emailAddress: string;
    avatarUrls: Record<string, string>;
  };
  issue?: JiraIssue;
  project?: JiraProject;
  changelog?: {
    items: Array<{
      field: string;
      fieldtype: string;
      from?: string;
      fromString?: string;
      to?: string;
      toString?: string;
    }>;
  };
}

export interface JiraIntegrationConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  cloudId?: string;
  webhookSecret?: string;
  syncInterval?: number; // minutes
}

export class JiraService {
  private config: JiraIntegrationConfig;
  private rateLimitCache = new Map<string, number>();

  constructor(config: JiraIntegrationConfig) {
    this.config = config;
  }

  protected async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Rate limiting
    const rateLimitKey = `jira_api_${endpoint.split('/')[1] || 'general'}`;
    if (!rateLimiter.check(rateLimitKey, 10000, 3600)) { // Conservative limit
      throw new Error('Jira API rate limit exceeded');
    }

    const url = `${this.config.baseUrl}/rest/api/3${endpoint}`;
    const auth = btoa(`${this.config.email}:${this.config.apiToken}`);

    const headers = {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'ProtoThrive-Integration/1.0',
      ...options.headers,
    };

    console.log(`Thermonuclear Jira API Call: ${endpoint}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Jira API error: ${response.status} - ${error}`);
      }

      // Track rate limits
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining) {
        this.rateLimitCache.set(rateLimitKey, parseInt(remaining));
      }

      return await response.json();
    } catch (error) {
      console.error('Jira API request failed:', error);
      throw error;
    }
  }

  // Project operations
  async getProjects(): Promise<JiraProject[]> {
    return this.makeRequest<JiraProject[]>('/project');
  }

  async getProject(projectKey: string): Promise<JiraProject> {
    return this.makeRequest<JiraProject>(`/project/${projectKey}`);
  }

  // Issue operations
  async getIssues(projectKey: string, params?: {
    maxResults?: number;
    startAt?: number;
    jql?: string;
    fields?: string[];
    expand?: string[];
  }): Promise<{
    issues: JiraIssue[];
    total: number;
    maxResults: number;
    startAt: number;
  }> {
    const searchParams = new URLSearchParams();

    if (params?.maxResults) searchParams.set('maxResults', params.maxResults.toString());
    if (params?.startAt) searchParams.set('startAt', params.startAt.toString());
    if (params?.fields) searchParams.set('fields', params.fields.join(','));
    if (params?.expand) searchParams.set('expand', params.expand.join(','));

    const jql = params?.jql || `project = ${projectKey}`;
    searchParams.set('jql', jql);

    const endpoint = `/search?${searchParams}`;
    return this.makeRequest(endpoint);
  }

  async getIssue(issueKey: string, params?: {
    fields?: string[];
    expand?: string[];
  }): Promise<JiraIssue> {
    const searchParams = new URLSearchParams();
    if (params?.fields) searchParams.set('fields', params.fields.join(','));
    if (params?.expand) searchParams.set('expand', params.expand.join(','));

    const endpoint = `/issue/${issueKey}${searchParams.toString() ? `?${searchParams}` : ''}`;
    return this.makeRequest(endpoint);
  }

  async createIssue(data: {
    projectKey: string;
    summary: string;
    description?: string;
    issueType: string;
    priority?: string;
    assignee?: string;
    labels?: string[];
    components?: string[];
    fixVersions?: string[];
    parent?: string; // For subtasks
  }): Promise<JiraIssue> {
    const issueData: any = {
      fields: {
        project: { key: data.projectKey },
        summary: data.summary,
        issuetype: { name: data.issueType },
      },
    };

    if (data.description) {
      issueData.fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.description,
              },
            ],
          },
        ],
      };
    }

    if (data.priority) {
      issueData.fields.priority = { name: data.priority };
    }

    if (data.assignee) {
      issueData.fields.assignee = { emailAddress: data.assignee };
    }

    if (data.labels && data.labels.length > 0) {
      issueData.fields.labels = data.labels;
    }

    if (data.components && data.components.length > 0) {
      issueData.fields.components = data.components.map(name => ({ name }));
    }

    if (data.fixVersions && data.fixVersions.length > 0) {
      issueData.fields.fixVersions = data.fixVersions.map(name => ({ name }));
    }

    if (data.parent) {
      issueData.fields.parent = { key: data.parent };
    }

    return this.makeRequest('/issue', {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  }

  async updateIssue(issueKey: string, data: {
    summary?: string;
    description?: string;
    assignee?: string;
    status?: string;
    priority?: string;
    labels?: string[];
  }): Promise<void> {
    const updateData: any = { fields: {} };

    if (data.summary) {
      updateData.fields.summary = data.summary;
    }

    if (data.description) {
      updateData.fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: data.description,
              },
            ],
          },
        ],
      };
    }

    if (data.assignee) {
      updateData.fields.assignee = { emailAddress: data.assignee };
    }

    if (data.priority) {
      updateData.fields.priority = { name: data.priority };
    }

    if (data.labels) {
      updateData.fields.labels = data.labels;
    }

    await this.makeRequest(`/issue/${issueKey}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    // Handle status transition separately if needed
    if (data.status) {
      await this.transitionIssue(issueKey, data.status);
    }
  }

  async transitionIssue(issueKey: string, toStatus: string): Promise<void> {
    // Get available transitions
    const transitions = await this.makeRequest<{
      transitions: Array<{
        id: string;
        name: string;
        to: { name: string };
      }>;
    }>(`/issue/${issueKey}/transitions`);

    // Find the transition that leads to the desired status
    const transition = transitions.transitions.find(t =>
      t.to.name.toLowerCase() === toStatus.toLowerCase()
    );

    if (!transition) {
      throw new Error(`No transition found to status: ${toStatus}`);
    }

    await this.makeRequest(`/issue/${issueKey}/transitions`, {
      method: 'POST',
      body: JSON.stringify({
        transition: { id: transition.id },
      }),
    });
  }

  // Board operations (Agile API)
  async getBoards(projectKey?: string): Promise<JiraBoard[]> {
    const endpoint = projectKey
      ? `/board?projectKeyOrId=${projectKey}`
      : '/board';

    const response = await this.makeRequest<{ values: JiraBoard[] }>(endpoint);
    return response.values;
  }

  async getBoard(boardId: number): Promise<JiraBoard> {
    return this.makeRequest(`/board/${boardId}`);
  }

  // Sprint operations
  async getSprints(boardId: number, state?: 'active' | 'closed' | 'future'): Promise<JiraSprint[]> {
    const endpoint = state
      ? `/board/${boardId}/sprint?state=${state}`
      : `/board/${boardId}/sprint`;

    const response = await this.makeRequest<{ values: JiraSprint[] }>(endpoint);
    return response.values;
  }

  async getSprintIssues(sprintId: number): Promise<JiraIssue[]> {
    const response = await this.makeRequest<{ issues: JiraIssue[] }>(`/sprint/${sprintId}/issue`);
    return response.issues;
  }

  // Component operations
  async getComponents(projectKey: string): Promise<JiraComponent[]> {
    return this.makeRequest(`/project/${projectKey}/components`);
  }

  // Version operations
  async getVersions(projectKey: string): Promise<JiraVersion[]> {
    return this.makeRequest(`/project/${projectKey}/versions`);
  }

  // Webhook operations
  async createWebhook(data: {
    name: string;
    url: string;
    events: string[];
    jqlFilter?: string;
    excludeIssueDetails?: boolean;
  }): Promise<any> {
    return this.makeRequest('/webhook', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        url: data.url,
        events: data.events,
        filters: {
          'issue-related-events-section': data.jqlFilter || '',
        },
        excludeBody: data.excludeIssueDetails || false,
      }),
    });
  }

  // Roadmap integration methods
  async syncProjectToRoadmap(projectKey: string): Promise<{
    nodes: any[];
    edges: any[];
    metadata: any;
  }> {
    try {
      console.log(`Thermonuclear Jira Sync: ${projectKey}`);

      const [project, issues, boards, components, versions] = await Promise.all([
        this.getProject(projectKey),
        this.getIssues(projectKey, { maxResults: 50 }),
        this.getBoards(projectKey),
        this.getComponents(projectKey),
        this.getVersions(projectKey),
      ]);

      const nodes: any[] = [];
      const edges: any[] = [];

      // Project root node
      nodes.push({
        id: `project-${project.id}`,
        label: project.name,
        type: 'project',
        status: 'neon',
        position: { x: 0, y: 0, z: 0 },
        data: {
          key: project.key,
          description: project.description,
          lead: project.lead,
          projectType: project.projectTypeKey,
          isPrivate: project.isPrivate,
        },
      });

      // Component nodes
      components.forEach((component, index) => {
        const nodeId = `component-${component.id}`;
        nodes.push({
          id: nodeId,
          label: `Component: ${component.name}`,
          type: 'component',
          status: 'gray',
          position: { x: 200, y: index * 80, z: 0 },
          data: {
            description: component.description,
            lead: component.lead,
            assigneeType: component.assigneeType,
          },
        });

        edges.push({
          from: `project-${project.id}`,
          to: nodeId,
          type: 'component',
        });
      });

      // Version nodes
      versions.forEach((version, index) => {
        const nodeId = `version-${version.id}`;
        nodes.push({
          id: nodeId,
          label: `Version: ${version.name}`,
          type: 'version',
          status: version.released ? 'gray' : 'neon',
          position: { x: 400, y: index * 80, z: 0 },
          data: {
            description: version.description,
            released: version.released,
            releaseDate: version.releaseDate,
            archived: version.archived,
          },
        });

        edges.push({
          from: `project-${project.id}`,
          to: nodeId,
          type: 'version',
        });
      });

      // Issue nodes (limited to top 20 for performance)
      issues.issues.slice(0, 20).forEach((issue, index) => {
        const nodeId = `issue-${issue.id}`;
        const statusCategory = issue.fields.status.statusCategory.name.toLowerCase();
        const status = statusCategory === 'done' ? 'gray' :
                      statusCategory === 'indeterminate' ? 'neon' : 'gray';

        nodes.push({
          id: nodeId,
          label: `${issue.key}: ${issue.fields.summary}`,
          type: 'issue',
          status,
          position: { x: 600, y: index * 60, z: 0 },
          data: {
            key: issue.key,
            status: issue.fields.status.name,
            priority: issue.fields.priority?.name,
            issueType: issue.fields.issuetype.name,
            assignee: issue.fields.assignee?.displayName,
            reporter: issue.fields.reporter.displayName,
            created: issue.fields.created,
            updated: issue.fields.updated,
            labels: issue.fields.labels,
            components: issue.fields.components,
            fixVersions: issue.fields.fixVersions,
          },
        });

        // Connect to project
        edges.push({
          from: `project-${project.id}`,
          to: nodeId,
          type: 'issue',
        });

        // Connect to components
        issue.fields.components.forEach(component => {
          const componentNode = nodes.find(n =>
            n.type === 'component' && n.label.includes(component.name)
          );
          if (componentNode) {
            edges.push({
              from: componentNode.id,
              to: nodeId,
              type: 'component_issue',
            });
          }
        });

        // Connect to versions
        issue.fields.fixVersions.forEach(version => {
          const versionNode = nodes.find(n =>
            n.type === 'version' && n.label.includes(version.name)
          );
          if (versionNode) {
            edges.push({
              from: versionNode.id,
              to: nodeId,
              type: 'version_issue',
            });
          }
        });

        // Connect subtasks to parent
        if (issue.fields.parent) {
          const parentNodeId = `issue-${issue.fields.parent.key.replace(/-\d+$/, '')}`;
          edges.push({
            from: parentNodeId,
            to: nodeId,
            type: 'subtask',
          });
        }
      });

      return {
        nodes,
        edges,
        metadata: {
          project: project.key,
          syncedAt: new Date().toISOString(),
          totalIssues: issues.total,
          totalComponents: components.length,
          totalVersions: versions.length,
          totalBoards: boards.length,
        },
      };
    } catch (error) {
      console.error('Failed to sync Jira project to roadmap:', error);
      throw error;
    }
  }

  // Webhook event handler
  async handleWebhookEvent(event: JiraWebhookEvent): Promise<{
    shouldUpdate: boolean;
    updates?: any;
  }> {
    console.log(`Thermonuclear Jira Webhook: ${event.webhookEvent}`);

    switch (event.webhookEvent) {
      case 'jira:issue_created':
      case 'jira:issue_updated':
      case 'jira:issue_deleted':
        if (event.issue) {
          return {
            shouldUpdate: true,
            updates: {
              type: 'issue',
              data: event.issue,
              action: event.webhookEvent,
              changelog: event.changelog,
            },
          };
        }
        break;

      case 'project_created':
      case 'project_updated':
      case 'project_deleted':
        if (event.project) {
          return {
            shouldUpdate: true,
            updates: {
              type: 'project',
              data: event.project,
              action: event.webhookEvent,
            },
          };
        }
        break;

      default:
        return { shouldUpdate: false };
    }

    return { shouldUpdate: false };
  }

  // Rate limit status
  getRateLimitStatus(): { [key: string]: number } {
    return Object.fromEntries(this.rateLimitCache);
  }
}

// Mock service for development
export class MockJiraService extends JiraService {
  constructor() {
    super({
      baseUrl: 'https://mock.atlassian.net',
      email: 'mock@protothrive.com',
      apiToken: 'mock_jira_token',
    });
  }

  protected async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    console.log(`Thermonuclear Jira Mock: ${endpoint}`);

    // Return mock data based on endpoint
    if (endpoint.includes('/project')) {
      if (endpoint === '/project') {
        return [{
          id: '1',
          key: 'PROTO',
          name: 'ProtoThrive Project',
          description: 'Thermonuclear project management',
          lead: {
            displayName: 'Project Lead',
            emailAddress: 'lead@protothrive.com',
            avatarUrls: { '48x48': 'https://example.com/avatar.png' },
          },
          projectTypeKey: 'software',
          simplified: false,
          style: 'classic',
          isPrivate: false,
          properties: {},
          entityId: 'uuid-1',
          uuid: 'uuid-1',
        }] as any;
      }
    }

    if (endpoint.includes('/search') || endpoint.includes('/issue')) {
      return {
        issues: [{
          id: '1',
          key: 'PROTO-1',
          fields: {
            summary: 'Thermonuclear Feature Implementation',
            description: {
              content: [],
              type: 'doc',
              version: 1,
            },
            status: {
              name: 'In Progress',
              statusCategory: {
                name: 'indeterminate',
                colorName: 'blue',
              },
            },
            priority: {
              name: 'High',
              iconUrl: 'https://example.com/priority.png',
            },
            issuetype: {
              name: 'Story',
              iconUrl: 'https://example.com/story.png',
              subtask: false,
            },
            assignee: {
              displayName: 'Developer',
              emailAddress: 'dev@protothrive.com',
              avatarUrls: { '48x48': 'https://example.com/avatar.png' },
            },
            reporter: {
              displayName: 'Product Owner',
              emailAddress: 'po@protothrive.com',
              avatarUrls: { '48x48': 'https://example.com/avatar.png' },
            },
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            labels: ['thermonuclear', 'feature'],
            components: [{ name: 'Frontend', description: 'UI Components' }],
            fixVersions: [{ name: 'v1.0.0', description: 'First release', released: false }],
            subtasks: [],
          },
        }],
        total: 1,
        maxResults: 50,
        startAt: 0,
      } as any;
    }

    return {} as T;
  }
}

// Export singleton instance
export const jiraService = process.env.NODE_ENV === 'production'
  ? new JiraService({
      baseUrl: process.env.JIRA_BASE_URL || '',
      email: process.env.JIRA_EMAIL || '',
      apiToken: process.env.JIRA_API_TOKEN || '',
      cloudId: process.env.JIRA_CLOUD_ID,
    })
  : new MockJiraService();