// Email Queue
// Simple in-memory queue for demo, use Redis/Bull in production

import type { EmailData } from "./types";
import { sendEmail } from "./sender";

interface QueuedEmail {
  id: string;
  email: EmailData;
  scheduledFor: Date;
  attempts: number;
  status: "pending" | "processing" | "sent" | "failed";
  error?: string;
  createdAt: Date;
}

// In-memory queue (use Redis in production)
const queue: Map<string, QueuedEmail> = new Map();

// Processing state
let isProcessing = false;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 60000; // 1 minute

/**
 * Add email to queue
 */
export function queueEmail(email: EmailData, scheduledFor?: Date): string {
  const id = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const queuedEmail: QueuedEmail = {
    id,
    email,
    scheduledFor: scheduledFor || new Date(),
    attempts: 0,
    status: "pending",
    createdAt: new Date(),
  };

  queue.set(id, queuedEmail);
  console.log(`[EmailQueue] Queued email ${id} for ${queuedEmail.scheduledFor.toISOString()}`);

  // Start processing if not already running
  if (!isProcessing) {
    processQueue();
  }

  return id;
}

/**
 * Get email status
 */
export function getEmailStatus(id: string): QueuedEmail | undefined {
  return queue.get(id);
}

/**
 * Cancel queued email
 */
export function cancelEmail(id: string): boolean {
  const email = queue.get(id);
  if (email && email.status === "pending") {
    queue.delete(id);
    return true;
  }
  return false;
}

/**
 * Process the queue
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (true) {
      const now = new Date();
      const pendingEmails = Array.from(queue.values())
        .filter((e) => e.status === "pending" && e.scheduledFor <= now)
        .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

      if (pendingEmails.length === 0) {
        break;
      }

      for (const queuedEmail of pendingEmails) {
        queuedEmail.status = "processing";
        queuedEmail.attempts++;

        try {
          const result = await sendEmail(queuedEmail.email);

          if (result.success) {
            queuedEmail.status = "sent";
            console.log(`[EmailQueue] Sent email ${queuedEmail.id}`);
          } else {
            throw new Error(result.error || "Send failed");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          console.error(`[EmailQueue] Failed to send ${queuedEmail.id}:`, errorMessage);

          if (queuedEmail.attempts >= MAX_ATTEMPTS) {
            queuedEmail.status = "failed";
            queuedEmail.error = errorMessage;
          } else {
            // Retry later
            queuedEmail.status = "pending";
            queuedEmail.scheduledFor = new Date(now.getTime() + RETRY_DELAY_MS * queuedEmail.attempts);
          }
        }

        // Small delay between sends
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  } finally {
    isProcessing = false;
  }

  // Check for more emails after a delay
  const nextPending = Array.from(queue.values())
    .filter((e) => e.status === "pending")
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0];

  if (nextPending) {
    const delay = Math.max(0, nextPending.scheduledFor.getTime() - Date.now());
    setTimeout(() => processQueue(), delay);
  }
}

/**
 * Get queue stats
 */
export function getQueueStats(): {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  total: number;
} {
  const emails = Array.from(queue.values());
  return {
    pending: emails.filter((e) => e.status === "pending").length,
    processing: emails.filter((e) => e.status === "processing").length,
    sent: emails.filter((e) => e.status === "sent").length,
    failed: emails.filter((e) => e.status === "failed").length,
    total: emails.length,
  };
}

/**
 * Clear old completed/failed emails from queue
 */
export function cleanupQueue(olderThanHours = 24): number {
  const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  let removed = 0;

  for (const [id, email] of queue.entries()) {
    if ((email.status === "sent" || email.status === "failed") && email.createdAt < cutoff) {
      queue.delete(id);
      removed++;
    }
  }

  return removed;
}

// Export queue object for advanced use
export const emailQueue = {
  queue: queueEmail,
  getStatus: getEmailStatus,
  cancel: cancelEmail,
  getStats: getQueueStats,
  cleanup: cleanupQueue,
};
