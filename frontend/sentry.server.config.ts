// This file configures the initialization of Sentry for edge runtime.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode for development
  debug: process.env.NODE_ENV === 'development',

  // Filter out noise
  beforeSend(event) {
    // Don't send events in development unless it's an actual error
    if (process.env.NODE_ENV === 'development' && event.level !== 'error') {
      return null;
    }

    return event;
  },
});