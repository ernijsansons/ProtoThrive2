import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LandingRebuilt from './landing-rebuilt';
import DashboardRebuilt from './dashboard-rebuilt';

const Dashboard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div style={{
        backgroundColor: '#0a0a0b',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '3rem',
            height: '3rem',
            border: '2px solid #333',
            borderTop: '2px solid #00d2ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <div style={{ fontSize: '1.125rem', color: '#ffffff' }}>
            Loading ProtoThrive...
          </div>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!isAuthenticated) {
    return <LandingRebuilt />;
  }

  // Show bulletproof dashboard for authenticated users
  return <DashboardRebuilt />;
};

export default Dashboard;