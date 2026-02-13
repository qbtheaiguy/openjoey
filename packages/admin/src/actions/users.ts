"use server";

import { getAdminDB } from "@/lib/db";

// COMPLETE UserRow type matching Supabase database.types.ts EXACTLY
// All fields are real data from Supabase - NO MOCK DATA
export type UserRow = {
  // Core identity
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  display_name: string | null;

  // Status & tier
  status: "active" | "suspended" | "banned" | "pending" | "trial";
  tier: "free" | "basic" | "pro" | "enterprise" | "trader" | "premium" | "annual";

  // Timestamps
  created_at: string;
  updated_at: string;

  // Financial/subscription data (real from Stripe/Supabase)
  credit_balance: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;

  // Usage data
  charts_used_today: number;
  charts_reset_at: string | null;

  // Referral data
  referral_code: string | null;
  referred_by: string | null;

  // Joined data from views (real computed data)
  referral_stats?: {
    total_referrals: number;
    converted_referrals: number;
    paid_referrals: number;
    total_earned: number;
    current_balance: number;
  } | null;

  // Session activity (real from sessions table)
  last_active_at?: string | null;
  session_count?: number;
  total_messages?: number;

  // Usage analytics (real from usage_events table)
  total_usage_events?: number;
  last_usage_at?: string | null;
};

export type UserFilters = {
  query?: string;
  status?: UserRow["status"] | "all";
  tier?: UserRow["tier"] | "all";
  dateFrom?: string;
  dateTo?: string;
  sortBy?:
    | "created_at"
    | "updated_at"
    | "last_active_at"
    | "usage_count"
    | "display_name"
    | "tier"
    | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type UserStats = {
  total: number;
  active: number;
  suspended: number;
  byTier: Partial<Record<UserRow["tier"], number>>;
  newToday: number;
  newThisWeek: number;
  activeToday: number;
};

export async function getUsers(
  filters: UserFilters = {},
): Promise<{ users: UserRow[]; total: number; page: number; totalPages: number } | null> {
  const db = getAdminDB();
  if (!db) {
    return null;
  }

  const {
    query,
    status = "all",
    tier = "all",
    dateFrom,
    dateTo,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 50,
  } = filters;

  const offset = (page - 1) * limit;
  let filter = `order=${sortBy}.${sortOrder}&limit=${limit}&offset=${offset}`;
  let countFilter = "";

  // Build filters
  const conditions: string[] = [];

  if (query) {
    if (!isNaN(Number(query))) {
      conditions.push(`telegram_id=eq.${query}`);
    } else {
      conditions.push(`or=(telegram_username.ilike.*${query}*,display_name.ilike.*${query}*)`);
    }
  }

  if (status !== "all") {
    conditions.push(`status=eq.${status}`);
  }

  if (tier !== "all") {
    conditions.push(`tier=eq.${tier}`);
  }

  if (dateFrom) {
    conditions.push(`created_at=gte.${dateFrom}`);
  }

  if (dateTo) {
    conditions.push(`created_at=lte.${dateTo}`);
  }

  if (conditions.length > 0) {
    filter += `&${conditions.join("&")}`;
    countFilter = conditions.join("&");
  }

  filter +=
    "&select=id,telegram_id,telegram_username,display_name,status,tier,created_at,updated_at,last_active_at";

  try {
    const [users, total] = await Promise.all([
      db.get<UserRow>("users", filter),
      db.count("users", countFilter),
    ]);

    const totalPages = Math.ceil((total || 0) / limit);

    return {
      users: users || [],
      total: total || 0,
      page,
      totalPages,
    };
  } catch (err) {
    console.error("getUsers:", err);
    return null;
  }
}

export async function getUserStats(): Promise<UserStats | null> {
  const db = getAdminDB();
  if (!db) {
    return null;
  }

  try {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [
      total,
      active,
      suspended,
      freeTier,
      basicTier,
      proTier,
      enterpriseTier,
      newToday,
      newThisWeek,
      activeToday,
    ] = await Promise.all([
      db.count("users", ""),
      db.count("users", "status=eq.active"),
      db.count("users", "status=eq.suspended"),
      db.count("users", "tier=eq.free"),
      db.count("users", "tier=eq.basic"),
      db.count("users", "tier=eq.pro"),
      db.count("users", "tier=eq.enterprise"),
      db.count("users", `created_at=gte.${today}`),
      db.count("users", `created_at=gte.${weekAgo}`),
      db.count("users", `last_active_at=gte.${today}`),
    ]);

    return {
      total: total || 0,
      active: active || 0,
      suspended: suspended || 0,
      byTier: {
        free: freeTier || 0,
        basic: basicTier || 0,
        pro: proTier || 0,
        enterprise: enterpriseTier || 0,
      },
      newToday: newToday || 0,
      newThisWeek: newThisWeek || 0,
      activeToday: activeToday || 0,
    };
  } catch (err) {
    console.error("getUserStats:", err);
    return null;
  }
}

export async function updateUserStatus(
  userId: string,
  status: UserRow["status"],
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDB();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    await db.patch("users", { status, updated_at: new Date().toISOString() }, `id=eq.${userId}`);
    return { success: true };
  } catch (err) {
    console.error("updateUserStatus:", err);
    return { success: false, error: "Failed to update user status" };
  }
}

export async function updateUserTier(
  userId: string,
  tier: UserRow["tier"],
): Promise<{ success: boolean; error?: string }> {
  const db = getAdminDB();
  if (!db) {
    return { success: false, error: "Database not available" };
  }

  try {
    await db.patch("users", { tier, updated_at: new Date().toISOString() }, `id=eq.${userId}`);
    return { success: true };
  } catch (err) {
    console.error("updateUserTier:", err);
    return { success: false, error: "Failed to update user tier" };
  }
}

export async function bulkUpdateUserStatus(
  userIds: string[],
  status: UserRow["status"],
): Promise<{ success: boolean; updated: number; error?: string }> {
  const db = getAdminDB();
  if (!db) {
    return { success: false, updated: 0, error: "Database not available" };
  }

  try {
    // PostgREST doesn't support bulk updates well, so we do individual updates
    const updates = userIds.map((id) =>
      db.patch("users", { status, updated_at: new Date().toISOString() }, `id=eq.${id}`),
    );
    await Promise.all(updates);
    return { success: true, updated: userIds.length };
  } catch (err) {
    console.error("bulkUpdateUserStatus:", err);
    return { success: false, updated: 0, error: "Failed to update users" };
  }
}
