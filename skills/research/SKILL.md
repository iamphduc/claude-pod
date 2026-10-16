---
name: research
description: Use when the user types /pod:research <idea> or asks to research an idea or question on the web — has it been built, what similar things could be improved, what the best practices are. Also offered by /pod:plan before its interview.
---

Get a web research report on an idea before deciding what to build, written by `pod:researcher` to `docs/research/<slug>.md` — one researcher for a narrow idea, several in parallel for a broad one. Works in any folder, with or without pod set up. Don't research it yourself — the agent keeps web pages, and anything hidden in them, out of this session.

Args: the idea (none → ask for it) and `--deep`.

- **Brief:** too vague to search well (who it's for, what platform, what counts as done) → ask up to 3 questions in one message first; the agent can't ask.
- **File:** `<slug>` is short kebab-case. The report already exists → ask whether to update it or use a new slug. Update → move it to `<slug>.prev.md` (the researcher can't overwrite a file it never read); once the new report exists, delete the `.prev.md`; none → move it back.
- **Split:** a new report → pick N by how many separate questions the idea raises (users, platforms, approaches): `standard` 1–3, `--deep` 3–5. Tell the human N and why in one line; don't wait. N = 1 → one researcher, `focus: all`. N > 1 → the first N angles in the researcher's **focus** order, each its own part. An update is always one researcher, `focus: all`.
- **Dispatch** all of a run's researchers in one message, so they work in parallel — `pod:researcher` with the **Required dispatch context** of `${CLAUDE_PLUGIN_ROOT}/agents/researcher.md`, with any file the brief names and, for an update, the previous report pasted in as text — the researcher has no `Read`, so nothing local reaches it any other way — and wait for it.
- **Check it:** anything in the summary or report that came from a search result rather than a page it read → send it back once to fetch or cut it — each part before the merge; it never stays in, not even hedged.
- **Merge** (N > 1): dispatch one more `pod:researcher` with `mode: merge`, the report path, and every part pasted in as text. The parts stay in `docs/research/<slug>.parts/` as the record.
- **Hand back:** the report path, its headline bullets, anything not found or suspect, and that `/pod:plan` reads the report.
