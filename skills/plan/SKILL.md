---
name: plan
description: Use when the user types /pod:plan or asks to create/update a strategic main plan under docs/plans/.
---

Turn the human's idea into a strategic plan at `docs/plans/<slug>.md` that the sprint-planner can split into sprints. Interview until you and the human agree on the path, pick the look with them, then write it. Don't implement, dispatch, or write sprint docs.

## Guardrails

- **Nothing is on disk until the plan is written**, and a human who walks away thinks planning is done. Never end a turn on a bare "Is this right?". Post the interview summary together with the look pick (*"Pick A, B, C or a mix — and correct anything in the summary above."*), and write the plan in the turn that answers it. No UI → write it right after the summary. Any turn that ends before the plan exists ends with `Plan not written yet — reply to continue.`
- **The human picks the look.** Never offer to pick for them; if they ask you to, pick and say which and why.
- **Never overwrite a plan.** `docs/plans/<slug>.md` exists → ask: update it (keep `_Generated:_`, add `_Updated:_`) or use a new slug.
- **Small: 2–4 sprints.** Code is reviewed once, at plan end, so a bigger goal becomes several plans in a row — say so in Scope.
- **Strategic, not tactical.** Sprints by goal and dependency; files and slices belong in sprint docs.

## Before the interview

Know what's already decided: `docs/codebase-structure.md`, `docs/decisions.md` (authoritative — a plan that contradicts it says so in Key decisions, with the reason), `docs/known-issues/`, other active plans (overlap), and `docs/handoff-queue.md` (bring open `PENDING`s into the interview; resolve a pending `BLOCKED` first).

**Research.** A report on this idea in `docs/research/` → read it whole, start the interview from its **Questions for the plan** (skip what's answered), and cite it in Key decisions. None → ask once, on the fast path too: *"Research this idea on the web first? It takes a few minutes."* Yes → run `${CLAUDE_PLUGIN_ROOT}/skills/research/SKILL.md` and wait for it.

**Empty repo** (no application code) → the first sprint starts with a bootstrap: the thinnest runnable skeleton, its test runner, and the smoke recipe. Ask whether it should add CI too — recommend it (a clean-machine run and a secret scan on every PR), but it's optional — and record the answer in Key decisions.

## Interview

Cover goal and success, scope in and out, stack and constraints, trade-offs, and risks. Don't ask what's already settled, and look facts up yourself instead of asking.

- **The `grilling` skill installed** → use it, in its own format. Not installed → interview with `AskUserQuestion`, one decision per question, your recommended option first; tell the human once that `npx skills add mattpocock/skills` (pick `grilling`) gives the fuller version. Never invoke `grill-me` — it's a human-only launcher. The human already ran `/grill-me` → ask only what it left open.
- **Fast path:** in the first round, offer to ask everything or only what has no safe default. On the fast path still ask whatever changes what gets built or how it looks, and list every default you took in Key decisions, marked `(default)`.

## Look

No UI → `## Look` is `none — no UI`. Otherwise agents left alone build the most generic interface they know, so fix the look now. Use the `frontend-design` skill if you have it.

Propose three clearly different directions, each with a one-line thesis, a 5–7 color palette, a display and body font pair (self-hostable, readable at 16 px), the main screen's layout, and one memorable detail. Show them in one self-contained draft, `docs/design-drafts/look-directions.html`, labelled A, B, C: for each, a full component sheet — palette, type scale, every control in every state (hover and pressed as static copies), the app's own components in their states, and one small screen at desktop and at 375 px. The human judges from a picture, never from text. Open the draft for them and give its path.

Record their choice in `## Look`, in their words plus the exact tokens, linked to the draft.

## Write the plan

Use `${CLAUDE_PLUGIN_ROOT}/skills/plan/template.md`; `<slug>` is short kebab-case. Header `Grilled-with:` is `grilling` or `pod`, plus ` (fast)` on the fast path, or `grill-me + <either>`.

End with the slug and the next command: `/pod:init` first if pod isn't set up here yet (no `docs/codebase-structure.md`, no `origin`, or no first commit), else `/pod:sprint <slug>` (or `/pod:autopilot`).
