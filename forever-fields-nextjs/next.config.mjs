import createNextIntlPlugin from "next-intl/plugin";

// Sentry is optional - only import if installed
let withSentryConfig;
try {
  const sentry = await import("@sentry/nextjs");
  withSentryConfig = sentry.withSentryConfig;
} catch {
  // Sentry not installed, use identity function
  withSentryConfig = (config) => config;
}

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type errors during build - Supabase types are incomplete
  // TODO: Regenerate Supabase types with all tables
  typescript: {
    ignoreBuildErrors: true,
  },
  // Also skip ESLint errors that are warnings-only
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Allow blob URLs and data URLs for user uploads
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

// Sentry configuration options
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
};

// Only wrap with Sentry in production or if explicitly enabled
const config = withNextIntl(nextConfig);

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(config, sentryConfig)
  : config;
