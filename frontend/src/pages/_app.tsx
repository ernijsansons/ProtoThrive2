import type { AppProps } from 'next/app';
import React from 'react';
import 'reactflow/dist/style.css';
import '../styles/globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import ProductionMonitor from '../components/ProductionMonitor';

function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <div suppressHydrationWarning>
        <Component {...pageProps} />
        <ProductionMonitor />
      </div>
    </ErrorBoundary>
  );
}

export default App;