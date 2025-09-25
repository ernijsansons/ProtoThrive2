import type { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { EnhancedErrorBoundary } from '../components/EnhancedErrorBoundary';
import '../styles/globals.css';

// Initialize security features
if (typeof window !== 'undefined') {
  // Client-side only initialization
  import('../utils/security-enhanced').then(({ default: Security }) => {
    // Set up CSP nonce
    Security.CSPManager.generateNonce();
    console.log('🔒 ProtoThrive Security initialized');
  });
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <EnhancedErrorBoundary level="critical">
      <ThemeProvider>
        <AuthProvider>
          <EnhancedErrorBoundary level="page">
            <Component {...pageProps} />
          </EnhancedErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </EnhancedErrorBoundary>
  );
}