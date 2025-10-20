import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical CSS for above-the-fold content - Optimized for Core Web Vitals */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for optimal First Contentful Paint */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              line-height: 1.6;
              overflow-x: hidden;
              background: linear-gradient(135deg, #0A0A0B 0%, #1A1A1B 100%);
              color: #e5e7eb;
              min-height: 100vh;
            }
            :root {
              --neon-blue-primary: #00D2FF;
              --neon-blue-secondary: #0099CC;
              --neon-green-primary: #00FF88;
              --dark-primary: #0A0A0B;
              --text-primary: #FFFFFF;
            }
            /* Critical layout utilities */
            .min-h-screen { min-height: 100vh; }
            .text-center { text-align: center; }
            .flex { display: flex; }
            .hidden { display: none; }
            /* Critical typography */
            .text-4xl { font-size: 2.25rem; }
            .text-xl { font-size: 1.25rem; }
            .font-bold { font-weight: 700; }
            /* Loading state */
            .loading-spinner {
              display: inline-block;
              width: 40px;
              height: 40px;
              border: 3px solid rgba(0, 210, 255, 0.3);
              border-top: 3px solid #00D2FF;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                transition-duration: 0.01ms !important;
              }
            }
            /* High contrast mode */
            @media (prefers-contrast: high) {
              :root {
                --neon-blue-primary: #00E6FF;
                --text-primary: #FFFFFF;
              }
            }
          `
        }} />
        
        {/* Service Worker Registration */}
        <script dangerouslySetInnerHTML={{
          __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw-optimized.js')
                  .then(function(registration) {
                    console.log('SW registered: ', registration);
                  })
                  .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
              });
            }
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
