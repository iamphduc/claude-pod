---
type: regex
# A billing page doesn't explain search's internals.
target: { source: file, path: pod-docs/teach/billing.html }
pattern: 'searchIndex'
match: not_contains
---
