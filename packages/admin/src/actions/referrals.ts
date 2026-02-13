import { getAdminDB } from "@/lib/db";

export interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  referrer_credit: number;
  referred_credit: number;
  created_at: string;
  referrer_username?: string;
  referred_username?: string;
}

export async function getReferrals(): Promise<{ referrals: ReferralRow[]; total: number } | null> {
  const db = getAdminDB();
  if (!db) {
    return null;
  }

  // We'll use a join or custom RPC if possible, but for now just fetch the table
  // Ideally we want to show usernames
  try {
    const [referrals, total] = await Promise.all([
      db.get<ReferralRow>("referrals", "order=created_at.desc&limit=100"),
      db.count("referrals"),
    ]);

    // Simple enrichment: fetch user info for these IDs
    // In a real app we'd use a view or better API
    return { referrals: referrals || [], total };
  } catch (err) {
    console.error("getReferrals:", err);
    return null;
  }
}
