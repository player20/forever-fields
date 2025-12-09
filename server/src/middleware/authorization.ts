/**
 * Authorization Middleware
 * Role-based access control for memorials
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { createError, logError } from './error-handler';

/**
 * Require memorial ownership
 * User must be the owner of the memorial
 */
export const requireMemorialOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError.unauthorized('Authentication required');
    }

    // Check multiple possible locations for memorial ID (flexible for different route patterns)
    const memorialId = req.params.id || req.params.memorialId || req.body.memorialId;

    if (!memorialId) {
      throw createError.badRequest('Memorial ID required');
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      throw createError.notFound('Memorial not found');
    }

    if (memorial.ownerId !== req.user.id) {
      throw createError.forbidden('You do not have permission to modify this memorial');
    }

    next();
  } catch (error) {
    logError('Authorization check', error, { memorialId: req.params.id || req.params.memorialId });
    next(error);
  }
};

/**
 * Require memorial editor role
 * User must be owner OR have editor invitation
 */
export const requireMemorialEditor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError.unauthorized('Authentication required');
    }

    // Check multiple possible locations for memorial ID
    const memorialId = req.params.id || req.params.memorialId || req.body.memorialId;

    if (!memorialId) {
      throw createError.badRequest('Memorial ID required');
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      throw createError.notFound('Memorial not found');
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
      throw createError.forbidden('You do not have editor access to this memorial');
    }

    next();
  } catch (error) {
    logError('Authorization check - editor', error, { memorialId: req.params.id || req.params.memorialId });
    next(error);
  }
};

/**
 * Require memorial viewer role
 * User must be owner OR have editor/viewer invitation
 */
export const requireMemorialViewer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw createError.unauthorized('Authentication required');
    }

    // Check multiple possible locations for memorial ID
    const memorialId = req.params.id || req.params.memorialId || req.body.memorialId;

    if (!memorialId) {
      throw createError.badRequest('Memorial ID required');
    }

    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    if (!memorial) {
      throw createError.notFound('Memorial not found');
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
      throw createError.forbidden('You do not have access to this memorial');
    }

    next();
  } catch (error) {
    logError('Authorization check - viewer', error, { memorialId: req.params.id || req.params.memorialId });
    next(error);
  }
};
