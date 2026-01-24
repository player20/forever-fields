// Form validation schemas using Zod

import { z } from "zod";

// Common field schemas
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain uppercase, lowercase, and a number"
  );

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^[\d\s\-+()]+$/.test(val),
    "Please enter a valid phone number"
  );

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long");

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)");

export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .optional()
  .or(z.literal(""));

// Auth schemas
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Memorial schemas
export const createMemorialSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: dateSchema.optional(),
  dateOfDeath: dateSchema.optional(),
  bio: z
    .string()
    .max(5000, "Bio is too long (max 5000 characters)")
    .optional(),
  isPublic: z.boolean().default(true),
});

export const updateMemorialSchema = createMemorialSchema.partial();

// Story/Memory schemas
export const createStorySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title is too long"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content is too long (max 10000 characters)"),
  memorialId: z.string().min(1, "Memorial is required"),
  isPrivate: z.boolean().default(false),
});

// Contact/Guestbook schemas
export const guestbookEntrySchema = z.object({
  name: nameSchema,
  email: emailSchema.optional(),
  message: z
    .string()
    .min(1, "Message is required")
    .min(10, "Message is too short")
    .max(2000, "Message is too long (max 2000 characters)"),
  relationship: z.string().optional(),
});

// Pre-planning schemas
export const prePlanSchema = z.object({
  personalInfo: z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    dateOfBirth: dateSchema.optional(),
    phone: phoneSchema,
    email: emailSchema.optional(),
  }),
  finalWishes: z.object({
    serviceType: z.enum([
      "traditional_burial",
      "cremation",
      "green_burial",
      "memorial_service",
      "celebration_of_life",
      "other",
    ]),
    organDonor: z.boolean().optional(),
    specificWishes: z.string().max(5000).optional(),
  }),
});

// Shop schemas
export const shippingAddressSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  address1: z.string().min(1, "Address is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State/Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required").default("US"),
  phone: phoneSchema,
});

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .regex(/^\d{16}$/, "Please enter a valid card number"),
  expiryMonth: z
    .string()
    .min(1, "Required")
    .regex(/^(0[1-9]|1[0-2])$/, "Invalid month"),
  expiryYear: z
    .string()
    .min(1, "Required")
    .regex(/^\d{2}$/, "Invalid year"),
  cvv: z
    .string()
    .min(1, "CVV is required")
    .regex(/^\d{3,4}$/, "Invalid CVV"),
  nameOnCard: nameSchema,
});

// File upload validation
export const imageFileSchema = z
  .custom<File>()
  .refine((file) => file instanceof File, "Please select a file")
  .refine(
    (file) => file.size <= 10 * 1024 * 1024,
    "File size must be less than 10MB"
  )
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type),
    "File must be an image (JPEG, PNG, WebP, or GIF)"
  );

export const audioFileSchema = z
  .custom<File>()
  .refine((file) => file instanceof File, "Please select a file")
  .refine(
    (file) => file.size <= 50 * 1024 * 1024,
    "File size must be less than 50MB"
  )
  .refine(
    (file) =>
      ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"].includes(file.type),
    "File must be an audio file (MP3, WAV, OGG, or WebM)"
  );

export const documentFileSchema = z
  .custom<File>()
  .refine((file) => file instanceof File, "Please select a file")
  .refine(
    (file) => file.size <= 25 * 1024 * 1024,
    "File size must be less than 25MB"
  )
  .refine(
    (file) =>
      [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type),
    "File must be a PDF or Word document"
  );

// Helper to get Zod error messages as a record
export function formatZodErrors(
  error: z.ZodError
): Record<string, string> {
  const errors: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return errors;
}

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CreateMemorialInput = z.infer<typeof createMemorialSchema>;
export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type GuestbookEntryInput = z.infer<typeof guestbookEntrySchema>;
export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
