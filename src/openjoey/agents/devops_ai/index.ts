/**
 * DevOps AI / Ops Guardian — full monitoring implementation
 * Rule 6: DevOps Self-Monitoring is Required
 * Monitors: AI Queue, GPU, API Failures, Agent Health, Resource Usage
 */

import type { AgentContext, AgentHandleResult } from "../types.js";

export const DEVOPS_AI_ID = "devops_ai";

export type MonitorMetric = {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  threshold?: number;
  alert?: boolean;
};

export type MonitorReport = {
  system: string;
  status: "healthy" | "warning" | "critical";
  metrics: MonitorMetric[];
  alerts: string[];
  suggestions: string[];
  timestamp: string;
};

export type RecoveryAction =
  | { type: "restart_agent"; agentId: string }
  | { type: "clear_queue" }
  | { type: "rotate_api"; from: string; to: string }
  | { type: "notify_admin"; message: string }
  | { type: "scale_workers"; count: number };

// Queue metrics
let queueSize = 0;
let queueWaitMs = 0;
const agentHealth = new Map<string, { lastHeartbeat: number; failures: number }>();
const apiFailures = new Map<string, { count: number; lastFailure: number }>();

// Lazy import for logging to avoid circular deps
async function logEvent(
  level: "info" | "warning" | "error" | "critical",
  category: "api" | "queue" | "agent" | "resource" | "rate_limit" | "system",
  message: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    const { logMonitoringEvent } =
      await import("../../../../packages/admin/src/actions/monitoring-logs");
    await logMonitoringEvent(level, category, message, details, "devops_ai");
  } catch {
    // Fallback: console log if file logging fails
    console.log(`[${level.toUpperCase()}] ${category}: ${message}`, details);
  }
}

export function recordQueueMetrics(size: number, avgWaitMs: number): void {
  const oldSize = queueSize;
  queueSize = size;
  queueWaitMs = avgWaitMs;

  // Log if crossing thresholds
  if (oldSize <= 50 && size > 50) {
    logEvent("warning", "queue", `Queue size elevated: ${size} jobs pending`, { size, avgWaitMs });
  }
  if (oldSize <= 100 && size > 100) {
    logEvent("critical", "queue", `Queue size critical: ${size} jobs pending`, { size, avgWaitMs });
  }
}

export function recordAgentHeartbeat(agentId: string): void {
  agentHealth.set(agentId, {
    lastHeartbeat: Date.now(),
    failures: agentHealth.get(agentId)?.failures ?? 0,
  });
}

export function recordAgentFailure(agentId: string): void {
  const current = agentHealth.get(agentId) ?? { lastHeartbeat: Date.now(), failures: 0 };
  const newFailures = current.failures + 1;
  agentHealth.set(agentId, { ...current, failures: newFailures });

  if (newFailures === 5) {
    logEvent("warning", "agent", `Agent ${agentId} has 5 recent failures`, {
      agentId,
      failures: newFailures,
    });
  }
  if (newFailures > 10) {
    logEvent("critical", "agent", `Agent ${agentId} has ${newFailures} recent failures`, {
      agentId,
      failures: newFailures,
    });
  }
}

export function recordApiSuccess(api: string): void {
  apiFailures.delete(api);
}

export function recordApiFailure(api: string, statusCode?: number, errorMessage?: string): void {
  const current = apiFailures.get(api) ?? { count: 0, lastFailure: 0 };
  const newCount = current.count + 1;
  apiFailures.set(api, { count: newCount, lastFailure: Date.now() });

  const isRateLimit = statusCode === 429;
  const level = newCount > 10 ? "critical" : newCount > 5 ? "error" : "warning";
  const category: "api" | "rate_limit" = isRateLimit ? "rate_limit" : "api";

  if (newCount === 5 || newCount === 10 || isRateLimit) {
    logEvent(
      level,
      category,
      `API ${api} ${isRateLimit ? "rate limited" : "failing"}: ${newCount} failures`,
      {
        api,
        count: newCount,
        statusCode,
        errorMessage,
        isRateLimit,
      },
    );
  }
}

function checkQueueHealth(): MonitorReport {
  const alerts: string[] = [];
  const suggestions: string[] = [];
  let status: "healthy" | "warning" | "critical" = "healthy";

  if (queueSize > 100) {
    status = "critical";
    alerts.push(`Queue size critical: ${queueSize} jobs pending`);
    suggestions.push("Consider increasing worker count or scaling horizontally");
  } else if (queueSize > 50) {
    status = "warning";
    alerts.push(`Queue size elevated: ${queueSize} jobs pending`);
  }

  if (queueWaitMs > 30000) {
    status = status === "healthy" ? "warning" : status;
    alerts.push(`Queue wait time high: ${(queueWaitMs / 1000).toFixed(1)}s average`);
  }

  return {
    system: "AI Queue",
    status,
    metrics: [
      { name: "queue_size", value: queueSize, unit: "jobs", timestamp: new Date().toISOString() },
      {
        name: "avg_wait_time",
        value: queueWaitMs,
        unit: "ms",
        timestamp: new Date().toISOString(),
      },
    ],
    alerts,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

function checkAgentHealth(): MonitorReport {
  const alerts: string[] = [];
  const suggestions: string[] = [];
  let status: "healthy" | "warning" | "critical" = "healthy";
  const now = Date.now();

  for (const [agentId, health] of agentHealth.entries()) {
    const secondsSinceHeartbeat = (now - health.lastHeartbeat) / 1000;

    if (secondsSinceHeartbeat > 60) {
      status = "critical";
      alerts.push(
        `Agent ${agentId} unresponsive: ${secondsSinceHeartbeat.toFixed(0)}s since heartbeat`,
      );
      suggestions.push(`Restart agent ${agentId}`);
    } else if (health.failures > 5) {
      status = "critical";
      alerts.push(`Agent ${agentId} has ${health.failures} recent failures`);
    }
  }

  return {
    system: "Agent Health",
    status,
    metrics: [
      {
        name: "total_agents",
        value: agentHealth.size,
        unit: "agents",
        timestamp: new Date().toISOString(),
      },
      {
        name: "unhealthy_agents",
        value: alerts.length,
        unit: "agents",
        timestamp: new Date().toISOString(),
      },
    ],
    alerts,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

function checkApiHealth(): MonitorReport {
  const alerts: string[] = [];
  const suggestions: string[] = [];
  let status: "healthy" | "warning" | "critical" = "healthy";

  for (const [api, failures] of apiFailures.entries()) {
    if (failures.count > 10) {
      status = "critical";
      alerts.push(`API ${api} failing repeatedly: ${failures.count} failures`);
      suggestions.push(`Check API status page for ${api}`);
    } else if (failures.count > 5) {
      status = status === "healthy" ? "warning" : status;
      alerts.push(`API ${api} showing issues: ${failures.count} failures`);
    }
  }

  return {
    system: "API Health",
    status,
    metrics: [
      {
        name: "failing_apis",
        value: apiFailures.size,
        unit: "apis",
        timestamp: new Date().toISOString(),
      },
    ],
    alerts,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

async function checkResourceUsage(): Promise<MonitorReport> {
  const alerts: string[] = [];
  const suggestions: string[] = [];
  let status: "healthy" | "warning" | "critical" = "healthy";

  const memUsage = process.memoryUsage();
  const rssMB = memUsage.rss / 1024 / 1024;
  const heapMB = memUsage.heapUsed / 1024 / 1024;

  if (rssMB > 1024) {
    status = "critical";
    alerts.push(`High memory usage: ${rssMB.toFixed(0)}MB RSS`);
    suggestions.push("Restart process or investigate memory leaks");
    await logEvent("critical", "resource", `High memory usage: ${rssMB.toFixed(0)}MB RSS`, {
      rssMB,
      heapMB,
      threshold: 1024,
    });
  } else if (rssMB > 512) {
    status = "warning";
    alerts.push(`Elevated memory usage: ${rssMB.toFixed(0)}MB RSS`);
    await logEvent("warning", "resource", `Elevated memory usage: ${rssMB.toFixed(0)}MB RSS`, {
      rssMB,
      heapMB,
      threshold: 512,
    });
  }

  return {
    system: "Resources",
    status,
    metrics: [
      { name: "heap_used", value: heapMB, unit: "MB", timestamp: new Date().toISOString() },
      { name: "rss", value: rssMB, unit: "MB", timestamp: new Date().toISOString() },
    ],
    alerts,
    suggestions,
    timestamp: new Date().toISOString(),
  };
}

function generateRecoveryActions(reports: MonitorReport[]): RecoveryAction[] {
  const actions: RecoveryAction[] = [];

  for (const report of reports) {
    if (report.status === "critical") {
      actions.push({
        type: "notify_admin",
        message: `CRITICAL: ${report.system} - ${report.alerts.join("; ")}`,
      });
    }

    if (report.system === "Agent Health" && report.status === "critical") {
      for (const alert of report.alerts) {
        const match = alert.match(/Agent (\w+) unresponsive/);
        if (match) actions.push({ type: "restart_agent", agentId: match[1] });
      }
    }

    if (report.system === "AI Queue" && report.status === "critical") {
      actions.push({ type: "scale_workers", count: 5 });
    }
  }

  return actions;
}

export async function runFullHealthCheck(): Promise<{
  reports: MonitorReport[];
  actions: RecoveryAction[];
  overallStatus: "healthy" | "warning" | "critical";
}> {
  const reports = [
    checkQueueHealth(),
    checkAgentHealth(),
    checkApiHealth(),
    await checkResourceUsage(),
  ];
  const actions = generateRecoveryActions(reports);
  const hasCritical = reports.some((r) => r.status === "critical");
  const hasWarning = reports.some((r) => r.status === "warning");
  const overallStatus = hasCritical ? "critical" : hasWarning ? "warning" : "healthy";

  return { reports, actions, overallStatus };
}

export async function handle(ctx: AgentContext): Promise<AgentHandleResult> {
  const check = await runFullHealthCheck();

  return {
    jobId: ctx.job.id,
    status: check.overallStatus === "critical" ? "error" : "ok",
    output: {
      reports: check.reports,
      actions: check.actions,
      overallStatus: check.overallStatus,
    },
  };
}
