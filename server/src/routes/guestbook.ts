/**
 * Guestbook Routes
 * Allow visitors to leave condolence messages on memorials
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { createGuestbookEntrySchema } from '../validators/schemas';
import { checkMemorialAccess } from '../utils/permissions';

const router = Router();

/**
 * POST /api/guestbook
 * Submit a guestbook entry (goes to pending queue for approval)
 */
router.post(
  '/',
  optionalAuth,
  apiRateLimiter,
  validate(createGuestbookEntrySchema),
  async (req, res) => {
    try {
      const { memorialId, name, message, relationship } = req.body;

      // Check access using permissions utility
      const access = await checkMemorialAccess(
        memorialId,
        req.user?.id || null,
        'viewer'
      );

      if (!access.allowed) {
        return res.status(403).json({ error: access.reason || 'Access denied' });
      }

      // Create pending item for guestbook entry
      const pendingItem = await prisma.pendingItem.create({
        data: {
          memorialId,
          type: 'guestbook',
          status: 'pending',
          dataJson: {
            name: name || 'Anonymous',
            message,
            relationship: relationship || null,
            submittedAt: new Date().toISOString(),
          },
        },
      });

      return res.status(201).json({
        pendingItem,
        message: 'Your message has been submitted for approval. It will appear on the memorial after review.',
      });
    } catch (error) {
      console.error('Create guestbook entry error:', error);
      return res.status(500).json({ error: 'Failed to submit guestbook entry' });
    }
  }
);

/**
 * GET /api/guestbook/:memorialId
 * Get all approved guestbook entries for a memorial
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

    // Get approved guestbook entries from the GuestbookEntry table
    const entries = await prisma.guestbookEntry.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ entries });
  } catch (error) {
    console.error('Get guestbook entries error:', error);
    return res.status(500).json({ error: 'Failed to fetch guestbook entries' });
  }
});

export default router;
