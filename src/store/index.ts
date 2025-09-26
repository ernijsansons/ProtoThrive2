import { create } from 'zustand';

interface Node {
  id: string;
  label: string;
  status: 'gray' | 'neon';
  position: { x: number; y: number; z: number };
}

interface Edge {
  from: string;
  to: string;
}

interface Store {
  nodes: Node[];
  edges: Edge[];
  thriveScore: number;
  vibeMode: boolean;
  toggleMode: () => void;
  loadGraph: (nodes: Node[], edges: Edge[]) => void;
}

export const useStore = create<Store>((set) => ({
  nodes: [
    { id: 'n1', label: 'Start', status: 'gray', position: { x: 0, y: 0, z: 0 } },
    { id: 'n2', label: 'Middle', status: 'gray', position: { x: 100, y: 100, z: 0 } },
    { id: 'n3', label: 'End', status: 'gray', position: { x: 200, y: 200, z: 0 } }
  ],
  edges: [{ from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' }],
  thriveScore: 0.45,
  vibeMode: false,
  toggleMode: () => set((state) => ({ vibeMode: !state.vibeMode })),
  loadGraph: (nodes, edges) => set({ nodes, edges })
}));
