---
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
# A final PR that waits only for the human's approval is a hand-back, not a gate 3.
pattern: 'gate 3'
match: not_contains
---
