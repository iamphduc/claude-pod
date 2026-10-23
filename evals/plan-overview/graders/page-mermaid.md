---
type: regex
# The page draws the diagrams with Mermaid pinned to a version.
target: { source: file, path: pod-docs/design-drafts/api-keys-overview.html }
pattern: 'mermaid@\d+(\.\d+)*'
---
