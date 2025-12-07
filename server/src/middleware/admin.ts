/**
 * Admin Authentication Middleware
 * Verifies user has admin role and logs all admin actions
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// Extend Express Request type to include admin flag
declare global {
  namespace Express {
    interface Request {
      isAdmin?: boolean;
    }
  }
}

/**
 * Require admin role
 * Must be used AFTER requireAuth middleware
 * Verifies user has isAdmin flag set to true
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      console.warn(`[ADMIN] Unauthorized admin access attempt by user ${req.user.id}`);
      return res.status(403).json({
        error: 'Admin access denied',
        message: 'This area is restricted to administrators only',
      });
    }

    // Set admin flag on request for easy checking in routes
    req.isAdmin = true;
    next();
  } catch (error) {
    console.error('[ADMIN] Admin middleware error:', error);
    return res.status(500).json({ error: 'Failed to verify admin access' });
  }
};

/**
 * Log admin action to audit log
 * Helper function to be called in admin routes
 */
export const logAdminAction = async (
  adminId: string,
  action: string,
  options: {
    targetType?: string;
    targetId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  } = {}
) => {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType: options.targetType || null,
        targetId: options.targetId || null,
        metadata: options.metadata || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails, but log the error
    console.error('[ADMIN] Failed to log admin action:', error);
  }
};

/**
 * Audit logging middleware
 * Automatically logs all admin actions for POST/PUT/DELETE requests
 */
export const auditAdminAction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only log destructive actions (not GET requests)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      if (req.user && req.isAdmin) {
        const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Log after response is sent (don't block the request)
        res.on('finish', async () => {
          // Only log successful requests
          if (res.statusCode >= 200 && res.statusCode < 300) {
            await logAdminAction(req.user!.id, action, {
              targetType: req.params.id ? 'resource' : undefined,
              targetId: req.params.id || undefined,
              metadata: {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
              },
              ipAddress,
              userAgent,
            });
          }
        });
      }
    }

    next();
  };
};
