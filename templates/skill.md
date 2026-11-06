---
name: <command>
description: Use when the user types /pod:<command> <args> or asks to <job>.
---

<The goal: one paragraph. What the command does, end to end, and what the human gets at the end. Args: each arg and its default.>

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`. <Keep this line only if the skill reads or writes `pod-docs/`.>

## Guardrails

- <What it never does without the human: merge, push to the default branch, overwrite a file. Leave the section out if there is nothing.>

## <The work: steps or sections, named for the job>

- **<Step>:** <what to do> → <how you know it's done>.
- **Dispatch** `pod:<agent>` with every field in its **Required dispatch context** (`${CLAUDE_PLUGIN_ROOT}/agents/<agent>.md`). <Only if it sends an agent.>

## Hand back

<What the human sees at the end: links, verdicts, and what to reply.>
