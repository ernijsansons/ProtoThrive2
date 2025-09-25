// Ref: CLAUDE.md Phase 2 - Enhanced InsightsPanel with full accessibility and modern design
import { useStore } from '../store';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface InsightsPanelProps {
  className?: string;
  compact?: boolean;
}

const InsightsPanel = ({ className = '', compact = false }: InsightsPanelProps) => {
  console.log('Thermonuclear InsightsPanel Rendered');
  const { thriveScore, nodes, mode } = useStore();
  
  const [animatedScore, setAnimatedScore] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  // Animate score changes
  useEffect(() => {
    const duration = 1000; // 1 second
    const steps = 60; // 60fps
    const increment = (thriveScore - animatedScore) / steps;
    
    if (Math.abs(thriveScore - animatedScore) > 0.01) {
      const timer = setInterval(() => {
        setAnimatedScore(prev => {
          const next = prev + increment;
          if (Math.abs(next - thriveScore) < Math.abs(increment)) {
            clearInterval(timer);
            return thriveScore;
          }
          return next;
        });
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
    
    return undefined; // Explicit return for TypeScript strict mode
  }, [thriveScore, animatedScore]);

  // Calculate trend
  useEffect(() => {
    const currentScore = thriveScore;
    const prevScore = animatedScore;
    
    if (currentScore > prevScore + 0.05) setTrend('up');
    else if (currentScore < prevScore - 0.05) setTrend('down');
    else setTrend('stable');
  }, [thriveScore, animatedScore]);

  const getScoreColor = useCallback((score: number) => {
    if (score >= 0.8) return 'text-success-600 dark:text-success-400';
    if (score >= 0.6) return 'text-primary-600 dark:text-primary-400';
    if (score >= 0.4) return 'text-warning-600 dark:text-warning-400';
    return 'text-error-600 dark:text-error-400';
  }, []);

  const getScoreStatus = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Attention';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 0.8) return 'from-success-500 to-success-600';
    if (score >= 0.6) return 'from-primary-500 to-primary-600';
    if (score >= 0.4) return 'from-warning-500 to-warning-600';
    return 'from-error-500 to-error-600';
  };

  const { activeNodes, completedNodes, errorNodes } = useMemo(() => {
    const active = nodes.filter(n => n.status !== 'gray').length;
    const completed = nodes.filter(n => n.status === 'neon' || n.status === 'success').length;
    const errors = nodes.filter(n => n.status === 'error').length;
    return { activeNodes: active, completedNodes: completed, errorNodes: errors };
  }, [nodes]);

  if (compact) {
    return (
      <div className={`card-dark p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Thrive Score</h3>
          <span className={`text-lg font-bold ${getScoreColor(animatedScore)}`}>
            {(animatedScore * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="relative w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getProgressBarColor(animatedScore)} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${Math.max(animatedScore * 100, 2)}%` }}
            role="progressbar"
            aria-valuenow={Math.round(animatedScore * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Thrive score: ${(animatedScore * 100).toFixed(1)}%`}
          />
        </div>
      </div>
    );
  }

  return (
    <section 
      className={`card-dark space-y-6 ${className}`}
      aria-labelledby="insights-heading"
      role="region"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 id="insights-heading" className="text-xl font-bold text-white flex items-center gap-2">
          <svg className="w-6 h-6 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Thrive Analytics
        </h2>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" aria-hidden="true"></div>
          <span>Live Data</span>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="relative">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className={`text-5xl sm:text-6xl font-bold font-mono ${getScoreColor(animatedScore)}`}>
              {(animatedScore * 100).toFixed(1)}
            </span>
            <div className="flex flex-col items-start">
              <span className="text-2xl text-gray-400">%</span>
              {trend !== 'stable' && (
                <div className={`flex items-center text-xs ${
                  trend === 'up' ? 'text-success-400' : 'text-error-400'
                }`}>
                  <svg className={`w-3 h-3 ${trend === 'up' ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  <span className="ml-1">{trend}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <p className={`text-lg font-medium ${getScoreColor(animatedScore)}`}>
              {getScoreStatus(animatedScore)}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Overall project health and progress
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>Progress</span>
            <span>{(animatedScore * 100).toFixed(1)}% Complete</span>
          </div>
          
          <div className="relative w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getProgressBarColor(animatedScore)} transition-all duration-1000 ease-out rounded-full`}
              style={{ 
                width: `${Math.max(animatedScore * 100, 2)}%`,
                boxShadow: animatedScore > 0.8 ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
              }}
              role="progressbar"
              aria-valuenow={Math.round(animatedScore * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-describedby="progress-description"
            />
            
            {/* Score markers */}
            <div className="absolute top-0 left-0 w-full h-full flex items-center">
              {[25, 50, 75].map(mark => (
                <div 
                  key={mark}
                  className="absolute w-0.5 h-full bg-gray-600" 
                  style={{ left: `${mark}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
          
          <div id="progress-description" className="sr-only">
            Progress bar showing {(animatedScore * 100).toFixed(1)}% completion out of 100%
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">
            {nodes.length}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Total Nodes
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-400 mb-1">
            {activeNodes}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Active
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-success-400 mb-1">
            {completedNodes}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Completed
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-error-400 mb-1">
            {errorNodes}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">
            Errors
          </div>
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Visualization:</span>
          <span className={`font-medium capitalize px-2 py-1 rounded text-xs ${
            mode === '3d' 
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30' 
              : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
          }`}>
            {mode} Mode
          </span>
        </div>
        
        <div className="text-xs text-gray-500">
          Last updated: now
        </div>
      </div>
    </section>
  );
};

export default InsightsPanel;