---
name: report
description: Use when the user types /pod:report [plan-slug] or asks for a report of what a plan built. Also run by /pod:code and /pod:autopilot at plan complete. Writes one self-contained HTML file — key features, key decisions, data structures, and how the agents worked together — from the plan's paper trail and the code.
---

Write `docs/reports/<plan-slug>.html`: a page a person reads in about ten minutes to learn what the plan built, why it's shaped that way, and how the agents got there. Change nothing else.

**Who runs it.** Asked directly → you. At plan complete, the orchestrator hands it to a background agent with this file's path, the plan slug, the parent-repo path, the merge-target, and the final PR's URL and review verdict; when done, return to the orchestrator — it commits the report. No plan slug → the newest plan in `docs/plans/`; several equally likely → ask.

## Sources — files and GitHub, not memory

Build it from the paper trail: the plan, its sprint docs (live and archived, with each **Sprint summary** and its slice log), this plan's entries in `docs/decisions.md` and `docs/handoff-queue.md` (attribute each by its `from → to` header), the wave, `Review fixes`, and final PRs with the reviewer's comments, the plan branch's history, and the code itself for data structures. Where memory and files disagree, the files win.

## The page

One HTML file, self-contained and offline: inline CSS and SVG, no scripts, fonts, or requests from elsewhere. Readable first — body text ≥ 16 px, good contrast in light and dark, a table of contents, tables that scroll sideways on a phone. With a Look, borrow its palette and display font for headings. Use the `frontend-design` skill if you have it.

About 2,000 words; tables and short lines over paragraphs. Sections, in order:

1. **At a glance** — the goal, what shipped, and the numbers: sprints, waves, slices, PRs, wall time, agent tokens as the Sprint summaries report them (saying what they measure), and the review verdict and rounds. It's written before the final merge: name the final PR by number and verdict, never as `open` or `merged`.
2. **Key features** — what a user can do now, each tied to the plan's Verification criteria (met / not met / not checked). With a UI, one or two screenshots at desktop and 375 px, embedded as JPEG `data:` URIs no wider than 1200 px. To take them, install dependencies in the parent repo first, run the app per the smoke recipe on `3000`/`3001`, then stop your servers and close your browser session.
3. **Key decisions** — one short card each: the decision, why, the alternatives, the consequence; who made it (human or agent); links to its `decisions.md` entry and any design draft.
4. **Data structures** — each table, model, or type that matters (fields, where it lives, who uses it), the API as a table, and a small SVG diagram when there are more than three.
5. **How the agents worked together** — one timeline row per wave: slices, what the engineers reported, what the orchestrator did, the PR. A short paragraph only where something happened (a wave fix, a stall, a halt, a human answer); then the review and fix pass. Mark every point the human stepped in.
6. **What's left** — open queue entries as **Fix next / Before hosting / Someday**, one line each.
7. **Sources** — the files, PRs, and commits used.

Be accurate: quote agents only exactly, say plainly what you couldn't find, and label every estimate.

Before replying, make sure the file opens, every section is there, and it loads nothing from outside (links in **Sources** are fine). Reply with its path and how to open it.
