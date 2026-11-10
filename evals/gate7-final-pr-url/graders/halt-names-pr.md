---
type: regex
# The gate 7 halt names the PR left for the human: with no staging, the merged final PR. pod-flow reads its Try it list from that link.
target: { source: file, path: pod-docs/handoff-queue.md }
pattern: 'orchestrator → human[^\n]*`\s*gate 7[^\n]*pull/20[^\n]*\*\*Resolution:\*\* pending'
---
