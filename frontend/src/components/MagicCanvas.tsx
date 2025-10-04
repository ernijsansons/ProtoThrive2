/**
 * @fileoverview ProtoThrive MagicCanvas Component
 * Advanced visual roadmap builder with AI-powered features
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  ConnectionMode,
  Panel
} from 'reactflow';
import {
  Sparkles as SparklesIcon,
  Cpu as CpuChipIcon,
  Lightbulb as LightBulbIcon,
  Rocket as RocketLaunchIcon,
  Search as MagnifyingGlassIcon
} from 'lucide-react';
import { useStore } from '../store';

import 'reactflow/dist/style.css';

interface MagicCanvasProps {
  projectId?: string;
  readOnly?: boolean;
  onSave?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  initialData?: { nodes: Node[]; edges: Edge[] };
}

const defaultNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    position: { x: 250, y: 0 },
    data: {
      label: '🚀 Project Start',
    },
    style: {
      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontWeight: 'bold',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }
  }
];

const defaultEdges: Edge[] = [];

const MagicCanvas: React.FC<MagicCanvasProps> = React.memo(({
  projectId,
  readOnly = false,
  onSave,
  initialData
}) => {
  const { mode } = useStore();
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialData?.nodes || defaultNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialData?.edges || defaultEdges
  );
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        animated: true,
        style: {
          stroke: '#6366f1',
          strokeWidth: 2,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onSelectionChange = useCallback((elements: any) => {
    setSelectedNodes(elements.nodes || []);
  }, []);

  const addSmartNode = useCallback((type: string) => {
    const colors = {
      feature: { bg: '#ddd6fe', border: '#7c3aed', color: '#5b21b6' },
      task: { bg: '#bfdbfe', border: '#2563eb', color: '#1d4ed8' },
      milestone: { bg: '#fecaca', border: '#dc2626', color: '#b91c1c' },
      decision: { bg: '#fed7aa', border: '#ea580c', color: '#c2410c' },
      integration: { bg: '#bbf7d0', border: '#059669', color: '#047857' }
    };

    const labels = {
      feature: '✨ New Feature',
      task: '📋 Task',
      milestone: '🎯 Milestone',
      decision: '❓ Decision Point',
      integration: '🔗 Integration'
    };

    const color = colors[type as keyof typeof colors] || colors.task;
    const label = labels[type as keyof typeof labels] || labels.task;

    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
      },
      data: {
        label,
        type,
        description: '',
        status: 'pending',
        priority: 'medium'
      },
      style: {
        background: color.bg,
        color: color.color,
        border: `2px solid ${color.border}`,
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        minWidth: '120px',
        textAlign: 'center'
      }
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const runAIAnalysis = useCallback(async () => {
    setIsAIAnalyzing(true);

    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));

      const suggestions = [
        '💡 Consider adding error handling for the authentication flow',
        '🔍 Missing test coverage for the payment processing module',
        '⚡ Optimize database queries in the user dashboard',
        '🔐 Add security validation for API endpoints',
        '📊 Include performance monitoring for critical paths'
      ];

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setIsAIAnalyzing(false);
    }
  }, []);

  const applySuggestion = useCallback((suggestion: string) => {
    // Extract action from suggestion and create appropriate node
    if (suggestion.includes('error handling')) {
      addSmartNode('task');
    } else if (suggestion.includes('test')) {
      addSmartNode('task');
    } else if (suggestion.includes('security')) {
      addSmartNode('milestone');
    } else {
      addSmartNode('feature');
    }
  }, [addSmartNode]);

  useEffect(() => {
    if (onSave) {
      const timer = setTimeout(() => {
        onSave({ nodes, edges });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [nodes, edges, onSave]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        ref={reactFlowWrapper}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        connectionMode={ConnectionMode.Loose}
        fitView
        attributionPosition="bottom-left"
        className="bg-gradient-to-br from-slate-50 to-blue-50"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background
          color="#e2e8f0"
          gap={20}
          size={1}
        />

        <MiniMap
          nodeColor="#6366f1"
          className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg shadow-sm"
          style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
        />

        <Controls
          className="bg-white/80 backdrop-blur border border-gray-200 rounded-lg shadow-sm"
          showZoom={true}
          showFitView={true}
          showInteractive={!readOnly}
        />

        {!readOnly && (
          <Panel position="top-left" className="space-y-2">
            <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg border border-gray-200 p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-2 text-purple-600" />
                Quick Add
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => addSmartNode('feature')}
                  className="px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                >
                  ✨ Feature
                </button>
                <button
                  onClick={() => addSmartNode('task')}
                  className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  📋 Task
                </button>
                <button
                  onClick={() => addSmartNode('milestone')}
                  className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                >
                  🎯 Milestone
                </button>
                <button
                  onClick={() => addSmartNode('decision')}
                  className="px-3 py-2 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
                >
                  ❓ Decision
                </button>
              </div>
            </div>
          </Panel>
        )}

        {showAIPanel && (
          <Panel position="bottom-right" className="w-80">
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <CpuChipIcon className="h-4 w-4 mr-2 text-blue-600" />
                  AI Assistant
                </h3>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={runAIAnalysis}
                  disabled={isAIAnalyzing}
                  className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-md hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isAIAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                      Analyze Roadmap
                    </>
                  )}
                </button>

                {aiSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center text-xs font-medium text-gray-700">
                      <LightBulbIcon className="h-3 w-3 mr-1 text-yellow-500" />
                      AI Suggestions:
                    </div>
                    {aiSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="group bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-md p-2"
                      >
                        <p className="text-xs text-gray-700 mb-2">{suggestion}</p>
                        <button
                          onClick={() => applySuggestion(suggestion)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Apply →
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Total Nodes:</span>
                      <span className="font-medium">{nodes.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Connections:</span>
                      <span className="font-medium">{edges.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Selected:</span>
                      <span className="font-medium">{selectedNodes.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        )}

        {!showAIPanel && (
          <Panel position="bottom-right">
            <button
              onClick={() => setShowAIPanel(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <CpuChipIcon className="h-5 w-5" />
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
});

MagicCanvas.displayName = 'MagicCanvas';

export default MagicCanvas;