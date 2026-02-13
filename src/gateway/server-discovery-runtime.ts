import type { OpenClawConfig } from "../config/config.js";
import type { createSubsystemLogger } from "../logging/subsystem.js";

export type GatewayDiscoveryRuntime = {
  stop: () => void;
};

export function startGatewayDiscoveryRuntime(_params: {
  cfg: OpenClawConfig;
  port: number;
  log: ReturnType<typeof createSubsystemLogger>;
}): GatewayDiscoveryRuntime {
  // Discovery is disabled in OpenJoey
  return {
    stop: () => {},
  };
}
