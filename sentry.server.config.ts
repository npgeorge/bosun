// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  environment: process.env.NODE_ENV,

  // Ignore errors from health checks and monitoring
  ignoreErrors: [
    'ECONNRESET',
    'EPIPE',
    'ETIMEDOUT',
  ],

  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry server event (development):', event)
      return null // Don't send to Sentry in development
    }

    // Add server context
    event.contexts = {
      ...event.contexts,
      server: {
        name: 'bosun-api',
        version: process.env.npm_package_version,
      },
    }

    return event
  },

  // Note: HTTP instrumentation is automatically included in modern Sentry SDK
  // No need to manually add integrations
})
