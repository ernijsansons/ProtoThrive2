import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import AIFeedbackEngine, { AIFeedback } from './AIFeedbackEngine';
import { useWebSocket, WebSocketMessage } from '../services/websocket';
import {
  WifiIcon,
  SignalIcon,
  EyeIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  BellIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface LiveInsight {
  id: string;
  type: 'metric' | 'performance' | 'user_behavior' | 'prediction' | 'recommendation';
  title: string;
  value: string | number;
  change?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  timestamp: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  trend?: number[]; // For sparkline charts
}

interface StreamMetrics {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  signalStrength: number; // 0-100
  updateFrequency: number; // Updates per minute
  totalInsights: number;
  lastUpdate: Date | null;
}

interface LiveInsightStreamProps {
  className?: string;
  maxVisibleInsights?: number;
  updateInterval?: number;
  showMetrics?: boolean;
  autoScroll?: boolean;
}

const LiveInsightStream: React.FC<LiveInsightStreamProps> = ({
  className = '',
  maxVisibleInsights = 5,
  updateInterval = 3000,
  showMetrics = true,
  autoScroll = true
}) => {
  const {
    nodes,
    edges,
    thriveScore,
    insightsPanel,
    agentStatus,
    updateMetrics
  } = useStore();

  const [insights, setInsights] = useState<LiveInsight[]>([]);
  const [streamMetrics, setStreamMetrics] = useState<StreamMetrics>({
    connectionStatus: 'connecting',
    signalStrength: 0,
    updateFrequency: 0,
    totalInsights: 0,
    lastUpdate: null
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedbackBuffer, setFeedbackBuffer] = useState<AIFeedback[]>([]);

  const streamIntervalRef = useRef<NodeJS.Timeout>();
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const insightsContainerRef = useRef<HTMLDivElement>(null);

  // WebSocket connection for real-time insights
  const { isConnected: wsConnected, send: wsSend } = useWebSocket((message: WebSocketMessage) => {
    if (message.type === 'insight' && message.payload) {
      const insight: LiveInsight = {
        id: message.id,
        type: message.payload.type || 'metric',
        title: message.payload.title,
        value: message.payload.value,
        timestamp: new Date(message.timestamp),
        category: message.payload.category || 'System',
        priority: message.payload.priority || 'medium',
        change: message.payload.change,
        trend: message.payload.trend,
      };

      setInsights(prev => [insight, ...prev].slice(0, maxVisibleInsights));

      setStreamMetrics(prev => ({
        ...prev,
        totalInsights: prev.totalInsights + 1,
        lastUpdate: new Date(),
      }));
    }
  });

  // Real-time connection status based on WebSocket
  useEffect(() => {
    if (wsConnected) {
      setStreamMetrics(prev => ({
        ...prev,
        connectionStatus: 'connected',
        signalStrength: 100
      }));
      setIsStreaming(true);
    } else {
      setStreamMetrics(prev => ({
        ...prev,
        connectionStatus: 'connecting',
        signalStrength: Math.max(0, prev.signalStrength - 20)
      }));
      setIsStreaming(false);
    }
  }, [wsConnected]);

  // Initialize connection sequence for visual feedback
  useEffect(() => {
    const connectionSequence = async () => {
      setStreamMetrics(prev => ({ ...prev, connectionStatus: 'connecting' }));

      // Gradually establish signal strength
      for (let i = 0; i <= 100; i += 20) {
        setStreamMetrics(prev => ({ ...prev, signalStrength: i }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    };

    connectionSequence();

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    };
  }, []);

  // Generate live insights based on current state
  const generateLiveInsight = useCallback((): LiveInsight | null => {
    const insightTemplates = [
      {
        type: 'metric' as const,
        generator: () => ({
          title: 'Thrive Score',
          value: `${Math.round(thriveScore * 100)}%`,
          change: {
            direction: Math.random() > 0.5 ? 'up' as const : 'stable' as const,
            percentage: Math.random() * 5
          },
          category: 'Performance',
          priority: 'medium' as const,
          trend: Array.from({ length: 10 }, () => Math.random() * 100)
        })
      },
      {
        type: 'performance' as const,
        generator: () => ({
          title: 'Component Efficiency',
          value: `${Math.round((nodes.length * edges.length) / Math.max(1, nodes.length) * 100)}%`,
          change: {
            direction: edges.length > nodes.length * 0.5 ? 'up' as const : 'down' as const,
            percentage: Math.random() * 10
          },
          category: 'Architecture',
          priority: edges.length < 2 ? 'high' as const : 'low' as const,
          trend: Array.from({ length: 10 }, () => Math.random() * 100)
        })
      },
      {
        type: 'user_behavior' as const,
        generator: () => ({
          title: 'Focus Time',
          value: `${Math.round(2 + Math.random() * 8)}m`,
          category: 'Productivity',
          priority: 'low' as const
        })
      },
      {
        type: 'prediction' as const,
        generator: () => ({
          title: 'Completion Estimate',
          value: `${Math.round(5 + Math.random() * 25)}min`,
          change: {
            direction: thriveScore > 0.7 ? 'down' as const : 'up' as const,
            percentage: Math.random() * 15
          },
          category: 'Timeline',
          priority: 'medium' as const
        })
      },
      {
        type: 'recommendation' as const,
        generator: () => {
          const recommendations = [
            'Consider adding more connections',
            'Review component naming',
            'Optimize data flow',
            'Add accessibility labels',
            'Test responsive design'
          ];
          return {
            title: 'Smart Suggestion',
            value: recommendations[Math.floor(Math.random() * recommendations.length)],
            category: 'Optimization',
            priority: 'medium' as const
          };
        }
      }
    ];

    // Select random template based on current context
    const template = insightTemplates[Math.floor(Math.random() * insightTemplates.length)];
    const insight = template.generator();

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: template.type,
      timestamp: new Date(),
      ...insight
    };
  }, [nodes.length, edges.length, thriveScore]);

  // Stream processing
  useEffect(() => {
    if (!isStreaming) return;

    streamIntervalRef.current = setInterval(() => {
      // Simulate realistic streaming behavior
      if (Math.random() > 0.3) { // 70% chance to generate insight
        const newInsight = generateLiveInsight();
        if (newInsight) {
          setInsights(prev => {
            const updated = [newInsight, ...prev].slice(0, maxVisibleInsights);
            return updated;
          });

          setStreamMetrics(prev => ({
            ...prev,
            totalInsights: prev.totalInsights + 1,
            lastUpdate: new Date(),
            updateFrequency: Math.round(60000 / updateInterval)
          }));
        }
      }
    }, updateInterval);

    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, [isStreaming, generateLiveInsight, maxVisibleInsights, updateInterval]);

  // Auto-scroll to latest insights
  useEffect(() => {
    if (autoScroll && insightsContainerRef.current) {
      insightsContainerRef.current.scrollTop = 0;
    }
  }, [insights, autoScroll]);

  // Handle AI feedback integration
  const handleAIFeedback = useCallback((feedback: AIFeedback) => {
    setFeedbackBuffer(prev => [...prev, feedback].slice(-3)); // Keep last 3 feedback items

    // Convert AI feedback to live insight
    const feedbackInsight: LiveInsight = {
      id: `feedback_${feedback.id}`,
      type: 'recommendation',
      title: feedback.title,
      value: feedback.message,
      timestamp: feedback.timestamp,
      category: feedback.category,
      priority: feedback.priority === 'critical' ? 'high' :
               feedback.priority === 'high' ? 'medium' : 'low'
    };

    setInsights(prev => [feedbackInsight, ...prev].slice(0, maxVisibleInsights));
  }, [maxVisibleInsights]);

  // Update metrics display
  useEffect(() => {
    metricsIntervalRef.current = setInterval(() => {
      setStreamMetrics(prev => ({
        ...prev,
        signalStrength: Math.max(70, Math.min(100, prev.signalStrength + (Math.random() - 0.5) * 10))
      }));
    }, 5000);

    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
    };
  }, []);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'metric': return <ChartBarIcon className="w-4 h-4" />;
      case 'performance': return <SparklesIcon className="w-4 h-4" />;
      case 'user_behavior': return <EyeIcon className="w-4 h-4" />;
      case 'prediction': return <ClockIcon className="w-4 h-4" />;
      case 'recommendation': return <BellIcon className="w-4 h-4" />;
      default: return <SignalIcon className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-neon-pink';
      case 'medium': return 'text-neon-blue-primary';
      case 'low': return 'text-neon-green-primary';
      default: return 'text-text-muted';
    }
  };

  const getConnectionStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-neon-green-primary';
      case 'connecting': return 'text-neon-blue-primary';
      case 'disconnected': return 'text-neon-orange';
      case 'error': return 'text-neon-pink';
      default: return 'text-text-muted';
    }
  };

  return (
    <div className={`${className}`}>
      {/* Stream Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{
              scale: streamMetrics.connectionStatus === 'connected' ? [1, 1.1, 1] : 1,
              opacity: streamMetrics.connectionStatus === 'connecting' ? [0.5, 1, 0.5] : 1
            }}
            transition={{
              duration: 2,
              repeat: streamMetrics.connectionStatus === 'connected' ? Infinity : 0,
              ease: 'easeInOut'
            }}
          >
            <WifiIcon className={`w-5 h-5 ${getConnectionStatusColor(streamMetrics.connectionStatus)}`} />
          </motion.div>
          <h3 className="text-sm font-bold text-neon-blue-primary">Live Insights</h3>
          <span className="text-xs text-text-muted">
            {streamMetrics.connectionStatus}
          </span>
        </div>

        {showMetrics && (
          <div className="flex items-center space-x-3">
            {/* Signal Strength */}
            <div className="flex items-center space-x-1">
              <div className="flex space-x-0.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-colors ${
                      streamMetrics.signalStrength > (i + 1) * 25
                        ? 'bg-neon-green-primary h-3'
                        : 'bg-text-muted h-2'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-muted">
                {Math.round(streamMetrics.signalStrength)}%
              </span>
            </div>

            {/* Update Frequency */}
            <div className="flex items-center space-x-1">
              <ArrowPathIcon className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted">
                {streamMetrics.updateFrequency}/min
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Feedback Engine Integration */}
      <div className="mb-4">
        <AIFeedbackEngine
          onFeedback={handleAIFeedback}
          maxActiveFeedback={2}
          enableAutoGeneration={true}
        />
      </div>

      {/* Insights Stream */}
      <div
        ref={insightsContainerRef}
        className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              layout
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{
                duration: 0.3,
                type: 'spring',
                stiffness: 300,
                delay: index * 0.05
              }}
              className="p-3 rounded-lg bg-dark-tertiary/30 border border-neon-blue-primary/20 backdrop-blur-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`${getPriorityColor(insight.priority)} mt-0.5`}>
                    {getInsightIcon(insight.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-text-primary">
                        {insight.title}
                      </h4>
                      <span className="text-xs text-text-muted">
                        {insight.timestamp.toLocaleTimeString().slice(0, 5)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-bold ${getPriorityColor(insight.priority)}`}>
                        {insight.value}
                      </span>

                      {insight.change && (
                        <div className="flex items-center space-x-1">
                          <motion.div
                            animate={{
                              rotate: insight.change.direction === 'up' ? 0 : 180
                            }}
                            className={`w-3 h-3 ${
                              insight.change.direction === 'up'
                                ? 'text-neon-green-primary'
                                : insight.change.direction === 'down'
                                ? 'text-neon-orange'
                                : 'text-text-muted'
                            }`}
                          >
                            ▲
                          </motion.div>
                          <span className="text-xs text-text-muted">
                            {insight.change.percentage.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Trend Sparkline */}
                    {insight.trend && (
                      <div className="mt-2">
                        <div className="flex items-end space-x-0.5 h-6">
                          {insight.trend.map((value, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${(value / 100) * 24}px` }}
                              transition={{ delay: i * 0.02 }}
                              className="w-1 bg-neon-blue-primary/50 rounded-t"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-1">
                      <span className="text-xs text-text-muted">
                        {insight.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Indicator */}
                <div className={`w-2 h-2 rounded-full ${
                  insight.priority === 'high' ? 'bg-neon-pink' :
                  insight.priority === 'medium' ? 'bg-neon-blue-primary' :
                  'bg-neon-green-primary'
                }`} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {insights.length === 0 && isStreaming && (
          <div className="text-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 mx-auto mb-3"
            >
              <SparklesIcon className="w-8 h-8 text-neon-blue-primary" />
            </motion.div>
            <p className="text-sm text-text-muted">
              Waiting for insights...
            </p>
          </div>
        )}
      </div>

      {/* Stream Statistics */}
      {showMetrics && streamMetrics.lastUpdate && (
        <div className="mt-4 pt-3 border-t border-neon-blue-primary/20">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              {streamMetrics.totalInsights} insights generated
            </span>
            <span>
              Last update: {streamMetrics.lastUpdate.toLocaleTimeString().slice(0, 5)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveInsightStream;