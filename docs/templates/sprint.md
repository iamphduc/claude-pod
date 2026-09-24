# Sprint: <name>

_From plan: docs/plans/<plan-slug>.md · Slug: <sprint-slug> · Status: <active | archived> · Generated: <YYYY-MM-DD>_

## Status board

| Wave | Slice | Title | Branch | PR | Status | Depends on |
|------|-------|-------|--------|----|--------|------------|
| 1 | <slice-code> | <one-line> | <branch-name> | — | pending | — |

Wave membership lives in the **Wave** column — **computed by the planner, not authored** (see Field semantics). Slices in a wave run in parallel and own disjoint files. Authored levels: **plan → sprint → slice**. Engineers push branches; the orchestrator integrates each wave into **one PR** on the plan branch (see **Branch naming**).

## Per-slice detail

### <slice-code>: <title>
- **Scope:** what to do; what NOT to do
- **Files owned:** explicit paths (disjoint within the same wave)
- **Success criteria:** concrete checks
- **Depends on:** <slice codes or —>

---

## Field semantics

- **Wave:** the leading column — a **computed** band, not an authored level: the parallel batch a slice runs in. Slices sharing a wave run concurrently and **must own disjoint file sets**. The planner derives waves to **maximize parallel width**: each slice goes in the *earliest* wave where (a) all its `Depends on` slices sit in strictly-earlier waves and (b) its `Files owned` are disjoint from every slice already in that wave. Open a new wave only when a dependency or file conflict forces it — never split independent, non-conflicting slices across waves. **Cap each wave at 5 slices** unless the human passed `--max-width=<N>` (a scheduler tuning knob, not a planning rule — every extra wave costs a serial integrate/verify/merge round); eligible overflow spills into the next wave (still respecting deps and disjoint files).
- **Slug:** matches the row in the main plan's Sprint sequence (`docs/plans/<plan-slug>.md`).
- **Sprint doc Status:** `active` while in `docs/sprints/`; flipped to `archived` immediately before `mv` to `docs/sprints/archive/`.
- **Slice Status transitions:** `pending` → `pushed` → `done` (`blocked` terminal); `done` when the wave's PR merges.
- **PR values (per wave):** `—` / the wave's PR URL (shared by its slices) / `blocked` / `skipped — verification failed` / `merged`.
- **Branch naming** (all flat kebab — **no `/`**, so none D/F-collide):
  - **Plan integration branch** `<plan-slug>` — cut off `main` once at plan start; all wave PRs target it; one final PR merges it to `main` at plan end.
  - **Slice branch** `<sprint-slug>-<slice-code>` — an engineer's branch, off `<plan-slug>`.
  - **Wave head** `<sprint-slug>-w<N>` — off `<plan-slug>`, in its own worktree; the orchestrator merges the wave's slice branches in (non-squash, for `git bisect`) and opens the wave's one PR to `<plan-slug>`.
- **Files owned:** explicit paths, verified to exist; cross-checked for disjointness within the wave.

## Sprint summary

Appended by the orchestrator after the last wave completes, immediately before archive.

- **Slices shipped:** <slice-code list> (each engineer browser-verified its own runtime per the pod engineer protocol)
- **Queue entries:** resolved <N>, deferred <M> — link the deferred ones inline
- **Approximate token cost:** <number or rough range>
