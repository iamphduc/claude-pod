import type { DeepReadonly, TraceSpan } from "@evilmartians/agent-prism-types";

import { flattenSpans, formatDuration, getTotalCost, getTotalTokens } from "@evilmartians/agent-prism-data";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { demo } from "../../../../shared/content";
import { type Agent, decisions, orchestrator, run } from "../../../../shared/run";
import { DetailsView } from "../components/agent-prism/DetailsView/DetailsView";
import { TreeView } from "../components/agent-prism/TreeView";
import { agentTitle, runToSpans } from "./runToTrace";
import { Decisions } from "./Decisions";

const REPLAY_MS = 6000;
const DEFAULT_SELECTED = "e2a";

const allAgents = (a: Agent): Agent[] => [a, ...(a.children ?? []).flatMap(allAgents)];
const agents = allAgents(orchestrator);
const agentLabels = Object.fromEntries(agents.map((a) => [a.id, agentTitle(a)]));
const agentIds = agents.map((a) => a.id);

/** When each decision appears in the run: once the thing it is about happened. */
const decisionAt: Record<string, number> = Object.fromEntries(
  decisions.map((d) => {
    const agent = agents.find((a) => a.id === d.agentId);
    if (!agent) return [d.id, run.durationMs];
    const failed = agent.tools.find((t) => t.status === "error")?.end;
    return [d.id, failed ?? agent.end ?? run.durationMs];
  }),
);

export function Demo() {
  const [at, setAt] = useState(run.durationMs);
  const [playing, setPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SELECTED);
  const [expanded, setExpanded] = useState<string[]>(agentIds);
  const raf = useRef(0);

  const spans = useMemo(() => runToSpans(at), [at]);
  const flat = useMemo(() => flattenSpans(spans), [spans]);
  const selected = flat.find((s) => s.id === selectedId);

  const replay = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setResetKey((k) => k + 1);
    setPlaying(true);
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / REPLAY_MS);
      setAt(Math.round(run.durationMs * p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const visibleDecisions = useMemo(
    () => new Set(decisions.filter((d) => (decisionAt[d.id] ?? 0) <= at).map((d) => d.id)),
    [at],
  );

  const root = spans[0];
  const totalTokens = flat.reduce((n, s) => n + (s.tokenUsage ? getTotalTokens(s.tokenUsage) : 0), 0);
  const totalCost = flat.reduce((n, s) => n + (s.tokenUsage ? getTotalCost(s.tokenUsage) : 0), 0);

  return (
    <section className="section demo" aria-labelledby="demo-title">
      <div className="section-head">
        <h2 id="demo-title">{demo.title}</h2>
        <p className="lead">{demo.lead}</p>
      </div>

      <div className="window">
        <div className="window-bar">
          <div className="run-title">
            <span className="status-col">
              <span className="dot running" aria-hidden="true" />
            </span>
            <strong>{run.repo}</strong>
            <span className="muted run-plan">{run.plan}</span>
          </div>
          <div className="run-meta">
            <span className="tag">{run.stage}</span>
            <span className="tag mono">{formatDuration(at)}</span>
            <span className="tag mono">{(totalTokens / 1000).toFixed(1)}k tokens</span>
            <span className="tag mono">${totalCost.toFixed(2)}</span>
            <button className="btn sm" type="button" onClick={replay} disabled={playing}>
              <RotateCcw aria-hidden="true" size={16} strokeWidth={1.75} />
              {playing ? "Replaying" : "Replay"}
            </button>
          </div>
        </div>

        <div className="window-grid">
          <div className="panel tree-panel">
            <div className="panel-head">
              <h3>Agents and tool calls</h3>
              <span className="muted small">Select a row for details</span>
            </div>
            {root ? (
              <TreeView
                spans={spans}
                expandedSpansIds={expanded}
                onExpandSpansIdsChange={(ids) => setExpanded([...ids])}
                onSpanSelect={(s: DeepReadonly<TraceSpan>) => setSelectedId(s.id)}
                selectedSpan={selected}
                spanCardViewOptions={{ expandButton: "inside" }}
              />
            ) : null}
          </div>

          <Decisions visibleIds={visibleDecisions} agentLabels={agentLabels} resetKey={resetKey} />

          <div className="panel details-panel">
            {selected ? (
              <DetailsView data={selected} allSpans={spans} className="ap-details" />
            ) : (
              <p className="muted empty">This step hasn't started yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
