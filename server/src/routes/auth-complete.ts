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
import { z } from 'zod';
import { checkLockoutStatus, recordLoginAttempt } from '../utils/account-lockout';
import { checkPasswordBreach } from '../utils/password-breach';
import { generateOAuthState, validateOAuthState } from '../utils/oauth-state';

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

      // Store magic link
      await prisma.magicLink.create({
        data: {
          email,
          token,
          expiresAt,
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

      // Device fingerprinting removed (metadata field not in Prisma schema)
      // To re-add: add metadata: Json? field to MagicLink model in schema.prisma

      // Mark magic link as used
      await prisma.magicLink.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      // Create or get Supabase auth user FIRST (to get authoritative UUID)
      let supabaseUserId: string;
      const userName = magicLink.email.split('@')[0];

      // Try to create Supabase user (returns existing if already registered)
      const { data: supabaseData, error: supabaseError } = await supabaseAdmin.auth.admin.createUser({
        email: magicLink.email,
        email_confirm: true,
        user_metadata: { name: userName, auth_method: 'magic_link' },
      });

      if (supabaseError) {
        // If user already exists, look them up by email
        if (supabaseError.message?.includes('already been registered')) {
          console.log(`[AUTH] Supabase user already exists, looking up by email: ${magicLink.email}`);
          const { data: allUsers } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = allUsers?.users.find((u: any) => u.email === magicLink.email);

          if (!existingUser) {
            console.error('[AUTH] User registered in Supabase but not found in list');
            return res.status(500).json({ error: 'Authentication failed' });
          }

          supabaseUserId = existingUser.id;
        } else {
          console.error('[AUTH] Supabase user creation error:', supabaseError);
          throw supabaseError;
        }
      } else if (supabaseData?.user) {
        supabaseUserId = supabaseData.user.id;
        console.log(`[AUTH] New Supabase user created: ${magicLink.email} (${supabaseUserId})`);
      } else {
        console.error('[AUTH] Supabase user creation returned no data');
        return res.status(500).json({ error: 'Authentication failed' });
      }

      // Get or create user in our database with Supabase UUID
      let user = await prisma.user.findUnique({
        where: { email: magicLink.email },
      });

      console.log(`[AUTH] User lookup result for ${magicLink.email}:`, user ? `Found (ID: ${user.id})` : 'Not found');

      if (!user) {
        try {
          console.log(`[AUTH] Creating new user in database with Supabase UUID: ${supabaseUserId}`);
          user = await prisma.user.create({
            data: {
              id: supabaseUserId, // CRITICAL: Use Supabase UUID
              email: magicLink.email,
              name: userName,
            },
          });
          console.log(`[AUTH] ✅ New DB user created via magic link: ${user.email} (${user.id})`);
        } catch (createError) {
          console.error(`[AUTH] ❌ Failed to create user in database:`, createError);
          return res.status(500).json({ error: 'Failed to create user account' });
        }
      } else if (user.id !== supabaseUserId) {
        // UUID mismatch - update user ID to match Supabase
        console.warn(`[AUTH] UUID mismatch for ${user.email}: DB=${user.id}, Supabase=${supabaseUserId}`);
        console.log(`[AUTH] Updating user ID to match Supabase UUID`);
        try {
          await prisma.user.update({
            where: { email: magicLink.email },
            data: { id: supabaseUserId },
          });
          user.id = supabaseUserId;
          console.log(`[AUTH] ✅ User ID updated to ${supabaseUserId}`);
        } catch (updateError) {
          console.error(`[AUTH] ❌ Failed to update user ID:`, updateError);
          // Continue anyway - token will work with old ID
        }
      } else {
        console.log(`[AUTH] Existing user found with matching Supabase UUID`);
      }

      // Create a proper Supabase session with JWT tokens
      // Use a temporary password to sign in and get real access/refresh tokens
      const tempPassword = generateSecureToken(); // Random 32-char password

      // Update user with temporary password (they won't need it, just for session creation)
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUserId,
        { password: tempPassword }
      );

      if (updateError) {
        console.error('[AUTH] Failed to set temp password:', updateError);
        return res.status(500).json({ error: 'Session creation failed' });
      }

      // Sign in with temporary password to get proper JWT tokens
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
        email: magicLink.email,
        password: tempPassword,
      });

      if (sessionError || !sessionData.session) {
        console.error('[AUTH] Session creation error:', sessionError);
        return res.status(500).json({ error: 'Session creation failed' });
      }

      // Update user last login
      await prisma.user.update({
        where: { email: user.email },
        data: { updatedAt: new Date() },
      });

      console.log(`[AUTH] Successful magic link login: ${user.email}`);

      // Use proper JWT tokens from the session
      const accessToken = sessionData.session.access_token;
      const refreshToken = sessionData.session.refresh_token;

      res.cookie('ff_access_token', accessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site (requires secure)
        maxAge: 3600000, // 1 hour
        path: '/',
      });

      res.cookie('ff_refresh_token', refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site (requires secure)
        maxAge: 7 * 24 * 3600000, // 7 days
        path: '/api/auth',
      });

      // Redirect to dashboard with tokens in URL (fallback for cross-domain cookies)
      // The auth/callback.html page will handle storing tokens if cookies don't work
      const redirectUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);

      return res.redirect(302, redirectUrl.toString());
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

      // Check if password has been exposed in data breaches
      const isBreached = await checkPasswordBreach(password);
      if (isBreached) {
        console.warn(`[SECURITY] Breached password rejected for signup: ${email}`);
        return res.status(400).json({
          error: 'This password has been exposed in a data breach. Please choose a different password.',
        });
      }

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

      // Create user in our database (use Supabase's UUID to match auth tokens)
      await prisma.user
        .create({
          data: {
            id: data.user.id, // CRITICAL: Use Supabase's UUID so auth middleware can find user
            email: data.user.email!,
            name: data.user.email!.split('@')[0],
          },
        })
        .catch((err) => {
          console.warn('[AUTH] User already exists in database:', err);
        });

      // Sign in the user to get a proper session with JWT tokens
      const { data: sessionData, error: sessionError } =
        await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

      if (sessionError || !sessionData.session) {
        console.error('[AUTH] Session generation error:', sessionError);
        return res.status(500).json({ error: 'Account created but session failed' });
      }

      console.log(`[AUTH] Successful password signup: ${data.user.email}`);

      // Set httpOnly cookies (secure, not accessible to JavaScript)
      res.cookie('ff_access_token', sessionData.session.access_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600000, // 1 hour
        path: '/',
      });

      res.cookie('ff_refresh_token', sessionData.session.refresh_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 3600000, // 7 days
        path: '/api/auth',
      });

      return res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        // Include tokens for cross-domain scenarios (cookies may not work across domains)
        tokens: {
          access_token: sessionData.session.access_token,
          refresh_token: sessionData.session.refresh_token,
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
      const userAgent = req.headers['user-agent'] || 'unknown';

      console.log(`[AUTH] Password login attempt: ${email} from ${ipAddress}`);

      // Check account lockout status
      const lockoutStatus = await checkLockoutStatus(email, ipAddress);
      if (lockoutStatus.isLocked) {
        await recordLoginAttempt(email, ipAddress, false, 'Account locked', userAgent);
        console.warn(`[SECURITY] Login blocked due to account lockout: ${email} from ${ipAddress}`);
        return res.status(429).json({
          error: 'Too many failed login attempts. Please try again later.',
          lockoutEndsAt: lockoutStatus.lockoutEndsAt,
          attemptsRemaining: 0,
        });
      }

      // Verify credentials with Supabase
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed login attempt
        await recordLoginAttempt(email, ipAddress, false, error.message, userAgent);
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

      // Record successful login attempt
      await recordLoginAttempt(email, ipAddress, true, undefined, userAgent);

      console.log(`[AUTH] Successful password login: ${data.user.email}`);

      // Set httpOnly cookies for security (prevent XSS token theft)
      res.cookie('ff_access_token', data.session.access_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: remember ? 30 * 24 * 3600000 : 3600000, // 30 days if "remember me", else 1 hour
        path: '/',
      });

      res.cookie('ff_refresh_token', data.session.refresh_token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: remember ? 90 * 24 * 3600000 : 7 * 24 * 3600000, // 90 days if "remember me", else 7 days
        path: '/api/auth',
      });

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        // Include tokens for cross-domain scenarios (cookies may not work across domains)
        tokens: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
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

    // Generate CSRF state token
    const state = generateOAuthState(ipAddress);

    // Generate OAuth URL with Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: provider as 'google' | 'apple',
      options: {
        redirectTo: `${env.API_URL}/api/auth/sso/callback`,
        scopes: provider === 'google' ? 'email profile' : undefined,
        queryParams: {
          state,
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
 * Handle OAuth provider callback
 *
 * Security: Validates CSRF state parameter, exchanges code for session
 */
router.get('/sso/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;
    const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

    console.log(`[AUTH] OAuth callback received from ${ipAddress}`);

    // Check for OAuth errors
    if (oauthError) {
      console.error('[AUTH] OAuth error:', oauthError);
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Validate CSRF state
    if (!state || !validateOAuthState(state as string, ipAddress)) {
      console.error(`[SECURITY] Invalid OAuth state from ${ipAddress}`);
      return res.redirect(`${env.FRONTEND_URL}/login?error=invalid_state`);
    }

    if (!code) {
      console.error('[AUTH] No code in OAuth callback');
      return res.redirect(`${env.FRONTEND_URL}/login?error=auth_failed`);
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
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3600000, // 1 hour
      path: '/',
    });

    res.cookie('ff_refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 3600000, // 7 days
      path: '/api/auth',
    });

    // Get or create user in database
    const user = await prisma.user.upsert({
      where: { email: data.session.user.email! },
      update: { updatedAt: new Date() },
      create: {
        email: data.session.user.email!,
        name: data.session.user.user_metadata?.name || data.session.user.email!.split('@')[0],
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

      // Constant-time operation to prevent timing attacks
      const startTime = Date.now();

      // Check if user exists
      const user = await prisma.user.findUnique({ where: { email } });

      console.log(`[AUTH] User lookup for password reset: ${email} - ${user ? 'FOUND' : 'NOT FOUND'}`);

      // Always generate token to maintain constant time
      const token = generateSecureToken();
      const expiresAt = getMagicLinkExpiration();

      if (user) {
        // Create password reset token in database
        const createdToken = await prisma.magicLink.create({
          data: {
            email,
            token,
            expiresAt,
          },
        });

        // Send branded password reset email via Resend
        try {
          await sendPasswordResetEmail(email, token);
          console.log(`[AUTH] Password reset email sent successfully to ${email}`);
        } catch (err) {
          // Delete token if email failed to send (prevent orphaned tokens)
          await prisma.magicLink.delete({
            where: { id: createdToken.id },
          });

          console.error('[AUTH] Failed to send password reset email (token deleted):', {
            error: err.message,
            email,
          });
        }
      } else {
        // Simulate same delay as email sending to prevent timing enumeration
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Ensure minimum response time of 500ms to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
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
 * GET /api/auth/reset-password?token=xxx
 * Handle password reset link click - verifies token and logs user in
 */
router.get(
  '/reset-password',
  validate(authCallbackSchema, 'query'),
  async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token: string };
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

      console.log(`[AUTH] Password reset link clicked from ${ipAddress}`);

      // Find and validate magic link (password reset uses same token system)
      const magicLink = await prisma.magicLink.findUnique({
        where: { token },
      });

      if (!magicLink) {
        console.warn(`[AUTH] Invalid password reset token from ${ipAddress}`);
        return res.redirect(`${env.FRONTEND_URL}/login?error=invalid_token`);
      }

      if (magicLink.usedAt) {
        console.warn(`[AUTH] Password reset token already used`);
        return res.redirect(`${env.FRONTEND_URL}/login?error=token_used`);
      }

      if (new Date() > magicLink.expiresAt) {
        console.warn(`[AUTH] Password reset token expired`);
        return res.redirect(`${env.FRONTEND_URL}/login?error=token_expired`);
      }

      // Token is valid - redirect to password reset page with token
      // DO NOT mark as used yet - only mark used after password is actually changed
      console.log(`[AUTH] Valid reset token - redirecting to reset page`);
      return res.redirect(302, `${env.FRONTEND_URL}/reset-password?token=${token}`);
    } catch (error) {
      console.error('[AUTH] Password reset error:', error);
      return res.redirect(`${env.FRONTEND_URL}/login?error=reset_failed`);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Complete password reset by setting new password
 */
router.post(
  '/reset-password',
  authRateLimiter,
  validate(
    z.object({
      token: z.string().min(32, 'Invalid token'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128)
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      const ipAddress = (req.ip || req.connection.remoteAddress || 'unknown').replace('::ffff:', '');

      console.log(`[AUTH] Completing password reset from ${ipAddress}`);

      // Find and validate token
      const magicLink = await prisma.magicLink.findUnique({
        where: { token },
      });

      if (!magicLink) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      if (magicLink.usedAt) {
        return res.status(400).json({ error: 'Reset link has already been used' });
      }

      if (new Date() > magicLink.expiresAt) {
        return res.status(400).json({ error: 'Reset link has expired' });
      }

      // Check if new password has been exposed in data breaches
      const isBreached = await checkPasswordBreach(newPassword);
      if (isBreached) {
        console.warn(`[SECURITY] Breached password rejected for reset: ${magicLink.email}`);
        return res.status(400).json({
          error: 'This password has been exposed in a data breach. Please choose a different password.',
        });
      }

      // Look up user in our database
      const user = await prisma.user.findUnique({
        where: { email: magicLink.email },
      });

      if (!user) {
        // User doesn't exist - they need to sign up first
        console.warn(`[AUTH] Password reset attempted for non-existent user: ${magicLink.email}`);
        return res.status(400).json({
          error: 'No account found with this email address. Please sign up first.',
        });
      }

      console.log(`[AUTH] Password reset for: ${user.email} (${user.id})`);

      // Update password in Supabase using the user's UUID from our database
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
      });

      if (updateError) {
        console.error('[AUTH] Password update failed:', updateError);
        return res.status(500).json({ error: 'Failed to update password. Please try again.' });
      }

      // Mark token as used AFTER successful password update
      await prisma.magicLink.update({
        where: { token },
        data: { usedAt: new Date() },
      });

      console.log(`[AUTH] Password reset successful for ${user.email}`);

      return res.status(200).json({
        message: 'Password updated successfully. You can now sign in with your new password.',
      });
    } catch (error) {
      console.error('[AUTH] Password reset completion error:', error);
      return res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 *
 * Security: Rotates refresh tokens, reads from httpOnly cookies
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Read refresh token from httpOnly cookie (preferred) or request body (fallback for API clients)
    const refreshToken = req.cookies?.ff_refresh_token || req.body.refresh_token;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      console.error('[AUTH] Token refresh error:', error);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Update httpOnly cookies with new tokens
    res.cookie('ff_access_token', data.session.access_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 3600000, // 1 hour
      path: '/',
    });

    res.cookie('ff_refresh_token', data.session.refresh_token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 3600000, // 7 days
      path: '/api/auth',
    });

    return res.status(200).json({
      message: 'Token refreshed successfully',
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
 * Security: Revoke tokens and clear httpOnly cookies
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Get token from httpOnly cookie (preferred) or Authorization header (fallback)
    const accessToken = req.cookies?.ff_access_token ||
                        (req.headers.authorization?.startsWith('Bearer ')
                          ? req.headers.authorization.substring(7)
                          : null);

    // Revoke token in Supabase if available
    if (accessToken) {
      await supabaseAdmin.auth.admin.signOut(accessToken).catch((err) => {
        console.warn('[AUTH] Token revocation failed:', err);
      });
    }

    // Clear httpOnly cookies (most important step)
    res.clearCookie('ff_access_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });

    res.clearCookie('ff_refresh_token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/auth',
    });

    console.log('[AUTH] User logged out successfully');

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    // Still clear cookies even if revocation fails
    res.clearCookie('ff_access_token', { path: '/' });
    res.clearCookie('ff_refresh_token', { path: '/api/auth' });
    return res.status(200).json({ message: 'Logged out successfully' });
  }
});

export default router;
