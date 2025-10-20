import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
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
  CloudArrowUpIcon,
  ShareIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PlusCircleIcon,
  PlayIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface RoadmapData {
  id: string;
  title: string;
  description: string;
  thriveScore: number;
  lastSaved: Date;
  owner: string;
}

const RoadmapEditor = () => {
  const router = useRouter();
  const { id } = router.query;

  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  // Initial nodes with proper React Flow types
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
      position: { x: 100, y: 250 },
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
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CpuChipIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Database Design</div>
                <div className="text-xs text-blue-600 font-medium">In Progress</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">D1 SQLite schema with multi-tenant isolation</p>
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
      id: '4',
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">API Development</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">RESTful endpoints with Hono framework</p>
          </div>
        )
      },
      position: { x: 450, y: 250 },
      style: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        width: 280,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    },
    {
      id: '5',
      type: 'default',
      data: {
        label: (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BoltIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">MVP Launch</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">Deploy to Cloudflare Workers & Pages</p>
          </div>
        )
      },
      position: { x: 800, y: 175 },
      style: {
        background: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        width: 280,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }
    }
  ];

  const initialEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e2-4', source: '2', target: '4', animated: false, style: { stroke: '#9ca3af', strokeWidth: 2 } },
    { id: 'e3-4', source: '3', target: '4', animated: false, style: { stroke: '#9ca3af', strokeWidth: 2 } },
    { id: 'e4-5', source: '4', target: '5', animated: false, style: { stroke: '#9ca3af', strokeWidth: 2 } }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (id) {
      setTimeout(() => {
        setRoadmap({
          id: id as string,
          title: 'E-commerce Platform MVP',
          description: 'Building a scalable online marketplace with AI-powered recommendations',
          thriveScore: 78,
          lastSaved: new Date(),
          owner: 'demo@protothrive.com'
        });
        setIsLoading(false);
      }, 800);
    }
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRoadmap({ ...roadmap!, lastSaved: new Date() });
    setIsSaving(false);
  };

  const handleAddNode = () => {
    const newNode: FlowNode = {
      id: `${nodes.length + 1}`,
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
                <div className="text-xs text-gray-500">Pending</div>
              </div>
            </div>
            <p className="text-xs text-gray-600">Click to edit description</p>
          </div>
        )
      },
      position: { x: Math.random() * 500 + 100, y: Math.random() * 400 + 100 },
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

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Loading Roadmap - ProtoThrive</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading roadmap editor...</p>
          </div>
        </div>
      </>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Roadmap not found</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{roadmap.title} - ProtoThrive Editor</title>
        <meta name="description" content={`Editing ${roadmap.title} roadmap`} />
      </Head>

      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm z-50">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Back to dashboard"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">{roadmap.title}</h1>
                    <p className="text-xs text-gray-500">
                      Last saved: {roadmap.lastSaved.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Thrive Score Badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <ChartBarIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    {roadmap.thriveScore}%
                  </span>
                  <span className="text-xs text-gray-600">Thrive</span>
                </div>

                {/* AI Assistant Button */}
                <button
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className={`group p-2 rounded-lg transition-all ${
                    showAIPanel
                      ? 'bg-purple-100 text-purple-600'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                  aria-label="Toggle AI Assistant"
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="group px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                </button>

                {/* Share Button */}
                <button
                  className="hidden md:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Share roadmap"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>

                {/* Settings Button */}
                <button
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
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
            attributionPosition="bottom-left"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            <Controls
              className="bg-white border border-gray-200 rounded-lg shadow-md"
            />
            <MiniMap
              className="bg-white border border-gray-200 rounded-lg shadow-md"
              nodeColor={(node) => {
                const border = node.style?.border;
                if (typeof border === 'string' && border.includes('#10b981')) return '#10b981';
                if (typeof border === 'string' && border.includes('#3b82f6')) return '#3b82f6';
                return '#e5e7eb';
              }}
            />

            {/* Floating Toolbar */}
            <Panel position="top-center">
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-2 flex items-center gap-3">
                <button
                  onClick={handleAddNode}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Add Node
                </button>
                <div className="w-px h-6 bg-gray-300"></div>
                <span className="text-xs text-gray-600">
                  {nodes.length} nodes · {edges.length} connections
                </span>
              </div>
            </Panel>
          </ReactFlow>

          {/* AI Assistant Panel */}
          {showAIPanel && (
            <div className="absolute right-6 top-6 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl p-5 animate-in slide-in-from-right">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <SparklesIcon className="w-5 h-5 text-white" />
                  </div>
                  AI Assistant
                </h3>
                <button
                  onClick={() => setShowAIPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <button className="w-full text-left p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-all group">
                  <p className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-purple-700">
                    ✨ Suggest Next Steps
                  </p>
                  <p className="text-xs text-gray-600">
                    Get AI recommendations for your roadmap
                  </p>
                </button>

                <button className="w-full text-left p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all group">
                  <p className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-700">
                    🤖 Auto-Generate Tasks
                  </p>
                  <p className="text-xs text-gray-600">
                    Break down features into actionable tasks
                  </p>
                </button>

                <button className="w-full text-left p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all group">
                  <p className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-green-700">
                    ⚡ Optimize Flow
                  </p>
                  <p className="text-xs text-gray-600">
                    Improve dependencies and parallelization
                  </p>
                </button>

                <button className="w-full text-left p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-all group">
                  <p className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-orange-700">
                    💻 Generate Code
                  </p>
                  <p className="text-xs text-gray-600">
                    Create boilerplate for selected nodes
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RoadmapEditor;
