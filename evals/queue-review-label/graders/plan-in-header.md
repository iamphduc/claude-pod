---
# The queue's Format line has no plan:, but the entry header still names the plan.
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
pattern: '\[\d{4}-\d\d-\d\d · PENDING · reviewer → [a-z]+ · plan: demo[ ·\]]'
---
