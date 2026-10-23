---
type: regex
# The whole-system page covers every part: billing, search, and auth.
target: { source: file, path: pod-docs/teach/system.html }
pattern: '(?=[\s\S]*src/billing)(?=[\s\S]*src/search)(?=[\s\S]*src/auth)'
---
