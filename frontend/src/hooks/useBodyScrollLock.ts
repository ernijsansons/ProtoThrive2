import { useEffect, useRef } from 'react';

interface ScrollLockOptions {
  /** Unique identifier for this scroll lock instance */
  lockId: string;
  /** Whether the scroll should be locked */
  isLocked: boolean;
  /** Optional callback when lock state changes */
  onLockChange?: (isLocked: boolean) => void;
}

// Global state to track all active scroll locks
let activeLocks = new Set<string>();
let originalBodyStyle: {
  overflow: string;
  position: string;
  width: string;
  top: string;
} | null = null;
let originalScrollY = 0;

/**
 * Shared hook for managing body scroll locking with multiple components
 * Prevents conflicts between different UI elements that need scroll control
 */
export const useBodyScrollLock = ({ 
  lockId, 
  isLocked, 
  onLockChange 
}: ScrollLockOptions) => {
  const lockIdRef = useRef(lockId);
  const wasLockedRef = useRef(false);

  // Update lock ID ref if it changes
  useEffect(() => {
    lockIdRef.current = lockId;
  }, [lockId]);

  // Apply or remove scroll lock based on isLocked state
  useEffect(() => {
    const currentLockId = lockIdRef.current;
    
    if (isLocked && !wasLockedRef.current) {
      // Add this lock to active locks
      activeLocks.add(currentLockId);
      
      // If this is the first lock, save current state and apply lock
      if (activeLocks.size === 1) {
        originalScrollY = window.scrollY;
        originalBodyStyle = {
          overflow: document.body.style.overflow,
          position: document.body.style.position,
          width: document.body.style.width,
          top: document.body.style.top
        };
        
        // Apply scroll lock
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${originalScrollY}px`;
      }
      
      wasLockedRef.current = true;
      onLockChange?.(true);
      
    } else if (!isLocked && wasLockedRef.current) {
      // Remove this lock from active locks
      activeLocks.delete(currentLockId);
      
      // If no more locks are active, restore original state
      if (activeLocks.size === 0 && originalBodyStyle) {
        document.body.style.overflow = originalBodyStyle.overflow;
        document.body.style.position = originalBodyStyle.position;
        document.body.style.width = originalBodyStyle.width;
        document.body.style.top = originalBodyStyle.top;
        
        // Restore scroll position
        window.scrollTo(0, originalScrollY);
        
        originalBodyStyle = null;
        originalScrollY = 0;
      }
      
      wasLockedRef.current = false;
      onLockChange?.(false);
    }
    
    return () => {
      // Cleanup on unmount - remove this lock if it's active
      if (wasLockedRef.current) {
        activeLocks.delete(currentLockId);
        
        // If no more locks are active, restore original state
        if (activeLocks.size === 0 && originalBodyStyle) {
          document.body.style.overflow = originalBodyStyle.overflow;
          document.body.style.position = originalBodyStyle.position;
          document.body.style.width = originalBodyStyle.width;
          document.body.style.top = originalBodyStyle.top;
          
          // Restore scroll position
          window.scrollTo(0, originalScrollY);
          
          originalBodyStyle = null;
          originalScrollY = 0;
        }
      }
    };
  }, [isLocked, onLockChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentLockId = lockIdRef.current;
      if (activeLocks.has(currentLockId)) {
        activeLocks.delete(currentLockId);
        
        // If no more locks are active, restore original state
        if (activeLocks.size === 0 && originalBodyStyle) {
          document.body.style.overflow = originalBodyStyle.overflow;
          document.body.style.position = originalBodyStyle.position;
          document.body.style.width = originalBodyStyle.width;
          document.body.style.top = originalBodyStyle.top;
          
          // Restore scroll position
          window.scrollTo(0, originalScrollY);
          
          originalBodyStyle = null;
          originalScrollY = 0;
        }
      }
    };
  }, []);

  return {
    /** Whether scroll is currently locked by any component */
    isScrollLocked: activeLocks.size > 0,
    /** Number of active scroll locks */
    activeLockCount: activeLocks.size,
    /** Array of all active lock IDs */
    activeLockIds: Array.from(activeLocks),
    /** Whether this specific lock is active */
    isThisLockActive: activeLocks.has(lockIdRef.current)
  };
};

/**
 * Utility function to force unlock all scroll locks (emergency use)
 * Should only be used in error recovery scenarios
 */
export const forceUnlockAllScrollLocks = () => {
  if (originalBodyStyle) {
    document.body.style.overflow = originalBodyStyle.overflow;
    document.body.style.position = originalBodyStyle.position;
    document.body.style.width = originalBodyStyle.width;
    document.body.style.top = originalBodyStyle.top;
    
    // Restore scroll position
    window.scrollTo(0, originalScrollY);
  }
  
  activeLocks.clear();
  originalBodyStyle = null;
  originalScrollY = 0;
};

/**
 * Hook for debugging scroll lock state
 * Only use in development
 */
export const useScrollLockDebug = () => {
  return {
    activeLocks: Array.from(activeLocks),
    activeLockCount: activeLocks.size,
    originalBodyStyle,
    originalScrollY
  };
};