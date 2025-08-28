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

interface State {
  nodes: Node[];
  edges: Edge[];
  mode: '2d' | '3d';
  thriveScore: number;
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
  toggleMode: () => void;
  updateScore: (score: number) => void;
}

export const useStore = create<State>((set, get) => ({
  nodes: [],
  edges: [],
  mode: '2d',
  thriveScore: 0,
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
  fetchRoadmap: async (roadmapId: string) => {
    console.log(`Thermonuclear Fetching Roadmap: ${roadmapId}`);
    try {
      // In a real application, you would fetch from your backend API
      // For now, we'll use a mock fetch or dummy data
      const response = await fetch(`/api/roadmaps/${roadmapId}`, {
        headers: {
          'Authorization': 'Bearer uuid-thermo-1.mock-jwt-token' // Mock JWT token
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Assuming data.json_graph is a stringified JSON of nodes and edges
      const graphData = JSON.parse(data.json_graph);
      get().loadGraph(graphData.nodes, graphData.edges);
      get().updateScore(data.thrive_score);
      console.log('Thermonuclear Roadmap fetched successfully:', data);
    } catch (error) {
      console.error('Thermonuclear Error fetching roadmap:', error);
      // Load dummy data on error for development purposes
      get().loadGraph(
        [
          {id: 'n1', label: 'Thermo Start (Error)', status: 'gray', position: {x: 0, y: 0, z: 0}},
          {id: 'n2', label: 'Middle (Error)', status: 'gray', position: {x: 100, y: 100, z: 0}},
          {id: 'n3', label: 'End (Error)', status: 'gray', position: {x: 200, y: 200, z: 0}}
        ],
        [
          {from: 'n1', to: 'n2'},
          {from: 'n2', to: 'n3'}
        ]
      );
      get().updateScore(0.1); // Low score on error
    }
  }
}));