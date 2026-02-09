import type { AnyAgentTool } from "./tools/common.js";
import { createSubsystemLogger } from "../logging/subsystem.js";
import { getGlobalHookRunner } from "../plugins/hook-runner-global.js";
import { normalizeToolName } from "./tool-policy.js";

type HookContext = {
  agentId?: string;
  sessionKey?: string;
};

const log = createSubsystemLogger("agents/tools");

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function runAfterToolCallHook(args: {
  toolName: string;
  params: unknown;
  toolCallId?: string;
  ctx?: HookContext;
  result?: unknown;
  error?: string;
  durationMs: number;
}): Promise<void> {
  const hookRunner = getGlobalHookRunner();
  if (!hookRunner?.hasHooks("after_tool_call")) {
    return;
  }

  const toolName = normalizeToolName(args.toolName || "tool");
  const params = isPlainObject(args.params) ? args.params : {};

  try {
    await hookRunner.runAfterToolCall(
      {
        toolName,
        params,
        result: args.result,
        error: args.error,
        durationMs: args.durationMs,
      },
      {
        toolName,
        agentId: args.ctx?.agentId,
        sessionKey: args.ctx?.sessionKey,
      },
    );
  } catch (err) {
    const toolCallId = args.toolCallId ? ` toolCallId=${args.toolCallId}` : "";
    log.warn(`after_tool_call hook failed: tool=${toolName}${toolCallId} error=${String(err)}`);
  }
}

export function wrapToolWithAfterToolCallHook(tool: AnyAgentTool, ctx?: HookContext): AnyAgentTool {
  const execute = tool.execute;
  if (!execute) {
    return tool;
  }
  const toolName = tool.name || "tool";
  return {
    ...tool,
    execute: async (toolCallId, params, signal, onUpdate) => {
      const start = Date.now();
      let result: any;
      let error: string | undefined;

      try {
        result = await execute(toolCallId, params, signal, onUpdate);
        return result;
      } catch (err) {
        error = String(err);
        throw err;
      } finally {
        const durationMs = Date.now() - start;
        // Run after hook fire-and-forget
        runAfterToolCallHook({
          toolName,
          params,
          toolCallId,
          ctx,
          result,
          error,
          durationMs,
        }).catch((err) => {
          log.warn(`after_tool_call hook fire failed: ${err}`);
        });
      }
    },
  };
}
