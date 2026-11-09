import type { DynamicToolUIPart } from "ai";
import { CheckIcon, ChevronDownIcon, RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Agent,
  AgentContent,
  AgentHeader,
} from "@/components/ai-elements/agent";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
  Plan,
  PlanAction,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";
import { Task, TaskContent, TaskTrigger } from "@/components/ai-elements/task";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Decision, Status } from "../../../../shared/run";
import {
  type AgentView,
  decisions,
  decisionTime,
  fmtCost,
  fmtDuration,
  fmtTokens,
  orchestrator,
  run,
  viewAgent,
} from "./mapRun";

const REPLAY_MS = 9000;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Replays the run's clock from 0 to its duration over a few seconds. */
function useReplay() {
  const [t, setT] = useState(() =>
    prefersReducedMotion() ? run.durationMs : 0
  );
  const frame = useRef(0);

  const start = useCallback(() => {
    cancelAnimationFrame(frame.current);
    if (prefersReducedMotion()) {
      setT(run.durationMs);
      return;
    }
    const begin = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - begin) / REPLAY_MS);
      setT(Math.round(p * run.durationMs));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    start();
    return () => cancelAnimationFrame(frame.current);
  }, [start]);

  return { t, replaying: t < run.durationMs, replay: start };
}

/* ---------- hand-rolled: AI Elements has no status dot ---------- */

const STATUS_DOT: Record<Status, string> = {
  done: "bg-st-ready",
  running: "bg-st-running",
  blocked: "bg-st-blocked",
  "needs-you": "bg-st-needs-you",
  idle: "bg-st-idle",
};

const STATUS_WORD: Record<Status, string> = {
  done: "done",
  running: "running",
  blocked: "blocked",
  "needs-you": "needs you",
  idle: "idle",
};

function StatusCell({ status }: { status: Status }) {
  return (
    <span className="flex w-[72px] shrink-0 items-center gap-2 text-muted-foreground text-xs">
      <span
        aria-hidden="true"
        className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[status])}
      />
      {STATUS_WORD[status]}
    </span>
  );
}

function Figures({ items }: { items: string[] }) {
  return (
    <span className="font-mono text-muted-foreground text-xs">
      {items.join(" · ")}
    </span>
  );
}

/* ---------- library pieces ---------- */

function ToolCallView({ part }: { part: DynamicToolUIPart }) {
  return (
    <Tool
      className="mb-0 bg-background"
      defaultOpen={part.state === "output-error"}
      // Remount when the call fails so the error opens by default.
      key={`${part.toolCallId}-${part.state === "output-error"}`}
    >
      <ToolHeader
        className="px-3 py-2"
        state={part.state}
        title={`${part.toolName} · ${part.title}`}
        toolName={part.toolName}
        type="dynamic-tool"
      />
      <ToolContent className="space-y-3 px-3 pt-0 pb-3">
        <ToolInput input={part.input} />
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
  );
}

function AgentView({
  view,
  children,
}: {
  view: AgentView;
  children?: React.ReactNode;
}) {
  const { agent } = view;
  const hasBody = view.parts.length > 0 || children;
  return (
    <Agent className="bg-background">
      <AgentHeader
        className="px-3 py-3 sm:px-4"
        leading={<StatusCell status={view.status} />}
        model={agent.model}
        name={view.name}
      >
        <Figures
          items={[
            fmtDuration(view.elapsedMs),
            fmtTokens(view.tokens),
            fmtCost(view.costUsd),
          ]}
        />
      </AgentHeader>
      {hasBody && (
        <AgentContent className="space-y-2 px-3 pb-3 sm:px-4">
          {view.parts.map((p) => (
            <ToolCallView key={p.toolCallId} part={p} />
          ))}
          {children}
        </AgentContent>
      )}
    </Agent>
  );
}

type Answer = { index: 0 | 1 };

function DecisionView({
  decision,
  answer,
  onAnswer,
}: {
  decision: Decision;
  answer?: Answer;
  onAnswer: (index: 0 | 1) => void;
}) {
  const doneRef = useRef<HTMLDivElement>(null);
  const answered = answer !== undefined;

  useEffect(() => {
    if (answered) doneRef.current?.focus();
  }, [answered]);

  const chosen = answer ? decision.options[answer.index] : "";
  const approval = answer
    ? { id: decision.id, approved: answer.index === 0, reason: chosen }
    : { id: decision.id };
  const folded = (
    <div
      className="flex items-center gap-2 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
      ref={doneRef}
      tabIndex={-1}
    >
      <CheckIcon aria-hidden="true" className="size-4 shrink-0 text-st-ready" />
      <span>
        <span className="font-medium">{chosen}</span>
        <span className="text-muted-foreground"> · {decision.title}</span>
      </span>
    </div>
  );

  return (
    <Confirmation
      approval={approval}
      className={cn(
        "gap-3 rounded-lg bg-background px-4 py-3 transition-colors",
        answered && "bg-surface py-2"
      )}
      state={answered ? "approval-responded" : "approval-requested"}
    >
      <ConfirmationTitle className="block">
        <ConfirmationRequest>
          <span className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className="mt-1.5 size-2 shrink-0 rounded-full bg-st-needs-you"
            />
            <span className="grid gap-1">
              <span className="font-medium text-foreground">
                {decision.title}
              </span>
              <span>{decision.detail}</span>
            </span>
          </span>
        </ConfirmationRequest>
        <ConfirmationAccepted>{folded}</ConfirmationAccepted>
        <ConfirmationRejected>{folded}</ConfirmationRejected>
      </ConfirmationTitle>
      <ConfirmationActions className="flex-wrap justify-start self-start pl-4">
        <ConfirmationAction onClick={() => onAnswer(0)}>
          {decision.options[0]}
        </ConfirmationAction>
        <ConfirmationAction onClick={() => onAnswer(1)} variant="outline">
          {decision.options[1]}
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
}

export function LiveDemo() {
  const { t, replaying, replay } = useReplay();
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const orch = viewAgent(orchestrator, t);
  const children = (orchestrator.children ?? [])
    .map((c) => viewAgent(c, t))
    .filter((v): v is AgentView => v !== null);
  const all = [orch, ...children].filter((v): v is AgentView => v !== null);
  const totalTokens = all.reduce((n, v) => n + v.tokens, 0);
  const totalCost = all.reduce((n, v) => n + v.costUsd, 0);

  const shown = decisions.filter((d) => decisionTime(d) <= t);
  const open = shown.filter((d) => !answers[d.id]).length;

  const onReplay = () => {
    setAnswers({});
    replay();
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Plan
        className="gap-4 rounded-xl bg-surface py-4"
        defaultOpen
        isStreaming={replaying}
      >
        <PlanHeader className="grid gap-1 px-4 sm:px-6">
          <PlanTitle className="text-base">{run.plan}</PlanTitle>
          <PlanDescription>{`${run.repo} · ${run.stage}`}</PlanDescription>
          <PlanAction className="flex gap-1">
            <Button
              aria-label="Replay the run"
              className="size-8"
              onClick={onReplay}
              size="icon"
              title="Replay the run"
              variant="ghost"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
            <PlanTrigger aria-label="Show or hide the run" />
          </PlanAction>
        </PlanHeader>
        <PlanContent className="space-y-3 px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <StatusCell status={orch?.status ?? "idle"} />
            <span className="font-medium">Run</span>
            <Figures
              items={[
                fmtDuration(t),
                fmtTokens(totalTokens),
                fmtCost(totalCost),
              ]}
            />
          </div>
          {orch && (
            <AgentView view={orch}>
              <Task defaultOpen>
                <TaskTrigger title={run.stage}>
                  <button
                    className="flex items-center gap-2 rounded-sm text-muted-foreground text-sm hover:text-foreground"
                    type="button"
                  >
                    <ChevronDownIcon className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                    {run.stage} · {children.length} agents
                  </button>
                </TaskTrigger>
                <TaskContent className="[&>div]:mt-3 [&>div]:border-border [&>div]:pl-3">
                  {children.map((v) => (
                    <AgentView key={v.agent.id} view={v} />
                  ))}
                </TaskContent>
              </Task>
            </AgentView>
          )}
        </PlanContent>
      </Plan>

      <section
        aria-labelledby="needs-you-title"
        className="grid gap-3 rounded-xl border bg-surface p-4"
      >
        <h3
          className="flex items-center gap-2 font-medium text-sm"
          id="needs-you-title"
        >
          <span
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full",
              open > 0 ? "bg-st-needs-you" : "bg-st-idle"
            )}
          />
          Needs you
          <span className="font-mono text-muted-foreground text-xs">
            {open}
          </span>
        </h3>
        <div aria-live="polite" className="grid gap-2">
          {shown.length === 0 && (
            <p className="text-muted-foreground text-sm">Nothing yet.</p>
          )}
          {shown.map((d) => (
            <DecisionView
              answer={answers[d.id]}
              decision={d}
              key={d.id}
              onAnswer={(index) =>
                setAnswers((a) => ({ ...a, [d.id]: { index } }))
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
