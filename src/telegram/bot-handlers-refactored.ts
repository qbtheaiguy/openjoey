/**
 * Telegram Bot Handlers - Main Orchestrator
 * Modular version: delegates to specialized handlers
 * Target: < 300 lines
 */

import type { Bot, Context } from "grammy";
import type { OpenClawConfig } from "../config/config.js";
import type { TelegramAccountConfig } from "../config/types.telegram.js";
import type { RuntimeEnv } from "../runtime.js";
import type { TelegramMediaRef } from "./bot-message-context.js";
import type { TelegramContext } from "./bot/types.js";
import { readChannelAllowFromStore } from "../pairing/pairing-store.js";
import { isSenderAllowed, type NormalizedAllowFrom } from "./bot-access.js";
import { createTelegramMessageProcessor } from "./bot-message.js";
import { resolveTelegramForumThreadId, resolveTelegramGroupConfig } from "./bot/helpers.js";
import { createCallbackHandler } from "./handlers/callback-handler.js";
import { createGroupManager } from "./handlers/group-manager.js";
import { createMediaHandler } from "./handlers/media-handler.js";
import { createMessageProcessor, isV1Query } from "./handlers/message-processor.js";

export interface RegisterTelegramHandlerParams {
  cfg: OpenClawConfig;
  accountId?: string;
  bot: Bot;
  opts: { token: string; proxyFetch?: typeof fetch };
  runtime: RuntimeEnv;
  mediaMaxBytes: number;
  telegramCfg: TelegramAccountConfig;
  groupAllowFrom: Array<string | number>;
  resolveGroupPolicy: (chatId: number | string) => { allowlistEnabled: boolean; allowed: boolean };
  shouldSkipUpdate: (ctx: Context) => boolean;
  processMessage: (
    ctx: TelegramContext,
    media: TelegramMediaRef[],
    allowFrom: string[],
    opts?: { forceWasMentioned?: boolean; messageIdOverride?: string },
  ) => Promise<void>;
  logger: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

/**
 * Main handler registration - orchestrates all modular handlers
 */
export async function registerTelegramHandlers(
  params: RegisterTelegramHandlerParams,
): Promise<void> {
  const {
    cfg,
    accountId,
    bot,
    opts,
    runtime,
    mediaMaxBytes,
    telegramCfg,
    groupAllowFrom,
    resolveGroupPolicy,
    shouldSkipUpdate,
    processMessage,
    logger,
  } = params;

  // Create specialized handlers
  const messageProcessor = createMessageProcessor({
    cfg,
    bot,
    runtime,
    processMessage,
    shouldSkipUpdate,
    logger,
    v1Handler: createV1Handler(),
  });

  const callbackHandler = createCallbackHandler({
    cfg,
    bot,
    runtime,
    accountId,
    processMessage,
    telegramCfg,
    groupAllowFrom,
  });

  const mediaHandler = createMediaHandler({
    runtime,
    mediaMaxBytes,
    processMessage,
  });

  const groupManager = createGroupManager({
    cfg,
    accountId,
    runtime,
  });

  // Register event handlers
  bot.on("callback_query", async (ctx) => {
    if (shouldSkipUpdate(ctx)) return;
    await callbackHandler(ctx);
  });

  bot.on("message:migrate_to_chat_id", async (ctx) => {
    if (shouldSkipUpdate(ctx)) return;
    await groupManager.handleGroupMigration(ctx);
  });

  bot.on("message", async (ctx) => {
    if (shouldSkipUpdate(ctx)) return;
    await handleMessage(ctx);
  });

  // Main message handler
  async function handleMessage(ctx: Context): Promise<void> {
    const msg = ctx.message;
    if (!msg) return;

    const chatId = msg.chat.id;
    const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
    const messageThreadId = msg.message_thread_id;
    const isForum = msg.chat.is_forum === true;
    const resolvedThreadId = resolveTelegramForumThreadId({ isForum, messageThreadId });

    const storeAllowFrom = await readChannelAllowFromStore("telegram").catch(() => []);
    const { groupConfig, topicConfig } = resolveTelegramGroupConfig(chatId, resolvedThreadId);

    // Group policy checks
    if (
      isGroup &&
      !checkGroupPolicy(
        chatId,
        isGroup,
        groupConfig,
        topicConfig,
        msg,
        storeAllowFrom,
        groupAllowFrom as string[],
        resolveGroupPolicy,
        logger,
      )
    ) {
      return;
    }

    const text = typeof msg.text === "string" ? msg.text : undefined;
    const isCommandLike = (text ?? "").trim().startsWith("/");

    // Handle text fragments
    if (text && !isCommandLike) {
      const senderId = msg.from?.id != null ? String(msg.from.id) : "unknown";
      const key = `text:${chatId}:${resolvedThreadId ?? "main"}:${senderId}`;

      const handled = mediaHandler.handleTextFragment(
        key,
        msg,
        ctx as TelegramContext,
        text,
        isCommandLike,
      );
      if (handled) return; // Buffered for later processing
    }

    // Handle media groups
    const mediaGroupId = msg.media_group_id;
    if (mediaGroupId) {
      await mediaHandler.handleMediaGroup(
        mediaGroupId,
        msg,
        ctx as TelegramContext,
        storeAllowFrom,
      );
      return;
    }

    // Process single message
    const senderId = msg.from?.id ? String(msg.from.id) : "";
    const conversationKey =
      resolvedThreadId != null ? `${chatId}:topic:${resolvedThreadId}` : String(chatId);
    const debounceKey = senderId
      ? `telegram:${accountId ?? "default"}:${conversationKey}:${senderId}`
      : null;

    await messageProcessor.enqueue({
      ctx: ctx as TelegramContext,
      msg,
      allMedia: [],
      storeAllowFrom,
      debounceKey,
      botUsername: ctx.me?.username,
    });
  }

  // V1 handler factory
  function createV1Handler(): (ctx: Context, text: string) => Promise<boolean> {
    return async (ctx: Context, text: string): Promise<boolean> => {
      if (!isV1Query(text)) return false;

      // Import V1 bridge dynamically to avoid circular dependencies
      try {
        const { handleV1Message } = await import("../openjoey/v1-bridge.js");
        return await handleV1Message(ctx, text);
      } catch {
        return false;
      }
    };
  }

  // Register V1 commands separately
  try {
    const { setupV1Integration } = await import("../openjoey/v1-bridge.js");
    setupV1Integration(bot);
    logger.info("[telegram] V1 commands registered");
  } catch (error) {
    logger.warn("[telegram] Failed to register V1 commands:", { error: String(error) });
  }

  logger.info("[telegram] Modular handlers registered");
}

/**
 * Check if group message should be processed
 */
function checkGroupPolicy(
  chatId: number,
  isGroup: boolean,
  groupConfig: ReturnType<typeof resolveTelegramGroupConfig>["groupConfig"],
  topicConfig: ReturnType<typeof resolveTelegramGroupConfig>["topicConfig"],
  msg: NonNullable<Context["message"]>,
  storeAllowFrom: string[],
  groupAllowFrom: string[],
  resolveGroupPolicy: (chatId: number | string) => { allowlistEnabled: boolean; allowed: boolean },
  logger: RegisterTelegramHandlerParams["logger"],
): boolean {
  if (!isGroup) return true;

  if (groupConfig?.enabled === false) {
    logger.info(`Blocked telegram group ${chatId} (group disabled)`);
    return false;
  }

  if (topicConfig?.enabled === false) {
    logger.info(`Blocked telegram topic ${chatId} (topic disabled)`);
    return false;
  }

  // Group policy filtering
  const groupAllowlist = resolveGroupPolicy(chatId);
  if (groupAllowlist.allowlistEnabled && !groupAllowlist.allowed) {
    logger.info(
      `Skipping group message: chatId=${chatId}, title=${msg.chat.title}, reason=not-allowed`,
    );
    return false;
  }

  return true;
}
