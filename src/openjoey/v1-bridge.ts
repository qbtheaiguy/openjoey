/**
 * OpenJoey V1 Telegram Bridge
 * Connects existing Telegram bot to full V1 conversation engine and services
 */

import type { Context } from "grammy";
import {
  processV1Message,
  isV1TradingQuery,
  registerV1Commands,
} from "./telegram-v1-integration.js";

export { isV1TradingQuery };

/**
 * Handle V1 message with full conversation engine
 */
export async function handleV1Message(ctx: Context, text: string): Promise<boolean> {
  // Use the full V1 integration
  return await processV1Message(ctx, text);
}

/**
 * Register all V1 commands on the bot
 */
export function setupV1Integration(bot: any): void {
  registerV1Commands(bot);
}
