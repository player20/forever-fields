// Sentry utilities for error tracking
// Provides a clean API for capturing errors and context
// All functions are no-ops if Sentry is not installed

// Type for user context
interface SentryUser {
  id: string;
  email?: string;
  username?: string;
}

type SeverityLevel = "fatal" | "error" | "warning" | "log" | "info" | "debug";

// Get Sentry module if available
async function getSentry() {
  try {
    return await import("@sentry/nextjs");
  } catch {
    return null;
  }
}

// Set user context for error tracking
export async function setUser(user: SentryUser | null) {
  const Sentry = await getSentry();
  if (!Sentry) return;

  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
}

// Capture an exception with optional context
export async function captureException(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: SeverityLevel;
    user?: SentryUser;
  }
) {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.user) {
      scope.setUser({
        id: context.user.id,
        email: context.user.email,
        username: context.user.username,
      });
    }

    Sentry.captureException(error);
  });
}

// Capture a message with optional context
export async function captureMessage(
  message: string,
  level: SeverityLevel = "info",
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.withScope((scope) => {
    scope.setLevel(level);

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureMessage(message);
  });
}

// Add breadcrumb for better error context
export async function addBreadcrumb(
  message: string,
  category: string,
  level: SeverityLevel = "info",
  data?: Record<string, unknown>
) {
  const Sentry = await getSentry();
  if (!Sentry) return;

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

// Flush pending events (useful before serverless function termination)
export async function flush(timeout = 2000): Promise<boolean> {
  const Sentry = await getSentry();
  if (!Sentry) return true;
  return Sentry.flush(timeout);
}
