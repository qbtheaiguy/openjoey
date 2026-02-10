/**
 * OpenJoey Gateway Hook
 *
 * This is the integration point with the OpenClaw gateway.
 * It hooks into the message pipeline to:
 * 1. Auto-register new Telegram users
 * 2. Resolve sessions (isolation)
 * 3. Check tier limits before processing
 * 4. Append marketing hooks to responses
 * 5. Handle slash commands (/start, /status, /subscribe, etc.)
 *
 * The gateway calls these hooks at specific points in the message lifecycle.
 */

import { getCachedReply, setCachedReply } from "./cache/reply-cache.js";
import {
  getPostChartFomo,
  getBlockedActionMessage,
  getTrialExpiryWarning,
  getReferralUpsell,
} from "./marketing-hooks.js";
import {
  handleStart,
  handleStatus,
  handleSubscribe,
  handleReferral,
  handleCancel,
  getHelpMessage,
} from "./onboarding.js";
import {
  resolveSession,
  getAllowedSkillsForRole,
  getTierPermissions,
  deriveSessionKey,
} from "./session-isolation.js";
import { getOpenJoeyDB } from "./supabase-client.js";
import { checkTierGate, postAnalysisHook } from "./tier-middleware.js";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface IncomingTelegramMessage {
  telegramId: number;
  telegramUsername?: string;
  telegramChatId?: number;
  displayName?: string;
  text: string;
  /** Deep-link referral code from /start?ref=CODE */
  startPayload?: string;
}

export interface HookResult {
  /** If set, reply with this immediately and don't pass to the agent. */
  directReply?: string;
  /** If set, reply with this cached reply and skip the agent (Phase 3 reply cache). */
  cachedReply?: string;
  /** Session key for the OpenClaw agent. */
  sessionKey: string;
  /** User's tier. */
  tier: string;
  /** Skills allowed for this user. When allowAllSkills is true (admin), this can be undefined. */
  allowedSkills: string[] | undefined;
  /** When true (admin), do not filter skills — load all skills from workspace. */
  allowAllSkills?: boolean;
  /** Permissions for this user. */
  permissions: string[];
  /** User's Supabase ID. */
  userId: string;
  /** Whether to proceed with agent processing. */
  shouldProcess: boolean;
  /** Suffix to append to the agent's response. */
  responseSuffix?: string;
}

// ──────────────────────────────────────────────
// Slash command handling
// ──────────────────────────────────────────────

const SLASH_COMMANDS = new Set([
  "/start",
  "/status",
  "/subscribe",
  "/referral",
  "/cancel",
  "/help",
  "/alerts",
  "/upgrade",
]);

function isSlashCommand(text: string): boolean {
  const cmd = text.split(" ")[0].toLowerCase();
  return SLASH_COMMANDS.has(cmd);
}

async function handleSlashCommand(msg: IncomingTelegramMessage): Promise<string | null> {
  const parts = msg.text.trim().split(" ");
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case "/start":
      return handleStart(
        msg.telegramId,
        msg.telegramUsername,
        msg.displayName,
        msg.startPayload ?? parts[1], // /start REF_CODE
      );

    case "/status":
      return handleStatus(msg.telegramId);

    case "/subscribe":
    case "/upgrade": {
      const tier = (parts[1] ?? "trader") as "trader" | "premium" | "annual";
      return handleSubscribe(msg.telegramId, tier);
    }

    case "/referral":
      return handleReferral(msg.telegramId);

    case "/cancel":
      return handleCancel(msg.telegramId);

    case "/help": {
      const session = await resolveSession(
        msg.telegramId,
        msg.telegramUsername,
        msg.telegramChatId,
      );
      return getHelpMessage(session.tier, session.role);
    }

    case "/alerts": {
      // Delegate to the agent with context
      return null; // Let the agent handle it via the alert-guru skill
    }

    default:
      return null;
  }
}

// ──────────────────────────────────────────────
// Main hook: onMessage
// ──────────────────────────────────────────────

/**
 * Called by the gateway when a Telegram message arrives.
 * Returns instructions on how to process the message.
 */
export async function onTelegramMessage(msg: IncomingTelegramMessage): Promise<HookResult> {
  const sessionKey = deriveSessionKey(msg.telegramId);

  // 1. Handle slash commands
  if (isSlashCommand(msg.text)) {
    const reply = await handleSlashCommand(msg);
    if (reply) {
      // Resolve session anyway (for tracking)
      const session = await resolveSession(
        msg.telegramId,
        msg.telegramUsername,
        msg.telegramChatId,
      );
      return {
        directReply: reply,
        sessionKey,
        tier: session.tier,
        allowedSkills: getAllowedSkillsForRole(session.role),
        allowAllSkills: session.role === "admin",
        permissions: getTierPermissions(session.tier),
        userId: session.userId,
        shouldProcess: false,
      };
    }
  }

  // 2. Resolve session (auto-registers new users)
  const session = await resolveSession(msg.telegramId, msg.telegramUsername, msg.telegramChatId);

  // 3. Check tier for chart analysis (the default action)
  const tierCheck = await checkTierGate(msg.telegramId, "chart_analysis");
  if (!tierCheck.allowed) {
    return {
      directReply: tierCheck.upsellMessage,
      sessionKey,
      tier: session.tier,
      allowedSkills: getAllowedSkillsForRole(session.role),
      allowAllSkills: session.role === "admin",
      permissions: getTierPermissions(session.tier),
      userId: session.userId,
      shouldProcess: false,
    };
  }

  // 4. Prepare response suffix (marketing hooks for free/trial users)
  let responseSuffix: string | undefined;

  if (session.tier === "free") {
    responseSuffix = getPostChartFomo();
    // Add referral upsell sometimes
    if (Math.random() < 0.3) {
      const db = getOpenJoeyDB();
      const user = await db.getUser(msg.telegramId);
      if (user?.referral_code) {
        responseSuffix += getReferralUpsell(user.referral_code);
      }
    }
  }

  if (session.tier === "trial") {
    const db = getOpenJoeyDB();
    const user = await db.getUser(msg.telegramId);
    if (user?.trial_ends_at) {
      const hoursLeft = Math.max(
        0,
        Math.round((new Date(user.trial_ends_at).getTime() - Date.now()) / 3600000),
      );
      if (hoursLeft <= 24) {
        const warning = getTrialExpiryWarning(hoursLeft);
        if (warning) responseSuffix = `\n\n---\n${warning}`;
      }
    }
  }

  // 5. Reply cache: skip agent if we have a recent cached reply (Phase 3)
  const cached = await getCachedReply(msg.text);
  if (cached) {
    return {
      sessionKey,
      tier: session.tier,
      allowedSkills: getAllowedSkillsForRole(session.role),
      allowAllSkills: session.role === "admin",
      permissions: getTierPermissions(session.tier),
      userId: session.userId,
      shouldProcess: false,
      cachedReply: cached,
    };
  }

  return {
    sessionKey,
    tier: session.tier,
    allowedSkills: getAllowedSkillsForRole(session.role),
    allowAllSkills: session.role === "admin",
    permissions: getTierPermissions(session.tier),
    userId: session.userId,
    shouldProcess: true,
    responseSuffix,
  };
}

/**
 * Called after the agent generates a response (for post-processing).
 * When replyText and context.incomingMessage are set, the reply is cached for Phase 3.
 */
export async function onAgentResponse(
  telegramId: number,
  replyText: string,
  context?: { incomingMessage?: string },
): Promise<string | null> {
  if (replyText?.trim() && context?.incomingMessage?.trim()) {
    await setCachedReply(context.incomingMessage, replyText);
  }
  return postAnalysisHook(telegramId);
}
