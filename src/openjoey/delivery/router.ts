/**
 * OpenJoey delivery router — thin delegate to infra outbound.
 * When OPENJOEY_USE_DELIVERY_ROUTER (or openjoey.useDeliveryRouter) is set,
 * gateway sends outbound through this path. For now it only delegates;
 * later we can add queueing, fan-out, or logging here.
 */

import type { ReplyPayload } from "../../auto-reply/types.js";
import type { OpenClawConfig } from "../../config/config.js";
import type { OutboundDeliveryResult, OutboundSendDeps } from "../../infra/outbound/deliver.js";
import type { NormalizedOutboundPayload } from "../../infra/outbound/payloads.js";
import type { OutboundChannel } from "../../infra/outbound/targets.js";
import { deliverOutboundPayloadsInternal } from "../../infra/outbound/deliver.js";

export type DeliverViaRouterParams = {
  cfg: OpenClawConfig;
  channel: Exclude<OutboundChannel, "none">;
  to: string;
  accountId?: string;
  payloads: ReplyPayload[];
  replyToId?: string | null;
  threadId?: string | number | null;
  deps?: OutboundSendDeps;
  gifPlayback?: boolean;
  abortSignal?: AbortSignal;
  bestEffort?: boolean;
  onError?: (err: unknown, payload: NormalizedOutboundPayload) => void;
  onPayload?: (payload: NormalizedOutboundPayload) => void;
  mirror?: {
    sessionKey: string;
    agentId?: string;
    text?: string;
    mediaUrls?: string[];
  };
};

/**
 * Route outbound delivery. Currently delegates directly to infra outbound.
 */
export async function deliverViaRouter(
  params: DeliverViaRouterParams,
): Promise<OutboundDeliveryResult[]> {
  return deliverOutboundPayloadsInternal(params);
}
