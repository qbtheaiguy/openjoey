/**
 * OpenJoey Referral System
 *
 * Implements the $3 Split Model:
 * - $1.80 for the Referrer
 * - $1.20 for the New User
 */

import { getOpenJoeyDB } from "./supabase-client.js";

const REFERRER_REWARD = 1.8;
const REFERRED_REWARD = 1.2;

/**
 * Attribues a new user to a referrer based on a referral code.
 * Called during the registration process.
 */
export async function attributeReferral(
  referredUserId: string,
  referralCode: string,
): Promise<void> {
  const db = getOpenJoeyDB();

  // 1. Find the referrer by their code
  const referrer = await db.getUserByReferralCode(referralCode);
  if (!referrer) {
    console.error(`[referral] Referrer not found for code: ${referralCode}`);
    return;
  }

  // 2. Prevent self-referral
  if (referrer.id === referredUserId) {
    console.warn(`[referral] Self-referral detected for user: ${referredUserId}`);
    return;
  }

  // 3. Create the referral record
  try {
    await db.createReferral({
      referrer_id: referrer.id,
      referred_id: referredUserId,
      referrer_credit: REFERRER_REWARD,
      referred_credit: REFERRED_REWARD,
    });
    console.log(`[referral] Attributed user ${referredUserId} to referrer ${referrer.id}`);
  } catch (err) {
    console.error(`[referral] Failed to create referral record:`, err);
  }
}

/**
 * Processes a successful subscription and rewards the referrer.
 * Called when a user's status changes to 'active' (e.g. via Stripe webhook).
 * Returns the referrer's user_id if a referral was paid, so the caller can
 * call checkAndSendReferralMilestones(referrerId, sendMessage) for §9.9 nudge.
 */
export async function rewardReferral(referredUserId: string): Promise<string | null> {
  const db = getOpenJoeyDB();

  try {
    const referrals = await db.get<{ referrer_id: string }>(
      "referrals",
      `referred_id=eq.${referredUserId}&status=eq.pending&limit=1`,
    );
    if (referrals.length === 0) return null;

    const referral = referrals[0];
    await db.updateReferralStatus(referredUserId, "paid");

    console.log(`[referral] Successfully rewarded referral for user ${referredUserId}`);
    return referral.referrer_id;
  } catch (err) {
    console.error(`[referral] Failed to reward referral:`, err);
    return null;
  }
}
