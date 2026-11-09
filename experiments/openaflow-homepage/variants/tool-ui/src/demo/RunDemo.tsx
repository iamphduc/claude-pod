import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { RotateCcw } from "lucide-react";
import { ProgressTracker } from "@/components/tool-ui/progress-tracker";
import { Terminal } from "@/components/tool-ui/terminal";
import { ApprovalCard, type ApprovalDecision } from "@/components/tool-ui/approval-card";
import { run } from "../../../../shared/run";
import {
  RUN_END,
  agentsTracker,
  bashTerminals,
  decisionCards,
  formatCost,
  formatDuration,
  formatTokens,
  toolsTracker,
  totals,
} from "./map";

const REPLAY_MS = 9000;

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Replays the run's ms offsets over a few seconds; reduced motion jumps to the end. */
function useReplay() {
  const [t, setT] = useState(() => (prefersReducedMotion() ? RUN_END : 0));
  const frame = useRef(0);

  const play = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (prefersReducedMotion()) {
      setT(RUN_END);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const f = Math.min(1, Math.max(0, (now - start) / REPLAY_MS));
      // Ease out so the last minutes, where the action is, get more screen time.
      setT(Math.round(RUN_END * (1 - Math.pow(1 - f, 1.6))));
      if (f < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    play();
    return () => cancelAnimationFrame(frame.current);
  }, [play]);

  return { t, play, done: t >= RUN_END };
}

function StatusDot({ tone }: { tone: "running" | "blocked" | "ready" | "needs-you" | "idle" }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block size-2 shrink-0 rounded-full"
      style={{ background: `var(--${tone})` }}
    />
  );
}

/** Escape inside an ApprovalCard calls onCancel; for "Open on GitHub" or "Skip the check" that is wrong, so swallow it. */
function stopEscape(e: KeyboardEvent) {
  if (e.key === "Escape") e.stopPropagation();
}

export function RunDemo() {
  const { t, play, done } = useReplay();
  const [choices, setChoices] = useState<Record<string, ApprovalDecision>>({});

  const agents = agentsTracker(t);
  const tools = toolsTracker(t);
  const terminals = bashTerminals(t);
  const visibleDecisions = decisionCards.filter((d) => d.appearsAt <= t);
  const open = visibleDecisions.filter((d) => !choices[d.id]).length;

  const replay = () => {
    setChoices({});
    play();
  };

  const needsHeading = useRef<HTMLHeadingElement>(null);
  // The card unmounts into a receipt, which would drop focus to <body>; keep it in the panel.
  const decide = (id: string, choice: ApprovalDecision) => {
    setChoices((c) => ({ ...c, [id]: choice }));
    requestAnimationFrame(() => needsHeading.current?.focus());
  };

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--bg)]">
      {/* Hand-rolled: the run header (tool-ui has no "run summary" surface). */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-[var(--surface)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <StatusDot tone={done ? (open ? "needs-you" : "running") : "running"} />
          <span className="font-medium whitespace-nowrap">{run.repo}</span>
          <span className="truncate text-[length:var(--size-dense)] text-[var(--muted)]">
            {run.plan}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[length:var(--size-micro)] text-[var(--muted)]">
          <span className="rounded-[var(--radius-sm)] border px-2 py-0.5">{run.stage}</span>
          <span className="font-mono text-[length:var(--size-small)] tabular-nums">
            {formatDuration(Math.min(t, RUN_END))} · {formatTokens(totals.tokens)} tokens ·{" "}
            {formatCost(totals.cost)}
          </span>
        </div>
        <button
          type="button"
          onClick={replay}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg)] pr-3 pl-2.5 text-[length:var(--size-dense)] font-medium hover:bg-[var(--hover)]"
        >
          <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden="true" />
          Replay
        </button>
      </div>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="demo-agents" className="flex flex-col gap-3">
            <h3 id="demo-agents" className="text-[length:var(--size-dense)] font-semibold">
              Agents
            </h3>
            <ProgressTracker {...agents} className="max-w-none min-w-0" />
          </section>

          <section aria-labelledby="demo-tools" className="flex flex-col gap-3">
            <h3 id="demo-tools" className="text-[length:var(--size-dense)] font-semibold">
              Tool calls
            </h3>
            {tools ? (
              <ProgressTracker {...tools} className="max-w-none min-w-0" />
            ) : (
              <p className="text-[length:var(--size-dense)] text-[var(--muted)]">Starting…</p>
            )}
            {terminals.map((term) => (
              <Terminal key={term.id} {...term} className="min-w-0" />
            ))}
          </section>
        </div>

        <section aria-labelledby="demo-needs" className="order-first flex min-w-0 flex-col gap-3 lg:order-none">
          <h3
            id="demo-needs"
            ref={needsHeading}
            tabIndex={-1}
            className="flex items-center gap-2 text-[length:var(--size-dense)] font-semibold"
          >
            Needs you
            <span className="font-mono text-[length:var(--size-small)] font-normal text-[var(--muted)]">
              {open}
            </span>
          </h3>
          <div aria-live="polite" className="flex flex-col gap-3">
            {visibleDecisions.length === 0 && (
              <p className="text-[length:var(--size-dense)] text-[var(--muted)]">Nothing yet.</p>
            )}
            {visibleDecisions.map(({ appearsAt: _appearsAt, ...card }) => (
              <div key={card.id} onKeyDownCapture={stopEscape}>
                <ApprovalCard
                  {...card}
                  className="max-w-none min-w-0"
                  choice={choices[card.id]}
                  onConfirm={() => decide(card.id, "approved")}
                  onCancel={() => decide(card.id, "denied")}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
