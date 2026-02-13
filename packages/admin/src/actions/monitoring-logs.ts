"use server";

import { promises as fs } from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "../../logs/openjoey-monitoring.jsonl");
const MAX_LOG_ENTRIES = 10000;

export type MonitoringLogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "warning" | "error" | "critical";
  category: "api" | "queue" | "agent" | "resource" | "rate_limit" | "system";
  message: string;
  details?: Record<string, unknown>;
  source: string;
};

// Ensure log directory exists
async function ensureLogDir(): Promise<void> {
  const dir = path.dirname(LOG_FILE);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function logMonitoringEvent(
  level: MonitoringLogEntry["level"],
  category: MonitoringLogEntry["category"],
  message: string,
  details?: Record<string, unknown>,
  source = "devops_ai",
): Promise<void> {
  await ensureLogDir();

  const entry: MonitoringLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    details,
    source,
  };

  const line = JSON.stringify(entry) + "\n";
  await fs.appendFile(LOG_FILE, line, "utf-8");

  // Trim old logs if file gets too large
  await trimOldLogs();
}

async function trimOldLogs(): Promise<void> {
  try {
    const content = await fs.readFile(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n");

    if (lines.length > MAX_LOG_ENTRIES) {
      const keep = lines.slice(-MAX_LOG_ENTRIES);
      await fs.writeFile(LOG_FILE, keep.join("\n") + "\n", "utf-8");
    }
  } catch {
    // File might not exist yet, ignore
  }
}

export async function getMonitoringLogs(
  options: {
    level?: MonitoringLogEntry["level"] | "all";
    category?: MonitoringLogEntry["category"] | "all";
    limit?: number;
    since?: string;
    until?: string;
  } = {},
): Promise<MonitoringLogEntry[]> {
  const { level = "all", category = "all", limit = 100, since, until } = options;

  try {
    await fs.access(LOG_FILE);
  } catch {
    return [];
  }

  const content = await fs.readFile(LOG_FILE, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);

  const logs: MonitoringLogEntry[] = lines
    .map((line) => JSON.parse(line) as MonitoringLogEntry)
    .filter((log) => {
      if (level !== "all" && log.level !== level) return false;
      if (category !== "all" && log.category !== category) return false;
      if (since && log.timestamp < since) return false;
      if (until && log.timestamp > until) return false;
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  return logs;
}

export async function getMonitoringStats(): Promise<{
  total: number;
  byLevel: Record<MonitoringLogEntry["level"], number>;
  byCategory: Record<MonitoringLogEntry["category"], number>;
  last24h: number;
}> {
  try {
    await fs.access(LOG_FILE);
  } catch {
    return {
      total: 0,
      byLevel: { info: 0, warning: 0, error: 0, critical: 0 },
      byCategory: { api: 0, queue: 0, agent: 0, resource: 0, rate_limit: 0, system: 0 },
      last24h: 0,
    };
  }

  const content = await fs.readFile(LOG_FILE, "utf-8");
  const lines = content.trim().split("\n").filter(Boolean);

  const logs = lines.map((line) => JSON.parse(line) as MonitoringLogEntry);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  return {
    total: logs.length,
    byLevel: {
      info: logs.filter((l) => l.level === "info").length,
      warning: logs.filter((l) => l.level === "warning").length,
      error: logs.filter((l) => l.level === "error").length,
      critical: logs.filter((l) => l.level === "critical").length,
    },
    byCategory: {
      api: logs.filter((l) => l.category === "api").length,
      queue: logs.filter((l) => l.category === "queue").length,
      agent: logs.filter((l) => l.category === "agent").length,
      resource: logs.filter((l) => l.category === "resource").length,
      rate_limit: logs.filter((l) => l.category === "rate_limit").length,
      system: logs.filter((l) => l.category === "system").length,
    },
    last24h: logs.filter((l) => l.timestamp > last24h).length,
  };
}

// Rate limit detection helper
export async function detectRateLimit(
  apiName: string,
  responseStatus: number,
  responseHeaders?: Record<string, string>,
): Promise<boolean> {
  const isRateLimited =
    responseStatus === 429 ||
    responseHeaders?.["x-ratelimit-remaining"] === "0" ||
    responseHeaders?.["retry-after"] !== undefined;

  if (isRateLimited) {
    const retryAfter = responseHeaders?.["retry-after"]
      ? parseInt(responseHeaders["retry-after"], 10)
      : undefined;

    await logMonitoringEvent(
      "warning",
      "rate_limit",
      `Rate limit hit on ${apiName}`,
      {
        api: apiName,
        status: responseStatus,
        retryAfter,
        headers: responseHeaders,
      },
      apiName,
    );
  }

  return isRateLimited;
}
