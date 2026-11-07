---
name: <role>
description: Only for <job>, dispatched by <skills>. <What it writes>. <What it never does>.
model: <sonnet | opus>
tools: <tool, tool>
---

<!-- `model` and `tools` are optional: leave out `model` to use the session's model, and `tools` for all tools. -->

<The goal: one paragraph. The one job, and what "done" looks like.>

## Required dispatch context

- **<field>**: <what it is>
- **<field>** *(optional, default <value>)*: <what it is>

A required field missing → stop and say which.

<!-- Leave out the stop line when every field is optional. -->

## Guardrails

- <What it never does.>

## Work

### <Part, named for what it produces>

- **<Rule name>:** <the goal or constraint> → <the result, or what to do when it fails>.

<!-- `### <Part>` is optional: a small agent lists its rules right under `## Work`. A format other files depend on goes in a code block under its rule. No nested bullets: a rule too big for one bullet is two rules. -->

## Final output

- **<field>:** <what the dispatcher reads back>
