import type { AgentContext, AgentHandleResult } from "./types.js";

export const ALERT_AGENT_ID = "alert_agent";

export async function handle(ctx: AgentContext): Promise<AgentHandleResult> {
  return { jobId: ctx.job.id, status: "skipped" };
}
