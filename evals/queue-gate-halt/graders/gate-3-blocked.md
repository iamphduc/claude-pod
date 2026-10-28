---
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
# A merge that has to wait is still gate 3, so BLOCKED, never PENDING.
pattern: '· BLOCKED · orchestrator → human[^\]\n]*\]`? gate 3 \(auto-merge-fail\): [^\n]*pull/13'
---
