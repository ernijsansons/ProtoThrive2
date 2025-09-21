import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  currentStep: number;
  isFirstVisit: boolean;
  lastCompletedAt: string | null;
}

interface UseOnboardingReturn {
  isOnboardingOpen: boolean;
  shouldShowOnboarding: boolean;
  onboardingState: OnboardingState;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  closeOnboarding: () => void;
  resetOnboarding: () => void;
  markStepComplete: (step: number) => void;
}

const ONBOARDING_STORAGE_KEY = 'protothrive-onboarding';
const ONBOARDING_VERSION = '1.0';

export const useOnboarding = (): UseOnboardingReturn => {
  const { user, isAuthenticated } = useAuth();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    hasCompletedOnboarding: false,
    currentStep: 0,
    isFirstVisit: true,
    lastCompletedAt: null
  });

  // Load onboarding state from localStorage
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const stored = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Check if onboarding version matches (reset if outdated)
        if (parsed.version !== ONBOARDING_VERSION) {
          resetOnboardingState();
          return;
        }

        setOnboardingState(parsed.state);
      } catch (error) {
        console.warn('Failed to parse onboarding state:', error);
        resetOnboardingState();
      }
    } else {
      // First time user - set up initial state
      const initialState: OnboardingState = {
        hasCompletedOnboarding: false,
        currentStep: 0,
        isFirstVisit: true,
        lastCompletedAt: null
      };

      setOnboardingState(initialState);
      saveOnboardingState(initialState);
    }
  }, [isAuthenticated, user]);

  // Auto-start onboarding for new users
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      onboardingState.isFirstVisit &&
      !onboardingState.hasCompletedOnboarding
    ) {
      // Delay to allow the dashboard to load first
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);

        // Mark as no longer first visit
        const updatedState = { ...onboardingState, isFirstVisit: false };
        setOnboardingState(updatedState);
        saveOnboardingState(updatedState);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, onboardingState.isFirstVisit, onboardingState.hasCompletedOnboarding]);

  const saveOnboardingState = (state: OnboardingState) => {
    if (!user) return;

    const toSave = {
      version: ONBOARDING_VERSION,
      state,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`${ONBOARDING_STORAGE_KEY}-${user.id}`, JSON.stringify(toSave));
  };

  const resetOnboardingState = () => {
    const initialState: OnboardingState = {
      hasCompletedOnboarding: false,
      currentStep: 0,
      isFirstVisit: true,
      lastCompletedAt: null
    };

    setOnboardingState(initialState);
    saveOnboardingState(initialState);
  };

  const startOnboarding = () => {
    setIsOnboardingOpen(true);

    // Track onboarding start
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_started', {
        event_category: 'engagement',
        event_label: 'user_onboarding'
      });
    }
  };

  const completeOnboarding = () => {
    const completedState: OnboardingState = {
      ...onboardingState,
      hasCompletedOnboarding: true,
      lastCompletedAt: new Date().toISOString()
    };

    setOnboardingState(completedState);
    saveOnboardingState(completedState);
    setIsOnboardingOpen(false);

    // Track onboarding completion
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_completed', {
        event_category: 'engagement',
        event_label: 'user_onboarding',
        value: 1
      });
    }

    // Show completion celebration
    setTimeout(() => {
      showCompletionToast();
    }, 500);
  };

  const closeOnboarding = () => {
    setIsOnboardingOpen(false);

    // Update state to mark as closed (but not completed)
    const updatedState = { ...onboardingState, isFirstVisit: false };
    setOnboardingState(updatedState);
    saveOnboardingState(updatedState);

    // Track onboarding skip
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_skipped', {
        event_category: 'engagement',
        event_label: 'user_onboarding',
        step: onboardingState.currentStep
      });
    }
  };

  const resetOnboarding = () => {
    resetOnboardingState();
    setIsOnboardingOpen(false);
  };

  const markStepComplete = (step: number) => {
    const updatedState = {
      ...onboardingState,
      currentStep: Math.max(onboardingState.currentStep, step)
    };

    setOnboardingState(updatedState);
    saveOnboardingState(updatedState);

    // Track step completion
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_step_completed', {
        event_category: 'engagement',
        event_label: 'user_onboarding',
        step: step
      });
    }
  };

  const showCompletionToast = () => {
    // Create and show a success toast
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-4 rounded-lg shadow-lg z-[10000] transform transition-all duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <svg class="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <div>
          <div class="font-semibold">Onboarding Complete!</div>
          <div class="text-sm opacity-90">You're ready to start building amazing prototypes!</div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);

    // Remove after delay
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);
  };

  const shouldShowOnboarding =
    isAuthenticated &&
    !onboardingState.hasCompletedOnboarding &&
    !isOnboardingOpen;

  return {
    isOnboardingOpen,
    shouldShowOnboarding,
    onboardingState,
    startOnboarding,
    completeOnboarding,
    closeOnboarding,
    resetOnboarding,
    markStepComplete
  };
};

// Helper hook for onboarding tutorial targets
export const useOnboardingTarget = (targetId: string) => {
  useEffect(() => {
    // Add data attribute for onboarding targeting
    const element = document.querySelector(`[data-tutorial="${targetId}"]`);
    if (!element) {
      // If no element found, try to find by ID or class
      const fallbackElement = document.getElementById(targetId) ||
                             document.querySelector(`.${targetId}`);

      if (fallbackElement) {
        fallbackElement.setAttribute('data-tutorial', targetId);
      }
    }
  }, [targetId]);
};

// Onboarding progress tracking
export const useOnboardingProgress = () => {
  const { onboardingState } = useOnboarding();

  const getProgressPercentage = () => {
    if (onboardingState.hasCompletedOnboarding) return 100;
    return Math.round((onboardingState.currentStep / 6) * 100); // Assuming 6 total steps
  };

  const getProgressMessage = () => {
    if (onboardingState.hasCompletedOnboarding) {
      return "You've completed the onboarding! 🎉";
    }

    const messages = [
      "Just getting started! 🌟",
      "Learning the basics! 📚",
      "Making great progress! 🚀",
      "Almost there! 💪",
      "You're a pro now! ⭐",
      "Ready to launch! 🎯"
    ];

    return messages[Math.min(onboardingState.currentStep, messages.length - 1)];
  };

  return {
    progressPercentage: getProgressPercentage(),
    progressMessage: getProgressMessage(),
    isComplete: onboardingState.hasCompletedOnboarding,
    currentStep: onboardingState.currentStep
  };
};