/**
 * Authentication Routes
 * Magic link authentication system
 */

import { Router, Request, Response } from 'express';
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
      // Create new user
      user = await prisma.user.create({
        data: {
          email: magicLink.email,
          name: magicLink.email.split('@')[0], // Default name from email
        },
      });

      console.log(`[AUTH] New user created: ${user.email}`);
    }

    // Ensure Supabase auth user exists (create on first login only)
    // We try to create - if user exists, Supabase will skip creation gracefully
    await supabaseAdmin.auth.admin.createUser({
      email: magicLink.email,
      email_confirm: true,
      user_metadata: {
        name: user.name,
      },
    }).catch((error) => {
      // Ignore "user already exists" - this is expected for returning users
      if (!error.message?.includes('already been registered')) {
        throw error; // Re-throw other errors
      }
    });

    // Generate session tokens for this email
    // This works whether user was just created or already existed
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: magicLink.email,
      });

    if (sessionError || !sessionData) {
      console.error('Session generation error:', sessionError);
      return res.status(500).json({ error: 'Session creation failed' });
    }

    // Use the hashed token as both access and refresh (Supabase handles internally)
    const token = sessionData.properties.hashed_token;

    // Set httpOnly cookies (secure, not accessible to JavaScript)
    res.cookie('ff_access_token', token, {
      httpOnly: true,                                    // Cannot be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production',    // HTTPS only in production
      sameSite: 'strict',                                // CSRF protection
      maxAge: 3600000,                                   // 1 hour
      path: '/',
    });

    res.cookie('ff_refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600000,                          // 7 days
      path: '/api/auth',                                  // Only sent to auth endpoints
    });

    // Redirect without tokens in URL (secure)
    return res.redirect(302, `${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('Auth callback error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/logout
 * Clear httpOnly cookies and log out user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Clear httpOnly cookies by setting them to expire immediately
    res.clearCookie('ff_access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('ff_refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
