import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuChipIcon, 
  ChartBarIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  StopIcon
} from '@heroicons/react/24/outline';

interface AgentStatus {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: string;
  progress: number;
  estimatedTime: number;
  actualCost: number;
  remainingBudget: number;
  agentName: string;
  confidence: number;
  success: boolean;
  error?: string;
}

interface AgentStatusMonitorProps {
  status: AgentStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  className?: string;
}

const AgentStatusMonitor: React.FC<AgentStatusMonitorProps> = ({
  status,
  onStart,
  onPause,
  onStop,
  className = ''
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const getStatusColor = () => {
    if (status.error) return 'text-red-400';
    if (status.isPaused) return 'text-yellow-400';
    if (status.isRunning) return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (status.error) return <XCircleIcon className="w-5 h-5" />;
    if (status.isPaused) return <PauseIcon className="w-5 h-5" />;
    if (status.isRunning) return <PlayIcon className="w-5 h-5" />;
    return <StopIcon className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (status.error) return 'Error';
    if (status.isPaused) return 'Paused';
    if (status.isRunning) return 'Running';
    return 'Stopped';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/95 backdrop-blur-xl border border-neon-blue-primary/30 rounded-xl p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <motion.div
            animate={{ 
              scale: status.isRunning ? [1, 1.1, 1] : 1,
              rotate: status.isRunning ? [0, 5, -5, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: status.isRunning ? Infinity : 0 
            }}
            className={`p-2 rounded-lg ${getStatusColor()}`}
          >
            {getStatusIcon()}
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-white">Agent Status</h3>
            <p className="text-sm text-gray-400">{status.agentName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            status.error ? 'bg-red-900/20 text-red-400' :
            status.isPaused ? 'bg-yellow-900/20 text-yellow-400' :
            status.isRunning ? 'bg-green-900/20 text-green-400' :
            'bg-gray-900/20 text-gray-400'
          }`}>
            {getStatusText()}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <motion.div
              animate={{ rotate: showDetails ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChartBarIcon className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {status.isRunning && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{status.currentStep}</span>
            <span>{Math.round(status.progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-blue-primary to-neon-purple-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${status.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {status.error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg mb-4"
        >
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-5 h-5 text-red-400" />
            <span className="text-red-400 font-medium">Error</span>
          </div>
          <p className="text-red-300 text-sm mt-1">{status.error}</p>
        </motion.div>
      )}

      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Confidence */}
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ChartBarIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Confidence</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl font-bold text-blue-400">
                    {Math.round(status.confidence * 100)}%
                  </span>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <motion.div
                      className="h-full bg-blue-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${status.confidence * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              {/* Time */}
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ClockIcon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Time</span>
                </div>
                <div className="text-xl font-bold text-purple-400">
                  {formatTime(status.estimatedTime)}
                </div>
              </div>

              {/* Cost */}
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CurrencyDollarIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Cost</span>
                </div>
                <div className="text-xl font-bold text-green-400">
                  ${status.actualCost.toFixed(3)}
                </div>
              </div>

              {/* Budget */}
              <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BoltIcon className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-gray-300">Budget</span>
                </div>
                <div className="text-xl font-bold text-orange-400">
                  ${status.remainingBudget.toFixed(3)}
                </div>
              </div>
            </div>

            {/* Agent Performance */}
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-3">Agent Performance</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Agent:</span>
                  <span className="text-white">{status.agentName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status:</span>
                  <span className={getStatusColor()}>{getStatusText()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Success Rate:</span>
                  <span className={status.success ? 'text-green-400' : 'text-red-400'}>
                    {status.success ? '100%' : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-3 pt-4 border-t border-gray-700/50">
        {status.isRunning ? (
          <>
            <motion.button
              onClick={onPause}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-yellow-900/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-900/30 transition-colors flex items-center space-x-2"
            >
              <PauseIcon className="w-4 h-4" />
              <span>Pause</span>
            </motion.button>
            <motion.button
              onClick={onStop}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors flex items-center space-x-2"
            >
              <StopIcon className="w-4 h-4" />
              <span>Stop</span>
            </motion.button>
          </>
        ) : (
          <motion.button
            onClick={onStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gradient-to-r from-neon-blue-primary to-neon-purple-primary text-white rounded-lg hover:shadow-glow-blue transition-all duration-300 flex items-center space-x-2"
          >
            <PlayIcon className="w-4 h-4" />
            <span>Start Analysis</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default AgentStatusMonitor;
