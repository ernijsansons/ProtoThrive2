import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import { debounce } from 'lodash';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface AutoSaveOptions {
  interval?: number; // milliseconds
  debounceDelay?: number; // milliseconds
  onSave?: () => void;
  onError?: (error: Error) => void;
}

export const useAutoSave = (options: AutoSaveOptions = {}) => {
  const {
    interval = 30000, // Default 30 seconds
    debounceDelay = 3000, // Default 3 seconds debounce
    onSave,
    onError
  } = options;

  const { isAuthenticated } = useAuth();
  const {
    nodes,
    edges,
    thriveScore,
    currentRoadmapId,
    updateScore
  } = useStore();

  const lastSavedRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout>();

  // Create a serialized version of the current state for comparison
  const getCurrentStateHash = useCallback(() => {
    return JSON.stringify({
      nodes,
      edges,
      thriveScore
    });
  }, [nodes, edges, thriveScore]);

  // Save function that calls the API
  const saveRoadmap = useCallback(async () => {
    if (!isAuthenticated || !currentRoadmapId || isSavingRef.current) {
      return;
    }

    const currentHash = getCurrentStateHash();

    // Skip if nothing has changed
    if (currentHash === lastSavedRef.current) {
      return;
    }

    isSavingRef.current = true;

    try {
      const graphData = {
        nodes,
        edges
      };

      const response = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/api/roadmaps/${currentRoadmapId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json_graph: JSON.stringify(graphData),
            thrive_score: thriveScore,
            status: 'draft'
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save: ${response.statusText}`);
      }

      const data = await response.json();

      // Update the last saved hash
      lastSavedRef.current = currentHash;

      // Update thrive score if returned from server
      if (data.thrive_score !== undefined) {
        updateScore(data.thrive_score);
      }

      console.log('Auto-save successful:', new Date().toISOString());
      onSave?.();
    } catch (error) {
      console.error('Auto-save failed:', error);
      onError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [isAuthenticated, currentRoadmapId, nodes, edges, thriveScore, getCurrentStateHash, updateScore, onSave, onError]);

  // Debounced save function for immediate changes
  const debouncedSave = useRef(
    debounce(saveRoadmap, debounceDelay)
  ).current;

  // Set up auto-save interval
  useEffect(() => {
    if (!isAuthenticated || !currentRoadmapId) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up new interval
    autoSaveTimerRef.current = setInterval(() => {
      saveRoadmap();
    }, interval);

    // Cleanup on unmount or dependency change
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [isAuthenticated, currentRoadmapId, interval, saveRoadmap]);

  // Watch for changes and trigger debounced save
  useEffect(() => {
    if (!isAuthenticated || !currentRoadmapId) {
      return;
    }

    // Trigger debounced save on change
    debouncedSave();

    // Cleanup
    return () => {
      debouncedSave.cancel();
    };
  }, [nodes, edges, thriveScore, debouncedSave, isAuthenticated, currentRoadmapId]);

  // Save on window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const currentHash = getCurrentStateHash();

      // Only show warning if there are unsaved changes
      if (currentHash !== lastSavedRef.current && !isSavingRef.current) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';

        // Try to save before leaving
        saveRoadmap();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [getCurrentStateHash, saveRoadmap]);

  // Manual save function
  const manualSave = useCallback(async () => {
    await saveRoadmap();
  }, [saveRoadmap]);

  return {
    isSaving: isSavingRef.current,
    manualSave,
    lastSaved: lastSavedRef.current ? new Date() : null
  };
};