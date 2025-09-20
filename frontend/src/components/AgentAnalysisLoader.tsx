import * as React from 'react';
import { motion } from 'framer-motion';
import { CpuChipIcon, SparklesIcon, BoltIcon } from '@heroicons/react/24/outline';

interface AgentAnalysisLoaderProps {
  isRunning: boolean;
  progress?: number;
  currentStep?: string;
  agentName?: string;
}

const AgentAnalysisLoader: React.FC<AgentAnalysisLoaderProps> = ({
  isRunning,
  progress = 0,
  currentStep = "Initializing analysis...",
  agentName = "AI Agent"
}) => {
  if (!isRunning) return null;

  const steps = [
    "Initializing analysis...",
    "Analyzing roadmap structure...",
    "Processing node relationships...",
    "Evaluating confidence metrics...",
    "Generating insights...",
    "Finalizing report..."
  ];

  const currentStepIndex = steps.findIndex(step => step === currentStep);
  const progressPercentage = progress > 0 ? progress : ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900/95 backdrop-blur-xl border border-neon-blue-primary/30 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-neon-blue-primary to-neon-purple-primary rounded-full flex items-center justify-center"
          >
            <CpuChipIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h3 className="text-xl font-bold text-white mb-2">
            {agentName} Analysis
          </h3>
          <p className="text-gray-400 text-sm">
            Processing your roadmap with advanced AI
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-blue-primary to-neon-purple-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="mb-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center space-x-3"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-neon-blue-primary rounded-full"
            />
            <span className="text-gray-300 text-sm">{currentStep}</span>
          </motion.div>
        </div>

        {/* Animated Icons */}
        <div className="flex justify-center space-x-4 mb-6">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0
            }}
            className="w-8 h-8 text-neon-blue-primary"
          >
            <SparklesIcon className="w-full h-full" />
          </motion.div>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 0.5
            }}
            className="w-8 h-8 text-neon-purple-primary"
          >
            <BoltIcon className="w-full h-full" />
          </motion.div>
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              delay: 1
            }}
            className="w-8 h-8 text-neon-blue-primary"
          >
            <CpuChipIcon className="w-full h-full" />
          </motion.div>
        </div>

        {/* Status Text */}
        <div className="text-center">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gray-400 text-sm"
          >
            This may take a few moments...
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AgentAnalysisLoader;
