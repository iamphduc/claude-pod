---
type: regex
# The plan section ends with a `### Try it` that copies the final PR's steps: pod-flow reads it at gate 7.
pattern: '### Try it[ \t]*\r?\n(?:[ \t]*\r?\n)*1\. Add a friend[^\n]*→[^\n]*\r?\n2\. Open an invite link[^\n]*→'
---
