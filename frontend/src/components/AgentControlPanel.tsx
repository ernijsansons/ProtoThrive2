import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CpuChipIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BoltIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface AgentConfig {
  selectedAgent: 'enterprise' | 'lightweight' | 'auto';
  budget: number;
  maxBudget: number;
  confidenceThreshold: number;
  mode: 'fallback' | 'direct' | 'parallel';
  task: string;
  enableFallback: boolean;
  enableParallel: boolean;
  customPrompts: boolean;
}

interface AgentStatus {
  isRunning: boolean;
  isPaused: boolean;
  currentStep: string;
  progress: number;
  estimatedTime: number;
  actualCost: number;
  remainingBudget: number;
}

interface AgentControlPanelProps {
  config: AgentConfig;
  status: AgentStatus;
  onConfigChange: (config: Partial<AgentConfig>) => void;
  onStartAnalysis: () => void;
  onStopAnalysis: () => void;
  onPauseAnalysis: () => void;
  onResetConfig: () => void;
  className?: string;
}

const AgentControlPanel: React.FC<AgentControlPanelProps> = ({
  config,
  status,
  onConfigChange,
  onStartAnalysis,
  onStopAnalysis,
  onPauseAnalysis,
  onResetConfig,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const agents = [
    {
      id: 'enterprise' as const,
      name: 'Enterprise Agent',
      description: 'High-performance analysis with advanced reasoning',
      icon: <CpuChipIcon className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-500/30',
      cost: 'High',
      speed: 'Medium',
      accuracy: 'High'
    },
    {
      id: 'lightweight' as const,
      name: 'Lightweight Agent',
      description: 'Fast analysis with basic reasoning',
      icon: <BoltIcon className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-900/20',
      borderColor: 'border-purple-500/30',
      cost: 'Low',
      speed: 'Fast',
      accuracy: 'Medium'
    },
    {
      id: 'auto' as const,
      name: 'Auto Selection',
      description: 'Automatically choose the best agent',
      icon: <SparklesIcon className="w-5 h-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-500/30',
      cost: 'Variable',
      speed: 'Variable',
      accuracy: 'High'
    }
  ];

  const modes = [
    { id: 'fallback' as const, name: 'Fallback', description: 'Try primary, fallback on failure' },
    { id: 'direct' as const, name: 'Direct', description: 'Use selected agent only' },
    { id: 'parallel' as const, name: 'Parallel', description: 'Run multiple agents simultaneously' }
  ];

  const presets = [
    {
      name: 'Quick Analysis',
      config: { budget: 0.1, confidenceThreshold: 0.7, mode: 'direct' as const, selectedAgent: 'lightweight' as const }
    },
    {
      name: 'Deep Analysis',
      config: { budget: 0.5, confidenceThreshold: 0.9, mode: 'fallback' as const, selectedAgent: 'enterprise' as const }
    },
    {
      name: 'Cost Optimized',
      config: { budget: 0.2, confidenceThreshold: 0.8, mode: 'fallback' as const, selectedAgent: 'auto' as const }
    },
    {
      name: 'Maximum Accuracy',
      config: { budget: 1.0, confidenceThreshold: 0.95, mode: 'parallel' as const, selectedAgent: 'enterprise' as const }
    }
  ];

  const selectedAgent = agents.find(a => a.id === config.selectedAgent) || agents[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-900/95 backdrop-blur-xl border border-neon-blue-primary/30 rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Cog6ToothIcon className="w-6 h-6 text-neon-blue-primary" />
          <h3 className="text-xl font-bold text-white">Agent Control Panel</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowPathIcon className="w-5 h-5" />
            </motion.div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Agent Selection */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Agent Selection</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {agents.map((agent) => (
                  <motion.button
                    key={agent.id}
                    onClick={() => onConfigChange({ selectedAgent: agent.id })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-lg border transition-all duration-300 ${
                      config.selectedAgent === agent.id
                        ? `${agent.bgColor} ${agent.borderColor} border-2`
                        : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={agent.color}>
                        {agent.icon}
                      </div>
                      <div className="text-left">
                        <h5 className="font-medium text-white">{agent.name}</h5>
                        <p className="text-xs text-gray-400">{agent.description}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Cost: {agent.cost}</span>
                      <span>Speed: {agent.speed}</span>
                      <span>Accuracy: {agent.accuracy}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Budget Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Budget Controls</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CurrencyDollarIcon className="w-4 h-4" />
                  <span>${config.budget.toFixed(3)} / ${config.maxBudget.toFixed(3)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Analysis Budget
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0.05"
                      max={config.maxBudget}
                      step="0.05"
                      value={config.budget}
                      onChange={(e) => onConfigChange({ budget: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>$0.05</span>
                      <span>${config.maxBudget.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <div className="text-sm text-blue-400 font-medium">Actual Cost</div>
                    <div className="text-lg font-bold text-white">${status.actualCost.toFixed(3)}</div>
                  </div>
                  <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <div className="text-sm text-green-400 font-medium">Remaining</div>
                    <div className="text-lg font-bold text-white">${status.remainingBudget.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence Threshold */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Confidence Threshold</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Minimum Confidence: {Math.round(config.confidenceThreshold * 100)}%
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={config.confidenceThreshold}
                      onChange={(e) => onConfigChange({ confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Analysis Mode */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Analysis Mode</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {modes.map((mode) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => onConfigChange({ mode: mode.id })}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-lg border transition-all duration-300 ${
                      config.mode === mode.id
                        ? 'bg-neon-blue-primary/10 border-neon-blue-primary/50 border-2'
                        : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600/50'
                    }`}
                  >
                    <h5 className="font-medium text-white mb-1">{mode.name}</h5>
                    <p className="text-xs text-gray-400">{mode.description}</p>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Quick Presets</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presets.map((preset) => (
                  <motion.button
                    key={preset.name}
                    onClick={() => onConfigChange(preset.config)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg hover:border-gray-600/50 transition-all duration-300"
                  >
                    <h5 className="font-medium text-white text-sm">{preset.name}</h5>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <h4 className="text-lg font-semibold text-white">Advanced Options</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.enableFallback}
                        onChange={(e) => onConfigChange({ enableFallback: e.target.checked })}
                        className="w-4 h-4 text-neon-blue-primary bg-gray-700 border-gray-600 rounded focus:ring-neon-blue-primary"
                      />
                      <span className="text-sm text-gray-300">Enable Fallback Mode</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.enableParallel}
                        onChange={(e) => onConfigChange({ enableParallel: e.target.checked })}
                        className="w-4 h-4 text-neon-blue-primary bg-gray-700 border-gray-600 rounded focus:ring-neon-blue-primary"
                      />
                      <span className="text-sm text-gray-300">Enable Parallel Processing</span>
                    </label>
                    
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={config.customPrompts}
                        onChange={(e) => onConfigChange({ customPrompts: e.target.checked })}
                        className="w-4 h-4 text-neon-blue-primary bg-gray-700 border-gray-600 rounded focus:ring-neon-blue-primary"
                      />
                      <span className="text-sm text-gray-300">Use Custom Prompts</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Custom Task Description
                    </label>
                    <textarea
                      value={config.task}
                      onChange={(e) => onConfigChange({ task: e.target.value })}
                      placeholder="Describe the specific analysis task..."
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue-primary"
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
              <button
                onClick={onResetConfig}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Reset to Defaults
              </button>
              
              <div className="flex items-center space-x-3">
                {status.isRunning ? (
                  <>
                    <motion.button
                      onClick={onPauseAnalysis}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-yellow-900/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-900/30 transition-colors"
                    >
                      <PauseIcon className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={onStopAnalysis}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors"
                    >
                      <StopIcon className="w-4 h-4" />
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    onClick={onStartAnalysis}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-gradient-to-r from-neon-blue-primary to-neon-purple-primary text-white rounded-lg hover:shadow-glow-blue transition-all duration-300 flex items-center space-x-2"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Start Analysis</span>
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AgentControlPanel;
