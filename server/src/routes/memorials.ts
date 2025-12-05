/**
 * Memorial Routes
 * CRUD operations for memorials with role-based access control
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { requireMemorialOwner } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { apiRateLimiter } from '../middleware/security';
import {
  createMemorialSchema,
  updateMemorialSchema,
  memorialIdSchema,
} from '../validators/schemas';

const router = Router();

/**
 * GET /api/memorials/mine
 * Get all memorials owned by the authenticated user
 */
router.get('/mine', requireAuth, apiRateLimiter, async (req, res) => {
  try {
    const memorials = await prisma.memorial.findMany({
      where: { ownerId: req.user!.id },
      include: {
        candles: {
          select: { id: true },
        },
        timeCapsules: {
          select: { id: true },
        },
        _count: {
          select: {
            candles: true,
            timeCapsules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ memorials });
  } catch (error) {
    console.error('Get memorials error:', error);
    return res.status(500).json({ error: 'Failed to fetch memorials' });
  }
});

/**
 * POST /api/memorials
 * Create a new memorial
 */
router.post(
  '/',
  requireAuth,
  apiRateLimiter,
  validate(createMemorialSchema),
  async (req, res) => {
    try {
      const {
        deceasedName,
        birthDate,
        deathDate,
        gotchaDate,
        portraitUrl,
        shortBio,
        isPet,
        privacy,
        songSpotifyUri,
        songYoutubeUrl,
        restingType,
        restingLocation,
      } = req.body;

      // Generate lowercase name for duplicate detection
      const deceasedNameLower = deceasedName.toLowerCase();

      // Check for duplicates
      const existingMemorial = await prisma.memorial.findFirst({
        where: {
          ownerId: req.user!.id,
          deceasedNameLower,
          OR: [
            { birthDate: birthDate ? new Date(birthDate) : null },
            { deathDate: deathDate ? new Date(deathDate) : null },
          ],
        },
      });

      if (existingMemorial) {
        return res.status(409).json({
          error: 'A memorial with this name and date already exists',
        });
      }

      // Create memorial
      const memorial = await prisma.memorial.create({
        data: {
          ownerId: req.user!.id,
          deceasedName,
          deceasedNameLower,
          birthDate: birthDate ? new Date(birthDate) : null,
          deathDate: deathDate ? new Date(deathDate) : null,
          gotchaDate: gotchaDate ? new Date(gotchaDate) : null,
          portraitUrl: portraitUrl || null,
          shortBio: shortBio || null,
          isPet: isPet || false,
          privacy: privacy || 'private',
          songSpotifyUri: songSpotifyUri || null,
          songYoutubeUrl: songYoutubeUrl || null,
          restingType: restingType || null,
          restingLocation: restingLocation || null,
        },
      });

      return res.status(201).json({ memorial });
    } catch (error) {
      console.error('Create memorial error:', error);
      return res.status(500).json({ error: 'Failed to create memorial' });
    }
  }
);

/**
 * GET /api/memorials/:id
 * Get a single memorial (public or authenticated)
 */
router.get(
  '/:id',
  optionalAuth,
  validate(memorialIdSchema, 'params'),
  async (req, res) => {
    try {
      const { id } = req.params;

      const memorial = await prisma.memorial.findUnique({
        where: { id },
        include: {
          candles: {
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to most recent 50 candles
          },
          timeCapsules: {
            where: {
              unlockDate: { lte: new Date() }, // Only show unlocked capsules
            },
            orderBy: { unlockDate: 'desc' },
          },
          socialLinks: true,
          qrCode: true,
          _count: {
            select: {
              candles: true,
              timeCapsules: true,
            },
          },
        },
      });

      if (!memorial) {
        return res.status(404).json({ error: 'Memorial not found' });
      }

      // Check privacy settings
      if (memorial.privacy === 'private') {
        // Private: only owner + invited users can view
        if (!req.user) {
          return res.status(403).json({ error: 'This memorial is private' });
        }

        // Check if user is owner
        if (memorial.ownerId === req.user.id) {
          return res.status(200).json({ memorial });
        }

        // Check if user has invitation
        const invitation = await prisma.invitation.findFirst({
          where: {
            memorialId: id,
            email: req.user.email,
            expiresAt: { gt: new Date() },
            usedAt: { not: null },
          },
        });

        if (!invitation) {
          return res.status(403).json({ error: 'You do not have access to this memorial' });
        }
      } else if (memorial.privacy === 'link') {
        // Link-only: anyone with the link can view (no auth required)
        // Continue to return memorial
      } else if (memorial.privacy === 'public') {
        // Public: anyone can view
        // Continue to return memorial
      }

      return res.status(200).json({ memorial });
    } catch (error) {
      console.error('Get memorial error:', error);
      return res.status(500).json({ error: 'Failed to fetch memorial' });
    }
  }
);

/**
 * PUT /api/memorials/:id
 * Update a memorial (owner only)
 */
router.put(
  '/:id',
  requireAuth,
  requireMemorialOwner,
  apiRateLimiter,
  validate(memorialIdSchema, 'params'),
  validate(updateMemorialSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData: any = {};

      // Only include fields that are present in request
      if (req.body.deceasedName !== undefined) {
        updateData.deceasedName = req.body.deceasedName;
        updateData.deceasedNameLower = req.body.deceasedName.toLowerCase();
      }
      if (req.body.birthDate !== undefined) {
        updateData.birthDate = req.body.birthDate ? new Date(req.body.birthDate) : null;
      }
      if (req.body.deathDate !== undefined) {
        updateData.deathDate = req.body.deathDate ? new Date(req.body.deathDate) : null;
      }
      if (req.body.gotchaDate !== undefined) {
        updateData.gotchaDate = req.body.gotchaDate ? new Date(req.body.gotchaDate) : null;
      }
      if (req.body.portraitUrl !== undefined) updateData.portraitUrl = req.body.portraitUrl;
      if (req.body.shortBio !== undefined) updateData.shortBio = req.body.shortBio;
      if (req.body.isPet !== undefined) updateData.isPet = req.body.isPet;
      if (req.body.privacy !== undefined) updateData.privacy = req.body.privacy;
      if (req.body.songSpotifyUri !== undefined) updateData.songSpotifyUri = req.body.songSpotifyUri;
      if (req.body.songYoutubeUrl !== undefined) updateData.songYoutubeUrl = req.body.songYoutubeUrl;
      if (req.body.restingType !== undefined) updateData.restingType = req.body.restingType;
      if (req.body.restingLocation !== undefined) updateData.restingLocation = req.body.restingLocation;

      const memorial = await prisma.memorial.update({
        where: { id },
        data: updateData,
      });

      return res.status(200).json({ memorial });
    } catch (error) {
      console.error('Update memorial error:', error);
      return res.status(500).json({ error: 'Failed to update memorial' });
    }
  }
);

/**
 * DELETE /api/memorials/:id
 * Delete a memorial (owner only)
 */
router.delete(
  '/:id',
  requireAuth,
  requireMemorialOwner,
  apiRateLimiter,
  validate(memorialIdSchema, 'params'),
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.memorial.delete({
        where: { id },
      });

      return res.status(200).json({ message: 'Memorial deleted successfully' });
    } catch (error) {
      console.error('Delete memorial error:', error);
      return res.status(500).json({ error: 'Failed to delete memorial' });
    }
  }
);

export default router;
