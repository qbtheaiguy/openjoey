/**
 * OpenJoey internal bus — types only.
 * Job queue, result queue, and event stream shapes. Existing agent flow does not use the bus by default.
 */

export type BusJobKind =
  | "inbound_message"
  | "pre_market_brief"
  | "whale_snapshot"
  | "alert_check"
  | "news_digest"
  | "meme"
  | "coordinator";

export type BusJob = {
  id: string;
  kind: BusJobKind;
  payload: Record<string, unknown>;
  createdAtMs: number;
  assignedAgentId?: string;
};

export type BusJobResultStatus = "ok" | "error" | "skipped";

export type BusJobResult = {
  jobId: string;
  status: BusJobResultStatus;
  output?: unknown;
  error?: string;
  completedAtMs: number;
};

export type BusEventTopic =
  | "job.enqueued"
  | "job.completed"
  | "job.failed"
  | "agent.ready"
  | "alert.triggered";

export type BusEvent = {
  topic: BusEventTopic;
  payload: Record<string, unknown>;
  timestampMs: number;
};

export type BusEventSubscription = (event: BusEvent) => void;
