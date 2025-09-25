// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Capture Console API calls
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Filter out known development warnings
  beforeSend(event) {
    // Filter out React development warnings in dev mode
    if (process.env.NODE_ENV === 'development' &&
        event.message?.includes('React does not recognize')) {
      return null;
    }

    // Filter out known Next.js warnings
    if (event.message?.includes('Warning: ')) {
      return null;
    }

    return event;
  },

  // Set user context
  beforeSendTransaction(transaction) {
    // Only send transactions in production or staging
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return transaction;
  },
});