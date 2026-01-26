/**
 * Time Capsules Routes
 * Delayed message delivery for memorials
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { requireMemorialEditor } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { createTimeCapsuleSchema } from '../validators/schemas';
import { checkMemorialAccess } from '../utils/permissions';

const router = Router();

/**
 * POST /api/time-capsules
 * Create a time capsule (requires auth, goes to pending queue for approval)
 */
router.post(
  '/',
  requireAuth,
  apiRateLimiter,
  validate(createTimeCapsuleSchema),
  async (req, res) => {
    try {
      const { memorialId, messageText, voiceUrl, videoUrl, unlockDate } = req.body;

      // Check access using permissions utility (requires editor permission to create capsules)
      const access = await checkMemorialAccess(
        memorialId,
        req.user!.id,
        'editor'
      );

      if (!access.allowed) {
        return res.status(403).json({ error: access.reason || 'Access denied' });
      }

      // Validate unlock date is in the future
      const unlockDateTime = new Date(unlockDate);
      if (unlockDateTime <= new Date()) {
        return res.status(400).json({ error: 'Unlock date must be in the future' });
      }

      // Create pending item for time capsule (requires approval before appearing)
      const pendingItem = await prisma.pendingItem.create({
        data: {
          memorialId,
          type: 'time_capsule',
          status: 'pending',
          dataJson: {
            messageText: messageText || null,
            voiceUrl: voiceUrl || null,
            videoUrl: videoUrl || null,
            unlockDate: unlockDate,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      return res.status(201).json({
        pendingItem,
        message: 'Time capsule submitted for approval. It will appear on the memorial after review.',
      });
    } catch (error) {
      console.error('Create time capsule error:', error);
      return res.status(500).json({ error: 'Failed to create time capsule' });
    }
  }
);

/**
 * GET /api/time-capsules/:memorialId
 * Get unlocked and approved time capsules for a memorial
 */
router.get('/:memorialId', optionalAuth, async (req, res) => {
  try {
    const { memorialId } = req.params;

    // Check access using permissions utility
    const access = await checkMemorialAccess(
      memorialId,
      req.user?.id || null,
      'viewer'
    );

    if (!access.allowed) {
      return res.status(403).json({ error: access.reason || 'Access denied' });
    }

    // Get approved time capsule pending items
    const pendingItems = await prisma.pendingItem.findMany({
      where: {
        memorialId,
        type: 'time_capsule',
        status: 'approved',
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter to only show unlocked time capsules
    const now = new Date();
    const unlockedCapsules = pendingItems.filter(item => {
      const dataJson = typeof item.dataJson === 'string'
        ? JSON.parse(item.dataJson)
        : item.dataJson;

      const unlockDate = new Date(dataJson.unlockDate);
      return unlockDate <= now;
    });

    // Transform to time capsule format
    const timeCapsules = unlockedCapsules.map(item => {
      const dataJson = typeof item.dataJson === 'string'
        ? JSON.parse(item.dataJson)
        : item.dataJson;

      return {
        id: item.id,
        memorialId: item.memorialId,
        messageText: dataJson.messageText,
        voiceUrl: dataJson.voiceUrl,
        videoUrl: dataJson.videoUrl,
        unlockDate: dataJson.unlockDate,
        submittedAt: dataJson.submittedAt,
        createdAt: item.createdAt,
      };
    });

    return res.status(200).json({ timeCapsules });
  } catch (error) {
    console.error('Get time capsules error:', error);
    return res.status(500).json({ error: 'Failed to fetch time capsules' });
  }
});

/**
 * POST /api/time-capsules/:id/open
 * Mark a time capsule as opened (for statistics)
 */
router.post('/:id/open', optionalAuth, apiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const pendingItem = await prisma.pendingItem.findUnique({
      where: { id },
    });

    if (!pendingItem || pendingItem.type !== 'time_capsule') {
      return res.status(404).json({ error: 'Time capsule not found' });
    }

    const dataJson = typeof pendingItem.dataJson === 'string'
      ? JSON.parse(pendingItem.dataJson)
      : pendingItem.dataJson;

    // Check if unlocked
    const unlockDate = new Date(dataJson.unlockDate);
    if (new Date() < unlockDate) {
      return res.status(403).json({ error: 'Time capsule is still locked' });
    }

    // Update with opened timestamp
    const updated = await prisma.pendingItem.update({
      where: { id },
      data: {
        dataJson: {
          ...dataJson,
          openedAt: new Date().toISOString(),
        },
      },
    });

    return res.status(200).json({
      message: 'Time capsule opened',
      timeCapsule: {
        id: updated.id,
        openedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Open time capsule error:', error);
    return res.status(500).json({ error: 'Failed to open time capsule' });
  }
});

export default router;
