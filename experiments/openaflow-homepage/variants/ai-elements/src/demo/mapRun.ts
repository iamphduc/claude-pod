// Maps the neutral run in shared/run.ts into AI Elements' data shapes:
// tool calls become AI SDK `DynamicToolUIPart`s (the `ai` package is used for
// types only) and decisions drive <Confirmation> through the approval states
// of a tool part.
import type { DynamicToolUIPart } from "ai";
import type { Agent, Decision, Status, ToolCall } from "../../../../shared/run";
import { decisions, orchestrator, run } from "../../../../shared/run";

export type AgentView = {
  agent: Agent;
  name: string;
  status: Status;
  elapsedMs: number;
  tokens: number;
  costUsd: number;
  parts: DynamicToolUIPart[];
};

export const ROLE_NAMES: Record<Agent["role"], string> = {
  orchestrator: "Orchestrator",
  "sprint-planner": "Sprint planner",
  engineer: "Engineer",
  reviewer: "Reviewer",
};

export const agentName = (a: Agent) =>
  a.slice ? `${ROLE_NAMES[a.role]}: ${a.slice}` : ROLE_NAMES[a.role];

export function toToolPart(tool: ToolCall, t: number): DynamicToolUIPart | null {
  if (tool.start > t) return null;
  const base = {
    type: "dynamic-tool" as const,
    toolName: tool.name,
    toolCallId: tool.id,
    title: tool.summary,
    input: tool.args,
  };
  const finished = tool.end !== undefined && tool.end <= t;
  if (!finished) return { ...base, state: "input-available" };
  if (tool.status === "error") {
    return { ...base, state: "output-error", errorText: tool.error ?? "Failed" };
  }
  return { ...base, state: "output-available", output: tool.result };
}

/** Status of an agent at replay time t. */
function statusAt(a: Agent, t: number): Status {
  if (a.end !== undefined) return t >= a.end ? a.status : "running";
  if (a.status === "blocked") {
    const failedAt = Math.max(
      0,
      ...a.tools.filter((x) => x.status === "error").map((x) => x.end ?? 0)
    );
    return t >= failedAt ? "blocked" : "running";
  }
  return a.status;
}

export function viewAgent(a: Agent, t: number): AgentView | null {
  if (a.start > t) return null;
  const stop = a.end ?? run.durationMs;
  const full = stop - a.start;
  const elapsedMs = Math.max(0, Math.min(t, stop) - a.start);
  const share = full > 0 ? elapsedMs / full : 1;
  return {
    agent: a,
    name: agentName(a),
    status: statusAt(a, t),
    elapsedMs,
    tokens: Math.round(a.tokens * share),
    costUsd: a.costUsd * share,
    parts: a.tools
      .map((tool) => toToolPart(tool, t))
      .filter((p): p is DynamicToolUIPart => p !== null),
  };
}

/** When each decision shows up during the replay. */
export function decisionTime(d: Decision): number {
  const agent = orchestrator.children?.find((c) => c.id === d.agentId);
  if (!agent) return run.durationMs;
  if (agent.end !== undefined) return agent.end;
  const failed = agent.tools.find((x) => x.status === "error");
  return failed?.end ?? run.durationMs;
}

export const fmtDuration = (ms: number) => {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${String(r).padStart(2, "0")}s` : `${r}s`;
};

export const fmtTokens = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k tokens` : `${n} tokens`;

export const fmtCost = (usd: number) => `$${usd.toFixed(2)}`;

export { decisions, orchestrator, run };
