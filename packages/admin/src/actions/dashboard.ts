"use server";

import { getAdminDB } from "@/lib/db";

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
  const db = getAdminDB();
  if (!db) return null;

  try {
    const [totalUsers, totalUsage, recentLogs, usageRows] = await Promise.all([
      db.count("users"),
      db.count("skill_usage"),
      db.get<{
        id: string;
        user_id: string;
        skill_name: string;
        success: boolean;
        execution_time_ms: number | null;
        created_at: string;
      }>(
        "skill_usage",
        "order=created_at.desc&limit=20&select=id,user_id,skill_name,success,execution_time_ms,created_at",
      ),
      db.get<{ skill_name: string }>("skill_usage", "select=skill_name"),
    ]);

    const breakdown: Record<string, number> = {};
    for (const row of usageRows) {
      const name = row.skill_name || "unknown";
      breakdown[name] = (breakdown[name] || 0) + 1;
    }
    const topSkills = Object.entries(breakdown)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    let revenue: number | null = null;
    let successCount = 0;
    try {
      const withCost = await db.get<{ cost_usd: number | null; success: boolean }>(
        "skill_usage",
        "select=cost_usd,success",
      );
      if (withCost.length > 0) {
        revenue = withCost.reduce((sum, r) => sum + (Number(r.cost_usd) || 0), 0);
        successCount = withCost.filter((r) => r.success).length;
      }
    } catch {
      // cost_usd or column might not exist
    }
    const successRate = totalUsage > 0 ? Math.round((successCount / totalUsage) * 1000) / 10 : null;

    return {
      totalUsers,
      totalUsage,
      recentLogs: recentLogs || [],
      topSkills,
      revenue: revenue !== null ? Math.round(revenue * 100) / 100 : null,
      successRate,
    };
  } catch (err) {
    console.error("Dashboard getDashboardStats:", err);
    return null;
  }
}
