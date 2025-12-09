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
import { asyncHandler, createError, logError } from '../middleware/error-handler';
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
router.get('/mine', requireAuth, apiRateLimiter, asyncHandler(async (req, res) => {
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

  res.status(200).json({ memorials });
}));

/**
 * POST /api/memorials
 * Create a new memorial
 */
router.post(
  '/',
  requireAuth,
  apiRateLimiter,
  validate(createMemorialSchema),
  asyncHandler(async (req, res) => {
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
      throw createError.conflict('A memorial with this name and date already exists');
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

    res.status(201).json({ memorial });
  })
);

/**
 * GET /api/memorials/:id
 * Get a single memorial (public or authenticated)
 */
router.get(
  '/:id',
  optionalAuth,
  validate(memorialIdSchema, 'params'),
  asyncHandler(async (req, res) => {
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
        photos: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit to most recent 50 photos
        },
        lifeEvents: {
          orderBy: { eventOrder: 'asc' },
        },
        recipes: {
          orderBy: { createdAt: 'desc' },
        },
        memories: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        voiceNotes: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            candles: true,
            timeCapsules: true,
            photos: true,
            lifeEvents: true,
            recipes: true,
            memories: true,
            voiceNotes: true,
          },
        },
      },
    });

    if (!memorial) {
      throw createError.notFound('Memorial not found');
    }

    // Check privacy settings
    if (memorial.privacy === 'private') {
      // Private: only owner + invited users can view
      if (!req.user) {
        throw createError.forbidden('This memorial is private');
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
        throw createError.forbidden('You do not have access to this memorial');
      }
    } else if (memorial.privacy === 'link') {
      // Link-only: anyone with the link can view (no auth required)
      // Continue to return memorial
    } else if (memorial.privacy === 'public') {
      // Public: anyone can view
      // Continue to return memorial
    }

    res.status(200).json({ memorial });
  })
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
  asyncHandler(async (req, res) => {
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

    res.status(200).json({ memorial });
  })
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
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.memorial.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Memorial deleted successfully' });
  })
);

/**
 * POST /api/memorials/check-duplicate
 * Check for potential duplicate memorials
 * Returns soft warning if similar memorial exists
 */
router.post('/check-duplicate', requireAuth, apiRateLimiter, asyncHandler(async (req, res) => {
  const { deceasedName, birthDate, deathDate } = req.body;

  if (!deceasedName) {
    throw createError.badRequest('Name is required');
  }

  const deceasedNameLower = deceasedName.toLowerCase();

  // Find potential duplicates
  const potentialDuplicates = await prisma.memorial.findMany({
    where: {
      deceasedNameLower,
      OR: [
        { birthDate: birthDate ? new Date(birthDate) : null },
        { deathDate: deathDate ? new Date(deathDate) : null },
      ],
    },
    select: {
      id: true,
      deceasedName: true,
      birthDate: true,
      deathDate: true,
      privacy: true,
      ownerId: true,
      owner: {
        select: {
          email: true,
        },
      },
    },
  });

  if (potentialDuplicates.length === 0) {
    return res.status(200).json({ hasDuplicates: false });
  }

  // Check if any duplicates are owned by current user
  const userDuplicates = potentialDuplicates.filter(d => d.ownerId === req.user!.id);

  res.status(200).json({
    hasDuplicates: true,
    duplicates: potentialDuplicates.map(d => ({
      id: d.id,
      name: d.deceasedName,
      birthDate: d.birthDate?.toISOString().split('T')[0],
      deathDate: d.deathDate?.toISOString().split('T')[0],
      isYours: d.ownerId === req.user!.id,
      ownerEmail: d.ownerId === req.user!.id ? d.owner.email : null,
    })),
    message: userDuplicates.length > 0
      ? 'You already have a memorial for this person. Would you like to edit it instead?'
      : 'A memorial for this person may already exist. You can still create a new one if this is a different person.',
  });
}));

export default router;
