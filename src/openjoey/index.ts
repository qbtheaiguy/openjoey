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
  getAllowedSkillsForRole,
  getSubscriberAllowedSkills,
  isAdmin,
  getTierPermissions,
  getTierLimits,
} from "./session-isolation.js";
export type { OpenJoeyRole, SessionInfo } from "./session-isolation.js";

export {
  handleStart,
  handleStatus,
  handleSubscribe,
  handleReferral,
  handleCancel,
  getHelpMessage,
  getWelcomeMessage,
  getReturningWelcomeMessage,
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

export { getLifecycleStage, getUserLifecycleData } from "./lifecycle.js";
export type { LifecycleStage, LifecycleInput, LifecycleData } from "./lifecycle.js";

export { buildStartKeyboard } from "./keyboard-builder.js";
export type { KeyboardButton, KeyboardContext } from "./keyboard-builder.js";

export { handleOpenJoeyCallback, isOpenJoeyCallback } from "./callback-handler.js";
export type { CallbackResult } from "./callback-handler.js";

export { extractTokenSymbol } from "./token-extract.js";

export { rewardReferral, attributeReferral } from "./referral-system.js";
export { checkAndSendReferralMilestones } from "./referral-milestones.js";
export type { SendReferralMilestoneMessage } from "./referral-milestones.js";

export { buildSkillsOverview, buildCategoryView, getCategoryLabel } from "./skill-browser.js";
export type { SkillEntry, SkillBrowseResult } from "./skill-browser.js";

export type { WatchlistItem, FavoriteSkill, SkillUse } from "./supabase-client.js";
