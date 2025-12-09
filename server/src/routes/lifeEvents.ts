/**
 * Life Events Routes
 * CRUD operations for memorial timeline events
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/security';
import { validate } from '../middleware/validate';
import { createLifeEventSchema, updateLifeEventSchema } from '../validators/schemas';

const router = Router();

/**
 * GET /api/life-events/:memorialId
 * Get all life events for a memorial
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

    const lifeEvents = await prisma.lifeEvent.findMany({
      where: { memorialId },
      orderBy: { eventOrder: 'asc' },
    });

    return res.status(200).json({ lifeEvents });
  } catch (error) {
    console.error('Get life events error:', error);
    return res.status(500).json({ error: 'Failed to fetch life events' });
  }
});

/**
 * POST /api/life-events/:memorialId
 * Create a new life event (owner only)
 */
router.post(
  '/:memorialId',
  requireAuth,
  apiRateLimiter,
  validate(createLifeEventSchema),
  async (req, res) => {
    try {
      const { memorialId } = req.params;
      const { year, title, description, eventOrder } = req.body;

      if (!year || !title || !description) {
        return res.status(400).json({ error: 'Year, title, and description are required' });
      }

      // Verify user owns the memorial
      const memorial = await prisma.memorial.findUnique({
        where: { id: memorialId },
        select: { ownerId: true },
      });

      if (!memorial) {
        return res.status(404).json({ error: 'Memorial not found' });
      }

      if (memorial.ownerId !== req.user!.id) {
        return res.status(403).json({ error: 'Only memorial owner can add life events' });
      }

      const lifeEvent = await prisma.lifeEvent.create({
        data: {
          memorialId,
          year,
          title,
          description,
          eventOrder: eventOrder || 0,
        },
      });

      return res.status(201).json({ lifeEvent });
    } catch (error) {
      console.error('Create life event error:', error);
      return res.status(500).json({ error: 'Failed to create life event' });
    }
  }
);

/**
 * PUT /api/life-events/:id
 * Update a life event (owner only)
 */
router.put('/:id', requireAuth, apiRateLimiter, validate(updateLifeEventSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { year, title, description, eventOrder } = req.body;

    // Get event and verify ownership
    const event = await prisma.lifeEvent.findUnique({
      where: { id },
      include: { memorial: { select: { ownerId: true } } },
    });

    if (!event) {
      return res.status(404).json({ error: 'Life event not found' });
    }

    if (event.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can update life events' });
    }

    const updateData: any = {};
    if (year !== undefined) updateData.year = year;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (eventOrder !== undefined) updateData.eventOrder = eventOrder;

    const updatedEvent = await prisma.lifeEvent.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({ lifeEvent: updatedEvent });
  } catch (error) {
    console.error('Update life event error:', error);
    return res.status(500).json({ error: 'Failed to update life event' });
  }
});

/**
 * DELETE /api/life-events/:id
 * Delete a life event (owner only)
 */
router.delete('/:id', requireAuth, apiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    // Get event and verify ownership
    const event = await prisma.lifeEvent.findUnique({
      where: { id },
      include: { memorial: { select: { ownerId: true } } },
    });

    if (!event) {
      return res.status(404).json({ error: 'Life event not found' });
    }

    if (event.memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can delete life events' });
    }

    await prisma.lifeEvent.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'Life event deleted successfully' });
  } catch (error) {
    console.error('Delete life event error:', error);
    return res.status(500).json({ error: 'Failed to delete life event' });
  }
});

export default router;
