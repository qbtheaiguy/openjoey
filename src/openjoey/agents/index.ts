/**
 * OpenJoey fixed-roster agents. New agents; routing stays on current agent until we switch (e.g. openjoey.useAgentBus).
 */

export type { AgentId, AgentContext, AgentHandler, AgentHandleResult } from "./types.js";

export { MASTER_COORDINATOR_ID, handle as masterCoordinatorHandle } from "./master_coordinator.js";
export { NEWS_AGENT_ID, handle as newsAgentHandle } from "./news_agent.js";
export { ALERT_AGENT_ID, handle as alertAgentHandle } from "./alert_agent.js";
export { MEME_AGENT_ID, handle as memeAgentHandle } from "./meme_agent.js";
export { DEVOPS_AI_ID, handle as devopsAiHandle } from "./devops_ai/index.js";
