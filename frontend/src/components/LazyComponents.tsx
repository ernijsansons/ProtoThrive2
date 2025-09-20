import * as React from 'react';
import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// Lazy load heavy components
const AgentControlPanel = lazy(() => import('./AgentControlPanel'));
const AgentStatusMonitor = lazy(() => import('./AgentStatusMonitor'));
const AnalysisHistory = lazy(() => import('./AnalysisHistory'));
const EnhancedAgentReportDisplay = lazy(() => import('./EnhancedAgentReportDisplay'));
const AgentAnalysisLoader = lazy(() => import('./AgentAnalysisLoader'));

// Loading fallback component
const LoadingFallback: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`p-6 bg-gray-900/50 border border-gray-700/50 rounded-xl ${className}`}
  >
    <div className="flex items-center justify-center space-x-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-6 h-6 border-2 border-neon-blue-primary border-t-transparent rounded-full"
      />
      <span className="text-gray-400">Loading component...</span>
    </div>
  </motion.div>
);

// Lazy component wrappers
export const LazyAgentControlPanel: React.FC<any> = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <AgentControlPanel {...props} />
  </Suspense>
);

export const LazyAgentStatusMonitor: React.FC<any> = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <AgentStatusMonitor {...props} />
  </Suspense>
);

export const LazyAnalysisHistory: React.FC<any> = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <AnalysisHistory {...props} />
  </Suspense>
);

export const LazyEnhancedAgentReportDisplay: React.FC<any> = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <EnhancedAgentReportDisplay {...props} />
  </Suspense>
);

export const LazyAgentAnalysisLoader: React.FC<any> = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <AgentAnalysisLoader {...props} />
  </Suspense>
);
