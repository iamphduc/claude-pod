# Plan: <plan name>

_Generated: <YYYY-MM-DD> · Status: <active | archived> · Grilled-with: <grilling | pod>[ (fast)]_

## Goal
<2–3 sentences: what we're accomplishing>

## Why
<motivation, success criteria for the whole plan, constraints>

## Scope
**In scope:**
- ...

**Out of scope:**
- ...

## Sprint sequence

| Sprint | Goal | Status | Depends on |
|--------|------|--------|------------|
| <slug> | <one-line> | planned | — |
| <slug> | <one-line> | planned | <previous slug> |

Status values: `planned` / `active` / `done`. The orchestrator only flips its row's Status — it does not rewrite Goal/Depends-on retroactively.

The `Depends on` column is the **only** cross-sprint dependency signal. Wave ordering and per-slice deps live inside the sprint doc and are opaque from here.

**Integration:** the orchestrator cuts one **plan integration branch** (named for this plan's slug) off `main`. All wave PRs land on it; one final PR merges it to `main` when the last sprint completes. The slug doubles as a branch name — keep it flat kebab-case.

## Look
<`none — no UI`, or the direction the human picked in the interview:>
- **Thesis:** <one sentence — mood, material, energy>
- **Palette:** <name → hex, 5–7 colors, which is background / text / accent>
- **Type:** <display font + body font, self-hosted; sizes: smallest text ≥ 16 px>
- **Layout:** <main screen's composition; how it stacks at phone width>
- **Signature detail:** <the one thing someone will remember>
- **Rules out:** <what this look is not — e.g. default browser controls, generic cards, purple gradients>
- **Draft:** `docs/design-drafts/look-directions.html` (direction <A/B/C> picked)

## Key decisions
- <decision and rationale; link to docs/decisions.md entry if one exists or should be created>

## Known risks
- <risk: mitigation>

## Open questions
- <unresolved after grilling; flag as risks for orchestrator>

## Verification
How we'll know the whole plan succeeded — top-level criteria only, not per-sprint. The end-of-plan reviewer checks each one against the final code, so make them checkable.
