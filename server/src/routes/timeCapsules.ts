/**
 * Time Capsules Routes
 * Delayed message delivery for memorials
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { requireMemorialEditor } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { createTimeCapsuleSchema } from '../validators/schemas';

const router = Router();

/**
 * POST /api/time-capsules
 * Create a time capsule (goes to pending queue for approval, no auth required)
 */
router.post(
  '/',
  apiRateLimiter,
  validate(createTimeCapsuleSchema),
  async (req, res) => {
    try {
      const { memorialId, messageText, voiceUrl, videoUrl, unlockDate } = req.body;

      // Verify memorial exists and is accessible
      const memorial = await prisma.memorial.findUnique({
        where: { id: memorialId },
        select: { privacy: true, deceasedName: true },
      });

      if (!memorial) {
        return res.status(404).json({ error: 'Memorial not found' });
      }

      // Only allow time capsules on public or link-accessible memorials
      if (memorial.privacy === 'private') {
        return res.status(403).json({ error: 'Cannot create time capsules on private memorials' });
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
router.get('/:memorialId', async (req, res) => {
  try {
    const { memorialId } = req.params;

    // Verify memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { privacy: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    if (memorial.privacy === 'private') {
      return res.status(403).json({ error: 'Cannot view time capsules on private memorials' });
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
router.post('/:id/open', apiRateLimiter, async (req, res) => {
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
