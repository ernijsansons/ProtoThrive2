import type { AppProps } from 'next/app';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import 'reactflow/dist/style.css';
import '../styles/globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import ProductionMonitor from '../components/ProductionMonitor';
import { AuthProvider } from '../contexts/AuthContext';

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Determine theme based on route
    const isLandingPage = router.pathname === '/landing' || router.pathname === '/';
    const theme = isLandingPage ? 'light' : 'dark';

    // Apply theme to body
    document.body.setAttribute('data-theme', theme);

    // Also set a class for additional styling if needed
    document.body.className = theme === 'light' ? 'theme-light' : 'theme-dark';

    console.log(`Theme set to: ${theme} for route: ${router.pathname}`);
  }, [router.pathname]);

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