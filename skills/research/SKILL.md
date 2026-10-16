---
name: research
description: Use when the user types /pod:research <idea> or asks to research an idea or question on the web — has it been built, what similar things could be improved, what the best practices are. Also offered by /pod:plan before its interview.
---

Get a web research report on an idea before deciding what to build, written by `pod:researcher` to `docs/research/<slug>.md`. Works in any folder, with or without pod set up. Don't research it yourself — the agent keeps web pages, and anything hidden in them, out of this session.

Args: the idea (none → ask for it) and `--deep`.

- **Brief:** too vague to search well (who it's for, what platform, what counts as done) → ask up to 3 questions in one message first; the agent can't ask.
- **File:** `<slug>` is short kebab-case. The report already exists → ask whether to update it or use a new slug. Update → move it to `<slug>.prev.md` (the researcher can't overwrite a file it never read); once the new report exists, delete the `.prev.md`; none → move it back.
- **Dispatch** `pod:researcher` with the **Required dispatch context** of `${CLAUDE_PLUGIN_ROOT}/agents/researcher.md`, with any file the brief names and, for an update, the previous report pasted in as text — the researcher has no `Read`, so nothing local reaches it any other way — and wait for it.
- **Check it:** anything in the summary or report that came from a search result rather than a page it read → send it back once to fetch or cut it; it never stays in, not even hedged.
- **Hand back:** the report path, its headline bullets, anything not found or suspect, and that `/pod:plan` reads the report.
