/**
 * Spawn Manager for OpenJoey Multi-Agent System
 * Rule 3: Manages agent lifecycle (start, monitor, cleanup)
 */

import type { BusJob, BusJobResult } from "../internal_bus/types.js";

export type AgentInstance = {
  agentId: string;
  jobId: string;
  status: "starting" | "running" | "completed" | "failed";
  startedAtMs: number;
  completedAtMs?: number;
  result?: unknown;
  error?: string;
};

// In-memory agent registry (in production, use persistent storage)
const activeAgents = new Map<string, AgentInstance>();
const agentResults = new Map<string, BusJobResult>();

/**
 * Start an agent for a job
 */
export async function startAgent(job: BusJob): Promise<AgentInstance> {
  const instance: AgentInstance = {
    agentId: job.assignedAgentId ?? "unknown",
    jobId: job.id,
    status: "starting",
    startedAtMs: Date.now(),
  };

  activeAgents.set(job.id, instance);

  // Simulate agent startup (in production, this would spawn a real process/thread)
  instance.status = "running";

  return instance;
}

/**
 * Mark agent as completed
 */
export function completeAgent(jobId: string, result: unknown): void {
  const agent = activeAgents.get(jobId);
  if (agent) {
    agent.status = "completed";
    agent.completedAtMs = Date.now();
    agent.result = result;

    // Store result
    agentResults.set(jobId, {
      jobId,
      status: "ok",
      output: result,
      completedAtMs: Date.now(),
    });
  }
}

/**
 * Mark agent as failed
 */
export function failAgent(jobId: string, error: string): void {
  const agent = activeAgents.get(jobId);
  if (agent) {
    agent.status = "failed";
    agent.completedAtMs = Date.now();
    agent.error = error;

    agentResults.set(jobId, {
      jobId,
      status: "error",
      error,
      completedAtMs: Date.now(),
    });
  }
}

/**
 * Get active agent by job ID
 */
export function getAgent(jobId: string): AgentInstance | undefined {
  return activeAgents.get(jobId);
}

/**
 * Get all active agents for a parent job
 */
export function getAgentsForParentJob(parentJobId: string): AgentInstance[] {
  return Array.from(activeAgents.values()).filter((agent) =>
    agent.jobId.startsWith(`${parentJobId}_`),
  );
}

/**
 * Check if all agents for a parent job are complete
 */
export function areAllAgentsComplete(parentJobId: string): boolean {
  const agents = getAgentsForParentJob(parentJobId);
  if (agents.length === 0) return false;
  return agents.every((agent) => agent.status === "completed" || agent.status === "failed");
}

/**
 * Get results for all agents of a parent job
 */
export function getAgentResults(parentJobId: string): BusJobResult[] {
  const results: BusJobResult[] = [];

  for (const [jobId, result] of agentResults.entries()) {
    if (jobId.startsWith(`${parentJobId}_`)) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Cleanup completed/failed agents older than maxAgeMs
 */
export function cleanupAgents(maxAgeMs: number = 300000): void {
  const now = Date.now();
  const cutoff = now - maxAgeMs;

  for (const [jobId, agent] of activeAgents.entries()) {
    if (
      (agent.status === "completed" || agent.status === "failed") &&
      agent.completedAtMs &&
      agent.completedAtMs < cutoff
    ) {
      activeAgents.delete(jobId);
      agentResults.delete(jobId);
    }
  }
}

/**
 * Get spawn statistics
 */
export function getSpawnStats(): {
  active: number;
  completed: number;
  failed: number;
  total: number;
} {
  let active = 0;
  let completed = 0;
  let failed = 0;

  for (const agent of activeAgents.values()) {
    if (agent.status === "running" || agent.status === "starting") active++;
    if (agent.status === "completed") completed++;
    if (agent.status === "failed") failed++;
  }

  return { active, completed, failed, total: activeAgents.size };
}
