// Maps the neutral run in shared/run.ts into tool-ui's own payload shapes:
// ProgressTracker steps (agents, tool calls), Terminal props (Bash calls) and
// ApprovalCard props (decisions). Every payload is checked with the
// component's own Zod contract (safeParse...), as tool-ui intends.
import {
  decisions,
  orchestrator,
  run,
  type Agent,
  type Decision,
  type ToolCall,
} from "../../../../shared/run";
import {
  parseSerializableProgressTracker,
  type ProgressStep,
  type SerializableProgressTracker,
} from "@/components/tool-ui/progress-tracker/schema";
import {
  parseSerializableTerminal,
  type SerializableTerminal,
} from "@/components/tool-ui/terminal/schema";
import {
  parseSerializableApprovalCard,
  type SerializableApprovalCard,
} from "@/components/tool-ui/approval-card/schema";

export const RUN_END = run.durationMs;

export const agents: Agent[] = [orchestrator, ...(orchestrator.children ?? [])];

export function agentName(a: Agent): string {
  if (a.role === "orchestrator") return "Orchestrator";
  if (a.role === "sprint-planner") return "Sprint planner";
  if (a.role === "reviewer") return "Reviewer";
  return `Engineer · ${a.slice ?? a.id}`;
}

export function formatDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

function formatToolDuration(ms: number): string {
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatTokens(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/** Fraction of an agent's work done at time t, for replaying tokens and cost. */
function progressOf(a: Agent, t: number): number {
  const end = a.end ?? RUN_END;
  if (t <= a.start) return 0;
  return Math.min(1, (t - a.start) / (end - a.start));
}

function failedAt(a: Agent, t: number): ToolCall | undefined {
  return a.tools.find((tc) => tc.status === "error" && tc.end !== undefined && tc.end <= t);
}

function agentStepStatus(a: Agent, t: number): ProgressStep["status"] {
  if (t < a.start) return "pending";
  if (a.end !== undefined && t >= a.end) return "completed";
  if (a.status === "blocked" && failedAt(a, t)) return "failed";
  return "in-progress";
}

/** The current tool of an agent at time t (the last one started). */
function currentTool(a: Agent, t: number): ToolCall | undefined {
  return [...a.tools].reverse().find((tc) => tc.start <= t);
}

function agentDescription(a: Agent, t: number): string | undefined {
  const failed = failedAt(a, t);
  if (failed && a.status === "blocked") return `Blocked: ${failed.error}`;
  const tool = currentTool(a, t);
  if (a.role === "orchestrator" && (!tool || (tool.end ?? Infinity) <= t)) return `${run.plan} · ${run.stage}`;
  return tool?.summary;
}

/** Agents -> one ProgressTracker. Figures go in `meta` (a local addition). */
export function agentsTracker(t: number): SerializableProgressTracker {
  const steps: ProgressStep[] = agents.map((a) => {
    const status = agentStepStatus(a, t);
    const p = progressOf(a, t);
    const elapsed = status === "pending" ? 0 : Math.min(t, a.end ?? t) - a.start;
    const meta =
      status === "pending"
        ? `${a.model} · waiting`
        : `${a.model} · ${formatDuration(elapsed)} · ${formatTokens(Math.round(a.tokens * p))} tokens · ${formatCost(a.costUsd * p)}`;
    return {
      id: `agent-${a.id}`,
      label: agentName(a),
      meta,
      description: agentDescription(a, t),
      status,
    };
  });
  return parseOrThrow(
    parseSerializableProgressTracker({
      id: "progress-tracker-pod-agents",
      steps,
      elapsedTime: Math.min(t, RUN_END),
    }),
    "agents",
  );
}

type Owned = ToolCall & { agent: Agent };

const allTools: Owned[] = agents
  .flatMap((agent) => agent.tools.map((tc) => ({ ...tc, agent })))
  .sort((a, b) => a.start - b.start);

function toolStepStatus(tc: ToolCall, t: number): ProgressStep["status"] {
  if (tc.end === undefined || t < tc.end) return "in-progress";
  return tc.status === "error" ? "failed" : "completed";
}

/** Tool calls that have started by time t -> one ProgressTracker (or null). */
export function toolsTracker(t: number): SerializableProgressTracker | null {
  const started = allTools.filter((tc) => tc.start <= t);
  if (started.length === 0) return null;
  const steps: ProgressStep[] = started.map((tc) => {
    const status = toolStepStatus(tc, t);
    const took = status === "in-progress" ? t - tc.start : (tc.end ?? t) - tc.start;
    return {
      id: `tool-${tc.id}`,
      label: tc.summary,
      meta: `${tc.name} · ${formatToolDuration(took)}`,
      description:
        status === "failed"
          ? tc.error
          : `${agentName(tc.agent)} · ${Object.values(tc.args)[0] as string}`,
      status,
    };
  });
  return parseOrThrow(
    parseSerializableProgressTracker({ id: "progress-tracker-pod-tools", steps }),
    "tool calls",
  );
}

/** Finished Bash calls -> Terminal payloads. */
export function bashTerminals(t: number): SerializableTerminal[] {
  return allTools
    .filter((tc) => tc.name === "Bash" && tc.end !== undefined && tc.end <= t)
    .map((tc) =>
      parseOrThrow(
        parseSerializableTerminal({
          id: `terminal-${tc.id}`,
          command: String(tc.args.command ?? ""),
          stdout: typeof tc.result === "string" ? tc.result : undefined,
          stderr: tc.error,
          // run.ts has no exit code; Terminal requires one, so error -> 1.
          exitCode: tc.status === "error" ? 1 : 0,
          durationMs: (tc.end ?? 0) - tc.start,
        }),
        "terminal",
      ),
    );
}

const decisionIcon: Record<Decision["kind"], string> = {
  question: "message-circle-question-mark",
  "merge-pr": "git-pull-request",
  continue: "play",
};

/** When each decision appears in the replay. */
export function decisionAppearsAt(d: Decision): number {
  const agent = agents.find((a) => a.id === d.agentId);
  if (!agent) return RUN_END;
  const failed = agent.tools.find((tc) => tc.status === "error");
  if (failed?.end !== undefined) return failed.end;
  return agent.end ?? RUN_END;
}

export type DecisionCard = SerializableApprovalCard & { appearsAt: number };

/** Decisions -> ApprovalCard payloads (options[0] = confirm, options[1] = cancel). */
export const decisionCards: DecisionCard[] = decisions.map((d) => {
  const agent = agents.find((a) => a.id === d.agentId);
  const card = parseOrThrow(
    parseSerializableApprovalCard({
      id: `approval-card-${d.id}`,
      role: "decision",
      title: d.title,
      description: d.detail,
      icon: decisionIcon[d.kind],
      metadata: [
        { key: "Run", value: `${run.repo} · ${run.stage}` },
        ...(agent ? [{ key: "Agent", value: agentName(agent) }] : []),
      ],
      confirmLabel: d.options[0],
      cancelLabel: d.options[1],
    }),
    "decision",
  );
  return { ...card, appearsAt: decisionAppearsAt(d) };
});

export const totals = {
  tokens: agents.reduce((n, a) => n + a.tokens, 0),
  cost: agents.reduce((n, a) => n + a.costUsd, 0),
};

function parseOrThrow<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`tool-ui payload for ${what} failed its schema`);
  return value;
}
