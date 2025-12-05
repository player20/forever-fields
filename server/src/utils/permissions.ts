/**
 * Forever Fields - Permissions Utility
 * Centralized permission and privacy validation
 */

import { prisma } from '../config/database';

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user has access to memorial based on privacy and invitations
 * @param memorialId - Memorial ID to check access for
 * @param userId - User ID making the request (null for unauthenticated)
 * @param requiredRole - Minimum role required: 'owner', 'editor', or 'viewer'
 * @returns Access check result with allowed boolean and optional reason
 */
export async function checkMemorialAccess(
  memorialId: string,
  userId: string | null,
  requiredRole: 'owner' | 'editor' | 'viewer' = 'viewer'
): Promise<AccessCheckResult> {
  try {
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: {
        privacy: true,
        ownerId: true,
        invitations: {
          where: {
            usedAt: { not: null },
            expiresAt: { gt: new Date() },
          },
        },
      },
    });

    if (!memorial) {
      return { allowed: false, reason: 'Memorial not found' };
    }

    // Owner always has access
    if (userId && memorial.ownerId === userId) {
      return { allowed: true };
    }

    // Check role hierarchy for non-owners
    if (requiredRole === 'owner') {
      return { allowed: false, reason: 'Only memorial owner can perform this action' };
    }

    // Private memorials require authentication and invitation
    if (memorial.privacy === 'private') {
      if (!userId) {
        return { allowed: false, reason: 'Private memorial requires authentication' };
      }

      const invitation = memorial.invitations.find(inv =>
        (inv as any).email === userId || (inv as any).inviteeEmail === userId
      );

      if (!invitation) {
        return { allowed: false, reason: 'No valid invitation found' };
      }

      // Check role permission
      const roleHierarchy: Record<string, number> = { owner: 3, editor: 2, viewer: 1 };
      const userRole = (invitation as any).role || 'viewer';
      if ((roleHierarchy[userRole] || 0) < (roleHierarchy[requiredRole] || 0)) {
        return { allowed: false, reason: 'Insufficient permissions' };
      }

      return { allowed: true };
    }

    // Link-accessible memorials allow anyone with the link (no auth required)
    if (memorial.privacy === 'link') {
      // For view-only access, allow anyone
      if (requiredRole === 'viewer') {
        return { allowed: true };
      }

      // For editor actions, require auth and invitation
      if (!userId) {
        return { allowed: false, reason: 'Authentication required for this action' };
      }

      const invitation = memorial.invitations.find(inv =>
        (inv as any).email === userId || (inv as any).inviteeEmail === userId
      );

      if (!invitation) {
        return { allowed: false, reason: 'Editor/owner permissions required' };
      }

      return { allowed: true };
    }

    // Public memorials allow all viewers
    if (memorial.privacy === 'public') {
      // For view-only access, allow anyone
      if (requiredRole === 'viewer') {
        return { allowed: true };
      }

      // For editor actions, require auth and invitation
      if (!userId) {
        return { allowed: false, reason: 'Authentication required for this action' };
      }

      const invitation = memorial.invitations.find(inv =>
        (inv as any).email === userId || (inv as any).inviteeEmail === userId
      );

      if (!invitation) {
        return { allowed: false, reason: 'Editor/owner permissions required' };
      }

      return { allowed: true };
    }

    // Fallback: deny by default
    return { allowed: false, reason: 'Access denied' };
  } catch (error) {
    console.error('Error checking memorial access:', error);
    return { allowed: false, reason: 'Error checking permissions' };
  }
}

/**
 * Check if user is owner of memorial
 * @param memorialId - Memorial ID
 * @param userId - User ID
 * @returns True if user is owner
 */
export async function isMemorialOwner(
  memorialId: string,
  userId: string
): Promise<boolean> {
  try {
    const memorial = await prisma.memorial.findUnique({
      where: { id: memorialId },
      select: { ownerId: true },
    });

    return memorial?.ownerId === userId;
  } catch (error) {
    console.error('Error checking memorial ownership:', error);
    return false;
  }
}

/**
 * Check if user has editor permissions for memorial
 * @param memorialId - Memorial ID
 * @param userId - User ID
 * @returns True if user is owner or has editor invitation
 */
export async function hasEditorPermission(
  memorialId: string,
  userId: string
): Promise<boolean> {
  const access = await checkMemorialAccess(memorialId, userId, 'editor');
  return access.allowed;
}
