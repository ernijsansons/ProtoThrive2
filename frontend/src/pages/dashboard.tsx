import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  PlusCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FolderOpenIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { useStore } from '../store';

interface Roadmap {
  id: string;
  title: string;
  description: string;
  thriveScore: number;
  nodes: number;
  lastModified: Date;
  status: 'draft' | 'active' | 'completed';
}

const Dashboard: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, user } = useStore();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRoadmaps: 0,
    avgThriveScore: 0,
    completedTasks: 0,
    activeProjects: 0
  });

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load user roadmaps
    loadRoadmaps();
  }, [isAuthenticated, router]);

  const loadRoadmaps = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockRoadmaps: Roadmap[] = [
        {
          id: '1',
          title: 'E-commerce Platform MVP',
          description: 'Building a scalable online marketplace with AI-powered recommendations',
          thriveScore: 78,
          nodes: 12,
          lastModified: new Date('2025-10-03'),
          status: 'active'
        },
        {
          id: '2',
          title: 'Mobile App Development',
          description: 'React Native cross-platform application for iOS and Android',
          thriveScore: 65,
          nodes: 8,
          lastModified: new Date('2025-10-02'),
          status: 'draft'
        },
        {
          id: '3',
          title: 'API Gateway Architecture',
          description: 'Microservices orchestration with GraphQL federation',
          thriveScore: 92,
          nodes: 15,
          lastModified: new Date('2025-10-01'),
          status: 'completed'
        }
      ];

      setRoadmaps(mockRoadmaps);

      // Calculate stats
      setStats({
        totalRoadmaps: mockRoadmaps.length,
        avgThriveScore: Math.round(mockRoadmaps.reduce((acc, r) => acc + r.thriveScore, 0) / mockRoadmaps.length),
        completedTasks: mockRoadmaps.filter(r => r.status === 'completed').length,
        activeProjects: mockRoadmaps.filter(r => r.status === 'active').length
      });
    } catch (error) {
      console.error('Failed to load roadmaps:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewRoadmap = () => {
    router.push('/roadmap/new');
  };

  const openRoadmap = (id: string) => {
    router.push(`/roadmap/${id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getThriveScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2">
                <SparklesIcon className="h-8 w-8 text-blue-500" />
                <span className="text-white font-bold text-xl">ProtoThrive</span>
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">
                Welcome, {user?.email || 'User'}
              </span>
              <button
                onClick={() => {
                  useStore.getState().logout();
                  router.push('/');
                }}
                className="text-gray-300 hover:text-white text-sm px-3 py-1 rounded-md hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Your Development Dashboard
          </h1>
          <p className="text-gray-400">
            Manage your roadmaps and track project progress with AI assistance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Roadmaps</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.totalRoadmaps}</p>
              </div>
              <FolderOpenIcon className="h-10 w-10 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Thrive Score</p>
                <p className={`text-3xl font-bold mt-1 ${getThriveScoreColor(stats.avgThriveScore)}`}>
                  {stats.avgThriveScore}%
                </p>
              </div>
              <ArrowTrendingUpIcon className="h-10 w-10 text-green-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.activeProjects}</p>
              </div>
              <RocketLaunchIcon className="h-10 w-10 text-orange-500 opacity-50" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-white mt-1">{stats.completedTasks}</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Roadmaps Section */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Your Roadmaps</h2>
          <button
            onClick={createNewRoadmap}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5" />
            <span>Create New Roadmap</span>
          </button>
        </div>

        {/* Roadmap Grid */}
        {roadmaps.length === 0 ? (
          <div className="bg-gray-800/30 rounded-lg p-12 text-center border border-gray-700">
            <DocumentTextIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No roadmaps yet</h3>
            <p className="text-gray-400 mb-6">
              Start building your first AI-powered development roadmap
            </p>
            <button
              onClick={createNewRoadmap}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span>Create Your First Roadmap</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map(roadmap => (
              <div
                key={roadmap.id}
                onClick={() => openRoadmap(roadmap.id)}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all hover:transform hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white line-clamp-1">
                    {roadmap.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(roadmap.status)}`}>
                    {roadmap.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {roadmap.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="text-gray-400">
                      {roadmap.nodes} nodes
                    </span>
                    <span className={`font-semibold ${getThriveScoreColor(roadmap.thriveScore)}`}>
                      {roadmap.thriveScore}% Thrive
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center text-xs text-gray-500">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  <span>
                    {new Date(roadmap.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="bg-gray-800/30 rounded-lg p-6 border border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">
                  API Gateway Architecture completed with 92% Thrive Score
                </span>
                <span className="text-gray-500 text-xs ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">
                  New node added to E-commerce Platform MVP
                </span>
                <span className="text-gray-500 text-xs ml-auto">5 hours ago</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-300 text-sm">
                  Mobile App Development roadmap created
                </span>
                <span className="text-gray-500 text-xs ml-auto">Yesterday</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;