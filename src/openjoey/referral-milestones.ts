/**
 * OpenJoey Referral milestone nudge (§9.9)
 *
 * When total_earned or converted_referrals crosses a threshold, send a one-time
 * follow-up: "You've earned $5 in referrals! Share again?" with [Share].
 * Call after rewardReferral(referredUserId) with the returned referrer_id.
 */

import type { KeyboardButton } from "./keyboard-builder.js";
import { getOpenJoeyDB } from "./supabase-client.js";

const MILESTONES = [
  {
    key: "first_converted",
    check: (stats: { converted_referrals: number }) => stats.converted_referrals >= 1,
    message: "Your first referral converted! Share again?",
  },
  {
    key: "5",
    check: (stats: { total_earned: number }) => stats.total_earned >= 5,
    message: "You've earned $5 in referrals! Share again?",
  },
  {
    key: "10",
    check: (stats: { total_earned: number }) => stats.total_earned >= 10,
    message: "You've earned $10 in referrals! Share again?",
  },
] as const;

export type SendReferralMilestoneMessage = (
  telegramId: number,
  text: string,
  markup?: KeyboardButton[][],
) => Promise<void>;

/**
 * Check if the referrer just crossed any milestone and send a one-time nudge.
 * Call this after rewardReferral(referredUserId) with the returned referrer_id.
 * sendMessage is provided by the gateway (e.g. bot.api.sendMessage with reply_markup).
 */
export async function checkAndSendReferralMilestones(
  referrerId: string,
  sendMessage: SendReferralMilestoneMessage,
): Promise<void> {
  const db = getOpenJoeyDB();
  const user = await db.getUserById(referrerId);
  if (!user?.telegram_id) {
    return;
  }

  const stats = await db.getReferralStats(referrerId);
  if (!stats) {
    return;
  }

  const sent = await db.getMilestoneSends(referrerId).catch(() => []);
  const sentSet = new Set(sent);

  for (const m of MILESTONES) {
    if (sentSet.has(m.key)) {
      continue;
    }
    const reached = m.check(stats);
    if (!reached) {
      continue;
    }

    await db.recordMilestoneSent(referrerId, m.key).catch(() => {});
    const keyboard: KeyboardButton[][] = [[{ text: "\u{1F4E4} Share", callback_data: "r:share" }]];
    await sendMessage(user.telegram_id, m.message, keyboard).catch((err) => {
      console.error(`[referral-milestone] Failed to send ${m.key} nudge:`, err);
    });
    return; // Send at most one nudge per conversion
  }
}
