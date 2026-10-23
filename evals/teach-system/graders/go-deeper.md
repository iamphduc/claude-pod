---
type: regex
# Ends with topics to learn next, each as a /pod:teach command.
target: { source: file, path: pod-docs/teach/system.html }
pattern: '/pod:teach [a-z]'
---
