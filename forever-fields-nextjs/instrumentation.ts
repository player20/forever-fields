// Next.js instrumentation file
// This file is used to set up monitoring and error tracking

export async function register() {
  // Only load Sentry configs if DSN is configured
  const hasSentry = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (!hasSentry) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import(/* webpackIgnore: true */ "./sentry.server.config").catch(() => {});
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import(/* webpackIgnore: true */ "./sentry.edge.config").catch(() => {});
  }
}

export const onRequestError = async (
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource:
      | "react-server-components"
      | "react-server-components-payload"
      | "server-rendering";
    revalidateReason: "on-demand" | "stale" | undefined;
    renderType: "dynamic" | "dynamic-resume";
  }
) => {
  // Only report if Sentry is configured
  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  try {
    // Dynamic import with variable to prevent TypeScript module resolution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sentryModule = "@sentry/nextjs";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Sentry: any = await import(/* webpackIgnore: true */ sentryModule);

    Sentry.captureException(error, {
      extra: {
        digest: error.digest,
        path: request.path,
        method: request.method,
        routerKind: context.routerKind,
        routePath: context.routePath,
        routeType: context.routeType,
      },
      tags: {
        routerKind: context.routerKind,
        routeType: context.routeType,
      },
    });
  } catch {
    // Sentry not installed
  }
};
