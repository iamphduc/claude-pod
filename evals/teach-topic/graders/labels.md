---
type: regex
# Reasons carry a label.
target: { source: file, path: pod-docs/teach/billing.html }
pattern: '\b(known|inferred|unknown)\b'
flags: i
---
