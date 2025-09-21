import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface ProgressMilestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  weight: number;
  category: 'design' | 'development' | 'testing' | 'optimization';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  estimatedTime: number; // in minutes
  confidence: number; // 0-1
  suggestions?: string[];
}

interface ProgressPrediction {
  timeToCompletion: number; // in minutes
  confidence: number;
  riskFactors: string[];
  recommendations: string[];
  bottlenecks: {
    milestone: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }[];
}

interface SmartProgressTrackerProps {
  className?: string;
  showDetails?: boolean;
  size?: 'compact' | 'normal' | 'expanded';
}

const SmartProgressTracker: React.FC<SmartProgressTrackerProps> = ({
  className = '',
  showDetails = true,
  size = 'normal'
}) => {
  const {
    thriveScore,
    nodes,
    edges,
    insightsPanel,
    updateMetrics
  } = useStore();

  const [milestones, setMilestones] = useState<ProgressMilestone[]>([]);
  const [prediction, setPrediction] = useState<ProgressPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [progressHistory, setProgressHistory] = useState<{ timestamp: Date; score: number }[]>([]);

  // Initialize milestones based on current project state
  const initializeMilestones = useCallback(() => {
    const baseMilestones: ProgressMilestone[] = [
      {
        id: 'structure',
        title: 'Project Structure',
        description: 'Define core architecture and components',
        targetValue: 100,
        currentValue: Math.min(nodes.length * 25, 100),
        weight: 0.2,
        category: 'design',
        status: nodes.length >= 3 ? 'completed' : nodes.length > 0 ? 'in_progress' : 'pending',
        estimatedTime: Math.max(0, (4 - nodes.length) * 15),
        confidence: 0.85,
        suggestions: nodes.length < 3 ? ['Add more nodes to define project structure', 'Consider adding key milestones'] : []
      },
      {
        id: 'connections',
        title: 'Component Integration',
        description: 'Connect and link project components',
        targetValue: 100,
        currentValue: Math.min(edges.length * 33, 100),
        weight: 0.25,
        category: 'development',
        status: edges.length >= 3 ? 'completed' : edges.length > 0 ? 'in_progress' : 'pending',
        estimatedTime: Math.max(0, (3 - edges.length) * 10),
        confidence: 0.78,
        suggestions: edges.length < 3 ? ['Create more connections between components', 'Define clear data flow'] : []
      },
      {
        id: 'optimization',
        title: 'Performance Optimization',
        description: 'Optimize for speed and efficiency',
        targetValue: 100,
        currentValue: thriveScore * 100,
        weight: 0.3,
        category: 'optimization',
        status: thriveScore > 0.8 ? 'completed' : thriveScore > 0.5 ? 'in_progress' : 'pending',
        estimatedTime: Math.max(0, (0.9 - thriveScore) * 60),
        confidence: 0.72,
        suggestions: thriveScore < 0.8 ? ['Review performance metrics', 'Optimize critical paths'] : []
      },
      {
        id: 'testing',
        title: 'Quality Assurance',
        description: 'Test and validate functionality',
        targetValue: 100,
        currentValue: Math.min((nodes.length + edges.length) * 10, 100),
        weight: 0.25,
        category: 'testing',
        status: (nodes.length + edges.length) >= 8 ? 'completed' : (nodes.length + edges.length) > 4 ? 'in_progress' : 'pending',
        estimatedTime: Math.max(0, (10 - (nodes.length + edges.length)) * 5),
        confidence: 0.65,
        suggestions: (nodes.length + edges.length) < 8 ? ['Add comprehensive testing', 'Validate all user flows'] : []
      }
    ];

    setMilestones(baseMilestones);
  }, [nodes.length, edges.length, thriveScore]);

  // Calculate AI-powered progress prediction
  const calculatePrediction = useCallback(() => {
    if (milestones.length === 0) return;

    setIsAnalyzing(true);

    // Simulate AI analysis with realistic calculation
    setTimeout(() => {
      const totalProgress = milestones.reduce((acc, milestone) =>
        acc + (milestone.currentValue / milestone.targetValue) * milestone.weight, 0
      );

      const remainingWork = milestones.filter(m => m.status !== 'completed');
      const totalEstimatedTime = remainingWork.reduce((acc, milestone) => acc + milestone.estimatedTime, 0);

      // AI-style confidence calculation based on current velocity
      const completedMilestones = milestones.filter(m => m.status === 'completed').length;
      const velocityFactor = completedMilestones / milestones.length;
      const confidence = Math.min(0.95, 0.5 + velocityFactor * 0.45);

      // Identify bottlenecks
      const bottlenecks = milestones
        .filter(m => m.status === 'blocked' || (m.status === 'in_progress' && m.estimatedTime > 30))
        .map(m => ({
          milestone: m.title,
          severity: (m.estimatedTime > 60 ? 'high' : m.estimatedTime > 30 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
          impact: `Could delay completion by ${Math.round(m.estimatedTime / 10)} hours`
        }));

      // Generate AI recommendations
      const recommendations = [
        totalProgress < 0.3 ? 'Focus on establishing core project structure first' : null,
        remainingWork.length > 2 ? 'Consider parallel development for faster completion' : null,
        bottlenecks.length > 0 ? 'Address identified bottlenecks to maintain timeline' : null,
        thriveScore < 0.6 ? 'Prioritize performance optimization early in development' : null
      ].filter(Boolean) as string[];

      const newPrediction: ProgressPrediction = {
        timeToCompletion: totalEstimatedTime * (1 + Math.random() * 0.2), // Add AI uncertainty
        confidence,
        riskFactors: bottlenecks.map(b => `${b.milestone}: ${b.impact}`),
        recommendations,
        bottlenecks
      };

      setPrediction(newPrediction);
      setLastAnalysis(new Date());
      setIsAnalyzing(false);

      // Update store metrics
      updateMetrics({
        completionRate: Math.round(totalProgress * 100),
        productivity: {
          tasksCompleted: milestones.filter(m => m.status === 'completed').length,
          tasksInProgress: milestones.filter(m => m.status === 'in_progress').length,
          blockers: milestones.filter(m => m.status === 'blocked').length
        }
      });

    }, 1500 + Math.random() * 1000); // Realistic AI processing time
  }, [milestones, updateMetrics]);

  // Initialize and update milestones when project changes
  useEffect(() => {
    initializeMilestones();
  }, [initializeMilestones]);

  // Run AI analysis when milestones change
  useEffect(() => {
    if (milestones.length > 0) {
      calculatePrediction();
    }
  }, [milestones, calculatePrediction]);

  // Track progress history
  useEffect(() => {
    const currentScore = thriveScore * 100;
    setProgressHistory(prev => {
      const newHistory = [...prev, { timestamp: new Date(), score: currentScore }];
      return newHistory.slice(-20); // Keep last 20 data points
    });
  }, [thriveScore]);

  const overallProgress = useMemo(() => {
    if (milestones.length === 0) return 0;
    return milestones.reduce((acc, milestone) =>
      acc + (milestone.currentValue / milestone.targetValue) * milestone.weight, 0
    );
  }, [milestones]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-neon-green-primary';
      case 'in_progress': return 'text-neon-blue-primary';
      case 'blocked': return 'text-neon-pink';
      default: return 'text-text-muted';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'design': return <SparklesIcon className="w-4 h-4" />;
      case 'development': return <BoltIcon className="w-4 h-4" />;
      case 'testing': return <CheckCircleIcon className="w-4 h-4" />;
      case 'optimization': return <ArrowTrendingUpIcon className="w-4 h-4" />;
      default: return <ChartBarIcon className="w-4 h-4" />;
    }
  };

  const sizeClasses = {
    compact: 'text-xs',
    normal: 'text-sm',
    expanded: 'text-base'
  };

  if (size === 'compact') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-20 h-2 bg-dark-tertiary/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-blue-primary to-neon-green-primary"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-medium text-text-primary">
            {Math.round(overallProgress * 100)}%
          </span>
          {isAnalyzing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-3 h-3"
            >
              <SparklesIcon className="w-3 h-3 text-neon-blue-primary" />
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <motion.div
        layout
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-neon-blue-primary" />
            <h3 className={`font-bold text-neon-blue-primary ${sizeClasses[size]}`}>
              Smart Progress
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {isAnalyzing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4"
              >
                <SparklesIcon className="w-4 h-4 text-neon-blue-primary" />
              </motion.div>
            )}
            <span className={`font-medium text-text-primary ${sizeClasses[size]}`}>
              {Math.round(overallProgress * 100)}%
            </span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="relative">
          <div className="w-full h-3 bg-dark-tertiary/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-blue-primary via-neon-purple to-neon-green-primary relative"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress * 100}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* Progress segments indicators */}
          <div className="absolute top-0 w-full h-3 flex">
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="flex-1 border-r border-dark-primary/50 last:border-r-0"
                style={{ flexBasis: `${milestone.weight * 100}%` }}
              />
            ))}
          </div>
        </div>

        {showDetails && (
          <>
            {/* Milestones */}
            <div className="space-y-3">
              <AnimatePresence>
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-dark-tertiary/30 border border-neon-blue-primary/20"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${getStatusColor(milestone.status)}`}>
                        {getCategoryIcon(milestone.category)}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium text-text-primary ${sizeClasses[size]}`}>
                          {milestone.title}
                        </h4>
                        <p className={`text-text-muted ${size === 'expanded' ? 'text-sm' : 'text-xs'}`}>
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className={`font-medium ${getStatusColor(milestone.status)} ${sizeClasses[size]}`}>
                          {Math.round(milestone.currentValue)}%
                        </div>
                        {milestone.estimatedTime > 0 && (
                          <div className={`text-text-muted ${size === 'expanded' ? 'text-sm' : 'text-xs'}`}>
                            {milestone.estimatedTime}m
                          </div>
                        )}
                      </div>
                      <div className="w-12 h-2 bg-dark-tertiary/50 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            milestone.status === 'completed' ? 'bg-neon-green-primary' :
                            milestone.status === 'in_progress' ? 'bg-neon-blue-primary' :
                            milestone.status === 'blocked' ? 'bg-neon-pink' : 'bg-text-muted'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${milestone.currentValue}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* AI Prediction */}
            {prediction && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 rounded-lg bg-neon-blue-primary/10 border border-neon-blue-primary/30"
              >
                <div className="flex items-center space-x-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-neon-blue-primary" />
                  <h4 className={`font-bold text-neon-blue-primary ${sizeClasses[size]}`}>
                    AI Prediction
                  </h4>
                  <span className={`text-text-muted ${size === 'expanded' ? 'text-sm' : 'text-xs'}`}>
                    {Math.round(prediction.confidence * 100)}% confidence
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="w-4 h-4 text-neon-blue-light" />
                    <span className={`text-text-primary ${sizeClasses[size]}`}>
                      {Math.round(prediction.timeToCompletion)} min to completion
                    </span>
                  </div>

                  {prediction.bottlenecks.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-neon-orange" />
                      <span className={`text-neon-orange ${sizeClasses[size]}`}>
                        {prediction.bottlenecks.length} bottleneck{prediction.bottlenecks.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {prediction.recommendations.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {prediction.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className={`text-neon-blue-light ${size === 'expanded' ? 'text-sm' : 'text-xs'}`}>
                        • {rec}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Last Analysis Time */}
            {lastAnalysis && (
              <div className={`text-center text-text-muted ${size === 'expanded' ? 'text-sm' : 'text-xs'}`}>
                Last analyzed: {lastAnalysis.toLocaleTimeString()}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SmartProgressTracker;