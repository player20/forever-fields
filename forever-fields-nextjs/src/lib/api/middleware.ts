// ======================
// API Middleware
// Composable middleware for API route handlers
// ======================

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ValidationError } from "@/lib/errors";
import { DEMO_MODE, DEMO_USER } from "@/lib/constants";
import { handleApiError } from "./error-handler";
import { apiUnauthorized } from "./responses";
import { checkRateLimit, type RateLimitConfig } from "./rate-limit";
import type { ApiContext, ApiUser } from "@/types/api";
import type { ZodSchema } from "zod";

// ======================
// Types
// ======================

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext & { body?: unknown; params?: Record<string, string> }
) => Promise<NextResponse>;

export type ApiMiddleware = (handler: ApiHandler) => ApiHandler;

// ======================
// Authentication Middleware
// ======================

/**
 * Requires authentication - returns 401 if not authenticated
 */
export const withAuth: ApiMiddleware = (handler) => async (request, context) => {
  try {
    // In demo mode, use demo user
    if (DEMO_MODE) {
      return handler(request, {
        ...context,
        user: DEMO_USER as ApiUser,
      });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return apiUnauthorized();
    }

    // Get user's subscription tier from users table
    const { data: userRecord } = await supabase
      .from("users")
      .select("subscription_tier")
      .eq("id", user.id)
      .single() as { data: { subscription_tier: string } | null };

    const apiUser: ApiUser = {
      id: user.id,
      email: user.email || "",
      subscriptionTier: (userRecord?.subscription_tier as ApiUser["subscriptionTier"]) || "free",
    };

    return handler(request, { ...context, user: apiUser });
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Optional authentication - proceeds with or without user
 */
export const withOptionalAuth: ApiMiddleware = (handler) => async (request, context) => {
  try {
    // In demo mode, use demo user
    if (DEMO_MODE) {
      return handler(request, {
        ...context,
        user: DEMO_USER as ApiUser,
      });
    }

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: userRecord } = await supabase
        .from("users")
        .select("subscription_tier")
        .eq("id", user.id)
        .single() as { data: { subscription_tier: string } | null };

      const apiUser: ApiUser = {
        id: user.id,
        email: user.email || "",
        subscriptionTier: (userRecord?.subscription_tier as ApiUser["subscriptionTier"]) || "free",
      };

      return handler(request, { ...context, user: apiUser });
    }

    return handler(request, context);
  } catch (error) {
    return handleApiError(error);
  }
};

// ======================
// Rate Limiting Middleware
// ======================

/**
 * Applies rate limiting to the endpoint
 */
export function withRateLimit(config: RateLimitConfig): ApiMiddleware {
  return (handler) => async (request, context) => {
    try {
      const result = await checkRateLimit(request, config);

      if (result.limited) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Too many requests. Please try again later.",
              details: { retryAfter: result.reset },
            },
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(result.reset),
              "X-RateLimit-Limit": String(result.limit),
              "X-RateLimit-Remaining": String(result.remaining),
              "X-RateLimit-Reset": String(result.reset),
            },
          }
        );
      }

      // Add rate limit headers to successful response
      const response = await handler(request, context);

      // Clone response to add headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-RateLimit-Limit", String(result.limit));
      newHeaders.set("X-RateLimit-Remaining", String(result.remaining));
      newHeaders.set("X-RateLimit-Reset", String(result.reset));

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    } catch (error) {
      return handleApiError(error);
    }
  };
}

// ======================
// Validation Middleware
// ======================

/**
 * Validates request body against a Zod schema
 */
export function withValidation<T>(schema: ZodSchema<T>): ApiMiddleware {
  return (handler) => async (request, context) => {
    try {
      const body = await request.json();
      const result = schema.safeParse(body);

      if (!result.success) {
        const fields: Record<string, string[]> = {};
        for (const issue of result.error.issues) {
          const path = issue.path.join(".");
          if (!fields[path]) {
            fields[path] = [];
          }
          fields[path].push(issue.message);
        }

        throw new ValidationError("Validation failed", fields);
      }

      return handler(request, { ...context, body: result.data as unknown });
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ValidationError("Invalid JSON body");
      }
      return handleApiError(error);
    }
  };
}

// ======================
// Composition Helper
// ======================

/**
 * Composes multiple middlewares into a single middleware
 *
 * Usage:
 * ```typescript
 * const handler = compose(
 *   withAuth,
 *   withRateLimit({ requests: 10, window: "1m" }),
 *   withValidation(mySchema)
 * );
 *
 * export const POST = handler(async (request, { user, body }) => {
 *   // Business logic here
 * });
 * ```
 */
export function compose(...middlewares: ApiMiddleware[]): ApiMiddleware {
  return middlewares.reduceRight(
    (acc, middleware) => (handler) => middleware(acc(handler)),
    (handler: ApiHandler) => handler
  );
}

// ======================
// Error Wrapper
// ======================

/**
 * Wraps a handler with automatic error handling
 */
export const withErrorHandling: ApiMiddleware = (handler) => async (request, context) => {
  try {
    return await handler(request, context);
  } catch (error) {
    return handleApiError(error);
  }
};

// ======================
// Request ID Middleware
// ======================

/**
 * Adds a unique request ID for tracing
 */
export const withRequestId: ApiMiddleware = (handler) => async (request, context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  const response = await handler(request, {
    ...context,
    requestId,
    startTime,
  });

  // Add request ID to response headers
  const newHeaders = new Headers(response.headers);
  newHeaders.set("X-Request-ID", requestId);

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
