/**
 * OpenJoey Skill Guard Hook
 *
 * Intercepts tool calls to 'read' skills and enforces tier + quota limits.
 */

import type {
  PluginHookBeforeToolCallEvent,
  PluginHookBeforeToolCallResult,
  PluginHookAfterToolCallEvent,
  PluginHookToolContext,
  OpenClawPluginApi,
} from "../plugins/types.js";
import { resolveSession } from "./session-isolation.js";
import { guardSkillExecution, logSkillExecution, SKILL_METADATA } from "./skill-guard.js";

/**
 * Extracts the skill name from a file path if it's a SKILL.md file.
 */
function extractSkillName(path: string): string | null {
  // Matches .../skills/skill-name/SKILL.md or skills/skill-name/SKILL.md
  const match = path.match(/skills\/([^/]+)\/SKILL\.md$/i);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Hook handler for before_tool_call
 */
export async function beforeToolCall(
  event: PluginHookBeforeToolCallEvent,
  ctx: PluginHookToolContext,
): Promise<PluginHookBeforeToolCallResult | void> {
  const { toolName, params } = event;

  // Only intercept 'read' or 'sandboxed_read' tools
  if (toolName !== "read" && toolName !== "sandboxed_read" && toolName !== "view_file") {
    return;
  }

  const pathParam = (params.path || params.AbsolutePath) as string;
  if (!pathParam) return;

  const skillName = extractSkillName(pathParam);
  if (!skillName || !SKILL_METADATA[skillName]) {
    return; // Not a protected skill
  }

  // Resolve session info from sessionKey
  // sessionKey might be 'user:{telegram_id}' or 'agent:xxx:user:{telegram_id}'
  const telegramIdMatch = ctx.sessionKey?.match(/user:(\d+)/);
  if (!telegramIdMatch) {
    console.log(
      `[skill-guard] Skipping guard: sessionKey '${ctx.sessionKey}' does not contain 'user:id'`,
    );
    return; // Not a user session
  }

  const telegramId = parseInt(telegramIdMatch[1], 10);
  console.log(
    `[skill-guard] Guarding skill '${skillName}' for telegramId ${telegramId} (session: ${ctx.sessionKey})`,
  );

  const session = await resolveSession(telegramId);

  // Check guard
  const decision = await guardSkillExecution({
    telegramId: session.telegramId,
    userId: session.userId,
    tier: session.tier,
    role: session.role,
    skillName: skillName,
    userQuery: "", // We don't have the full query here
  });

  if (!decision.allowed) {
    console.log(
      `[skill-guard] BLOCKED skill '${skillName}' for user ${session.userId}: ${decision.blockMessage}`,
    );
    return {
      block: true,
      blockReason: decision.blockMessage || "Access denied to this skill.",
    };
  }

  // Skill is allowed
  return;
}

/**
 * Hook handler for after_tool_call
 */
export async function afterToolCall(
  event: PluginHookAfterToolCallEvent,
  ctx: PluginHookToolContext,
): Promise<void> {
  const { toolName, params, error, durationMs } = event;

  // Only log for 'read' tools that targeted a skill
  if (toolName !== "read" && toolName !== "sandboxed_read" && toolName !== "view_file") {
    return;
  }

  const pathParam = (params.path || params.AbsolutePath) as string;
  if (!pathParam) return;

  const skillName = extractSkillName(pathParam);
  if (!skillName || !SKILL_METADATA[skillName]) {
    return;
  }

  const telegramIdMatch = ctx.sessionKey?.match(/user:(\d+)/);
  if (!telegramIdMatch) return;

  const telegramId = parseInt(telegramIdMatch[1], 10);
  const session = await resolveSession(telegramId);

  const costTier = SKILL_METADATA[skillName].costTier;

  console.log(
    `[skill-guard] Logging execution: skill=${skillName} user=${session.userId} success=${!error} duration=${durationMs}ms`,
  );

  // Log the execution
  await logSkillExecution(
    {
      telegramId: session.telegramId,
      userId: session.userId,
      tier: session.tier,
      role: session.role,
      skillName: skillName,
      userQuery: "",
    },
    costTier,
    !error,
    durationMs || 0,
    0, // Token count not easily available from tool call
    error,
  );
}

/**
 * Register the OpenJoey Skill Guard plugin.
 */
export function registerOpenJoeyGuard(api: OpenClawPluginApi) {
  api.on("before_tool_call", beforeToolCall);
  api.on("after_tool_call", afterToolCall);
  api.logger.info("OpenJoey Skill Guard registered");
}
