/**
 * Robot Health Monitoring Service
 * Tracks robot performance, handles failover, and provides alerts
 */

import type { RobotHealth, HealthReport, RobotCategory } from "../types/index.js";
import { checkMaxunHealth, listRobots, getRobotHistory } from "../maxun-bridge.js";

// ============================================================================
// Health Monitoring State
// ============================================================================

interface HealthState {
  robots: Map<string, RobotHealth>;
  lastCheck: number;
  checkInterval: NodeJS.Timeout | null;
  alerts: Array<{
    timestamp: number;
    robotName: string;
    severity: "warning" | "critical";
    message: string;
  }>;
}

const healthState: HealthState = {
  robots: new Map(),
  lastCheck: 0,
  checkInterval: null,
  alerts: [],
};

// ============================================================================
// Robot Health Tracking
// ============================================================================

/**
 * Initialize health monitoring
 */
export async function initializeHealthMonitoring(intervalMinutes: number = 5): Promise<void> {
  if (healthState.checkInterval) {
    clearInterval(healthState.checkInterval);
  }

  console.log(`Starting robot health monitoring (interval: ${intervalMinutes}min)`);

  // Initial check
  await performHealthCheck();

  // Schedule regular checks
  healthState.checkInterval = setInterval(performHealthCheck, intervalMinutes * 60 * 1000);
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring(): void {
  if (healthState.checkInterval) {
    clearInterval(healthState.checkInterval);
    healthState.checkInterval = null;
    console.log("Robot health monitoring stopped");
  }
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck(): Promise<void> {
  const startTime = Date.now();

  try {
    // Check Maxun instance health
    const maxunHealth = await checkMaxunHealth();
    if (!maxunHealth.healthy) {
      addAlert(
        "critical",
        "maxun-instance",
        `Maxun instance unhealthy: ${maxunHealth.responseTime}ms response time`,
      );
      return;
    }

    // Get all robots
    const robots = await listRobots();

    // Check each robot's health
    await Promise.all(
      robots.map(async (robot) => {
        await checkRobotHealth(robot.id, robot.name, robot.type as any);
      }),
    );

    // Clean up robots that no longer exist
    const currentRobotIds = new Set(robots.map((r) => r.id));
    for (const [robotId] of healthState.robots) {
      if (!currentRobotIds.has(robotId)) {
        healthState.robots.delete(robotId);
      }
    }

    healthState.lastCheck = Date.now();

    const duration = Date.now() - startTime;
    console.log(`Health check completed in ${duration}ms (${robots.length} robots)`);
  } catch (error) {
    console.error("Health check failed:", error);
    addAlert(
      "critical",
      "health-check",
      `Health check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Check individual robot health
 */
async function checkRobotHealth(
  robotId: string,
  robotName: string,
  category: RobotCategory,
): Promise<void> {
  const now = Date.now();
  const existing = healthState.robots.get(robotId);

  try {
    // Get recent execution history
    const history = await getRobotHistory(robotId, 5);

    if (history.length === 0) {
      // No history - robot might be new or never run
      updateRobotHealth(robotId, {
        name: robotName,
        status: "degraded",
        lastRun: 0,
        lastSuccess: 0,
        consecutiveFailures: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
      });
      return;
    }

    const latestRun = history[0];
    const recentRuns = history.slice(0, 3); // Last 3 runs

    // Calculate metrics
    const lastRunTime = new Date(latestRun.timestamp).getTime();
    const lastSuccessTime = recentRuns.find((r) => r.status === "success")?.timestamp
      ? new Date(recentRuns.find((r) => r.status === "success")!.timestamp).getTime()
      : 0;

    const consecutiveFailures =
      recentRuns.findIndex((r) => r.status === "success") === -1
        ? recentRuns.length
        : recentRuns.findIndex((r) => r.status === "success");

    const averageResponseTime =
      recentRuns.reduce((sum, run) => sum + run.duration, 0) / recentRuns.length;

    // Determine status
    let status: "healthy" | "degraded" | "down" = "healthy";

    if (consecutiveFailures >= 3) {
      status = "down";
    } else if (consecutiveFailures >= 1 || averageResponseTime > 30000) {
      status = "degraded";
    }

    // Check if robot is stale (no recent runs)
    const timeSinceLastRun = now - lastRunTime;
    const maxStaleTime = category === "bluechip" ? 5 * 60 * 1000 : 30 * 60 * 1000; // 5min for critical, 30min for others

    if (timeSinceLastRun > maxStaleTime && status === "healthy") {
      status = "degraded";
    }

    const health: RobotHealth = {
      name: robotName,
      status,
      lastRun: lastRunTime,
      lastSuccess: lastSuccessTime,
      consecutiveFailures,
      averageResponseTime,
      cacheHitRate: 0, // Would need to integrate with cache stats
    };

    updateRobotHealth(robotId, health);

    // Generate alerts for status changes
    if (existing && existing.status !== status) {
      if (status === "down") {
        addAlert(
          "critical",
          robotName,
          `Robot is down (${consecutiveFailures} consecutive failures)`,
        );
      } else if (status === "degraded") {
        addAlert(
          "warning",
          robotName,
          `Robot degraded (${consecutiveFailures} failures or ${Math.round(averageResponseTime)}ms avg response)`,
        );
      } else if (status === "healthy" && existing.status !== "healthy") {
        console.log(`✅ Robot ${robotName} recovered and is healthy`);
      }
    }
  } catch (error) {
    console.error(`Failed to check health for ${robotName}:`, error);
    updateRobotHealth(robotId, {
      name: robotName,
      status: "down",
      lastRun: 0,
      lastSuccess: 0,
      consecutiveFailures: existing?.consecutiveFailures ? existing.consecutiveFailures + 1 : 1,
      averageResponseTime: 0,
      cacheHitRate: 0,
    });
  }
}

/**
 * Update robot health in state
 */
function updateRobotHealth(robotId: string, health: RobotHealth): void {
  healthState.robots.set(robotId, health);
}

/**
 * Add alert to state
 */
function addAlert(severity: "warning" | "critical", robotName: string, message: string): void {
  const alert = {
    timestamp: Date.now(),
    robotName,
    severity,
    message,
  };

  healthState.alerts.unshift(alert);

  // Keep only last 100 alerts
  if (healthState.alerts.length > 100) {
    healthState.alerts = healthState.alerts.slice(0, 100);
  }

  // Log alert
  const emoji = severity === "critical" ? "🚨" : "⚠️";
  console.log(`${emoji} [${robotName}] ${message}`);
}

// ============================================================================
// Health Reporting
// ============================================================================

/**
 * Get current health report
 */
export function getHealthReport(): HealthReport {
  const robots = Array.from(healthState.robots.values());

  const summary = {
    total: robots.length,
    healthy: robots.filter((r) => r.status === "healthy").length,
    degraded: robots.filter((r) => r.status === "degraded").length,
    down: robots.filter((r) => r.status === "down").length,
    overallStatus: getOverallStatus(robots),
  };

  return {
    timestamp: Date.now(),
    robots,
    summary,
  };
}

/**
 * Get robots by status
 */
export function getRobotsByStatus(status: "healthy" | "degraded" | "down"): RobotHealth[] {
  return Array.from(healthState.robots.values()).filter((r) => r.status === status);
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(limit: number = 20): Array<{
  timestamp: number;
  robotName: string;
  severity: "warning" | "critical";
  message: string;
}> {
  return healthState.alerts.slice(0, limit);
}

/**
 * Get health for specific robot
 */
export function getRobotHealth(robotId: string): RobotHealth | null {
  return healthState.robots.get(robotId) || null;
}

// ============================================================================
// Failover Management
// ============================================================================

/**
 * Get backup robot for a primary robot
 */
export function getBackupRobot(primaryRobotId: string): string | null {
  const primary = healthState.robots.get(primaryRobotId);

  if (!primary || primary.status === "healthy") {
    return null; // No backup needed
  }

  // Try to find backup robot by naming convention
  const backupName = `${primary.name}-backup`;
  const backup = Array.from(healthState.robots.values()).find((r) => r.name === backupName);

  if (backup && backup.status === "healthy") {
    return backup.name;
  }

  return null;
}

/**
 * Get all robots that can serve as backups
 */
export function getAvailableBackups(): Array<{ primary: string; backup: string }> {
  const backups: Array<{ primary: string; backup: string }> = [];

  for (const [robotId, health] of healthState.robots) {
    if (health.name.endsWith("-backup")) {
      const primaryName = health.name.replace("-backup", "");
      const primary = Array.from(healthState.robots.values()).find((r) => r.name === primaryName);

      if (primary && primary.status !== "healthy" && health.status === "healthy") {
        backups.push({ primary: primaryName, backup: health.name });
      }
    }
  }

  return backups;
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Determine overall system status
 */
function getOverallStatus(robots: RobotHealth[]): "healthy" | "degraded" | "critical" {
  const downCount = robots.filter((r) => r.status === "down").length;
  const degradedCount = robots.filter((r) => r.status === "degraded").length;

  if (downCount > 0) {
    return "critical";
  } else if (degradedCount > robots.length * 0.2) {
    // More than 20% degraded
    return "critical";
  } else if (degradedCount > 0) {
    return "degraded";
  }

  return "healthy";
}

/**
 * Format health status with emoji
 */
export function formatHealthStatus(status: "healthy" | "degraded" | "down"): string {
  switch (status) {
    case "healthy":
      return "🟢 Healthy";
    case "degraded":
      return "🟡 Degraded";
    case "down":
      return "🔴 Down";
  }
}

/**
 * Format time since last run
 */
export function formatTimeSince(timestamp: number): string {
  if (timestamp === 0) return "Never";

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60 * 1000) {
    return `${Math.round(diff / 1000)}s ago`;
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.round(diff / (60 * 1000))}m ago`;
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.round(diff / (60 * 60 * 1000))}h ago`;
  } else {
    return `${Math.round(diff / (24 * 60 * 60 * 1000))}d ago`;
  }
}

/**
 * Get health statistics
 */
export function getHealthStats(): {
  uptime: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  averageResponseTime: number;
  cacheHitRate: number;
} {
  const robots = Array.from(healthState.robots.values());
  const criticalAlerts = healthState.alerts.filter((a) => a.severity === "critical").length;
  const warningAlerts = healthState.alerts.filter((a) => a.severity === "warning").length;

  const averageResponseTime =
    robots.length > 0
      ? robots.reduce((sum, r) => sum + r.averageResponseTime, 0) / robots.length
      : 0;

  const uptime =
    robots.length > 0
      ? (robots.filter((r) => r.status === "healthy").length / robots.length) * 100
      : 0;

  return {
    uptime,
    totalAlerts: healthState.alerts.length,
    criticalAlerts,
    warningAlerts,
    averageResponseTime,
    cacheHitRate: 0, // Would integrate with cache stats
  };
}

// ============================================================================
// Manual Health Operations
// ============================================================================

/**
 * Trigger manual health check
 */
export async function triggerHealthCheck(): Promise<void> {
  console.log("Triggering manual health check...");
  await performHealthCheck();
}

/**
 * Clear all alerts
 */
export function clearAlerts(): void {
  healthState.alerts = [];
  console.log("All alerts cleared");
}

/**
 * Reset robot health (useful after robot fix)
 */
export function resetRobotHealth(robotId: string): void {
  healthState.robots.delete(robotId);
  console.log(`Health reset for robot ${robotId}`);
}
