---
name: report
description: Use when the user types /pod:report [plan-slug] or asks for a report of what a plan built. Also run by /pod:code and /pod:autopilot at plan complete. Writes one self-contained HTML file — key features, key decisions, data structures, and how the agents worked together — from the plan's paper trail and the code.
---

Write `docs/reports/<plan-slug>.html`: a page a person can read in about ten minutes to learn what the plan built, why it's shaped that way, and how the agents got there. Change nothing else.

**Who runs it.** Asked directly → you. At plan complete, the orchestrator hands it to a background agent and passes this file's path, the plan slug, the parent-repo path, the merge-target, and the final PR's URL and review verdict. Plan slug not given → the newest plan in `docs/plans/`; several equally likely → ask.

## Gather — from files and GitHub, not memory

Read before writing; where memory and files disagree, the files win:

- the plan (Goal, Scope, Key decisions, Look, Verification);
- every sprint doc for it (`docs/sprints/archive/`, and an active one) — status boards, criteria, and each **Sprint summary**;
- `docs/decisions.md` entries and `docs/handoff-queue.md` entries from this plan (attribute each by its `from → to` header);
- the wave PRs, the `Review fixes` PR, and the final PR with its reviewer comments (`gh`);
- the plan branch's first-parent history, for the timeline and start and end times;
- the code, for data structures: schema, main types, API routes, any state machine — with their paths.

## Write — one HTML file

Self-contained and offline: inline CSS and SVG, no scripts, fonts, or requests from elsewhere. Readable first: clear type, body text ≥ 16 px, good contrast in light and dark, a table of contents, tables that scroll sideways on a phone. If the plan has a Look, borrow its palette and display font for headings. Use the `frontend-design` skill if you have it.

About 2,000 words — tables and short lines over paragraphs. Sections, in order:

1. **At a glance** — the goal, what shipped, and the numbers: sprints, waves, slices, PRs, wall time, agent tokens as the Sprint summaries report them (saying what they measure), and the review verdict and rounds. The report is written before the final merge: name the final PR by number and verdict, never as `open` or `merged`.
2. **Key features** — what a user can do now, each tied to the plan's Verification criteria (met / not met / not checked). With a UI, one or two screenshots at desktop and 375 px: install dependencies in the parent repo first, run the app per the smoke recipe on `3000`/`3001`, embed as JPEG `data:` URIs no wider than 1200 px, and stop what you started.
3. **Key decisions** — one short card each: the decision, why, the alternatives, the consequence; whether the human or an agent made it; links to its `decisions.md` entry and any design draft.
4. **Data structures** — each table, model, or type that matters (fields, where it lives, who uses it), the API as a table, and a small SVG diagram when there are more than three.
5. **How the agents worked together** — a timeline, one row per wave: slices, what the engineers reported, what the orchestrator did, the PR. A short paragraph only where something happened (a wave fix, a stall, a halt, a human answer). Then the review and fix pass. Mark every point the human stepped in.
6. **What's left** — open queue entries as **Fix next / Before hosting / Someday**, one line each.
7. **Sources** — the files, PRs, and commits used.

Accuracy: quote agents only exactly, never invent a line; say plainly when something couldn't be found; label every estimate as one.

## Finish

Check the file opens, makes no network requests outside **Sources** links, and has every section. Reply with its path and how to open it. When the orchestrator ran you, return to it — it commits the report with the plan's close-out.
