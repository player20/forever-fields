/**
 * Email Service
 * Sends magic links and notifications via Resend REST API
 */

import { Resend } from 'resend';
import { env } from '../config/env';

// Initialize Resend client (uses SMTP_PASS as the API key)
let resend: Resend | null = null;

if (env.SMTP_PASS) {
  resend = new Resend(env.SMTP_PASS);
  console.log('✅ Resend email service initialized');
} else {
  console.warn('⚠️  Resend API key not configured - email features disabled');
}

/**
 * Send magic link email
 */
export const sendMagicLink = async (email: string, token: string): Promise<void> => {
  if (!resend) {
    console.warn('⚠️  Cannot send magic link email - Resend not configured');
    throw new Error('Email service not configured. Please contact support.');
  }

  const magicLink = `${env.API_URL}/api/auth/callback?token=${token}`;
  const fromEmail = env.SMTP_FROM || 'noreply@foreverfields.app';

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Forever Fields Sign-In Link',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sign In to Forever Fields</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Forever Fields</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Honoring Memories, Forever</p>
            </div>

            <div style="background: white; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Sign In to Your Account</h2>
              <p>Click the button below to securely sign in to Forever Fields. This link will expire in 15 minutes.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${magicLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Sign In Now</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Security Note:</strong> This link can only be used once and will expire in 15 minutes. If you didn't request this link, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If the button doesn't work, copy and paste this link:<br>
                <span style="color: #667eea; word-break: break-all;">${magicLink}</span>
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Forever Fields. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Sign In to Forever Fields

Click this link to sign in to your account:
${magicLink}

This link will expire in 15 minutes and can only be used once.

If you didn't request this link, you can safely ignore this email.

---
© ${new Date().getFullYear()} Forever Fields. All rights reserved.
      `.trim(),
    });

    console.log(`✅ Magic link email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send magic link email:', error);
    throw new Error('Failed to send authentication email');
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  if (!resend) {
    console.warn('⚠️  Cannot send password reset email - Resend not configured');
    throw new Error('Email service not configured. Please contact support.');
  }

  const resetLink = `${env.API_URL}/api/auth/reset-password?token=${token}`;
  const fromEmail = env.SMTP_FROM || 'noreply@foreverfields.app';

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Reset Your Forever Fields Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Forever Fields</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
            </div>

            <div style="background: white; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
              <p>We received a request to reset your password. Click the button below to choose a new password.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Reset Password</a>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                <strong>Security Note:</strong> This link will expire in 15 minutes and can only be used once. If you didn't request this, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If the button doesn't work, copy and paste this link:<br>
                <span style="color: #667eea; word-break: break-all;">${resetLink}</span>
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Forever Fields. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
      text: `
Reset Your Password

We received a request to reset your password for Forever Fields.

Click this link to reset your password:
${resetLink}

This link will expire in 15 minutes and can only be used once.

If you didn't request this, you can safely ignore this email.

---
© ${new Date().getFullYear()} Forever Fields. All rights reserved.
      `.trim(),
    });

    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send invitation email
 */
export const sendInvitationEmail = async (
  email: string,
  memorialName: string,
  role: 'editor' | 'viewer',
  token: string
): Promise<void> => {
  if (!resend) {
    console.warn('⚠️  Cannot send invitation email - Resend not configured');
    throw new Error('Email service not configured. Please contact support.');
  }

  const inviteLink = `${env.FRONTEND_URL}/invitations/${token}`;
  const roleText = role === 'editor' ? 'collaborate on' : 'view';
  const fromEmail = env.SMTP_FROM || 'noreply@foreverfields.app';

  try {
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You've been invited to ${roleText} a memorial on Forever Fields`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Memorial Invitation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Forever Fields</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Memorial Invitation</p>
            </div>

            <div style="background: white; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">You've Been Invited</h2>
              <p>You've been invited to ${roleText} the memorial for <strong>${memorialName}</strong> on Forever Fields.</p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">Accept Invitation</a>
              </div>

              <p style="color: #666; font-size: 14px;">
                <strong>Your Role:</strong> ${role === 'editor' ? 'Editor - You can add and manage content' : 'Viewer - You can view the memorial'}
              </p>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This invitation will expire in 7 days.
              </p>
            </div>

            <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Forever Fields. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✅ Invitation email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw new Error('Failed to send invitation email');
  }
};
