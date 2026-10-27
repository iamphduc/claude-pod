---
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
# The low-confidence halt is a PENDING whose body starts with the gate prefix.
pattern: '· PENDING · orchestrator → human[^\]\n]*\]`? gate 6 \(escalation-valve\): [^\n]*pull/12'
---
