/**
 * AI Module
 *
 * Re-exports all AI companion utilities.
 */

// Crisis detection
export {
  detectCrisis,
  getCrisisResources,
  getRandomGriefTip,
  isDismissingCrisis,
  analyzeConversation,
  CRISIS_RESOURCES,
  GRIEF_TIPS,
} from "./crisis-detection";

export type {
  CrisisTier,
  CrisisAction,
  CrisisResult,
  CrisisResource,
  ConversationAnalysis,
} from "./crisis-detection";

// Session tracking
export {
  startSession,
  endSession,
  getSession,
  addMessage,
  markBreakReminderShown,
  markResourcesShown,
  markCrisisHandled,
  shouldShowBreakReminder,
  shouldEscalateCrisis,
  getSessionStats,
  SESSION_THRESHOLDS,
} from "./session-tracker";

export type { AISession, SessionMessage } from "./session-tracker";
