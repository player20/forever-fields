/**
 * Invitation Routes
 * Send and accept memorial collaboration invitations
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { requireAuth } from '../middleware/auth';
import { requireMemorialOwner } from '../middleware/authorization';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/security';
import { sendInvitationEmail } from '../services/email';
import { generateSecureToken, getMagicLinkExpiration } from '../utils/tokens';
import { z } from 'zod';

const router = Router();

/**
 * Validation schemas
 */
const sendInvitationSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  role: z.enum(['editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be either "editor" or "viewer"' }),
  }),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(32, 'Invalid invitation token'),
});

/**
 * POST /api/memorials/:memorialId/invite
 * Send invitation to collaborate on memorial
 */
router.post(
  '/memorials/:memorialId/invite',
  requireAuth,
  authRateLimiter,
  requireMemorialOwner,
  validate(sendInvitationSchema),
  async (req: Request, res: Response) => {
    try {
      const { memorialId } = req.params;
      const { email, role } = req.body;
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace(
        '::ffff:',
        ''
      );

      console.log(
        `[INVITATION] Sending invitation for memorial ${memorialId} to ${email} as ${role} from ${ipAddress}`
      );

      // Get memorial details
      const memorial = await prisma.memorial.findUnique({
        where: { id: memorialId },
        select: { deceasedName: true, ownerId: true },
      });

      if (!memorial) {
        return res.status(404).json({ error: 'Memorial not found' });
      }

      // Check if user is inviting themselves
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.id === memorial.ownerId) {
        return res.status(400).json({ error: 'You cannot invite yourself' });
      }

      // Check if invitation already exists and is not expired
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          memorialId,
          email,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvitation) {
        return res.status(409).json({
          error: 'An active invitation already exists for this email',
        });
      }

      // Generate invitation token
      const token = generateSecureToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          memorialId,
          email,
          role,
          token,
          expiresAt,
        },
      });

      // Send invitation email
      try {
        await sendInvitationEmail(email, memorial.deceasedName, role, token);
        console.log(`[INVITATION] Email sent to ${email} for memorial ${memorialId}`);
      } catch (emailError) {
        console.error('[INVITATION] Failed to send email:', emailError);
        // Delete invitation if email fails
        await prisma.invitation.delete({ where: { id: invitation.id } });
        return res.status(500).json({ error: 'Failed to send invitation email' });
      }

      return res.status(200).json({
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      console.error('[INVITATION] Send error:', error);
      return res.status(500).json({ error: 'Failed to send invitation' });
    }
  }
);

/**
 * GET /api/invitations/:token
 * Accept invitation and grant access to memorial
 */
router.get(
  '/invitations/:token',
  validate(acceptInvitationSchema, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace(
        '::ffff:',
        ''
      );

      console.log(`[INVITATION] Accepting invitation from ${ipAddress}`);

      // Find invitation
      const invitation = await prisma.invitation.findUnique({
        where: { token },
        include: {
          memorial: {
            select: { id: true, deceasedName: true, ownerId: true },
          },
        },
      });

      if (!invitation) {
        console.warn(`[INVITATION] Invalid token from ${ipAddress}`);
        return res.status(404).json({ error: 'Invitation not found or expired' });
      }

      // Check if already used
      if (invitation.usedAt) {
        console.warn(`[INVITATION] Token already used`);
        return res.status(410).json({ error: 'This invitation has already been used' });
      }

      // Check if expired
      if (new Date() > invitation.expiresAt) {
        console.warn(`[INVITATION] Token expired`);
        return res.status(410).json({ error: 'This invitation has expired' });
      }

      // Get or create user for invited email
      let user = await prisma.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        // Create user account for the invited person
        user = await prisma.user.create({
          data: {
            email: invitation.email,
            name: invitation.email.split('@')[0],
          },
        });
        console.log(`[INVITATION] Created new user: ${user.email}`);
      }

      // Mark invitation as used
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      });

      console.log(
        `[INVITATION] Successfully accepted for ${user.email} to memorial ${invitation.memorial.id}`
      );

      // TODO: In the future, implement proper collaboration permissions
      // For now, we'll redirect them to the memorial page
      // They can view it and sign in to manage it

      return res.status(200).json({
        message: 'Invitation accepted successfully',
        memorial: {
          id: invitation.memorial.id,
          name: invitation.memorial.deceasedName,
        },
        role: invitation.role,
        redirectTo: `/memorial/${invitation.memorial.id}`,
      });
    } catch (error) {
      console.error('[INVITATION] Accept error:', error);
      return res.status(500).json({ error: 'Failed to accept invitation' });
    }
  }
);

/**
 * GET /api/memorials/:memorialId/invitations
 * Get all invitations for a memorial (owner only)
 */
router.get(
  '/memorials/:memorialId/invitations',
  requireAuth,
  requireMemorialOwner,
  async (req: Request, res: Response) => {
    try {
      const { memorialId } = req.params;

      const invitations = await prisma.invitation.findMany({
        where: { memorialId },
        orderBy: { expiresAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      return res.status(200).json({ invitations });
    } catch (error) {
      console.error('[INVITATION] List error:', error);
      return res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  }
);

/**
 * DELETE /api/invitations/:invitationId
 * Revoke an invitation (owner only)
 */
router.delete(
  '/invitations/:invitationId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { invitationId } = req.params;
      const userId = req.user!.id;

      // Get invitation and check ownership
      const invitation = await prisma.invitation.findUnique({
        where: { id: invitationId },
        include: {
          memorial: { select: { ownerId: true } },
        },
      });

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      if (invitation.memorial.ownerId !== userId) {
        return res.status(403).json({ error: 'Not authorized to revoke this invitation' });
      }

      // Delete invitation
      await prisma.invitation.delete({ where: { id: invitationId } });

      console.log(`[INVITATION] Revoked invitation ${invitationId}`);

      return res.status(200).json({ message: 'Invitation revoked successfully' });
    } catch (error) {
      console.error('[INVITATION] Revoke error:', error);
      return res.status(500).json({ error: 'Failed to revoke invitation' });
    }
  }
);

export default router;
