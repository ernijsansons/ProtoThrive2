// Ref: CLAUDE.md - Super Admin Login
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';

const AdminLogin = () => {
  console.log('Thermonuclear AdminLogin Rendered');
  
  const router = useMemo(() => useRouter(), []);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth token
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('userRole', data.user.role);
        console.log('Thermonuclear: Admin login successful');
        router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Thermonuclear Error: Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center sm:min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center md:min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center lg:min-h-screen bg-gray dark:bg-gray-800-900 flex items-center justify-center">
      <div className="bg-gray dark:bg-gray-800-800 p-8 rounded-lg shadow-xl w-full max-w-md sm:bg-gray dark:bg-gray-800-800 p-8 rounded-lg shadow-xl w-full max-w-md md:bg-gray dark:bg-gray-800-800 p-8 rounded-lg shadow-xl w-full max-w-md lg:bg-gray dark:bg-gray-800-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center sm:text-2xl font-bold text-white mb-6 text-center md:text-2xl font-bold text-white mb-6 text-center lg:text-2xl font-bold text-white mb-6 text-center">
          ProtoThrive Super Admin
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-4 md:space-y-4 lg:space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 sm:block text-sm font-medium text-gray-300 mb-2 md:block text-sm font-medium text-gray-300 mb-2 lg:block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@protothrive.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 sm:block text-sm font-medium text-gray-300 mb-2 md:block text-sm font-medium text-gray-300 mb-2 lg:block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 lg:w-full px-3 py-2 bg-gray dark:bg-gray-800-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm sm:text-red-400 text-sm md:text-red-400 text-sm lg:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:w-full bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed md:w-full bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed lg:w-full bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm sm:mt-6 text-center text-gray-400 text-sm md:mt-6 text-center text-gray-400 text-sm lg:mt-6 text-center text-gray-400 text-sm">
          <p>Thermonuclear Security Active</p>
          <p className="mt-2 sm:mt-2 md:mt-2 lg:mt-2">Default credentials for testing:</p>
          <p className="font-mono text-xs mt-1 sm:font-mono text-xs mt-1 md:font-mono text-xs mt-1 lg:font-mono text-xs mt-1">admin@protothrive.com</p>
          <p className="font-mono text-xs sm:font-mono text-xs md:font-mono text-xs lg:font-mono text-xs">ThermonuclearAdmin2025!</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AdminLogin);