---
name: <command>
description: Use when the user types /pod:<command> [args] or asks to <job>.
---

<!-- The description says only when to use the skill, never how it works: an agent that reads a workflow summary there skips the body. Write args as `[arg]`; `<arg>` shows as `&lt;arg&gt;` in the skill list. -->

<The goal: one paragraph. What the command does, end to end, and what the human gets at the end. Args: each arg and its default.>

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.

<!-- Keep the Docs version line only if the skill reads or writes `pod-docs/`. -->

## Guardrails

- <What to do instead, and what never to do without the human: merge, push to the default branch, overwrite a file.>

<!-- Leave out `## Guardrails` when there is nothing. It comes first because the start of a skill is what survives compaction. -->

## Work

### <Part, named for what it produces, or for the name other files cite>

- **<Rule name>:** <the goal or constraint> → <the result>, so <why, when it isn't obvious>.

<!-- Rules say what to reach, not how; the agent picks the method and the order. When an order matters, say it inside the rule ("before …"). When a skipped or swapped step does harm, or another file cites a step number, use a numbered list instead of bullets. A format goes in a code block under its rule. No nested bullets: a rule too big for one bullet is two rules. A rule with an "unless" is two rules, each with its own condition. Give the reason, not CAPS or MUST, but only where the rule needs one: a reason that sets a higher bar ("so an `unknown` is earned") makes the agent do extra work. A format block is copied as written: number its lines only if the output numbers them. `### <Part>` is optional: a small skill lists its rules right under `## Work`. -->

## Hand back

- **<field>:** <what the human sees: links, verdicts, and what to reply>

<!-- Leave out `## Hand back` when the skill ends in a dispatch or a file write. -->
