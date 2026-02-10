// Sentry edge runtime configuration
// This file configures the initialization of Sentry for edge functions.
// Note: @sentry/nextjs must be installed for this to work

// Skip if no DSN configured
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Use variable to prevent TypeScript from resolving the module
  const sentryModule = "@sentry/nextjs";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (import(/* webpackIgnore: true */ sentryModule) as Promise<any>)
    .then((Sentry) => {
      Sentry.init({
        dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
        debug: false,
        environment: process.env.NODE_ENV,
        release: process.env.VERCEL_GIT_COMMIT_SHA || "development",
      });
    })
    .catch(() => {
      // Sentry not installed, skip initialization
    });
}

export {};
