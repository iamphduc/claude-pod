---
name: plan
description: Use when the user types /pod:plan or asks to create/update a strategic main plan under docs/plans/.
---

Turn the human's idea into a strategic plan at `docs/plans/<slug>.md` that the sprint-planner can split into sprints. Don't implement, dispatch, or write sprint docs.

## 1. Ground yourself

Read whichever exist: `docs/codebase-structure.md`, `docs/decisions.md` (authoritative — a plan that contradicts it says so in Key decisions, with the reason), `docs/known-issues/`, other plans (check for overlap; skip archived ones), and `docs/handoff-queue.md` (bring open `PENDING`s into the interview; a pending `BLOCKED` is resolved before drafting). No application code yet → the first sprint starts with a bootstrap: the thinnest runnable skeleton, its test runner, and the smoke recipe. Ask in the interview whether it should add CI too — recommend it (a clean-machine run and a secret scan on every PR), but it's optional — and record the answer in Key decisions.

## 2. Interview

Interview the human until you share the same path through the decisions: goal and success, scope in and out, stack and constraints, trade-offs, risks. Each answer decides the next question; don't ask what's already settled, and look up facts yourself instead of asking.

- **The `grilling` skill installed** → use it, in its own format. Not installed → run it yourself with `AskUserQuestion`: one decision per question, a recommended option first with a one-line reason, real alternatives. Tell the human once that `npx skills add mattpocock/skills` (pick `grilling`) gives the fuller version. Never invoke `grill-me` — it's a human-only launcher. The human already ran `/grill-me` → ask only what it left open.
- **Offer a fast path** in the first round: ask everything, or only what has no safe default. On the fast path still ask whatever changes what gets built or how it looks, and list every default you took in Key decisions, marked `(default)`.
- **No dead-end turns.** Nothing is on disk until the plan is written, and a human who walks away thinks planning is done. When the interview is finished, don't end the turn on a bare "Is this right?": post the summary and go straight to the look (step 3), asking *"Pick A, B, C or a mix — and correct anything in the summary above."* That reply confirms both; then write the plan in the same turn. No UI → write the plan right after the summary. Any turn that ends before the plan exists ends with `Plan not written yet — reply to continue.`

## 3. Pick the look — with the human, before anything is built

No user interface → `## Look` is `none — no UI`. Otherwise: left alone, agents build the most generic interface they know, and one choice made up front fixes that for every slice. Use the `frontend-design` skill if you have it.

Propose three clearly different directions, each with a one-line thesis, a 5–7 color palette, a display and body font pair (self-hostable, readable at 16 px), the main screen's layout, and one memorable detail. Show them in a self-contained design draft, `docs/design-drafts/look-directions.html`, labelled A, B, C: for each direction a full component sheet — palette swatches, type scale, every control in every state (hover and pressed shown as static copies), the app's own components in their states, and one small screen at desktop and at 375 px. The human judges the whole kit from a picture, never from text.

Open the draft for them yourself and give its path. They pick one or a mix. Never offer to pick for them; if they ask you to, pick and say which and why. Their choice, in their words plus the exact tokens, goes in `## Look`, linked to the draft.

## 4. Write the plan

Use `${CLAUDE_PLUGIN_ROOT}/skills/plan/template.md`. `<slug>` is short kebab-case. The file exists → ask: update it (keep `_Generated:_`, add `_Updated:_`) or pick a new slug — never overwrite. Header: `Grilled-with: grilling` or `pod`, plus ` (fast)` on the fast path, or `grill-me + <either>`.

- **Small: 2–4 sprints.** Code is reviewed once, at plan end, so a bug found then was built on for the whole plan. A bigger goal becomes several plans in a row; say so in Scope.
- **Strategic, not tactical.** Sprints by goal and dependency; files and slices belong in sprint docs.

End by giving the slug and saying `/pod:sprint <slug>` (or `/pod:autopilot`) is next.
