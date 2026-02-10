// ======================
// Rate Limiting
// In-memory rate limiting for development
// Upstash Redis recommended for production
// ======================

import { NextRequest } from "next/server";
import { RATE_LIMITS, IS_PRODUCTION } from "@/lib/constants";

// ======================
// Types
// ======================

export interface RateLimitConfig {
  /** Number of requests allowed */
  requests: number;
  /** Time window (e.g., "1m", "5m", "1h") */
  window: string;
  /** Optional key prefix for grouping limits */
  keyPrefix?: string;
}

export interface RateLimitResult {
  /** Whether the request should be blocked */
  limited: boolean;
  /** Maximum requests allowed */
  limit: number;
  /** Remaining requests in window */
  remaining: number;
  /** Seconds until rate limit resets */
  reset: number;
}

// ======================
// Window Parsing
// ======================

function parseWindow(window: string): number {
  const match = window.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid rate limit window: ${window}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid rate limit unit: ${unit}`);
  }
}

// ======================
// In-Memory Store (Development)
// ======================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const entries = Array.from(inMemoryStore.entries());
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now) {
        inMemoryStore.delete(key);
      }
    }
  }, 60_000); // Clean up every minute
}

async function inMemoryRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const windowMs = parseWindow(config.window);
  const now = Date.now();

  let entry = inMemoryStore.get(key);

  // Reset if window expired
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  inMemoryStore.set(key, entry);

  const remaining = Math.max(0, config.requests - entry.count);
  const reset = Math.ceil((entry.resetAt - now) / 1000);

  return {
    limited: entry.count > config.requests,
    limit: config.requests,
    remaining,
    reset,
  };
}

// ======================
// Upstash Redis (Production)
// ======================

async function upstashRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Check if Upstash is configured
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    // Fall back to in-memory if Upstash not configured
    console.warn("Upstash Redis not configured, falling back to in-memory rate limiting");
    return inMemoryRateLimit(key, config);
  }

  try {
    const windowMs = parseWindow(config.window);
    const windowSec = Math.ceil(windowMs / 1000);

    // Use Upstash REST API for rate limiting
    // Implement sliding window algorithm
    const response = await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSec],
        ["TTL", key],
      ]),
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed: ${response.statusText}`);
    }

    const results = await response.json();
    const count = results[0].result as number;
    const ttl = results[2].result as number;

    const remaining = Math.max(0, config.requests - count);

    return {
      limited: count > config.requests,
      limit: config.requests,
      remaining,
      reset: ttl > 0 ? ttl : windowSec,
    };
  } catch (error) {
    console.error("Upstash rate limit error:", error);
    // Fall back to in-memory on error
    return inMemoryRateLimit(key, config);
  }
}

// ======================
// Get Rate Limit Key
// ======================

function getRateLimitKey(request: NextRequest, config: RateLimitConfig): string {
  // Try to get user ID from auth header or session
  const authHeader = request.headers.get("authorization");
  const userId = authHeader?.split(" ")[1]; // Bearer <token>

  // Fall back to IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0].trim() || "unknown";

  const identifier = userId || ip;
  const prefix = config.keyPrefix || "rl";

  // Include path in key to have per-endpoint limits
  const path = new URL(request.url).pathname.replace(/\//g, ":");

  return `${prefix}:${path}:${identifier}`;
}

// ======================
// Main Rate Limit Function
// ======================

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = getRateLimitKey(request, config);

  // Use Upstash in production, in-memory in development
  if (IS_PRODUCTION && process.env.UPSTASH_REDIS_REST_URL) {
    return upstashRateLimit(key, config);
  }

  return inMemoryRateLimit(key, config);
}

// ======================
// Preset Configurations
// ======================

export const RateLimitPresets = {
  /** AI endpoints - expensive operations */
  ai: () => checkRateLimit,

  /** Standard API endpoints */
  standard: RATE_LIMITS.STANDARD,

  /** Auth endpoints - prevent brute force */
  auth: RATE_LIMITS.AUTH,

  /** Streaming AI endpoints */
  aiStreaming: RATE_LIMITS.AI_STREAMING,
} as const;
