import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { aiService, AIAnalysisContext } from '../services/aiService';
import {
  SparklesIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface AIFeedback {
  id: string;
  type: 'suggestion' | 'warning' | 'success' | 'info' | 'optimization' | 'insight';
  title: string;
  message: string;
  context: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'design' | 'performance' | 'usability' | 'accessibility' | 'best_practice';
  confidence: number; // 0-1
  timestamp: Date;
  action?: {
    label: string;
    callback: () => void;
  };
  dismissible: boolean;
  autoHide?: number; // milliseconds
}

interface FeedbackContext {
  nodeCount: number;
  edgeCount: number;
  thriveScore: number;
  activeTab: string;
  canvasMode: string;
  userActivity: 'idle' | 'active' | 'focused';
  sessionDuration: number;
}

interface AIFeedbackEngineProps {
  onFeedback?: (feedback: AIFeedback) => void;
  maxActiveFeedback?: number;
  enableAutoGeneration?: boolean;
  className?: string;
}

const AIFeedbackEngine: React.FC<AIFeedbackEngineProps> = ({
  onFeedback,
  maxActiveFeedback = 3,
  enableAutoGeneration = true,
  className = ''
}) => {
  const {
    nodes,
    edges,
    thriveScore,
    mode,
    insightsPanel,
    addChatMessage,
    updateMetrics
  } = useStore();

  const [activeFeedback, setActiveFeedback] = useState<AIFeedback[]>([]);
  const [feedbackQueue, setFeedbackQueue] = useState<AIFeedback[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [context, setContext] = useState<FeedbackContext>({
    nodeCount: 0,
    edgeCount: 0,
    thriveScore: 0,
    activeTab: 'overview',
    canvasMode: '2d',
    userActivity: 'idle',
    sessionDuration: 0
  });

  const sessionStartRef = useRef(Date.now());
  const lastActivityRef = useRef(Date.now());
  const analysisIntervalRef = useRef<NodeJS.Timeout>();

  // Update context when store changes
  useEffect(() => {
    setContext(prev => ({
      ...prev,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      thriveScore,
      activeTab: insightsPanel.activeTab,
      canvasMode: mode,
      sessionDuration: Date.now() - sessionStartRef.current,
      userActivity: Date.now() - lastActivityRef.current < 30000 ? 'active' : 'idle'
    }));
  }, [nodes.length, edges.length, thriveScore, mode, insightsPanel.activeTab]);

  // Generate AI feedback using real AI service
  const generateContextualFeedback = useCallback(async (): Promise<AIFeedback[]> => {
    try {
      // Build analysis context for AI service
      const analysisContext: AIAnalysisContext = {
        projectStructure: {
          nodeCount: context.nodeCount,
          edgeCount: context.edgeCount,
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
          thriveScore: context.thriveScore,
          loadTime: undefined, // Could be tracked
          memoryUsage: undefined // Could be tracked
        },
        userBehavior: {
          sessionDuration: context.sessionDuration,
          activity: context.userActivity,
          interactionCount: nodes.length + edges.length, // Approximate
          lastAction: 'canvas_interaction' // Could be more specific
        },
        environment: {
          canvasMode: context.canvasMode as '2d' | '3d',
          activeTab: context.activeTab,
          screenSize: typeof window !== 'undefined' ?
            `${window.innerWidth}x${window.innerHeight}` : undefined
        }
      };

      // Get AI-generated feedback
      const aiFeedback = await aiService.generateFeedback(analysisContext);

      // Add action callbacks to AI feedback
      return aiFeedback.map(feedback => ({
        ...feedback,
        action: feedback.action ? {
          ...feedback.action,
          callback: () => {
            // Execute the original callback if it exists
            if (feedback.action?.callback) {
              feedback.action.callback();
            }

            // Add contextual actions based on feedback type
            if (feedback.type === 'suggestion' && feedback.title.includes('Start')) {
              addChatMessage({
                sender: 'agent',
                message: 'I can help you choose from our template library to get started quickly!'
              });
            } else if (feedback.type === 'optimization') {
              updateMetrics({
                agentActivity: Math.min(100, (context.nodeCount + context.edgeCount) * 10)
              });
            } else {
              addChatMessage({
                sender: 'agent',
                message: `I've analyzed your ${feedback.category} and have suggestions to help improve it.`
              });
            }
          }
        } : undefined
      }));

    } catch (error) {
      console.error('AI Feedback generation error:', error);

      // Fallback to basic feedback if AI service fails
      return [{
        id: `fallback_${Date.now()}`,
        type: 'info',
        title: 'AI Assistant Temporarily Unavailable',
        message: 'I\'m having trouble connecting to the AI service. Basic guidance is still available.',
        context: 'AI Service Error',
        priority: 'low',
        category: 'usability',
        confidence: 0.50,
        timestamp: new Date(),
        dismissible: true,
        autoHide: 5000
      }];
    }
  }, [context, nodes, edges, addChatMessage, updateMetrics]);

  // AI feedback generation with realistic processing
  const runAIAnalysis = useCallback(async () => {
    if (isGenerating) return;

    setIsGenerating(true);

    // Simulate AI processing time
    const processingTime = 800 + Math.random() * 1200;

    setTimeout(async () => {
      try {
        const newFeedback = await generateContextualFeedback();

        // Filter out duplicates and respect priority
        const filteredFeedback = newFeedback.filter(feedback =>
          !activeFeedback.some(active =>
            active.title === feedback.title ||
            active.context === feedback.context
          )
        );

        // Sort by priority and confidence
        filteredFeedback.sort((a, b) => {
          const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
          const aScore = priorityWeight[a.priority] * a.confidence;
          const bScore = priorityWeight[b.priority] * b.confidence;
          return bScore - aScore;
        });

        // Add to queue
        setFeedbackQueue(prev => [...prev, ...filteredFeedback.slice(0, 2)]);

      } catch (error) {
        console.error('AI Feedback generation error:', error);
      } finally {
        setIsGenerating(false);
      }
    }, processingTime);
  }, [isGenerating, generateContextualFeedback, activeFeedback]);

  // Process feedback queue
  useEffect(() => {
    if (feedbackQueue.length > 0 && activeFeedback.length < maxActiveFeedback) {
      const nextFeedback = feedbackQueue[0];
      setFeedbackQueue(prev => prev.slice(1));
      setActiveFeedback(prev => [...prev, nextFeedback]);

      // Notify parent component
      if (onFeedback) {
        onFeedback(nextFeedback);
      }

      // Auto-hide if specified
      if (nextFeedback.autoHide) {
        setTimeout(() => {
          dismissFeedback(nextFeedback.id);
        }, nextFeedback.autoHide);
      }
    }
  }, [feedbackQueue, activeFeedback.length, maxActiveFeedback, onFeedback]);

  // Dismiss feedback
  const dismissFeedback = useCallback((feedbackId: string) => {
    setActiveFeedback(prev => prev.filter(feedback => feedback.id !== feedbackId));
  }, []);

  // Auto-generate feedback
  useEffect(() => {
    if (enableAutoGeneration) {
      // Run initial analysis after 2 seconds
      const initialTimeout = setTimeout(() => {
        runAIAnalysis();
      }, 2000);

      // Set up periodic analysis
      analysisIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.6) { // 40% chance to run analysis
          runAIAnalysis();
        }
      }, 15000); // Every 15 seconds

      return () => {
        clearTimeout(initialTimeout);
        if (analysisIntervalRef.current) {
          clearInterval(analysisIntervalRef.current);
        }
      };
    }
  }, [enableAutoGeneration, runAIAnalysis]);

  // Update activity tracking
  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [nodes, edges, mode, insightsPanel.activeTab]);

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'suggestion': return <LightBulbIcon className="w-5 h-5" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'success': return <CheckCircleIcon className="w-5 h-5" />;
      case 'info': return <InformationCircleIcon className="w-5 h-5" />;
      case 'optimization': return <BoltIcon className="w-5 h-5" />;
      case 'insight': return <ArrowTrendingUpIcon className="w-5 h-5" />;
      default: return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case 'suggestion': return 'neon-blue-primary';
      case 'warning': return 'neon-orange';
      case 'success': return 'neon-green-primary';
      case 'info': return 'neon-purple';
      case 'optimization': return 'neon-pink';
      case 'insight': return 'neon-blue-light';
      default: return 'neon-blue-primary';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* AI Status Indicator */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute top-0 right-0 z-10"
        >
          <div className="flex items-center space-x-2 px-3 py-1 bg-dark-secondary/90 backdrop-blur-lg border border-neon-blue-primary/30 rounded-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <SparklesIcon className="w-4 h-4 text-neon-blue-primary" />
            </motion.div>
            <span className="text-xs text-neon-blue-light">AI Analyzing...</span>
          </div>
        </motion.div>
      )}

      {/* Active Feedback Display */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {activeFeedback.map((feedback) => (
            <motion.div
              key={feedback.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
              className={`p-4 rounded-lg border backdrop-blur-lg relative bg-dark-tertiary/30 border-${getFeedbackColor(feedback.type)}/30`}
            >
              {/* Feedback Content */}
              <div className="flex items-start space-x-3">
                <div className={`text-${getFeedbackColor(feedback.type)} mt-0.5`}>
                  {getFeedbackIcon(feedback.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold text-${getFeedbackColor(feedback.type)} text-sm`}>
                      {feedback.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-text-muted">
                        {Math.round(feedback.confidence * 100)}%
                      </span>
                      {feedback.dismissible && (
                        <button
                          onClick={() => dismissFeedback(feedback.id)}
                          className="text-text-muted hover:text-text-primary transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-text-primary text-sm mb-2">
                    {feedback.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">
                      {feedback.context}
                    </span>
                    {feedback.action && (
                      <button
                        onClick={feedback.action.callback}
                        className={`text-xs px-3 py-1 rounded-full bg-${getFeedbackColor(feedback.type)}/20 text-${getFeedbackColor(feedback.type)} hover:bg-${getFeedbackColor(feedback.type)}/30 transition-colors`}
                      >
                        {feedback.action.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Priority indicator */}
              <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                feedback.priority === 'critical' ? 'bg-red-500' :
                feedback.priority === 'high' ? 'bg-orange-500' :
                feedback.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Feedback Queue Indicator */}
      {feedbackQueue.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center"
        >
          <span className="text-xs text-text-muted">
            {feedbackQueue.length} more insight{feedbackQueue.length > 1 ? 's' : ''} pending
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default AIFeedbackEngine;