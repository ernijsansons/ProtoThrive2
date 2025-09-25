import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Critical CSS for above-the-fold content */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS for immediate rendering */
            body { 
              margin: 0; 
              font-family: Inter, system-ui, sans-serif; 
              background-color: #0a0a0b;
              color: #e5e7eb;
            }
            .loading-spinner {
              display: inline-block;
              width: 20px;
              height: 20px;
              border: 3px solid rgba(255,255,255,.3);
              border-radius: 50%;
              border-top-color: #3b82f6;
              animation: spin 1s ease-in-out infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
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
