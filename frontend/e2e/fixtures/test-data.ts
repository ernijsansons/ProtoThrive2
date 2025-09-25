/**
 * E2E Test Data Fixtures for ProtoThrive
 * Provides consistent test data across E2E tests
 *
 * Ref: CLAUDE.md Phase 3 - E2E Testing Framework
 */

export const testUsers = {
  developer: {
    email: 'developer@protothrive.com',
    password: 'dev123',
    role: 'vibe_coder',
    displayName: 'Dev User'
  },
  admin: {
    email: 'admin@protothrive.com',
    password: 'admin123',
    role: 'exec',
    displayName: 'Admin User'
  },
  engineer: {
    email: 'engineer@protothrive.com',
    password: 'eng123',
    role: 'engineer',
    displayName: 'Engineering User'
  }
};

export const testProjects = {
  simpleWebApp: {
    vision: 'Build a simple web application with user authentication and basic CRUD operations',
    projectType: 'web_platform',
    expectedNodes: 6,
    expectedDuration: 70
  },
  mobileApp: {
    vision: 'Create a mobile app for task management with real-time sync and push notifications',
    projectType: 'mobile_app',
    expectedNodes: 8,
    expectedDuration: 90
  },
  aiProduct: {
    vision: 'Develop an AI-powered recommendation system with machine learning capabilities',
    projectType: 'ai_product',
    expectedNodes: 10,
    expectedDuration: 120
  }
};

export const testRoadmaps = {
  basicRoadmap: {
    nodes: [
      {
        id: 'n1',
        label: 'Project Setup',
        status: 'pending',
        position: { x: 0, y: 0, z: 0 },
        data: {
          label: 'Project Setup',
          type: 'milestone',
          estimatedDays: 7,
          priority: 'high'
        }
      },
      {
        id: 'n2',
        label: 'Development',
        status: 'pending',
        position: { x: 300, y: 0, z: 0 },
        data: {
          label: 'Development',
          type: 'epic',
          estimatedDays: 21,
          priority: 'medium'
        }
      },
      {
        id: 'n3',
        label: 'Deployment',
        status: 'pending',
        position: { x: 600, y: 0, z: 0 },
        data: {
          label: 'Deployment',
          type: 'milestone',
          estimatedDays: 7,
          priority: 'high'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', type: 'smoothstep' },
      { id: 'e2', source: 'n2', target: 'n3', type: 'smoothstep' }
    ]
  }
};

export const apiEndpoints = {
  auth: {
    login: '/api/auth/login',
    demoToken: '/auth/demo-token',
    validate: '/api/auth/validate'
  },
  roadmaps: {
    list: '/api/roadmaps',
    create: '/api/roadmaps',
    get: (id: string) => `/api/roadmaps/${id}`,
    update: (id: string) => `/api/roadmaps/${id}`,
    delete: (id: string) => `/api/roadmaps/${id}`
  },
  agent: {
    run: '/api/agent/run',
    status: '/api/agent/status'
  }
};

export const selectors = {
  auth: {
    emailInput: '[data-testid="email-input"]',
    passwordInput: '[data-testid="password-input"]',
    loginButton: '[data-testid="login-button"]',
    devLoginButton: '[data-testid="dev-login-button"]',
    logoutButton: '[data-testid="logout-button"]',
    userMenu: '[data-testid="user-menu"]'
  },
  dashboard: {
    canvas: '[data-testid="magic-canvas"]',
    insightsPanel: '[data-testid="insights-panel"]',
    modeToggle: '[data-testid="mode-toggle"]',
    thriveScore: '[data-testid="thrive-score"]',
    deployButton: '[data-testid="deploy-button"]'
  },
  roadmap: {
    visionInput: '[data-testid="vision-input"]',
    projectTypeSelect: '[data-testid="project-type-select"]',
    generateButton: '[data-testid="generate-button"]',
    node: '[data-testid^="node-"]',
    edge: '[data-testid^="edge-"]',
    saveButton: '[data-testid="save-button"]',
    exportButton: '[data-testid="export-button"]'
  },
  notifications: {
    center: '[data-testid="notification-center"]',
    notification: '[data-testid^="notification-"]',
    dismissButton: '[data-testid="dismiss-notification"]',
    clearAllButton: '[data-testid="clear-all-notifications"]'
  },
  agent: {
    analysisButton: '[data-testid="run-analysis-button"]',
    agentSelect: '[data-testid="agent-select"]',
    budgetInput: '[data-testid="budget-input"]',
    taskInput: '[data-testid="task-input"]',
    progressBar: '[data-testid="agent-progress"]',
    results: '[data-testid="agent-results"]'
  }
};

export const mockResponses = {
  auth: {
    success: {
      token: 'mock-jwt-token',
      user: {
        id: 'user-123',
        email: 'test@protothrive.com',
        role: 'vibe_coder'
      },
      expires_in: 3600
    },
    demoToken: {
      token: 'demo-jwt-token'
    }
  },
  roadmap: {
    created: {
      id: 'roadmap-123',
      json_graph: JSON.stringify(testRoadmaps.basicRoadmap),
      thrive_score: 0.75,
      created_at: new Date().toISOString()
    }
  },
  agent: {
    analysis: {
      success: true,
      agent_report: {
        agent: 'enterprise',
        confidence: 0.85,
        cost: { estimate: 0.1, actual: 0.08, consumed: 0.08, remaining: 0.92 },
        fallback_used: false,
        trace: [
          { agent: 'enterprise', success: true, confidence: 0.85, cost: 0.08 }
        ]
      },
      insights: [
        'Project structure looks solid',
        'Consider adding parallel tasks',
        'Timeline appears realistic'
      ]
    }
  }
};

console.log('Thermonuclear E2E: Test fixtures initialized for comprehensive testing');