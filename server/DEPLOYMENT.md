# Forever Fields Backend - Deployment Guide

This guide covers deploying the Forever Fields backend to Render.com with Supabase PostgreSQL.

## Prerequisites

- [Supabase](https://supabase.com) account (free tier)
- [Render.com](https://render.com) account (free tier)
- [Cloudinary](https://cloudinary.com) account (free tier)
- Email service (SendGrid, AWS SES, or Gmail for dev)

## Step 1: Setup Supabase

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: forever-fields
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for project creation (~2 minutes)

### 1.2 Get Supabase Credentials

1. Go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 1.3 Get Database Connection String

1. Go to **Project Settings** > **Database**
2. Scroll to **Connection string** > **URI**
3. Copy the connection string
4. Replace `[YOUR-PASSWORD]` with your database password
5. This is your `DATABASE_URL`

### 1.4 Enable Row Level Security (RLS)

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE qrcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;

-- Users: Can only read/update their own record
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Memorials: Owner has full access
CREATE POLICY "Users can view own memorials" ON memorials
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create memorials" ON memorials
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own memorials" ON memorials
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own memorials" ON memorials
  FOR DELETE USING (auth.uid() = owner_id);

-- Public memorials viewable by anyone
CREATE POLICY "Public memorials viewable" ON memorials
  FOR SELECT USING (privacy = 'public');

-- Candles: Anyone can create (for public/link memorials)
CREATE POLICY "Anyone can create candles" ON candles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view candles" ON candles
  FOR SELECT USING (true);

-- Pending items: Only memorial owner
CREATE POLICY "Owners can view pending items" ON pending_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = pending_items.memorial_id
      AND memorials.owner_id = auth.uid()
    )
  );

-- Time capsules: Viewable when unlocked
CREATE POLICY "View unlocked time capsules" ON time_capsules
  FOR SELECT USING (unlock_date <= now());

-- Push subscriptions: Users can manage their own
CREATE POLICY "Users can manage own subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

## Step 2: Setup Cloudinary

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Sign up or log in
3. Go to **Dashboard**
4. Copy:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

## Step 3: Setup Email Service

### Option A: SendGrid (Recommended for Production)

1. Go to [SendGrid](https://sendgrid.com)
2. Create account and verify email
3. Go to **Settings** > **API Keys**
4. Create new API key with "Mail Send" permissions
5. Copy API key
6. Use these settings:
   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.your-api-key-here
   SMTP_FROM=Forever Fields <noreply@yourdomain.com>
   ```

### Option B: Gmail (Development Only)

1. Enable 2-factor authentication on Gmail
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use these settings:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=your-email@gmail.com
   ```

## Step 4: Deploy to Render.com

### 4.1 Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub (recommended)

### 4.2 Connect Repository

1. Push your code to GitHub:
   ```bash
   cd server
   git init
   git add .
   git commit -m "Initial commit: Forever Fields backend v0.0-secure-backend"
   git branch -M main
   git remote add origin https://github.com/yourusername/forever-fields-backend.git
   git push -u origin main
   ```

### 4.3 Create PostgreSQL Database

1. In Render Dashboard, click **New +** > **PostgreSQL**
2. Fill in:
   - **Name**: forever-fields-db
   - **Database**: forever_fields
   - **User**: forever_fields_user
   - **Region**: Oregon (or closest to you)
   - **Plan**: Free
3. Click **Create Database**
4. Wait for creation (~2 minutes)
5. **Important**: Copy the **Internal Database URL** (starts with `postgresql://`)

### 4.4 Create Web Service

1. Click **New +** > **Web Service**
2. Connect your GitHub repository
3. Fill in:
   - **Name**: forever-fields-api
   - **Region**: Oregon (same as database)
   - **Branch**: main
   - **Root Directory**: server (if monorepo) or leave blank
   - **Environment**: Node
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Plan**: Free

### 4.5 Configure Environment Variables

Click **Advanced** > **Add Environment Variable** and add:

```
NODE_ENV=production
PORT=3000
API_URL=https://forever-fields-api.onrender.com
FRONTEND_URL=https://your-frontend-url.com
DATABASE_URL=[paste Internal Database URL from Step 4.3]
SUPABASE_URL=[from Step 1.2]
SUPABASE_ANON_KEY=[from Step 1.2]
SUPABASE_SERVICE_ROLE_KEY=[from Step 1.2]
CLOUDINARY_CLOUD_NAME=[from Step 2]
CLOUDINARY_API_KEY=[from Step 2]
CLOUDINARY_API_SECRET=[from Step 2]
SMTP_HOST=[from Step 3]
SMTP_PORT=587
SMTP_USER=[from Step 3]
SMTP_PASS=[from Step 3]
SMTP_FROM=Forever Fields <noreply@yourdomain.com>
JWT_SECRET=[generate with: openssl rand -base64 32]
```

Optional (Web Push):
```bash
# Generate VAPID keys locally:
npx web-push generate-vapid-keys

# Then add:
VAPID_PUBLIC_KEY=[public key]
VAPID_PRIVATE_KEY=[private key]
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### 4.6 Deploy

1. Click **Create Web Service**
2. Wait for deployment (~5 minutes)
3. Check logs for errors
4. Visit `https://forever-fields-api.onrender.com/health` - should return `{"status":"healthy"}`

## Step 5: Run Database Migrations

### Option A: Automatic (via Render)

Migrations run automatically on deploy via the start command.

### Option B: Manual (via Prisma Studio)

1. Install Prisma CLI locally:
   ```bash
   npm install -g prisma
   ```

2. Set DATABASE_URL:
   ```bash
   export DATABASE_URL="your-database-url-here"
   ```

3. Run migrations:
   ```bash
   cd server
   npx prisma migrate deploy
   ```

4. (Optional) Open Prisma Studio:
   ```bash
   npx prisma studio
   ```

## Step 6: Verify Deployment

### 6.1 Health Check

```bash
curl https://forever-fields-api.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 6.2 Test Authentication

```bash
curl -X POST https://forever-fields-api.onrender.com/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "message": "If an account exists, a magic link has been sent to your email"
}
```

## Troubleshooting

### Database Connection Issues

1. Check `DATABASE_URL` format:
   ```
   postgresql://user:password@host:port/database?schema=public
   ```

2. Ensure using **Internal Database URL** (not External)

3. Check database is in same region as web service

### Migration Errors

1. Check Prisma schema matches database
2. Reset database (WARNING: deletes all data):
   ```bash
   npx prisma migrate reset
   ```

### Email Not Sending

1. Verify SMTP credentials
2. Check spam folder
3. Review Render logs for email errors
4. Test with Mailtrap.io first

### Memory Issues (Free Tier)

Render free tier has 512MB RAM limit. If exceeded:

1. Reduce Prisma query logging
2. Optimize middleware
3. Upgrade to paid plan ($7/mo)

## Monitoring & Logs

### View Logs

```bash
# Render Dashboard > Your Service > Logs
# Or use Render CLI:
render logs -s forever-fields-api
```

### Setup Alerts

1. Render Dashboard > Service > Settings
2. Add email for deployment notifications
3. Configure health check alerts

## Security Checklist

- [x] HTTPS enforced (automatic on Render)
- [x] CORS restricted to frontend domain
- [x] Rate limiting enabled
- [x] Helmet security headers
- [x] Row Level Security (RLS) enabled
- [x] Environment variables secured
- [x] Magic links expire in 15 minutes
- [x] Single-use tokens
- [x] No error detail leakage
- [x] Input validation with Zod

## Scaling & Performance

### Free Tier Limitations

- 512MB RAM
- Shared CPU
- Spins down after 15 min inactivity
- 750 hours/month

### Upgrade Path

1. **Starter Plan** ($7/mo): Always on, more RAM
2. **Standard Plan** ($25/mo): Dedicated CPU
3. **Pro Plan** ($85/mo): High performance

### Caching Recommendations

1. Add Redis for session storage
2. Implement CDN for static assets
3. Use Cloudinary transformations

## Maintenance

### Database Backups

Render PostgreSQL free tier includes:
- Daily backups (7 day retention)
- Point-in-time recovery

### Updates

```bash
# Pull latest code
git pull

# Update dependencies
npm update

# Create new migration if schema changed
npx prisma migrate dev --name update-xyz

# Push to production
git push origin main
```

## Cost Estimate (Free Tier)

- **Render Web Service**: Free (750 hrs/mo)
- **Render PostgreSQL**: Free (1GB storage)
- **Supabase**: Free (500MB database, 50K monthly active users)
- **Cloudinary**: Free (25GB storage, 25GB bandwidth)
- **SendGrid**: Free (100 emails/day)

**Total Monthly Cost**: $0 (scales with usage)

## Support

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

**Version**: v0.0-secure-backend
**Last Updated**: 2024
