import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { decisions, type Decision } from "../../../../shared/run";

/*
 * Hand-rolled: AgentPrism renders traces only. It has no approval, question or
 * action component, so the three decisions are plain buttons styled with the
 * Open AFlow tokens.
 */

type Phase = "open" | "confirmed" | "folded";

const CONFIRMED_LABEL: Record<Decision["kind"], string> = {
  question: "Answer sent",
  "merge-pr": "Done",
  continue: "Sent to the run",
};

function DecisionCard({
  decision,
  agentLabel,
  phase,
  answer,
  onAnswer,
}: {
  decision: Decision;
  agentLabel?: string | undefined;
  phase: Phase;
  answer?: string | undefined;
  onAnswer: (option: string) => void;
}) {
  const [primary, secondary] = decision.options;

  return (
    <li className="decision" data-phase={phase} aria-hidden={phase === "folded" ? true : undefined}>
      <div className="decision-inner">
        <div className="decision-body">
          {phase === "confirmed" ? (
            <p className="decision-confirm" role="status">
              <span className="status-col">
                <Check aria-hidden="true" className="check" size={16} strokeWidth={2} />
              </span>
              <span>
                {CONFIRMED_LABEL[decision.kind]}: <strong>{answer}</strong>
              </span>
            </p>
          ) : (
            <>
              <div className="decision-head">
                <span className="status-col">
                  <span className="dot needs-you" aria-hidden="true" />
                </span>
                <h4>{decision.title}</h4>
                {agentLabel ? <span className="tag">{agentLabel}</span> : null}
              </div>
              <p className="decision-detail">{decision.detail}</p>
              <div className="decision-actions">
                <button className="btn primary sm" type="button" onClick={() => onAnswer(primary)} tabIndex={phase === "folded" ? -1 : undefined}>
                  {primary}
                </button>
                <button className="btn sm" type="button" onClick={() => onAnswer(secondary)} tabIndex={phase === "folded" ? -1 : undefined}>
                  {secondary}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export function Decisions({
  visibleIds,
  agentLabels,
  resetKey,
}: {
  visibleIds: ReadonlySet<string>;
  agentLabels: Record<string, string>;
  resetKey: number;
}) {
  const [phase, setPhase] = useState<Record<string, Phase>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const timers = useRef<number[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPhase({});
    setAnswers({});
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, [resetKey]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const answer = (id: string, option: string) => {
    setAnswers((a) => ({ ...a, [id]: option }));
    setPhase((p) => ({ ...p, [id]: "confirmed" }));
    timers.current.push(
      window.setTimeout(() => {
        setPhase((p) => ({ ...p, [id]: "folded" }));
        listRef.current?.focus();
      }, 1400),
    );
  };

  const shown = decisions.filter((d) => visibleIds.has(d.id));
  const open = shown.filter((d) => (phase[d.id] ?? "open") !== "folded");

  return (
    <div className="decisions" ref={listRef} tabIndex={-1} aria-labelledby="needs-you-title">
      <div className="panel-head">
        <h3 id="needs-you-title">Needs you</h3>
        <span className="tag" aria-live="polite">
          {open.length}
        </span>
      </div>
      <ul>
        {shown.map((d) => (
          <DecisionCard
            key={d.id}
            decision={d}
            agentLabel={d.agentId ? agentLabels[d.agentId] : undefined}
            phase={phase[d.id] ?? "open"}
            answer={answers[d.id]}
            onAnswer={(o) => answer(d.id, o)}
          />
        ))}
      </ul>
      {open.length === 0 ? <p className="empty muted">Nothing needs you right now.</p> : null}
    </div>
  );
}
