// Ref: CLAUDE.md Phase 2 - Store with exact Zustand interfaces
import { create } from 'zustand';

interface Node {
  id: string;
  label: string;
  status: 'gray' | 'neon';
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface Edge {
  from: string;
  to: string;
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

interface InsightsPanelState {
  isExpanded: boolean;
  position: 'sidebar' | 'bottom';
  activeTab: 'overview' | 'chat' | 'metrics' | 'activity';
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
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
  toggleMode: () => void;
  updateScore: (score: number) => void;
  fetchRoadmap: (id: string) => void;
  toggleInsightsPanel: () => void;
  setInsightsPanelPosition: (position: 'sidebar' | 'bottom') => void;
  setInsightsPanelTab: (tab: 'overview' | 'chat' | 'metrics' | 'activity') => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setAgentTyping: (typing: boolean) => void;
  updateMetrics: (metrics: Partial<ProjectMetrics>) => void;
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
  fetchRoadmap: (id) => {
    console.log('Thermonuclear Fetch Roadmap:', id);
    // Mock fetch implementation for now
    // In a real app, this would fetch from the backend API
    // For now, just update the score to show it's working
    set({ thriveScore: Math.random() * 1.0 });
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
  }
}));