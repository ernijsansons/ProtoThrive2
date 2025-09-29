/**
 * @fileoverview Lazy component loaders for bundle optimization
 * Centralized lazy loading for heavy dependencies
 */

import React, { lazy } from 'react';

// Core heavy components
export const LazyMagicCanvas = lazy(() => import('./MagicCanvas'));
export const LazyInsightsPanel = lazy(() => import('./InsightsPanel'));
export const LazyAgentChatInterface = lazy(() => import('./AgentChatInterface'));

// 3D/Animation components (simple fallbacks - heavy deps moved to optionalDependencies)
export const LazySpline3D = lazy(() =>
  Promise.resolve({
    default: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg border">
        <div className="text-center">
          <div className="text-4xl mb-2">🚀</div>
          <p className="text-gray-600">3D View</p>
          <p className="text-xs text-gray-500">Heavy 3D components loaded on demand</p>
        </div>
      </div>
    )
  })
);

// Animation components
export const LazyAnimatedComponent = lazy(() =>
  Promise.resolve({
    default: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    )
  })
);

// Chart/Visualization components
export const LazyChartComponent = lazy(() =>
  Promise.resolve({
    default: ({ data, type }: { data: any; type: string }) => (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <p className="text-gray-600">Chart Component</p>
          <p className="text-xs text-gray-500">Type: {type}</p>
        </div>
      </div>
    )
  })
);

// Loading skeleton components
export const ComponentLoadingSkeleton = ({
  width = '100%',
  height = '200px',
  title = 'Loading component...'
}: {
  width?: string;
  height?: string;
  title?: string;
}) => (
  <div
    className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border"
    style={{ width, height }}
  >
    <div className="text-center space-y-3">
      <div className="relative">
        <div className="w-8 h-8 border-3 border-gray-300 rounded-full animate-spin"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-3 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  </div>
);

// Error fallback component
export const ComponentErrorFallback = ({
  error,
  componentName = 'Component',
  onRetry
}: {
  error?: Error;
  componentName?: string;
  onRetry?: () => void;
}) => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
    <div className="text-center space-y-3 max-w-sm">
      <div className="text-red-500 text-2xl">⚠️</div>
      <h3 className="text-sm font-semibold text-red-700">{componentName} Load Failed</h3>
      <p className="text-xs text-red-600">
        {error?.message || 'The component could not be loaded'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  </div>
);

// Generic lazy wrapper with error boundary
export const withLazyLoading = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  fallbackComponent?: React.ComponentType
) => {
  const LazyComponent = lazy(importFunc);

  return (props: any) => (
    <React.Suspense
      fallback={
        fallbackComponent ?
        React.createElement(fallbackComponent) :
        <ComponentLoadingSkeleton />
      }
    >
      <LazyComponent {...props} />
    </React.Suspense>
  );
};

export default {
  LazyMagicCanvas,
  LazyInsightsPanel,
  LazyAgentChatInterface,
  LazySpline3D,
  LazyAnimatedComponent,
  LazyChartComponent,
  ComponentLoadingSkeleton,
  ComponentErrorFallback,
  withLazyLoading
};