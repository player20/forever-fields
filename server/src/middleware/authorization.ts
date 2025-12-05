/**
 * Authorization Middleware
 * Role-based access control for memorials
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * Require memorial ownership
 * User must be the owner of the memorial
 */
export const requireMemorialOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const memorialId = req.params.id || req.body.memorialId;

    if (!memorialId) {
      return res.status(400).json({ error: 'Memorial ID required' });
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    if (memorial.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to modify this memorial' });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Require memorial editor role
 * User must be owner OR have editor invitation
 */
export const requireMemorialEditor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const memorialId = req.params.id || req.body.memorialId;

    if (!memorialId) {
      return res.status(400).json({ error: 'Memorial ID required' });
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Check if user is owner
    if (memorial.ownerId === req.user.id) {
      return next();
    }

    // Check if user has editor invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        memorialId,
        email: req.user.email,
        role: 'editor',
        expiresAt: { gt: new Date() },
        usedAt: { not: null }, // Invitation must be accepted
      },
    });

    if (!invitation) {
      return res.status(403).json({ error: 'You do not have editor access to this memorial' });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

/**
 * Require memorial viewer role
 * User must be owner OR have editor/viewer invitation
 */
export const requireMemorialViewer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const memorialId = req.params.id || req.body.memorialId;

    if (!memorialId) {
      return res.status(400).json({ error: 'Memorial ID required' });
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      return res.status(404).json({ error: 'Memorial not found' });
    }

    // Check if user is owner
    if (memorial.ownerId === req.user.id) {
      return next();
    }

    // Check if user has any invitation (editor or viewer)
    const invitation = await prisma.invitation.findFirst({
      where: {
        memorialId,
        email: req.user.email,
        expiresAt: { gt: new Date() },
        usedAt: { not: null },
      },
    });

    if (!invitation) {
      return res.status(403).json({ error: 'You do not have access to this memorial' });
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};
