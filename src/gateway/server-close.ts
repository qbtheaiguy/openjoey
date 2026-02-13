import type { Server as HttpServer } from "node:http";
import type { WebSocketServer } from "ws";
import type { HeartbeatRunner } from "../infra/heartbeat-runner.js";
import type { PluginServicesHandle } from "../plugins/services.js";
import { type ChannelId, listChannelPlugins } from "../channels/plugins/index.js";
import { stopGmailWatcher } from "../hooks/gmail-watcher.js";

export function createGatewayCloseHandler(params: {
  tailscaleCleanup: (() => Promise<void>) | null;
  stopChannel: (name: ChannelId, accountId?: string) => Promise<void>;
  pluginServices: PluginServicesHandle | null;
  cron: { stop: () => void };
  heartbeatRunner: HeartbeatRunner;
  nodePresenceTimers: Map<string, ReturnType<typeof setInterval>>;
  broadcast: (event: string, payload: unknown, opts?: { dropIfSlow?: boolean }) => void;
  tickInterval: ReturnType<typeof setInterval>;
  healthInterval: ReturnType<typeof setInterval>;
  dedupeCleanup: ReturnType<typeof setInterval>;
  agentUnsub: (() => void) | null;
  heartbeatUnsub: (() => void) | null;
  chatRunState: { clear: () => void };
  clients: Set<{ socket: { close: (code: number, reason: string) => void } }>;
  configReloader: { stop: () => Promise<void> };
  browserControl: { stop: () => Promise<void> } | null;
  wss: WebSocketServer;
  httpServer: HttpServer;
  httpServers?: HttpServer[];
}) {
  return async (opts?: { reason?: string; restartExpectedMs?: number | null }) => {
    const reasonRaw = typeof opts?.reason === "string" ? opts.reason.trim() : "";
    const reason = reasonRaw || "gateway stopping";
    const restartExpectedMs =
      typeof opts?.restartExpectedMs === "number" && Number.isFinite(opts.restartExpectedMs)
        ? Math.max(0, Math.floor(opts.restartExpectedMs))
        : null;

    if (params.tailscaleCleanup) {
      await params.tailscaleCleanup();
    }
    for (const plugin of listChannelPlugins()) {
      await params.stopChannel(plugin.id);
    }
    if (params.pluginServices) {
      await params.pluginServices.stop().catch(() => {});
    }
    await stopGmailWatcher();
    params.cron.stop();
    params.heartbeatRunner.stop();
    for (const timer of params.nodePresenceTimers.values()) {
      clearInterval(timer);
    }
    params.nodePresenceTimers.clear();
    params.broadcast("shutdown", {
      reason,
      restartExpectedMs,
    });
    clearInterval(params.tickInterval);
    clearInterval(params.healthInterval);
    clearInterval(params.dedupeCleanup);
    if (params.agentUnsub) {
      try {
        params.agentUnsub();
      } catch {
        /* ignore */
      }
    }
    if (params.heartbeatUnsub) {
      try {
        params.heartbeatUnsub();
      } catch {
        /* ignore */
      }
    }
    params.chatRunState.clear();
    for (const c of params.clients) {
      try {
        c.socket.close(1001, reason);
      } catch {
        /* ignore */
      }
    }
    params.clients.clear();
    try {
      params.wss.close();
    } catch {
      /* ignore */
    }
    try {
      params.httpServer.close();
    } catch {
      /* ignore */
    }
    if (params.httpServers) {
      for (const s of params.httpServers) {
        try {
          s.close();
        } catch {
          /* ignore */
        }
      }
    }
    if (params.browserControl) {
      await params.browserControl.stop();
    }
    await params.configReloader.stop();
  };
}
