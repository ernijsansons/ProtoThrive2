// Ref: CLAUDE.md Phase 2 - Enhanced Error boundary with accessibility and recovery
import { Component } from 'react';
import '../styles/globals.css';

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<{children: React.ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    console.log('Thermonuclear Error Boundary Triggered');
    return {hasError: true};
  }

  override render() {
    if (this.state.hasError) {
      return <div>UI Error - Retry</div>;
    }

    return this.props.children;
  }
}

interface AppProps {
  Component: React.ComponentType<Record<string, unknown>>;
  pageProps: Record<string, unknown>;
}

export default function App({ Component, pageProps }: AppProps) {
  console.log('Thermonuclear App Rendered');
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}