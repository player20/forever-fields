/**
 * Memories Routes
 * Allow visitors to share stories and memories
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { createMemorySchema } from '../validators/schemas';
import { checkMemorialAccess } from '../utils/permissions';

const router = Router();

/**
 * POST /api/memories
 * Submit a memory/story (goes to pending queue for approval)
 */
router.post(
  '/',
  optionalAuth,
  apiRateLimiter,
  validate(createMemorySchema),
  async (req, res) => {
    try {
      const { memorialId, title, content, authorName, authorRelationship } = req.body;

      // Check access using permissions utility
      const access = await checkMemorialAccess(
        memorialId,
        req.user?.id || null,
        'viewer'
      );

      if (!access.allowed) {
        return res.status(403).json({ error: access.reason || 'Access denied' });
      }

      // Create pending item for memory
      const pendingItem = await prisma.pendingItem.create({
        data: {
          memorialId,
          type: 'memory',
          status: 'pending',
          dataJson: {
            title: title || 'Untitled Memory',
            content,
            authorName: authorName || 'Anonymous',
            authorRelationship: authorRelationship || null,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      return res.status(201).json({
        pendingItem,
        message: 'Your memory has been submitted for approval. It will appear on the memorial after review.',
      });
    } catch (error) {
      console.error('Create memory error:', error);
      return res.status(500).json({ error: 'Failed to submit memory' });
    }
  }
);

/**
 * GET /api/memories/:memorialId
 * Get all approved memories for a memorial
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

    // Get approved memories from the Memory table
    const memories = await prisma.memory.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ memories });
  } catch (error) {
    console.error('Get memories error:', error);
    return res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

export default router;
