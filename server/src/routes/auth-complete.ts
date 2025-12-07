/**
 * Complete Hybrid Authentication Routes
 * Primary: Magic Links (passwordless)
 * Secondary: SSO (Google, Apple)
 * Fallback: Password
 *
 * Security Best Practices:
 * - Rate limiting (5 attempts/hour per IP)
 * - bcrypt for passwords (via Supabase)
 * - JWT tokens with refresh
 * - OWASP Top 10 mitigations
 * - Secure session management
 * - Device fingerprinting
 * - Audit logging
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { supabaseAdmin } from '../config/supabase';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/security';
import {
  magicLinkRequestSchema,
  authCallbackSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
} from '../validators/schemas';
import { generateSecureToken, getMagicLinkExpiration } from '../utils/tokens';
import { sendMagicLink, sendPasswordResetEmail } from '../services/email';
import { env } from '../config/env';

const router = Router();

/**
 * POST /api/auth/request-magic-link
 * Primary authentication method - Request magic link via email
 *
 * Security: Rate limited, 15-min expiry, single-use tokens, device fingerprinting
 */
router.post(
  '/request-magic-link',
  authRateLimiter,
  validate(magicLinkRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

      // Audit log
      console.log(`[AUTH] Magic link requested: ${email} from ${ipAddress}`);

      // Generate secure 32-char token
      const token = generateSecureToken();
      const expiresAt = getMagicLinkExpiration(); // 15 minutes

      // Store magic link with device fingerprint
      await prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt,
          metadata: {
            userAgent,
            ipAddress,
            requestedAt: new Date().toISOString(),
          },
        },
      });

      // Send magic link email (async)
      try {
        await sendMagicLink(email, token);
      } catch (emailError) {
        console.error('[AUTH] Failed to send magic link:', emailError);
        // Delete the magic link if email fails
        await prisma.magicLink.delete({ where: { token } });
        return res.status(500).json({ error: 'Failed to send authentication email' });
      }

      // Always return success (prevent email enumeration)
      return res.status(200).json({
        message: 'If an account exists, a magic link has been sent to your email',
        expiresIn: 900, // 15 minutes in seconds
      });
    } catch (error) {
      console.error('[AUTH] Magic link request error:', error);
      return res.status(500).json({ error: 'Authentication request failed' });
    }
  }
);

/**
 * GET /api/auth/callback?token=xxx
 * Verify magic link token and authenticate user
 *
 * Security: Single-use, expiry check, device validation
 */
router.get(
  '/callback',
  validate(authCallbackSchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token: string };
      const userAgent = req.headers['user-agent'] || 'unknown';
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

      // Find and validate magic link
      const magicLink = await prisma.magicLink.findUnique({
        where: { token },
      });

      if (!magicLink) {
        console.log(`[AUTH] Invalid magic link token attempted from ${ipAddress}`);
        return res.status(401).json({ error: 'Invalid or expired magic link' });
      }

      if (magicLink.usedAt) {
        console.log(`[AUTH] Reused magic link attempted: ${magicLink.email}`);
        return res.status(401).json({ error: 'Magic link already used' });
      }

      if (new Date() > magicLink.expiresAt) {
        console.log(`[AUTH] Expired magic link attempted: ${magicLink.email}`);
        return res.status(401).json({ error: 'Magic link expired' });
      }

      // Optional: Device fingerprint validation (relaxed for mobile)
      // Can be enhanced with more sophisticated fingerprinting
      const metadata = magicLink.metadata as any;
      if (metadata?.userAgent && metadata.userAgent !== userAgent) {
        console.warn(`[AUTH] Device mismatch for ${magicLink.email}`);
        // Allow but log for security monitoring
      }

      // Mark magic link as used
      await prisma.magicLink.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      // Get or create user
      let user = await prisma.user.findUnique({
        where: { email: magicLink.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: magicLink.email,
            name: magicLink.email.split('@')[0],
          },
        });
        console.log(`[AUTH] New user created via magic link: ${user.email}`);
      }

      // Create or get Supabase auth user (handles SSO unification)
      await supabaseAdmin.auth.admin
        .createUser({
          email: magicLink.email,
          email_confirm: true,
          user_metadata: { name: user.name, auth_method: 'magic_link' },
        })
        .catch((error) => {
          if (!error.message?.includes('already been registered')) {
            throw error;
          }
        });

      // Generate session tokens
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: magicLink.email,
        });

      if (sessionError || !sessionData) {
        console.error('[AUTH] Session generation error:', sessionError);
        return res.status(500).json({ error: 'Session creation failed' });
      }

      // Update user last login
      await prisma.user.update({
        where: { email: user.email },
        data: { updatedAt: new Date() },
      });

      console.log(`[AUTH] Successful magic link login: ${user.email}`);

      // Redirect with tokens
      const redirectUrl = `${env.FRONTEND_URL}/auth/callback?access_token=${sessionData.properties.hashed_token}&refresh_token=${sessionData.properties.hashed_token}`;

      return res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('[AUTH] Callback error:', error);
      return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }
);

/**
 * POST /api/auth/signup
 * Secondary method - Create account with password
 *
 * Security: Password complexity enforced, bcrypt hashing via Supabase
 */
router.post(
  '/signup',
  authRateLimiter,
  validate(signupSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

      console.log(`[AUTH] Password signup requested: ${email} from ${ipAddress}`);

      // Create Supabase auth user (handles bcrypt hashing)
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { auth_method: 'password' },
      });

      if (error) {
        console.error('[AUTH] Supabase signup error:', error);

        if (error.message.includes('already registered')) {
          return res.status(409).json({ error: 'An account with this email already exists' });
        }

        return res.status(400).json({ error: error.message });
      }

      if (!data.user) {
        return res.status(500).json({ error: 'Failed to create account' });
      }

      // Create user in our database
      await prisma.user
        .create({
          data: {
            email: data.user.email!,
            name: data.user.email!.split('@')[0],
          },
        })
        .catch((err) => {
          console.warn('[AUTH] User already exists in database:', err);
        });

      // Generate session
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: data.user.email!,
        });

      if (sessionError || !sessionData) {
        console.error('[AUTH] Session generation error:', sessionError);
        return res.status(500).json({ error: 'Account created but session failed' });
      }

      console.log(`[AUTH] Successful password signup: ${data.user.email}`);

      return res.status(201).json({
        message: 'Account created successfully',
        access_token: sessionData.properties.hashed_token,
        refresh_token: sessionData.properties.hashed_token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    } catch (error) {
      console.error('[AUTH] Signup error:', error);
      return res.status(500).json({ error: 'Account creation failed' });
    }
  }
);

/**
 * POST /api/auth/login
 * Fallback method - Login with password
 *
 * Security: Rate limited, constant-time comparison via Supabase
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  async (req: Request, res: Response) => {
    try {
      const { email, password, remember } = req.body;
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

      console.log(`[AUTH] Password login attempt: ${email} from ${ipAddress}`);

      // Verify credentials with Supabase
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn(`[AUTH] Failed password login: ${email} from ${ipAddress}`);
        // Don't leak information about user existence
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!data.user || !data.session) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await prisma.user
        .update({
          where: { email: data.user.email! },
          data: { updatedAt: new Date() },
        })
        .catch((err) => {
          console.warn('[AUTH] Failed to update user last login:', err);
        });

      console.log(`[AUTH] Successful password login: ${data.user.email}`);

      return res.status(200).json({
        message: 'Login successful',
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        remember,
      });
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * GET /api/auth/sso/:provider
 * Secondary method - SSO with Google/Apple
 *
 * Security: State parameter for CSRF, secure OAuth flow via Supabase
 */
router.get('/sso/:provider', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

    if (!['google', 'apple'].includes(provider)) {
      return res.status(400).json({ error: 'Invalid SSO provider' });
    }

    console.log(`[AUTH] SSO request: ${provider} from ${ipAddress}`);

    // Generate CSRF state token for OAuth security
    const { generateOAuthState } = await import('../utils/oauth-state');
    const state = generateOAuthState(ipAddress);

    // Generate OAuth URL with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: provider as 'google' | 'apple',
      options: {
        redirectTo: `${env.API_URL}/api/auth/sso/callback`,
        scopes: provider === 'google' ? 'email profile' : undefined,
        queryParams: {
          state, // CSRF protection
        },
      },
    });

    if (error || !data.url) {
      console.error('[AUTH] SSO URL generation error:', error);
      return res.status(500).json({ error: 'SSO initialization failed' });
    }

    return res.redirect(302, data.url);
  } catch (error) {
    console.error('[AUTH] SSO error:', error);
    return res.status(500).json({ error: 'SSO failed' });
  }
});

/**
 * GET /api/auth/sso/callback
 * Handle OAuth provider callback with CSRF validation
 */
router.get('/sso/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

    // Check for OAuth errors from provider
    if (oauthError) {
      console.error('[AUTH] OAuth error from provider:', oauthError);
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Validate CSRF state token
    const { validateOAuthState } = await import('../utils/oauth-state');
    if (!state || !validateOAuthState(state as string, ipAddress)) {
      console.error('[AUTH] Invalid OAuth state from', ipAddress);
      return res.redirect(`${env.FRONTEND_URL}/login?error=invalid_state`);
    }

    // Exchange code for session
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code as string);

    if (error || !data.session) {
      console.error('[AUTH] Code exchange failed:', error);
      return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
    }

    // Set httpOnly cookies
    res.cookie('ff_access_token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
      path: '/',
    });

    res.cookie('ff_refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 3600000, // 7 days
      path: '/api/auth',
    });

    // Get or create user in database
    const user = await prisma.user.upsert({
      where: { email: data.session.user.email! },
      update: { updatedAt: new Date() },
      create: {
        email: data.session.user.email!,
        name: data.session.user.user_metadata.name || data.session.user.email!.split('@')[0],
      },
    });

    console.log(`[AUTH] Successful SSO login: ${user.email}`);

    return res.redirect(`${env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    console.error('[AUTH] SSO callback error:', error);
    return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

/**
 * POST /api/auth/forgot-password
 * Unified password reset - sends magic link
 *
 * Security: Always return success to prevent email enumeration
 */
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

      console.log(`[AUTH] Password reset requested: ${email} from ${ipAddress}`);

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // Send password reset via Supabase (uses email template)
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${env.FRONTEND_URL}/auth/reset-password`,
        });

        if (error) {
          console.error('[AUTH] Password reset email error:', error);
        }

        // Alternative: Send via our magic link system
        const token = generateSecureToken();
        const expiresAt = getMagicLinkExpiration();

        await prisma.magicLink.create({
          data: {
            email,
            token,
            expiresAt,
            metadata: { purpose: 'password_reset' },
          },
        });

        await sendPasswordResetEmail(email, token).catch((err) => {
          console.error('[AUTH] Failed to send password reset email:', err);
        });
      }

      // Always return success (prevent email enumeration)
      return res.status(200).json({
        message: 'If an account exists, a password reset link has been sent',
      });
    } catch (error) {
      console.error('[AUTH] Forgot password error:', error);
      return res.status(200).json({
        message: 'If an account exists, a password reset link has been sent',
      });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 *
 * Security: Rotates refresh tokens
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      console.error('[AUTH] Token refresh error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error('[AUTH] Refresh error:', error);
    return res.status(500).json({ error: 'Token refresh failed' });
  }
});

/**
 * POST /api/auth/logout
 * Sign out user
 *
 * Security: Revoke tokens
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await supabaseAdmin.auth.admin.signOut(token).catch((err) => {
        console.warn('[AUTH] Token revocation failed:', err);
      });
    }

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    return res.status(200).json({ message: 'Logged out successfully' });
  }
});

export default router;
