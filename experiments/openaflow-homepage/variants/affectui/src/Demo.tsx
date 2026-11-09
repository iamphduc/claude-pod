import { useEffect, useMemo, useRef, useState } from "react";
import { decisions as runDecisions, orchestrator, run, type Agent, type Status, type ToolCall } from "../../../shared/run";
import { demo } from "../../../shared/content";
import { ToolCallCard, type ToolCallStatus } from "./affectui/tool-call-card-clean";
import { DecisionInbox, type Decision as InboxDecision } from "./affectui/decision-inbox-clean";
import { Button } from "./affectui/button-clean";
import { NumberTicker } from "./affectui/number-ticker";
import { ShimmerText } from "./affectui/shimmer-loader";
import { Icon, type IconName } from "./icons";

/* ---------- Mapping run.ts → what the page shows at sim time t ---------- */

const REPLAY_MS = 8000; // the whole 19 minute run, squeezed into 8 seconds
const ALL: Agent[] = [orchestrator, ...(orchestrator.children ?? [])];
const lastToolEnd = (a: Agent) => Math.max(0, ...a.tools.map((x) => x.end ?? 0));

function agentStatus(a: Agent, t: number): Status {
  if (t < a.start) return "idle";
  if (a.end != null) return t >= a.end ? a.status : "running";
  if (a.status === "blocked") return t >= lastToolEnd(a) ? "blocked" : "running";
  return a.status;
}
function agentFrac(a: Agent, t: number) {
  const end = a.end ?? run.durationMs;
  return Math.min(1, Math.max(0, (t - a.start) / (end - a.start)));
}
function toolStatus(x: ToolCall, t: number): ToolCallStatus | null {
  if (t < x.start) return null;
  if (x.end != null && t >= x.end) return x.status;
  return "running";
}

const ROLE: Record<Agent["role"], string> = {
  orchestrator: "Orchestrator",
  "sprint-planner": "Sprint planner",
  engineer: "Engineer",
  reviewer: "Reviewer",
};
const STATUS_WORD: Record<Status, string> = {
  done: "Done",
  running: "Running",
  blocked: "Blocked",
  "needs-you": "Needs you",
  idle: "Idle",
};
const TOOL_ICON: Record<string, IconName> = { Read: "file", Write: "write", Edit: "edit", Bash: "terminal" };

function dur(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
const tokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const usd = (n: number) => `$${n.toFixed(2)}`;

// When each decision shows up in the replay: when its agent stops, or at the end for the continue prompt
function decisionAt(d: (typeof runDecisions)[number]) {
  const a = ALL.find((x) => x.id === d.agentId);
  if (!a) return run.durationMs;
  return a.end ?? lastToolEnd(a);
}

/* ---------- Component ---------- */

export function Demo() {
  const [t, setT] = useState(run.durationMs);
  const [replaying, setReplaying] = useState(false);
  const [round, setRound] = useState(0);
  // Wall-clock anchor so the still-running call's live timer reads its real elapsed time
  const loadedAt = useRef(Date.now()).current;

  useEffect(() => {
    if (!replaying) return;
    const began = performance.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - began) / REPLAY_MS);
      setT(Math.round(p * run.durationMs));
      if (p >= 1) {
        setReplaying(false);
        window.clearInterval(id);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [replaying]);

  const replay = () => {
    setT(0);
    setRound((r) => r + 1);
    setReplaying(true);
  };

  const totals = useMemo(() => {
    let tok = 0;
    let cost = 0;
    for (const a of ALL) {
      const f = agentFrac(a, t);
      tok += Math.round(a.tokens * f);
      cost += a.costUsd * f;
    }
    return { tok, cost: Math.round(cost * 100) / 100 };
  }, [t]);

  const inbox: InboxDecision[] = runDecisions
    .filter((d) => t >= decisionAt(d))
    .map((d) => ({ id: d.id, title: d.title, detail: d.detail, primary: d.options[0], secondary: d.options[1] }));

  const renderAgent = (a: Agent, nested: boolean) => {
    const s = agentStatus(a, t);
    const f = agentFrac(a, t);
    const elapsed = Math.max(0, Math.min(t, a.end ?? run.durationMs) - a.start);
    const tools = a.tools.map((x) => ({ x, s: toolStatus(x, t) })).filter((v) => v.s !== null);
    const children = !nested ? (a.children ?? []) : [];
    return (
      <li key={a.id} className="agent">
        <div className="agent-row">
          <span className="status">
            <span className="dot" data-s={s} aria-hidden="true" />
            {STATUS_WORD[s]}
          </span>
          <div className="agent-main">
            <span className="agent-name">{ROLE[a.role]}</span>
            {a.slice && <span className="agent-slice">{a.slice}</span>}
            <span className="agent-figs">
              <span className="tag tag--mono">{a.model}</span>
              {s !== "idle" && (
                <>
                  <span>{dur(elapsed)}</span>
                  <span>{tokens(Math.round(a.tokens * f))} tokens</span>
                  <span>{usd(a.costUsd * f)}</span>
                </>
              )}
            </span>
          </div>
        </div>
        {tools.length > 0 && (
          <div className="agent-tools">
            {tools.map(({ x, s: ts }) => (
              <ToolCallCard
                key={`${round}-${x.id}`}
                name={x.name}
                summary={ts === "running" ? <ShimmerText>{x.summary}</ShimmerText> : x.summary}
                icon={<Icon name={TOOL_ICON[x.name] ?? "terminal"} />}
                status={ts!}
                args={x.args}
                result={ts === "running" ? undefined : x.result}
                error={x.error}
                duration={x.end != null ? x.end - x.start : undefined}
                startedAt={!replaying && x.end == null ? loadedAt - (run.durationMs - x.start) : undefined}
                defaultOpen={!replaying && x.status === "error"}
              />
            ))}
          </div>
        )}
        {children.length > 0 && <ul className="agent-children">{children.map((c) => renderAgent(c, true))}</ul>}
      </li>
    );
  };

  return (
    <section className="section" id="demo" aria-labelledby="demo-title">
      <div className="wrap">
        <div className="section-head">
          <h2 id="demo-title">{demo.title}</h2>
          <p className="section-lead">{demo.lead}</p>
        </div>

        <div className="window">
          <div className="window-bar">
            <div className="window-title">
              <strong>{run.repo}</strong>
              <span>{run.plan}</span>
            </div>
            <div className="window-figs">
              <span className="tag">{run.stage}</span>
              <span className="tag">{dur(t)}</span>
              <span className="tag">
                <NumberTicker value={totals.tok} locale="en-US" duration={500} />
                &nbsp;tokens
              </span>
              <span className="tag">
                <NumberTicker
                  value={totals.cost}
                  locale="en-US"
                  duration={500}
                  format={{ style: "currency", currency: "USD", minimumFractionDigits: 2 }}
                />
              </span>
            </div>
          </div>

          <div className="window-body">
            <div>
              <h3 className="pane-label">Agents</h3>
              <ul className="agents">{renderAgent(orchestrator, false)}</ul>
            </div>
            <div>
              <h3 className="pane-label">Decisions</h3>
              <DecisionInbox key={round} decisions={inbox} />
            </div>
          </div>
        </div>

        <div className="demo-foot">
          <Button variant="secondary" size="sm" icon={<Icon name="replay" />} loading={replaying} onClick={replay}>
            {replaying ? "Replaying" : "Replay run"}
          </Button>
        </div>
      </div>
    </section>
  );
}
