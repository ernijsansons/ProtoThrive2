// Ref: CLAUDE.md Phase 2 - Error boundary
import { Component } from 'react';
import 'reactflow/dist/style.css';
import '../styles/globals.css';

class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError() {
    console.log('Thermonuclear Error Boundary Triggered');
    return {hasError: true};
  }

  render() {
    if (this.state.hasError) {
      return <div>UI Error - Retry</div>;
    }

    return this.props.children;
  }
}

export default function App({ Component, pageProps }: { Component: any, pageProps: any }) {
  console.log('Thermonuclear App Rendered');
  return (
    <ErrorBoundary>
      <div suppressHydrationWarning>
        <Component {...pageProps} />
      </div>
    </ErrorBoundary>
  );
}