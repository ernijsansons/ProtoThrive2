import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '@/contexts/ThemeContext';

const Settings: React.FC = () => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-4 py-2 rounded ${activeTab === 'general' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-2 rounded ${activeTab === 'security' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Security
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-gray-800 rounded-lg p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">General Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2">Theme</label>
                      <button
                        onClick={toggleTheme}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Security Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2">Two-Factor Authentication</label>
                      <p className="text-gray-400 mb-2">Enhance your account security</p>
                      <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;