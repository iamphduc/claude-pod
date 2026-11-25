---
type: tool_used
tool: Agent
# On the default branch, the task follows config.md's merge-target (staging), so nothing reaches main past staging.
input_match: '[Mm]erge[- ]?[Tt]arget( branch)?[^\n\w]{0,6}(origin/)?staging\b'
---
