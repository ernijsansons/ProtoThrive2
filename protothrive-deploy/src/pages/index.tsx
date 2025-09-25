import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Head>
        <title>ProtoThrive - Thermonuclear AI Development Platform</title>
        <meta name="description" content="ProtoThrive - Advanced AI-powered development platform for creating and managing intelligent roadmaps with thermonuclear efficiency." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Enhanced SEO and Open Graph */}
        <meta property="og:title" content="ProtoThrive - Thermonuclear AI Platform" />
        <meta property="og:description" content="Transform your development process with AI-powered roadmaps and intelligent project management." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://protothrive.com" />
        <meta property="og:image" content="/og-image.png" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ProtoThrive - Thermonuclear AI Platform" />
        <meta name="twitter:description" content="Transform your development process with AI-powered roadmaps." />
        
        <link rel="canonical" href="https://protothrive.com" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#3b82f6" />
      </Head>

      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <header className="container-lg py-4 md:py-6">
          <nav role="navigation" aria-label="Main navigation">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-base">PT</span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white neon-text">
                  ProtoThrive
                </h1>
              </div>
              <Link 
                href="/admin-login"
                className="btn bg-primary-600 text-white hover:bg-primary-700 focus-ring text-sm md:text-base"
                aria-label="Access admin portal"
              >
                Admin Portal
              </Link>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main id="main-content" role="main" className="container-lg">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center px-4">
            
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up">
              
              {/* Main Heading */}
              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  <span className="text-gradient">Thermonuclear</span>
                  <br className="hidden sm:block" />
                  <span className="block sm:inline"> AI Development</span>
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed text-balance">
                  Transform your development process with AI-powered roadmaps and intelligent project management
                </p>
              </div>

              {/* Status Indicator */}
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2" aria-live="polite">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">Initializing Platform...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2 text-success-600" aria-live="polite">
                  <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse-neon"></div>
                  <span className="font-medium">Platform Online & Ready</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link 
                  href="/admin-login"
                  className="w-full sm:w-auto btn bg-primary-600 text-white hover:bg-primary-700 focus-ring px-8 py-3 text-lg font-medium shadow-soft hover:shadow-medium transition-all duration-300 hover:scale-105"
                  aria-describedby="admin-description"
                >
                  Enter Admin Portal
                </Link>
                
                <button 
                  className="w-full sm:w-auto neon-button px-8 py-3 text-lg font-medium"
                  onClick={() => {
                    document.getElementById('system-status')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  aria-describedby="status-description"
                >
                  View System Status
                </button>
              </div>

              {/* Description */}
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <p id="admin-description" className="sr-only">
                  Access the administrative interface to manage AI agents, roadmaps, and system configurations
                </p>
                <p id="status-description" className="sr-only">
                  View detailed system status including backend connectivity and service health
                </p>
              </div>
            </div>

            {/* System Status Section */}
            <section 
              id="system-status"
              className="w-full max-w-2xl mx-auto mt-16 md:mt-24"
              aria-labelledby="status-heading"
            >
              <h3 id="status-heading" className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                System Status
              </h3>
              
              <div className="card space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Frontend</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success-500 rounded-full" aria-hidden="true"></div>
                    <span className="text-success-600 dark:text-success-400 font-medium">Active</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Backend API</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success-500 rounded-full" aria-hidden="true"></div>
                    <a 
                      href="https://backend-thermo.ernijs-ansons.workers.dev" 
                      className="text-success-600 hover:text-success-700 dark:text-success-400 font-medium hover:underline focus-ring"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Backend API endpoint (opens in new tab)"
                    >
                      Connected
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">AI Services</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-warning-500 rounded-full animate-pulse" aria-hidden="true"></div>
                    <span className="text-warning-600 dark:text-warning-400 font-medium">Standby</span>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>

        {/* Footer */}
        <footer className="container-lg py-6 mt-auto border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p>
              © 2025 ProtoThrive. Thermonuclear AI Development Platform.
            </p>
            <p className="font-mono text-xs">
              Version 2.0.0 | Status: Thriving ⚡
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}