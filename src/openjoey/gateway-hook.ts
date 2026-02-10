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

import {
  clearPending,
  getPendingAnnounce,
  setPendingPreview,
  setPendingWaiting,
} from "./broadcast-state.js";
import { getCachedReply, setCachedReply } from "./cache/reply-cache.js";
import { FAVORITES_CAP } from "./constants.js";
import { buildStartKeyboard } from "./keyboard-builder.js";
import { getUserLifecycleData } from "./lifecycle.js";
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
  handleStop,
  getHelpMessage,
} from "./onboarding.js";
import {
  resolveSession,
  getAllowedSkillsForRole,
  getTierPermissions,
  deriveSessionKey,
} from "./session-isolation.js";
import { buildSkillsOverview } from "./skill-browser.js";
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
  /** Inline keyboard to attach to directReply (2D array of { text, callback_data }). */
  replyMarkup?: Array<Array<{ text: string; callback_data: string }>>;
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
  /** Optional user context note injected before the user's message for AI awareness. */
  userContext?: string;
  /** When set, bot should run admin broadcast with this message (admin-only). */
  broadcast?: { text: string };
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
  "/skills",
  "/favorites",
  "/broadcast",
  "/announce",
  "/stop",
]);

function isSlashCommand(text: string): boolean {
  const cmd = text.split(" ")[0].toLowerCase();
  return SLASH_COMMANDS.has(cmd);
}

// ──────────────────────────────────────────────
// Code-generation restriction (non-admin users)
// Prevents API cost from coding requests; admin has no restriction.
// ──────────────────────────────────────────────

/** Injected into system prompt for non-admin users so the model refuses code requests. */
const USER_CODE_RESTRICTION_PROMPT = `[CRITICAL - You are in user/subscriber mode]
You CANNOT and WILL NOT: write code, scripts, or programs; build apps, websites, or software; create bots, automation, or technical tools; provide coding tutorials or debugging help; generate technical architecture or system designs.
You CAN ONLY help with: cryptocurrency trading and analysis, market research and token discovery, price alerts and whale tracking, portfolio management, general crypto education, and conversational support.
If the user asks for code, apps, websites, or technical development, respond briefly: "I'm designed to help with crypto trading and research. For coding assistance, please contact the admin." Do not generate any code or technical implementation.`;

/** Normalize for code-request check: lowercase + strip accents so we match multiple languages. */
function normalizeForCodeCheck(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/** Phrases that indicate a code/development request; block before calling the AI for non-admins.
 * English + Spanish, French, German, Portuguese, Italian (phrases in ASCII for accent-agnostic match). */
const CODE_REQUEST_PHRASES = [
  // —— English: write/code/give ——
  "write code",
  "write me code",
  "write a code for",
  "write code for",
  "give me code",
  "send code",
  "code for",
  "i need code",
  "i need a script",
  "help me write code",
  "help me code",
  "sample code",
  "example code",
  "snippet of code",
  "code snippet",
  "boilerplate",
  "starter code",
  // —— English: build/create/make (app, site, bot, etc.) ——
  "build app",
  "build an app",
  "build me a",
  "build me an",
  "build a tracker",
  "tracker app",
  "habit tracker",
  "track habit",
  "build it out",
  "build out ",
  "build out a",
  "build it for me",
  "build that for me",
  "build this for me",
  "build for me",
  "create app",
  "create me a",
  "create it for me",
  "create that for me",
  "create for me",
  "make an app",
  "make me a",
  "make me an",
  "make it for me",
  "make that for me",
  "make for me",
  "i am building an app",
  "i'm building an app",
  "building an app",
  "want you to build",
  "want you to create",
  "want you to write",
  "need you to build",
  "can you build",
  "could you build",
  "please build",
  "help me build",
  "help me create",
  "help me make",
  "build website",
  "create website",
  "build a site",
  // —— English: script/program/implement ——
  "write script",
  "write a script",
  "create script",
  "implement it",
  "implement for me",
  "code it for me",
  "program",
  "programming",
  "develop",
  "developer",
  "build a bot",
  "make a bot",
  "create a bot",
  "scaffold",
  // —— English: tech stack / tools ——
  "smart contract",
  "javascript",
  "python",
  "solidity",
  "typescript",
  "node.js",
  "nodejs",
  "html",
  "css",
  "react",
  "vue",
  "angular",
  "api ",
  " function",
  "function ",
  "script to",
  "automate",
  "programmatically",
  "github",
  "git ",
  "deploy",
  "server",
  "database",
  "backend",
  "frontend",
  "debug",
  "fix my code",
  "code that",
  "script that",
  "algorithm",
  "implement",
  "sdk",
  "library",
  "package",
  "npm ",
  "pip install",
  "import ",
  "require(",
  "console.log",
  "async function",
  "class ",
  "lambda",
  "docker",
  "kubernetes",
  "sql query",
  "write a query",
  "build tool",
  "cli tool",
  "command line",
  "automation script",
  // —— Spanish (ASCII for accent-agnostic match) ——
  "escribe codigo",
  "escribeme codigo",
  "codigo para",
  "crear una app",
  "crear un app",
  "construir una app",
  "hazme una app",
  "construye para mi",
  "crea para mi",
  "programa para",
  "desarrollar",
  "construye ",
  "crea una app",
  "hacer una aplicacion",
  "quiero que me construyas",
  "quiero que me crees",
  "escribe un script",
  "dame codigo",
  "necesito codigo",
  "programar",
  // —— French ——
  "ecris du code",
  "ecris moi du code",
  "code pour",
  "cree une app",
  "cree moi une app",
  "construire une app",
  "developpe pour moi",
  "programme pour",
  "developper",
  "creer une application",
  "donne moi du code",
  "j'ai besoin de code",
  // —— German ——
  "schreib code",
  "schreib mir code",
  "code fur",
  "programm fur",
  "entwickle",
  "entwickle fur mich",
  "bau mir eine app",
  "erstelle eine app",
  "app erstellen",
  "programmieren",
  "gib mir code",
  // —— Portuguese ——
  "escreve codigo",
  "escreve me codigo",
  "codigo para",
  "criar um app",
  "criar uma app",
  "construir um app",
  "faz para mim",
  "desenvolver",
  "programar",
  "me da codigo",
  "preciso de codigo",
  // —— Italian ——
  "scrivi codice",
  "scrivimi codice",
  "codice per",
  "crea un'app",
  "crea un app",
  "costruisci per me",
  "sviluppa",
  "programma per",
  "dammi codice",
  "ho bisogno di codice",
];

function containsCodeRequest(text: string): boolean {
  const normalized = normalizeForCodeCheck(text);
  return CODE_REQUEST_PHRASES.some((p) => normalized.includes(normalizeForCodeCheck(p)));
}

/** Message sent when a non-admin triggers the code-request pre-filter (no API call). */
const CODE_REQUEST_BLOCK_REPLY =
  'I\'m designed to help with crypto trading, market research, and analysis — not coding or development.\n\nTry: "Analyze ETH" or "Set alert for SOL" or "What\'s trending?"';

/** Safe fallback when post-filter detects code in AI reply (non-admin). */
const CODE_IN_REPLY_FALLBACK =
  "I can help with crypto trading and research instead. What token would you like to analyze or track?";

/** Patterns that indicate code content in a reply (for post-response safety net). */
const CODE_CONTENT_PATTERNS = [
  /```[\s\S]*?```/g, // fenced code blocks
  /`[^`\n]+`/g, // inline code (short)
  /\b(function|def|class|import|from)\s+\w+\s*[\(\:]/,
  /\b(interface|type)\s+\w+\s*[\{\=]/,
  /<script[\s>]/i,
  /require\s*\(\s*['"]/,
  /console\.log\s*\(/,
  /\b(def|async\s+def)\s+\w+\s*\(/,
];

/**
 * Returns true if the text appears to contain code (for post-response filter).
 * Used as a safety net for non-admin users so we don't send code even if the model leaked it.
 */
export function containsCodeContent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return CODE_CONTENT_PATTERNS.some((p) => {
    if (p instanceof RegExp) {
      const match = trimmed.match(p);
      return match != null && (p.global ? match.length > 0 : true);
    }
    return false;
  });
}

/**
 * If the reply contains code-like content, returns a safe replacement for non-admin users.
 * Otherwise returns the original text. Call this before sending the reply to the user.
 */
export function filterCodeFromReply(text: string): string {
  if (!containsCodeContent(text)) return text;
  // Strip fenced code blocks and replace with a single placeholder line
  let out = text
    .replace(/```[\s\S]*?```/g, "\n[Code block removed.]\n")
    .replace(/`[^`\n]{2,200}`/g, "[code]");
  // If what's left is mostly code-ish or very short, replace entirely
  if (containsCodeContent(out) || out.trim().length < 80) {
    return CODE_IN_REPLY_FALLBACK;
  }
  return out.trim();
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

    case "/stop":
      return handleStop(msg.telegramId);

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

    case "/skills":
    case "/favorites":
      // Handled in main hook with keyboard — return marker so we know it was a recognized command
      return null;

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

  // 0. /announce follow-up: admin sent /announce, next message is the broadcast text → show preview
  if (!isSlashCommand(msg.text) && msg.text.trim()) {
    const pending = getPendingAnnounce(msg.telegramId);
    if (pending?.step === "waiting") {
      const session = await resolveSession(
        msg.telegramId,
        msg.telegramUsername,
        msg.telegramChatId,
      );
      if (session.role === "admin") {
        const text = msg.text.trim();
        setPendingPreview(msg.telegramId, text);
        const preview = `\u{1F4E2} *Preview:*\n\n${text}`;
        const replyMarkup: HookResult["replyMarkup"] = [
          [
            { text: "\u2705 Yes, Send", callback_data: "announce:confirm" },
            { text: "\u274C Cancel", callback_data: "announce:cancel" },
          ],
        ];
        return {
          directReply: preview,
          replyMarkup,
          sessionKey,
          tier: session.tier,
          allowedSkills: getAllowedSkillsForRole(session.role),
          allowAllSkills: true,
          permissions: getTierPermissions(session.tier),
          userId: session.userId,
          shouldProcess: false,
        };
      }
      clearPending(msg.telegramId);
    }
  }

  // 1. Handle slash commands
  if (isSlashCommand(msg.text)) {
    const cmd = msg.text.trim().split(" ")[0].toLowerCase();

    // 1a. /broadcast — admin-only: trigger broadcast to all users
    if (cmd === "/broadcast") {
      const session = await resolveSession(
        msg.telegramId,
        msg.telegramUsername,
        msg.telegramChatId,
      );
      if (session.role !== "admin") {
        return {
          directReply: "\u274C Admin only.",
          sessionKey,
          tier: session.tier,
          allowedSkills: getAllowedSkillsForRole(session.role),
          allowAllSkills: false,
          permissions: getTierPermissions(session.tier),
          userId: session.userId,
          shouldProcess: false,
        };
      }
      const text = msg.text.replace(/^\/broadcast\s*/i, "").trim();
      if (!text) {
        return {
          directReply:
            "Usage: /broadcast _your message_\n\nExample: /broadcast Hey everyone, thanks for the feedback!",
          sessionKey,
          tier: session.tier,
          allowedSkills: getAllowedSkillsForRole(session.role),
          allowAllSkills: true,
          permissions: getTierPermissions(session.tier),
          userId: session.userId,
          shouldProcess: false,
        };
      }
      return {
        directReply: "\u{1F4E2} Starting broadcast\u2026 You'll get a summary when done.",
        broadcast: { text },
        sessionKey,
        tier: session.tier,
        allowedSkills: getAllowedSkillsForRole(session.role),
        allowAllSkills: true,
        permissions: getTierPermissions(session.tier),
        userId: session.userId,
        shouldProcess: false,
      };
    }

    // 1a2. /announce — admin-only: ask for message, then show preview + confirm (handled above on next message)
    if (cmd === "/announce") {
      const session = await resolveSession(
        msg.telegramId,
        msg.telegramUsername,
        msg.telegramChatId,
      );
      if (session.role !== "admin") {
        return {
          directReply: "\u274C Admin only.",
          sessionKey,
          tier: session.tier,
          allowedSkills: getAllowedSkillsForRole(session.role),
          allowAllSkills: false,
          permissions: getTierPermissions(session.tier),
          userId: session.userId,
          shouldProcess: false,
        };
      }
      setPendingWaiting(msg.telegramId);
      return {
        directReply: "\u{1F4E2} Send me the announcement message:",
        sessionKey,
        tier: session.tier,
        allowedSkills: getAllowedSkillsForRole(session.role),
        allowAllSkills: true,
        permissions: getTierPermissions(session.tier),
        userId: session.userId,
        shouldProcess: false,
      };
    }

    // 1b. /skills and /favorites: produce directReply + replyMarkup together
    if (cmd === "/skills" || cmd === "/favorites") {
      const session = await resolveSession(
        msg.telegramId,
        msg.telegramUsername,
        msg.telegramChatId,
      );
      try {
        const db = getOpenJoeyDB();
        const user = await db.getUser(msg.telegramId);
        if (user) {
          const favorites = await db.getUserFavorites(user.id).catch(() => []);
          const favNames = favorites.map((f) => f.skill_name);

          if (cmd === "/skills") {
            const result = await buildSkillsOverview(favNames);
            return {
              directReply: result.text,
              replyMarkup: result.keyboard,
              sessionKey,
              tier: session.tier,
              allowedSkills: getAllowedSkillsForRole(session.role),
              allowAllSkills: session.role === "admin",
              permissions: getTierPermissions(session.tier),
              userId: session.userId,
              shouldProcess: false,
            };
          }
          // /favorites
          const favCap = FAVORITES_CAP;
          if (favorites.length === 0) {
            return {
              directReply: `\u2B50 *Your Favorite Skills (0/${favCap})*\n\nNo favorites yet. Use skills and I'll suggest adding them!\n\nBrowse all: /skills`,
              sessionKey,
              tier: session.tier,
              allowedSkills: getAllowedSkillsForRole(session.role),
              allowAllSkills: session.role === "admin",
              permissions: getTierPermissions(session.tier),
              userId: session.userId,
              shouldProcess: false,
            };
          }
          let text = `\u2B50 *Your Favorite Skills (${favorites.length}/${favCap})*\n\n`;
          for (const fav of favorites) {
            text += `\u2022 ${fav.skill_name}${fav.category ? ` (${fav.category})` : ""}\n`;
          }
          text += "\nYour favorites help the AI understand what you care about.";
          const keyboard = favorites.slice(0, 8).map((fav) => [
            { text: `\u{1F680} ${fav.skill_name}`, callback_data: `s:use:${fav.skill_name}` },
            { text: "\u{1F5D1}", callback_data: `s:unfav:${fav.skill_name}` },
          ]);
          keyboard.push([
            { text: "\u{1F4DA} Browse All", callback_data: "m:skills" },
            { text: "\u{1F519} Back", callback_data: "m:main" },
          ]);
          return {
            directReply: text,
            replyMarkup: keyboard,
            sessionKey,
            tier: session.tier,
            allowedSkills: getAllowedSkillsForRole(session.role),
            allowAllSkills: session.role === "admin",
            permissions: getTierPermissions(session.tier),
            userId: session.userId,
            shouldProcess: false,
          };
        }
      } catch (err) {
        console.error(`[openjoey] ${cmd} failed:`, err);
      }
      // Fallback if user not found
      return {
        directReply:
          cmd === "/skills"
            ? "Send /start first to set up your account."
            : "Send /start first to set up your account.",
        sessionKey,
        tier: session.tier,
        allowedSkills: getAllowedSkillsForRole(session.role),
        allowAllSkills: session.role === "admin",
        permissions: getTierPermissions(session.tier),
        userId: session.userId,
        shouldProcess: false,
      };
    }

    // 1b. Other slash commands (text-only reply + optional keyboard for /start)
    const reply = await handleSlashCommand(msg);
    if (reply) {
      // Resolve session anyway (for tracking)
      const session = await resolveSession(
        msg.telegramId,
        msg.telegramUsername,
        msg.telegramChatId,
      );

      // For /start: build data-driven keyboard from lifecycle
      let replyMarkup: HookResult["replyMarkup"] | undefined;
      if (cmd === "/start") {
        try {
          const db = getOpenJoeyDB();
          const user = await db.getUser(msg.telegramId);
          if (user) {
            const lifecycle = await getUserLifecycleData(db, user);
            // Only load extra data for non-day1 users (avoid unnecessary DB calls)
            const referralStats =
              lifecycle.stage !== "day1"
                ? await db.getReferralStats(user.id).catch(() => null)
                : null;
            const watchlistItems =
              lifecycle.stage !== "day1" ? await db.getUserWatchlist(user.id).catch(() => []) : [];
            const favoriteItems =
              lifecycle.stage !== "day1" ? await db.getUserFavorites(user.id).catch(() => []) : [];

            replyMarkup = buildStartKeyboard({
              stage: lifecycle.stage,
              referralStats,
              referralCode: user.referral_code,
              watchlistSymbols: watchlistItems.map((w) => w.symbol).slice(0, 5),
              favoriteSkills: favoriteItems.map((f) => f.skill_name).slice(0, 5),
              userAge24h: lifecycle.isOver24h,
            });
          }
        } catch (err) {
          // Non-fatal: keyboard fails → send text without buttons
          console.error("[openjoey] keyboard build failed:", err);
        }
      }

      return {
        directReply: reply,
        replyMarkup,
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

  // 5b. Code-request pre-filter: block coding/development requests for non-admins (saves API cost)
  if (session.role !== "admin" && containsCodeRequest(msg.text)) {
    return {
      directReply: CODE_REQUEST_BLOCK_REPLY,
      sessionKey,
      tier: session.tier,
      allowedSkills: getAllowedSkillsForRole(session.role),
      allowAllSkills: false,
      permissions: getTierPermissions(session.tier),
      userId: session.userId,
      shouldProcess: false,
    };
  }

  // 6. AI integration (§6 of UI/UX doc):
  //    - Reorder skills so user favorites come first in the tool list.
  //    - Build a short userContext note with favorites + watchlist for AI awareness.
  let allowedSkills = getAllowedSkillsForRole(session.role);
  let userContext: string | undefined;
  try {
    const db = getOpenJoeyDB();
    const [favorites, watchlist] = await Promise.all([
      db.getUserFavorites(session.userId).catch(() => []),
      db.getUserWatchlist(session.userId).catch(() => []),
    ]);

    // Reorder: favorites first, rest in original order
    if (favorites.length > 0 && allowedSkills && session.role !== "admin") {
      const favNames = favorites.map((f) => f.skill_name);
      const favSet = new Set(favNames);
      allowedSkills = [
        ...favNames.filter((f) => allowedSkills!.includes(f)),
        ...allowedSkills.filter((s) => !favSet.has(s)),
      ];
    }

    // Build user context note for the agent
    const contextParts: string[] = [];
    if (favorites.length > 0) {
      contextParts.push(
        `User's preferred skills: ${favorites.map((f) => f.skill_name).join(", ")}. Prioritize these when relevant.`,
      );
    }
    if (watchlist.length > 0) {
      contextParts.push(
        `User's watchlist: ${watchlist.map((w) => w.symbol).join(", ")}. They track these symbols regularly.`,
      );
    }
    if (contextParts.length > 0) {
      userContext = `[User preferences] ${contextParts.join(" ")}`;
    }
    // Non-admin: inject code restriction so model refuses code requests even if pre-filter missed
    if (session.role !== "admin") {
      userContext = userContext
        ? `${USER_CODE_RESTRICTION_PROMPT}\n\n${userContext}`
        : USER_CODE_RESTRICTION_PROMPT;
    }
  } catch {
    // Non-fatal: favorites reorder fails → use default order
  }
  if (session.role !== "admin" && !userContext) {
    userContext = USER_CODE_RESTRICTION_PROMPT;
  }

  return {
    sessionKey,
    tier: session.tier,
    allowedSkills,
    allowAllSkills: session.role === "admin",
    permissions: getTierPermissions(session.tier),
    userId: session.userId,
    shouldProcess: true,
    responseSuffix,
    userContext,
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
