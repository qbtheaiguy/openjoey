/**
 * Telegram Message Processor
 * Handles message debouncing, routing, and V1 integration
 * Target: < 300 lines
 */

import type { Message } from "@grammyjs/types";
import type { Bot, Context } from "grammy";
import type { OpenClawConfig } from "../../config/config.js";
import type { RuntimeEnv } from "../../runtime.js";
import type { TelegramMediaRef } from "../bot-message-context.js";
import type { TelegramContext } from "../bot/types.js";
import { isControlCommandMessage } from "../../auto-reply/command-detection.js";
import {
  createInboundDebouncer,
  resolveInboundDebounceMs,
} from "../../auto-reply/inbound-debounce.js";
import { danger, logVerbose } from "../../globals.js";

export interface MessageProcessorConfig {
  cfg: OpenClawConfig;
  bot: Bot;
  runtime: RuntimeEnv;
  processMessage: (
    ctx: TelegramContext,
    media: TelegramMediaRef[],
    allowFrom: string[],
    opts?: { forceWasMentioned?: boolean; messageIdOverride?: string },
  ) => Promise<void>;
  shouldSkipUpdate: (ctx: Context) => boolean;
  logger: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
  v1Handler?: (ctx: Context, text: string) => Promise<boolean>;
}

export interface DebounceEntry {
  ctx: TelegramContext;
  msg: Message;
  allMedia: TelegramMediaRef[];
  storeAllowFrom: string[];
  debounceKey: string | null;
  botUsername?: string;
}

/**
 * Create message processor with debouncing
 */
export function createMessageProcessor(config: MessageProcessorConfig) {
  const { cfg, bot, runtime, processMessage, shouldSkipUpdate, logger, v1Handler } = config;

  const debounceMs = resolveInboundDebounceMs({ cfg, channel: "telegram" });

  const inboundDebouncer = createInboundDebouncer<DebounceEntry>({
    debounceMs,
    buildKey: (entry) => entry.debounceKey,
    shouldDebounce: (entry) => {
      if (entry.allMedia.length > 0) return false;
      const text = entry.msg.text ?? entry.msg.caption ?? "";
      return !isControlCommandMessage(text, cfg, { botUsername: entry.botUsername });
    },
    onFlush: async (entries) => {
      const last = entries.at(-1);
      if (!last) return;

      if (entries.length === 1) {
        await processSingleMessage(last);
        return;
      }

      // Combine multiple text fragments
      const combinedText = entries
        .map((e) => e.msg.text ?? e.msg.caption ?? "")
        .filter(Boolean)
        .join("\n");

      if (!combinedText.trim()) return;

      const first = entries[0];
      const baseCtx = first.ctx;
      const getFile =
        typeof baseCtx.getFile === "function" ? baseCtx.getFile.bind(baseCtx) : async () => ({});

      const syntheticMessage: Message = {
        ...first.msg,
        text: combinedText,
        caption: undefined,
        caption_entities: undefined,
        entities: undefined,
        date: last.msg.date ?? first.msg.date,
      };

      const messageIdOverride = last.msg.message_id ? String(last.msg.message_id) : undefined;

      await processMessage(
        { message: syntheticMessage, me: baseCtx.me, getFile },
        [],
        first.storeAllowFrom,
        messageIdOverride ? { messageIdOverride } : undefined,
      );
    },
    onError: (err) => {
      runtime.error?.(danger(`telegram debounce flush failed: ${String(err)}`));
    },
  });

  async function processSingleMessage(entry: DebounceEntry): Promise<void> {
    const { ctx, msg, allMedia, storeAllowFrom, debounceKey, botUsername } = entry;

    try {
      // Check for V1 trading query
      const text = msg.text ?? msg.caption ?? "";
      if (v1Handler && text && !isControlCommandMessage(text, cfg, { botUsername })) {
        const handled = await v1Handler(ctx as Context, text);
        if (handled) return; // V1 handled it
      }

      // Default processing
      await processMessage(ctx, allMedia, storeAllowFrom, {
        messageIdOverride: debounceKey ?? undefined,
      });
    } catch (err) {
      logger.error(`message processing failed: ${String(err)}`);
    }
  }

  return {
    enqueue: (entry: DebounceEntry) => inboundDebouncer.enqueue(entry),
  };
}

/**
 * Check if text is a trading/V1 query
 */
export function isV1Query(text: string): boolean {
  const patterns = [
    /should i (buy|sell|trade)/i,
    /what about (btc|eth|sol|ray|bitcoin|ethereum|solana)/i,
    /analyze (btc|eth|sol|ray)/i,
    /price of (btc|eth|sol)/i,
    /signal for/i,
    /portfolio/i,
    /trending/i,
    /alert/i,
    /market (analysis|summary)/i,
    /whale/i,
    /sentiment/i,
    /rsi|macd|ema|bollinger/i,
  ];
  return patterns.some((p) => p.test(text));
}
