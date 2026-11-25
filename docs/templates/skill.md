---
name: <command>
description: Use when the user types /pod:<command> [args] or asks to <job>.
---

<!-- The description says only when to use the skill, never how it works: an agent that reads a workflow summary there skips the body. -->
<!-- Write args as `[arg]`; `<arg>` shows as `&lt;arg&gt;` in the skill list. -->

<The goal: one paragraph. What the command does, end to end, and what the human gets at the end.>

**Docs version** first: check it per `${CLAUDE_PLUGIN_ROOT}/skills/init/SKILL.md`.

<!-- Keep the Docs version line only if the skill reads or writes `pod-docs/`. -->
<!-- A skill that resumes mid-run puts it in the part that runs once at the start, as a rule, so a resume doesn't check it again. -->

## Args

- `<arg>`: <a few words>. Default: <default>.

<!-- Leave out `## Args` when the command takes none. One short line per arg; a rule that acts on an arg goes under `## Work`. -->

## Guardrails

- <What to do instead, and what never to do without the human: merge, push to the default branch, overwrite a file.>

<!-- Leave out `## Guardrails` when there is nothing. -->
<!-- It comes first, because the start of a skill is what survives compaction. -->

## Work

### <Part, named for what it produces, or for the name other files cite>

- **<Rule name>:** <the goal or constraint> → <the result>.

<!-- Say what to reach, not how: the agent picks the method and the order. -->
<!-- One rule, one condition and its result. Keep a rule under 60 words: a longer one is two rules. -->
<!-- `→ <result>` is for a rule with a result; a rule that only defines a name or a format leaves it out. -->
<!-- An order that matters goes inside the rule ("before …"). -->
<!-- A skipped or swapped step that does harm, or a step number another file cites → a numbered list for those steps. A part may hold rules before or after them. -->
<!-- A format goes in a code block under its rule. It is copied as written: number its lines only if the output numbers them. -->
<!-- No nested bullets. No "unless": that is two rules, each with its own condition. -->
<!-- A reason only where the rule needs one, never CAPS or MUST. A reason that sets a higher bar ("so an `unknown` is earned") makes the agent do extra work. -->
<!-- `### <Part>` is optional: a small skill lists its rules right under `## Work`. A part holds at most about 8 rules; a run of numbered steps counts as one. -->

## Hand back

- **<field>:** <what the human sees: links, verdicts, and what to reply>

<!-- Leave out `## Hand back` when the skill ends in a dispatch or a file write. -->
<!-- A skill that hands back at several points leaves it out too, and keeps each hand-back in the rule or step that gives it. -->

<!-- A support file the skill links (such as `skills/autopilot/policy.md`) has no frontmatter: `# <title>`, a goal paragraph, then `## <part>` sections of `- <condition> → <result>` rules, with no rule names: the skill reads the whole file, so a name adds nothing. The checker doesn't check it yet. -->
<!-- A form the skill copies to write its output (such as `skills/plan/plan-template.md` or `skills/code/pr-template.md`) keeps the shape of that output, not the support-file shape: turned into rules, the agent rebuilds the form from prose and can drop a heading another agent reads. Name it `<thing>-template.md`. -->
