/**
 * @fileoverview ProtoThrive Simple Store - Minimal state management
 * Emergency build-compatible version
 */

import { create } from 'zustand';

interface AppState {
  // UI state
  mode: string;

  // Auth state
  isAuthenticated: boolean;
  user: any;

  // Actions
  toggleMode: () => void;
  login: (user: any) => void;
  logout: () => void;
  fetchRoadmap: (id: string) => void;
  triggerDeploy: () => void;
  handleSave: () => void;
  handleExport: () => void;
  handleShare: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  mode: '2d',
  isAuthenticated: false,
  user: null,

  // Actions
  toggleMode: () => set((state) => ({ mode: state.mode === '2d' ? '3d' : '2d' })),

  login: (user) => set({ isAuthenticated: true, user }),

  logout: () => set({ isAuthenticated: false, user: null }),

  fetchRoadmap: (id) => {
    console.log('Fetching roadmap:', id);
  },

  triggerDeploy: () => {
    console.log('Triggering deployment');
  },

  handleSave: () => {
    console.log('Saving');
  },

  handleExport: () => {
    console.log('Exporting');
  },

  handleShare: () => {
    console.log('Sharing');
  }
}));