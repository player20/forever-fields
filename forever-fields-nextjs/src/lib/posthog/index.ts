// ======================
// PostHog Module Exports
// ======================

export {
  initPostHog,
  identifyUser,
  resetUser,
  captureEvent,
  capturePageview,
  getFeatureFlag,
  isFeatureEnabled,
  getExperimentVariant,
  reloadFeatureFlags,
  posthog,
} from "./client";

export { PostHogProvider } from "./provider";
