---
type: regex
# Self-contained: no scripts on the board.
target: { source: file, path: pod-docs/ideas/index.html }
pattern: '<script'
match: not_contains
flags: i
---
