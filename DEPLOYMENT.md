# Forever Fields Deployment Guide

This guide walks you through deploying Forever Fields to production using **Render** (backend) + **Cloudflare Pages** (frontend) + **Supabase** (database) + **Cloudinary** (media).

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│         foreverfields.app (Cloudflare Pages)            │
│              Frontend - HTML/JS/CSS                     │
└─────────────────┬───────────────────────┬───────────────┘
                  │                       │
                  ▼                       ▼
        ┌─────────────────┐     ┌──────────────────┐
        │  RENDER (API)   │     │   CLOUDINARY     │
        │  Node.js/Express│     │  Media CDN       │
        └────────┬────────┘     └──────────────────┘
                 │
                 ▼
        ┌─────────────────┐     ┌──────────────────┐
        │    SUPABASE     │     │     RESEND       │
        │  PostgreSQL DB  │     │  Email Service   │
        └─────────────────┘     └──────────────────┘
```

---

## ✅ Pre-Deployment Checklist

### 1. Get Cloudinary Cloud Name
- [ ] Go to https://cloudinary.com/console
- [ ] Log in (or create free account)
- [ ] Copy your **Cloud name** from dashboard (e.g., "dxyz123abc")
- [ ] Update `server/.env` line 31: `CLOUDINARY_CLOUD_NAME=your-cloud-name`

### 2. Generate JWT Secret
- [ ] Open PowerShell and run:
  ```powershell
  -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
  ```
- [ ] Copy the output
- [ ] Update `server/.env` line 66: `JWT_SECRET=your-generated-secret`

### 3. Test Locally
- [ ] Run `cd server && npm run build` to verify build works
- [ ] Run `npm start` to test production build locally
- [ ] Visit `http://localhost:3000/health` - should see `{"status":"healthy"}`

---

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 1.2 Create Web Service
1. Click **New** → **Web Service**
2. Connect your `claude-code-example` repository
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `forever-fields-api` |
   | **Region** | `Oregon (US West)` |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npm run prisma:generate && npm run build` |
   | **Start Command** | `npm run prisma:migrate && npm start` |
   | **Instance Type** | `Starter ($7/month)` or `Free` |

4. Click **Advanced** and add these environment variables:

### 1.3 Environment Variables

Add these in the **Environment** section:

```env
# Server Config
NODE_ENV=production
PORT=3000
API_URL=https://forever-fields-api.onrender.com
FRONTEND_URL=https://foreverfields.app

# Database (USE POOLER - port 6543 for production)
DATABASE_URL=postgresql://postgres:5gwnujzkgq3SzK7L@aws-1-us-east-2.pooler.supabase.com:6543/postgres

# Supabase
SUPABASE_URL=https://llrjqlclbvzigidpluvd.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxscmpxbGNsYnZ6aWdpZHBsdXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4ODU5NjYsImV4cCI6MjA4MDQ2MTk2Nn0.4JL-UxN_OIYJ8TS31aB9I9RUJ0u6V-7o_9VwTPWvHS8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxscmpxbGNsYnZ6aWdpZHBsdXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4NTk2NiwiZXhwIjoyMDgwNDYxOTY2fQ.jFaCOr93Lk9C08WhDVmm4KigP8hoZOlKGrcny4Q5L9c

# Cloudinary (UPDATE cloud name!)
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=793545551818937
CLOUDINARY_API_SECRET=K88Id-HorFd40_5ovK5oxkv_llA

# Resend SMTP
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=re_7FDofogY_E7YnwkgQcB7gCFADhtnvM3kL
SMTP_FROM=Forever Fields <noreply@foreverfields.app>

# Security (CHANGE THIS!)
JWT_SECRET=your-generated-32-character-secret-key
```

5. Click **Create Web Service**
6. Wait 5-10 minutes for deployment
7. Visit `https://forever-fields-api.onrender.com/health` to verify

---

## 🌐 Step 2: Deploy Frontend to Cloudflare Pages

### 2.1 Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up (free tier is enough)
3. Verify your email

### 2.2 Deploy to Pages
1. Go to **Workers & Pages** → **Create application** → **Pages**
2. Click **Connect to Git**
3. Select your `claude-code-example` repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Project name** | `forever-fields` |
   | **Production branch** | `main` |
   | **Build command** | (leave empty) |
   | **Build output directory** | `/` |

5. Click **Save and Deploy**
6. Wait 2-3 minutes for deployment

### 2.3 Add Custom Domain
1. In Cloudflare Pages, click **Custom domains**
2. Click **Set up a custom domain**
3. Enter `foreverfields.app`
4. Add DNS records (Cloudflare will guide you)

### 2.4 Update API URL in HTML
1. Edit `index.html` (and other HTML files that use the API)
2. Uncomment this line:
   ```html
   <meta name="api-url" content="https://forever-fields-api.onrender.com">
   ```
3. Commit and push to GitHub (Cloudflare auto-deploys)

---

## 🔧 Step 3: Configure Supabase Row Level Security (RLS)

### 3.1 Enable RLS on Tables
Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public memorials
CREATE POLICY "Public memorials are viewable by everyone"
  ON memorials FOR SELECT
  USING (privacy = 'public');

-- Policy: Owners can do anything with their memorials
CREATE POLICY "Owners have full access to their memorials"
  ON memorials FOR ALL
  USING (auth.uid() = owner_id);

-- Policy: Invited users can view private memorials
CREATE POLICY "Invited users can view private memorials"
  ON memorials FOR SELECT
  USING (
    id IN (
      SELECT memorial_id FROM invitations
      WHERE invitee_email = auth.jwt()->>'email'
      AND used_at IS NOT NULL
      AND expires_at > NOW()
    )
  );

-- Add similar policies for other tables...
```

---

## 📊 Step 4: Set Up Cloudinary Upload Preset

### 4.1 Create Unsigned Upload Preset
1. Go to Cloudinary Console → Settings → Upload
2. Scroll to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - Preset name: `forever_fields_unsigned`
   - Signing mode: **Unsigned**
   - Folder: `forever-fields`
   - Allowed formats: `jpg,png,webp,gif,mp4,mov,mp3,wav`
   - Max file size: `10485760` (10MB for images)
5. Click **Save**

---

## 🧪 Step 5: Test Production Deployment

### Test Checklist
- [ ] Visit https://foreverfields.app - homepage loads
- [ ] Click "Create Memorial" - form appears
- [ ] Create test memorial with email authentication
- [ ] Upload test photo - Cloudinary hosting works
- [ ] Submit guestbook entry - moderation queue works
- [ ] Check email - magic link arrives via Resend
- [ ] Test mobile responsiveness
- [ ] Test PWA install (Add to Home Screen)

---

## 🔒 Security Checklist

- [ ] All environment variables are set in Render (not hardcoded)
- [ ] JWT_SECRET is unique and strong (32+ characters)
- [ ] Supabase RLS policies are enabled
- [ ] CORS is configured for your domain only
- [ ] HTTPS is enforced (Render/Cloudflare handle this)
- [ ] API rate limiting is active (already in code)
- [ ] Cloudinary signed uploads are working

---

## 📈 Monitoring & Maintenance

### Render Dashboard
- Monitor build logs: https://dashboard.render.com/
- View error logs in **Logs** tab
- Auto-deploys on every git push to `main`

### Supabase Dashboard
- Monitor database usage
- View logs and slow queries
- Check API usage

### Cloudinary Dashboard
- Monitor storage usage (25GB free tier)
- View bandwidth usage (25GB/month free tier)
- Check transformation credits

---

## 🐛 Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify DATABASE_URL is using port 6543 (pooler)
- Ensure all env vars are set

### Frontend can't connect to API
- Verify `<meta name="api-url">` is uncommented
- Check CORS settings in `server/src/middleware/security.ts`
- Open browser console for errors

### Database connection issues
- Use pooler connection (port 6543) for production
- Check if Supabase project is paused (free tier)
- Verify password in DATABASE_URL is correct

### Cloudinary uploads fail
- Verify CLOUDINARY_CLOUD_NAME is correct
- Check upload preset exists and is unsigned
- Ensure Cloudinary API keys are valid

---

## 💰 Cost Breakdown (Free Tier Limits)

| Service | Free Tier | Cost After Limit |
|---------|-----------|------------------|
| **Render** | 750 hrs/month | $7/month (Starter) |
| **Supabase** | 500MB DB, 2GB bandwidth | $25/month (Pro) |
| **Cloudinary** | 25GB storage, 25GB bandwidth | $0.04/GB |
| **Resend** | 100 emails/day | $20/month (100k emails) |
| **Cloudflare Pages** | Unlimited | Free forever |
| **Total** | **$0/month** (stays free under limits) | ~$52/month if scaling |

---

## 🎉 You're Live!

Your Forever Fields memorial platform is now production-ready at:
- **Frontend**: https://foreverfields.app
- **Backend API**: https://forever-fields-api.onrender.com
- **Database**: Supabase PostgreSQL
- **Media**: Cloudinary CDN

Happy memorializing! 🌿
