import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  CpuChipIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ClockIcon
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

interface AgentReportDisplayProps {
  report: AgentReport;
}

const AgentReportDisplay: React.FC<AgentReportDisplayProps> = ({ report }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-neon-green-primary';
    if (confidence >= 0.6) return 'text-neon-orange';
    return 'text-red-400';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-neon-green-primary/10 border-neon-green-primary/20';
    if (confidence >= 0.6) return 'bg-neon-orange/10 border-neon-orange/20';
    return 'bg-red-400/10 border-red-400/20';
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(3)}`;
  };

  return (
    <div className="space-y-4">
      {/* Error State */}
      {report.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-red-400/10 border border-red-400/20"
        >
          <div className="flex items-center space-x-2">
            <XCircleIcon className="w-5 h-5 text-red-400" />
            <div>
              <h4 className="text-sm font-medium text-red-400">Analysis Failed</h4>
              <p className="text-xs text-red-300 mt-1">{report.error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Primary Agent Info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg bg-dark-tertiary/30 border border-neon-blue-primary/20"
        role="region"
        aria-label="AI Analysis Results"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CpuChipIcon className="w-5 h-5 text-neon-blue-primary" />
            <h3 className="text-sm font-bold text-neon-blue-primary">AI Analysis</h3>
          </div>
          {report.fallback_used && (
            <div className="flex items-center space-x-1 text-xs text-neon-orange">
              <ExclamationTriangleIcon className="w-4 h-4" />
              <span>Fallback Used</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className={`text-lg font-bold ${getConfidenceColor(report.confidence)}`}>
              {Math.round(report.confidence * 100)}%
            </div>
            <div className="text-xs text-text-muted">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-neon-green-primary">
              {report.agent}
            </div>
            <div className="text-xs text-text-muted">Agent</div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="mt-4 pt-3 border-t border-neon-blue-primary/20">
          <div className="flex items-center space-x-2 mb-2">
            <CurrencyDollarIcon className="w-4 h-4 text-neon-green-primary" />
            <span className="text-xs font-medium text-text-primary">Cost Breakdown</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Actual:</span>
              <span className="text-neon-green-primary">{formatCost(report.cost.actual)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Remaining:</span>
              <span className="text-neon-blue-primary">{formatCost(report.cost.remaining)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trace Entries */}
      {report.trace && report.trace.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
          role="region"
          aria-label="Execution Trace"
        >
          <div className="flex items-center space-x-2 mb-3">
            <ClockIcon className="w-4 h-4 text-neon-purple" />
            <h4 className="text-sm font-medium text-neon-purple">Execution Trace</h4>
          </div>
          
          <div className="space-y-2">
            {report.trace.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`p-3 rounded-lg border ${
                  entry.success 
                    ? 'bg-neon-green-primary/5 border-neon-green-primary/20' 
                    : 'bg-red-400/5 border-red-400/20'
                }`}
                role="listitem"
                aria-label={`Agent ${entry.agent} - ${entry.success ? 'Success' : 'Failed'} - Confidence: ${Math.round(entry.confidence * 100)}%`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {entry.success ? (
                      <CheckCircleIcon className="w-4 h-4 text-neon-green-primary" />
                    ) : (
                      <XCircleIcon className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-medium text-text-primary">
                      {entry.agent}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted">
                    {Math.round(entry.confidence * 100)}%
                  </div>
                </div>
                
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-text-muted">Cost: {formatCost(entry.cost)}</span>
                  {entry.error && (
                    <span className="text-red-400 truncate max-w-32" title={entry.error}>
                      {entry.error}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AgentReportDisplay;
