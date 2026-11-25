---
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
# A failed check on the final PR halts at gate 3, BLOCKED, naming the PR.
pattern: '· BLOCKED · orchestrator → human[^\]\n]*\]`? gate 3 \(auto-merge-fail\): [^\n]*pull/20'
---
