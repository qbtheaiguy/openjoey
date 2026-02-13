/**
 * OpenJoey Referral System
 *
 * Implements the $3 Split Model:
 * - $1.80 for the Referrer (only when the referred user PAYS)
 * - $1.20 discount for the referred user (on first payment)
 *
 * Important: Credit is granted only when the referred user pays (converts).
 * Invite-only does NOT grant any balance — otherwise users could invite
 * themselves (alt accounts) and earn without ever paying.
 */

import { getOpenJoeyDB } from "./supabase-client.js";

const REFERRER_REWARD = 1.8;
const REFERRED_REWARD = 1.2;

/**
 * Attributes a new user to a referrer based on a referral code.
 * Called during registration (signup). Creates a pending referral record only.
 * No balance or credit is added here — that happens only in rewardReferral
 * when the referred user actually pays (e.g. Stripe webhook).
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
 * Processes a successful payment by the referred user and marks the referral as paid.
 * Call this only when the referred user has actually paid (e.g. Stripe subscription
 * webhook, first payment confirmed). Do NOT call on signup — credit only on payment.
 *
 * The caller is responsible for:
 * - Adding $1.80 to the referrer's balance (e.g. credit_balance in users).
 * - Applying $1.20 discount to the referred user's first payment.
 *
 * Returns the referrer's user_id if a referral was marked paid, so the caller can
 * credit the referrer and call checkAndSendReferralMilestones(referrerId, sendMessage).
 */
export async function rewardReferral(referredUserId: string): Promise<string | null> {
  const db = getOpenJoeyDB();

  try {
    const referrals = await db.get<{ referrer_id: string }>(
      "referrals",
      `referred_id=eq.${referredUserId}&status=eq.pending&limit=1`,
    );
    if (referrals.length === 0) {
      return null;
    }

    const referral = referrals[0];
    await db.updateReferralStatus(referredUserId, "paid");

    console.log(`[referral] Successfully rewarded referral for user ${referredUserId}`);
    return referral.referrer_id;
  } catch (err) {
    console.error(`[referral] Failed to reward referral:`, err);
    return null;
  }
}
