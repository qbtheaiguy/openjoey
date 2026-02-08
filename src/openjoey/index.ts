/**
 * OpenJoey — Main entry point
 *
 * Re-exports all OpenJoey modules for easy consumption by the gateway hooks.
 */

export { OpenJoeyDB, getOpenJoeyDB } from "./supabase-client.js";
export type {
  SupabaseConfig,
  OpenJoeyUser,
  TierAccessResult,
  RegisterResult,
  Alert,
  WhaleWatch,
} from "./supabase-client.js";

export { checkTierGate, postAnalysisHook, getConversionTrigger } from "./tier-middleware.js";
export type { TierAction, TierGateResult } from "./tier-middleware.js";

export {
  deriveSessionKey,
  resolveSession,
  getAllowedSkills,
  getTierPermissions,
  getTierLimits,
} from "./session-isolation.js";
export type { SessionInfo } from "./session-isolation.js";

export {
  handleStart,
  handleStatus,
  handleSubscribe,
  handleReferral,
  handleCancel,
  getHelpMessage,
  getWelcomeMessage,
  getStatusMessage,
} from "./onboarding.js";

export {
  getPostChartFomo,
  getBlockedActionMessage,
  getTimedTrigger,
  getVolatilityTrigger,
  getTrialExpiryWarning,
  getReferralUpsell,
} from "./marketing-hooks.js";
