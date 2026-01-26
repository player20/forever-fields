// Stripe library exports

// Config
export {
  stripe,
  STRIPE_PUBLIC_KEY,
  SUBSCRIPTION_TIERS,
  ONE_TIME_PRODUCTS,
} from "./config";
export type { SubscriptionTier, OneTimeProduct } from "./config";

// Products
export {
  getTierByPriceId,
  getTierConfig,
  getOneTimeProductByPriceId,
  canAccessFeature,
  checkMemorialLimit,
  checkStorageLimit,
  getSubscriptionPrices,
  getProductDetails,
  formatPrice,
  formatStorage,
  compareTiers,
  getUpgradeOptions,
} from "./products";

// Subscriptions
export {
  getOrCreateCustomer,
  getActiveSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionInvoices,
  getUpcomingInvoice,
  isSubscriptionActive,
  getDaysUntilEnd,
  formatSubscriptionStatus,
} from "./subscriptions";
export type {
  SubscriptionStatus,
  UserSubscription,
} from "./subscriptions";

// Checkout
export {
  createSubscriptionCheckout,
  createOneTimeCheckout,
  createPortalSession,
  getCheckoutSession,
  getCheckoutSessionLineItems,
  expireCheckoutSession,
  createSetupIntent,
  listPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  buildSuccessUrl,
} from "./checkout";
export type { CheckoutMode, CheckoutSessionOptions, CheckoutSession } from "./checkout";

// Webhooks
export {
  constructWebhookEvent,
  processWebhookEvent,
  getWebhookSecret,
  isEventRecent,
} from "./webhooks";
export type {
  WebhookEventType,
  WebhookResult,
  WebhookHandlers,
  SubscriptionEventData,
  PaymentEventData,
  OneTimePurchaseData,
  CustomerEventData,
} from "./webhooks";
