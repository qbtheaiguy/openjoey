"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseKey);

// COMPLETE UserRow type matching actual Supabase database structure
export type UserRow = {
  // Core identity
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  display_name: string | null;

  // Status & tier
  status: "trial" | "free" | "active" | "premium" | "trader" | "annual" | "expired" | "cancelled";
  tier: "trial" | "free" | "trader" | "premium" | "annual";

  // Timestamps
  created_at: string;
  updated_at: string;

  // Financial/subscription data (real from Stripe/Supabase)
  credit_balance: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_started_at: string | null;
  subscription_ends_at: string | null;

  // Usage data
  charts_used_today: number;
  charts_reset_at: string | null;

  // Referral data
  referral_code: string | null;
  referred_by: string | null;

  // Additional fields
  broadcast_opt_out: boolean;
  daily_brief_opted_in: boolean;
  daily_brief_paused_until: string | null;
};

export type UserFilters = {
  query?: string;
  status?: string;
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
};

export type UserStats = {
  total: number;
  active: number;
  suspended: number;
  banned: number;
  pending: number;
  trial: number;
  byTier: Partial<Record<UserRow["tier"], number>>;
  newToday: number;
  newThisWeek: number;
  activeToday: number; // Set to 0 since last_active_at doesn't exist
};

export async function getUsers(
  filters: UserFilters = {},
): Promise<{ users: UserRow[]; total: number; page: number; totalPages: number } | null> {
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

  try {
    let supabaseQuery = supabase
      .from("users")
      .select(`
        id, 
        telegram_id, 
        telegram_username, 
        display_name, 
        status, 
        tier, 
        created_at, 
        updated_at
      `)
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (query) {
      if (!isNaN(Number(query))) {
        supabaseQuery = supabaseQuery.eq("telegram_id", Number(query));
      } else {
        supabaseQuery = supabaseQuery.or(
          `telegram_username.ilike.%${query}%,display_name.ilike.%${query}%`,
        );
      }
    }

    if (status !== "all") {
      supabaseQuery = supabaseQuery.eq("status", status);
    }

    if (tier !== "all") {
      supabaseQuery = supabaseQuery.eq("tier", tier);
    }

    if (dateFrom) {
      supabaseQuery = supabaseQuery.gte("created_at", dateFrom);
    }

    if (dateTo) {
      supabaseQuery = supabaseQuery.lte("created_at", dateTo);
    }

    const { data: users, error } = await supabaseQuery;

    if (error) {
      console.error("getUsers:", error);
      return null;
    }

    // Get total count
    let countQuery = supabase.from("profiles").select("*", { count: "exact", head: true });

    if (query) {
      if (!isNaN(Number(query))) {
        countQuery = countQuery.eq("telegram_id", Number(query));
      } else {
        countQuery = countQuery.or(
          `telegram_username.ilike.%${query}%,display_name.ilike.%${query}%`,
        );
      }
    }

    if (status !== "all") {
      countQuery = countQuery.eq("status", status);
    }

    if (tier !== "all") {
      countQuery = countQuery.eq("tier", tier);
    }

    if (dateFrom) {
      countQuery = countQuery.gte("created_at", dateFrom);
    }

    if (dateTo) {
      countQuery = countQuery.lte("created_at", dateTo);
    }

    const { count } = await countQuery;
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      users: (users || []) as UserRow[],
      total,
      page,
      totalPages,
    };
  } catch (err) {
    console.error("getUsers:", err);
    return null;
  }
}

export async function getUserStats(): Promise<UserStats | null> {
  try {
    const { data: users } = await supabase.from("users").select("status, tier, created_at");

    if (!users) {
      return null;
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats: UserStats = {
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      suspended: users.filter((u) => u.status === "suspended").length,
      banned: users.filter((u) => u.status === "banned").length,
      pending: users.filter((u) => u.status === "pending").length,
      trial: users.filter((u) => u.status === "trial").length,
      byTier: {},
      newToday: users.filter((u) => u.created_at.startsWith(today)).length,
      newThisWeek: users.filter((u) => new Date(u.created_at) > weekAgo).length,
      activeToday: 0, // Can't calculate without last_active_at
    };

    // Count by tier
    users.forEach((user) => {
      const tier = user.tier as keyof typeof stats.byTier;
      stats.byTier[tier] = (stats.byTier[tier] || 0) + 1;
    });

    return stats;
  } catch (err) {
    console.error("getUserStats:", err);
    return null;
  }
}

export async function updateUserStatus(
  userId: string,
  status: UserRow["status"],
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return { success: false, message: `Failed to update status: ${error.message}` };
    }

    return { success: true, message: `User status updated to ${status}` };
  } catch (err) {
    return { success: false, message: `Error updating status: ${err}` };
  }
}

export async function updateUserTier(
  userId: string,
  tier: UserRow["tier"],
): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ tier, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      return { success: false, message: `Failed to update tier: ${error.message}` };
    }

    return { success: true, message: `User tier updated to ${tier}` };
  } catch (err) {
    return { success: false, message: `Error updating tier: ${err}` };
  }
}

export async function bulkUpdateUserStatus(
  userIds: string[],
  status: UserRow["status"],
): Promise<{ success: boolean; message: string; updated: number }> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", userIds);

    if (error) {
      return { success: false, message: `Failed to update status: ${error.message}`, updated: 0 };
    }

    return {
      success: true,
      message: `${userIds.length} users updated to ${status}`,
      updated: userIds.length,
    };
  } catch (err) {
    return { success: false, message: `Error updating status: ${err}`, updated: 0 };
  }
}
