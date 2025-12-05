/**
 * Push Notification Routes
 * Web push notification subscriptions and sending
 */

import { Router } from 'express';
import webpush from 'web-push';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { pushSubscribeSchema } from '../validators/schemas';

const router = Router();

// Configure web-push with VAPID keys
// In production, these should be stored in environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@foreverfields.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
} else {
  console.warn('[Push] VAPID keys not configured. Push notifications will not work.');
  console.warn('[Push] Generate keys with: npx web-push generate-vapid-keys');
}

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post(
  '/subscribe',
  requireAuth,
  apiRateLimiter,
  validate(pushSubscribeSchema),
  async (req, res) => {
    try {
      const { endpoint, keys } = req.body;

      // Check if subscription already exists
      const existing = await prisma.pushSubscription.findUnique({
        where: { endpoint },
      });

      if (existing) {
        return res.status(200).json({ subscription: existing });
      }

      // Create new subscription
      const subscription = await prisma.pushSubscription.create({
        data: {
          userId: req.user!.id,
          endpoint,
          keysJson: keys,
        },
      });

      return res.status(201).json({ subscription });
    } catch (error) {
      console.error('Push subscribe error:', error);
      return res.status(500).json({ error: 'Failed to subscribe to notifications' });
    }
  }
);

/**
 * DELETE /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.delete('/unsubscribe', requireAuth, apiRateLimiter, async (req, res) => {
  try {
    const { endpoint } = req.body;

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: req.user!.id,
        endpoint,
      },
    });

    return res.status(200).json({ message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
  }
});

/**
 * GET /api/push/subscriptions
 * Get all push subscriptions for the current user
 */
router.get('/subscriptions', requireAuth, apiRateLimiter, async (req, res) => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

/**
 * GET /api/push/vapid-public-key
 * Get VAPID public key for client subscription
 */
router.get('/vapid-public-key', (req, res) => {
  if (!VAPID_PUBLIC_KEY) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }

  return res.status(200).json({ publicKey: VAPID_PUBLIC_KEY });
});

/**
 * POST /api/push/send
 * Send push notification to specific user or memorial followers
 */
router.post('/send', requireAuth, apiRateLimiter, async (req, res) => {
  try {
    const { memorialId, userId, title, body, url, type } = req.body;

    let subscriptions = [];

    if (userId) {
      // Send to specific user
      subscriptions = await prisma.pushSubscription.findMany({
        where: { userId },
      });
    } else if (memorialId) {
      // Send to memorial owner
      const memorial = await prisma.memorial.findUnique({
        where: { id: memorialId },
        select: { creatorId: true },
      });

      if (memorial) {
        subscriptions = await prisma.pushSubscription.findMany({
          where: { userId: memorial.creatorId },
        });
      }
    } else {
      return res.status(400).json({ error: 'Either userId or memorialId required' });
    }

    if (subscriptions.length === 0) {
      return res.status(200).json({ message: 'No subscriptions found', sent: 0 });
    }

    // Send push notifications
    const results = await sendPushNotifications(subscriptions, {
      title,
      body,
      url,
      type,
      memorialId,
    });

    return res.status(200).json({
      message: 'Notifications sent',
      sent: results.success,
      failed: results.failed,
    });
  } catch (error) {
    console.error('Push send error:', error);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Send push notifications to multiple subscriptions
 */
async function sendPushNotifications(
  subscriptions: any[],
  payload: {
    title: string;
    body: string;
    url?: string;
    type?: string;
    memorialId?: string;
    icon?: string;
    badge?: string;
  }
) {
  const results = {
    success: 0,
    failed: 0,
  };

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' fill='%23A7C9A2'/><text x='96' y='140' font-size='120' text-anchor='middle'>🌿</text></svg>",
    badge: payload.badge || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'><circle cx='48' cy='48' r='48' fill='%23A7C9A2'/><text x='48' y='72' font-size='60' text-anchor='middle'>🌿</text></svg>",
    url: payload.url || '/',
    type: payload.type || 'general',
    memorialId: payload.memorialId || null,
    timestamp: Date.now(),
  });

  const promises = subscriptions.map(async (subscription) => {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: typeof subscription.keysJson === 'string'
          ? JSON.parse(subscription.keysJson)
          : subscription.keysJson,
      };

      await webpush.sendNotification(pushSubscription, notificationPayload);
      results.success++;
    } catch (error: any) {
      console.error('[Push] Failed to send notification:', error);
      results.failed++;

      // Remove subscription if it's no longer valid (410 Gone)
      if (error.statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: subscription.id },
        }).catch((err) => console.error('[Push] Failed to delete invalid subscription:', err));
      }
    }
  });

  await Promise.all(promises);

  return results;
}

/**
 * Send notification for new candle lit
 */
export async function sendCandleLitNotification(memorialId: string, candleData: { name: string; message?: string | null }) {
  try {
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { creatorId: true, deceasedName: true },
    });

    if (!memorial) return;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: memorial.creatorId },
    });

    if (subscriptions.length === 0) return;

    const title = `🕯️ New Candle Lit`;
    const body = `${candleData.name} lit a candle on ${memorial.deceasedName}'s memorial`;
    const url = `/memorial/?id=${memorialId}`;

    await sendPushNotifications(subscriptions, {
      title,
      body,
      url,
      type: 'candle',
      memorialId,
    });
  } catch (error) {
    console.error('[Push] Failed to send candle notification:', error);
  }
}

/**
 * Send notification for new memory/tribute added
 */
export async function sendMemoryAddedNotification(memorialId: string, memoryData: { name: string }) {
  try {
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { creatorId: true, deceasedName: true },
    });

    if (!memorial) return;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: memorial.creatorId },
    });

    if (subscriptions.length === 0) return;

    const title = `💭 New Memory Shared`;
    const body = `${memoryData.name} shared a memory on ${memorial.deceasedName}'s memorial`;
    const url = `/memorial/?id=${memorialId}`;

    await sendPushNotifications(subscriptions, {
      title,
      body,
      url,
      type: 'memory',
      memorialId,
    });
  } catch (error) {
    console.error('[Push] Failed to send memory notification:', error);
  }
}

/**
 * Send notification for memorial anniversary
 */
export async function sendAnniversaryNotification(memorialId: string) {
  try {
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { creatorId: true, deceasedName: true, passingDate: true },
    });

    if (!memorial) return;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: memorial.creatorId },
    });

    if (subscriptions.length === 0) return;

    const passingDate = new Date(memorial.passingDate);
    const years = new Date().getFullYear() - passingDate.getFullYear();

    const title = `🕊️ Anniversary Reminder`;
    const body = `Today marks ${years} ${years === 1 ? 'year' : 'years'} since ${memorial.deceasedName} passed away`;
    const url = `/memorial/?id=${memorialId}`;

    await sendPushNotifications(subscriptions, {
      title,
      body,
      url,
      type: 'anniversary',
      memorialId,
    });
  } catch (error) {
    console.error('[Push] Failed to send anniversary notification:', error);
  }
}

export default router;
