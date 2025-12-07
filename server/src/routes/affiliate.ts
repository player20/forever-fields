/**
 * Affiliate Routes
 * Handles affiliate partnerships (flower delivery, etc.)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { apiRateLimiter } from '../middleware/security';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Apply rate limiting to all affiliate routes
router.use(apiRateLimiter);

// ============================================
// GET /api/affiliate/flowers
// Generate affiliate flower delivery link
// ============================================

const flowersQuerySchema = z.object({
  memorialId: z.string().uuid(),
});

router.get('/flowers', async (req: Request, res: Response) => {
  try {
    const { memorialId } = flowersQuerySchema.parse(req.query);

    // Get memorial details
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        deceasedName: true,
        isPet: true,
        restingType: true,
        restingLocation: true,
      },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Build BloomNation affiliate URL
    const affiliateId = process.env.BLOOMNATION_AFFILIATE_ID || 'foreverfields';
    const baseUrl = 'https://www.bloomnation.com';

    // Build query parameters (sanitized)
    const params = new URLSearchParams();
    params.set('ref', affiliateId);
    params.set('memorial_id', memorialId);

    // Add deceased name (sanitized)
    const sanitizedName = memorial.deceasedName.replace(/[^\w\s-]/g, '').substring(0, 50);
    params.set('recipient_name', sanitizedName);

    // Auto-fill address if resting location is cemetery
    if (memorial.restingType === 'cemetery' && memorial.restingLocation) {
      try {
        const location = memorial.restingLocation as any;
        if (location.address) {
          // Sanitize address components
          const sanitizedAddress = String(location.address).replace(/[^\w\s,.-]/g, '').substring(0, 100);
          params.set('delivery_address', sanitizedAddress);
        }
        if (location.city) {
          const sanitizedCity = String(location.city).replace(/[^\w\s-]/g, '').substring(0, 50);
          params.set('delivery_city', sanitizedCity);
        }
        if (location.state) {
          const sanitizedState = String(location.state).replace(/[^\w]/g, '').substring(0, 2);
          params.set('delivery_state', sanitizedState);
        }
        if (location.zipCode) {
          const sanitizedZip = String(location.zipCode).replace(/[^\d-]/g, '').substring(0, 10);
          params.set('delivery_zip', sanitizedZip);
        }
      } catch (error) {
        logger.error('Failed to parse resting location for affiliate link', error, {
          memorialId,
          context: 'affiliate_flowers'
        });
        // Continue without address auto-fill
      }
    }

    // Add pet flag for appropriate arrangements
    if (memorial.isPet) {
      params.set('pet_memorial', 'true');
    }

    // Construct final URL
    const affiliateUrl = `${baseUrl}?${params.toString()}`;

    // Return sanitized URL
    return res.status(200).json({
      url: affiliateUrl,
      memorialId,
      deceasedName: memorial.deceasedName,
      isPet: memorial.isPet,
      hasAddress: !!(memorial.restingType === 'cemetery' && memorial.restingLocation),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid memorial ID', details: error.errors });
    }

    logger.error('Flower link generation failed', error, {
      memorialId: req.query.memorialId,
      context: 'affiliate_flowers'
    });
    return res.status(500).json({ error: 'Failed to generate flower delivery link' });
  }
});

// ============================================
// GET /api/affiliate/flowers/redirect
// Direct redirect to BloomNation (for click tracking)
// ============================================

router.get('/flowers/redirect', async (req: Request, res: Response) => {
  try {
    const { memorialId } = flowersQuerySchema.parse(req.query);

    // Get affiliate URL
    const affiliateData = await fetch(`${req.protocol}://${req.get('host')}/api/affiliate/flowers?memorialId=${memorialId}`)
      .then(r => r.json());

    if (affiliateData.url) {
      // Redirect to BloomNation
      return res.redirect(302, affiliateData.url);
    }

    return res.status(404).json({ error: 'Memorial not found' });
  } catch (error) {
    logger.error('Affiliate redirect failed', error, {
      memorialId: req.query.memorialId,
      context: 'affiliate_redirect'
    });
    return res.status(500).json({ error: 'Failed to redirect to flower delivery' });
  }
});

export default router;
