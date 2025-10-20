import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  PlusCircleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FolderOpenIcon,
  SparklesIcon,
  RocketLaunchIcon,
  BoltIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  CpuChipIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon
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
      <>
        <Head>
          <title>Loading Dashboard - ProtoThrive</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <p className="mt-6 text-gray-600 font-medium">Loading your command center...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - ProtoThrive</title>
        <meta name="description" content="Your AI-powered development command center" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo */}
              <div className="flex items-center">
                <a href="/" className="flex items-center space-x-2 group">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                    <SparklesIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-gray-900 font-bold text-xl">ProtoThrive</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">BETA</span>
                </a>
              </div>

              {/* Center: Search Bar (Desktop) */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search roadmaps, templates..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Right: User Actions */}
              <div className="flex items-center space-x-4">
                <button
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Notifications"
                >
                  <BellIcon className="h-6 w-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <button
                  onClick={() => router.push('/settings')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Settings"
                >
                  <Cog6ToothIcon className="h-6 w-6" />
                </button>

                <div className="h-8 w-px bg-gray-300"></div>

                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">{user?.email || 'User'}</p>
                    <p className="text-xs text-gray-500">Pro Plan</p>
                  </div>
                  <button
                    className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:shadow-lg transition-shadow"
                    aria-label="User profile"
                  >
                    {(user?.email || 'U')[0].toUpperCase()}
                  </button>
                </div>

                <button
                  onClick={() => {
                    useStore.getState().logout();
                    router.push('/');
                  }}
                  className="hidden sm:block text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header with Quick Actions */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Command Center
                </h1>
                <p className="text-gray-600">
                  Manage roadmaps, track progress, and deploy with AI agents
                </p>
              </div>
              <button
                onClick={createNewRoadmap}
                className="group inline-flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <PlusCircleIcon className="h-5 w-5" />
                <span>New Roadmap</span>
                <BoltIcon className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/roadmap/new')}
              className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
            >
              <CodeBracketIcon className="h-8 w-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900">Start Coding</span>
            </button>
            <button
              className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all group"
            >
              <CpuChipIcon className="h-8 w-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900">AI Agents</span>
            </button>
            <button
              className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition-all group"
            >
              <DocumentTextIcon className="h-8 w-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900">Templates</span>
            </button>
            <button
              className="flex flex-col items-center p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:shadow-md transition-all group"
            >
              <ChartBarIcon className="h-8 w-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900">Analytics</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpenIcon className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Roadmaps</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRoadmaps}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+5pts</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Avg Thrive Score</p>
              <p className={`text-3xl font-bold ${getThriveScoreColor(stats.avgThriveScore)}`}>
                {stats.avgThriveScore}%
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <RocketLaunchIcon className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Active</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeProjects}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">100%</span>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>

          {/* Roadmaps Section */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Your Roadmaps</h2>
            <p className="text-gray-600 text-sm mt-1">Active projects and development pipelines</p>
          </div>

          {/* Roadmap Grid */}
          {roadmaps.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No roadmaps yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start building your first AI-powered development roadmap and watch our agents bring it to life
              </p>
              <button
                onClick={createNewRoadmap}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <PlusCircleIcon className="h-5 w-5" />
                <span>Create Your First Roadmap</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmaps.map(roadmap => (
                <div
                  key={roadmap.id}
                  onClick={() => openRoadmap(roadmap.id)}
                  className="group bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-500 cursor-pointer transition-all hover:shadow-xl transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {roadmap.title}
                      </h3>
                    </div>
                    <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(roadmap.status)}`}>
                      {roadmap.status}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {roadmap.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-gray-500 flex items-center">
                        <FolderOpenIcon className="h-4 w-4 mr-1" />
                        {roadmap.nodes}
                      </span>
                      <div className="flex items-center">
                        <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${getThriveScoreColor(roadmap.thriveScore)}`} />
                        <span className={`font-semibold ${getThriveScoreColor(roadmap.thriveScore)}`}>
                          {roadmap.thriveScore}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <ClockIcon className="h-3.5 w-3.5 mr-1" />
                      <span>{new Date(roadmap.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Activity */}
          <div className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
              <p className="text-gray-600 text-sm mt-1">Latest updates across your projects</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      API Gateway Architecture completed
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Achieved 92% Thrive Score with all tests passing
                    </p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full flex-shrink-0">
                    Completed
                  </span>
                </div>

                <div className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CodeBracketIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      New node added to E-commerce Platform MVP
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      AI agents generated authentication module
                    </p>
                    <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex-shrink-0">
                    Updated
                  </span>
                </div>

                <div className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <RocketLaunchIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Mobile App Development roadmap created
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      React Native template with 8 pre-configured nodes
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full flex-shrink-0">
                    Created
                  </span>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <BoltIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      AI Performance Optimizer finished analysis
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Suggested 3 optimizations for faster response times
                    </p>
                    <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                  </div>
                  <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex-shrink-0">
                    AI Agent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;