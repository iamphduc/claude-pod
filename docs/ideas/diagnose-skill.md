# Idea: split diagnosis out of /pod:fix

Status: parked — come back after the pstack work.

## The idea

A new `/pod:diagnose <symptom>` that only finds what's wrong and reproduces it, never fixes. `/pod:fix` calls it first for bugs, then an engineer fixes from its report.

Inspired by pstack's Runtime forensics / Trace forensics playbooks, which stop at the diagnosis ([flaviocopes.com/pstack](https://flaviocopes.com/pstack)).

## Why

- "Tell me what's wrong, don't touch code" has no pod command today.
- Diagnosis can stop a fix: can't reproduce, or works as designed → no code gets written.
- The engineer starts from known steps and a known cause instead of investigating and fixing at once.

## Sketch

- **Agent `pod:diagnoser`**: read-only on code (Read, Grep, Glob, Bash), runs the app in its own detached worktree. Background agent, not the main session, because reproducing means installing and running the app.
- **Report**: repro steps, what went wrong, the cause at `file:line`, confidence, causes ruled out. Saved to `docs/diagnoses/<slug>.md` so a later `/pod:fix` can pick it up.
- **`/pod:fix`**: runs diagnose for bugs only (a feature task skips it). The engineer turns the repro steps into its first failing test and re-runs them after the fix — one reproduction, not two.
- **Engineer**: drop the "find what causes it" line added in `feat/repro-and-dismissed`; keep its **Repro** output. The reviewer's "fixes the cause, not the symptom" check stays.
- **Driving it by hand**:
  - `/pod:diagnose --here <symptom>`: runs in the current chat, following the agent's file, so the human can steer it. Costs main-chat context.
  - `claude --agent pod:diagnoser` in a new terminal: works with no extra code (same trick as `/pod:create-wave-prompts`).

## Open questions

- Should `/pod:fix` pause after diagnosis? Leaning: only when it can't reproduce, isn't sure of the cause, or thinks it isn't a bug; otherwise go straight on.
- Add `--here`? Leaning yes.
- Overlap with the user's `diagnosing-bugs` skill (live, in-session, hard bugs). Different job: pod's runs in the background and hands a report to an engineer.

## Costs

- One more agent run per bug fix (time, tokens).
- One more agent file and skill to keep in sync with the engineer and reviewer.
