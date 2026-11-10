---
type: regex
# Each change a person can see gets a step: mark read with Undo, sort, and the dark theme, in any order.
pattern: '## Try it[ \t]*\r?\n(?=(?:[ \t]*\r?\n|\d+\. [^\n]*\n)*\d+\. [^\n]*Undo)(?=(?:[ \t]*\r?\n|\d+\. [^\n]*\n)*\d+\. [^\n]*[Ss]ort)(?=(?:[ \t]*\r?\n|\d+\. [^\n]*\n)*\d+\. [^\n]*[Dd]ark)'
---
