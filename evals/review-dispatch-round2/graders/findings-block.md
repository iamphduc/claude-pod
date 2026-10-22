---
type: tool_used
tool: Agent
# Findings in an indented block under their label, not squashed onto it. The input is matched as JSON,
# so a line break is the two characters \n: [\s\S]{1,2} takes either form.
input_match: '\*\*[Rr]ound-1 findings:\*\*[\s\S]{1,2} {2,}\S[\s\S]*?empty name[\s\S]*?Ann Lee'
---
