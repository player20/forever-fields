# Supabase Configuration Fixes - Summary

## Issues Found and Fixed

### 1. Incorrect Database Connection Configuration
**Problem:** Prisma was using only one connection string (DATABASE_URL), which caused issues with Supabase's connection pooling system.

**Root Cause:**
- Error logs showed connection attempts to `aws-1-us-east-2.pooler.supabase.com:5432`
- Supabase pooler uses port **6543** (not 5432)
- Prisma with Supabase requires **two** connection strings

**Fix Applied:**
- Updated `prisma/schema.prisma` to use both `DATABASE_URL` and `DIRECT_URL`
- Added proper documentation in `.env.example` and `.env`

### 2. Cleanup Job Running Too Early
**Problem:** The cleanup job ran immediately on server startup before database was fully ready.

**Fix Applied:**
- Added 30-second delay before first cleanup job run
- Added database connectivity check before running cleanup operations
- Created `checkDatabaseConnection()` helper function in `config/database.ts`

### 3. Poor Error Handling
**Problem:** Cleanup job would crash with full error stack trace if database was temporarily unavailable.

**Fix Applied:**
- Added graceful error handling with descriptive messages
- Cleanup job now skips execution if database is unreachable (will retry on next schedule)
- Improved error messages to show only relevant information

---

## Files Modified

1. **server/prisma/schema.prisma**
   - Added `directUrl = env("DIRECT_URL")` to datasource configuration

2. **server/src/config/database.ts**
   - Added `checkDatabaseConnection()` function
   - Improved error handling and logging

3. **server/src/jobs/cleanup-tokens.ts**
   - Added database connectivity check before cleanup
   - Changed immediate execution to 30-second delayed execution
   - Improved error messages
   - Added startup scheduling message

4. **server/.env**
   - Added `DIRECT_URL` environment variable
   - Documented both development and production connection options

5. **server/.env.example**
   - Completely rewrote DATABASE section with proper documentation
   - Added examples for both pooled and direct connections
   - Updated production deployment notes

---

## What You Need to Do in Production (Render.com)

### Step 1: Get Your Supabase Connection Strings

Go to your Supabase project: https://supabase.com/dashboard/project/llrjqlclbvzigidpluvd

Navigate to: **Settings > Database > Connection String**

You'll need TWO connection strings:

#### A. Transaction Pooler Connection (for DATABASE_URL)
- Select "Connection Pooling" tab
- Mode: **Transaction**
- Copy the connection string
- Should look like: `postgresql://postgres.llrjqlclbvzigidpluvd:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres`
- **IMPORTANT:** Add `?pgbouncer=true&connection_limit=1` to the end

**Final format:**
```
postgresql://postgres.llrjqlclbvzigidpluvd:WXcXURK1390O0t6i@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

#### B. Direct Connection (for DIRECT_URL)
- Select "Connection String" tab (not pooling)
- Should look like: `postgresql://postgres:[PASSWORD]@db.llrjqlclbvzigidpluvd.supabase.co:5432/postgres`

**Final format:**
```
postgresql://postgres:WXcXURK1390O0t6i@db.llrjqlclbvzigidpluvd.supabase.co:5432/postgres
```

### Step 2: Update Environment Variables in Render.com

1. Go to your Render.com dashboard: https://dashboard.render.com
2. Select your Forever Fields backend service
3. Go to **Environment** tab
4. Update or add these environment variables:

**DATABASE_URL:**
```
postgresql://postgres.llrjqlclbvzigidpluvd:WXcXURK1390O0t6i@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**DIRECT_URL:** (Add this as a NEW environment variable)
```
postgresql://postgres:WXcXURK1390O0t6i@db.llrjqlclbvzigidpluvd.supabase.co:5432/postgres
```

### Step 3: Deploy and Verify

After updating environment variables in Render:

1. Trigger a new deployment (or wait for auto-deploy)
2. Watch the logs for these messages:
   - `✅ Ready to serve requests` - Server started successfully
   - `[CLEANUP] Cleanup job scheduled - will run in 30 seconds, then every 6 hours` - Cleanup scheduled
   - After 30 seconds, you should see `[CLEANUP] Completed:` with cleanup stats
3. Verify NO Prisma connection errors

---

## Why This Configuration is Needed

### Supabase Connection Pooling Explained

Supabase uses **Supavisor** (PgBouncer) for connection pooling. This is essential for serverless/cloud deployments like Render.com because:

- **Direct connections** (port 5432): Limited number (default: 15-20 concurrent connections)
- **Pooled connections** (port 6543): Can handle 100s-1000s of concurrent connections

### Why Two Connection Strings?

Prisma performs two types of operations:

1. **Regular queries** (SELECT, INSERT, UPDATE, DELETE): Can use pooled connections
2. **Schema operations** (migrations, introspection): Require direct connection with full features

The `pgbouncer=true` parameter tells Prisma to disable prepared statements (not supported in transaction pooling mode).

---

## Testing Locally

Your local development environment will continue to work as before. The `.env` file is configured to use direct connections for both DATABASE_URL and DIRECT_URL, which is fine for development.

To test locally with production-like pooling:
1. Uncomment the "Option 2" lines in `server/.env`
2. Comment out "Option 1" lines
3. Restart your server: `npm run dev`

---

## Expected Behavior After Fix

### Before (Current Production Logs):
```
[CLEANUP] Starting token cleanup job...
[CLEANUP] Error during cleanup job: PrismaClientKnownRequestError:
Invalid `prisma.auditLog.deleteMany()` invocation:
Can't reach database server at `aws-1-us-east-2.pooler.supabase.com:5432`
```

### After (Expected Production Logs):
```
🚀 Forever Fields Backend
✅ Ready to serve requests
[CLEANUP] Cleanup job scheduled - will run in 30 seconds, then every 6 hours
[CLEANUP] Starting token cleanup job...
[CLEANUP] Completed:
  - Magic links: 0 removed
  - Invitations: 0 removed
  - Login attempts: 3 removed
  - Sessions: 1 removed
  - Audit logs: 42 removed
```

---

## Additional Resources

- **Supabase + Prisma docs:** https://supabase.com/docs/guides/database/prisma
- **Prisma connection pooling:** https://www.prisma.io/docs/orm/overview/databases/supabase
- **Supavisor FAQ:** https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI

---

## Rollback Plan (If Issues Occur)

If you encounter issues after deploying:

1. Check Render logs for specific error messages
2. Verify both DATABASE_URL and DIRECT_URL are set correctly
3. Ensure no typos in connection strings
4. If needed, temporarily revert to direct connection only:
   - Set both DATABASE_URL and DIRECT_URL to the same direct connection string
   - This will work but won't scale as well

---

## Summary of Changes

✅ **Fixed:** Database connection configuration
✅ **Fixed:** Cleanup job timing and error handling
✅ **Added:** Health check before database operations
✅ **Added:** Proper environment variable documentation
✅ **Tested:** TypeScript builds successfully

🚀 **Ready to deploy to production!**
