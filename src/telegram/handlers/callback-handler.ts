/**
 * Telegram Callback Handler
 * Handles all callback queries (OpenJoey, pagination, model selection)
 * Target: < 300 lines
 */

import type { Message } from "@grammyjs/types";
import type { Bot, Context } from "grammy";
import type { OpenClawConfig } from "../../config/config.js";
import type { TelegramAccountConfig } from "../../config/types.telegram.js";
import type { RuntimeEnv } from "../../runtime.js";
import type { TelegramContext } from "../bot/types.js";
import { resolveDefaultAgentId } from "../../agents/agent-scope.js";
import { buildCommandsPaginationKeyboard } from "../../auto-reply/reply/commands-info.js";
import { buildModelsProviderData } from "../../auto-reply/reply/commands-models.js";
import { listSkillCommandsForAgents } from "../../auto-reply/skill-commands.js";
import { buildCommandsMessagePaginated } from "../../auto-reply/status.js";
import { danger } from "../../globals.js";
import { consumePendingForSend, clearPending } from "../../openjoey/broadcast-state.js";
import { runBroadcast } from "../../openjoey/broadcast.js";
import { handleOpenJoeyCallback, isOpenJoeyCallback } from "../../openjoey/callback-handler.js";
import { isAdmin } from "../../openjoey/session-isolation.js";
import { readChannelAllowFromStore } from "../../pairing/pairing-store.js";
import {
  buildModelsKeyboard,
  calculateTotalPages,
  getModelsPageSize,
  parseModelCallbackData,
} from "../../telegram/model-buttons.js";
import { withTelegramApiErrorLogging } from "../api-logging.js";
import { normalizeAllowFrom, isSenderAllowed } from "../bot-access.js";
import { resolveTelegramForumThreadId } from "../bot/helpers.js";
import { resolveTelegramInlineButtonsScope } from "../inline-buttons.js";
import { buildProviderKeyboard } from "../model-buttons.js";
import { buildInlineKeyboard } from "../send.js";

export interface CallbackHandlerConfig {
  cfg: OpenClawConfig;
  bot: Bot;
  runtime: RuntimeEnv;
  accountId?: string;
  processMessage: (
    ctx: TelegramContext,
    media: never[],
    allowFrom: string[],
    opts?: { forceWasMentioned?: boolean; messageIdOverride?: string },
  ) => Promise<void>;
  telegramCfg: TelegramAccountConfig;
  groupAllowFrom: Array<string | number>;
}

export function createCallbackHandler(config: CallbackHandlerConfig) {
  const { cfg, bot, runtime, accountId, processMessage, telegramCfg, groupAllowFrom } = config;

  return async (ctx: Context): Promise<void> => {
    const callback = ctx.callbackQuery;
    if (!callback) return;

    const data = (callback.data ?? "").trim();
    const callbackMessage = callback.message;
    if (!data || !callbackMessage) {
      await bot.api.answerCallbackQuery(callback.id).catch(() => {});
      return;
    }

    const chatId = callbackMessage.chat.id;
    const isGroup =
      callbackMessage.chat.type === "group" || callbackMessage.chat.type === "supergroup";
    const messageThreadId = callbackMessage.message_thread_id;
    const isForum = callbackMessage.chat.is_forum === true;
    const resolvedThreadId = resolveTelegramForumThreadId({ isForum, messageThreadId });

    // Check inline button scope and DM policy
    const inlineButtonsScope = resolveTelegramInlineButtonsScope({ cfg, accountId });
    if (inlineButtonsScope === "off") return;
    if (inlineButtonsScope === "dm" && isGroup) return;
    if (inlineButtonsScope === "group" && !isGroup) return;

    // Check allowlist for inline buttons
    if (inlineButtonsScope === "allowlist") {
      const storeAllowFrom = await readChannelAllowFromStore("telegram", process.env).catch(
        () => [],
      );
      const dmPolicy = telegramCfg.dmPolicy ?? "pairing";
      const senderId = callback.from?.id ? String(callback.from.id) : "";
      const senderUsername = callback.from?.username ?? "";

      if (!isGroup) {
        if (dmPolicy === "disabled") return;
        // DM allowlist check would go here
      } else {
        // Group allowlist check
        const normalizedAllowFrom = normalizeAllowFrom(groupAllowFrom);
        const allowed =
          normalizedAllowFrom.hasWildcard ||
          (normalizedAllowFrom.hasEntries &&
            isSenderAllowed({
              allow: normalizedAllowFrom,
              senderId,
              senderUsername,
            }));
        if (!allowed) return;
      }
    }

    // Handle OpenJoey callbacks
    if (isOpenJoeyCallback(data)) {
      await handleOpenJoeyCallbackQuery(ctx, callback, data, chatId, callbackMessage.message_id);
      return;
    }

    // Handle pagination
    const paginationMatch = data.match(/^commands_page_(\d+|noop)(?::(.+))?$/);
    if (paginationMatch) {
      await handlePagination(callback, paginationMatch, chatId, callbackMessage.message_id);
      return;
    }

    // Handle model selection
    const modelCallback = parseModelCallbackData(data);
    if (modelCallback) {
      await handleModelSelection(callback, modelCallback, chatId, callbackMessage.message_id);
      return;
    }

    // Default: treat as command
    await handleDefaultCallback(ctx, callback, data, chatId, callbackMessage, isGroup);
  };

  async function handleOpenJoeyCallbackQuery(
    ctx: Context,
    callback: NonNullable<Context["callbackQuery"]>,
    data: string,
    chatId: number,
    messageId: number,
  ): Promise<void> {
    const telegramId = callback.from?.id;
    if (!telegramId) {
      await bot.api.answerCallbackQuery(callback.id).catch(() => {});
      return;
    }

    // Admin-only announce commands
    if ((data === "announce:confirm" || data === "announce:cancel") && !isAdmin(telegramId)) {
      await bot.api.answerCallbackQuery(callback.id, { text: "Admin only." }).catch(() => {});
      return;
    }

    if (data === "announce:cancel") {
      clearPending(telegramId);
      await bot.api.answerCallbackQuery(callback.id, { text: "Cancelled." }).catch(() => {});
      return;
    }

    if (data === "announce:confirm") {
      const text = consumePendingForSend(telegramId);
      await bot.api.answerCallbackQuery(callback.id, { text: "Sending…" }).catch(() => {});
      if (text) {
        runBroadcast(bot, text, chatId).catch((err) => {
          runtime.error?.(danger(`OpenJoey broadcast failed: ${String(err)}`));
        });
      }
      return;
    }

    // Standard OpenJoey callback
    try {
      const { getOpenJoeyDB } = await import("../../openjoey/supabase-client.js");
      const ojDb = getOpenJoeyDB();
      const ojUser = await ojDb.getUser(telegramId);

      if (!ojUser) {
        await bot.api.answerCallbackQuery(callback.id).catch(() => {});
        return;
      }

      const ojResult = await handleOpenJoeyCallback(data, ojUser.id, telegramId);
      if (!ojResult) {
        await bot.api.answerCallbackQuery(callback.id).catch(() => {});
        return;
      }

      await bot.api.answerCallbackQuery(callback.id, { text: ojResult.answerText }).catch(() => {});

      if (ojResult.editText) {
        const editText = ojResult.breadcrumb
          ? `${ojResult.breadcrumb}\n\n${ojResult.editText}`
          : ojResult.editText;
        const editKeyboard = ojResult.editMarkup
          ? buildInlineKeyboard(ojResult.editMarkup)
          : undefined;

        try {
          await bot.api.editMessageText(chatId, messageId, editText, {
            parse_mode: "Markdown",
            reply_markup: editKeyboard,
          });
        } catch {
          await bot.api
            .editMessageText(
              chatId,
              messageId,
              editText,
              editKeyboard ? { reply_markup: editKeyboard } : undefined,
            )
            .catch(() => {});
        }
      }

      if (ojResult.sendText) {
        const sendKeyboard = ojResult.sendMarkup
          ? buildInlineKeyboard(ojResult.sendMarkup)
          : undefined;
        await withTelegramApiErrorLogging({
          operation: "sendMessage (OpenJoey callback)",
          runtime,
          fn: () =>
            bot.api.sendMessage(chatId, ojResult.sendText!, {
              parse_mode: "Markdown",
              reply_markup: sendKeyboard,
            }),
        }).catch(() =>
          bot.api.sendMessage(chatId, ojResult.sendText!, { reply_markup: sendKeyboard }),
        );
      }
    } catch (err) {
      runtime.error?.(danger(`OpenJoey callback handler failed: ${String(err)}`));
      await bot.api.answerCallbackQuery(callback.id).catch(() => {});
    }
  }

  async function handlePagination(
    callback: NonNullable<Context["callbackQuery"]>,
    match: RegExpMatchArray,
    chatId: number,
    messageId: number,
  ): Promise<void> {
    const pageValue = match[1];
    if (pageValue === "noop") return;

    const page = Number.parseInt(pageValue, 10);
    if (Number.isNaN(page) || page < 1) return;

    const agentId = match[2]?.trim() || resolveDefaultAgentId(cfg) || undefined;
    const skillCommands = listSkillCommandsForAgents({
      cfg,
      agentIds: agentId ? [agentId] : undefined,
    });
    const result = buildCommandsMessagePaginated(cfg, skillCommands, { page, surface: "telegram" });

    const keyboard =
      result.totalPages > 1
        ? buildInlineKeyboard(
            buildCommandsPaginationKeyboard(result.currentPage, result.totalPages, agentId),
          )
        : undefined;

    try {
      await bot.api.editMessageText(
        chatId,
        messageId,
        result.text,
        keyboard ? { reply_markup: keyboard } : undefined,
      );
    } catch (editErr) {
      if (!String(editErr).includes("message is not modified")) throw editErr;
    }
  }

  async function handleModelSelection(
    callback: NonNullable<Context["callbackQuery"]>,
    modelCallback: ReturnType<typeof parseModelCallbackData>,
    chatId: number,
    messageId: number,
  ): Promise<void> {
    if (!modelCallback) return;

    const modelData = await buildModelsProviderData(cfg);
    const { byProvider, providers } = modelData;

    async function editMessageWithButtons(
      text: string,
      buttons: ReturnType<typeof buildProviderKeyboard>,
    ) {
      const keyboard = buildInlineKeyboard(buttons);
      try {
        await bot.api.editMessageText(
          chatId,
          messageId,
          text,
          keyboard ? { reply_markup: keyboard } : undefined,
        );
      } catch (editErr) {
        if (!String(editErr).includes("message is not modified")) throw editErr;
      }
    }

    if (modelCallback.type === "providers" || modelCallback.type === "back") {
      if (providers.length === 0) {
        await editMessageWithButtons("No providers available.", []);
        return;
      }
      const providerInfos: { id: string; count: number }[] = providers.map((p) => ({
        id: p,
        count: byProvider.get(p)?.size ?? 0,
      }));
      const buttons = buildProviderKeyboard(providerInfos);
      await editMessageWithButtons("Select a provider:", buttons);
      return;
    }

    if (modelCallback.type === "list") {
      const { provider, page } = modelCallback;
      const modelSet = byProvider.get(provider);
      if (!modelSet || modelSet.size === 0) {
        const providerInfos = providers.map((p) => ({
          id: p,
          count: byProvider.get(p)?.size ?? 0,
        }));
        const buttons = buildProviderKeyboard(providerInfos);
        await editMessageWithButtons(
          `Unknown provider: ${provider}\n\nSelect a provider:`,
          buttons,
        );
        return;
      }

      const models = [...modelSet].sort();
      const pageSize = getModelsPageSize();
      const totalPages = calculateTotalPages(models.length, pageSize);
      const safePage = Math.max(1, Math.min(page, totalPages));

      const buttons = buildModelsKeyboard({
        provider,
        models,
        currentPage: safePage,
        totalPages,
        pageSize,
      });
      const text = `Models (${provider}) — ${models.length} available`;
      await editMessageWithButtons(text, buttons);
    }
  }

  async function handleDefaultCallback(
    ctx: Context,
    callback: NonNullable<Context["callbackQuery"]>,
    data: string,
    chatId: number,
    callbackMessage: Message,
    isGroup: boolean,
  ): Promise<void> {
    const storeAllowFrom = await readChannelAllowFromStore("telegram", process.env).catch(() => []);
    const syntheticMessage = {
      ...callbackMessage,
      from: callback.from,
      text: data,
      caption: undefined,
      caption_entities: undefined,
      entities: undefined,
    };

    const getFile = typeof ctx.getFile === "function" ? ctx.getFile.bind(ctx) : async () => ({});
    await processMessage({ message: syntheticMessage, me: ctx.me, getFile }, [], storeAllowFrom, {
      forceWasMentioned: true,
      messageIdOverride: callback.id,
    });
  }
}
