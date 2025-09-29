/**
 * @fileoverview Lazy-loaded MagicCanvas wrapper for bundle optimization
 * Reduces initial bundle size by loading heavy dependencies on-demand
 */

import React, { Suspense, lazy } from 'react';
import { Node, Edge } from 'reactflow';

// Lazy load the heavy MagicCanvas component
const MagicCanvasComponent = lazy(() => import('./MagicCanvas'));

interface LazyMagicCanvasProps {
  projectId?: string;
  readOnly?: boolean;
  onSave?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  initialData?: { nodes: Node[]; edges: Edge[] };
}

/**
 * Loading skeleton for MagicCanvas
 */
const CanvasLoadingSkeleton: React.FC = () => (
  <div className="w-full h-full relative bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Loading animation */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">Loading Canvas</h3>
          <p className="text-sm text-gray-500">Initializing visual roadmap builder...</p>
        </div>

        {/* Feature preview skeleton */}
        <div className="max-w-md mx-auto mt-8 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-purple-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-200 rounded-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Skeleton panels */}
    <div className="absolute top-4 left-4">
      <div className="w-48 h-32 bg-white/80 rounded-lg shadow-lg animate-pulse"></div>
    </div>

    <div className="absolute bottom-4 right-4">
      <div className="w-80 h-48 bg-white/80 rounded-lg shadow-lg animate-pulse"></div>
    </div>

    <div className="absolute bottom-4 left-4">
      <div className="w-32 h-20 bg-white/80 rounded-lg shadow-lg animate-pulse"></div>
    </div>
  </div>
);

/**
 * Error boundary for canvas loading failures
 */
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Canvas loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-500 text-4xl">⚠️</div>
            <h3 className="text-lg font-semibold text-red-700">Canvas Loading Failed</h3>
            <p className="text-sm text-red-600">
              The visual roadmap builder could not load. This might be due to:
            </p>
            <ul className="text-xs text-red-600 space-y-1">
              <li>• Heavy dependencies loading failure</li>
              <li>• Network connectivity issues</li>
              <li>• Browser compatibility problems</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy-loaded MagicCanvas with optimized loading
 */
const LazyMagicCanvas: React.FC<LazyMagicCanvasProps> = (props) => {
  return (
    <CanvasErrorBoundary>
      <Suspense fallback={<CanvasLoadingSkeleton />}>
        <MagicCanvasComponent {...props} />
      </Suspense>
    </CanvasErrorBoundary>
  );
};

export default LazyMagicCanvas;