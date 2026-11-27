---
type: regex
# Between sprints, autopilot doesn't stop to ask the human to continue or to run /pod:sprint.
pattern: '[Rr]eply\W{0,3}continue|[Rr]un\W{0,3}/pod:sprint'
match: not_contains
---
