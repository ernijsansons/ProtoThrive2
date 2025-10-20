/**
 * Analytics Page
 * Enterprise analytics dashboard with comprehensive metrics
 * Ref: CLAUDE.md Phase 3 - Advanced Analytics
 */

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AnalyticsDashboard to avoid SSR issues
const AnalyticsDashboard = dynamic(() => import('../components/AnalyticsDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        <div className="spinner-elite mb-4 mx-auto"></div>
        <p className="text-neon-blue-primary animate-neon-glow">Loading Enterprise Analytics...</p>
      </div>
    </div>
  )
});

const AnalyticsPage: React.FC = () => {
  return <AnalyticsDashboard />;
};

export default AnalyticsPage;