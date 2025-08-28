import React from 'react';

function Error({ statusCode }) {
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
      <h1 style={{ color: '#dc3545', marginBottom: '1rem', fontSize: '2.5rem' }}>
        {statusCode ? `${statusCode} - Error` : 'An error occurred'}
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
        Something went wrong, but we're working on it!
      </p>
      <div style={{ marginTop: '2rem' }}>
        <a 
          href="/" 
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '0.75rem 1.5rem',
            textDecoration: 'none',
            borderRadius: '0.375rem'
          }}
        >
          🏠 Go Home
        </a>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
