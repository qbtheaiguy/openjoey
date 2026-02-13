import type { ApiClientOptions } from "grammy";
import { sequentialize } from "@grammyjs/runner";
import { apiThrottler } from "@grammyjs/transformer-throttler";
import { type Message, type UserFromGetMe, ReactionTypeEmoji } from "@grammyjs/types";
import { Bot, webhookCallback } from "grammy";
import type { OpenClawConfig, ReplyToMode } from "../config/config.js";
import type { RuntimeEnv } from "../runtime.js";
import type { TelegramContext } from "./bot/types.js";
import { resolveDefaultAgentId } from "../agents/agent-scope.js";
import { resolveTextChunkLimit } from "../auto-reply/chunk.js";
import { isControlCommandMessage } from "../auto-reply/command-detection.js";
import { DEFAULT_GROUP_HISTORY_LIMIT, type HistoryEntry } from "../auto-reply/reply/history.js";
import {
  isNativeCommandsExplicitlyDisabled,
  resolveNativeCommandsEnabled,
  resolveNativeSkillsEnabled,
} from "../config/commands.js";
import { loadConfig } from "../config/config.js";
import {
  resolveChannelGroupPolicy,
  resolveChannelGroupRequireMention,
} from "../config/group-policy.js";
import { loadSessionStore, resolveStorePath } from "../config/sessions.js";
import { danger, logVerbose, shouldLogVerbose } from "../globals.js";
import { formatUncaughtError } from "../infra/errors.js";
import { enqueueSystemEvent } from "../infra/system-events.js";
import { getChildLogger } from "../logging.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { runBroadcast } from "../openjoey/broadcast.js";
import { onTelegramMessage } from "../openjoey/gateway-hook.js";
import { getOpenJoeyDB } from "../openjoey/supabase-client.js";
import { extractTokenSymbol } from "../openjoey/token-extract.js";
import { resolveAgentRoute } from "../routing/resolve-route.js";
import { resolveTelegramAccount } from "./accounts.js";
import { withTelegramApiErrorLogging } from "./api-logging.js";
import { registerTelegramHandlers } from "./bot-handlers.js";
import { createTelegramMessageProcessor } from "./bot-message.js";
import { registerTelegramNativeCommands } from "./bot-native-commands.js";
import {
  buildTelegramUpdateKey,
  createTelegramUpdateDedupe,
  resolveTelegramUpdateId,
  type TelegramUpdateKeyContext,
} from "./bot-updates.js";
import {
  buildTelegramGroupPeerId,
  buildTelegramParentPeer,
  resolveTelegramForumThreadId,
  resolveTelegramStreamMode,
} from "./bot/helpers.js";
import { resolveTelegramFetch } from "./fetch.js";
import { buildInlineKeyboard } from "./send.js";
import { wasSentByBot } from "./sent-message-cache.js";

export type TelegramBotOptions = {
  token: string;
  accountId?: string;
  runtime?: RuntimeEnv;
  requireMention?: boolean;
  allowFrom?: Array<string | number>;
  groupAllowFrom?: Array<string | number>;
  mediaMaxMb?: number;
  replyToMode?: ReplyToMode;
  proxyFetch?: typeof fetch;
  config?: OpenClawConfig;
  updateOffset?: {
    lastUpdateId?: number | null;
    onUpdateId?: (updateId: number) => void | Promise<void>;
  };
};

export function getTelegramSequentialKey(ctx: {
  chat?: { id?: number };
  me?: UserFromGetMe;
  message?: Message;
  update?: {
    message?: Message;
    edited_message?: Message;
    callback_query?: { message?: Message };
    message_reaction?: { chat?: { id?: number } };
  };
}): string {
  // Handle reaction updates
  const reaction = ctx.update?.message_reaction;
  if (reaction?.chat?.id) {
    return `telegram:${reaction.chat.id}`;
  }
  const msg =
    ctx.message ??
    ctx.update?.message ??
    ctx.update?.edited_message ??
    ctx.update?.callback_query?.message;
  const chatId = msg?.chat?.id ?? ctx.chat?.id;
  const rawText = msg?.text ?? msg?.caption;
  const botUsername = ctx.me?.username;
  if (
    rawText &&
    isControlCommandMessage(rawText, undefined, botUsername ? { botUsername } : undefined)
  ) {
    if (typeof chatId === "number") {
      return `telegram:${chatId}:control`;
    }
    return "telegram:control";
  }
  const isGroup = msg?.chat?.type === "group" || msg?.chat?.type === "supergroup";
  const messageThreadId = msg?.message_thread_id;
  const isForum = msg?.chat?.is_forum;
  const threadId = isGroup
    ? resolveTelegramForumThreadId({ isForum, messageThreadId })
    : messageThreadId;
  if (typeof chatId === "number") {
    return threadId != null ? `telegram:${chatId}:topic:${threadId}` : `telegram:${chatId}`;
  }
  return "telegram:unknown";
}

export function createTelegramBot(opts: TelegramBotOptions) {
  const runtime: RuntimeEnv = opts.runtime ?? {
    log: console.log,
    error: console.error,
    exit: (code: number): never => {
      throw new Error(`exit ${code}`);
    },
  };
  const cfg = opts.config ?? loadConfig();
  const account = resolveTelegramAccount({
    cfg,
    accountId: opts.accountId,
  });
  const telegramCfg = account.config;

  const fetchImpl = resolveTelegramFetch(opts.proxyFetch, {
    network: telegramCfg.network,
  }) as unknown as ApiClientOptions["fetch"];
  const shouldProvideFetch = Boolean(fetchImpl);
  // grammY's ApiClientOptions types still track `node-fetch` types; Node 22+ global fetch
  // (undici) is structurally compatible at runtime but not assignable in TS.
  const fetchForClient = fetchImpl as unknown as NonNullable<ApiClientOptions["fetch"]>;
  const timeoutSeconds =
    typeof telegramCfg?.timeoutSeconds === "number" && Number.isFinite(telegramCfg.timeoutSeconds)
      ? Math.max(1, Math.floor(telegramCfg.timeoutSeconds))
      : undefined;
  const client: ApiClientOptions | undefined =
    shouldProvideFetch || timeoutSeconds
      ? {
          ...(shouldProvideFetch && fetchImpl ? { fetch: fetchForClient } : {}),
          ...(timeoutSeconds ? { timeoutSeconds } : {}),
        }
      : undefined;

  const bot = new Bot(opts.token, client ? { client } : undefined);
  bot.api.config.use(apiThrottler());
  bot.use(sequentialize(getTelegramSequentialKey));
  // Catch all errors from bot middleware to prevent unhandled rejections
  bot.catch((err) => {
    runtime.error?.(danger(`telegram bot error: ${formatUncaughtError(err)}`));
  });

  const recentUpdates = createTelegramUpdateDedupe();
  let lastUpdateId =
    typeof opts.updateOffset?.lastUpdateId === "number" ? opts.updateOffset.lastUpdateId : null;

  const recordUpdateId = (ctx: TelegramUpdateKeyContext) => {
    const updateId = resolveTelegramUpdateId(ctx);
    if (typeof updateId !== "number") {
      return;
    }
    if (lastUpdateId !== null && updateId <= lastUpdateId) {
      return;
    }
    lastUpdateId = updateId;
    void opts.updateOffset?.onUpdateId?.(updateId);
  };

  const shouldSkipUpdate = (ctx: TelegramUpdateKeyContext) => {
    const updateId = resolveTelegramUpdateId(ctx);
    if (typeof updateId === "number" && lastUpdateId !== null) {
      if (updateId <= lastUpdateId) {
        return true;
      }
    }
    const key = buildTelegramUpdateKey(ctx);
    const skipped = recentUpdates.check(key);
    if (skipped && key && shouldLogVerbose()) {
      logVerbose(`telegram dedupe: skipped ${key}`);
    }
    return skipped;
  };

  const rawUpdateLogger = createSubsystemLogger("gateway/channels/telegram/raw-update");
  const MAX_RAW_UPDATE_CHARS = 8000;
  const MAX_RAW_UPDATE_STRING = 500;
  const MAX_RAW_UPDATE_ARRAY = 20;
  const stringifyUpdate = (update: unknown) => {
    const seen = new WeakSet();
    return JSON.stringify(update ?? null, (key, value) => {
      if (typeof value === "string" && value.length > MAX_RAW_UPDATE_STRING) {
        return `${value.slice(0, MAX_RAW_UPDATE_STRING)}...`;
      }
      if (Array.isArray(value) && value.length > MAX_RAW_UPDATE_ARRAY) {
        return [
          ...value.slice(0, MAX_RAW_UPDATE_ARRAY),
          `...(${value.length - MAX_RAW_UPDATE_ARRAY} more)`,
        ];
      }
      if (value && typeof value === "object") {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      return value;
    });
  };

  bot.use(async (ctx, next) => {
    if (shouldLogVerbose()) {
      try {
        const raw = stringifyUpdate(ctx.update);
        const preview =
          raw.length > MAX_RAW_UPDATE_CHARS ? `${raw.slice(0, MAX_RAW_UPDATE_CHARS)}...` : raw;
        rawUpdateLogger.debug(`telegram update: ${preview}`);
      } catch (err) {
        rawUpdateLogger.debug(`telegram update log failed: ${String(err)}`);
      }
    }
    await next();
    recordUpdateId(ctx);
  });

  const historyLimit = Math.max(
    0,
    telegramCfg.historyLimit ??
      cfg.messages?.groupChat?.historyLimit ??
      DEFAULT_GROUP_HISTORY_LIMIT,
  );
  const groupHistories = new Map<string, HistoryEntry[]>();
  const textLimit = resolveTextChunkLimit(cfg, "telegram", account.accountId);
  const dmPolicy = telegramCfg.dmPolicy ?? "pairing";
  const allowFrom = opts.allowFrom ?? telegramCfg.allowFrom;
  const groupAllowFrom =
    opts.groupAllowFrom ??
    telegramCfg.groupAllowFrom ??
    (telegramCfg.allowFrom && telegramCfg.allowFrom.length > 0
      ? telegramCfg.allowFrom
      : undefined) ??
    (opts.allowFrom && opts.allowFrom.length > 0 ? opts.allowFrom : undefined);
  const replyToMode = opts.replyToMode ?? telegramCfg.replyToMode ?? "first";
  const nativeEnabled = resolveNativeCommandsEnabled({
    providerId: "telegram",
    providerSetting: telegramCfg.commands?.native,
    globalSetting: cfg.commands?.native,
  });
  const nativeSkillsEnabled = resolveNativeSkillsEnabled({
    providerId: "telegram",
    providerSetting: telegramCfg.commands?.nativeSkills,
    globalSetting: cfg.commands?.nativeSkills,
  });
  const nativeDisabledExplicit = isNativeCommandsExplicitlyDisabled({
    providerSetting: telegramCfg.commands?.native,
    globalSetting: cfg.commands?.native,
  });
  const useAccessGroups = cfg.commands?.useAccessGroups !== false;
  const ackReactionScope = cfg.messages?.ackReactionScope ?? "group-mentions";
  const mediaMaxBytes = (opts.mediaMaxMb ?? telegramCfg.mediaMaxMb ?? 5) * 1024 * 1024;
  const logger = getChildLogger({ module: "telegram-auto-reply" });
  const streamMode = resolveTelegramStreamMode(telegramCfg);
  let botHasTopicsEnabled: boolean | undefined;
  const resolveBotTopicsEnabled = async (ctx?: TelegramContext) => {
    if (typeof ctx?.me?.has_topics_enabled === "boolean") {
      botHasTopicsEnabled = ctx.me.has_topics_enabled;
      return botHasTopicsEnabled;
    }
    if (typeof botHasTopicsEnabled === "boolean") {
      return botHasTopicsEnabled;
    }
    if (typeof bot.api.getMe !== "function") {
      botHasTopicsEnabled = false;
      return botHasTopicsEnabled;
    }
    try {
      const me = await withTelegramApiErrorLogging({
        operation: "getMe",
        runtime,
        fn: () => bot.api.getMe(),
      });
      botHasTopicsEnabled = Boolean(me?.has_topics_enabled);
    } catch (err) {
      logVerbose(`telegram getMe failed: ${String(err)}`);
      botHasTopicsEnabled = false;
    }
    return botHasTopicsEnabled;
  };
  const resolveGroupPolicy = (chatId: string | number) =>
    resolveChannelGroupPolicy({
      cfg,
      channel: "telegram",
      accountId: account.accountId,
      groupId: String(chatId),
    });
  const resolveGroupActivation = (params: {
    chatId: string | number;
    agentId?: string;
    messageThreadId?: number;
    sessionKey?: string;
  }) => {
    const agentId = params.agentId ?? resolveDefaultAgentId(cfg);
    const sessionKey =
      params.sessionKey ??
      `agent:${agentId}:telegram:group:${buildTelegramGroupPeerId(params.chatId, params.messageThreadId)}`;
    const storePath = resolveStorePath(cfg.session?.store, { agentId });
    try {
      const store = loadSessionStore(storePath);
      const entry = store[sessionKey];
      if (entry?.groupActivation === "always") {
        return false;
      }
      if (entry?.groupActivation === "mention") {
        return true;
      }
    } catch (err) {
      logVerbose(`Failed to load session for activation check: ${String(err)}`);
    }
    return undefined;
  };
  const resolveGroupRequireMention = (chatId: string | number) =>
    resolveChannelGroupRequireMention({
      cfg,
      channel: "telegram",
      accountId: account.accountId,
      groupId: String(chatId),
      requireMentionOverride: opts.requireMention,
      overrideOrder: "after-config",
    });
  const resolveTelegramGroupConfig = (chatId: string | number, messageThreadId?: number) => {
    const groups = telegramCfg.groups;
    if (!groups) {
      return { groupConfig: undefined, topicConfig: undefined };
    }
    const groupKey = String(chatId);
    const groupConfig = groups[groupKey] ?? groups["*"];
    const topicConfig =
      messageThreadId != null ? groupConfig?.topics?.[String(messageThreadId)] : undefined;
    return { groupConfig, topicConfig };
  };

  const baseProcessMessage = createTelegramMessageProcessor({
    bot,
    cfg,
    account,
    telegramCfg,
    historyLimit,
    groupHistories,
    dmPolicy,
    allowFrom,
    groupAllowFrom,
    ackReactionScope,
    logger,
    resolveGroupActivation,
    resolveGroupRequireMention,
    resolveTelegramGroupConfig,
    runtime,
    replyToMode,
    streamMode,
    textLimit,
    opts,
    resolveBotTopicsEnabled,
  });

  const processMessage = async (
    primaryCtx: TelegramContext,
    allMedia: Parameters<typeof baseProcessMessage>[1],
    storeAllowFrom: string[],
    options?: Parameters<typeof baseProcessMessage>[3],
  ) => {
    const msg = primaryCtx.message;
    const isPrivate = msg?.chat?.type === "private";
    if (!isPrivate) {
      await baseProcessMessage(primaryCtx, allMedia, storeAllowFrom, options);
      return;
    }
    const telegramId = msg.from?.id;
    const chatId = msg.chat.id;
    const text = (msg.text ?? msg.caption ?? "").trim();
    if (telegramId == null) {
      await baseProcessMessage(primaryCtx, allMedia, storeAllowFrom, options);
      return;
    }
    try {
      const parts = text.split(/\s+/);
      const startPayload =
        parts[0]?.toLowerCase() === "/start"
          ? parts.slice(1).join(" ").trim() || undefined
          : undefined;
      const hookResult = await onTelegramMessage({
        telegramId,
        telegramUsername: msg.from?.username,
        telegramChatId: chatId,
        displayName:
          [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ").trim() ||
          msg.from?.username,
        text,
        startPayload,
      });
      if (hookResult.directReply) {
        const replyMarkup = hookResult.replyMarkup
          ? buildInlineKeyboard(hookResult.replyMarkup)
          : undefined;
        await withTelegramApiErrorLogging({
          operation: "sendMessage (OpenJoey directReply)",
          fn: () =>
            bot.api.sendMessage(chatId, hookResult.directReply!, {
              parse_mode: "Markdown",
              reply_markup: replyMarkup,
            }),
        }).catch(() =>
          bot.api.sendMessage(chatId, hookResult.directReply!, {
            reply_markup: replyMarkup,
          }),
        );
        if (hookResult.broadcast) {
          runBroadcast(bot, hookResult.broadcast.text, chatId).catch((err) => {
            runtime.error?.(danger(`OpenJoey broadcast failed: ${String(err)}`));
            bot.api.sendMessage(chatId, `\u274C Broadcast error: ${String(err)}`).catch(() => {});
          });
        }
        return;
      }
      if (hookResult.cachedReply) {
        await withTelegramApiErrorLogging({
          operation: "sendMessage (OpenJoey cachedReply)",
          fn: () =>
            bot.api.sendMessage(chatId, hookResult.cachedReply!, { parse_mode: "Markdown" }),
        }).catch(() => bot.api.sendMessage(chatId, hookResult.cachedReply!));
        return;
      }
      if (!hookResult.shouldProcess) {
        return;
      }
      await baseProcessMessage(primaryCtx, allMedia, storeAllowFrom, {
        ...options,
        sessionKeyOverride: hookResult.sessionKey,
        responseSuffix: hookResult.responseSuffix,
        openjoeyTelegramId: telegramId,
        skillFilterOverride: hookResult.allowedSkills,
        skillFilterAllowAll: hookResult.allowAllSkills,
        userContext: hookResult.userContext,
      });

      // ── Post-reply triggers (all non-fatal) ──
      if (hookResult.userId) {
        try {
          const ojDb = getOpenJoeyDB();

          // 1. "Add to watchlist?" — when message looks like a token query
          const symbol = extractTokenSymbol(text);
          if (symbol) {
            const alreadyInWatchlist = await ojDb.isInWatchlist(hookResult.userId, symbol);
            if (!alreadyInWatchlist) {
              const keyboard = buildInlineKeyboard([
                [
                  {
                    text: `\u{1F4CB} Add ${symbol} to watchlist`,
                    callback_data: `w:add:${symbol}`,
                  },
                  { text: "Not now", callback_data: "w:dismiss" },
                ],
              ]);
              await bot.api
                .sendMessage(chatId, `\u{1F4A1} Want to track *${symbol}*?`, {
                  parse_mode: "Markdown",
                  reply_markup: keyboard,
                })
                .catch(() => {});
            }
          }

          // 2. "Favorite this skill?" — when a skill has been used 3+ times
          //    and isn't already a favorite. We check the top skill from skill_use.
          //    (The skill counter is incremented in skill-guard-hook.ts on each use.)
          const skillUses = await ojDb
            .get<{ skill_name: string; use_count: number }>(
              "user_skill_use",
              `user_id=eq.${hookResult.userId}&order=last_used.desc&limit=1`,
            )
            .catch(() => []);
          if (skillUses.length > 0 && skillUses[0].use_count === 2) {
            const recentSkill = skillUses[0].skill_name;
            const alreadyFavorited = await ojDb.isFavorited(hookResult.userId, recentSkill);
            if (!alreadyFavorited) {
              const keyboard = buildInlineKeyboard([
                [
                  {
                    text: `\u2B50 Add ${recentSkill} to favorites`,
                    callback_data: `s:fav:${recentSkill}`,
                  },
                  { text: "No thanks", callback_data: "s:dismiss" },
                ],
              ]);
              await bot.api
                .sendMessage(
                  chatId,
                  `You\u2019ve used *${recentSkill}* a couple of times now. Add to favorites for quick access?`,
                  { parse_mode: "Markdown", reply_markup: keyboard },
                )
                .catch(() => {});
            }
          }
        } catch {
          // Non-fatal: post-reply prompts fail silently
        }
      }
    } catch (err) {
      runtime.error?.(danger(`OpenJoey telegram hook failed: ${String(err)}`));
      await baseProcessMessage(primaryCtx, allMedia, storeAllowFrom, options);
    }
  };

  registerTelegramNativeCommands({
    bot,
    cfg,
    runtime,
    accountId: account.accountId,
    telegramCfg,
    allowFrom,
    groupAllowFrom,
    replyToMode,
    textLimit,
    useAccessGroups,
    nativeEnabled,
    nativeSkillsEnabled,
    nativeDisabledExplicit,
    resolveGroupPolicy,
    resolveTelegramGroupConfig,
    shouldSkipUpdate,
    opts,
  });

  // Handle emoji reactions to messages
  bot.on("message_reaction", async (ctx) => {
    try {
      const reaction = ctx.messageReaction;
      if (!reaction) {
        return;
      }
      if (shouldSkipUpdate(ctx)) {
        return;
      }

      const chatId = reaction.chat.id;
      const messageId = reaction.message_id;
      const user = reaction.user;

      // Resolve reaction notification mode (default: "own")
      const reactionMode = telegramCfg.reactionNotifications ?? "own";
      if (reactionMode === "off") {
        return;
      }
      if (user?.is_bot) {
        return;
      }
      if (reactionMode === "own" && !wasSentByBot(chatId, messageId)) {
        return;
      }

      // Detect added reactions
      const oldEmojis = new Set(
        reaction.old_reaction
          .filter((r): r is ReactionTypeEmoji => r.type === "emoji")
          .map((r) => r.emoji),
      );
      const addedReactions = reaction.new_reaction
        .filter((r): r is ReactionTypeEmoji => r.type === "emoji")
        .filter((r) => !oldEmojis.has(r.emoji));

      if (addedReactions.length === 0) {
        return;
      }

      // Build sender label
      const senderName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(" ").trim() || user.username
        : undefined;
      const senderUsername = user?.username ? `@${user.username}` : undefined;
      let senderLabel = senderName;
      if (senderName && senderUsername) {
        senderLabel = `${senderName} (${senderUsername})`;
      } else if (!senderName && senderUsername) {
        senderLabel = senderUsername;
      }
      if (!senderLabel && user?.id) {
        senderLabel = `id:${user.id}`;
      }
      senderLabel = senderLabel || "unknown";

      // Reactions target a specific message_id; the Telegram Bot API does not include
      // message_thread_id on MessageReactionUpdated, so we route to the chat-level
      // session (forum topic routing is not available for reactions).
      const isGroup = reaction.chat.type === "group" || reaction.chat.type === "supergroup";
      const isForum = reaction.chat.is_forum === true;
      const resolvedThreadId = isForum
        ? resolveTelegramForumThreadId({ isForum, messageThreadId: undefined })
        : undefined;
      const peerId = isGroup ? buildTelegramGroupPeerId(chatId, resolvedThreadId) : String(chatId);
      const parentPeer = buildTelegramParentPeer({ isGroup, resolvedThreadId, chatId });
      const route = resolveAgentRoute({
        cfg,
        channel: "telegram",
        accountId: account.accountId,
        peer: { kind: isGroup ? "group" : "dm", id: peerId },
        parentPeer,
      });
      const sessionKey = route.sessionKey;

      // Enqueue system event for each added reaction
      for (const r of addedReactions) {
        const emoji = r.emoji;
        const text = `Telegram reaction added: ${emoji} by ${senderLabel} on msg ${messageId}`;
        enqueueSystemEvent(text, {
          sessionKey: sessionKey,
          contextKey: `telegram:reaction:add:${chatId}:${messageId}:${user?.id ?? "anon"}:${emoji}`,
        });
        logVerbose(`telegram: reaction event enqueued: ${text}`);
      }
    } catch (err) {
      runtime.error?.(danger(`telegram reaction handler failed: ${String(err)}`));
    }
  });

  registerTelegramHandlers({
    cfg,
    accountId: account.accountId,
    bot,
    opts,
    runtime,
    mediaMaxBytes,
    telegramCfg,
    groupAllowFrom,
    resolveGroupPolicy,
    resolveTelegramGroupConfig,
    shouldSkipUpdate,
    processMessage,
    logger,
  });

  return bot;
}

export function createTelegramWebhookCallback(bot: Bot, path = "/telegram-webhook") {
  return { path, handler: webhookCallback(bot, "http") };
}
