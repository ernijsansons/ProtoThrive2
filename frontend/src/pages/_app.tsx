import type { AppProps } from 'next/app';
import React from 'react';
import 'reactflow/dist/style.css';
import '../styles/globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import ProductionMonitor from '../components/ProductionMonitor';
import { AuthProvider } from '../contexts/AuthContext';

function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div suppressHydrationWarning>
          <Component {...pageProps} />
          <ProductionMonitor />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;