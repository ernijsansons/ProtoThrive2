import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CanvasState {
  thriveScore: number;
  vibeMode: boolean;
  selectedNodeId: string | null;
  updateThriveScore: (score: number) => void;
  setVibeMode: (enabled: boolean) => void;
  setSelectedNode: (nodeId: string | null) => void;
}

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set) => ({
      thriveScore: 0,
      vibeMode: false,
      selectedNodeId: null,
      updateThriveScore: (score) => set({ thriveScore: score }),
      setVibeMode: (enabled) => set({ vibeMode: enabled }),
      setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
    }),
    {
      name: 'canvas-storage',
    }
  )
);