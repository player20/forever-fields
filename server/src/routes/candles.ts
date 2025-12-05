/**
 * Candles Routes
 * Virtual candle lighting for memorials
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { validate } from '../middleware/validate';
import { candleRateLimiter } from '../middleware/security';
import { createCandleSchema } from '../validators/schemas';
import { sendCandleLitNotification } from './push';

const router = Router();

/**
 * POST /api/candles
 * Light a candle on a memorial (no auth required, but rate limited)
 */
router.post('/', candleRateLimiter, validate(createCandleSchema), async (req, res) => {
  try {
    const { memorialId, message, name } = req.body;

    // Verify memorial exists and is accessible
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { privacy: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Only allow candles on public or link-accessible memorials
    if (memorial.privacy === 'private') {
      return res.status(403).json({ error: 'Cannot light candles on private memorials' });
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
router.get('/:memorialId', async (req, res) => {
  try {
    const { memorialId } = req.params;

    // Verify memorial exists
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { privacy: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    if (memorial.privacy === 'private') {
      return res.status(403).json({ error: 'Cannot view candles on private memorials' });
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
