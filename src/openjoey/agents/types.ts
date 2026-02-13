/**
 * Shared types for OpenJoey fixed-roster agents.
 * These agents are additional; routing stays on the current agent until we switch (e.g. via flag).
 */

import type { BusJob, BusJobResult } from "../internal_bus/types.js";

export type AgentId =
  | "master_coordinator"
  | "news_agent"
  | "alert_agent"
  | "meme_agent"
  | "devops_ai";

export type AgentHandleResult = {
  jobId: string;
  status: BusJobResult["status"];
  output?: unknown;
  error?: string;
};

export type AgentContext = {
  job: BusJob;
  sessionKey?: string;
  channelId?: string;
};

export type AgentHandler = (ctx: AgentContext) => Promise<AgentHandleResult>;
