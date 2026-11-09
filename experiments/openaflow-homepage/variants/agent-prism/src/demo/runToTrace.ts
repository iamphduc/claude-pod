import type {
  OpenTelemetryAttribute,
  OpenTelemetryDocument,
  OpenTelemetrySpan,
  TraceSpan,
} from "@evilmartians/agent-prism-types";

import { openTelemetrySpanAdapter } from "@evilmartians/agent-prism-data";

import { type Agent, orchestrator, run, type ToolCall } from "../../../../shared/run";

const TRACE_ID = "0af7651916cd43dd8448eb211c80319c";
const runStartMs = Date.parse(run.startedAt);

const nano = (offsetMs: number): string =>
  (BigInt(runStartMs + offsetMs) * 1_000_000n).toString();

const str = (key: string, value: string): OpenTelemetryAttribute => ({
  key,
  value: { stringValue: value },
});
const int = (key: string, value: number): OpenTelemetryAttribute => ({
  key,
  value: { intValue: String(value) },
});
const dbl = (key: string, value: number): OpenTelemetryAttribute => ({
  key,
  value: { doubleValue: value },
});

const OK = { code: 1 } as const;
const ERROR = (message: string) => ({ code: 2, message }) as const;

/** Display name for an agent, as Open AFlow labels them. */
export const agentTitle = (agent: Agent): string =>
  agent.slice ? `${agent.role} · ${agent.slice}` : agent.role;

/** When a blocked agent became blocked: the end of its failed tool call. */
const blockedAt = (agent: Agent): number | undefined =>
  agent.status === "blocked"
    ? agent.tools.find((t) => t.status === "error")?.end
    : undefined;

function toolSpan(tool: ToolCall, parentId: string, at: number): OpenTelemetrySpan | null {
  if (tool.start > at) return null;
  const finished = tool.end !== undefined && tool.end <= at;
  const attributes = [
    str("gen_ai.operation.name", "execute_tool"),
    str("gen_ai.tool.name", tool.name),
    str("input.value", JSON.stringify(tool.args, null, 2)),
  ];
  if (finished && tool.result !== undefined) {
    attributes.push(
      str("output.value", typeof tool.result === "string" ? tool.result : JSON.stringify(tool.result, null, 2)),
    );
  }
  if (finished && tool.error) attributes.push(str("error.message", tool.error));

  return {
    traceId: TRACE_ID,
    spanId: tool.id,
    parentSpanId: parentId,
    name: `${tool.name} · ${tool.summary}`,
    startTimeUnixNano: nano(tool.start),
    endTimeUnixNano: nano(finished ? (tool.end ?? at) : at),
    attributes,
    status: finished ? (tool.status === "error" ? ERROR(tool.error ?? "failed") : OK) : undefined,
  };
}

function agentSpans(agent: Agent, parentId: string | undefined, at: number): OpenTelemetrySpan[] {
  if (agent.start > at) return [];
  const finished = agent.end !== undefined && agent.end <= at;
  const blocked = blockedAt(agent);
  const isBlocked = blocked !== undefined && blocked <= at;
  const progress = Math.min(1, at / run.durationMs);

  const span: OpenTelemetrySpan = {
    traceId: TRACE_ID,
    spanId: agent.id,
    parentSpanId: parentId,
    name: agentTitle(agent),
    startTimeUnixNano: nano(agent.start),
    endTimeUnixNano: nano(finished ? (agent.end ?? at) : at),
    attributes: [
      str("gen_ai.operation.name", "invoke_agent"),
      str("gen_ai.system", "anthropic"),
      str("gen_ai.agent.name", agent.role),
      str("pod.model", agent.model),
      ...(agent.slice ? [str("pod.slice", agent.slice)] : []),
      str("pod.status", isBlocked ? "blocked" : finished ? "done" : "running"),
      int("gen_ai.usage.total_tokens", Math.round(agent.tokens * (finished ? 1 : progress))),
      dbl("gen_ai.usage.cost", Number((agent.costUsd * (finished ? 1 : progress)).toFixed(2))),
    ],
    status: finished ? OK : isBlocked ? ERROR("Blocked: a tool call failed") : undefined,
  };

  return [
    span,
    ...agent.tools.flatMap((t) => toolSpan(t, agent.id, at) ?? []),
    ...(agent.children ?? []).flatMap((c) => agentSpans(c, agent.id, at)),
  ];
}

/** The pod run as an OTLP/JSON document, as it looked `at` ms after its start. */
export function runToOtlp(at: number = run.durationMs): OpenTelemetryDocument {
  return {
    resourceSpans: [
      {
        resource: { attributes: [str("service.name", "pod"), str("pod.repo", run.repo)] },
        scopeSpans: [{ scope: { name: "claude-pod" }, spans: agentSpans(orchestrator, undefined, at) }],
      },
    ],
  };
}

/**
 * OTLP has no "in progress" status (an unset status reads as `warning`), so
 * spans with no end yet are set to AgentPrism's own `pending` status. Agents get
 * the Anthropic avatar through the `brand` metadata the library reads.
 */
function patch(span: TraceSpan): TraceSpan {
  const raw = span.attributes?.find((a) => a.key === "pod.status")?.value.stringValue;
  const isAgent = span.type === "agent_invocation";
  return {
    ...span,
    status: span.status === "warning" ? "pending" : span.status,
    metadata: isAgent ? { brand: { type: "anthropic" }, podStatus: raw } : span.metadata,
    children: span.children?.map(patch),
  };
}

export function runToSpans(at: number = run.durationMs): TraceSpan[] {
  return openTelemetrySpanAdapter.convertRawDocumentsToSpans(runToOtlp(at)).map(patch);
}
