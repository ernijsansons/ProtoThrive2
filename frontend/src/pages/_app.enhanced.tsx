import React, { useEffect } from 'react';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../styles/globals.css';

// Skip link component for accessibility
const SkipLink: React.FC = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-[100] font-medium shadow-lg"
  >
    Skip to main content
  </a>
);

// Language selector component
const LanguageSelector: React.FC = () => {
  const router = useRouter();
  const { locale, locales, asPath } = router;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.push(asPath, asPath, { locale: newLocale });
  };

  const languageNames: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    ja: '日本語',
    zh: '中文'
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <label htmlFor="language-selector" className="sr-only">
        Select language
      </label>
      <select
        id="language-selector"
        value={locale}
        onChange={handleLanguageChange}
        className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Language selector"
      >
        {locales?.map((loc) => (
          <option key={loc} value={loc}>
            {languageNames[loc] || loc}
          </option>
        ))}
      </select>
    </div>
  );
};

// Accessibility announcer for dynamic content
const AccessibilityAnnouncer: React.FC = () => {
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="announcer-polite"
      />
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="announcer-assertive"
      />
    </>
  );
};

// Error boundary component for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">
              We apologize for the inconvenience. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Set document language attribute
  useEffect(() => {
    if (router.locale) {
      document.documentElement.lang = router.locale;
    }
  }, [router.locale]);

  // Announce route changes for screen readers
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const announcer = document.getElementById('announcer-polite');
      if (announcer) {
        announcer.textContent = `Navigated to ${url}`;
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Add keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + L to open language selector
      if (e.altKey && e.key === 'l') {
        e.preventDefault();
        const selector = document.getElementById('language-selector');
        selector?.focus();
      }

      // Alt + H for help/shortcuts
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        alert('Keyboard Shortcuts:\n• Alt+L: Language selector\n• Alt+H: Show this help\n• Tab: Navigate\n• Enter/Space: Activate');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
      </Head>

      <ErrorBoundary>
        <SkipLink />
        <LanguageSelector />
        <AccessibilityAnnouncer />

        <div className="min-h-screen bg-gradient-dark text-text-primary">
          <main id="main-content" role="main">
            <Component {...pageProps} />
          </main>
        </div>
      </ErrorBoundary>
    </>
  );
}

export default appWithTranslation(MyApp);