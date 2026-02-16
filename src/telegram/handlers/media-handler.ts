/**
 * Telegram Media Handler
 * Handles media groups and text fragment processing
 * Target: < 300 lines
 */

import type { Message } from "@grammyjs/types";
import type { RuntimeEnv } from "../../runtime.js";
import type { TelegramMediaRef } from "../bot-message-context.js";
import type { TelegramContext } from "../bot/types.js";
import { danger } from "../../globals.js";
import { resolveMedia } from "../bot/delivery.js";

// Constants
export const MEDIA_GROUP_TIMEOUT_MS = 1000;
const TELEGRAM_TEXT_FRAGMENT_START_THRESHOLD_CHARS = 4000;
const TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS = 1500;
const TELEGRAM_TEXT_FRAGMENT_MAX_ID_GAP = 1;
const TELEGRAM_TEXT_FRAGMENT_MAX_PARTS = 12;
const TELEGRAM_TEXT_FRAGMENT_MAX_TOTAL_CHARS = 50_000;

export interface MediaGroupEntry {
  messages: Array<{ msg: Message; ctx: TelegramContext }>;
  timer: ReturnType<typeof setTimeout>;
}

export interface TextFragmentEntry {
  key: string;
  messages: Array<{ msg: Message; ctx: TelegramContext; receivedAtMs: number }>;
  timer: ReturnType<typeof setTimeout>;
}

export interface MediaHandlerConfig {
  runtime: RuntimeEnv;
  mediaMaxBytes: number;
  processMessage: (
    ctx: TelegramContext,
    media: TelegramMediaRef[],
    allowFrom: string[],
    opts?: { messageIdOverride?: string },
  ) => Promise<void>;
}

export function createMediaHandler(config: MediaHandlerConfig) {
  const { runtime, mediaMaxBytes, processMessage } = config;

  const mediaGroupBuffer = new Map<string, MediaGroupEntry>();
  let mediaGroupProcessing: Promise<void> = Promise.resolve();

  const textFragmentBuffer = new Map<string, TextFragmentEntry>();
  let textFragmentProcessing: Promise<void> = Promise.resolve();

  return {
    handleMediaGroup,
    handleTextFragment,
    scheduleTextFragmentFlush,
  };

  async function handleMediaGroup(
    mediaGroupId: string,
    msg: Message,
    ctx: TelegramContext,
    storeAllowFrom: string[],
  ): Promise<void> {
    const existing = mediaGroupBuffer.get(mediaGroupId);

    if (existing) {
      clearTimeout(existing.timer);
      existing.messages.push({ msg, ctx });
      existing.timer = setTimeout(async () => {
        mediaGroupBuffer.delete(mediaGroupId);
        mediaGroupProcessing = mediaGroupProcessing
          .then(async () => {
            await flushMediaGroup(existing, storeAllowFrom);
          })
          .catch(() => undefined);
        await mediaGroupProcessing;
      }, MEDIA_GROUP_TIMEOUT_MS);
    } else {
      const entry: MediaGroupEntry = {
        messages: [{ msg, ctx }],
        timer: setTimeout(async () => {
          mediaGroupBuffer.delete(mediaGroupId);
          mediaGroupProcessing = mediaGroupProcessing
            .then(async () => {
              await flushMediaGroup(entry, storeAllowFrom);
            })
            .catch(() => undefined);
          await mediaGroupProcessing;
        }, MEDIA_GROUP_TIMEOUT_MS),
      };
      mediaGroupBuffer.set(mediaGroupId, entry);
    }
  }

  async function flushMediaGroup(entry: MediaGroupEntry, storeAllowFrom: string[]): Promise<void> {
    try {
      entry.messages.sort((a, b) => a.msg.message_id - b.msg.message_id);

      const captionMsg = entry.messages.find((m) => m.msg.caption || m.msg.text);
      const primaryEntry = captionMsg ?? entry.messages[0];

      const allMedia: TelegramMediaRef[] = [];
      for (const { ctx: msgCtx } of entry.messages) {
        // Media resolution would happen here
        const media = await resolveMedia(msgCtx, mediaMaxBytes, "", undefined);
        if (media) {
          allMedia.push({
            path: media.path,
            contentType: media.contentType,
            stickerMetadata: media.stickerMetadata,
          });
        }
      }

      await processMessage(primaryEntry.ctx, allMedia, storeAllowFrom);
    } catch (err) {
      runtime.error?.(danger(`media group handler failed: ${String(err)}`));
    }
  }

  function handleTextFragment(
    key: string,
    msg: Message,
    ctx: TelegramContext,
    text: string,
    isCommandLike: boolean,
  ): boolean {
    if (isCommandLike) return false;

    const nowMs = Date.now();
    const existing = textFragmentBuffer.get(key);

    if (existing) {
      const last = existing.messages.at(-1);
      const lastMsgId = last?.msg.message_id;
      const lastReceivedAtMs = last?.receivedAtMs ?? nowMs;
      const idGap = typeof lastMsgId === "number" ? msg.message_id - lastMsgId : Infinity;
      const timeGapMs = nowMs - lastReceivedAtMs;

      const canAppend =
        idGap > 0 &&
        idGap <= TELEGRAM_TEXT_FRAGMENT_MAX_ID_GAP &&
        timeGapMs >= 0 &&
        timeGapMs <= TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS;

      if (canAppend) {
        const currentTotalChars = existing.messages.reduce(
          (sum, m) => sum + (m.msg.text?.length ?? 0),
          0,
        );
        const nextTotalChars = currentTotalChars + text.length;

        if (
          existing.messages.length + 1 <= TELEGRAM_TEXT_FRAGMENT_MAX_PARTS &&
          nextTotalChars <= TELEGRAM_TEXT_FRAGMENT_MAX_TOTAL_CHARS
        ) {
          existing.messages.push({ msg, ctx, receivedAtMs: nowMs });
          scheduleTextFragmentFlush(existing, key);
          return true; // Handled (buffered)
        }
      }

      // Not appendable: flush existing first
      clearTimeout(existing.timer);
      textFragmentBuffer.delete(key);
      textFragmentProcessing = textFragmentProcessing
        .then(async () => {
          await flushTextFragments(existing);
        })
        .catch(() => undefined);
    }

    // Check if we should start new fragment buffer
    const shouldStart = text.length >= TELEGRAM_TEXT_FRAGMENT_START_THRESHOLD_CHARS;
    if (shouldStart) {
      const entry: TextFragmentEntry = {
        key,
        messages: [{ msg, ctx, receivedAtMs: nowMs }],
        timer: setTimeout(() => {}, TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS),
      };
      textFragmentBuffer.set(key, entry);
      scheduleTextFragmentFlush(entry, key);
      return true; // Handled (buffered)
    }

    return false; // Not a text fragment, process normally
  }

  function scheduleTextFragmentFlush(entry: TextFragmentEntry, key: string): void {
    clearTimeout(entry.timer);
    entry.timer = setTimeout(async () => {
      textFragmentBuffer.delete(key);
      textFragmentProcessing = textFragmentProcessing
        .then(async () => {
          await flushTextFragments(entry);
        })
        .catch(() => undefined);
      await textFragmentProcessing;
    }, TELEGRAM_TEXT_FRAGMENT_MAX_GAP_MS);
  }

  async function flushTextFragments(entry: TextFragmentEntry): Promise<void> {
    // This would be implemented to process combined text
    // For now, placeholder
  }
}
