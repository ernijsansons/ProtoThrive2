import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import {
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  LightBulbIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface AssistantMessage {
  id: string;
  type: 'welcome' | 'suggestion' | 'tip' | 'warning' | 'congratulation' | 'question';
  title: string;
  content: string;
  actions?: {
    label: string;
    action: () => void;
    primary?: boolean;
  }[];
  contextElement?: string; // CSS selector for context
  priority: 'low' | 'medium' | 'high';
  autoHide?: number; // milliseconds
  persistent?: boolean;
}

interface ContextualPosition {
  x: number;
  y: number;
  anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  offset: { x: number; y: number };
}

interface ContextualAIAssistantProps {
  className?: string;
  defaultPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'floating';
  enableContextualPositioning?: boolean;
  maxMessages?: number;
  autoActivate?: boolean;
}

const ContextualAIAssistant: React.FC<ContextualAIAssistantProps> = ({
  className = '',
  defaultPosition = 'bottom-right',
  enableContextualPositioning = true,
  maxMessages = 1,
  autoActivate = true
}) => {
  const {
    nodes,
    edges,
    thriveScore,
    mode,
    insightsPanel,
    addChatMessage
  } = useStore();

  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<AssistantMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<AssistantMessage[]>([]);
  const [position, setPosition] = useState<ContextualPosition>({
    x: 20,
    y: 20,
    anchor: 'bottom-right',
    offset: { x: 0, y: 0 }
  });
  const [isTyping, setIsTyping] = useState(false);
  const [contextTarget, setContextTarget] = useState<HTMLElement | null>(null);

  const assistantRef = useRef<HTMLDivElement>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastInteractionRef = useRef(Date.now());

  // Context-aware message generation
  const generateContextualMessage = useCallback((): AssistantMessage | null => {
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionRef.current;

    // Welcome message for new users
    if (nodes.length === 0 && edges.length === 0) {
      return {
        id: `welcome_${now}`,
        type: 'welcome',
        title: 'Welcome to ProtoThrive!',
        content: 'I\'m your AI assistant. I can help you build amazing prototypes. Would you like me to show you around?',
        actions: [
          {
            label: 'Show me around',
            action: () => {
              addChatMessage({
                sender: 'agent',
                message: 'Great! Let me give you a quick tour of ProtoThrive\'s features.'
              });
            },
            primary: true
          },
          {
            label: 'Start building',
            action: () => {
              // Focus on canvas
              const canvas = document.querySelector('[data-tutorial="canvas"]');
              if (canvas) {
                canvas.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        ],
        priority: 'medium',
        persistent: true
      };
    }

    // Suggestion for isolated components
    if (nodes.length > 1 && edges.length === 0) {
      return {
        id: `connection_suggestion_${now}`,
        type: 'suggestion',
        title: 'Connect Your Components',
        content: 'You have multiple components but no connections. Try linking them to define relationships and data flow.',
        actions: [
          {
            label: 'Show me how',
            action: () => {
              addChatMessage({
                sender: 'agent',
                message: 'To connect components, simply drag from one node to another. This helps define your application\'s architecture!'
              });
            },
            primary: true
          }
        ],
        contextElement: '[data-tutorial="canvas"]',
        priority: 'high',
        autoHide: 8000
      };
    }

    // Performance optimization tip
    if (thriveScore < 0.6 && nodes.length > 3) {
      return {
        id: `performance_tip_${now}`,
        type: 'tip',
        title: 'Boost Your Performance',
        content: 'Your Thrive Score suggests some optimization opportunities. Want me to analyze your project structure?',
        actions: [
          {
            label: 'Analyze now',
            action: () => {
              // Trigger analysis
              addChatMessage({
                sender: 'agent',
                message: 'Running performance analysis on your project structure...'
              });
            },
            primary: true
          }
        ],
        priority: 'medium',
        autoHide: 10000
      };
    }

    // Congratulations for good progress
    if (thriveScore > 0.8 && nodes.length >= 3 && edges.length >= 2) {
      return {
        id: `congratulation_${now}`,
        type: 'congratulation',
        title: 'Excellent Work!',
        content: 'Your project is looking great! You\'ve achieved a high Thrive Score with good architecture.',
        actions: [
          {
            label: 'What\'s next?',
            action: () => {
              addChatMessage({
                sender: 'agent',
                message: 'With your solid foundation, you might want to focus on advanced features like animations or user interactions!'
              });
            }
          }
        ],
        priority: 'low',
        autoHide: 6000
      };
    }

    // Mode switching suggestion
    if (mode === '2d' && nodes.length > 2 && Math.random() > 0.8) {
      return {
        id: `mode_suggestion_${now}`,
        type: 'tip',
        title: 'Try 3D View',
        content: 'Your project has enough complexity to benefit from the 3D view. Want to see it in a new dimension?',
        actions: [
          {
            label: 'Switch to 3D',
            action: () => {
              const toggleButton = document.querySelector('[data-tutorial="mode-toggle"]') as HTMLButtonElement;
              if (toggleButton) {
                toggleButton.click();
              }
            },
            primary: true
          }
        ],
        contextElement: '[data-tutorial="mode-toggle"]',
        priority: 'low',
        autoHide: 7000
      };
    }

    // Idle user engagement
    if (timeSinceLastInteraction > 180000 && Math.random() > 0.7) { // 3 minutes
      return {
        id: `idle_engagement_${now}`,
        type: 'question',
        title: 'Need Help?',
        content: 'You\'ve been quiet for a while. Is there anything I can help you with?',
        actions: [
          {
            label: 'I\'m good',
            action: () => setIsVisible(false)
          },
          {
            label: 'Show tips',
            action: () => {
              addChatMessage({
                sender: 'agent',
                message: 'Here are some tips to enhance your project: 1) Add meaningful labels to components, 2) Create logical groupings, 3) Test different layouts!'
              });
            },
            primary: true
          }
        ],
        priority: 'low',
        autoHide: 12000
      };
    }

    return null;
  }, [nodes.length, edges.length, thriveScore, mode, addChatMessage]);

  // Smart positioning based on context
  const calculateContextualPosition = useCallback((targetElement?: HTMLElement) => {
    if (!enableContextualPositioning || !assistantRef.current) {
      return;
    }

    const assistantRect = assistantRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newPosition: ContextualPosition;

    if (targetElement) {
      const targetRect = targetElement.getBoundingClientRect();
      const centerX = targetRect.left + targetRect.width / 2;
      const centerY = targetRect.top + targetRect.height / 2;

      // Position assistant near but not overlapping the target
      if (centerX < viewportWidth / 2) {
        // Target is on left side, position assistant to the right
        newPosition = {
          x: Math.min(targetRect.right + 20, viewportWidth - assistantRect.width - 20),
          y: Math.max(20, Math.min(targetRect.top, viewportHeight - assistantRect.height - 20)),
          anchor: 'top-left',
          offset: { x: 0, y: 0 }
        };
      } else {
        // Target is on right side, position assistant to the left
        newPosition = {
          x: Math.max(20, targetRect.left - assistantRect.width - 20),
          y: Math.max(20, Math.min(targetRect.top, viewportHeight - assistantRect.height - 20)),
          anchor: 'top-right',
          offset: { x: 0, y: 0 }
        };
      }
    } else {
      // Default positioning
      const positions = {
        'bottom-right': { x: viewportWidth - assistantRect.width - 20, y: viewportHeight - assistantRect.height - 20, anchor: 'bottom-right' as const },
        'bottom-left': { x: 20, y: viewportHeight - assistantRect.height - 20, anchor: 'bottom-left' as const },
        'top-right': { x: viewportWidth - assistantRect.width - 20, y: 20, anchor: 'top-right' as const },
        'top-left': { x: 20, y: 20, anchor: 'top-left' as const }
      };

      newPosition = {
        ...positions[defaultPosition],
        offset: { x: 0, y: 0 }
      };
    }

    setPosition(newPosition);
  }, [enableContextualPositioning, defaultPosition]);

  // Message processing
  const processMessageQueue = useCallback(() => {
    if (messageQueue.length > 0 && !currentMessage) {
      const nextMessage = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));

      // Find context element if specified
      let targetElement: HTMLElement | null = null;
      if (nextMessage.contextElement) {
        targetElement = document.querySelector(nextMessage.contextElement);
        setContextTarget(targetElement);
      }

      setIsTyping(true);

      // Simulate typing delay
      typingTimeoutRef.current = setTimeout(() => {
        setCurrentMessage(nextMessage);
        setIsExpanded(true);
        setIsVisible(true);
        setIsTyping(false);

        // Calculate position based on context
        if (targetElement) {
          calculateContextualPosition(targetElement);
        }

        // Auto-hide if specified
        if (nextMessage.autoHide && !nextMessage.persistent) {
          messageTimeoutRef.current = setTimeout(() => {
            hideMessage();
          }, nextMessage.autoHide);
        }
      }, 800 + Math.random() * 1200);
    }
  }, [messageQueue, currentMessage, calculateContextualPosition]);

  // Hide current message
  const hideMessage = useCallback(() => {
    setIsExpanded(false);
    setTimeout(() => {
      setCurrentMessage(null);
      setContextTarget(null);
      if (!messageQueue.length) {
        setIsVisible(false);
      }
    }, 300);

    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
  }, [messageQueue.length]);

  // Generate and queue messages
  const generateMessage = useCallback(() => {
    if (autoActivate && messageQueue.length < maxMessages) {
      const message = generateContextualMessage();
      if (message) {
        setMessageQueue(prev => [...prev, message]);
      }
    }
  }, [autoActivate, messageQueue.length, maxMessages, generateContextualMessage]);

  // Update last interaction time
  useEffect(() => {
    lastInteractionRef.current = Date.now();
  }, [nodes, edges, mode, insightsPanel.activeTab]);

  // Auto-generate messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance
        generateMessage();
      }
    }, 10000); // Check every 10 seconds

    // Initial message after 3 seconds
    const initialTimeout = setTimeout(() => {
      generateMessage();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [generateMessage]);

  // Process message queue
  useEffect(() => {
    processMessageQueue();
  }, [processMessageQueue]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (contextTarget) {
        calculateContextualPosition(contextTarget);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateContextualPosition, contextTarget]);

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'welcome': return <SparklesIcon className="w-5 h-5" />;
      case 'suggestion': return <LightBulbIcon className="w-5 h-5" />;
      case 'tip': return <InformationCircleIcon className="w-5 h-5" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'congratulation': return <CheckCircleIcon className="w-5 h-5" />;
      case 'question': return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      default: return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'neon-blue-primary';
      case 'suggestion': return 'neon-green-primary';
      case 'tip': return 'neon-purple';
      case 'warning': return 'neon-orange';
      case 'congratulation': return 'neon-green-primary';
      case 'question': return 'neon-blue-light';
      default: return 'neon-blue-primary';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed z-50 ${className}`}>
      <motion.div
        ref={assistantRef}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: position.x,
          y: position.y
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
        className="relative"
      >
        {/* Context Connection Line */}
        {contextTarget && enableContextualPositioning && (
          <motion.div
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.5, pathLength: 1 }}
            className="absolute -z-10"
          >
            <svg
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: Math.abs(position.x - (contextTarget.getBoundingClientRect().left + contextTarget.getBoundingClientRect().width / 2)) + 100,
                height: Math.abs(position.y - (contextTarget.getBoundingClientRect().top + contextTarget.getBoundingClientRect().height / 2)) + 100
              }}
            >
              <motion.path
                d={`M 50 50 Q 50 25 ${Math.abs(position.x - (contextTarget.getBoundingClientRect().left + contextTarget.getBoundingClientRect().width / 2)) + 50} ${Math.abs(position.y - (contextTarget.getBoundingClientRect().top + contextTarget.getBoundingClientRect().height / 2)) + 50}`}
                stroke="var(--neon-blue-primary)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </svg>
          </motion.div>
        )}

        {/* Assistant Container */}
        <motion.div
          layout
          className="bg-dark-secondary/95 backdrop-blur-xl border border-neon-blue-primary/30 rounded-2xl shadow-2xl max-w-sm"
          style={{
            boxShadow: '0 0 30px rgba(0, 210, 255, 0.3)'
          }}
        >
          {/* Collapsed State - Avatar Only */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-3"
              >
                <motion.button
                  onClick={() => setIsExpanded(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-blue-primary to-neon-purple flex items-center justify-center"
                >
                  {isTyping ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <SparklesIcon className="w-6 h-6 text-white" />
                    </motion.div>
                  ) : (
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded State - Full Message */}
          <AnimatePresence>
            {isExpanded && currentMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`text-${getMessageColor(currentMessage.type)}`}>
                      {getMessageIcon(currentMessage.type)}
                    </div>
                    <h4 className={`font-bold text-${getMessageColor(currentMessage.type)} text-sm`}>
                      {currentMessage.title}
                    </h4>
                  </div>
                  <button
                    onClick={hideMessage}
                    className="text-text-muted hover:text-text-primary transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <p className="text-text-primary text-sm mb-4 leading-relaxed">
                  {currentMessage.content}
                </p>

                {/* Actions */}
                {currentMessage.actions && currentMessage.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentMessage.actions.map((action, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          action.action();
                          if (!currentMessage.persistent) {
                            hideMessage();
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          action.primary
                            ? `bg-${getMessageColor(currentMessage.type)}/20 text-${getMessageColor(currentMessage.type)} border border-${getMessageColor(currentMessage.type)}/30`
                            : 'bg-dark-tertiary/50 text-text-muted border border-text-muted/30 hover:bg-dark-tertiary/70'
                        }`}
                      >
                        {action.label}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Priority Indicator */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                  currentMessage.priority === 'high' ? 'bg-neon-pink' :
                  currentMessage.priority === 'medium' ? 'bg-neon-orange' :
                  'bg-neon-green-primary'
                }`} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Drag Handle for Manual Positioning */}
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-dark-tertiary/80 rounded-full border border-neon-blue-primary/30 flex items-center justify-center cursor-move opacity-0 hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
          drag
          onDrag={(_, info) => {
            setPosition(prev => ({
              ...prev,
              x: prev.x + info.delta.x,
              y: prev.y + info.delta.y
            }));
          }}
        >
          <ArrowsPointingOutIcon className="w-3 h-3 text-neon-blue-light" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContextualAIAssistant;