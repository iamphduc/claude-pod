---
type: regex
# Applying the answer again would add a second Q1.
target: { source: file, path: pod-docs/sprints/one.md }
pattern: '### Q1[\s\S]*### Q1|\| Q1 \|[\s\S]*\| Q1 \|'
match: not_contains
---
