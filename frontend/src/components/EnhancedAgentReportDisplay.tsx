import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  CpuChipIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  SparklesIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface AgentReport {
  agent: string;
  confidence: number;
  cost: {
    estimate: number;
    actual: number;
    consumed: number;
    remaining: number;
  };
  fallback_used: boolean;
  trace: Array<{
    agent: string;
    success: boolean;
    confidence: number;
    cost: number;
    error?: string;
  }>;
  error?: string;
}

interface EnhancedAgentReportDisplayProps {
  report: AgentReport;
}

const EnhancedAgentReportDisplay: React.FC<EnhancedAgentReportDisplayProps> = ({ report }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-900/20 border-green-500/30';
    if (confidence >= 0.6) return 'bg-yellow-900/20 border-yellow-500/30';
    return 'bg-red-900/20 border-red-500/30';
  };

  const getAgentIcon = (agent: string) => {
    switch (agent.toLowerCase()) {
      case 'enterprise':
        return <CpuChipIcon className="w-6 h-6" />;
      case 'lightweight':
        return <ClockIcon className="w-6 h-6" />;
      default:
        return <CpuChipIcon className="w-6 h-6" />;
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

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(3)}`;
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Error State */}
      {report.error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl backdrop-blur-sm"
        >
          <div className="flex items-center space-x-3">
            <XCircleIcon className="w-6 h-6 text-red-400" />
            <div>
              <h4 className="text-lg font-semibold text-red-400">Analysis Failed</h4>
              <p className="text-sm text-red-300 mt-1">{report.error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Success State */}
      {!report.error && (
        <>
          {/* Primary Agent Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-neon-blue-primary/20 rounded-xl backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`p-2 rounded-lg ${getAgentColor(report.agent)}`}
                >
                  {getAgentIcon(report.agent)}
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-white capitalize">
                    {report.agent} Agent
                  </h3>
                  <p className="text-sm text-gray-400">
                    {report.fallback_used ? 'Fallback Analysis' : 'Primary Analysis'}
                  </p>
                </div>
              </div>
              
              {report.fallback_used && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded-full"
                >
                  <span className="text-yellow-400 text-xs font-medium">Fallback Used</span>
                </motion.div>
              )}
            </div>

            {/* Confidence and Cost Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Confidence */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`p-4 rounded-lg border ${getConfidenceBg(report.confidence)}`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <ChartBarIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Confidence</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-2xl font-bold ${getConfidenceColor(report.confidence)}`}>
                    {formatConfidence(report.confidence)}
                  </span>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className={`h-full rounded-full ${
                        report.confidence >= 0.8 ? 'bg-green-400' :
                        report.confidence >= 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${report.confidence * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Cost Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-gray-300">Cost</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Actual:</span>
                    <span className="text-blue-400 font-semibold">{formatCost(report.cost.actual)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Remaining:</span>
                    <span className="text-green-400 font-semibold">{formatCost(report.cost.remaining)}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Trace Entries */}
          {report.trace.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              <h4 className="text-lg font-semibold text-white flex items-center space-x-2">
                <SparklesIcon className="w-5 h-5 text-neon-blue-primary" />
                <span>Analysis Trace</span>
              </h4>
              
              <div className="space-y-2">
                {report.trace.map((entry, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1, repeat: Infinity, delay: index * 0.2 }}
                          className={`p-2 rounded-lg ${
                            entry.success ? 'bg-green-900/30' : 'bg-red-900/30'
                          }`}
                        >
                          {entry.success ? (
                            <CheckCircleIcon className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircleIcon className="w-5 h-5 text-red-400" />
                          )}
                        </motion.div>
                        <div>
                          <h5 className="font-medium text-white capitalize">
                            {entry.agent} Agent
                          </h5>
                          <p className="text-sm text-gray-400">
                            {entry.success ? 'Success' : 'Failed'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">Confidence:</span>
                          <span className={`text-sm font-semibold ${getConfidenceColor(entry.confidence)}`}>
                            {formatConfidence(entry.confidence)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">Cost:</span>
                          <span className="text-sm font-semibold text-blue-400">
                            {formatCost(entry.cost)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {entry.error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg"
                      >
                        <p className="text-sm text-red-300">{entry.error}</p>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default EnhancedAgentReportDisplay;
