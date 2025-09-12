import { useEffect, useRef } from 'react';

// Global state to track all active scroll locks
const activeLocks = new Set<string>();
let originalScrollY = 0;
let isLocked = false;

/**
 * Production-ready body scroll lock hook that prevents scroll conflicts
 * between multiple components (sidebar, modals, bottom sheets)
 */
export const useBodyScrollLock = (lockId: string, shouldLock: boolean) => {
  const lockRef = useRef<string>(lockId);

  useEffect(() => {
    const currentLockId = lockRef.current;

    if (shouldLock) {
      // Add this lock to active set
      activeLocks.add(currentLockId);
      
      // Lock body scroll if not already locked
      if (!isLocked) {
        originalScrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${originalScrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        isLocked = true;
      }
    } else {
      // Remove this lock from active set
      activeLocks.delete(currentLockId);
      
      // Unlock body scroll only if no other locks are active
      if (isLocked && activeLocks.size === 0) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, originalScrollY);
        isLocked = false;
      }
    }

    // Cleanup on unmount
    return () => {
      activeLocks.delete(currentLockId);
      if (isLocked && activeLocks.size === 0) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, originalScrollY);
        isLocked = false;
      }
    };
  }, [shouldLock]);

  // Emergency unlock function (for debugging)
  const emergencyUnlock = () => {
    activeLocks.clear();
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    isLocked = false;
  };

  return { emergencyUnlock, activeLockCount: activeLocks.size };
};