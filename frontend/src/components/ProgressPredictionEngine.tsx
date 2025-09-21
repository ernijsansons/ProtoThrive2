import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { aiService, AIAnalysisContext } from '../services/aiService';
import {
  ClockIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  BoltIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface PredictionMetrics {
  currentVelocity: number; // tasks per hour
  averageTaskComplexity: number; // 1-10 scale
  qualityTrend: number; // -1 to 1
  blockerProbability: number; // 0-1
  resourceUtilization: number; // 0-1
}

interface TimelinePrediction {
  estimatedCompletion: Date;
  confidence: number; // 0-1
  scenarios: {
    optimistic: Date;
    realistic: Date;
    pessimistic: Date;
  };
  factors: {
    positive: string[];
    negative: string[];
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface MilestonePrediction {
  id: string;
  name: string;
  estimatedStart: Date;
  estimatedEnd: Date;
  confidence: number;
  dependencies: string[];
  riskFactors: string[];
  bufferTime: number; // in hours
}

interface ProgressPredictionEngineProps {
  className?: string;
  showDetails?: boolean;
  enableRealTimeUpdates?: boolean;
  predictionHorizon?: number; // hours to predict ahead
}

const ProgressPredictionEngine: React.FC<ProgressPredictionEngineProps> = ({
  className = '',
  showDetails = true,
  enableRealTimeUpdates = true,
  predictionHorizon = 24
}) => {
  const {
    nodes,
    edges,
    thriveScore,
    insightsPanel,
    agentStatus,
    analysisHistory
  } = useStore();

  const [prediction, setPrediction] = useState<TimelinePrediction | null>(null);
  const [milestones, setMilestones] = useState<MilestonePrediction[]>([]);
  const [metrics, setMetrics] = useState<PredictionMetrics>({
    currentVelocity: 0,
    averageTaskComplexity: 5,
    qualityTrend: 0,
    blockerProbability: 0.2,
    resourceUtilization: 0.7
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [historicalData, setHistoricalData] = useState<{
    timestamp: Date;
    score: number;
    velocity: number;
  }[]>([]);

  // Calculate current project metrics
  const calculateMetrics = useCallback((): PredictionMetrics => {
    const projectComplexity = Math.min(10, (nodes.length * 0.5) + (edges.length * 0.8));
    const connectivityRatio = nodes.length > 0 ? edges.length / nodes.length : 0;
    const qualityScore = thriveScore;

    // Simulate velocity based on recent activity
    const recentActivity = analysisHistory.slice(0, 5);
    const averageSuccessRate = recentActivity.length > 0
      ? recentActivity.filter(h => h.success).length / recentActivity.length
      : 0.7;

    const velocity = Math.max(0.1, averageSuccessRate * (1 + connectivityRatio) * qualityScore * 2);

    // Quality trend based on score changes
    const trendSlope = historicalData.length > 1
      ? (historicalData[0].score - historicalData[historicalData.length - 1].score) / historicalData.length
      : 0;

    // Blocker probability based on complexity and current issues
    const blockerProb = Math.min(0.8,
      (projectComplexity / 10) * 0.3 +
      (qualityScore < 0.5 ? 0.4 : 0.1) +
      (connectivityRatio < 0.3 ? 0.2 : 0)
    );

    return {
      currentVelocity: velocity,
      averageTaskComplexity: projectComplexity,
      qualityTrend: Math.max(-1, Math.min(1, trendSlope * 10)),
      blockerProbability: blockerProb,
      resourceUtilization: Math.min(1, agentStatus.isRunning ? 0.9 : 0.6)
    };
  }, [nodes.length, edges.length, thriveScore, analysisHistory, historicalData, agentStatus.isRunning]);

  // Generate AI-powered timeline prediction with enhanced insights
  const generatePrediction = useCallback(async (): Promise<TimelinePrediction> => {
    const currentMetrics = calculateMetrics();

    try {
      // Build analysis context for AI service
      const analysisContext: AIAnalysisContext = {
        projectStructure: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          nodes: nodes.map(node => ({
            id: node.id,
            type: node.type || 'component',
            label: node.label,
            position: node.position
          })),
          edges: edges.map(edge => ({
            from: edge.from,
            to: edge.to,
            type: edge.type || 'connection'
          }))
        },
        performance: {
          thriveScore: thriveScore,
          loadTime: undefined,
          memoryUsage: undefined
        },
        userBehavior: {
          sessionDuration: Date.now() - (historicalData[0]?.timestamp.getTime() || Date.now()),
          activity: agentStatus.isRunning ? 'active' : 'idle',
          interactionCount: nodes.length + edges.length,
          lastAction: 'timeline_analysis'
        },
        environment: {
          canvasMode: '2d', // Assuming 2D for now
          activeTab: 'prediction',
          screenSize: typeof window !== 'undefined' ?
            `${window.innerWidth}x${window.innerHeight}` : undefined
        }
      };

      // Get AI-powered insights
      const aiInsights = await aiService.analyzePredictiveInsights(analysisContext);

      // Base completion time calculation
      const remainingWork = Math.max(1, 10 - (nodes.length + edges.length));
      const baseHours = remainingWork / Math.max(0.1, currentMetrics.currentVelocity);

      // Adjust for complexity and quality trends
      const complexityMultiplier = 1 + (currentMetrics.averageTaskComplexity - 5) * 0.1;
      const qualityMultiplier = currentMetrics.qualityTrend < 0 ? 1.3 : 0.9;
      const blockerMultiplier = 1 + currentMetrics.blockerProbability * 0.5;

      const adjustedHours = baseHours * complexityMultiplier * qualityMultiplier * blockerMultiplier;

      const now = new Date();
      const estimatedCompletion = new Date(now.getTime() + adjustedHours * 60 * 60 * 1000);

      // Generate scenarios with AI insights
      const optimisticHours = adjustedHours * 0.7;
      const pessimisticHours = adjustedHours * 1.6;

      const scenarios = {
        optimistic: new Date(now.getTime() + optimisticHours * 60 * 60 * 1000),
        realistic: estimatedCompletion,
        pessimistic: new Date(now.getTime() + pessimisticHours * 60 * 60 * 1000)
      };

      // Enhanced confidence calculation with AI data
      const velocityConfidence = Math.min(1, currentMetrics.currentVelocity / 2);
      const trendConfidence = 1 - Math.abs(currentMetrics.qualityTrend) * 0.3;
      const dataConfidence = Math.min(1, historicalData.length / 10);
      const aiConfidence = aiInsights.timeline.reduce((acc, task) => acc + task.confidence, 0) / aiInsights.timeline.length;

      const confidence = (velocityConfidence + trendConfidence + dataConfidence + aiConfidence) / 4;

      // Enhanced factors and recommendations with AI insights
      const positiveFactors: string[] = [];
      const negativeFactors: string[] = [];
      const recommendations: string[] = [];

      // Add AI-generated opportunities as positive factors
      aiInsights.opportunities.forEach(opportunity => {
        if (opportunity.impact === 'High') {
          positiveFactors.push(`Opportunity: ${opportunity.opportunity}`);
        }
      });

      // Add AI-generated risks as negative factors
      aiInsights.risks.forEach(risk => {
        if (risk.probability > 0.3) {
          negativeFactors.push(`Risk: ${risk.risk}`);
        }
      });

      // Add AI-enhanced recommendations
      aiInsights.timeline.forEach(task => {
        if (task.confidence < 0.7) {
          recommendations.push(`Focus on ${task.task} - requires attention`);
        }
      });

      // Traditional analysis
      if (currentMetrics.currentVelocity > 1) {
        positiveFactors.push('High development velocity');
      } else {
        negativeFactors.push('Below average development speed');
        recommendations.push('Consider optimizing workflow for faster iteration');
      }

      if (currentMetrics.qualityTrend > 0) {
        positiveFactors.push('Improving quality metrics');
      } else if (currentMetrics.qualityTrend < -0.2) {
        negativeFactors.push('Declining quality trend');
        recommendations.push('Focus on code quality and best practices');
      }

      if (currentMetrics.blockerProbability > 0.5) {
        negativeFactors.push('High probability of blockers');
        recommendations.push('Identify and mitigate potential roadblocks early');
      } else {
        positiveFactors.push('Low risk of major blockers');
      }

      if (nodes.length > 0 && edges.length / nodes.length > 0.5) {
        positiveFactors.push('Well-connected architecture');
      } else if (nodes.length > 1) {
        negativeFactors.push('Sparse component connections');
        recommendations.push('Improve component integration and connectivity');
      }

      // AI-enhanced risk level assessment
      const aiRiskScore = aiInsights.risks.reduce((acc, risk) => acc + risk.probability, 0) / aiInsights.risks.length;
      const riskLevel: 'low' | 'medium' | 'high' =
        aiRiskScore > 0.6 || currentMetrics.blockerProbability > 0.6 || currentMetrics.qualityTrend < -0.3 ? 'high' :
        aiRiskScore > 0.3 || currentMetrics.blockerProbability > 0.3 || adjustedHours > baseHours * 1.3 ? 'medium' : 'low';

      return {
        estimatedCompletion,
        confidence,
        scenarios,
        factors: { positive: positiveFactors, negative: negativeFactors },
        recommendations,
        riskLevel
      };

    } catch (error) {
      console.error('AI prediction error, falling back to traditional analysis:', error);

      // Fallback to original calculation if AI fails
      const baseHours = Math.max(1, 10 - (nodes.length + edges.length)) / Math.max(0.1, currentMetrics.currentVelocity);
      const adjustedHours = baseHours * 1.2; // Simple multiplier

      const now = new Date();
      const estimatedCompletion = new Date(now.getTime() + adjustedHours * 60 * 60 * 1000);

      return {
        estimatedCompletion,
        confidence: 0.6, // Lower confidence for fallback
        scenarios: {
          optimistic: new Date(now.getTime() + adjustedHours * 0.7 * 60 * 60 * 1000),
          realistic: estimatedCompletion,
          pessimistic: new Date(now.getTime() + adjustedHours * 1.6 * 60 * 60 * 1000)
        },
        factors: {
          positive: ['Basic analysis available'],
          negative: ['AI insights temporarily unavailable']
        },
        recommendations: ['Traditional estimation in use'],
        riskLevel: 'medium'
      };
    }
  }, [calculateMetrics, nodes, edges, thriveScore, historicalData, agentStatus.isRunning]);

  // Generate milestone predictions
  const generateMilestonePredictions = useCallback((): MilestonePrediction[] => {
    const milestoneTemplates = [
      {
        name: 'Core Architecture',
        progressWeight: 0.3,
        dependencies: [],
        complexity: 3
      },
      {
        name: 'Component Integration',
        progressWeight: 0.25,
        dependencies: ['Core Architecture'],
        complexity: 4
      },
      {
        name: 'User Interface Polish',
        progressWeight: 0.25,
        dependencies: ['Component Integration'],
        complexity: 3
      },
      {
        name: 'Testing & Optimization',
        progressWeight: 0.2,
        dependencies: ['User Interface Polish'],
        complexity: 5
      }
    ];

    const now = new Date();
    let cumulativeTime = 0;

    return milestoneTemplates.map((template, index) => {
      const estimatedHours = (template.progressWeight * predictionHorizon) * (template.complexity / 5);
      const startTime = new Date(now.getTime() + cumulativeTime * 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + estimatedHours * 60 * 60 * 1000);

      cumulativeTime += estimatedHours;

      const riskFactors: string[] = [];
      if (template.complexity > 4) riskFactors.push('High complexity');
      if (template.dependencies.length > 0) riskFactors.push('Dependent on previous milestones');
      if (metrics.blockerProbability > 0.4) riskFactors.push('Potential blockers identified');

      return {
        id: `milestone_${index}`,
        name: template.name,
        estimatedStart: startTime,
        estimatedEnd: endTime,
        confidence: Math.max(0.3, 1 - (template.complexity / 10) - (metrics.blockerProbability * 0.3)),
        dependencies: template.dependencies,
        riskFactors,
        bufferTime: estimatedHours * 0.2 // 20% buffer
      };
    });
  }, [predictionHorizon, metrics.blockerProbability]);

  // Run prediction analysis
  const runPredictionAnalysis = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));

    try {
      const newMetrics = calculateMetrics();
      setMetrics(newMetrics);

      const newPrediction = await generatePrediction();
      setPrediction(newPrediction);

      const newMilestones = generateMilestonePredictions();
      setMilestones(newMilestones);

      setLastUpdate(new Date());

      // Update historical data
      setHistoricalData(prev => [
        { timestamp: new Date(), score: thriveScore, velocity: newMetrics.currentVelocity },
        ...prev.slice(0, 19) // Keep last 20 data points
      ]);

    } catch (error) {
      console.error('Prediction analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, calculateMetrics, generatePrediction, generateMilestonePredictions, thriveScore]);

  // Auto-update predictions
  useEffect(() => {
    if (enableRealTimeUpdates) {
      // Initial analysis
      const initialTimeout = setTimeout(() => {
        runPredictionAnalysis();
      }, 2000);

      // Periodic updates
      const interval = setInterval(() => {
        runPredictionAnalysis();
      }, 30000); // Every 30 seconds

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    }
  }, [enableRealTimeUpdates, runPredictionAnalysis]);

  // Trigger analysis when significant changes occur
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const debounceTimeout = setTimeout(() => {
        runPredictionAnalysis();
      }, 2000);

      return () => clearTimeout(debounceTimeout);
    }
  }, [nodes.length, edges.length, runPredictionAnalysis]);

  const formatTimeRemaining = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.round(diff / (1000 * 60 * 60));

    if (hours < 1) return '< 1 hour';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    const days = Math.round(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-neon-pink';
      case 'medium': return 'text-neon-orange';
      case 'low': return 'text-neon-green-primary';
      default: return 'text-text-muted';
    }
  };

  return (
    <div className={`${className}`}>
      <motion.div
        layout
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="w-5 h-5 text-neon-purple" />
            <h3 className="text-sm font-bold text-neon-purple">
              AI Timeline Prediction
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {isAnalyzing && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4"
              >
                <SparklesIcon className="w-4 h-4 text-neon-purple" />
              </motion.div>
            )}
            {lastUpdate && (
              <span className="text-xs text-text-muted">
                {lastUpdate.toLocaleTimeString().slice(0, 5)}
              </span>
            )}
          </div>
        </div>

        {/* Main Prediction */}
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-neon-purple/10 border border-neon-purple/30"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-neon-purple text-sm">
                Completion Forecast
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-text-muted">
                  {Math.round(prediction.confidence * 100)}% confidence
                </span>
                <div className={`w-2 h-2 rounded-full ${getRiskColor(prediction.riskLevel).replace('text-', 'bg-')}`} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-xs text-neon-green-primary font-medium">Optimistic</div>
                <div className="text-sm text-text-primary">
                  {formatTimeRemaining(prediction.scenarios.optimistic)}
                </div>
              </div>
              <div className="text-center border-x border-neon-purple/20">
                <div className="text-xs text-neon-purple font-medium">Realistic</div>
                <div className="text-sm font-bold text-neon-purple">
                  {formatTimeRemaining(prediction.scenarios.realistic)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-neon-orange font-medium">Pessimistic</div>
                <div className="text-sm text-text-primary">
                  {formatTimeRemaining(prediction.scenarios.pessimistic)}
                </div>
              </div>
            </div>

            {showDetails && (
              <div className="space-y-3">
                {/* Positive Factors */}
                {prediction.factors.positive.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-neon-green-primary mb-1">
                      Positive Factors
                    </h5>
                    <div className="space-y-1">
                      {prediction.factors.positive.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <ArrowTrendingUpIcon className="w-3 h-3 text-neon-green-primary flex-shrink-0" />
                          <span className="text-xs text-text-primary">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative Factors */}
                {prediction.factors.negative.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-neon-orange mb-1">
                      Risk Factors
                    </h5>
                    <div className="space-y-1">
                      {prediction.factors.negative.map((factor, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <ArrowTrendingDownIcon className="w-3 h-3 text-neon-orange flex-shrink-0" />
                          <span className="text-xs text-text-primary">{factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium text-neon-blue-primary mb-1">
                      AI Recommendations
                    </h5>
                    <div className="space-y-1">
                      {prediction.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <BoltIcon className="w-3 h-3 text-neon-blue-primary flex-shrink-0" />
                          <span className="text-xs text-text-primary">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Milestones Timeline */}
        {showDetails && milestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-bold text-neon-blue-primary flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Milestone Timeline</span>
            </h4>

            <div className="space-y-2">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-dark-tertiary/30 border border-neon-blue-primary/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-text-primary">
                      {milestone.name}
                    </h5>
                    <span className="text-xs text-text-muted">
                      {Math.round(milestone.confidence * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-text-muted">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3" />
                      <span>
                        {formatTimeRemaining(milestone.estimatedEnd)}
                      </span>
                    </div>

                    {milestone.riskFactors.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <ExclamationTriangleIcon className="w-3 h-3 text-neon-orange" />
                        <span>{milestone.riskFactors.length} risk{milestone.riskFactors.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full h-1 bg-dark-tertiary/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-neon-blue-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${milestone.confidence * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Metrics Summary */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-3 rounded-lg bg-dark-tertiary/30 border border-neon-green-primary/20 text-center">
              <div className="text-sm font-bold text-neon-green-primary">
                {metrics.currentVelocity.toFixed(1)}
              </div>
              <div className="text-xs text-text-muted">Velocity</div>
            </div>

            <div className="p-3 rounded-lg bg-dark-tertiary/30 border border-neon-orange/20 text-center">
              <div className="text-sm font-bold text-neon-orange">
                {Math.round(metrics.blockerProbability * 100)}%
              </div>
              <div className="text-xs text-text-muted">Risk Level</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ProgressPredictionEngine;