---
type: regex
# The no is recorded, so later runs don't ask again.
target: { source: file, path: pod-docs/decisions.md }
pattern: '^## [0-9-]+ — CI: none'
flags: m
---
