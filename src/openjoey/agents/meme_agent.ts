import type { AgentContext, AgentHandleResult } from "./types.js";

export const MEME_AGENT_ID = "meme_agent";

export async function handle(ctx: AgentContext): Promise<AgentHandleResult> {
  return { jobId: ctx.job.id, status: "skipped" };
}
