"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseKey);

export type DashboardStats = {
  totalUsers: number;
  totalUsage: number;
  recentLogs: Array<{
    id: string;
    user_id: string;
    skill_name: string;
    success: boolean;
    execution_time_ms: number | null;
    created_at: string;
  }>;
  topSkills: Array<{ name: string; count: number }>;
  revenue: number | null; // sum of cost_usd from skill_usage; null if no data
  successRate: number | null; // percent; null if no usage
};

export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const [totalUsers, totalUsage, recentLogs, usageRows] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("skill_usage").select("*", { count: "exact", head: true }),
      supabase
        .from("skill_usage")
        .select("id,user_id,skill_name,success,execution_time_ms,created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("skill_usage").select("skill_name"),
    ]);

    const breakdown: Record<string, number> = {};
    for (const row of (usageRows.data as any[]) || []) {
      const name = row.skill_name || "unknown";
      breakdown[name] = (breakdown[name] || 0) + 1;
    }
    const topSkills = Object.entries(breakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const revenue =
      (usageRows.data as any[])?.reduce((sum: number, row: any) => {
        // Add your revenue calculation logic here
        return sum + (row.success ? 0.01 : 0); // Example: $0.01 per successful usage
      }, 0) || null;

    const successRate = (usageRows.data as any[])?.length
      ? ((usageRows.data as any[]).filter((row: any) => row.success).length /
          (usageRows.data as any[]).length) *
        100
      : null;

    return {
      totalUsers: totalUsers.count || 0,
      totalUsage: totalUsage.count || 0,
      recentLogs: recentLogs.data || [],
      topSkills,
      revenue,
      successRate,
    };
  } catch (err) {
    console.error("getDashboardStats:", err);
    return null;
  }
}
