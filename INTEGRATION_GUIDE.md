# Forever Fields - Integration Guide
**Required API Keys & Third-Party Services**

This document lists all external services and API keys needed to run Forever Fields.

---

## 🔴 REQUIRED INTEGRATIONS (Cannot Run Without These)

### 1. Supabase (Database & Authentication)
**Purpose**: PostgreSQL database hosting + User authentication

**Setup Steps**:
1. Create account at https://supabase.com
2. Create new project
3. Go to Project Settings → API
4. Copy these keys to `.env`:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Get DATABASE_URL from Project Settings → Database → Connection String (URI)

**Cost**: **FREE** tier includes:
- 500 MB database
- 50,000 monthly active users
- 1 GB file storage
- 2 GB bandwidth

**Paid Plans**: Starts at $25/month for Pro (unlimited everything)

---

### 2. Cloudinary (Image & Video Uploads)
**Purpose**: Photo uploads with automatic optimization and moderation

**Setup Steps**:
1. Create account at https://cloudinary.com
2. Go to Dashboard → Account Details
3. Copy these keys to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
   ```

**Features Used**:
- Auto-optimization (WebP format, responsive breakpoints)
- AI content moderation (AWS Rekognition)
- Auto-tagging
- Signed uploads (secure)

**Cost**: **FREE** tier includes:
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month

**Paid Plans**: Starts at $89/month for Plus (100 GB storage)

---

### 3. SMTP Email Service (Choose One)

#### Option A: SendGrid (Recommended for Production)
**Purpose**: Send magic link authentication emails

**Setup Steps**:
1. Create account at https://sendgrid.com
2. Create API key in Settings → API Keys
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   SMTP_FROM=Forever Fields <noreply@foreverfields.com>
   ```

**Cost**: **FREE** tier includes:
- 100 emails/day (3,000/month)
- Email validation included

**Paid Plans**: Starts at $19.95/month for 50,000 emails/month

#### Option B: Gmail (Development Only)
**Setup Steps**:
1. Enable 2-factor authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=Forever Fields <noreply@foreverfields.com>
   ```

**Limits**: 500 emails/day (Gmail limit)

#### Option C: AWS SES (High Volume)
**Setup Steps**:
1. Create AWS account
2. Verify domain in AWS SES
3. Get SMTP credentials
4. Add to `.env`:
   ```env
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=AKIAIOSFODNN7EXAMPLE
   SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   SMTP_FROM=Forever Fields <noreply@foreverfields.com>
   ```

**Cost**: $0.10 per 1,000 emails (ultra cheap)

---

## 🟡 OPTIONAL INTEGRATIONS (Enhanced Features)

### 4. Web Push Notifications (VAPID Keys)
**Purpose**: Browser push notifications for new candles, memories

**Setup Steps**:
1. Generate keys locally (no external service needed):
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Add output to `.env`:
   ```env
   VAPID_PUBLIC_KEY=BAbcdefghijklmnopqrstuvwxyz1234567890...
   VAPID_PRIVATE_KEY=abcdefghijklmnopqrstuvwxyz1234567890
   VAPID_SUBJECT=mailto:admin@foreverfields.com
   ```

**Cost**: **FREE** (browser-based, no external service)

**What Happens if Missing**:
- Push notifications won't work
- App continues to function normally
- No errors shown to users

---

### 5. Google Translate API (Multilingual Support)
**Purpose**: Translate memorial pages to 8 languages

**Current Implementation**: Uses Google Translate's **free public endpoint** (no API key required)

**Limitations**:
- Rate limited
- No guarantee of uptime
- Basic translation quality

**Alternative (If Scaling)**: Google Cloud Translation API
1. Create Google Cloud account
2. Enable Cloud Translation API
3. Create API key
4. Cost: $20 per 1 million characters

**What Happens if Missing**:
- Language switcher still works
- Translations provided by free Google Translate endpoint
- May hit rate limits under high traffic

---

## ❌ NOT IMPLEMENTED (Missing Features)

### 6. Stripe (Payment Processing)
**Status**: ⚠️ **NOT IMPLEMENTED** (Pricing page exists, but no checkout)

**Purpose**: Handle $299 Individual and $399 Funeral Home plan payments

**Setup Steps** (When Implementing):
1. Create account at https://stripe.com
2. Get API keys from Dashboard → Developers → API Keys
3. Add to `.env`:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx (frontend)
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx (backend)
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx (webhooks)
   ```
4. Implement backend routes:
   - POST /api/payments/create-checkout-session
   - POST /api/payments/webhook
5. Update pricing page with checkout button

**Cost**: 2.9% + 30¢ per transaction

**Implementation Time**: 8-10 hours

---

### 7. Send Flowers Affiliate
**Status**: ⚠️ **PLACEHOLDER** (Button exists, no affiliate link)

**Purpose**: "Send Flowers" button on memorial pages generates affiliate revenue

**Options**:
- **1-800-Flowers Affiliate Program**
  - Sign up: https://www.1800flowers.com/affiliate-program
  - Commission: 5-10% per sale

- **FTD Affiliate Program**
  - Sign up: https://www.ftd.com/affiliate
  - Commission: 8% per sale

- **Teleflora Affiliate Program**
  - Sign up: https://www.teleflora.com/affiliate
  - Commission: 5% per sale

**Implementation**: Replace button href with affiliate tracking link

**Implementation Time**: 30 minutes

---

### 8. Google Maps API (Future: Burial Map)
**Status**: ❌ **NOT STARTED**

**Purpose**: Show cemetery locations on interactive map

**Setup Steps** (When Implementing):
1. Create Google Cloud account
2. Enable Maps JavaScript API
3. Get API key
4. Add to `.env`:
   ```env
   GOOGLE_MAPS_API_KEY=AIzaSyXxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Cost**:
- **FREE** tier: 25,000 map loads/month
- After: $7 per 1,000 loads

---

### 9. AI Content Moderation (Recommended)
**Status**: ⚠️ **BASIC WORD LIST** (Inadequate for production)

**Purpose**: Detect spam, hate speech, inappropriate content

**Current**: Simple blocked word list (`['spam', 'viagra', 'casino']`)

**Recommended Options**:

#### Option A: Perspective API (Google)
- Sign up: https://perspectiveapi.com/
- Cost: **FREE** for low volume
- Setup: Get API key, integrate in moderation.js
- Features: Toxicity detection, spam detection

#### Option B: AWS Comprehend
- Sign up: AWS Console
- Cost: $0.0001 per 100 characters
- Features: Sentiment analysis, entity detection

**Implementation Time**: 4-6 hours

---

## 📋 QUICK SETUP CHECKLIST

### For Development (Minimum Setup):
- [ ] Supabase account + keys
- [ ] Cloudinary account + keys
- [ ] Gmail app password OR SendGrid free tier
- [ ] Generate VAPID keys (optional but recommended)
- [ ] Create `.env` file with all required keys
- [ ] Run `npm install` in `/server`
- [ ] Run `npx prisma generate` in `/server`
- [ ] Run `npm run dev` to start backend

### For Production (Full Setup):
- [ ] All development requirements
- [ ] SendGrid (upgrade from Gmail)
- [ ] Stripe account + payment integration
- [ ] Send Flowers affiliate program
- [ ] AI content moderation (Perspective API)
- [ ] Error monitoring (Sentry)
- [ ] Domain name + SSL certificate
- [ ] Deploy to Render/Vercel/AWS

---

## 🔐 SECURITY NOTES

### Environment Variables (.env)
⚠️ **NEVER COMMIT `.env` TO GIT**

The `.env.example` file is provided as a template. Copy it:
```bash
cp .env.example .env
```

Then fill in your actual keys.

### API Keys Security:
- ✅ Backend keys stay in `.env` (never exposed to frontend)
- ✅ Frontend keys (Stripe publishable, VAPID public) are safe to expose
- ✅ Rotate keys regularly (every 90 days)
- ✅ Use different keys for dev/staging/production

### Database:
- ✅ Enable Row Level Security (RLS) in Supabase
- ✅ Use service role key only on backend
- ✅ Never expose database credentials to frontend

---

## 💰 COST ESTIMATE

### Free Tier (Development):
- Supabase: FREE
- Cloudinary: FREE
- SendGrid: FREE (100 emails/day)
- VAPID/Push: FREE
- **Total Monthly**: $0

### Production (Low Traffic):
- Supabase: FREE (up to 500 MB database)
- Cloudinary: FREE (up to 25 GB bandwidth)
- SendGrid: $19.95 (up to 50,000 emails/month)
- Stripe: Pay-as-you-go (2.9% + 30¢ per transaction)
- **Total Monthly**: ~$20

### Production (High Traffic):
- Supabase Pro: $25/month
- Cloudinary Plus: $89/month
- SendGrid: $89.95/month (up to 300,000 emails)
- Stripe: Pay-as-you-go
- AI Moderation: $50/month
- **Total Monthly**: ~$250-300

---

## 📞 SUPPORT

**Supabase Issues**: https://supabase.com/docs
**Cloudinary Issues**: https://support.cloudinary.com/
**SendGrid Issues**: https://docs.sendgrid.com/
**Stripe Issues**: https://support.stripe.com/

---

## 📝 CHANGELOG

**Last Updated**: December 5, 2024

### Integration Status:
- ✅ Supabase (Fully Integrated)
- ✅ Cloudinary (Fully Integrated)
- ✅ SMTP Email (Fully Integrated)
- ✅ Web Push/VAPID (Fully Integrated)
- ✅ Google Translate (Client-Side, No Key Needed)
- ❌ Stripe Payments (Not Implemented)
- ❌ Send Flowers Affiliate (Placeholder Only)
- ❌ Google Maps (Not Started)
- ⚠️ AI Moderation (Basic Word List Only)

---

**Generated by**: Claude Code (Code Review Agent)
**For Questions**: Consult development team
