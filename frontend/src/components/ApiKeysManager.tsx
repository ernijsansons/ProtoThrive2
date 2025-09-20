// Ref: CLAUDE.md - API Keys Management for Super Admin
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { mockFetch } from '../utils/mocks';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  lastRotated: string;
  status: 'active' | 'inactive';
}

const ApiKeysManager = () => {
  console.log('Thermonuclear ApiKeysManager Rendered');
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKey, setNewKey] = useState({
    name: '',
    key: '',
    service: ''
  });
  const [loading, setLoading] = useState(false);

  // Load existing API keys
  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      console.log('Thermonuclear: Loading API keys');
      const response = await mockFetch('/api/admin/keys', {
        headers: {
          'Authorization': 'Bearer mock.uuid-thermo-1.signature'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      } else {
        // Use mock data as fallback since admin endpoints might not exist yet
        setApiKeys([
          {
            id: '1',
            name: 'Claude API',
          key: 'sk-ant-***********',
          service: 'claude',
          lastRotated: new Date().toISOString(),
          status: 'active'
        },
        {
          id: '2',
          name: 'Kimi API',
          key: 'kimi-***********',
          service: 'kimi',
          lastRotated: new Date().toISOString(),
          status: 'active'
        }
      ]);
      }
    } catch (error) {
      console.error('Thermonuclear Error: Failed to load keys', error);
    }
  };

  const handleAddKey = async () => {
    if (!newKey.name || !newKey.key || !newKey.service) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      console.log('Thermonuclear: Adding new API key');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(newKey)
      });

      if (!response.ok) throw new Error('Failed to add key');

      const data = await response.json();
      setApiKeys([...apiKeys, data.key]);
      setNewKey({ name: '', key: '', service: '' });
      setShowAddForm(false);
      console.log('Thermonuclear: API key added successfully');
    } catch (error) {
      console.error('Thermonuclear Error: Failed to add key', error);
      alert('Failed to add API key');
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKey = async (keyId: string) => {
    setLoading(true);
    try {
      console.log(`Thermonuclear: Rotating key ${keyId}`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/keys/${keyId}/rotate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to rotate key');

      await loadApiKeys();
      console.log('Thermonuclear: Key rotated successfully');
    } catch (error) {
      console.error('Thermonuclear Error: Failed to rotate key', error);
      alert('Failed to rotate key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    setLoading(true);
    try {
      console.log(`Thermonuclear: Deleting key ${keyId}`);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete key');

      setApiKeys(apiKeys.filter(k => k.id !== keyId));
      console.log('Thermonuclear: Key deleted successfully');
    } catch (error) {
      console.error('Thermonuclear Error: Failed to delete key', error);
      alert('Failed to delete key');
    } finally {
      setLoading(false);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '********';
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <div className="p-6 bg-gray dark:bg-gray-800-900 rounded-lg sm:p-6 bg-gray dark:bg-gray-800-900 rounded-lg md:p-6 bg-gray dark:bg-gray-800-900 rounded-lg lg:p-6 bg-gray dark:bg-gray-800-900 rounded-lg">
      <div className="flex justify-between items-center mb-6 sm:flex justify-between items-center mb-6 md:flex justify-between items-center mb-6 lg:flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white sm:text-2xl font-bold text-white md:text-2xl font-bold text-white lg:text-2xl font-bold text-white">API Keys Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white px-4 py-2 rounded transition-colors sm:bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white px-4 py-2 rounded transition-colors md:bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white px-4 py-2 rounded transition-colors lg:bg-blue dark:bg-gray-800-600 hover:bg-blue dark:bg-gray-800-700 text-white px-4 py-2 rounded transition-colors"
          disabled={loading}
        >
          {showAddForm ? 'Cancel' : 'Add New Key'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray dark:bg-gray-800-800 rounded-lg sm:mb-6 p-4 bg-gray dark:bg-gray-800-800 rounded-lg md:mb-6 p-4 bg-gray dark:bg-gray-800-800 rounded-lg lg:mb-6 p-4 bg-gray dark:bg-gray-800-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4 sm:text-lg font-semibold text-white mb-4 md:text-lg font-semibold text-white mb-4 lg:text-lg font-semibold text-white mb-4">Add New API Key</h3>
          <div className="space-y-4 sm:space-y-4 md:space-y-4 lg:space-y-4">
            <input
              type="text"
              placeholder="Key Name (e.g., OpenAI Production)"
              value={newKey.name}
              onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
              className="w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none sm:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none md:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none lg:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="API Key"
              value={newKey.key}
              onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
              className="w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono sm:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono md:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono lg:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none font-mono"
            />
            <select
              value={newKey.service}
              onChange={(e) => setNewKey({ ...newKey, service: e.target.value })}
              className="w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none sm:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none md:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none lg:w-full p-2 bg-gray dark:bg-gray-800-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Service</option>
              <option value="claude">Claude</option>
              <option value="kimi">Kimi</option>
              <option value="openai">OpenAI</option>
              <option value="uxpilot">UX Pilot</option>
              <option value="pinecone">Pinecone</option>
              <option value="clerk">Clerk</option>
              <option value="stripe">Stripe</option>
              <option value="n8n">N8N</option>
              <option value="spline">Spline</option>
            </select>
            <button
              onClick={handleAddKey}
              disabled={loading}
              className="w-full bg-green dark:bg-gray-800-600 hover:bg-green dark:bg-gray-800-700 text-white py-2 rounded transition-colors disabled:opacity-50 sm:w-full bg-green dark:bg-gray-800-600 hover:bg-green dark:bg-gray-800-700 text-white py-2 rounded transition-colors disabled:opacity-50 md:w-full bg-green dark:bg-gray-800-600 hover:bg-green dark:bg-gray-800-700 text-white py-2 rounded transition-colors disabled:opacity-50 lg:w-full bg-green dark:bg-gray-800-600 hover:bg-green dark:bg-gray-800-700 text-white py-2 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add API Key'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 sm:space-y-4 md:space-y-4 lg:space-y-4">
        {apiKeys.map((key) => (
          <div key={key.id} className="p-4 bg-gray dark:bg-gray-800-800 rounded-lg sm:p-4 bg-gray dark:bg-gray-800-800 rounded-lg md:p-4 bg-gray dark:bg-gray-800-800 rounded-lg lg:p-4 bg-gray dark:bg-gray-800-800 rounded-lg">
            <div className="flex justify-between items-start sm:flex justify-between items-start md:flex justify-between items-start lg:flex justify-between items-start">
              <div className="flex-1 sm:flex-1 md:flex-1 lg:flex-1">
                <h4 className="text-lg font-semibold text-white sm:text-lg font-semibold text-white md:text-lg font-semibold text-white lg:text-lg font-semibold text-white">{key.name}</h4>
                <p className="text-gray-400 font-mono text-sm mt-1 sm:text-gray-400 font-mono text-sm mt-1 md:text-gray-400 font-mono text-sm mt-1 lg:text-gray-400 font-mono text-sm mt-1">{maskKey(key.key)}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 sm:flex items-center space-x-4 mt-2 text-sm text-gray-500 md:flex items-center space-x-4 mt-2 text-sm text-gray-500 lg:flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Service: {key.service}</span>
                  <span>Last rotated: {new Date(key.lastRotated).toLocaleDateString()}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    key.status === 'active' ? 'bg-green dark:bg-gray-800-900 text-green-300' : 'bg-red dark:bg-gray-800-900 text-red-300'
                  }`}>
                    {key.status}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 sm:flex space-x-2 md:flex space-x-2 lg:flex space-x-2">
                <button
                  onClick={() => handleRotateKey(key.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-yellow dark:bg-gray-800-600 hover:bg-yellow dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50 sm:px-3 py-1 bg-yellow dark:bg-gray-800-600 hover:bg-yellow dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50 md:px-3 py-1 bg-yellow dark:bg-gray-800-600 hover:bg-yellow dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50 lg:px-3 py-1 bg-yellow dark:bg-gray-800-600 hover:bg-yellow dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                >
                  Rotate
                </button>
                <button
                  onClick={() => handleDeleteKey(key.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-red dark:bg-gray-800-600 hover:bg-red dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50 sm:px-3 py-1 bg-red dark:bg-gray-800-600 hover:bg-red dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50 md:px-3 py-1 bg-red dark:bg-gray-800-600 hover:bg-red dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50 lg:px-3 py-1 bg-red dark:bg-gray-800-600 hover:bg-red dark:bg-gray-800-700 text-white rounded text-sm transition-colors disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <div className="text-center py-8 text-gray-500 sm:text-center py-8 text-gray-500 md:text-center py-8 text-gray-500 lg:text-center py-8 text-gray-500">
          No API keys configured. Click "Add New Key" to get started.
        </div>
      )}
    </div>
  );
};

export default React.memo(ApiKeysManager);