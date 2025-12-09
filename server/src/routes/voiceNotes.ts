/**
 * Voice Notes Routes
 * Allow visitors to share voice recordings
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import { createVoiceNoteSchema } from '../validators/schemas';
import { checkMemorialAccess } from '../utils/permissions';

const router = Router();

/**
 * POST /api/voice-notes
 * Submit a voice note (goes to pending queue for approval)
 */
router.post(
  '/',
  optionalAuth,
  apiRateLimiter,
  validate(createVoiceNoteSchema),
  async (req, res) => {
    try {
      const { memorialId, url, publicId, duration, authorName } = req.body;

      // Check access using permissions utility
      const access = await checkMemorialAccess(
        memorialId,
        req.user?.id || null,
        'viewer'
      );

      if (!access.allowed) {
        return res.status(403).json({ error: access.reason || 'Access denied' });
      }

      // Create pending item for voice note
      const pendingItem = await prisma.pendingItem.create({
        data: {
          memorialId,
          type: 'voice_note',
          status: 'pending',
          dataJson: {
            url,
            publicId: publicId || null,
            duration: duration || 0,
            authorName: authorName || 'Anonymous',
            submittedAt: new Date().toISOString(),
          },
        },
      });

      return res.status(201).json({
        pendingItem,
        message: 'Your voice note has been submitted for approval. It will appear on the memorial after review.',
      });
    } catch (error) {
      console.error('Create voice note error:', error);
      return res.status(500).json({ error: 'Failed to submit voice note' });
    }
  }
);

/**
 * GET /api/voice-notes/:memorialId
 * Get all approved voice notes for a memorial
 */
router.get('/:memorialId', optionalAuth, apiRateLimiter, async (req, res) => {
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

    // Get approved voice notes from the VoiceNote table
    const voiceNotes = await prisma.voiceNote.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ voiceNotes });
  } catch (error) {
    console.error('Get voice notes error:', error);
    return res.status(500).json({ error: 'Failed to fetch voice notes' });
  }
});

export default router;
