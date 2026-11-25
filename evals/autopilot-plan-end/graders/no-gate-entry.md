---
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
# The plan's end is not a gate: no gate 2 or gate 7 halt entry of its own.
pattern: 'gate [27]\b'
match: not_contains
---
