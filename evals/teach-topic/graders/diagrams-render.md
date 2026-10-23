---
type: regex
# Loading Mermaid isn't enough: the page must start it, or the diagrams never draw.
target: { source: file, path: pod-docs/teach/billing.html }
pattern: 'mermaid\.(initialize|run)\s*\('
---
