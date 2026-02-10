/**
 * OpenJoey admin broadcast: send one message to all registered users.
 * Rate-limited to respect Telegram ~30 msg/s; reports success/failed/blocked to admin.
 */

import type { Bot } from "grammy";
import { getOpenJoeyDB } from "./supabase-client.js";

const BATCH_SIZE = 25;
const DELAY_MS = 100;

export interface BroadcastResult {
  success: number;
  failed: number;
  blocked: number;
  total: number;
}

/**
 * Send the same message to all users (by telegram_id). Runs in background; when done
 * sends a summary to adminChatId. Use Markdown for the message.
 */
export async function runBroadcast(
  bot: Bot,
  text: string,
  adminChatId: number,
): Promise<BroadcastResult> {
  const db = getOpenJoeyDB();
  const telegramIds = await db.getAllTelegramIdsForBroadcast();
  const result: BroadcastResult = { success: 0, failed: 0, blocked: 0, total: telegramIds.length };

  for (let i = 0; i < telegramIds.length; i += BATCH_SIZE) {
    const batch = telegramIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (chatId) => {
        try {
          await bot.api.sendMessage(chatId, text, { parse_mode: "Markdown" });
          result.success += 1;
        } catch (err: unknown) {
          const code =
            err && typeof err === "object" && "error_code" in err
              ? (err as { error_code?: number }).error_code
              : undefined;
          if (code === 403) {
            result.blocked += 1;
          } else {
            result.failed += 1;
          }
        }
      }),
    );
    if (i + BATCH_SIZE < telegramIds.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const summary =
    `\u{1F4CA} *Broadcast complete*\n\n` +
    `\u2705 Sent: ${result.success}\n` +
    `\u274C Failed: ${result.failed}\n` +
    `\u{1F6AB} Blocked: ${result.blocked}\n` +
    `Total: ${result.total}`;
  await bot.api.sendMessage(adminChatId, summary, { parse_mode: "Markdown" }).catch(() => {});

  return result;
}
