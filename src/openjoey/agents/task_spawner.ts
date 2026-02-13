/**
 * Task Spawner for OpenJoey Multi-Agent System
 * Rule 3: Creates specialized agents for tasks
 * Converts user requests into bus jobs for the orchestrator
 */

import type { BusJob, BusJobKind } from "../internal_bus/types.js";

export type TaskRequest = {
  userId: string;
  requestType:
    | "trending_tokens"
    | "whale_alert"
    | "market_brief"
    | "price_check"
    | "news_digest"
    | "custom";
  payload: Record<string, unknown>;
  priority?: "high" | "medium" | "low";
};

export type SpawnedJob = {
  jobId: string;
  agentIds: string[];
  estimatedTimeMs: number;
};

// Agent specialization mapping
const AGENT_SPECIALIZATIONS: Record<TaskRequest["requestType"], string[]> = {
  trending_tokens: [
    "volume_scanner",
    "social_trend_scanner",
    "whale_wallet_scanner",
    "liquidity_scanner",
    "news_scanner",
  ],
  whale_alert: ["whale_tracker", "blockchain_monitor"],
  market_brief: ["price_aggregator", "news_collector", "sentiment_analyzer", "macro_tracker"],
  price_check: ["price_fetcher"],
  news_digest: ["news_collector", "sentiment_analyzer", "summarizer"],
  custom: ["master_coordinator"],
};

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Spawn specialized agents for a task
 * Creates bus jobs for each specialized agent
 */
export function spawnTask(request: TaskRequest): SpawnedJob {
  const jobId = generateJobId();
  const agentIds = AGENT_SPECIALIZATIONS[request.requestType];
  const priority = request.priority ?? "medium";

  // Calculate estimated completion time based on number of agents and priority
  const baseTimePerAgent = 5000; // 5 seconds per agent
  const priorityMultiplier = priority === "high" ? 0.5 : priority === "low" ? 2 : 1;
  const estimatedTimeMs = agentIds.length * baseTimePerAgent * priorityMultiplier;

  return {
    jobId,
    agentIds,
    estimatedTimeMs,
  };
}

/**
 * Create bus jobs for spawned agents
 */
export function createAgentJobs(jobId: string, request: TaskRequest): BusJob[] {
  const agentIds = AGENT_SPECIALIZATIONS[request.requestType];
  const now = Date.now();

  return agentIds.map((agentId, index) => ({
    id: `${jobId}_${agentId}_${index}`,
    kind: getJobKindForRequest(request.requestType),
    payload: {
      ...request.payload,
      parentJobId: jobId,
      agentId,
      userId: request.userId,
      priority: request.priority ?? "medium",
    },
    createdAtMs: now,
    assignedAgentId: agentId,
  }));
}

function getJobKindForRequest(requestType: TaskRequest["requestType"]): BusJobKind {
  switch (requestType) {
    case "trending_tokens":
    case "price_check":
      return "whale_snapshot";
    case "whale_alert":
      return "alert_check";
    case "market_brief":
      return "pre_market_brief";
    case "news_digest":
      return "news_digest";
    default:
      return "coordinator";
  }
}

/**
 * Analyze user request to determine request type
 */
export function analyzeRequest(text: string): TaskRequest["requestType"] {
  const lower = text.toLowerCase();

  if (lower.includes("trending") || lower.includes("hot") || lower.includes("top")) {
    return "trending_tokens";
  }

  if (lower.includes("whale") || lower.includes("large transfer") || lower.includes("big move")) {
    return "whale_alert";
  }

  if (lower.includes("brief") || lower.includes("summary") || lower.includes("market overview")) {
    return "market_brief";
  }

  if (lower.includes("price") || lower.includes("cost") || lower.includes("value")) {
    return "price_check";
  }

  if (lower.includes("news") || lower.includes("headline") || lower.includes("article")) {
    return "news_digest";
  }

  return "custom";
}

/**
 * Build task request from user message
 */
export function buildTaskRequest(userId: string, message: string): TaskRequest {
  const requestType = analyzeRequest(message);

  return {
    userId,
    requestType,
    payload: {
      query: message,
      timestamp: new Date().toISOString(),
    },
    priority: "medium",
  };
}
