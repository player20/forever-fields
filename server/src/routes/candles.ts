/**
 * Candles Routes
 * Virtual candle lighting for memorials
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { candleRateLimiter } from '../middleware/security';
import { createCandleSchema } from '../validators/schemas';
import { sendCandleLitNotification } from './push';
import { checkMemorialAccess } from '../utils/permissions';

const router = Router();

/**
 * POST /api/candles
 * Light a candle on a memorial (optional auth, rate limited, privacy checked)
 */
router.post('/', optionalAuth, candleRateLimiter, validate(createCandleSchema), async (req, res) => {
  try {
    const { memorialId, message, name } = req.body;

    // Check access using permissions utility (handles all privacy modes correctly)
    const access = await checkMemorialAccess(
      memorialId,
      req.user?.id || null,
      'viewer'
    );

    if (!access.allowed) {
      return res.status(403).json({ error: access.reason || 'Access denied' });
    }

    // Check if this is the first candle
    const existingCandlesCount = await prisma.candle.count({
      where: { memorialId },
    });

    const isFirstCandle = existingCandlesCount === 0;

    // Create candle
    const candle = await prisma.candle.create({
      data: {
        memorialId,
        message: message || null,
        name: name || 'Anonymous',
      },
    });

    // Send push notification to memorial owner
    sendCandleLitNotification(memorialId, {
      name: name || 'Anonymous',
      message: message || null,
    }).catch((err) => console.error('Failed to send candle notification:', err));

    return res.status(201).json({
      candle,
      isFirstCandle,
      totalCandles: existingCandlesCount + 1,
    });
  } catch (error) {
    console.error('Create candle error:', error);
    return res.status(500).json({ error: 'Failed to light candle' });
  }
});

/**
 * GET /api/candles/:memorialId
 * Get all candles for a memorial
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

    const candles = await prisma.candle.findMany({
      where: { memorialId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to most recent 100
    });

    return res.status(200).json({ candles });
  } catch (error) {
    console.error('Get candles error:', error);
    return res.status(500).json({ error: 'Failed to fetch candles' });
  }
});

export default router;
