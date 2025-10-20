/**
 * Admin Page
 * Enterprise admin dashboard with user and organization management
 * Ref: CLAUDE.md Phase 3 - Admin User Management
 */

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import AdminDashboard to avoid SSR issues
const AdminDashboard = dynamic(() => import('../components/AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        <div className="spinner-elite mb-4 mx-auto"></div>
        <p className="text-neon-blue-primary animate-neon-glow">Loading Admin Dashboard...</p>
      </div>
    </div>
  )
});

const AdminPage: React.FC = () => {
  return <AdminDashboard />;
};

export default AdminPage;