/**
 * User Routes
 * Endpoints for user profile and account management
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/user/me
 * Get current authenticated user's profile
 * Used by frontend to verify authentication status
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    // req.user is attached by requireAuth middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get full user profile from database
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('[USER] Error fetching user profile:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

/**
 * PATCH /api/user/profile
 * Update current user's profile
 */
router.patch('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[USER] Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
