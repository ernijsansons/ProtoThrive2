// Ref: CLAUDE.md - Super Admin Dashboard
import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import ApiKeysManager from '../components/ApiKeysManager';

const AdminDashboard = () => {
  console.log('Thermonuclear AdminDashboard Rendered');
  
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('api-keys');

  const checkAuth = useCallback(() => {
    const adminToken = localStorage.getItem('adminToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!adminToken || userRole !== 'super_admin') {
      console.log('Thermonuclear: Unauthorized access attempt');
      router.push('/');
      return;
    }
    
    setIsAuthenticated(true);
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center sm:min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center md:min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center lg:min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div className="text-white text-xl sm:text-white text-xl md:text-white text-xl lg:text-white text-xl focus:outline-none focus:ring-2 focus:ring-blue-500">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray dark:bg-gray-800-900 sm:min-h-screen bg-gray dark:bg-gray-800-900 md:min-h-screen bg-gray dark:bg-gray-800-900 lg:min-h-screen bg-gray dark:bg-gray-800-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
      {/* Header */}
      <div className="bg-gray dark:bg-gray-800-800 border-b border-gray-700 sm:bg-gray dark:bg-gray-800-800 border-b border-gray-700 md:bg-gray dark:bg-gray-800-800 border-b border-gray-700 lg:bg-gray dark:bg-gray-800-800 border-b border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div className="flex justify-between items-center py-4 sm:flex justify-between items-center py-4 md:flex justify-between items-center py-4 lg:flex justify-between items-center py-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <h1 className="text-2xl font-bold text-white sm:text-2xl font-bold text-white md:text-2xl font-bold text-white lg:text-2xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              ProtoThrive Super Admin
            </h1>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('userRole');
                router.push('/');
              }}
              className="text-gray-400 hover:text-white transition-colors sm:text-gray-400 hover:text-white transition-colors md:text-gray-400 hover:text-white transition-colors lg:text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray dark:bg-gray-800-800 border-b border-gray-700 sm:bg-gray dark:bg-gray-800-800 border-b border-gray-700 md:bg-gray dark:bg-gray-800-800 border-b border-gray-700 lg:bg-gray dark:bg-gray-800-800 border-b border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <nav className="flex space-x-8 sm:flex space-x-8 md:flex space-x-8 lg:flex space-x-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <button
              onClick={() => setActiveTab('api-keys')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'api-keys'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              API Keys
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'monitoring'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Monitoring
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {activeTab === 'api-keys' && <ApiKeysManager />}
        
        {activeTab === 'users' && (
          <div className="bg-gray dark:bg-gray-800-800 rounded-lg p-6 sm:bg-gray dark:bg-gray-800-800 rounded-lg p-6 md:bg-gray dark:bg-gray-800-800 rounded-lg p-6 lg:bg-gray dark:bg-gray-800-800 rounded-lg p-6 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <h2 className="text-xl font-bold text-white mb-4 sm:text-xl font-bold text-white mb-4 md:text-xl font-bold text-white mb-4 lg:text-xl font-bold text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">User Management</h2>
            <p className="text-gray-400 sm:text-gray-400 md:text-gray-400 lg:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">User management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'monitoring' && (
          <div className="bg-gray dark:bg-gray-800-800 rounded-lg p-6 sm:bg-gray dark:bg-gray-800-800 rounded-lg p-6 md:bg-gray dark:bg-gray-800-800 rounded-lg p-6 lg:bg-gray dark:bg-gray-800-800 rounded-lg p-6 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <h2 className="text-xl font-bold text-white mb-4 sm:text-xl font-bold text-white mb-4 md:text-xl font-bold text-white mb-4 lg:text-xl font-bold text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">System Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:grid grid-cols-1 md:grid-cols-3 gap-4 md:grid grid-cols-1 md:grid-cols-3 gap-4 lg:grid grid-cols-1 md:grid-cols-3 gap-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="bg-gray dark:bg-gray-800-700 p-4 rounded sm:bg-gray dark:bg-gray-800-700 p-4 rounded md:bg-gray dark:bg-gray-800-700 p-4 rounded lg:bg-gray dark:bg-gray-800-700 p-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                <h3 className="text-sm font-medium text-gray-400 sm:text-sm font-medium text-gray-400 md:text-sm font-medium text-gray-400 lg:text-sm font-medium text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">API Calls Today</h3>
                <p className="text-2xl font-bold text-white mt-1 sm:text-2xl font-bold text-white mt-1 md:text-2xl font-bold text-white mt-1 lg:text-2xl font-bold text-white mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">1,234</p>
              </div>
              <div className="bg-gray dark:bg-gray-800-700 p-4 rounded sm:bg-gray dark:bg-gray-800-700 p-4 rounded md:bg-gray dark:bg-gray-800-700 p-4 rounded lg:bg-gray dark:bg-gray-800-700 p-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                <h3 className="text-sm font-medium text-gray-400 sm:text-sm font-medium text-gray-400 md:text-sm font-medium text-gray-400 lg:text-sm font-medium text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">Active Users</h3>
                <p className="text-2xl font-bold text-white mt-1 sm:text-2xl font-bold text-white mt-1 md:text-2xl font-bold text-white mt-1 lg:text-2xl font-bold text-white mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">89</p>
              </div>
              <div className="bg-gray dark:bg-gray-800-700 p-4 rounded sm:bg-gray dark:bg-gray-800-700 p-4 rounded md:bg-gray dark:bg-gray-800-700 p-4 rounded lg:bg-gray dark:bg-gray-800-700 p-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                <h3 className="text-sm font-medium text-gray-400 sm:text-sm font-medium text-gray-400 md:text-sm font-medium text-gray-400 lg:text-sm font-medium text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">System Health</h3>
                <p className="text-2xl font-bold text-green-400 mt-1 sm:text-2xl font-bold text-green-400 mt-1 md:text-2xl font-bold text-green-400 mt-1 lg:text-2xl font-bold text-green-400 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">Healthy</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="bg-gray dark:bg-gray-800-800 rounded-lg p-6 sm:bg-gray dark:bg-gray-800-800 rounded-lg p-6 md:bg-gray dark:bg-gray-800-800 rounded-lg p-6 lg:bg-gray dark:bg-gray-800-800 rounded-lg p-6 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <h2 className="text-xl font-bold text-white mb-4 sm:text-xl font-bold text-white mb-4 md:text-xl font-bold text-white mb-4 lg:text-xl font-bold text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">System Settings</h2>
            <p className="text-gray-400 sm:text-gray-400 md:text-gray-400 lg:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">System settings interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(AdminDashboard);