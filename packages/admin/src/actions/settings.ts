"use server";

import { getAdminDB } from "@/lib/db";

export type SettingsStatus = {
  supabaseConnected: boolean;
  usersTable: boolean;
  skillUsageTable: boolean;
  referralsTable: boolean;
  referralLeaderboardView: boolean;
  errorMessage?: string;
};

export async function getSettingsStatus(): Promise<SettingsStatus> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      supabaseConnected: false,
      usersTable: false,
      skillUsageTable: false,
      referralsTable: false,
      referralLeaderboardView: false,
      errorMessage: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    };
  }
  const db = getAdminDB();
  if (!db) {
    return {
      supabaseConnected: false,
      usersTable: false,
      skillUsageTable: false,
      referralsTable: false,
      referralLeaderboardView: false,
      errorMessage: "Could not create Supabase client",
    };
  }
  try {
    await db.get("users", "limit=1");
    const usersTable = true;

    let skillUsageTable = false;
    let referralsTable = false;
    let referralLeaderboardView = false;

    try {
      await db.get("skill_usage", "limit=1");
      skillUsageTable = true;
    } catch {
      console.warn("skill_usage missing");
    }
    try {
      await db.get("referrals", "limit=1");
      referralsTable = true;
    } catch {
      console.warn("referrals missing");
    }
    try {
      await db.get("referral_leaderboard", "limit=1");
      referralLeaderboardView = true;
    } catch {
      console.warn("referral_leaderboard missing");
    }

    return {
      supabaseConnected: true,
      usersTable,
      skillUsageTable,
      referralsTable,
      referralLeaderboardView,
    };
  } catch (err) {
    return {
      supabaseConnected: false,
      usersTable: false,
      skillUsageTable: false,
      referralsTable: false,
      referralLeaderboardView: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}
