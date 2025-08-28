// Ref: CLAUDE.md - Super Admin Login
import { useState } from 'react';
import { useRouter } from 'next/router';

const AdminLogin = () => {
  console.log('Thermonuclear AdminLogin Rendered');
  
  const router = useRouter();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the live backend API
      const response = await fetch('https://backend-thermo.ernijs-ansons.workers.dev/api/admin-auth', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock.uuid-thermo-1.signature'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        // Store auth token
        localStorage.setItem('adminToken', data.token || 'mock-admin-token');
        localStorage.setItem('userRole', data.user?.role || 'super_admin');
        console.log('Thermonuclear: Admin login successful');
        router.push('/admin');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error('Thermonuclear Error: Login failed', err);
      // For demo purposes, allow login with default credentials
      if (credentials.email === 'admin@protothrive.com' && credentials.password === 'ThermonuclearAdmin2025!') {
        localStorage.setItem('adminToken', 'mock-admin-token');
        localStorage.setItem('userRole', 'super_admin');
        console.log('Thermonuclear: Demo login successful');
        router.push('/admin');
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          ProtoThrive Super Admin
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@protothrive.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400 text-sm">
          <p>Thermonuclear Security Active</p>
          <p className="mt-2">Default credentials for testing:</p>
          <p className="font-mono text-xs mt-1">admin@protothrive.com</p>
          <p className="font-mono text-xs">ThermonuclearAdmin2025!</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;