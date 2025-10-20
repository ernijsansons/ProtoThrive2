// Ref: CLAUDE.md - AI service monitoring and usage tracking
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { aiService } from '../services/aiService';
import {
  CpuChipIcon,
  BanknotesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface AIServiceMonitorProps {
  className?: string;
  showDetails?: boolean;
}

interface ServiceStatus {
  isOperational: boolean;
  model: string;
  requestCount: number;
  sessionCost: number;
  budgetRemaining: number;
  lastResponse: Date | null;
  errorCount: number;
}

const AIServiceMonitor: React.FC<AIServiceMonitorProps> = ({
  className = '',
  showDetails = true
}) => {
  const [status, setStatus] = useState<ServiceStatus>({
    isOperational: true,
    model: 'mock',
    requestCount: 0,
    sessionCost: 0,
    budgetRemaining: 0.50,
    lastResponse: null,
    errorCount: 0
  });

  const [isVisible, setIsVisible] = useState(false);

  // Update status from AI service
  useEffect(() => {
    const updateStatus = () => {
      try {
        const metrics = aiService.getSessionMetrics();
        setStatus(prev => ({
          ...prev,
          requestCount: metrics.requestCount,
          sessionCost: metrics.cost,
          budgetRemaining: metrics.budgetRemaining,
          lastResponse: new Date(),
          isOperational: metrics.budgetRemaining > 0
        }));
      } catch (error) {
        console.error('AI Service Monitor error:', error);
        setStatus(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1,
          isOperational: false
        }));
      }
    };

    // Initial status check
    updateStatus();

    // Check status every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Show monitor if there are requests or errors
  useEffect(() => {
    setIsVisible(status.requestCount > 0 || status.errorCount > 0);
  }, [status.requestCount, status.errorCount]);

  const getStatusColor = () => {
    if (!status.isOperational || status.errorCount > 0) return 'neon-pink';
    if (status.budgetRemaining < 0.1) return 'neon-orange';
    if (status.requestCount > 0) return 'neon-green-primary';
    return 'neon-blue-primary';
  };

  const getStatusText = () => {
    if (!status.isOperational) return 'Service Offline';
    if (status.budgetRemaining <= 0) return 'Budget Exceeded';
    if (status.errorCount > 0) return 'Errors Detected';
    if (status.requestCount > 0) return 'AI Active';
    return 'Standby';
  };

  if (!isVisible && !showDetails) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`${className}`}
    >
      <div className={`p-3 rounded-lg bg-dark-tertiary/30 border border-${getStatusColor()}/30`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <CpuChipIcon className={`w-4 h-4 text-${getStatusColor()}`} />
            <span className="text-xs font-medium text-text-primary">AI Service</span>
            <div className={`w-2 h-2 rounded-full bg-${getStatusColor()}`} />
          </div>
          <span className={`text-xs text-${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {showDetails && (
          <div className="space-y-2">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-xs text-text-muted">Requests</div>
                <div className={`text-sm font-bold text-${getStatusColor()}`}>
                  {status.requestCount}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-text-muted">Cost</div>
                <div className={`text-sm font-bold text-${getStatusColor()}`}>
                  ${status.sessionCost.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Budget Bar */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-text-muted">Budget</span>
                <span className="text-xs text-text-muted">
                  ${status.budgetRemaining.toFixed(2)} remaining
                </span>
              </div>
              <div className="w-full h-1 bg-dark-tertiary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-${getStatusColor()}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(status.budgetRemaining / 0.50) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Error Count */}
            {status.errorCount > 0 && (
              <div className="flex items-center space-x-2 p-2 rounded bg-neon-pink/10 border border-neon-pink/20">
                <ExclamationTriangleIcon className="w-3 h-3 text-neon-pink" />
                <span className="text-xs text-neon-pink">
                  {status.errorCount} error{status.errorCount > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {/* Last Response */}
            {status.lastResponse && (
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="w-3 h-3 text-neon-green-primary" />
                <span className="text-xs text-text-muted">
                  Last response: {status.lastResponse.toLocaleTimeString().slice(0, 5)}
                </span>
              </div>
            )}

            {/* Status Messages */}
            {status.budgetRemaining <= 0 && (
              <div className="text-xs text-neon-orange bg-neon-orange/10 p-2 rounded">
                Budget exhausted. Switched to mock mode.
              </div>
            )}

            {!status.isOperational && status.budgetRemaining > 0 && (
              <div className="text-xs text-neon-pink bg-neon-pink/10 p-2 rounded">
                AI service unavailable. Using fallback mode.
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIServiceMonitor;