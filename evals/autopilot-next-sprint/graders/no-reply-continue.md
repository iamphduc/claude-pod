---
type: regex
# Between sprints, autopilot doesn't stop to ask the human to continue.
pattern: '[Rr]eply\W{0,3}continue'
match: not_contains
---
