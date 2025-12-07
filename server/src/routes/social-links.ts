/**
 * Social Links Routes
 * Manages social media links for memorials
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { apiRateLimiter, strictRateLimiter } from '../middleware/security';
import { logger } from '../utils/logger';
import { validateSocialUrl, validateSocialUrls } from '../utils/validators';
import { z } from 'zod';

const router = Router();

// Apply authentication and rate limiting
router.use(requireAuth);
router.use(apiRateLimiter);

// ============================================
// Zod Schema
// ============================================

const socialLinksSchema = z.object({
  facebook: z.string().max(500).optional().nullable(),
  instagram: z.string().max(500).optional().nullable(),
  tiktok: z.string().max(500).optional().nullable(),
});

// ============================================
// GET /api/social-links/:memorialId
// Get social links for a memorial
// ============================================

router.get('/:memorialId', async (req: Request, res: Response) => {
  try {
    const { memorialId } = req.params;

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        id: true,
        privacy: true,
        ownerId: true,
        socialLinks: true,
      },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Check privacy (public or user is owner)
    if (memorial.privacy === 'private' && memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.status(200).json({
      memorialId: memorial.id,
      socialLinks: memorial.socialLinks || { facebook: null, instagram: null, tiktok: null },
    });
  } catch (error) {
    logger.error('Failed to fetch social links', error, {
      memorialId: req.params.memorialId,
      userId: req.user?.id,
      context: 'social_links_get'
    });
    return res.status(500).json({ error: 'Failed to fetch social links' });
  }
});

// ============================================
// PUT /api/social-links/:memorialId
// Update social links for a memorial
// ============================================

router.put('/:memorialId', strictRateLimiter, async (req: Request, res: Response) => {
  try {
    const { memorialId } = req.params;
    const data = socialLinksSchema.parse(req.body);

    // Verify memorial ownership
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    if (memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can update social links' });
    }

    // Validate and sanitize URLs using centralized validator
    let validatedData: { facebook: string | null; instagram: string | null; tiktok: string | null };

    try {
      validatedData = validateSocialUrls({
        facebook: data.facebook ?? null,
        instagram: data.instagram ?? null,
        tiktok: data.tiktok ?? null,
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Invalid URL format',
      });
    }

    // Upsert social links
    const socialLinks = await prisma.socialLink.upsert({
      where: { memorialId },
      create: {
        memorialId,
        ...validatedData,
      },
      update: validatedData,
    });

    logger.info('Social links updated successfully', {
      memorialId,
      userId: req.user!.id,
      platforms: Object.keys(validatedData).filter(k => validatedData[k as keyof typeof validatedData])
    });

    return res.status(200).json({
      memorialId,
      socialLinks,
      message: 'Social links updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid social links data',
        details: error.errors,
      });
    }

    logger.error('Failed to update social links', error, {
      memorialId: req.params.memorialId,
      userId: req.user?.id,
      context: 'social_links_update'
    });
    return res.status(500).json({ error: 'Failed to update social links' });
  }
});

// ============================================
// DELETE /api/social-links/:memorialId
// Remove all social links for a memorial
// ============================================

router.delete('/:memorialId', strictRateLimiter, async (req: Request, res: Response) => {
  try {
    const { memorialId } = req.params;

    // Verify memorial ownership
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    if (memorial.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only memorial owner can remove social links' });
    }

    // Delete social links
    await prisma.socialLink.delete({
      where: { memorialId },
    }).catch(() => {
      // Ignore if doesn't exist
    });

    logger.info('Social links deleted successfully', {
      memorialId,
      userId: req.user!.id
    });

    return res.status(200).json({
      message: 'Social links removed successfully',
    });
  } catch (error) {
    logger.error('Failed to delete social links', error, {
      memorialId: req.params.memorialId,
      userId: req.user?.id,
      context: 'social_links_delete'
    });
    return res.status(500).json({ error: 'Failed to remove social links' });
  }
});

export default router;
