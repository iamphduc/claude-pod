---
# The entry opens with the reviewer's label as <when> (<why>): now (product choice).
type: regex
target: { source: file, path: pod-docs/handoff-queue.md }
pattern: 'reviewer → human[^\]]*\]` now \(product choice\):'
---
