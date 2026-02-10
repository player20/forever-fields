// Email Types

export type EmailTemplate =
  | "welcome"
  | "password_reset"
  | "email_verification"
  | "collaborator_invite"
  | "anniversary_reminder"
  | "guestbook_notification"
  | "story_notification"
  | "candle_notification"
  | "time_capsule_ready"
  | "time_capsule_opened"
  | "donation_received"
  | "donation_thank_you"
  | "order_confirmation"
  | "order_shipped"
  | "claim_request"
  | "claim_approved"
  | "claim_rejected"
  | "weekly_digest"
  | "partner_order"
  | "partner_welcome";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface BaseEmailData {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  template: EmailTemplate;
  replyTo?: string;
  attachments?: EmailAttachment[];
  tags?: string[];
}

// Template-specific data types
export interface WelcomeEmailData extends BaseEmailData {
  template: "welcome";
  data: {
    userName: string;
    loginUrl: string;
  };
}

export interface PasswordResetEmailData extends BaseEmailData {
  template: "password_reset";
  data: {
    userName: string;
    resetUrl: string;
    expiresIn: string;
  };
}

export interface CollaboratorInviteEmailData extends BaseEmailData {
  template: "collaborator_invite";
  data: {
    inviterName: string;
    memorialName: string;
    role: string;
    inviteUrl: string;
    expiresIn: string;
  };
}

export interface AnniversaryReminderEmailData extends BaseEmailData {
  template: "anniversary_reminder";
  data: {
    userName: string;
    memorialName: string;
    memorialUrl: string;
    anniversaryType: "birth" | "death" | "custom";
    anniversaryDate: string;
    yearsAgo?: number;
    customLabel?: string;
  };
}

export interface GuestbookNotificationEmailData extends BaseEmailData {
  template: "guestbook_notification";
  data: {
    ownerName: string;
    memorialName: string;
    memorialUrl: string;
    authorName: string;
    message: string;
    requiresApproval: boolean;
  };
}

export interface StoryNotificationEmailData extends BaseEmailData {
  template: "story_notification";
  data: {
    ownerName: string;
    memorialName: string;
    memorialUrl: string;
    authorName: string;
    storyTitle: string;
    storyPreview: string;
    requiresApproval: boolean;
  };
}

export interface CandleNotificationEmailData extends BaseEmailData {
  template: "candle_notification";
  data: {
    ownerName: string;
    memorialName: string;
    memorialUrl: string;
    litByName: string;
    message?: string;
  };
}

export interface TimeCapsuleReadyEmailData extends BaseEmailData {
  template: "time_capsule_ready";
  data: {
    recipientName: string;
    senderName: string;
    memorialName?: string;
    capsuleTitle: string;
    openUrl: string;
  };
}

export interface DonationReceivedEmailData extends BaseEmailData {
  template: "donation_received";
  data: {
    ownerName: string;
    memorialName: string;
    donorName: string;
    amount: string;
    causeName?: string;
    message?: string;
    totalRaised: string;
    goalAmount?: string;
  };
}

export interface DonationThankYouEmailData extends BaseEmailData {
  template: "donation_thank_you";
  data: {
    donorName: string;
    memorialName: string;
    memorialUrl: string;
    amount: string;
    causeName?: string;
    receiptUrl?: string;
  };
}

export interface OrderConfirmationEmailData extends BaseEmailData {
  template: "order_confirmation";
  data: {
    customerName: string;
    orderNumber: string;
    orderUrl: string;
    items: Array<{
      name: string;
      quantity: number;
      price: string;
      customization?: string;
    }>;
    subtotal: string;
    shipping: string;
    total: string;
    shippingAddress: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    estimatedDelivery?: string;
  };
}

export interface OrderShippedEmailData extends BaseEmailData {
  template: "order_shipped";
  data: {
    customerName: string;
    orderNumber: string;
    trackingNumber: string;
    trackingUrl: string;
    carrier: string;
    items: Array<{
      name: string;
      quantity: number;
    }>;
  };
}

export interface WeeklyDigestEmailData extends BaseEmailData {
  template: "weekly_digest";
  data: {
    userName: string;
    memorials: Array<{
      name: string;
      url: string;
      viewCount: number;
      newGuestbook: number;
      newStories: number;
      candlesLit: number;
    }>;
    upcomingAnniversaries: Array<{
      memorialName: string;
      memorialUrl: string;
      date: string;
      type: string;
    }>;
  };
}

export interface PartnerOrderEmailData extends BaseEmailData {
  template: "partner_order";
  data: {
    partnerName: string;
    orderNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      price: string;
      customization?: Record<string, string>;
    }>;
    shippingAddress: {
      name: string;
      street1: string;
      street2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    customerNotes?: string;
    isGift: boolean;
    giftMessage?: string;
    dashboardUrl: string;
  };
}

// Union type of all email data types
export type EmailData =
  | WelcomeEmailData
  | PasswordResetEmailData
  | CollaboratorInviteEmailData
  | AnniversaryReminderEmailData
  | GuestbookNotificationEmailData
  | StoryNotificationEmailData
  | CandleNotificationEmailData
  | TimeCapsuleReadyEmailData
  | DonationReceivedEmailData
  | DonationThankYouEmailData
  | OrderConfirmationEmailData
  | OrderShippedEmailData
  | WeeklyDigestEmailData
  | PartnerOrderEmailData;

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  results: EmailResult[];
}
