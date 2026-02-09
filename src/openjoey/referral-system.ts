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
 */
export async function rewardReferral(referredUserId: string): Promise<void> {
  const db = getOpenJoeyDB();

  try {
    // 1. Check if this user was referred
    const referrals = await db.get<any>(
      "referrals",
      `referred_id=eq.${referredUserId}&status=eq.pending&limit=1`,
    );
    if (referrals.length === 0) return;

    const referral = referrals[0];

    // 2. Update referral status to 'paid'
    await db.updateReferralStatus(referredUserId, "paid");

    // 3. Add credits to the referrer (In a real system, this might go to a 'balance' or 'credits' table)
    // For now, we've logged it in the referrals table which is used for the leaderboard.

    console.log(`[referral] Successfully rewarded referral for user ${referredUserId}`);
  } catch (err) {
    console.error(`[referral] Failed to reward referral:`, err);
  }
}
