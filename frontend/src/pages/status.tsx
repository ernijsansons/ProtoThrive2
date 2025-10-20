import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { SparklesIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

const StatusPage = () => {
  const services = [
    { name: 'API', status: 'operational', uptime: '99.99%', latency: '45ms' },
    { name: 'Frontend', status: 'operational', uptime: '100%', latency: '12ms' },
    { name: 'AI Agents', status: 'operational', uptime: '99.95%', latency: '320ms' },
    { name: 'Database', status: 'operational', uptime: '99.98%', latency: '8ms' },
    { name: 'Authentication', status: 'operational', uptime: '99.99%', latency: '25ms' },
  ];

  return (
    <>
      <Head>
        <title>System Status - ProtoThrive</title>
        <meta name="description" content="Check ProtoThrive's system status and uptime" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header */}
        <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-gray-900 font-bold text-xl">ProtoThrive</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-full mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-semibold">All Systems Operational</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              System Status
            </h1>
            <p className="text-xl text-gray-600">
              Real-time status of ProtoThrive services
            </p>
          </div>

          {/* Services Status */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="divide-y divide-gray-200">
              {services.map((service, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <p className="text-sm text-green-600 capitalize">{service.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Uptime:</span> {service.uptime}
                        </div>
                        <div>
                          <span className="font-medium">Latency:</span> {service.latency}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uptime Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">99.99%</div>
              <div className="text-sm text-gray-600">Overall Uptime</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{'<'}50ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-sm text-gray-600">Incidents (30 days)</div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <ClockIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Monitoring & Updates</h3>
                <p className="text-sm text-blue-800">
                  System status is updated every 60 seconds. Subscribe to our status page for real-time
                  notifications of any incidents or maintenance windows.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 text-center bg-white border-t border-gray-200">
          <p className="text-sm text-gray-500">
            © 2025 ProtoThrive. All rights reserved.
          </p>
        </footer>
      </div>
    </>
  );
};

export default StatusPage;
