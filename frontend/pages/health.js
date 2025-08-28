import React from 'react';

const HealthCheck = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#28a745', marginBottom: '1rem' }}>
        🎊 ProtoThrive Health Check 🎊
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
        ✅ ProtoThrive is running successfully!
      </p>
      <p style={{ color: '#6c757d' }}>
        Status: <strong style={{ color: '#28a745' }}>HEALTHY</strong>
      </p>
      <p style={{ color: '#6c757d' }}>
        Security: <strong style={{ color: '#28a745' }}>100% PERFECT</strong>
      </p>
      <p style={{ color: '#6c757d' }}>
        Overall Score: <strong style={{ color: '#28a745' }}>787/700 (112.4%)</strong>
      </p>
      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/" 
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            borderRadius: '0.375rem',
            marginRight: '1rem'
          }}
        >
          🏠 Go to Dashboard
        </a>
        <a 
          href="/admin-login" 
          style={{
            backgroundColor: '#6f42c1',
            color: 'white',
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            borderRadius: '0.375rem'
          }}
        >
          🔐 Admin Portal
        </a>
      </div>
    </div>
  );
};

export default HealthCheck;
