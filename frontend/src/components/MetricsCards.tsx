import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { 
  ClockIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
  delay?: number;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  trend,
  delay = 0,
  className = ''
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Color configurations
  const colorConfig = {
    blue: {
      bg: 'bg-neon-blue-primary/10',
      border: 'border-neon-blue-primary/30',
      text: 'text-neon-blue-primary',
      glow: 'shadow-glow-blue'
    },
    green: {
      bg: 'bg-neon-green-primary/10',
      border: 'border-neon-green-primary/30',
      text: 'text-neon-green-primary',
      glow: 'shadow-glow-green'
    },
    orange: {
      bg: 'bg-neon-orange/10',
      border: 'border-neon-orange/30',
      text: 'text-neon-orange',
      glow: 'shadow-glow-blue'
    },
    purple: {
      bg: 'bg-neon-purple/10',
      border: 'border-neon-purple/30',
      text: 'text-neon-purple',
      glow: 'shadow-glow-purple'
    },
    pink: {
      bg: 'bg-neon-pink/10',
      border: 'border-neon-pink/30',
      text: 'text-neon-pink',
      glow: 'shadow-glow-blue'
    }
  };

  const config = colorConfig[color];

  // Animate number values
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      if (typeof value === 'number') {
        const duration = 1500;
        const steps = 30;
        const stepDuration = duration / steps;
        const stepValue = value / steps;

        let currentStep = 0;
        const animationTimer = setInterval(() => {
          if (currentStep >= steps) {
            setAnimatedValue(value);
            clearInterval(animationTimer);
          } else {
            setAnimatedValue(prev => prev + stepValue);
            currentStep++;
          }
        }, stepDuration);

        return () => clearInterval(animationTimer);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  const displayValue = typeof value === 'number' ? Math.round(animatedValue) : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : 20, 
        scale: isVisible ? 1 : 0.9 
      }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: `0 0 25px ${color === 'blue' ? 'rgba(0, 210, 255, 0.3)' : 'rgba(0, 255, 136, 0.3)'}` 
      }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      className={`relative p-4 rounded-xl backdrop-blur-lg border transition-all duration-300 ${config.bg} ${config.border} ${className}`}
    >
      {/* Background glow effect */}
      <div className={`absolute -inset-1 rounded-xl blur opacity-20 -z-10 ${config.bg.replace('/10', '/20')}`} />

      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bg} ${config.border} border backdrop-blur-lg`}
          >
            <div className={`w-5 h-5 ${config.text}`}>
              {icon}
            </div>
          </motion.div>
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
            {title}
          </h3>
        </div>

        {/* Trend indicator */}
        {trend && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.5 }}
            className={`flex items-center space-x-1 text-xs ${
              trend.direction === 'up' 
                ? 'text-neon-green-primary' 
                : trend.direction === 'down' 
                ? 'text-neon-pink' 
                : 'text-text-muted'
            }`}
          >
            <span className="text-xs">
              {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
            </span>
            <span>{trend.percentage}%</span>
          </motion.div>
        )}
      </div>

      {/* Main value */}
      <motion.div
        animate={{ scale: isVisible ? 1 : 0.8 }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
        className="mb-2"
      >
        <div className={`text-2xl font-bold ${config.text}`}>
          {displayValue}
          {typeof value === 'number' && value > 0 && typeof displayValue === 'number' && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 1 }}
              className="text-lg"
            >
              {title.includes('Rate') || title.includes('Activity') ? '%' : ''}
            </motion.span>
          )}
        </div>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.3 }}
            className="text-xs text-text-muted"
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>

      {/* Pulse animation for high values */}
      <AnimatePresence>
        {typeof value === 'number' && value >= 90 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`absolute inset-0 rounded-xl ${config.glow} pointer-events-none`}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MetricsCards: React.FC = () => {
  const { insightsPanel: { metrics } } = useStore();
  const [refreshKey, setRefreshKey] = useState(0);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours.toFixed(1)}h`;
  };

  const formatSyncTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          title="Completion"
          value={metrics.completionRate}
          subtitle="Project progress"
          icon={<CheckCircleIcon />}
          color="green"
          trend={{ direction: 'up', percentage: 12 }}
          delay={0}
        />
        <MetricCard
          title="AI Activity"
          value={metrics.agentActivity}
          subtitle="Agent engagement"
          icon={<BoltIcon />}
          color="blue"
          trend={{ direction: 'up', percentage: 8 }}
          delay={100}
        />
      </div>

      {/* Time Tracking Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl bg-dark-tertiary/30 border border-neon-blue-primary/20 backdrop-blur-lg"
      >
        <div className="flex items-center space-x-2 mb-3">
          <ClockIcon className="w-5 h-5 text-neon-blue-primary" />
          <h3 className="text-sm font-medium text-neon-blue-primary">Time Tracking</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-text-primary">
              {formatTime(metrics.timeTracking.totalTime)}
            </div>
            <div className="text-xs text-text-muted">Total</div>
          </div>
          <div>
            <div className="text-lg font-bold text-neon-green-primary">
              {formatTime(metrics.timeTracking.todayTime)}
            </div>
            <div className="text-xs text-text-muted">Today</div>
          </div>
          <div>
            <div className="text-lg font-bold text-neon-orange">
              {formatTime(metrics.timeTracking.activeTime)}
            </div>
            <div className="text-xs text-text-muted">Active</div>
          </div>
        </div>
      </motion.div>

      {/* Collaboration & Productivity */}
      <div className="grid grid-cols-1 gap-3">
        <MetricCard
          title="Team Sync"
          value={`${metrics.teamCollaboration.activeMembers}/${metrics.teamCollaboration.totalMembers}`}
          subtitle={formatSyncTime(metrics.teamCollaboration.lastSync)}
          icon={<UserGroupIcon />}
          color="purple"
          delay={200}
        />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-dark-tertiary/30 border border-neon-green-primary/20 backdrop-blur-lg"
        >
          <div className="flex items-center space-x-2 mb-3">
            <ChartBarIcon className="w-5 h-5 text-neon-green-primary" />
            <h3 className="text-sm font-medium text-neon-green-primary">Productivity</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-neon-green-primary">
                {metrics.productivity.tasksCompleted}
              </div>
              <div className="text-xs text-text-muted">Done</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-neon-blue-primary">
                {metrics.productivity.tasksInProgress}
              </div>
              <div className="text-xs text-text-muted">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-neon-pink">
                {metrics.productivity.blockers}
              </div>
              <div className="text-xs text-text-muted">Blocked</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Real-time Activity Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center space-x-2 py-2"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-neon-green-primary"
        />
        <span className="text-xs text-text-muted">Live metrics • Updates every 30s</span>
      </motion.div>
    </div>
  );
};

export default MetricsCards;