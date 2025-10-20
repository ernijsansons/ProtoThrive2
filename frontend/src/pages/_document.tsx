/**
 * Custom Document Component for Next.js
 *
 * @description Customizes the initial HTML document structure
 * Phase 0: Adds lang="en" attribute for WCAG 2.1 AA compliance
 *
 * @compliance WCAG 2.1 AA - Criterion 3.1.1 Language of Page (Level A)
 * @version 1.0.0
 */

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for API */}
        <link rel="dns-prefetch" href="https://protothrive-backend.ernijs-ansons.workers.dev" />

        {/* Meta tags for security and performance */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#1f2937" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
