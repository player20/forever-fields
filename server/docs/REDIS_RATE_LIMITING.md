# Redis Rate Limiting Upgrade Guide

## Current Implementation

The Forever Fields backend currently uses **in-memory rate limiting** via `express-rate-limit`. This works well for single-server deployments but has limitations:

- **State is not shared** between server instances
- **Memory grows** with number of tracked IPs
- **State is lost** on server restart

## When to Upgrade to Redis

Upgrade to Redis-based rate limiting when:

1. **Scaling horizontally** (multiple server instances behind a load balancer)
2. **Experiencing memory issues** from rate limit tracking
3. **Need persistent rate limits** across deployments
4. **Approaching 10,000+ daily active users**

## Implementation Steps

### 1. Install Dependencies

```bash
cd server
npm install rate-limit-redis ioredis
npm install -D @types/ioredis
```

### 2. Add Redis Configuration

Add to `server/.env`:

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
# For Render/Railway: redis://user:password@host:port
```

Add to `server/src/config/env.ts`:

```typescript
REDIS_URL: z.string().url().optional(),
```

### 3. Create Redis Client

Create `server/src/config/redis.ts`:

```typescript
import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (!env.REDIS_URL) {
    logger.warn('Redis URL not configured, using in-memory rate limiting');
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }

  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};
```

### 4. Update Rate Limiters

Modify `server/src/middleware/security.ts`:

```typescript
import { RedisStore } from 'rate-limit-redis';
import { getRedisClient } from '../config/redis';

// Helper to create Redis store if available
const createStore = (prefix: string) => {
  const redis = getRedisClient();
  if (redis) {
    return new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    });
  }
  return undefined; // Falls back to in-memory
};

// Update each rate limiter to use the store
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProd ? AUTH_RATE_LIMIT_PROD : AUTH_RATE_LIMIT_DEV,
  store: createStore('auth'),  // Add this line
  // ... rest of config
});

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: API_RATE_LIMIT,
  store: createStore('api'),  // Add this line
  // ... rest of config
});

// Repeat for all rate limiters
```

### 5. Add Health Check

Update `server/src/routes/health.ts`:

```typescript
import { getRedisClient } from '../config/redis';

router.get('/health', async (req, res) => {
  const redis = getRedisClient();
  const redisStatus = redis ? await redis.ping() === 'PONG' : 'not configured';

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    redis: redisStatus,
  });
});
```

### 6. Graceful Shutdown

Update `server/src/index.ts`:

```typescript
import { closeRedis } from './config/redis';

const shutdown = async () => {
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

## Redis Hosting Options

| Provider | Free Tier | Pricing | Best For |
|----------|-----------|---------|----------|
| **Upstash** | 10K commands/day | $0.20/100K commands | Low traffic |
| **Redis Cloud** | 30MB | $5/mo for 100MB | Small apps |
| **Render Redis** | N/A | $7/mo | Already on Render |
| **Railway** | $5 credit/mo | Usage-based | Startups |
| **Self-hosted** | Free | Server cost | Full control |

## Recommended: Upstash

For Forever Fields, **Upstash** is recommended because:

1. **Serverless** - No server to manage
2. **Per-request pricing** - Pay only for what you use
3. **Global edge** - Low latency worldwide
4. **Free tier** - 10K commands/day is enough for development

### Upstash Setup

1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
4. Add to your `.env`:

```env
REDIS_URL=rediss://default:TOKEN@HOST:PORT
```

## Testing the Upgrade

```bash
# Run rate limit tests
npm run test:integration

# Check Redis connection
curl http://localhost:3000/health
# Should show: { "redis": "PONG" }

# Test rate limiting works
for i in {1..20}; do
  curl -s http://localhost:3000/api/auth/magic-link \
    -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@example.com"}' &
done
wait
# Should see 429 responses after limit reached
```

## Monitoring

Add these metrics to your monitoring:

- `redis_connected` - Connection status
- `rate_limit_hits` - Number of rate limit violations
- `redis_latency_ms` - Redis operation latency

## Rollback Plan

If Redis issues occur:

1. Set `REDIS_URL=` (empty) in environment
2. Redeploy - system falls back to in-memory
3. Investigate Redis issues
4. Re-enable when fixed

---

*Last updated: January 2026*
