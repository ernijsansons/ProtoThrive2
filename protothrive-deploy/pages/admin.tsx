// Ref: CLAUDE.md - Super Admin Dashboard
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ApiKeysManager from '../src/components/ApiKeysManager';

const AdminDashboard = () => {
  console.log('Thermonuclear AdminDashboard Rendered');
  
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('api-keys');

  useEffect(() => {
    // Check if user is super admin
    const checkAuth = () => {
      const adminToken = localStorage.getItem('adminToken');
      const userRole = localStorage.getItem('userRole');
      
      if (!adminToken || userRole !== 'super_admin') {
        console.log('Thermonuclear: Unauthorized access attempt');
        router.push('/');
        return;
      }
      
      setIsAuthenticated(true);
    };

    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Authenticating...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">
              ProtoThrive Super Admin
            </h1>
            <button
              onClick={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('userRole');
                router.push('/');
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'api-keys' && <ApiKeysManager />}
        
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">User Management</h2>
            <p className="text-gray-400">User management interface coming soon...</p>
          </div>
        )}
        
        {activeTab === 'monitoring' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">System Monitoring</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-sm font-medium text-gray-400">API Calls Today</h3>
                <p className="text-2xl font-bold text-white mt-1">1,234</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-sm font-medium text-gray-400">Active Users</h3>
                <p className="text-2xl font-bold text-white mt-1">89</p>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h3 className="text-sm font-medium text-gray-400">System Health</h3>
                <p className="text-2xl font-bold text-green-400 mt-1">Healthy</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">System Settings</h2>
            <p className="text-gray-400">System settings interface coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;