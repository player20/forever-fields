// Email Service Layer
// Uses Resend for transactional emails
// Set RESEND_API_KEY to enable sending

export * from "./types";
export * from "./templates";
export { sendEmail, sendBulkEmails } from "./sender";
export { emailQueue } from "./queue";
