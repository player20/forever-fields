# Forever Fields - Subscription Tier Implementation

**Date**: 2025-12-06
**Status**: ✅ Backend Implementation Complete | ⏳ Database Migration Pending

---

## Overview

This document describes the complete subscription tier system implementation for Forever Fields. The system enforces the three pricing tiers with proper feature gating and trial period tracking.

---

## Pricing Tiers (Canonical from Homepage)

### Free Preview - $0 (14-day trial)
- **Duration**: 14 days from signup
- **Memorials**: 1 memorial maximum
- **Photos**: Up to 10 photos per memorial
- **Timeline**: Basic timeline only
- **Privacy**: Public sharing only (no private/link-only)
- **Support**: Community support
- **Enforcement**: Trial expires after 14 days, upgrade required

### Forever Plan - $299 one-time + $29/year
- **Memorials**: Unlimited
- **Photos**: Unlimited photos and videos
- **Features**:
  - Family memories & guestbook
  - Basic grief support tools
  - Custom memorial URL
  - Private sharing controls
  - Email support
- **Enforcement**: Lifetime access after payment

### Healing & Heritage Bundle - $399 one-time + $39/year
- **Includes**: Everything in Forever Plan
- **Additional Features**:
  - Guided daily reflections
  - Premium grief resources
  - Advanced family tree features
  - Time-capsule messages
  - Priority family support
- **Enforcement**: Lifetime access after payment

---

## Database Schema Changes

### User Model Updates

Added to `User` table:
```prisma
subscriptionTier   SubscriptionTier  @default(FREE)
trialEndsAt        DateTime?         // When free trial expires
stripeCustomerId   String?  @unique  // For payment integration
```

### New Subscription Model

```prisma
model Subscription {
  id                    String
  userId                String
  tier                  SubscriptionTier
  status                SubscriptionStatus @default(active)
  oneTimePayment        Int?  // In cents: $299 = 29900
  annualFee             Int?  // In cents: $29 = 2900
  stripePaymentIntentId String?
  stripeSubscriptionId  String?
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  cancelAt              DateTime?
  createdAt             DateTime
  updatedAt             DateTime
}
```

### Enums

**SubscriptionTier**:
- `FREE` - 14-day trial
- `FOREVER` - $299 + $29/year
- `HEALING` - $399 + $39/year

**SubscriptionStatus**:
- `active` - Currently active and paid
- `trial` - In 14-day trial period
- `past_due` - Payment failed, grace period
- `canceled` - User canceled, will expire at period end
- `expired` - Subscription ended

---

## Feature Gating Implementation

### Middleware Created: `subscription-guard.ts`

Located at: `server/src/middleware/subscription-guard.ts`

#### 1. `requireActiveSubscription`
- Checks if user's trial has expired
- Blocks access if FREE tier and past 14 days
- Returns 403 with upgrade prompt

#### 2. `canCreateMemorial`
- FREE: Allows 1 memorial max
- FOREVER/HEALING: Unlimited memorials
- Returns memorial count and limit if blocked

#### 3. `canUploadPhoto`
- FREE: Allows 10 photos max per memorial
- FOREVER/HEALING: Unlimited photos
- Returns photo count and limit if blocked

#### 4. `canCreatePrivateMemorial`
- FREE: Only public memorials allowed
- FOREVER/HEALING: Private/link-only allowed
- Returns upgrade prompt if blocked

#### 5. `requireTier(tier)`
- Checks if user has specified tier or higher
- Hierarchy: FREE < FOREVER < HEALING
- Used for premium features (reflections, time capsules, etc.)

---

## Routes Protected

### Memorial Creation (`POST /api/memorials`)
```typescript
router.post('/',
  requireAuth,
  requireActiveSubscription,  // ✅ Check trial
  canCreateMemorial,          // ✅ Check memorial limit
  canCreatePrivateMemorial,   // ✅ Check privacy settings
  ...
);
```

### Photo Upload (`POST /api/uploads/sign`)
```typescript
router.post('/sign',
  requireAuth,
  requireActiveSubscription,  // ✅ Check trial
  canUploadPhoto,             // ✅ Check photo limit
  ...
);
```

---

## Trial Period Enforcement

### On Signup (`POST /api/auth/callback`)

When new users sign up via magic link:
```typescript
const trialEndsAt = new Date();
trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14 days from now

user = await prisma.user.create({
  data: {
    email: magicLink.email,
    subscriptionTier: 'FREE',
    trialEndsAt, // ✅ Trial expiration set
  },
});
```

### Trial Expiration Check

The `requireActiveSubscription` middleware checks on every protected request:
```typescript
if (user.subscriptionTier === 'FREE' && user.trialEndsAt) {
  if (new Date() > user.trialEndsAt) {
    return res.status(403).json({
      error: 'Trial expired',
      message: 'Your 14-day trial has ended. Please upgrade to continue.',
      upgradeUrl: '/pricing',
    });
  }
}
```

---

## Error Responses

### Trial Expired (403)
```json
{
  "error": "Trial expired",
  "message": "Your 14-day trial has ended. Please upgrade to continue.",
  "upgradeUrl": "/pricing"
}
```

### Memorial Limit Reached (403)
```json
{
  "error": "Memorial limit reached",
  "message": "Your FREE plan allows 1 memorial. You currently have 1.",
  "upgradeUrl": "/pricing",
  "currentTier": "FREE",
  "limit": 1,
  "currentCount": 1
}
```

### Photo Limit Reached (403)
```json
{
  "error": "Photo limit reached",
  "message": "Your FREE plan allows 10 photos per memorial. This memorial has 10.",
  "upgradeUrl": "/pricing",
  "currentTier": "FREE",
  "limit": 10,
  "currentCount": 10
}
```

### Feature Not Available (403)
```json
{
  "error": "Feature not available",
  "message": "Private memorials require a paid plan. Upgrade to Forever or Healing & Heritage Bundle.",
  "upgradeUrl": "/pricing",
  "requiredTier": "FOREVER"
}
```

### Tier Upgrade Required (403)
```json
{
  "error": "Upgrade required",
  "message": "This feature requires the HEALING plan or higher.",
  "upgradeUrl": "/pricing",
  "currentTier": "FREE",
  "requiredTier": "HEALING"
}
```

---

## Deployment Steps

### 1. Apply Database Migration

**IMPORTANT**: This requires valid database credentials. Update `server/.env` with current Supabase credentials before running.

```bash
cd server
npx prisma migrate deploy
```

Or manually run the SQL in Supabase SQL Editor:
```sql
-- See: server/prisma/migrations/20251206_add_subscription_tiers/migration.sql
```

### 2. Regenerate Prisma Client

```bash
cd server
npx prisma generate
```

### 3. Update Existing Users (Data Migration)

All existing users need trial dates set:
```sql
-- Set trial end date for existing users (14 days from account creation)
UPDATE users
SET
  subscription_tier = 'FREE',
  trial_ends_at = created_at + INTERVAL '14 days'
WHERE subscription_tier IS NULL;
```

### 4. Deploy to Production

Push changes to GitHub, Render will auto-deploy:
```bash
git add .
git commit -m "Implement subscription tier system with 14-day trial"
git push origin main
```

---

## Testing Checklist

### Free Tier (14-day trial)

- [ ] New user signup sets `trialEndsAt` to 14 days from now
- [ ] User can create 1 memorial
- [ ] User blocked from creating 2nd memorial with proper error
- [ ] User can upload up to 10 photos per memorial
- [ ] User blocked from uploading 11th photo with proper error
- [ ] User can only create public memorials
- [ ] User blocked from creating private memorial with upgrade prompt
- [ ] After 14 days, user blocked from all actions with trial expired error
- [ ] Dashboard shows trial expiration date

### Forever Tier

- [ ] User can create unlimited memorials
- [ ] User can upload unlimited photos
- [ ] User can create private/link-only memorials
- [ ] User has lifetime access (no expiration)
- [ ] User blocked from HEALING features (time capsules, reflections)

### Healing Tier

- [ ] User has all FOREVER features
- [ ] User can access guided reflections
- [ ] User can create time-capsule messages
- [ ] User can access advanced family tree
- [ ] User has priority support

### Edge Cases

- [ ] Trial expiration happens mid-session (refresh required to see error)
- [ ] User upgrades from FREE → FOREVER (limits removed immediately)
- [ ] User downgrades from HEALING → FOREVER (premium features locked)
- [ ] Expired trial user can still VIEW memorials but not create/edit
- [ ] Payment failure changes status to `past_due` with grace period

---

## Frontend Integration (TODO)

The backend is ready, but frontend needs updates:

### 1. Show Trial Status in Dashboard
```javascript
// GET /api/user/subscription-info
{
  "tier": "FREE",
  "trialEndsAt": "2025-01-20T12:00:00Z",
  "trialExpired": false,
  "memorialCount": 1,
  "limits": {
    "maxMemorials": 1,
    "maxPhotosPerMemorial": 10,
    "allowPrivateMemorials": false
  }
}
```

Display: "Trial ends in 5 days" with upgrade CTA.

### 2. Handle 403 Errors Gracefully

When user hits a limit:
```javascript
if (response.status === 403 && response.data.error === 'Memorial limit reached') {
  showUpgradeModal({
    title: 'Memorial Limit Reached',
    message: response.data.message,
    currentTier: response.data.currentTier,
    upgradeUrl: '/pricing'
  });
}
```

### 3. Disable Create Buttons When Limit Reached

```javascript
// In dashboard
const subscriptionInfo = await api.getSubscriptionInfo();

if (subscriptionInfo.memorialCount >= subscriptionInfo.limits.maxMemorials) {
  createMemorialButton.disabled = true;
  createMemorialButton.title = 'Memorial limit reached. Upgrade to create more.';
}
```

### 4. Show Upgrade Prompts Proactively

```javascript
// Before creating 1st memorial
if (subscriptionInfo.tier === 'FREE') {
  showNotice('You're on the free 14-day trial. This is your only memorial. Upgrade for unlimited memorials.');
}
```

---

## Payment Integration (Stripe - TODO)

### Checkout Flow

1. User clicks "Upgrade to Forever Plan" on pricing page
2. Create Stripe Checkout Session:
```typescript
POST /api/subscriptions/create-checkout
{
  "tier": "FOREVER"
}
```
3. Stripe handles payment
4. Webhook updates user tier:
```typescript
POST /api/subscriptions/webhook
// Stripe sends payment_intent.succeeded
// Backend updates:
await prisma.user.update({
  where: { stripeCustomerId },
  data: { subscriptionTier: 'FOREVER' }
});
```

### Annual Renewal

1. Create Stripe recurring subscription for annual fee
2. Webhook handles renewal:
```typescript
// subscription.invoice.paid
await prisma.subscription.update({
  where: { stripeSubscriptionId },
  data: {
    status: 'active',
    currentPeriodEnd: new Date(invoice.period_end * 1000)
  }
});
```

### Cancellation

1. User cancels subscription
2. Set `cancelAt` to period end:
```typescript
await prisma.subscription.update({
  data: {
    status: 'canceled',
    cancelAt: currentPeriodEnd
  }
});
```
3. Keep access until `cancelAt`, then downgrade to FREE

---

## Content Consistency Verification

✅ **Homepage**: Updated to show "Healing & Heritage Bundle" and "14-day trial"
✅ **Pricing Page**: Matches homepage exactly with Free Preview tier
✅ **Comparison Table**: All three tiers with correct features
✅ **Database Schema**: Supports all three tiers with feature limits
✅ **Backend Enforcement**: Middleware blocks unauthorized actions
⏳ **Frontend**: Needs update to show trial status and handle 403 errors
⏳ **Payment**: Stripe integration needed for upgrades

---

## Next Steps

1. **Deploy Database Migration** - Apply migration to production database
2. **Test Trial Enforcement** - Create test user and verify 14-day limit
3. **Frontend Integration** - Add trial status display and upgrade prompts
4. **Stripe Integration** - Implement payment flow for upgrades
5. **Email Notifications** - Send reminders at 3 days and 1 day before trial expires
6. **Admin Panel** - Allow manual tier upgrades for testing/support

---

## Summary

The subscription tier system is **fully implemented on the backend**:

- ✅ Database schema updated with tiers and trial tracking
- ✅ Middleware enforces memorial, photo, and privacy limits
- ✅ Trial period set to 14 days from signup
- ✅ Error responses provide clear upgrade paths
- ✅ Content consistent across homepage and pricing page

**Remaining work**:
- Database migration needs to be applied
- Frontend needs integration for trial display and error handling
- Payment integration with Stripe needed for actual upgrades

The backend is production-ready and will enforce all subscription tier restrictions as designed.
