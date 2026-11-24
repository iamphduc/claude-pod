---
type: regex
# The no is recorded, so later runs don't ask again.
target: { source: file, path: pod-docs/config.md }
pattern: '^ci:[ \t]*off[ \t]*$'
flags: m
---
