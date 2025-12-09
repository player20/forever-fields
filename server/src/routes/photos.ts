/**
 * Photos Routes
 * CRUD operations for memorial photos
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/security';
import { validate } from '../middleware/validate';
import { createPhotoSchema, updatePhotoSchema } from '../validators/schemas';

const router = Router();

/**
 * GET /api/photos/:memorialId
 * Get all photos for a memorial
 */
router.get('/:memorialId', optionalAuth, apiRateLimiter, async (req, res) => {
  try {
    const { memorialId } = req.params;

    // Verify memorial exists and user has access
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { privacy: true, ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Check privacy permissions
    if (memorial.privacy === 'private' && (!req.user || memorial.ownerId !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const photos = await prisma.photo.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ photos });
  } catch (error) {
    console.error('Get photos error:', error);
    return res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

/**
 * POST /api/photos/:memorialId
 * Add a new photo (owner only)
 * Note: This expects the photo URL to be provided (after upload to cloud storage)
 */
router.post('/:memorialId', requireAuth, apiRateLimiter, validate(createPhotoSchema), async (req, res) => {
  try {
    const { memorialId } = req.params;
    const { url, publicId, caption, uploadedBy } = req.body;

    // Verify user owns the memorial
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    if (memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can add photos' });
    }

    const photo = await prisma.photo.create({
      data: {
        memorialId,
        url,
        publicId: publicId || null,
        caption: caption || null,
        uploadedBy: uploadedBy || 'Anonymous',
      },
    });

    return res.status(201).json({ photo });
  } catch (error) {
    console.error('Create photo error:', error);
    return res.status(500).json({ error: 'Failed to add photo' });
  }
});

/**
 * PUT /api/photos/:id
 * Update photo caption (owner only)
 */
router.put('/:id', requireAuth, apiRateLimiter, validate(updatePhotoSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;

    // Get photo and verify ownership
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: { memorial: { select: { ownerId: true } } },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can update photos' });
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: { caption },
    });

    return res.status(200).json({ photo: updatedPhoto });
  } catch (error) {
    console.error('Update photo error:', error);
    return res.status(500).json({ error: 'Failed to update photo' });
  }
});

/**
 * DELETE /api/photos/:id
 * Delete a photo (owner only)
 */
router.delete('/:id', requireAuth, apiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    // Get photo and verify ownership
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: { memorial: { select: { ownerId: true } } },
    });

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    if (photo.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can delete photos' });
    }

    await prisma.photo.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Delete photo error:', error);
    return res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
