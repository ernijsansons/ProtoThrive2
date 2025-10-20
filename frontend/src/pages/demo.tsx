import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node as FlowNode,
  BackgroundVariant,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ArrowLeftIcon,
  SparklesIcon,
  PlusCircleIcon,
  PlayIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const InteractiveDemo = () => {
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Initial demo nodes
  const initialNodes: FlowNode[] = [
    {
      id: '1',
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Project Setup</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">Initialize project and development environment</p>
          </div>
        )
      },
      position: { x: 100, y: 100 },
      style: {
        background: 'white',
        border: '2px solid #10b981',
        borderRadius: '12px',
        width: 280,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    },
    {
      id: '2',
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <PlayIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Authentication System</div>
                <div className="text-xs text-blue-600 font-medium">In Progress</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">JWT-based auth with PBKDF2 hashing</p>
          </div>
        )
      },
      position: { x: 450, y: 100 },
      style: {
        background: 'white',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        width: 280,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    },
    {
      id: '3',
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">API Development</div>
                <div className="text-xs text-yellow-600 font-medium">Planned</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">RESTful API with Hono framework</p>
          </div>
        )
      },
      position: { x: 100, y: 300 },
      style: {
        background: 'white',
        border: '2px solid #eab308',
        borderRadius: '12px',
        width: 280,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    },
    {
      id: '4',
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">AI Agent Integration</div>
                <div className="text-xs text-purple-600 font-medium">Planned</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">14 specialized AI agents for automation</p>
          </div>
        )
      },
      position: { x: 450, y: 300 },
      style: {
        background: 'white',
        border: '2px solid #a855f7',
        borderRadius: '12px',
        width: 280,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    },
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: false, style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e1-3', source: '1', target: '3', animated: false, style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e2-4', source: '2', target: '4', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e3-4', source: '3', target: '4', animated: false, style: { stroke: '#eab308', strokeWidth: 2 } },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const handleAddNode = () => {
    const newNodeId = (nodes.length + 1).toString();
    const newNode: FlowNode = {
      id: newNodeId,
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <PlusCircleIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">New Task</div>
                <div className="text-xs text-gray-500">Click to edit</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">Describe your task here</p>
          </div>
        )
      },
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 400 + 100,
      },
      style: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        width: 280,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    };

    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <>
      <Head>
        <title>Interactive Demo - ProtoThrive</title>
        <meta name="description" content="Try ProtoThrive's visual roadmap editor - drag, drop, and build 60% faster" />
      </Head>

      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Left: Back + Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeftIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900">Interactive Demo</h1>
                  <p className="text-xs text-gray-500">Try the roadmap editor</p>
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">Try it yourself!</span>
              </div>
              <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                Start Free Trial
              </Link>
            </div>
          </div>
        </header>

        {/* React Flow Canvas */}
        <div className="flex-1 relative bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-transparent"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            <Controls className="bg-white border border-gray-200 rounded-lg shadow-md" />
            <MiniMap
              className="bg-white border border-gray-200 rounded-lg shadow-md"
              nodeColor={(node) => {
                const border = node.style?.border;
                if (typeof border === 'string' && border.includes('#10b981')) return '#10b981';
                if (typeof border === 'string' && border.includes('#3b82f6')) return '#3b82f6';
                if (typeof border === 'string' && border.includes('#eab308')) return '#eab308';
                if (typeof border === 'string' && border.includes('#a855f7')) return '#a855f7';
                return '#e5e7eb';
              }}
            />

            {/* Top Panel with Instructions */}
            <Panel position="top-center" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 px-6 py-3">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleAddNode}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  <span>Add Task</span>
                </button>
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <BoltIcon className="h-4 w-4" />
                  <span>AI Assist</span>
                </button>
                <span className="text-sm text-gray-600 border-l border-gray-300 pl-4">
                  <span className="font-semibold text-gray-900">{nodes.length}</span> tasks · <span className="font-semibold text-gray-900">{edges.length}</span> connections
                </span>
              </div>
            </Panel>
          </ReactFlow>

          {/* AI Assistant Panel */}
          {showAIPanel && (
            <div className="absolute right-6 top-6 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-5 z-20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">AI Assistant</h3>
                </div>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Let AI help you build your roadmap faster
              </p>

              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border border-blue-200 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">✨</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Suggest Next Steps</div>
                      <div className="text-xs text-gray-600">AI analyzes your roadmap</div>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 border border-green-200 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Auto-Generate Tasks</div>
                      <div className="text-xs text-gray-600">From your description</div>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 border border-yellow-200 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Optimize Flow</div>
                      <div className="text-xs text-gray-600">Better dependencies</div>
                    </div>
                  </div>
                </button>

                <button className="w-full text-left px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-200 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💻</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">Generate Code</div>
                      <div className="text-xs text-gray-600">Ship 60% faster</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-900">
                  <span className="font-semibold">💡 Pro Tip:</span> Connect tasks by dragging from one node to another!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Info Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              🎯 <span className="font-semibold">This is a live demo!</span> Drag nodes, create connections, and experience ProtoThrive.
            </p>
            <Link href="/register" className="px-4 py-1.5 bg-white hover:bg-gray-100 text-blue-600 font-semibold rounded text-sm transition-colors shadow-md">
              Get Started Free →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default InteractiveDemo;
