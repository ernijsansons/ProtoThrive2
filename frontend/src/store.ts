// Ref: CLAUDE.md Phase 2 - Store with exact Zustand interfaces
import { create } from 'zustand';
import { authService } from './services/auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface Node {
  id: string;
  label: string;
  status: 'gray' | 'neon';
  position: {
    x: number;
    y: number;
    z: number;
  };
  type?: string;
  data?: {
    label: string;
    status: string;
  };
}

interface Edge {
  from: string;
  to: string;
  id?: string;
  source?: string;
  target?: string;
  type?: string;
  data?: {
    label: string;
  };
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  message: string;
  timestamp: Date;
  typing?: boolean;
}

interface ProjectMetrics {
  completionRate: number;
  agentActivity: number;
  timeTracking: {
    totalTime: number;
    todayTime: number;
    activeTime: number;
  };
  teamCollaboration: {
    activeMembers: number;
    totalMembers: number;
    lastSync: Date;
  };
  productivity: {
    tasksCompleted: number;
    tasksInProgress: number;
    blockers: number;
  };
}

interface AgentReport {
  agent: string;
  confidence: number;
  cost: {
    estimate: number;
    actual: number;
    consumed: number;
    remaining: number;
  };
  fallback_used: boolean;
  trace: Array<{
    agent: string;
    success: boolean;
    confidence: number;
    cost: number;
    error?: string;
  }>;
  error?: string;
}

interface AnalysisHistoryEntry {
  id: string;
  timestamp: Date;
  agent: string;
  confidence: number;
  cost: number;
  success: boolean;
  fallbackUsed: boolean;
  duration: number; // in seconds
}

interface AgentConfig {
  selectedAgent: 'enterprise' | 'lightweight' | 'auto';
  budget: number;
  maxBudget: number;
  confidenceThreshold: number;
  mode: 'fallback' | 'direct' | 'parallel';
  task: string;
  enableFallback: boolean;
  enableParallel: boolean;
  customPrompts: boolean;
}

interface AgentStatus {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: string;
  progress: number;
  estimatedTime: number;
  actualCost: number;
  remainingBudget: number;
  agentName: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export type DeploymentStatus = 'ready' | 'building' | 'deployed' | 'error';
export type SystemStatus = 'healthy' | 'warning' | 'error' | 'offline';

interface SystemStatusData {
  canvas: SystemStatus;
  aiAgents: SystemStatus;
  database: SystemStatus;
  overall: SystemStatus;
}

interface BuildInfo {
  version: string;
  lastUpdated: Date;
  deploymentUrl?: string;
  buildId?: string;
}

interface FooterState {
  deploymentStatus: DeploymentStatus;
  isDeploying: boolean;
  deployProgress: number;
  systemStatus: SystemStatusData;
  buildInfo: BuildInfo;
  showBuildInfo: boolean;
}

interface InsightsPanelState {
  isExpanded: boolean;
  position: 'sidebar' | 'bottom';
  activeTab: 'overview' | 'chat' | 'metrics' | 'activity' | 'history' | 'controls';
  chatHistory: ChatMessage[];
  metrics: ProjectMetrics;
  isTyping: boolean;
}

interface State {
  nodes: Node[];
  edges: Edge[];
  mode: '2d' | '3d';
  thriveScore: number;
  insightsPanel: InsightsPanelState;
  footer: FooterState;
  agentReport: AgentReport | null;
  currentRoadmapId: string | null;
  analysisHistory: AnalysisHistoryEntry[];
  agentConfig: AgentConfig;
  agentStatus: AgentStatus;
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
  toggleMode: () => void;
  updateScore: (score: number) => void;
  fetchRoadmap: (id: string) => void;
  toggleInsightsPanel: () => void;
  setInsightsPanelPosition: (position: 'sidebar' | 'bottom') => void;
  setInsightsPanelTab: (tab: 'overview' | 'chat' | 'metrics' | 'activity' | 'history' | 'controls') => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setAgentTyping: (typing: boolean) => void;
  updateMetrics: (metrics: Partial<ProjectMetrics>) => void;
  // Agent analysis actions
  runAgentAnalysis: (roadmapId: string, overrides?: { task?: string; budget?: number; mode?: string }) => Promise<void>;
  setAgentReport: (report: AgentReport | null) => void;
  setCurrentRoadmapId: (id: string | null) => void;
  addAnalysisHistoryEntry: (entry: Omit<AnalysisHistoryEntry, 'id' | 'timestamp'>) => void;
  removeAnalysisHistoryEntry: (id: string) => void;
  clearAnalysisHistory: () => void;
  // Agent control actions
  updateAgentConfig: (config: Partial<AgentConfig>) => void;
  updateAgentStatus: (status: Partial<AgentStatus>) => void;
  startAgentAnalysis: () => void;
  pauseAgentAnalysis: () => void;
  stopAgentAnalysis: () => void;
  resetAgentConfig: () => void;
  // Footer actions
  setDeploymentStatus: (status: DeploymentStatus) => void;
  setDeployProgress: (progress: number) => void;
  updateSystemStatus: (status: Partial<SystemStatusData>) => void;
  toggleBuildInfo: () => void;
  triggerDeploy: () => Promise<void>;
  handleSave: () => void;
  handleExport: () => void;
  handleShare: () => void;
  createRoadmap: (roadmap: { name: string }, token: string) => void;
  isLoading: boolean;
  error: string | null;
  userRole: string | null;
  setUserRole: (role: string) => void;
}

export const useStore = create<State>((set, get) => ({
  nodes: [
    {id: 'n1', label: 'Thermo Start', status: 'gray', position: {x: 0, y: 0, z: 0}},
    {id: 'n2', label: 'Middle', status: 'gray', position: {x: 100, y: 100, z: 0}},
    {id: 'n3', label: 'End', status: 'gray', position: {x: 200, y: 200, z: 0}}
  ],
  edges: [
    {from: 'n1', to: 'n2'},
    {from: 'n2', to: 'n3'}
  ],
  mode: '2d',
  thriveScore: 0.73,
  footer: {
    deploymentStatus: 'ready',
    isDeploying: false,
    deployProgress: 0,
    systemStatus: {
      canvas: 'healthy',
      aiAgents: 'healthy',
      database: 'healthy',
      overall: 'healthy'
    },
    buildInfo: {
      version: '2.1.0',
      lastUpdated: new Date(Date.now() - 300000),
      deploymentUrl: 'https://protothrive-elite.vercel.app',
      buildId: 'pb-2024-09-12-1430'
    },
    showBuildInfo: false
  },
  insightsPanel: {
    isExpanded: true,
    position: 'sidebar',
    activeTab: 'overview',
    chatHistory: [
      {
        id: '1',
        sender: 'agent',
        message: 'Welcome to ProtoThrive! I\'m here to help you build amazing projects. How can I assist you today?',
        timestamp: new Date(Date.now() - 300000)
      },
      {
        id: '2',
        sender: 'user',
        message: 'I\'d like to create a new roadmap for my SaaS project',
        timestamp: new Date(Date.now() - 240000)
      },
      {
        id: '3',
        sender: 'agent',
        message: 'Excellent! I\'ll help you create a comprehensive roadmap. Let\'s start by defining your key milestones and objectives.',
        timestamp: new Date(Date.now() - 180000)
      }
    ],
    metrics: {
      completionRate: 73,
      agentActivity: 89,
      timeTracking: {
        totalTime: 12.5,
        todayTime: 3.2,
        activeTime: 1.8
      },
      teamCollaboration: {
        activeMembers: 3,
        totalMembers: 5,
        lastSync: new Date(Date.now() - 120000)
      },
      productivity: {
        tasksCompleted: 28,
        tasksInProgress: 12,
        blockers: 2
      }
    },
    isTyping: false
  },
  isLoading: false,
  error: null,
  userRole: null,
  agentReport: null,
  currentRoadmapId: null,
  analysisHistory: [],
  agentConfig: {
    selectedAgent: 'auto',
    budget: 0.5,
    maxBudget: 1.0,
    confidenceThreshold: 0.8,
    mode: 'fallback',
    task: 'Analyze this roadmap and provide comprehensive insights',
    enableFallback: true,
    enableParallel: false,
    customPrompts: false
  },
  agentStatus: {
    isRunning: false,
    isPaused: false,
    currentStep: 'Ready',
    progress: 0,
    estimatedTime: 0,
    actualCost: 0,
    remainingBudget: 1.0,
    agentName: 'Auto Selection',
    confidence: 0,
    success: false
  },
  setUserRole: (role) => set({ userRole: role }),
  loadGraph: (nodes, edges) => {
    console.log('Thermonuclear LoadGraph - Nodes:', nodes.length, 'Edges:', edges.length);
    set({ nodes, edges });
  },
  toggleMode: () => {
    console.log('Thermonuclear Mode Toggled');
    set((state) => ({ mode: state.mode === '2d' ? '3d' : '2d' }));
  },
  updateScore: (score) => {
    console.log('Thermonuclear Score Updated:', score);
    set({ thriveScore: score });
  },
  fetchRoadmap: async (roadmapId: string, token?: string) => {
    set({ isLoading: true, error: null, currentRoadmapId: roadmapId });
    console.log('Thermonuclear Fetching Roadmap:', roadmapId);
    try {
      // Use authentication service for API calls
      const response = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/api/roadmaps/${roadmapId}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const graphData = typeof data.json_graph === 'string' ? JSON.parse(data.json_graph) : data.json_graph || {};
      const nodes = Array.isArray(graphData.nodes) ? graphData.nodes : [];
      const edges = Array.isArray(graphData.edges) ? graphData.edges : [];
      get().loadGraph(nodes, edges);
      if (typeof data.thrive_score === 'number') {
        get().updateScore(data.thrive_score);
      }
      if (data.user?.role) {
        set({ userRole: data.user.role });
      }
      if (data.agent_report) {
        get().setAgentReport(data.agent_report);
      }
      console.log('Thermonuclear Roadmap fetched successfully:', data);
    } catch (error: any) {
      console.error('Thermonuclear Error fetching roadmap:', error);
      set({ error: error.message || 'Failed to fetch roadmap' });
      get().loadGraph(
        [
          { id: 'n1', label: 'Thermo Start (Error)', status: 'gray', position: { x: 0, y: 0, z: 0 } },
          { id: 'n2', label: 'Middle (Error)', status: 'gray', position: { x: 100, y: 100, z: 0 } },
          { id: 'n3', label: 'End (Error)', status: 'gray', position: { x: 200, y: 200, z: 0 } },
        ],
        []
      );
    } finally {
      set({ isLoading: false });
    }
  },
  toggleInsightsPanel: () => {
    set((state) => ({
      insightsPanel: {
        ...state.insightsPanel,
        isExpanded: !state.insightsPanel.isExpanded
      }
    }));
  },
  setInsightsPanelPosition: (position) => {
    set((state) => ({
      insightsPanel: {
        ...state.insightsPanel,
        position
      }
    }));
  },
  setInsightsPanelTab: (tab) => {
    set((state) => ({
      insightsPanel: {
        ...state.insightsPanel,
        activeTab: tab
      }
    }));
  },
  addChatMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    set((state) => ({
      insightsPanel: {
        ...state.insightsPanel,
        chatHistory: [...state.insightsPanel.chatHistory, newMessage]
      }
    }));
  },
  setAgentTyping: (typing) => {
    set((state) => ({
      insightsPanel: {
        ...state.insightsPanel,
        isTyping: typing
      }
    }));
  },
  updateMetrics: (metrics) => {
    set((state) => ({
      insightsPanel: {
        ...state.insightsPanel,
        metrics: {
          ...state.insightsPanel.metrics,
          ...metrics
        }
      }
    }));
  },
  // Footer actions
  setDeploymentStatus: (status) => {
    set((state) => ({
      footer: {
        ...state.footer,
        deploymentStatus: status
      }
    }));
  },
  setDeployProgress: (progress) => {
    set((state) => ({
      footer: {
        ...state.footer,
        deployProgress: progress
      }
    }));
  },
  updateSystemStatus: (status) => {
    set((state) => ({
      footer: {
        ...state.footer,
        systemStatus: {
          ...state.footer.systemStatus,
          ...status
        }
      }
    }));
  },
  toggleBuildInfo: () => {
    set((state) => ({
      footer: {
        ...state.footer,
        showBuildInfo: !state.footer.showBuildInfo
      }
    }));
  },
  triggerDeploy: async () => {
    const { setDeploymentStatus, setDeployProgress } = get();
    
    console.log('Thermonuclear Deploy Started');
    setDeploymentStatus('building');
    set((state) => ({ footer: { ...state.footer, isDeploying: true } }));
    
    // Simulate deployment progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setDeployProgress(i);
    }
    
    setDeploymentStatus('deployed');
    set((state) => ({ footer: { ...state.footer, isDeploying: false } }));
    
    // Reset to ready after 3 seconds
    setTimeout(() => {
      setDeploymentStatus('ready');
    }, 3000);
  },
  handleSave: () => {
    console.log('Thermonuclear Save Action');
    // Add save logic here
  },
  handleExport: () => {
    console.log('Thermonuclear Export Action');
    // Add export logic here
  },
  handleShare: () => {
    console.log('Thermonuclear Share Action');
    // Add share logic here
  },
  createRoadmap: async (roadmap: { name: string }, token: string) => {
    set({ isLoading: true, error: null });
    console.log("Creating roadmap:", roadmap);
    try {
      const response = await fetch(`${BASE_URL}/api/roadmaps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(roadmap),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Roadmap created successfully:", data);
      // Optionally, you can fetch the roadmaps again to update the list
      // get().fetchRoadmaps();
    } catch (error: any) {
      console.error("Error creating roadmap:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  setAgentReport: (report) => {
    console.log('Thermonuclear Agent Report Updated:', report);
    set({ agentReport: report });
  },
  setCurrentRoadmapId: (id) => {
    console.log('Thermonuclear Current Roadmap ID Updated:', id);
    set({ currentRoadmapId: id });
  },
  runAgentAnalysis: async (roadmapId: string, overrides = {}) => {
    set({ isLoading: true, error: null });
    console.log('Thermonuclear Running Agent Analysis:', roadmapId, overrides);
    try {
      const response = await fetch(`${BASE_URL}/api/agent/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task: overrides.task || 'Analyze this roadmap and provide insights',
          budget: overrides.budget,
          mode: overrides.mode,
          roadmap_id: roadmapId
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Thermonuclear Agent Analysis completed:', data);
      
      // Store the agent report
      if (data.agent_report) {
        get().setAgentReport(data.agent_report);
        
        // Add to analysis history
        get().addAnalysisHistoryEntry({
          agent: data.agent_report.agent,
          confidence: data.agent_report.confidence,
          cost: data.agent_report.cost.actual,
          success: true,
          fallbackUsed: data.agent_report.fallback_used,
          duration: 3 // Mock duration for now
        });
      } else {
        // If no agent_report in response, create one from the outcome
        const report: AgentReport = {
          agent: data.result?.agent || 'unknown',
          confidence: data.result?.confidence || 0,
          cost: {
            estimate: data.result?.cost_estimate || 0,
            actual: data.result?.cost_actual || 0,
            consumed: data.budget_consumed || 0,
            remaining: data.budget_remaining || 0,
          },
          fallback_used: data.fallback_used || false,
          trace: data.trace || [],
          error: data.error
        };
        get().setAgentReport(report);
        
        // Add to analysis history
        get().addAnalysisHistoryEntry({
          agent: report.agent,
          confidence: report.confidence,
          cost: report.cost.actual,
          success: !report.error,
          fallbackUsed: report.fallback_used,
          duration: 3 // Mock duration for now
        });
      }
    } catch (error: any) {
      console.error('Thermonuclear Error running agent analysis:', error);
      set({ error: error.message || 'Failed to run agent analysis' });
      
      // Set error in agent report
      const errorReport: AgentReport = {
        agent: 'error',
        confidence: 0,
        cost: { estimate: 0, actual: 0, consumed: 0, remaining: 0 },
        fallback_used: false,
        trace: [],
        error: error.message || 'Failed to run agent analysis'
      };
      get().setAgentReport(errorReport);
      
      // Add error to analysis history
      get().addAnalysisHistoryEntry({
        agent: 'error',
        confidence: 0,
        cost: 0,
        success: false,
        fallbackUsed: false,
        duration: 0
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // Analysis history actions
  addAnalysisHistoryEntry: (entry) => {
    const newEntry: AnalysisHistoryEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    set(state => ({ 
      analysisHistory: [newEntry, ...state.analysisHistory].slice(0, 50) // Keep last 50 entries
    }));
  },

  removeAnalysisHistoryEntry: (id) => {
    set(state => ({
      analysisHistory: state.analysisHistory.filter(entry => entry.id !== id)
    }));
  },

  clearAnalysisHistory: () => {
    set({ analysisHistory: [] });
  },

  // Agent control actions
  updateAgentConfig: (config) => {
    set(state => ({
      agentConfig: { ...state.agentConfig, ...config }
    }));
  },

  updateAgentStatus: (status) => {
    set(state => ({
      agentStatus: { ...state.agentStatus, ...status }
    }));
  },

  startAgentAnalysis: () => {
    set(state => ({
      agentStatus: {
        ...state.agentStatus,
        isRunning: true,
        isPaused: false,
        currentStep: 'Initializing analysis...',
        progress: 0,
        error: undefined
      }
    }));
  },

  pauseAgentAnalysis: () => {
    set(state => ({
      agentStatus: {
        ...state.agentStatus,
        isRunning: false,
        isPaused: true,
        currentStep: 'Paused'
      }
    }));
  },

  stopAgentAnalysis: () => {
    set(state => ({
      agentStatus: {
        ...state.agentStatus,
        isRunning: false,
        isPaused: false,
        currentStep: 'Stopped',
        progress: 0
      }
    }));
  },

  resetAgentConfig: () => {
    set({
      agentConfig: {
        selectedAgent: 'auto',
        budget: 0.5,
        maxBudget: 1.0,
        confidenceThreshold: 0.8,
        mode: 'fallback',
        task: 'Analyze this roadmap and provide comprehensive insights',
        enableFallback: true,
        enableParallel: false,
        customPrompts: false
      },
      agentStatus: {
        isRunning: false,
        isPaused: false,
        currentStep: 'Ready',
        progress: 0,
        estimatedTime: 0,
        actualCost: 0,
        remainingBudget: 1.0,
        agentName: 'Auto Selection',
        confidence: 0,
        success: false
      }
    });
  }
}));

