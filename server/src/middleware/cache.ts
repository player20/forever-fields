/**
 * In-Memory Response Caching Middleware
 * Caches GET responses to reduce database load
 */

import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  timestamp: number;
  headers: Record<string, string>;
}

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxAge: number; // Cache TTL in milliseconds
  private maxSize: number; // Maximum cache entries

  constructor(maxAge: number = 60000, maxSize: number = 100) {
    this.maxAge = maxAge;
    this.maxSize = maxSize;

    // Clear expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private getCacheKey(req: Request): string {
    const userId = (req as any).user?.id || 'anonymous';
    return `${req.method}:${req.originalUrl}:${userId}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.maxAge;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  private enforceSizeLimit(): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
  }

  get(req: Request): CacheEntry | null {
    const key = this.getCacheKey(req);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(req: Request, data: any, headers: Record<string, string> = {}): void {
    this.enforceSizeLimit();
    const key = this.getCacheKey(req);

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      headers,
    });
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge,
    };
  }
}

// Create cache instances with different TTLs
export const memorialCache = new ResponseCache(300000, 200); // 5 minutes, 200 entries
export const contentCache = new ResponseCache(60000, 500); // 1 minute, 500 entries

/**
 * Cache middleware for GET requests
 * Usage: router.get('/', cacheMiddleware(memorialCache), handler)
 */
export function cacheMiddleware(cache: ResponseCache, ttl?: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check cache
    const cached = cache.get(req);
    if (cached) {
      // Set cache headers
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Age', String(Math.floor((Date.now() - cached.timestamp) / 1000)));

      // Set cached headers
      Object.entries(cached.headers).forEach(([key, value]) => {
        res.set(key, value);
      });

      return res.json(cached.data);
    }

    // Cache miss - intercept response
    res.set('X-Cache', 'MISS');

    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      // Store in cache
      const headers: Record<string, string> = {};
      if (res.get('Content-Type')) {
        headers['Content-Type'] = res.get('Content-Type')!;
      }

      cache.set(req, data, headers);

      // Send response
      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache entries matching a pattern when POST/PUT/DELETE occurs
 */
export function invalidateCacheMiddleware(cache: ResponseCache, pattern: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Invalidate after response
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.invalidate(pattern);
      }
    });
    next();
  };
}
