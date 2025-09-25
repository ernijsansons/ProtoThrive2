import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { audioService, playNotificationSound } from '../services/audioService';
import { InputValidator } from '../utils/security';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  ClockIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArchiveBoxIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export interface SmartNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'ai_insight' | 'milestone' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'progress' | 'ai' | 'user' | 'deployment' | 'collaboration';
  context?: string;
  action?: {
    label: string;
    callback: () => void;
  };
  metadata?: {
    source?: string;
    relatedId?: string;
    confidence?: number;
    tags?: string[];
  };
  read: boolean;
  archived: boolean;
  persistent: boolean;
  expiresAt?: Date;
  sound?: boolean;
  vibration?: boolean;
}

interface NotificationQueue {
  pending: SmartNotification[];
  active: SmartNotification[];
  scheduled: SmartNotification[];
}

interface NotificationFilters {
  type?: string[];
  priority?: string[];
  category?: string[];
  read?: boolean;
  archived?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SmartNotificationCenterProps {
  className?: string;
  maxActiveNotifications?: number;
  autoArchiveAfter?: number; // hours
  enableSound?: boolean;
  enableVibration?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showBadge?: boolean;
  intelligentBatching?: boolean;
}

const SmartNotificationCenter: React.FC<SmartNotificationCenterProps> = ({
  className = '',
  maxActiveNotifications = 5,
  autoArchiveAfter = 24,
  enableSound = true,
  enableVibration = false,
  position = 'top-right',
  showBadge = true,
  intelligentBatching = true
}) => {
  const {
    nodes,
    edges,
    thriveScore,
    agentStatus,
    insightsPanel,
    updateMetrics
  } = useStore();

  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [queue, setQueue] = useState<NotificationQueue>({
    pending: [],
    active: [],
    scheduled: []
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [smartInsights, setSmartInsights] = useState<any[]>([]);

  const queueIntervalRef = useRef<NodeJS.Timeout>();
  const cleanupIntervalRef = useRef<NodeJS.Timeout>();
  const soundRef = useRef<HTMLAudioElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Add notification to queue
  const addNotification = useCallback((notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read' | 'archived'>) => {
    const newNotification: SmartNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
      archived: false,
      ...notification
    };

    setQueue(prev => ({
      ...prev,
      pending: [...prev.pending, newNotification]
    }));

    setNotifications(prev => [newNotification, ...prev]);

    // Play sound if enabled using enhanced audio service
    if (enableSound && newNotification.sound) {
      const soundType = newNotification.type === 'ai_insight' ? 'ai_insight' :
                       newNotification.type === 'milestone' ? 'milestone' :
                       newNotification.type === 'success' ? 'success' :
                       newNotification.type === 'warning' ? 'warning' :
                       newNotification.type === 'error' ? 'error' : 'info';

      playNotificationSound(soundType as any, 0.6).catch(() => {
        // Ignore audio play errors
      });
    }

    // Vibrate if enabled and supported
    if (enableVibration && newNotification.vibration && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [enableSound, enableVibration]);

  // Generate initial welcome notifications
  const generateInitialNotifications = useCallback(() => {
    const initialNotifications = [
      {
        type: 'success' as const,
        title: 'Welcome to ProtoThrive!',
        message: 'Your intelligent prototyping environment is ready.',
        priority: 'medium' as const,
        category: 'system' as const,
        persistent: true,
        sound: true,
        vibration: enableVibration
      },
      {
        type: 'info' as const,
        title: 'Smart Features Enabled',
        message: 'AI assistance, progress tracking, and real-time insights are active.',
        priority: 'low' as const,
        category: 'system' as const,
        persistent: false,
        vibration: enableVibration,
        metadata: {
          tags: ['features', 'ai']
        }
      }
    ];

    initialNotifications.forEach(notification => {
      setTimeout(() => addNotification(notification), Math.random() * 2000);
    });
  }, [enableVibration, addNotification]);

  // Initialize notification system
  useEffect(() => {
    // Set up periodic queue processing
    queueIntervalRef.current = setInterval(() => {
      processNotificationQueue();
    }, 2000);

    // Set up automatic cleanup
    cleanupIntervalRef.current = setInterval(() => {
      cleanupExpiredNotifications();
    }, 300000); // Every 5 minutes

    // Add some initial notifications for demo
    generateInitialNotifications();

    return () => {
      if (queueIntervalRef.current) clearInterval(queueIntervalRef.current);
      if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current);
    };
  }, [generateInitialNotifications]);

  // Focus management for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return;

      if (e.key === 'Escape') {
        setIsExpanded(false);
        return;
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = panelRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the first element when panel opens
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  // Smart notification generation based on context
  const generateContextualNotifications = useCallback(() => {
    const contextNotifications: SmartNotification[] = [];

    // Progress-based notifications
    if (thriveScore > 0.8 && Math.random() > 0.7) {
      contextNotifications.push({
        id: `milestone_${Date.now()}`,
        type: 'milestone',
        title: 'Excellent Progress!',
        message: `Your Thrive Score of ${InputValidator.sanitizeInput(Math.round(thriveScore * 100).toString())}% indicates outstanding project health.`,
        timestamp: new Date(),
        priority: 'medium',
        category: 'progress',
        context: 'High thrive score detected',
        metadata: {
          source: 'progress_monitor',
          confidence: 0.92,
          tags: ['achievement', 'progress']
        },
        read: false,
        archived: false,
        persistent: false,
        sound: true
      });
    }

    // AI insights
    if (agentStatus.isRunning && Math.random() > 0.6) {
      const insights = [
        'Consider adding more component connections for better architecture',
        'Your current design pattern shows strong consistency',
        'Opportunity detected for performance optimization',
        'Ready for the next development phase'
      ];

      contextNotifications.push({
        id: `ai_insight_${Date.now()}`,
        type: 'ai_insight',
        title: 'AI Recommendation',
        message: insights[Math.floor(Math.random() * insights.length)],
        timestamp: new Date(),
        priority: 'medium',
        category: 'ai',
        context: 'Agent analysis complete',
        action: {
          label: 'View Details',
          callback: () => {
            // Switch to insights panel
            console.log('Opening AI insights panel');
          }
        },
        metadata: {
          source: 'ai_agent',
          confidence: 0.85,
          tags: ['recommendation', 'ai']
        },
        read: false,
        archived: false,
        persistent: false
      });
    }

    // System notifications
    if (nodes.length === 0 && Math.random() > 0.8) {
      contextNotifications.push({
        id: `reminder_${Date.now()}`,
        type: 'reminder',
        title: 'Ready to Start?',
        message: 'Add your first component to begin building your prototype.',
        timestamp: new Date(),
        priority: 'low',
        category: 'user',
        action: {
          label: 'Add Component',
          callback: () => {
            console.log('Opening component library');
          }
        },
        read: false,
        archived: false,
        persistent: true
      });
    }

    return contextNotifications;
  }, [thriveScore, agentStatus.isRunning, nodes.length]);

  // Process notification queue with intelligent batching
  const processNotificationQueue = useCallback(() => {
    setQueue(prev => {
      const newQueue = { ...prev };

      // Move pending to active if space available
      if (newQueue.active.length < maxActiveNotifications && newQueue.pending.length > 0) {
        const toActivate = intelligentBatching
          ? smartBatchNotifications(newQueue.pending)
          : newQueue.pending.slice(0, maxActiveNotifications - newQueue.active.length);

        newQueue.active = [...newQueue.active, ...toActivate];
        newQueue.pending = newQueue.pending.filter(n => !toActivate.includes(n));
      }

      // Generate new contextual notifications
      const contextual = generateContextualNotifications();
      if (contextual.length > 0) {
        newQueue.pending = [...newQueue.pending, ...contextual];
      }

      return newQueue;
    });
  }, [maxActiveNotifications, intelligentBatching, generateContextualNotifications]);

  // Smart batching algorithm
  const smartBatchNotifications = (pending: SmartNotification[]): SmartNotification[] => {
    // Sort by priority and timestamp
    const sorted = [...pending].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    // Group similar notifications
    const grouped = new Map<string, SmartNotification[]>();
    sorted.forEach(notification => {
      const key = `${notification.type}_${notification.category}`;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(notification);
    });

    // Select representatives from each group
    const result: SmartNotification[] = [];
    for (const [, group] of grouped) {
      result.push(group[0]); // Take highest priority from each group
      if (result.length >= maxActiveNotifications) break;
    }

    return result;
  };

  // Clean up expired notifications
  const cleanupExpiredNotifications = () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - (autoArchiveAfter * 60 * 60 * 1000));

    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        archived: notification.archived ||
          (!notification.persistent && notification.timestamp < cutoff)
      }))
    );
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setQueue(prev => ({
      ...prev,
      active: prev.active.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  // Archive notification
  const archiveNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, archived: true } : n)
    );
    setQueue(prev => ({
      ...prev,
      active: prev.active.filter(n => n.id !== id)
    }));
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    setQueue(prev => ({
      ...prev,
      active: prev.active.filter(n => n.id !== id),
      pending: prev.pending.filter(n => n.id !== id)
    }));
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      if (filters.read !== undefined && notification.read !== filters.read) return false;
      if (filters.archived !== undefined && notification.archived !== filters.archived) return false;
      if (filters.type && !filters.type.includes(notification.type)) return false;
      if (filters.priority && !filters.priority.includes(notification.priority)) return false;
      if (filters.category && !filters.category.includes(notification.category)) return false;
      if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <InformationCircleIcon className="w-5 h-5" />;
      case 'success': return <CheckCircleIcon className="w-5 h-5" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'error': return <XCircleIcon className="w-5 h-5" />;
      case 'ai_insight': return <SparklesIcon className="w-5 h-5" />;
      case 'milestone': return <CheckCircleIcon className="w-5 h-5" />;
      case 'reminder': return <ClockIcon className="w-5 h-5" />;
      default: return <BellIcon className="w-5 h-5" />;
    }
  };

  // Get notification color - Updated for WCAG AA contrast compliance
  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'red-400'; // High contrast for critical

    switch (type) {
      case 'success':
      case 'milestone': return 'green-400'; // High contrast green
      case 'warning': return 'yellow-400'; // Enhanced contrast for warnings
      case 'error': return 'red-400'; // High contrast red
      case 'ai_insight': return 'purple-400'; // Enhanced purple
      case 'info':
      case 'reminder':
      default: return 'blue-400'; // High contrast blue
    }
  };

  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const filteredNotifications = getFilteredNotifications();

  return (
    <div className={`${className}`}>
      {/* ARIA Live Region for Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {unreadCount > 0 && `${unreadCount} new notifications available`}
      </div>

      {/* Notification Bell */}
      <motion.div
        className={`relative ${position.includes('right') ? 'ml-auto' : ''}`}
        whileHover={{ scale: 1.05 }}
      >
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative p-3 rounded-full bg-dark-tertiary/50 border border-neon-blue-primary/30 hover:border-neon-blue-primary/60 transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
          whileTap={{ scale: 0.95 }}
          aria-label={`${isExpanded ? 'Close' : 'Open'} notifications panel`}
          aria-expanded={isExpanded}
        >
          <BellIcon className="w-7 h-7 text-neon-blue-primary" />

          {showBadge && unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-neon-pink rounded-full flex items-center justify-center"
            >
              <span className="text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </motion.div>
          )}
        </motion.button>
      </motion.div>

      {/* Notification Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`absolute z-50 w-96 max-h-96 bg-dark-secondary/95 backdrop-blur-xl border border-neon-blue-primary/30 rounded-lg shadow-glow-blue ${
              position.includes('right') ? 'right-0' : 'left-0'
            } ${
              position.includes('top') ? 'top-12' : 'bottom-12'
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notifications-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neon-blue-primary/20">
              <div className="flex items-center space-x-2">
                <BellIcon className="w-5 h-5 text-neon-blue-primary" />
                <h3 id="notifications-title" className="text-sm font-bold text-neon-blue-primary">Smart Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-neon-blue-primary/20 text-neon-blue-primary text-xs rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                ref={firstFocusableRef}
                onClick={() => setIsExpanded(false)}
                className="text-text-muted hover:text-text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                aria-label="Close notifications panel"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-3 border-b border-neon-blue-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-tertiary/50 border border-neon-blue-primary/20 rounded-lg text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-neon-blue-primary/60"
                  />
                </div>
                <button 
                  className="p-3 bg-dark-tertiary/50 border border-neon-blue-primary/20 rounded-lg hover:border-neon-blue-primary/60 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                  aria-label="Filter notifications"
                  title="Filter notifications"
                >
                  <FunnelIcon className="w-5 h-5 text-text-muted" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {filteredNotifications.length === 0 ? (
                <div className="p-6 text-center">
                  <BellIcon className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No notifications to display</p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                        notification.read
                          ? 'bg-dark-tertiary/30 border-text-muted/20'
                          : `bg-${getNotificationColor(notification.type, notification.priority)}/10 border-${getNotificationColor(notification.type, notification.priority)}/30`
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`text-${getNotificationColor(notification.type, notification.priority)} mt-0.5`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-medium ${
                              notification.read ? 'text-text-muted' : 'text-text-primary'
                            }`}>
                              {InputValidator.sanitizeInput(notification.title)}
                            </h4>
                            <span className="text-xs text-text-muted ml-2">
                              {notification.timestamp.toLocaleTimeString().slice(0, 5)}
                            </span>
                          </div>

                          <p className={`text-xs ${
                            notification.read ? 'text-text-muted' : 'text-text-primary'
                          } mb-2`}>
                            {InputValidator.sanitizeInput(notification.message)}
                          </p>

                          {notification.metadata?.tags && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {notification.metadata.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-text-muted/20 text-text-muted text-xs rounded-full"
                                >
                                  {InputValidator.sanitizeInput(tag)}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            {notification.action && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  notification.action!.callback();
                                }}
                                className={`text-xs px-3 py-1 rounded-full bg-${getNotificationColor(notification.type, notification.priority)}/20 text-${getNotificationColor(notification.type, notification.priority)} hover:bg-${getNotificationColor(notification.type, notification.priority)}/30 transition-colors`}
                              >
                                {notification.action.label}
                              </button>
                            )}

                            <div className="flex items-center space-x-1 ml-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  archiveNotification(notification.id);
                                }}
                                className="p-3 hover:bg-text-muted/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                                title="Archive notification"
                                aria-label={`Archive notification: ${notification.title}`}
                              >
                                <ArchiveBoxIcon className="w-5 h-5 text-text-muted" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-3 hover:bg-neon-pink/20 rounded transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                                title="Delete notification"
                                aria-label={`Delete notification: ${notification.title}`}
                              >
                                <TrashIcon className="w-5 h-5 text-text-muted hover:text-neon-pink" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-neon-blue-primary/20">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      const unread = filteredNotifications.filter(n => !n.read);
                      unread.forEach(n => markAsRead(n.id));
                    }}
                    className="text-xs text-neon-blue-primary hover:text-neon-blue-light transition-colors"
                  >
                    Mark all as read
                  </button>
                  <button
                    ref={lastFocusableRef}
                    onClick={() => {
                      filteredNotifications.forEach(n => archiveNotification(n.id));
                    }}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                    aria-label="Archive all notifications"
                  >
                    Archive all
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Notifications Overlay */}
      <div className="fixed top-4 right-4 z-40 space-y-2 pointer-events-none">
        <AnimatePresence>
          {queue.active.slice(0, 3).map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              className="pointer-events-auto max-w-sm p-4 bg-dark-secondary/95 backdrop-blur-xl border border-neon-blue-primary/30 rounded-lg shadow-glow-blue"
            >
              <div className="flex items-start space-x-3">
                <div className={`text-${getNotificationColor(notification.type, notification.priority)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-text-primary mb-1">
                    {InputValidator.sanitizeInput(notification.title)}
                  </h4>
                  <p className="text-xs text-text-muted">
                    {InputValidator.sanitizeInput(notification.message)}
                  </p>
                  {notification.action && (
                    <button
                      onClick={notification.action.callback}
                      className={`mt-2 text-xs px-3 py-1 rounded-full bg-${getNotificationColor(notification.type, notification.priority)}/20 text-${getNotificationColor(notification.type, notification.priority)} hover:bg-${getNotificationColor(notification.type, notification.priority)}/30 transition-colors`}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => archiveNotification(notification.id)}
                  className="text-text-muted hover:text-text-primary transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                  aria-label={`Dismiss notification: ${notification.title}`}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Audio element for notification sounds */}
      <audio
        ref={soundRef}
        preload="auto"
        className="hidden"
      >
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.ogg" type="audio/ogg" />
      </audio>
    </div>
  );
};

export default SmartNotificationCenter;