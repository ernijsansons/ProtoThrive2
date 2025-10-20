import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VirtualizedList from './VirtualizedList';
import { 
  ClockIcon, 
  CpuChipIcon, 
  ChartBarIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface AnalysisHistoryEntry {
  id: string;
  timestamp: Date;
  agent: string;
  confidence: number;
  cost: number;
  success: boolean;
  fallbackUsed: boolean;
  duration: number; // in seconds
}

interface AnalysisHistoryProps {
  history: AnalysisHistoryEntry[];
  onViewEntry: (entry: AnalysisHistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  history,
  onViewEntry,
  onDeleteEntry,
  onClearHistory
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAgentIcon = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'enterprise':
        return <CpuChipIcon className="w-4 h-4" />;
      case 'lightweight':
        return <ClockIcon className="w-4 h-4" />;
      default:
        return <CpuChipIcon className="w-4 h-4" />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'enterprise':
        return 'text-blue-400';
      case 'lightweight':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <ChartBarIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-400 mb-2">No Analysis History</h3>
        <p className="text-sm text-gray-500">
          Run your first AI analysis to see it appear here
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-neon-blue-primary" />
          <span>Analysis History</span>
        </h3>
        <button
          onClick={onClearHistory}
          className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center space-x-1"
        >
          <TrashIcon className="w-4 h-4" />
          <span>Clear All</span>
        </button>
      </div>

      {/* History List - Virtualized for performance */}
      <div className="max-h-96">
        {history.length > 10 ? (
          <VirtualizedList
            items={history}
            height={384} // 96 * 4 (max-h-96)
            itemHeight={80}
            overscanCount={3}
            renderItem={({ index, style, item: entry }) => (
              <motion.div
                key={entry.id}
                style={style}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm hover:bg-gray-700/50 transition-colors"
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Status Icon */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: index * 0.1 }}
                    className={`p-2 rounded-lg ${
                      entry.success ? 'bg-green-900/30' : 'bg-red-900/30'
                    }`}
                  >
                    {entry.success ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-400" />
                    )}
                  </motion.div>

                  {/* Agent Info */}
                  <div className="flex items-center space-x-2">
                    <div className={`${getAgentColor(entry.agent)}`}>
                      {getAgentIcon(entry.agent)}
                    </div>
                    <div>
                      <h4 className="font-medium text-white capitalize">
                        {entry.agent} Agent
                      </h4>
                      <p className="text-xs text-gray-400">
                        {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                      </p>
                    </div>
                  </div>

                  {/* Fallback Badge */}
                  {entry.fallbackUsed && (
                    <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                      Fallback
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-4">
                  {/* Confidence */}
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <ChartBarIcon className="w-3 h-3 text-gray-400" />
                      <span className={`text-sm font-semibold ${getConfidenceColor(entry.confidence)}`}>
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <CurrencyDollarIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-semibold text-blue-400">
                        ${entry.cost.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-300">
                        {formatDuration(entry.duration)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onViewEntry(entry)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEntry(entry.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Entry"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
            )}
          />
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {history.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Status Icon */}
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
                        className={`p-2 rounded-lg ${
                          entry.success ? 'bg-green-900/30' : 'bg-red-900/30'
                        }`}
                      >
                        {entry.success ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-400" />
                        )}
                      </motion.div>

                      {/* Agent Info */}
                      <div className="flex items-center space-x-2">
                        <div className={`${getAgentColor(entry.agent)}`}>
                          {getAgentIcon(entry.agent)}
                        </div>
                        <div>
                          <h5 className="font-medium text-white capitalize">
                            {entry.agent} Agent
                          </h5>
                          <p className="text-sm text-gray-400">
                            {formatDate(entry.timestamp)} at {formatTime(entry.timestamp)}
                          </p>
                        </div>
                      </div>

                      {/* Fallback Badge */}
                      {entry.fallbackUsed && (
                        <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded-full text-xs text-yellow-400">
                          Fallback
                        </span>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center space-x-4">
                      {/* Confidence */}
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <ChartBarIcon className="w-3 h-3 text-gray-400" />
                          <span className={`text-sm font-semibold ${getConfidenceColor(entry.confidence)}`}>
                            {Math.round(entry.confidence * 100)}%
                          </span>
                        </div>
                      </div>

                      {/* Cost */}
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <CurrencyDollarIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-semibold text-blue-400">
                            ${entry.cost.toFixed(3)}
                          </span>
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-300">
                            {formatDuration(entry.duration)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewEntry(entry)}
                          className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete Entry"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-neon-blue-primary/20 rounded-lg"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{history.length}</div>
            <div className="text-xs text-gray-400">Total Runs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {Math.round((history.filter(h => h.success).length / history.length) * 100)}%
            </div>
            <div className="text-xs text-gray-400">Success Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400">
              ${history.reduce((sum, h) => sum + h.cost, 0).toFixed(3)}
            </div>
            <div className="text-xs text-gray-400">Total Cost</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalysisHistory;
