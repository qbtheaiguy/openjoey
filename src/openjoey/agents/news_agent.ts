import type { AgentContext, AgentHandleResult } from "./types.js";

export const NEWS_AGENT_ID = "news_agent";

export async function handle(ctx: AgentContext): Promise<AgentHandleResult> {
  return { jobId: ctx.job.id, status: "skipped" };
}
