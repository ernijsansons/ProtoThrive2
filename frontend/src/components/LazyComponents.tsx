import React, { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

// Loading fallback component
const LoadingFallback: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[200px] bg-gray-900 bg-opacity-50 rounded-lg">
    <div className="text-center">
      <LoadingSpinner />
      <p className="text-white mt-4 text-sm">{message}</p>
    </div>
  </div>
);

// Error boundary for lazy components
class LazyComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="flex items-center justify-center min-h-[200px] bg-red-900 bg-opacity-50 rounded-lg border border-red-500">
    <div className="text-center text-red-200">
      <p className="text-lg font-semibold mb-2">Component failed to load</p>
      <p className="text-sm opacity-75">{error.message}</p>
    </div>
  </div>
);

// Higher-order component for lazy loading with error boundary
export const withLazyLoading = <P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  loadingMessage?: string
) => {
  const LazyComponent = lazy(importFunc);

  return React.forwardRef<any, P>((props, ref) => (
    <LazyComponentErrorBoundary>
      <Suspense fallback={<LoadingFallback message={loadingMessage} />}>
        <LazyComponent {...props} ref={ref} />
      </Suspense>
    </LazyComponentErrorBoundary>
  ));
};

// Lazy loaded heavy components
export const LazyMagicCanvas = withLazyLoading(
  () => import('./MagicCanvas'),
  'Loading interactive canvas...'
);

export const LazySpline3D = withLazyLoading(
  () => import('./Spline3DAccessibility'),
  'Loading 3D scene...'
);

export const LazyReactFlow = withLazyLoading(
  () => import('./ReactFlowAccessibility'),
  'Loading flowchart editor...'
);

export const LazyAnalyticsDashboard = withLazyLoading(
  () => import('./AnalyticsDashboard'),
  'Loading analytics dashboard...'
);

export const LazyPerformanceMonitor = withLazyLoading(
  () => import('./PerformanceMonitor'),
  'Loading performance monitor...'
);

export const LazySecurityDashboard = withLazyLoading(
  () => import('./SecurityDashboard'),
  'Loading security dashboard...'
);

export const LazyTeamManagement = withLazyLoading(
  () => import('./TeamManagement'),
  'Loading team management...'
);

export const LazyWorkspaceSettings = withLazyLoading(
  () => import('./WorkspaceSettings'),
  'Loading workspace settings...'
);

export const LazyInsightsPanel = withLazyLoading(
  () => import('./InsightsPanel'),
  'Loading insights panel...'
);

export const LazyMonitoringDashboard = withLazyLoading(
  () => import('./MonitoringDashboard'),
  'Loading monitoring dashboard...'
);

// Lazy loaded service components
export const LazyAIFeedbackEngine = withLazyLoading(
  () => import('./AIFeedbackEngine'),
  'Loading AI feedback engine...'
);

export const LazyContextualAIAssistant = withLazyLoading(
  () => import('./ContextualAIAssistant'),
  'Loading AI assistant...'
);

export const LazyLiveAIRoadmapGenerator = withLazyLoading(
  () => import('./LiveAIRoadmapGenerator'),
  'Loading AI roadmap generator...'
);

export const LazyProgressPredictionEngine = withLazyLoading(
  () => import('./ProgressPredictionEngine'),
  'Loading progress prediction engine...'
);

export const LazyRealTimeCollaboration = withLazyLoading(
  () => import('./RealTimeCollaboration'),
  'Loading collaboration tools...'
);

export const LazySmartNotificationCenter = withLazyLoading(
  () => import('./SmartNotificationCenter'),
  'Loading notification center...'
);

// Lazy loaded admin components
export const LazyAdminDashboard = withLazyLoading(
  () => import('./AdminDashboard'),
  'Loading admin dashboard...'
);

export const LazyApiKeysManager = withLazyLoading(
  () => import('./ApiKeysManager'),
  'Loading API keys manager...'
);

export const LazyTwoFactorAuth = withLazyLoading(
  () => import('./TwoFactorAuth'),
  'Loading two-factor authentication...'
);

// Lazy loaded integration components
export const LazyIntegrationHub = withLazyLoading(
  () => import('./IntegrationHub'),
  'Loading integration hub...'
);

export const LazyTemplateMatching = withLazyLoading(
  () => import('./TemplateMatching'),
  'Loading template matching...'
);

// Lazy loaded onboarding components
export const LazyBetaOnboarding = withLazyLoading(
  () => import('./BetaOnboarding'),
  'Loading onboarding...'
);

export const LazyOnboardingTutorial = withLazyLoading(
  () => import('./OnboardingTutorial'),
  'Loading tutorial...'
);

// Lazy loaded utility components
export const LazyAdaptiveUICoach = withLazyLoading(
  () => import('./AdaptiveUICoach'),
  'Loading UI coach...'
);

export const LazyEliteSidebar = withLazyLoading(
  () => import('./EliteSidebar'),
  'Loading sidebar...'
);

export const LazyThriveScoreAnalytics = withLazyLoading(
  () => import('./ThriveScoreAnalytics'),
  'Loading thrive score analytics...'
);

// Lazy loaded test components
export const LazyAIVisionInput = withLazyLoading(
  () => import('./AIVisionInput'),
  'Loading AI vision input...'
);

export const LazyBetaFeedback = withLazyLoading(
  () => import('./BetaFeedback'),
  'Loading feedback form...'
);

// Hook for preloading components
export const usePreloadComponent = () => {
  const preloadComponent = React.useCallback((importFunc: () => Promise<any>) => {
    // Preload the component in the background
    importFunc().catch(console.error);
  }, []);

  return { preloadComponent };
};

// Preload critical components on user interaction
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  const criticalComponents = [
    () => import('./MagicCanvas'),
    () => import('./AnalyticsDashboard'),
    () => import('./SmartNotificationCenter')
  ];

  criticalComponents.forEach(importFunc => {
    // Use requestIdleCallback for non-blocking preloading
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => importFunc().catch(console.error));
    } else {
      setTimeout(() => importFunc().catch(console.error), 100);
    }
  });
};

// Intersection observer hook for lazy loading based on visibility
export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

// Component that only renders when visible
export const LazyWhenVisible: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}> = ({ children, fallback = <LoadingFallback />, rootMargin = '50px' }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { rootMargin });

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
};

export default {
  LazyMagicCanvas,
  LazySpline3D,
  LazyReactFlow,
  LazyAnalyticsDashboard,
  LazyPerformanceMonitor,
  LazySecurityDashboard,
  LazyTeamManagement,
  LazyWorkspaceSettings,
  LazyInsightsPanel,
  LazyMonitoringDashboard,
  LazyAIFeedbackEngine,
  LazyContextualAIAssistant,
  LazyLiveAIRoadmapGenerator,
  LazyProgressPredictionEngine,
  LazyRealTimeCollaboration,
  LazySmartNotificationCenter,
  LazyAdminDashboard,
  LazyApiKeysManager,
  LazyTwoFactorAuth,
  LazyIntegrationHub,
  LazyTemplateMatching,
  LazyBetaOnboarding,
  LazyOnboardingTutorial,
  LazyAdaptiveUICoach,
  LazyEliteSidebar,
  LazyThriveScoreAnalytics,
  LazyAIVisionInput,
  LazyBetaFeedback,
  withLazyLoading,
  usePreloadComponent,
  preloadCriticalComponents,
  useIntersectionObserver,
  LazyWhenVisible
};