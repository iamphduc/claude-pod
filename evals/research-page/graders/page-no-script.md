---
type: regex
# Web pages fed it, so the page must not run anything.
target: { source: file, path: pod-docs/research/habit-tracker.html }
pattern: '<script'
match: not_contains
flags: i
---
