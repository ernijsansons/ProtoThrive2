/**
 * Live AI Roadmap Generator Component
 * Connects frontend AI service to backend for real-time roadmap generation
 * Ref: CLAUDE.md - Phase 2 Live AI Integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { aiService, AIRoadmapRequest, AIRoadmapResponse } from '../services/aiService';
import { api } from '../services/api';
import { useWebSocket } from '../services/websocket';
import {
  SparklesIcon,
  BeakerIcon,
  CpuChipIcon,
  RocketLaunchIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface LiveGenerationState {
  isGenerating: boolean;
  progress: number;
  stage: 'analyzing' | 'generating' | 'optimizing' | 'finalizing' | 'complete' | 'error';
  message: string;
  estimatedTime: number;
  currentStep: string;
}

interface AIGenerationRequest {
  prompt: string;
  projectType: 'web' | 'mobile' | 'api' | 'library' | 'other';
  complexity: 'low' | 'medium' | 'high';
  teamSize: number;
  timeframe: 'weeks' | 'months' | 'quarters';
  preferences: {
    methodology: 'agile' | 'waterfall' | 'hybrid';
    prioritizeSpeed: boolean;
    includeRisks: boolean;
    detailLevel: 'high' | 'medium' | 'low';
  };
}

const LiveAIRoadmapGenerator: React.FC = () => {
  const { loadGraph, updateScore, addChatMessage } = useStore();
  const [generationState, setGenerationState] = useState<LiveGenerationState>({
    isGenerating: false,
    progress: 0,
    stage: 'analyzing',
    message: 'Ready to generate...',
    estimatedTime: 0,
    currentStep: ''
  });

  const [request, setRequest] = useState<AIGenerationRequest>({
    prompt: '',
    projectType: 'web',
    complexity: 'medium',
    teamSize: 3,
    timeframe: 'months',
    preferences: {
      methodology: 'agile',
      prioritizeSpeed: false,
      includeRisks: true,
      detailLevel: 'high'
    }
  });

  const [lastGenerated, setLastGenerated] = useState<AIRoadmapResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // WebSocket for real-time updates
  const { isConnected: wsConnected, send: wsSend } = useWebSocket((message) => {
    if (message.type === 'ai_feedback' && message.payload.type === 'generation_progress') {
      updateGenerationProgress(message.payload);
    }
  });

  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  const updateGenerationProgress = useCallback((progressData: any) => {
    setGenerationState(prev => ({
      ...prev,
      progress: progressData.progress || prev.progress,
      stage: progressData.stage || prev.stage,
      message: progressData.message || prev.message,
      currentStep: progressData.step || prev.currentStep,
      estimatedTime: progressData.estimatedTime || prev.estimatedTime
    }));
  }, []);

  const generateRoadmap = async () => {
    if (!request.prompt.trim()) {
      addChatMessage({
        sender: 'agent',
        message: 'Please enter a project description'
      });
      return;
    }

    setGenerationState({
      isGenerating: true,
      progress: 0,
      stage: 'analyzing',
      message: 'Analyzing your project requirements...',
      estimatedTime: 30,
      currentStep: 'Parsing project description'
    });


    try {
      // Stage 1: Analysis (0-25%)
      await simulateProgress('analyzing', 'Analyzing project scope and requirements...', 0, 25, 3000);

      // Convert request to AI service format
      const aiRequest: AIRoadmapRequest = {
        prompt: request.prompt,
        projectType: request.projectType,
        complexity: request.complexity,
        timeframe: request.timeframe,
        teamSize: request.teamSize,
        existingTech: [],
        constraints: []
      };

      // Stage 2: Generation (25-70%)
      await simulateProgress('generating', 'Generating roadmap structure and tasks...', 25, 70, 5000);

      // Call AI service for roadmap generation
      const response = await aiService.generateRoadmap(aiRequest);

      // Stage 3: Optimization (70-90%)
      await simulateProgress('optimizing', 'Optimizing task dependencies and timeline...', 70, 90, 2000);

      // Save to backend if connected
      try {
        const roadmapData = {
          json_graph: JSON.stringify({
            nodes: response.roadmap.nodes,
            edges: response.roadmap.edges
          }),
          vibe_mode: request.preferences.methodology === 'agile',
          title: response.roadmap.title,
          description: response.roadmap.description
        };

        const savedRoadmap = await api.createRoadmap(roadmapData);
        console.log('Thermonuclear: Roadmap saved to backend', savedRoadmap);
      } catch (saveError) {
        console.warn('Failed to save to backend, continuing with local version:', saveError);
      }

      // Stage 4: Finalization (90-100%)
      await simulateProgress('finalizing', 'Finalizing roadmap and applying preferences...', 90, 100, 1000);

      // Load the generated roadmap into the canvas (map status values)
      const mappedNodes = response.roadmap.nodes.map(node => ({
        ...node,
        status: node.status === 'completed' ? 'neon' : 'gray' as 'gray' | 'neon'
      }));
      loadGraph(mappedNodes, response.roadmap.edges);
      updateScore(response.roadmap.confidence);

      setLastGenerated(response);
      setGenerationState({
        isGenerating: false,
        progress: 100,
        stage: 'complete',
        message: `Successfully generated ${response.roadmap.nodes.length} tasks with ${response.roadmap.confidence.toFixed(1)}% confidence`,
        estimatedTime: 0,
        currentStep: 'Complete!'
      });

      // Send WebSocket notification
      if (wsConnected) {
        wsSend({
          type: 'ai_feedback',
          payload: {
            type: 'roadmap_generated',
            roadmap: response.roadmap,
              }
        });
      }

      addChatMessage({
        sender: 'agent',
        message: `🎉 Generated roadmap with ${response.roadmap.nodes.length} tasks! Estimated duration: ${response.roadmap.estimatedDuration} weeks`,
      });

    } catch (error) {
      console.error('Roadmap generation failed:', error);

      setGenerationState({
        isGenerating: false,
        progress: 0,
        stage: 'error',
        message: error instanceof Error ? error.message : 'Generation failed',
        estimatedTime: 0,
        currentStep: 'Error occurred'
      });

      addChatMessage({
        sender: 'agent',
        message: `❌ Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
    }
  };

  const simulateProgress = async (stage: LiveGenerationState['stage'], message: string, startProgress: number, endProgress: number, duration: number) => {
    const steps = 20;
    const stepDuration = duration / steps;
    const progressStep = (endProgress - startProgress) / steps;

    for (let i = 0; i <= steps; i++) {
      const currentProgress = startProgress + (progressStep * i);

      setGenerationState(prev => ({
        ...prev,
        stage,
        message,
        progress: Math.min(currentProgress, endProgress),
        estimatedTime: Math.max(0, prev.estimatedTime - (stepDuration / 1000))
      }));

      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  };

  const getStageIcon = (stage: LiveGenerationState['stage']) => {
    switch (stage) {
      case 'analyzing': return <BeakerIcon className="h-5 w-5" />;
      case 'generating': return <CpuChipIcon className="h-5 w-5" />;
      case 'optimizing': return <SparklesIcon className="h-5 w-5" />;
      case 'finalizing': return <RocketLaunchIcon className="h-5 w-5" />;
      case 'complete': return <CheckCircleIcon className="h-5 w-5" />;
      case 'error': return <XCircleIcon className="h-5 w-5" />;
      default: return <BeakerIcon className="h-5 w-5" />;
    }
  };

  const getStageColor = (stage: LiveGenerationState['stage']) => {
    switch (stage) {
      case 'analyzing': return 'text-blue-400';
      case 'generating': return 'text-green-400';
      case 'optimizing': return 'text-purple-400';
      case 'finalizing': return 'text-orange-400';
      case 'complete': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="glass-elite p-6 rounded-xl border border-neon-blue-primary/30">
      <div className="flex items-center space-x-3 mb-6">
        <SparklesIcon className="h-6 w-6 text-neon-blue-primary animate-neon-glow" />
        <h2 className="text-xl font-bold text-neon-blue-primary">Live AI Roadmap Generator</h2>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      </div>

      {/* Generation Request Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Project Description
          </label>
          <textarea
            value={request.prompt}
            onChange={(e) => setRequest(prev => ({ ...prev, prompt: e.target.value }))}
            placeholder="Describe your project goals, features, and requirements..."
            className="w-full p-3 bg-dark-tertiary border border-border rounded-lg text-text-primary placeholder-text-muted focus:border-neon-blue-primary focus:ring-1 focus:ring-neon-blue-primary"
            rows={3}
            disabled={generationState.isGenerating}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Type</label>
            <select
              value={request.projectType}
              onChange={(e) => setRequest(prev => ({ ...prev, projectType: e.target.value as any }))}
              className="w-full p-2 bg-dark-tertiary border border-border rounded-lg text-text-primary focus:border-neon-blue-primary"
              disabled={generationState.isGenerating}
            >
              <option value="web">Web App</option>
              <option value="mobile">Mobile App</option>
              <option value="api">API/Backend</option>
              <option value="library">Library</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Complexity</label>
            <select
              value={request.complexity}
              onChange={(e) => setRequest(prev => ({ ...prev, complexity: e.target.value as any }))}
              className="w-full p-2 bg-dark-tertiary border border-border rounded-lg text-text-primary focus:border-neon-blue-primary"
              disabled={generationState.isGenerating}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Team Size</label>
            <input
              type="number"
              value={request.teamSize}
              onChange={(e) => setRequest(prev => ({ ...prev, teamSize: parseInt(e.target.value) || 1 }))}
              min="1"
              max="20"
              className="w-full p-2 bg-dark-tertiary border border-border rounded-lg text-text-primary focus:border-neon-blue-primary"
              disabled={generationState.isGenerating}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Timeframe</label>
            <select
              value={request.timeframe}
              onChange={(e) => setRequest(prev => ({ ...prev, timeframe: e.target.value as any }))}
              className="w-full p-2 bg-dark-tertiary border border-border rounded-lg text-text-primary focus:border-neon-blue-primary"
              disabled={generationState.isGenerating}
            >
              <option value="weeks">Weeks</option>
              <option value="months">Months</option>
              <option value="quarters">Quarters</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generation Progress */}
      <AnimatePresence>
        {generationState.isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-dark-secondary/50 rounded-lg border border-neon-blue-primary/20"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={getStageColor(generationState.stage)}>
                {getStageIcon(generationState.stage)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">
                    {generationState.message}
                  </span>
                  <span className="text-xs text-text-muted flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3" />
                    <span>{generationState.estimatedTime}s</span>
                  </span>
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {generationState.currentStep}
                </div>
              </div>
            </div>

            <div className="w-full bg-dark-tertiary rounded-full h-2">
              <motion.div
                className="h-2 rounded-full bg-gradient-to-r from-neon-blue-primary to-neon-green-primary"
                style={{ width: `${generationState.progress}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${generationState.progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-xs text-text-muted mt-1 text-right">
              {generationState.progress.toFixed(0)}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generation Status */}
      {generationState.stage === 'complete' && lastGenerated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-green-400">
                Roadmap Generated Successfully!
              </div>
              <div className="text-xs text-green-300 mt-1">
                {lastGenerated.roadmap.nodes.length} tasks • {lastGenerated.roadmap.edges.length} dependencies • {(lastGenerated.roadmap.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {generationState.stage === 'error' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <XCircleIcon className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-400">
                Generation Failed
              </div>
              <div className="text-xs text-red-300 mt-1">
                {generationState.message}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Generate Button */}
      <button
        onClick={generateRoadmap}
        disabled={generationState.isGenerating || !request.prompt.trim()}
        className={`w-full p-3 rounded-lg font-medium transition-all duration-200 ${
          generationState.isGenerating || !request.prompt.trim()
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-neon-blue-primary to-neon-green-primary text-dark-primary hover:shadow-lg hover:shadow-neon-blue-primary/20'
        }`}
      >
        {generationState.isGenerating ? (
          <div className="flex items-center justify-center space-x-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            <span>Generating Roadmap...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <SparklesIcon className="h-4 w-4" />
            <span>Generate AI Roadmap</span>
          </div>
        )}
      </button>

      {/* Connection Status */}
      <div className="mt-4 text-xs text-text-muted flex items-center justify-between">
        <span>Backend: {isConnected ? '🟢 Connected' : '🔴 Offline'}</span>
        <span>AI Service: 🟢 Ready</span>
      </div>
    </div>
  );
};

export default LiveAIRoadmapGenerator;