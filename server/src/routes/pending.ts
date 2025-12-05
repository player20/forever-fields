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

      // Create actual resource based on type
      let createdResource = null;
      const data = pendingItem.dataJson as any;

      switch (pendingItem.type) {
        case 'photo':
          // Create Photo record from Cloudinary upload
          createdResource = await prisma.photo.create({
            data: {
              memorialId: pendingItem.memorialId,
              url: data.url || data.cloudinaryUrl,
              publicId: data.publicId,
              caption: data.caption || null,
              uploadedBy: data.uploadedBy || 'Anonymous',
              createdAt: pendingItem.createdAt,
            },
          });
          break;

        case 'memory':
          // Create Memory/Story record
          createdResource = await prisma.memory.create({
            data: {
              memorialId: pendingItem.memorialId,
              title: data.title || 'Untitled Memory',
              content: data.content || data.text,
              authorName: data.authorName || data.name || 'Anonymous',
              authorRelationship: data.authorRelationship || null,
              createdAt: pendingItem.createdAt,
            },
          });
          break;

        case 'guestbook':
          // Create Guestbook Entry record
          createdResource = await prisma.guestbookEntry.create({
            data: {
              memorialId: pendingItem.memorialId,
              name: data.name || 'Anonymous',
              message: data.message,
              relationship: data.relationship || null,
              createdAt: pendingItem.createdAt,
            },
          });
          break;

        case 'voice_note':
          // Create Voice Note record
          createdResource = await prisma.voiceNote.create({
            data: {
              memorialId: pendingItem.memorialId,
              url: data.url || data.audioUrl,
              publicId: data.publicId,
              duration: data.duration || 0,
              authorName: data.authorName || 'Anonymous',
              createdAt: pendingItem.createdAt,
            },
          });
          break;

        case 'time_capsule':
          // Time capsules stay in pending queue until unlock date
          // No additional resource creation needed
          break;

        default:
          console.warn(`Unknown pending item type: ${pendingItem.type}`);
      }

      // Delete pending item after creating resource (cleanup)
      if (createdResource) {
        await prisma.pendingItem.delete({ where: { id } });
      }

      return res.status(200).json({
        item: approved,
        resource: createdResource,
        message: 'Item approved and published successfully'
      });
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
