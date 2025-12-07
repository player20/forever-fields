/**
 * User Profile Routes
 * Endpoints for user account management
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/security';

const router = Router();

// All user routes require authentication
router.use(requireAuth);
router.use(apiRateLimiter);

// ============================================
// GET /api/user/me
// Get current user profile
// ============================================

router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        subscriptionTier: true,
        termsAcceptedAt: true,
        termsVersion: true,
        createdAt: true,
        _count: {
          select: {
            memorials: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      subscriptionTier: user.subscriptionTier,
      termsAccepted: user.termsAcceptedAt ? true : false,
      termsVersion: user.termsVersion,
      memorialCount: user._count.memorials,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[USER] Get profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ============================================
// PUT /api/user/me
// Update current user profile
// ============================================

router.put('/me', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    // Validate input
    if (name && typeof name !== 'string') {
      return res.status(400).json({ error: 'Invalid name format' });
    }

    if (name && name.length > 100) {
      return res.status(400).json({ error: 'Name too long (max 100 characters)' });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin,
      subscriptionTier: user.subscriptionTier,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[USER] Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
