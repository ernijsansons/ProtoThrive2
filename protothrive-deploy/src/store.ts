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

export const useStore = create<State>((set) => ({
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
  thriveScore: 0.45,
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
  }
}));