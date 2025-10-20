import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const DashboardSimple = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const mockProjects = [
    { id: 1, name: 'E-commerce Platform', status: 'In Progress', progress: 75, lastUpdated: '2 hours ago' },
    { id: 2, name: 'Mobile App', status: 'Planning', progress: 25, lastUpdated: '1 day ago' },
    { id: 3, name: 'API Service', status: 'Completed', progress: 100, lastUpdated: '3 days ago' },
  ];

  const mockThriveScore = 87;

  return (
    <>
      <Head>
        <title>Dashboard - ProtoThrive</title>
        <meta name="description" content="Your ProtoThrive dashboard - manage projects and track progress" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">ProtoThrive</span>
              </Link>
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Welcome back!</span>
                <button className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your projects and track your progress</p>
          </div>

          {/* Thrive Score Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Thrive Score™</h2>
              <span className="text-2xl font-bold text-green-600">{mockThriveScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${mockThriveScore}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              Your overall project health is excellent! Keep up the great work.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/roadmap/new"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">New Project</h3>
                  <p className="text-sm text-gray-600">Start a new roadmap</p>
                </div>
              </div>
            </Link>

            <Link
              href="/templates"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Templates</h3>
                  <p className="text-sm text-gray-600">Browse project templates</p>
                </div>
              </div>
            </Link>

            <Link
              href="/docs"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Documentation</h3>
                  <p className="text-sm text-gray-600">Learn how to use ProtoThrive</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Projects Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
                <Link
                  href="/roadmap/new"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  New Project
                </Link>
              </div>
            </div>
            <div className="p-6">
              {mockProjects.length > 0 ? (
                <div className="space-y-4">
                  {mockProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 max-w-xs">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{project.progress}% complete</span>
                          <span className="text-sm text-gray-500">Updated {project.lastUpdated}</span>
                        </div>
                      </div>
                      <Link
                        href={`/roadmap/${project.id}`}
                        className="ml-4 px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                  <p className="text-gray-600 mb-6">Get started by creating your first project</p>
                  <Link
                    href="/roadmap/new"
                    className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create Your First Project
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">AI Agent completed code generation for <span className="font-medium">E-commerce Platform</span></p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">Project <span className="font-medium">API Service</span> deployed successfully</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900">New template <span className="font-medium">React Dashboard</span> added</p>
                    <p className="text-xs text-gray-500">1 week ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSimple;

