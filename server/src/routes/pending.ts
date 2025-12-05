/**
 * Pending Items Routes
 * Moderation queue for user-submitted content
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { requireMemorialOwner } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { pendingItemActionSchema } from '../validators/schemas';

const router = Router();

/**
 * POST /api/pending/approve/:id
 * Approve a pending item (owner only)
 */
router.post(
  '/approve/:id',
  requireAuth,
  apiRateLimiter,
  validate(pendingItemActionSchema, 'params'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get pending item
      const pendingItem = await prisma.pendingItem.findUnique({
        where: { id },
        include: { memorial: true },
      });

      if (!pendingItem) {
        return res.status(404).json({ error: 'Pending item not found' });
      }

      // Check ownership
      if (pendingItem.memorial.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'You do not have permission to approve this item' });
      }

      // Update status
      const approved = await prisma.pendingItem.update({
        where: { id },
        data: { status: 'approved' },
      });

      // TODO: Based on type, create the actual resource (photo, memory, etc.)
      // This would involve moving data from dataJson to the appropriate table

      return res.status(200).json({ item: approved });
    } catch (error) {
      console.error('Approve pending item error:', error);
      return res.status(500).json({ error: 'Failed to approve item' });
    }
  }
);

/**
 * POST /api/pending/reject/:id
 * Reject a pending item (owner only)
 */
router.post(
  '/reject/:id',
  requireAuth,
  apiRateLimiter,
  validate(pendingItemActionSchema, 'params'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get pending item
      const pendingItem = await prisma.pendingItem.findUnique({
        where: { id },
        include: { memorial: true },
      });

      if (!pendingItem) {
        return res.status(404).json({ error: 'Pending item not found' });
      }

      // Check ownership
      if (pendingItem.memorial.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'You do not have permission to reject this item' });
      }

      // Update status
      const rejected = await prisma.pendingItem.update({
        where: { id },
        data: { status: 'rejected' },
      });

      return res.status(200).json({ item: rejected });
    } catch (error) {
      console.error('Reject pending item error:', error);
      return res.status(500).json({ error: 'Failed to reject item' });
    }
  }
);

/**
 * GET /api/pending/memorial/:memorialId
 * Get all pending items for a memorial (owner only)
 */
router.get('/memorial/:memorialId', requireAuth, requireMemorialOwner, async (req, res) => {
  try {
    const { memorialId } = req.params;

    const items = await prisma.pendingItem.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ items });
  } catch (error) {
    console.error('Get pending items error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending items' });
  }
});

export default router;
