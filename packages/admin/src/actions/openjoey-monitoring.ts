"use server";

import {
  runFullHealthCheck,
  type MonitorReport,
  type RecoveryAction,
} from "../../../../src/openjoey/agents/devops_ai/index";

export type OpenJoeyMonitoringStats = {
  overallStatus: "healthy" | "warning" | "critical";
  reports: MonitorReport[];
  actions: RecoveryAction[];
  timestamp: string;
};

export async function getOpenJoeyMonitoringStats(): Promise<OpenJoeyMonitoringStats | null> {
  try {
    const check = await runFullHealthCheck();

    return {
      overallStatus: check.overallStatus,
      reports: check.reports,
      actions: check.actions,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error("OpenJoey monitoring error:", err);
    return null;
  }
}
