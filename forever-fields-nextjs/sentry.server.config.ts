// Sentry server-side configuration
// This file configures the initialization of Sentry on the server.
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
        beforeSend(event: unknown) {
          if (process.env.DEMO_MODE === "true") return null;
          return event;
        },
        ignoreErrors: [
          "ECONNREFUSED",
          "ETIMEDOUT",
          "ENOTFOUND",
          "429",
          "Too Many Requests",
          "JWTExpired",
          "AuthSessionMissingError",
        ],
      });
    })
    .catch(() => {
      // Sentry not installed, skip initialization
    });
}

export {};
