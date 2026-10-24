---
type: regex
# A new BLOCKED says what still fails, so the human can answer again.
target: { source: file, path: pod-docs/handoff-queue.md }
pattern: '\[(?!2026-10-20)\d{4}-\d\d-\d\d · BLOCKED · orchestrator → human[^\n]*src/greet\.js[^\n]*\*\*Resolution:\*\* pending'
---
