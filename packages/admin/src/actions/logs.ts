"use server";

import { getAdminDB } from "@/lib/db";

export type SkillLogRow = {
  id: string;
  user_id: string;
  skill_name: string;
  success: boolean;
  execution_time_ms: number | null;
  created_at: string;
  error_message?: string | null;
};

export async function getSkillLogs(
  limit = 50,
): Promise<{ logs: SkillLogRow[]; total: number } | null> {
  const db = getAdminDB();
  if (!db) {
    return null;
  }
  try {
    const [logs, total] = await Promise.all([
      db.get<SkillLogRow>(
        "skill_usage",
        `order=created_at.desc&limit=${limit}&select=id,user_id,skill_name,success,execution_time_ms,created_at,error_message`,
      ),
      db.count("skill_usage"),
    ]);
    return { logs: logs || [], total };
  } catch (err) {
    console.error("getSkillLogs:", err);
    return null;
  }
}
