---
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
# The one-way slice's entry names the wave PR by number, then what can't be undone, then how to undo it: pod-flow reads it as `PR #74: <what>`.
pattern: '· PENDING · orchestrator → human[^\]\n]*\]`? one-way door in PR #74 — [^\n]*undo: '
---
