/**
 * Forever Fields - Zod Validation Schemas
 * All API inputs validated with strict schemas
 */

import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const magicLinkRequestSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
});

export const authCallbackSchema = z.object({
  token: z.string().min(32, 'Invalid token format'),
});

// Re-export auth schemas from auth-schemas.ts
export { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth-schemas';

// ============================================
// MEMORIAL SCHEMAS
// ============================================

const baseMemorialSchema = z.object({
  deceasedName: z.string().min(1, 'Name required').max(200),
  birthDate: z.string().datetime().optional().nullable(),
  deathDate: z.string().datetime().optional().nullable(),
  gotchaDate: z.string().datetime().optional().nullable(),
  portraitUrl: z.string().url().optional().nullable(),
  shortBio: z.string().max(5000).optional().nullable(),
  isPet: z.boolean().default(false),
  privacy: z.enum(['private', 'link', 'public']).default('private'),
  songSpotifyUri: z.string().max(500).optional().nullable(),
  songYoutubeUrl: z.string().url().optional().nullable(),
  restingType: z.string().max(100).optional().nullable(),
  restingLocation: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      address: z.string().max(500).optional(),
      name: z.string().max(200).optional(),
    })
    .optional()
    .nullable(),
});

export const createMemorialSchema = baseMemorialSchema.refine(
  (data) => {
    // Must have at least birthDate OR deathDate for duplicate detection
    return data.birthDate || data.deathDate;
  },
  {
    message: 'At least one of birthDate or deathDate is required',
  }
);

export const updateMemorialSchema = baseMemorialSchema.partial();

export const memorialIdSchema = z.object({
  id: z.string().uuid('Invalid memorial ID'),
});

// ============================================
// UPLOAD SCHEMAS
// ============================================

export const uploadSignSchema = z.object({
  fileType: z.enum(['image', 'audio', 'video']),
  fileName: z.string().min(1).max(255),
  memorialId: z.string().uuid().optional(), // Optional for profile uploads
});

// ============================================
// PENDING ITEMS SCHEMAS
// ============================================

export const pendingItemActionSchema = z.object({
  id: z.string().uuid('Invalid pending item ID'),
});

export const createPendingItemSchema = z.object({
  memorialId: z.string().uuid(),
  type: z.enum(['photo', 'memory', 'song', 'social', 'time_capsule']),
  dataJson: z.record(z.any()), // Flexible JSON object
});

// ============================================
// CANDLE SCHEMAS
// ============================================

export const createCandleSchema = z.object({
  memorialId: z.string().uuid('Invalid memorial ID'),
  message: z.string().max(500).optional().nullable(),
  name: z.string().max(100).optional().nullable(),
});

// ============================================
// TIME CAPSULE SCHEMAS
// ============================================

export const createTimeCapsuleSchema = z.object({
  memorialId: z.string().uuid('Invalid memorial ID'),
  messageText: z.string().max(5000).optional().nullable(),
  voiceUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  unlockDate: z.string().datetime('Invalid unlock date'),
}).refine(
  (data) => {
    // Must have at least one content type
    return data.messageText || data.voiceUrl || data.videoUrl;
  },
  {
    message: 'At least one of messageText, voiceUrl, or videoUrl is required',
  }
).refine(
  (data) => {
    // Unlock date must be in the future
    const unlockDate = new Date(data.unlockDate);
    const now = new Date();
    return unlockDate > now;
  },
  {
    message: 'Unlock date must be in the future',
  }
);

// ============================================
// SOCIAL LINKS SCHEMAS
// ============================================

export const updateSocialLinksSchema = z.object({
  memorialId: z.string().uuid(),
  facebook: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  tiktok: z.string().url().optional().nullable(),
});

// ============================================
// QR CODE SCHEMAS
// ============================================

export const createQRCodeSchema = z.object({
  memorialId: z.string().uuid(),
  design: z.enum(['marble', 'garden', 'gold', 'minimalist']).default('minimalist'),
});

// ============================================
// INVITATION SCHEMAS
// ============================================

export const createInvitationSchema = z.object({
  memorialId: z.string().uuid(),
  email: z.string().email().toLowerCase(),
  role: z.enum(['editor', 'viewer']),
});

// ============================================
// PUSH NOTIFICATION SCHEMAS
// ============================================

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

// ============================================
// GUESTBOOK SCHEMAS
// ============================================

export const createGuestbookEntrySchema = z.object({
  memorialId: z.string().uuid('Invalid memorial ID'),
  name: z.string().min(1).max(100).optional().nullable(),
  message: z.string().min(1).max(5000, 'Message is too long'),
  relationship: z.string().max(100).optional().nullable(),
});

// ============================================
// MEMORIES SCHEMAS
// ============================================

export const createMemorySchema = z.object({
  memorialId: z.string().uuid('Invalid memorial ID'),
  title: z.string().min(1).max(200).optional().nullable(),
  content: z.string().min(1).max(10000, 'Content is too long'),
  authorName: z.string().min(1).max(100).optional().nullable(),
  authorRelationship: z.string().max(100).optional().nullable(),
});

// ============================================
// VOICE NOTE SCHEMAS
// ============================================

export const createVoiceNoteSchema = z.object({
  memorialId: z.string().uuid('Invalid memorial ID'),
  url: z.string().url('Invalid voice note URL'),
  publicId: z.string().max(500).optional().nullable(),
  duration: z.number().int().min(0).max(300).optional(), // Max 5 minutes
  authorName: z.string().max(100).optional().nullable(),
});

// ============================================
// REPORTS SCHEMAS
// ============================================

export const createReportSchema = z.object({
  memorialId: z.string().uuid('Invalid memorial ID'),
  contentType: z.enum(['photo', 'memory', 'guestbook', 'voice_note', 'candle']),
  contentId: z.string().uuid('Invalid content ID'),
  reason: z.string().min(1).max(1000, 'Reason is too long'),
  reporterName: z.string().max(100).optional().nullable(),
  reporterEmail: z.string().email('Invalid email').optional().nullable(),
});

export const resolveReportSchema = z.object({
  action: z.enum(['resolved', 'dismissed']),
});

// ============================================
// HELPER TYPES (for TypeScript inference)
// ============================================

export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type AuthCallback = z.infer<typeof authCallbackSchema>;
export type CreateMemorial = z.infer<typeof createMemorialSchema>;
export type UpdateMemorial = z.infer<typeof updateMemorialSchema>;
export type UploadSign = z.infer<typeof uploadSignSchema>;
export type CreatePendingItem = z.infer<typeof createPendingItemSchema>;
export type CreateCandle = z.infer<typeof createCandleSchema>;
export type CreateTimeCapsule = z.infer<typeof createTimeCapsuleSchema>;
export type UpdateSocialLinks = z.infer<typeof updateSocialLinksSchema>;
export type CreateQRCode = z.infer<typeof createQRCodeSchema>;
export type CreateInvitation = z.infer<typeof createInvitationSchema>;
export type PushSubscribe = z.infer<typeof pushSubscribeSchema>;
export type CreateGuestbookEntry = z.infer<typeof createGuestbookEntrySchema>;
export type CreateMemory = z.infer<typeof createMemorySchema>;
export type CreateVoiceNote = z.infer<typeof createVoiceNoteSchema>;
export type CreateReport = z.infer<typeof createReportSchema>;
export type ResolveReport = z.infer<typeof resolveReportSchema>;
