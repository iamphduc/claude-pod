---
type: tool_used
tool: Agent
# The merge target is never main here: config sends work to staging.
input_match: '[Mm]erge[- ]?[Tt]arget( branch)?[^\n\w]{0,6}(origin/)?main\b'
min: 0
max: 0
---
