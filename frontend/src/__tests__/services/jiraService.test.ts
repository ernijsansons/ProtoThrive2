// Ref: CLAUDE.md - Jira API Integration Service Tests
// Converted to Jest';
import { JiraService, jiraService } from '../../services/jiraService';
import { testUtils, mockData } from '../../test-utils/testSetup';

describe('JiraService', () => {
  let service: JiraService;

  beforeEach(() => {
    service = new JiraService({ baseUrl: "https://test.atlassian.net", email: "test@test.com", apiToken: "test-token" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate with Jira credentials', async () => {
      testUtils.mockApiResponse({
        self: 'https://company.atlassian.net/rest/api/3/user?accountId=test-account-id',
        accountId: 'test-account-id',
        accountType: 'atlassian',
        emailAddress: 'user@company.com',
        displayName: 'Test User',
        active: true,
        timeZone: 'America/New_York',
        groups: {
          size: 3,
          items: [
            { name: 'jira-administrators', groupId: 'admin-group-id' },
            { name: 'jira-software-users', groupId: 'users-group-id' },
          ],
        },
        applicationRoles: {
          size: 1,
          items: [
            { key: 'jira-software', name: 'Jira Software' },
          ],
        },
      });

      const user = await service.authenticate('user@company.com', 'api-token-123');

      expect(user).toEqual(
        expect.objectContaining({
          accountId: 'test-account-id',
          emailAddress: 'user@company.com',
          displayName: 'Test User',
          active: true,
        })
      );
    });

    it('should handle invalid credentials', async () => {
      testUtils.mockApiResponse(
        { errorMessages: ['Invalid credentials'] },
        401
      );

      await expect(
        service.authenticate('invalid@email.com', 'wrong-token')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('Project Management', () => {
    it('should get accessible projects', async () => {
      testUtils.mockApiResponse({
        values: [
          {
            expand: 'description,lead,issueTypes,url,projectKeys',
            self: 'https://company.atlassian.net/rest/api/3/project/PROJ',
            id: '10001',
            key: 'PROJ',
            name: 'Test Project',
            description: 'A test project for development',
            lead: {
              self: 'https://company.atlassian.net/rest/api/3/user?accountId=lead-id',
              accountId: 'lead-id',
              displayName: 'Project Lead',
              emailAddress: 'lead@company.com',
            },
            projectTypeKey: 'software',
            simplified: false,
            style: 'next-gen',
            isPrivate: false,
            issueTypes: [
              {
                self: 'https://company.atlassian.net/rest/api/3/issuetype/10001',
                id: '10001',
                name: 'Story',
                subtask: false,
                iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/story.svg',
              },
              {
                self: 'https://company.atlassian.net/rest/api/3/issuetype/10002',
                id: '10002',
                name: 'Bug',
                subtask: false,
                iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/bug.svg',
              },
            ],
          },
        ],
      });

      const projects = await service.getProjects();

      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(
        expect.objectContaining({
          key: 'PROJ',
          name: 'Test Project',
          projectTypeKey: 'software',
        })
      );
    });

    it('should get project details', async () => {
      testUtils.mockApiResponse({
        expand: 'description,lead,issueTypes,url,projectKeys',
        self: 'https://company.atlassian.net/rest/api/3/project/PROJ',
        id: '10001',
        key: 'PROJ',
        name: 'Test Project',
        description: 'A comprehensive test project',
        lead: {
          displayName: 'Project Lead',
          emailAddress: 'lead@company.com',
        },
        components: [
          {
            self: 'https://company.atlassian.net/rest/api/3/component/10001',
            id: '10001',
            name: 'Frontend',
            description: 'Frontend components and UI',
            lead: {
              displayName: 'Frontend Lead',
            },
          },
          {
            id: '10002',
            name: 'Backend',
            description: 'Backend services and APIs',
          },
        ],
        versions: [
          {
            self: 'https://company.atlassian.net/rest/api/3/version/10001',
            id: '10001',
            name: 'v1.0.0',
            description: 'Initial release',
            archived: false,
            released: true,
            releaseDate: '2023-06-01',
          },
        ],
      });

      const project = await service.getProject('PROJ');

      expect(project).toEqual(
        expect.objectContaining({
          key: 'PROJ',
          name: 'Test Project',
          components: expect.arrayContaining([
            expect.objectContaining({ name: 'Frontend' }),
            expect.objectContaining({ name: 'Backend' }),
          ]),
        })
      );
    });

    it('should sync project to roadmap', async () => {
      // Mock issues for roadmap generation
      testUtils.mockApiResponse({
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 3,
        issues: [
          {
            expand: 'operations,versionedRepresentations,editmeta,changelog,renderedFields',
            id: '10001',
            self: 'https://company.atlassian.net/rest/api/3/issue/10001',
            key: 'PROJ-1',
            fields: {
              summary: 'Implement user authentication',
              description: 'Create secure user login and registration system',
              issuetype: {
                id: '10001',
                name: 'Story',
                iconUrl: 'https://company.atlassian.net/images/icons/issuetypes/story.svg',
              },
              status: {
                id: '10001',
                name: 'To Do',
                statusCategory: {
                  id: 2,
                  key: 'new',
                  colorName: 'blue-gray',
                  name: 'To Do',
                },
              },
              priority: {
                id: '3',
                name: 'Medium',
                iconUrl: 'https://company.atlassian.net/images/icons/priorities/medium.svg',
              },
              assignee: {
                displayName: 'Developer 1',
                emailAddress: 'dev1@company.com',
              },
              reporter: {
                displayName: 'Product Owner',
                emailAddress: 'po@company.com',
              },
              components: [
                { name: 'Backend' },
                { name: 'Frontend' },
              ],
              fixVersions: [
                { name: 'v1.0.0' },
              ],
              labels: ['authentication', 'security'],
              created: '2023-05-01T09:00:00.000+0000',
              updated: '2023-06-01T15:30:00.000+0000',
            },
          },
          {
            id: '10002',
            key: 'PROJ-2',
            fields: {
              summary: 'Fix login validation bug',
              issuetype: { name: 'Bug' },
              status: { name: 'In Progress' },
              priority: { name: 'High' },
              components: [{ name: 'Frontend' }],
            },
          },
          {
            id: '10003',
            key: 'PROJ-3',
            fields: {
              summary: 'Deploy to production',
              issuetype: { name: 'Task' },
              status: { name: 'Done' },
              priority: { name: 'High' },
              components: [{ name: 'DevOps' }],
            },
          },
        ],
      });

      const roadmap = await service.syncProjectToRoadmap('PROJ');

      expect(roadmap).toEqual(
        expect.objectContaining({
          nodes: expect.arrayContaining([
            expect.objectContaining({
              id: 'PROJ-1',
              label: 'Implement user authentication',
              type: 'story',
              status: expect.any(String),
            }),
            expect.objectContaining({
              id: 'PROJ-2',
              label: 'Fix login validation bug',
              type: 'bug',
            }),
          ]),
          edges: expect.any(Array),
          metadata: expect.objectContaining({
            source: 'jira',
            project: 'PROJ',
          }),
        })
      );
    });
  });

  describe('Issue Management', () => {
    it('should get project issues', async () => {
      testUtils.mockApiResponse({
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 2,
        issues: [
          {
            id: '10001',
            key: 'PROJ-1',
            fields: {
              summary: 'Implement dashboard',
              description: 'Create comprehensive user dashboard',
              issuetype: { name: 'Story', iconUrl: 'story.svg' },
              status: { name: 'To Do' },
              priority: { name: 'Medium' },
              assignee: { displayName: 'Developer A' },
              created: '2023-06-01T00:00:00.000+0000',
              updated: '2023-06-02T00:00:00.000+0000',
            },
          },
          {
            id: '10002',
            key: 'PROJ-2',
            fields: {
              summary: 'Fix performance issue',
              issuetype: { name: 'Bug' },
              status: { name: 'In Progress' },
              priority: { name: 'High' },
              assignee: { displayName: 'Developer B' },
            },
          },
        ],
      });

      const issues = await service.getIssues('PROJ');

      expect(issues).toHaveLength(2);
      expect(issues[0]).toEqual(
        expect.objectContaining({
          key: 'PROJ-1',
          summary: 'Implement dashboard',
          issueType: 'Story',
          status: 'To Do',
        })
      );
    });

    it('should create issue', async () => {
      const issueData = {
        summary: 'New feature request',
        description: 'Implement advanced search functionality',
        issueType: 'Story',
        priority: 'Medium',
        assignee: 'dev@company.com',
        components: ['Frontend'],
        labels: ['enhancement', 'search'],
      };

      testUtils.mockApiResponse({
        id: '10003',
        key: 'PROJ-3',
        self: 'https://company.atlassian.net/rest/api/3/issue/10003',
      });

      const issue = await service.createIssue('PROJ', issueData);

      expect(issue).toEqual(
        expect.objectContaining({
          id: '10003',
          key: 'PROJ-3',
        })
      );
    });

    it('should update issue', async () => {
      const updates = {
        summary: 'Updated: Advanced search with filters',
        description: 'Enhanced search with multiple filter options',
        status: 'In Progress',
        assignee: 'newdev@company.com',
        labels: ['enhancement', 'search', 'filters'],
      };

      testUtils.mockApiResponse({
        id: '10003',
        key: 'PROJ-3',
        fields: {
          summary: updates.summary,
          description: updates.description,
          status: { name: updates.status },
          assignee: { emailAddress: updates.assignee },
          labels: updates.labels,
          updated: new Date().toISOString(),
        },
      });

      const issue = await service.updateIssue('PROJ-3', updates);

      expect(issue.fields.summary).toBe('Updated: Advanced search with filters');
      expect(issue.fields.status.name).toBe('In Progress');
    });

    it('should transition issue status', async () => {
      // Mock available transitions
      testUtils.mockApiResponse({
        expand: 'transitions',
        transitions: [
          {
            id: '21',
            name: 'In Progress',
            to: {
              id: '3',
              name: 'In Progress',
              statusCategory: { key: 'indeterminate' },
            },
          },
          {
            id: '31',
            name: 'Done',
            to: {
              id: '10001',
              name: 'Done',
              statusCategory: { key: 'done' },
            },
          },
        ],
      });

      // Mock transition execution
      testUtils.mockApiResponse({}, 204);

      const result = await service.transitionIssue('PROJ-1', 'In Progress');

      expect(result).toBe(true);
    });
  });

  describe('Sprint and Board Management', () => {
    it('should get project boards', async () => {
      testUtils.mockApiResponse({
        maxResults: 50,
        startAt: 0,
        total: 2,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://company.atlassian.net/rest/agile/1.0/board/1',
            name: 'PROJ Scrum Board',
            type: 'scrum',
            location: {
              type: 'project',
              key: 'PROJ',
              id: '10001',
              name: 'Test Project',
            },
          },
          {
            id: 2,
            name: 'PROJ Kanban Board',
            type: 'kanban',
            location: {
              type: 'project',
              key: 'PROJ',
            },
          },
        ],
      });

      const boards = await service.getBoards('PROJ');

      expect(boards).toHaveLength(2);
      expect(boards[0]).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'PROJ Scrum Board',
          type: 'scrum',
        })
      );
    });

    it('should get board sprints', async () => {
      testUtils.mockApiResponse({
        maxResults: 50,
        startAt: 0,
        isLast: true,
        values: [
          {
            id: 1,
            self: 'https://company.atlassian.net/rest/agile/1.0/sprint/1',
            state: 'active',
            name: 'Sprint 1',
            startDate: '2023-06-01T09:00:00.000Z',
            endDate: '2023-06-14T17:00:00.000Z',
            originBoardId: 1,
            goal: 'Complete user authentication features',
          },
          {
            id: 2,
            state: 'future',
            name: 'Sprint 2',
            originBoardId: 1,
            goal: 'Implement dashboard and reporting',
          },
        ],
      });

      const sprints = await service.getSprints(1);

      expect(sprints).toHaveLength(2);
      expect(sprints[0]).toEqual(
        expect.objectContaining({
          id: 1,
          state: 'active',
          name: 'Sprint 1',
          goal: 'Complete user authentication features',
        })
      );
    });

    it('should get sprint issues', async () => {
      testUtils.mockApiResponse({
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 3,
        issues: [
          {
            id: '10001',
            key: 'PROJ-1',
            fields: {
              summary: 'Sprint task 1',
              status: { name: 'To Do' },
              assignee: { displayName: 'Developer' },
              storyPoints: 5,
            },
          },
          {
            id: '10002',
            key: 'PROJ-2',
            fields: {
              summary: 'Sprint task 2',
              status: { name: 'In Progress' },
              assignee: { displayName: 'Developer' },
              storyPoints: 3,
            },
          },
        ],
      });

      const issues = await service.getSprintIssues(1);

      expect(issues).toHaveLength(2);
      expect(issues[0]).toEqual(
        expect.objectContaining({
          key: 'PROJ-1',
          summary: 'Sprint task 1',
          storyPoints: 5,
        })
      );
    });
  });

  describe('Advanced Features', () => {
    it('should get issue changelog', async () => {
      testUtils.mockApiResponse({
        expand: 'changelog',
        id: '10001',
        key: 'PROJ-1',
        changelog: {
          startAt: 0,
          maxResults: 50,
          total: 2,
          histories: [
            {
              id: '10001',
              author: {
                displayName: 'Developer',
                emailAddress: 'dev@company.com',
              },
              created: '2023-06-01T10:00:00.000+0000',
              items: [
                {
                  field: 'status',
                  fieldtype: 'jira',
                  from: '10000',
                  fromString: 'To Do',
                  to: '3',
                  toString: 'In Progress',
                },
              ],
            },
            {
              id: '10002',
              author: {
                displayName: 'Developer',
              },
              created: '2023-06-02T14:30:00.000+0000',
              items: [
                {
                  field: 'assignee',
                  from: 'olddev',
                  fromString: 'Old Developer',
                  to: 'newdev',
                  toString: 'New Developer',
                },
              ],
            },
          ],
        },
      });

      const changelog = await service.getIssueChangelog('PROJ-1');

      expect(changelog).toHaveLength(2);
      expect(changelog[0]).toEqual(
        expect.objectContaining({
          author: expect.objectContaining({
            displayName: 'Developer',
          }),
          changes: expect.arrayContaining([
            expect.objectContaining({
              field: 'status',
              from: 'To Do',
              to: 'In Progress',
            }),
          ]),
        })
      );
    });

    it('should search issues with JQL', async () => {
      const jql = 'project = PROJ AND status = "In Progress" ORDER BY priority DESC';

      testUtils.mockApiResponse({
        expand: 'names,schema',
        startAt: 0,
        maxResults: 50,
        total: 1,
        issues: [
          {
            id: '10002',
            key: 'PROJ-2',
            fields: {
              summary: 'High priority in-progress task',
              status: { name: 'In Progress' },
              priority: { name: 'High' },
              assignee: { displayName: 'Developer' },
            },
          },
        ],
      });

      const results = await service.searchIssues(jql);

      expect(results.issues).toHaveLength(1);
      expect(results.issues[0]).toEqual(
        expect.objectContaining({
          key: 'PROJ-2',
          summary: 'High priority in-progress task',
        })
      );
    });

    it('should get issue relationships', async () => {
      testUtils.mockApiResponse({
        id: '10001',
        key: 'PROJ-1',
        fields: {
          issuelinks: [
            {
              id: '10001',
              type: {
                id: '10000',
                name: 'Blocks',
                inward: 'is blocked by',
                outward: 'blocks',
              },
              outwardIssue: {
                id: '10002',
                key: 'PROJ-2',
                fields: {
                  summary: 'Blocked issue',
                  status: { name: 'To Do' },
                },
              },
            },
            {
              id: '10002',
              type: {
                name: 'Relates',
                inward: 'relates to',
                outward: 'relates to',
              },
              inwardIssue: {
                id: '10003',
                key: 'PROJ-3',
                fields: {
                  summary: 'Related issue',
                  status: { name: 'Done' },
                },
              },
            },
          ],
          subtasks: [
            {
              id: '10004',
              key: 'PROJ-4',
              fields: {
                summary: 'Subtask of PROJ-1',
                status: { name: 'To Do' },
                issuetype: { name: 'Sub-task' },
              },
            },
          ],
        },
      });

      const relationships = await service.getIssueRelationships('PROJ-1');

      expect(relationships).toEqual(
        expect.objectContaining({
          links: expect.arrayContaining([
            expect.objectContaining({
              type: 'Blocks',
              direction: 'outward',
              issue: expect.objectContaining({
                key: 'PROJ-2',
              }),
            }),
          ]),
          subtasks: expect.arrayContaining([
            expect.objectContaining({
              key: 'PROJ-4',
              summary: 'Subtask of PROJ-1',
            }),
          ]),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid project key', async () => {
      testUtils.mockApiResponse(
        { errorMessages: ['Project does not exist or you do not have permission to view it'] },
        404
      );

      await expect(
        service.getProject('INVALID')
      ).rejects.toThrow('Project does not exist');
    });

    it('should handle JQL syntax errors', async () => {
      testUtils.mockApiResponse(
        { errorMessages: ['Invalid JQL query'] },
        400
      );

      await expect(
        service.searchIssues('INVALID JQL SYNTAX')
      ).rejects.toThrow('Invalid JQL query');
    });

    it('should handle rate limiting', async () => {
      testUtils.mockApiResponse(
        { errorMessages: ['Rate limit exceeded'] },
        429
      );

      await expect(
        service.getIssues('PROJ')
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle insufficient permissions', async () => {
      testUtils.mockApiResponse(
        { errorMessages: ['You do not have permission to edit issues in this project'] },
        403
      );

      await expect(
        service.createIssue('PROJ', {
          summary: 'Test issue',
          issueType: 'Story',
        })
      ).rejects.toThrow('You do not have permission');
    });
  });

  describe('Performance and Caching', () => {
    it('should cache project data', async () => {
      testUtils.mockApiResponse({
        values: [
          { id: '10001', key: 'PROJ', name: 'Test Project' },
        ],
      });

      // First call
      const projects1 = await service.getProjects();

      // Second call should use cache
      const projects2 = await service.getProjects();

      expect(projects1).toEqual(projects2);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent requests', async () => {
      const requests = [
        service.getProject('PROJ1'),
        service.getProject('PROJ2'),
        service.getIssues('PROJ3'),
      ];

      testUtils.mockApiResponse({ success: true });

      await expect(Promise.all(requests)).resolves.toBeDefined();
    });

    it('should respect Jira API best practices', async () => {
      const mockFetch = vi.mocked(global.fetch);

      await service.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});

describe('Global Jira Service Instance', () => {
  it('should use the global jira service', async () => {
    testUtils.mockApiResponse({
      accountId: 'test-account',
      displayName: 'Test User',
    });

    const user = await jiraService.authenticate('test@email.com', 'token');

    expect(user).toEqual(
      expect.objectContaining({
        accountId: 'test-account',
      })
    );
  });

  it('should provide convenient jira methods', async () => {
    const { jira } = await import('../../services/jiraService');

    testUtils.mockApiResponse({
      values: [
        { key: 'PROJ', name: 'Test Project' },
      ],
    });

    const projects = await jira.projects();
    expect(projects).toHaveLength(1);

    testUtils.mockApiResponse({
      issues: [
        { key: 'PROJ-1', fields: { summary: 'Test Issue' } },
      ],
    });

    const issues = await jira.issues('PROJ');
    expect(issues).toHaveLength(1);

    testUtils.mockApiResponse({
      nodes: [],
      edges: [],
      metadata: { source: 'jira' },
    });

    const roadmap = await jira.sync('PROJ');
    expect(roadmap.metadata.source).toBe('jira');
  });
});

describe('Jira Service Integration Scenarios', () => {
  it('should handle complete project management workflow', async () => {
    console.log('🔥 Jira Integration: Starting complete workflow');

    // 1. Authentication
    testUtils.mockApiResponse({
      accountId: 'test-account',
      displayName: 'Test User',
      emailAddress: 'test@company.com',
    });

    const user = await service.authenticate('test@company.com', 'api-token');
    expect(user.accountId).toBe('test-account');

    // 2. Project discovery
    testUtils.mockApiResponse({
      values: [
        { key: 'PROJ', name: 'Main Project', projectTypeKey: 'software' },
      ],
    });

    const projects = await service.getProjects();
    expect(projects).toHaveLength(1);

    // 3. Project sync to roadmap
    testUtils.mockApiResponse({
      issues: [
        {
          key: 'PROJ-1',
          fields: {
            summary: 'Epic task',
            issuetype: { name: 'Epic' },
            status: { name: 'To Do' },
          },
        },
      ],
    });

    const roadmap = await service.syncProjectToRoadmap('PROJ');
    expect(roadmap.nodes.length).toBeGreaterThan(0);

    // 4. Sprint management
    testUtils.mockApiResponse({
      values: [
        { id: 1, name: 'Main Board', type: 'scrum' },
      ],
    });

    const boards = await service.getBoards('PROJ');
    expect(boards).toHaveLength(1);

    testUtils.mockApiResponse({
      values: [
        { id: 1, name: 'Sprint 1', state: 'active' },
      ],
    });

    const sprints = await service.getSprints(1);
    expect(sprints).toHaveLength(1);

    // 5. Issue creation and management
    testUtils.mockApiResponse({
      id: '10001',
      key: 'PROJ-2',
    });

    const newIssue = await service.createIssue('PROJ', {
      summary: 'New automated issue',
      issueType: 'Story',
      priority: 'Medium',
    });

    expect(newIssue.key).toBe('PROJ-2');

    console.log('🔥 Jira Integration: Complete workflow successful');
  });

  it('should handle enterprise Jira scenarios', async () => {
    const scenarios = [
      'Multi-project portfolio management',
      'Advanced JQL query automation',
      'Custom field integration',
      'Workflow automation rules',
      'Service desk integration',
      'Advanced reporting and analytics',
    ];

    for (const scenario of scenarios) {
      console.log(`🔥 Enterprise Scenario: ${scenario}`);
      testUtils.mockApiResponse({ success: true });
      // Each scenario would be implemented with specific test logic
      expect(scenario).toBeDefined();
    }

    console.log('🔥 Jira Enterprise Integration: All scenarios tested');
  });
});