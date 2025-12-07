/**
 * Subscription Tier Enforcement Middleware
 * Ensures users can only access features included in their subscription tier
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { SubscriptionTier } from '@prisma/client';

// Feature limits by tier
const TIER_LIMITS = {
  FREE: {
    maxMemorials: 1,
    maxPhotosPerMemorial: 10,
    allowPrivateMemorials: false,
    allowTimeCapsules: false,
    allowAdvancedFamilyTree: false,
    allowGuidedReflections: false,
    allowPremiumResources: false,
    trialDays: 14,
  },
  FOREVER: {
    maxMemorials: Infinity,
    maxPhotosPerMemorial: Infinity,
    allowPrivateMemorials: true,
    allowTimeCapsules: false,
    allowAdvancedFamilyTree: false,
    allowGuidedReflections: false,
    allowPremiumResources: false,
    trialDays: 0, // No trial, lifetime access
  },
  HEALING: {
    maxMemorials: Infinity,
    maxPhotosPerMemorial: Infinity,
    allowPrivateMemorials: true,
    allowTimeCapsules: true,
    allowAdvancedFamilyTree: true,
    allowGuidedReflections: true,
    allowPremiumResources: true,
    trialDays: 0, // No trial, lifetime access
  },
};

/**
 * Check if user's trial has expired
 */
async function checkTrialExpired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true, trialEndsAt: true },
  });

  if (!user) return true;

  // Only FREE tier has trial
  if (user.subscriptionTier !== 'FREE') return false;

  // If trialEndsAt is not set, they haven't started trial yet
  if (!user.trialEndsAt) return false;

  // Check if trial has expired
  return new Date() > user.trialEndsAt;
}

/**
 * Middleware: Require active subscription (not expired trial)
 */
export const requireActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const trialExpired = await checkTrialExpired(userId);
    if (trialExpired) {
      return res.status(403).json({
        error: 'Trial expired',
        message: 'Your 14-day trial has ended. Please upgrade to continue.',
        upgradeUrl: '/pricing',
      });
    }

    next();
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking trial status:', error);
    return res.status(500).json({ error: 'Failed to verify subscription' });
  }
};

/**
 * Middleware: Check if user can create another memorial
 */
export const canCreateMemorial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        _count: { select: { memorials: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const limit = TIER_LIMITS[user.subscriptionTier].maxMemorials;
    const currentCount = user._count.memorials;

    if (currentCount >= limit) {
      return res.status(403).json({
        error: 'Memorial limit reached',
        message: `Your ${user.subscriptionTier} plan allows ${limit} memorial${limit === 1 ? '' : 's'}. You currently have ${currentCount}.`,
        upgradeUrl: '/pricing',
        currentTier: user.subscriptionTier,
        limit,
        currentCount,
      });
    }

    next();
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking memorial limit:', error);
    return res.status(500).json({ error: 'Failed to verify memorial limit' });
  }
};

/**
 * Middleware: Check if user can upload another photo to this memorial
 */
export const canUploadPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const memorialId = req.params.memorialId || req.body.memorialId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Count existing photos for this memorial
    const photoCount = await prisma.photo.count({
      where: { memorialId },
    });

    const limit = TIER_LIMITS[user.subscriptionTier].maxPhotosPerMemorial;

    if (photoCount >= limit) {
      return res.status(403).json({
        error: 'Photo limit reached',
        message: `Your ${user.subscriptionTier} plan allows ${limit} photo${limit === 1 ? '' : 's'} per memorial. This memorial has ${photoCount}.`,
        upgradeUrl: '/pricing',
        currentTier: user.subscriptionTier,
        limit,
        currentCount: photoCount,
      });
    }

    next();
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking photo limit:', error);
    return res.status(500).json({ error: 'Failed to verify photo limit' });
  }
};

/**
 * Middleware: Check if user can create private memorials
 */
export const canCreatePrivateMemorial = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const privacy = req.body.privacy;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // If memorial is public, no tier check needed
    if (privacy === 'public') {
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const allowed = TIER_LIMITS[user.subscriptionTier].allowPrivateMemorials;

    if (!allowed) {
      return res.status(403).json({
        error: 'Feature not available',
        message: 'Private memorials require a paid plan. Upgrade to Forever or Healing & Heritage Bundle.',
        upgradeUrl: '/pricing',
        requiredTier: 'FOREVER',
      });
    }

    next();
  } catch (error) {
    console.error('[SUBSCRIPTION] Error checking privacy settings:', error);
    return res.status(500).json({ error: 'Failed to verify privacy permission' });
  }
};

/**
 * Middleware: Require specific tier or higher
 */
export const requireTier = (minimumTier: SubscriptionTier) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Tier hierarchy: FREE < FOREVER < HEALING
      const tierHierarchy: Record<SubscriptionTier, number> = {
        FREE: 0,
        FOREVER: 1,
        HEALING: 2,
      };

      if (tierHierarchy[user.subscriptionTier] < tierHierarchy[minimumTier]) {
        return res.status(403).json({
          error: 'Upgrade required',
          message: `This feature requires the ${minimumTier} plan or higher.`,
          upgradeUrl: '/pricing',
          currentTier: user.subscriptionTier,
          requiredTier: minimumTier,
        });
      }

      next();
    } catch (error) {
      console.error('[SUBSCRIPTION] Error checking tier requirement:', error);
      return res.status(500).json({ error: 'Failed to verify subscription tier' });
    }
  };
};

/**
 * Helper: Get user's current tier and limits
 */
export const getUserSubscriptionInfo = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      trialEndsAt: true,
      _count: { select: { memorials: true } },
    },
  });

  if (!user) return null;

  const limits = TIER_LIMITS[user.subscriptionTier];
  const trialExpired = user.trialEndsAt ? new Date() > user.trialEndsAt : false;

  return {
    tier: user.subscriptionTier,
    trialEndsAt: user.trialEndsAt,
    trialExpired,
    memorialCount: user._count.memorials,
    limits,
  };
};
