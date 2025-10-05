import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  CloudArrowUpIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Node {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  position: { x: number; y: number };
  dependencies: string[];
}

interface Roadmap {
  id: string;
  title: string;
  description: string;
  nodes: Node[];
  thriveScore: number;
  lastSaved: Date;
  owner: string;
  collaborators: string[];
}

export default function RoadmapEditor() {
  const router = useRouter();
  const { id } = router.query;

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [error, setError] = useState('');

  // Mock data for demonstration
  const mockRoadmap: Roadmap = {
    id: id as string,
    title: 'My Development Roadmap',
    description: 'Building an amazing application with ProtoThrive',
    nodes: [
      {
        id: '1',
        type: 'milestone',
        title: 'Project Setup',
        description: 'Initialize project and set up development environment',
        status: 'completed',
        position: { x: 100, y: 100 },
        dependencies: []
      },
      {
        id: '2',
        type: 'feature',
        title: 'Authentication System',
        description: 'Implement user authentication and authorization',
        status: 'in-progress',
        position: { x: 300, y: 100 },
        dependencies: ['1']
      },
      {
        id: '3',
        type: 'feature',
        title: 'Database Design',
        description: 'Design and implement database schema',
        status: 'in-progress',
        position: { x: 300, y: 250 },
        dependencies: ['1']
      },
      {
        id: '4',
        type: 'task',
        title: 'API Development',
        description: 'Build RESTful API endpoints',
        status: 'pending',
        position: { x: 500, y: 175 },
        dependencies: ['2', '3']
      },
      {
        id: '5',
        type: 'milestone',
        title: 'MVP Launch',
        description: 'Deploy minimum viable product',
        status: 'pending',
        position: { x: 700, y: 175 },
        dependencies: ['4']
      }
    ],
    thriveScore: 72,
    lastSaved: new Date(),
    owner: 'user@example.com',
    collaborators: ['collaborator1@example.com']
  };

  useEffect(() => {
    // Simulate loading roadmap data
    if (id) {
      setTimeout(() => {
        setRoadmap(mockRoadmap);
        setIsLoading(false);
      }, 1000);
    }
  }, [id]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRoadmap({ ...roadmap!, lastSaved: new Date() });
    } catch (err) {
      setError('Failed to save roadmap');
    } finally {
      setIsSaving(false);
    }
  }, [roadmap]);

  const handleAddNode = () => {
    if (!roadmap) return;

    const newNode: Node = {
      id: Date.now().toString(),
      type: 'task',
      title: 'New Task',
      description: 'Description for new task',
      status: 'pending',
      position: { x: 400, y: 300 },
      dependencies: []
    };

    setRoadmap({
      ...roadmap,
      nodes: [...roadmap.nodes, newNode]
    });
  };

  const handleDeleteNode = (nodeId: string) => {
    if (!roadmap) return;

    setRoadmap({
      ...roadmap,
      nodes: roadmap.nodes.filter(n => n.id !== nodeId)
    });
    setSelectedNode(null);
  };

  const handleNodeStatusChange = (nodeId: string, status: Node['status']) => {
    if (!roadmap) return;

    setRoadmap({
      ...roadmap,
      nodes: roadmap.nodes.map(n =>
        n.id === nodeId ? { ...n, status } : n
      )
    });
  };

  const getStatusColor = (status: Node['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-yellow-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'milestone': return '🎯';
      case 'feature': return '✨';
      case 'task': return '📋';
      default: return '📌';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Roadmap not found</p>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{roadmap.title} - ProtoThrive Roadmap Editor</title>
        <meta name="description" content={`Editing ${roadmap.title} roadmap in ProtoThrive`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
        {/* Header Toolbar */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-400 hover:text-white">
                  <ArrowLeftIcon className="w-5 h-5" />
                </Link>

                <div>
                  <h1 className="text-xl font-semibold">{roadmap.title}</h1>
                  <p className="text-sm text-gray-400">
                    Last saved: {roadmap.lastSaved.toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Thrive Score */}
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-lg">
                  <ChartBarIcon className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium">
                    Thrive Score: {roadmap.thriveScore}%
                  </span>
                </div>

                {/* Action Buttons */}
                <button
                  onClick={() => setShowAIAssist(!showAIAssist)}
                  className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                  title="AI Assistant"
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>

                <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition" title="Share">
                  <ShareIcon className="w-5 h-5" />
                </button>

                <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition" title="Settings">
                  <Cog6ToothIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-[calc(100vh-64px)]">
          {/* Sidebar - Node List */}
          <aside className="w-80 bg-gray-800/50 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nodes</h2>
              <button
                onClick={handleAddNode}
                className="p-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                title="Add Node"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {roadmap.nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    selectedNode?.id === node.id
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNodeIcon(node.type)}</span>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{node.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(node.status)}`}></span>
                        <span className="text-xs text-gray-400 capitalize">{node.status}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Main Canvas Area */}
          <main className="flex-1 relative bg-gray-900/50 overflow-hidden">
            {/* Canvas Grid Background */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />

            {/* Nodes on Canvas */}
            <div className="relative w-full h-full">
              {roadmap.nodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute bg-gray-800 border border-gray-600 rounded-lg p-4 cursor-move hover:border-purple-500 transition"
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    minWidth: '180px'
                  }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{getNodeIcon(node.type)}</span>
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`}></span>
                  </div>
                  <h4 className="font-medium text-sm mb-1">{node.title}</h4>
                  <p className="text-xs text-gray-400 line-clamp-2">{node.description}</p>
                </div>
              ))}
            </div>

            {/* AI Assistant Panel */}
            {showAIAssist && (
              <div className="absolute right-4 top-4 w-80 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-purple-400" />
                    AI Assistant
                  </h3>
                  <button onClick={() => setShowAIAssist(false)}>
                    <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                    <p className="text-sm font-medium mb-1">Suggest Next Steps</p>
                    <p className="text-xs text-gray-400">Get AI recommendations for your roadmap</p>
                  </button>

                  <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                    <p className="text-sm font-medium mb-1">Auto-Generate Tasks</p>
                    <p className="text-xs text-gray-400">Break down features into tasks</p>
                  </button>

                  <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                    <p className="text-sm font-medium mb-1">Optimize Dependencies</p>
                    <p className="text-xs text-gray-400">Improve task flow and parallelization</p>
                  </button>

                  <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                    <p className="text-sm font-medium mb-1">Generate Code</p>
                    <p className="text-xs text-gray-400">Create boilerplate for selected node</p>
                  </button>
                </div>
              </div>
            )}
          </main>

          {/* Properties Panel */}
          {selectedNode && (
            <aside className="w-80 bg-gray-800/50 border-l border-gray-700 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Properties</h2>
                <button onClick={() => setSelectedNode(null)}>
                  <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => {
                      const updatedNode = { ...selectedNode, title: e.target.value };
                      setSelectedNode(updatedNode);
                      setRoadmap({
                        ...roadmap,
                        nodes: roadmap.nodes.map(n =>
                          n.id === selectedNode.id ? updatedNode : n
                        )
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={selectedNode.description}
                    onChange={(e) => {
                      const updatedNode = { ...selectedNode, description: e.target.value };
                      setSelectedNode(updatedNode);
                      setRoadmap({
                        ...roadmap,
                        nodes: roadmap.nodes.map(n =>
                          n.id === selectedNode.id ? updatedNode : n
                        )
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                  <select
                    value={selectedNode.status}
                    onChange={(e) => handleNodeStatusChange(selectedNode.id, e.target.value as Node['status'])}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select
                    value={selectedNode.type}
                    onChange={(e) => {
                      const updatedNode = { ...selectedNode, type: e.target.value };
                      setSelectedNode(updatedNode);
                      setRoadmap({
                        ...roadmap,
                        nodes: roadmap.nodes.map(n =>
                          n.id === selectedNode.id ? updatedNode : n
                        )
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="task">Task</option>
                    <option value="feature">Feature</option>
                    <option value="milestone">Milestone</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Node
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}