// Email Sender using Resend
// Set RESEND_API_KEY in environment to enable
// Package is optional - works in demo mode without it

import type { EmailData, EmailResult, BulkEmailResult, EmailRecipient } from "./types";
import { renderEmailTemplate } from "./templates";

// Demo mode flag - if no API key, use demo mode
const DEMO_MODE = !process.env.RESEND_API_KEY;

// Resend client type (for TypeScript)
type ResendClient = {
  emails: {
    send: (params: {
      from: string;
      to: string[];
      subject: string;
      html: string;
      text: string;
      replyTo?: string;
      attachments?: Array<{ filename: string; content: string; contentType?: string }>;
      tags?: Array<{ name: string; value: string }>;
    }) => Promise<{ data?: { id: string }; error?: { message: string } }>;
  };
};

// Lazy-loaded Resend client
let resendClient: ResendClient | null = null;
let resendLoadAttempted = false;

async function getResendClient(): Promise<ResendClient | null> {
  if (DEMO_MODE) return null;
  if (resendLoadAttempted) return resendClient;

  resendLoadAttempted = true;
  try {
    // Use webpackIgnore to prevent bundling - package is optional
    const { Resend } = await import(/* webpackIgnore: true */ "resend");
    resendClient = new Resend(process.env.RESEND_API_KEY) as ResendClient;
    return resendClient;
  } catch {
    console.warn("[Email] Resend package not installed - using demo mode");
    return null;
  }
}

// Default from address
const FROM_EMAIL = process.env.EMAIL_FROM || "Forever Fields <noreply@foreverfields.com>";
const REPLY_TO_EMAIL = process.env.EMAIL_REPLY_TO || "support@foreverfields.com";

/**
 * Send a single email
 */
export async function sendEmail(emailData: EmailData): Promise<EmailResult> {
  const { to, subject, template, replyTo, attachments, tags } = emailData;

  // Normalize recipients
  const recipients = Array.isArray(to) ? to : [to];
  const toAddresses = recipients.map((r) =>
    typeof r === "string" ? r : r.name ? `${r.name} <${r.email}>` : r.email
  );

  // Render the email template
  const { html, text } = await renderEmailTemplate(template, (emailData as { data: Record<string, unknown> }).data);

  if (DEMO_MODE) {
    console.log("[Email Demo] Would send email:", {
      to: toAddresses,
      subject,
      template,
      html: html.substring(0, 200) + "...",
    });

    return {
      success: true,
      messageId: `demo-${Date.now()}`,
    };
  }

  const resend = await getResendClient();
  if (!resend) {
    return {
      success: false,
      error: "Email service not configured",
    };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: toAddresses,
      subject,
      html,
      text,
      replyTo: replyTo || REPLY_TO_EMAIL,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === "string" ? a.content : a.content.toString("base64"),
        contentType: a.contentType,
      })),
      tags: tags?.map((t) => ({ name: t, value: "true" })),
    });

    if (result.error) {
      console.error("[Email] Send failed:", result.error);
      return {
        success: false,
        error: result.error.message,
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    console.error("[Email] Send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}

/**
 * Send multiple emails (bulk)
 */
export async function sendBulkEmails(emails: EmailData[]): Promise<BulkEmailResult> {
  const results: EmailResult[] = [];
  let sent = 0;
  let failed = 0;

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(sendEmail));

    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    // Small delay between batches
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    total: emails.length,
    sent,
    failed,
    results,
  };
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format recipient for display
 */
export function formatRecipient(recipient: EmailRecipient): string {
  return recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email;
}
