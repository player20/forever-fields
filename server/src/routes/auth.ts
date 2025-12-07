/**
 * Authentication Routes
 * Magic link authentication system
 */

import { Router } from 'express';
import { prisma } from '../config/database';
import { supabaseAdmin } from '../config/supabase';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/security';
import { magicLinkRequestSchema, authCallbackSchema } from '../validators/schemas';
import { generateSecureToken, getMagicLinkExpiration } from '../utils/tokens';
import { sendMagicLink } from '../services/email';

const router = Router();

/**
 * POST /api/auth/magic-link
 * Request a magic link to be sent to email
 */
router.post(
  '/magic-link',
  authRateLimiter,
  validate(magicLinkRequestSchema),
  async (req, res) => {
    try {
      const { email } = req.body;

      // Generate secure 32-char token
      const token = generateSecureToken();
      const expiresAt = getMagicLinkExpiration();

      // Store magic link in database
      await prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      // Send magic link email
      try {
        await sendMagicLink(email, token);
      } catch (emailError) {
        console.error('Failed to send magic link:', emailError);
        // Delete the magic link if email fails
        await prisma.magicLink.delete({ where: { token } });
        return res.status(500).json({ error: 'Failed to send authentication email' });
      }

      // Always return success (don't leak whether email exists)
      return res.status(200).json({
        message: 'If an account exists, a magic link has been sent to your email',
      });
    } catch (error) {
      console.error('Magic link request error:', error);
      return res.status(500).json({ error: 'Authentication request failed' });
    }
  }
);

/**
 * GET /api/auth/callback?token=xxx
 * Verify magic link token and sign in user
 */
router.get('/callback', validate(authCallbackSchema, 'query'), async (req, res) => {
  try {
    const { token } = req.query as { token: string };

    // Find magic link
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    // Validate magic link
    if (!magicLink) {
      return res.status(401).json({ error: 'Invalid or expired magic link' });
    }

    if (magicLink.usedAt) {
      return res.status(401).json({ error: 'Magic link already used' });
    }

    if (new Date() > magicLink.expiresAt) {
      return res.status(401).json({ error: 'Magic link expired' });
    }

    // Mark magic link as used
    await prisma.magicLink.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    // Check if user exists, create if not
    let user = await prisma.user.findUnique({
      where: { email: magicLink.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: magicLink.email,
          name: magicLink.email.split('@')[0], // Default name from email
        },
      });
    }

    // Try to get or create Supabase user
    let supabaseUserId;

    // First, try to get existing user by email
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === magicLink.email);

    if (existingUser) {
      supabaseUserId = existingUser.id;
    } else {
      // Create new user if they don't exist
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: magicLink.email,
        email_confirm: true,
        user_metadata: {
          name: user.name,
        },
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return res.status(500).json({ error: 'Authentication failed' });
      }

      supabaseUserId = authData.user.id;
    }

    // Generate session token for the user
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: magicLink.email,
      });

    if (sessionError || !sessionData) {
      console.error('Session generation error:', sessionError);
      return res.status(500).json({ error: 'Session creation failed' });
    }

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?access_token=${sessionData.properties.hashed_token}&refresh_token=${sessionData.properties.hashed_token}`;

    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Auth callback error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
