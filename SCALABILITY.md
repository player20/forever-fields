# Forever Fields - Scalability Guide

## Current Architecture

### ✅ Optimized for Scale

1. **Database Connection Pooling**
   - Using Supabase Session Pooler with pgBouncer
   - **Current limit**: `connection_limit=1` ⚠️ TOO LOW FOR PRODUCTION
   - **Recommended**: `connection_limit=10` for production workloads
   - Update in Render env var `DATABASE_URL`:
     ```
     postgresql://postgres.llrjqlclbvzigidpluvd:kWWa2mIa4nQ7loFB@aws-1-us-east-2.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=10
     ```

2. **Magic Link Cleanup**
   - Automatic hourly cleanup of expired/used magic links
   - Prevents database bloat
   - Implementation: `server/src/services/cleanup.ts`

3. **Efficient Supabase Auth**
   - Attempts user creation, gracefully handles "already exists"
   - Avoids unnecessary API calls for returning users
   - Session token generation works for both new and existing users

4. **Email Service**
   - Using Resend REST API (not SMTP)
   - Bypasses port blocking on free hosting tiers
   - Scalable to thousands of emails/day

### ⚠️ Needs Improvement for Multi-Instance Scale

1. **Rate Limiting**
   - **Current**: In-memory store (works for single instance only)
   - **For Multi-Instance**: Use Redis-backed rate limiting
   - When scaling horizontally, install `rate-limit-redis`:
     ```bash
     npm install rate-limit-redis ioredis
     ```
   - Update `server/src/middleware/security.ts` to use Redis store

2. **Session Storage**
   - Currently using Supabase auth (centralized, scalable ✅)
   - No server-side session state (stateless ✅)

3. **File Uploads**
   - Using Supabase Storage (scalable ✅)
   - CDN-backed for global distribution

## Scaling Checklist

### Immediate (Required before 100+ concurrent users)
- [ ] Increase database connection limit to 10+
- [ ] Add monitoring/logging service (Sentry, LogRocket, etc.)
- [ ] Set up automated database backups

### When Scaling Horizontally (Multiple server instances)
- [ ] Implement Redis-backed rate limiting
- [ ] Add health check endpoints for load balancer
- [ ] Configure session affinity if needed

### Future Optimizations (1000+ users)
- [ ] Implement database read replicas for queries
- [ ] Add CDN for static assets
- [ ] Consider caching layer (Redis) for frequently accessed data
- [ ] Implement queue system for background jobs (BullMQ)
- [ ] Add distributed tracing (OpenTelemetry)

## Performance Benchmarks

### Current Limits (Free Tier)
- **Render Free Tier**: 512MB RAM, shared CPU
- **Supabase Free Tier**: 500MB database, unlimited API requests
- **Resend Free Tier**: 100 emails/day, 3,000/month

### Estimated Capacity
- ~50-100 concurrent users (Render free tier limit)
- ~5,000 magic link authentications/month (email limit)
- ~10,000 database connections/day (with connection pooling)

## Monitoring

### Key Metrics to Track
1. **Database Connection Pool Usage**
   - Monitor active connections vs limit
   - Alert if approaching limit

2. **API Response Times**
   - Auth endpoints: <500ms target
   - Memorial CRUD: <1s target
   - File uploads: <3s target

3. **Error Rates**
   - Authentication failures
   - Email delivery failures
   - Database connection errors

4. **Resource Usage**
   - Memory usage (watch for leaks)
   - CPU utilization
   - Disk space (for uploaded files)

## Cost Optimization

### Current Setup (Free)
- Render: Free web service
- Supabase: Free tier
- Cloudflare Pages: Free
- Resend: Free tier

### When to Upgrade
1. **Render** ($7/mo): When hitting memory/CPU limits or need 24/7 uptime
2. **Supabase** ($25/mo): When >500MB database or need better performance
3. **Resend** ($20/mo): When >3,000 emails/month needed

## Security Considerations at Scale

1. **Rate Limiting**
   - Auth endpoints: 5 requests/15min per IP ✅
   - API endpoints: 100 requests/15min per IP ✅
   - Upload endpoints: 20 requests/15min per IP ✅

2. **DDoS Protection**
   - Cloudflare provides basic DDoS protection ✅
   - Consider Cloudflare Pro ($20/mo) for advanced protection

3. **Database Security**
   - Using connection pooler with password ✅
   - SSL/TLS encryption ✅
   - Row-level security policies in Supabase ✅

## Deployment Strategy

### Current: Continuous Deployment
- Push to GitHub → Auto-deploy to Render
- Zero-downtime deployments ✅
- Health checks before routing traffic ✅

### Recommended: Staged Rollout (when critical)
1. Deploy to staging environment
2. Run automated tests
3. Manual QA verification
4. Deploy to production during low-traffic hours
5. Monitor error rates for 1 hour

## Backup & Disaster Recovery

### Current State
- Supabase: Daily automatic backups (retained 7 days on free tier)
- Code: Git version control ✅
- No file upload backups ⚠️

### Recommended
1. Enable Supabase Point-in-Time Recovery (paid tier)
2. Implement weekly backup of Supabase Storage files
3. Document restore procedures
4. Test recovery process quarterly
