# Handoff Queue

_Shared: agents leave notes here for you and for each other. You answer the ones addressed to `human`._

**The human is the ultimate arbiter** — `BLOCKED` entries halt the orchestrator until acknowledged. **One line per entry.**

Format: `` - `[YYYY-MM-DD · TYPE · from → to · plan: <slug> · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending `` (or `**Resolution:** <YYYY-MM-DD> — <what changed> [optional link to pod-docs/decisions.md#anchor]`).

Entries are **date-keyed and append-only** (newest at the tail) — reference one by its `[date · from → to]` header plus a few words of its body, never by position (a same-day header can repeat; the body disambiguates). `from`/`to` is a **role**, not an agent name — `engineer` / `reviewer` / `orchestrator` / `sprint-planner` / `human` — so it stays stable when an agent is renamed. Omit `slice:` for sprint-wide entries, `sprint:` too for plan-wide ones, and `plan:` too for project-wide ones.

Types: `BLOCKED` halts · `PENDING` defers — someone has to act on it later · `SOLVED` informational, only emitted alongside a `BLOCKED` or `PENDING` to mark a related thing resolved inline. Pure FYI (`NOTE`) never lands here — it goes in the wave PR body. Reviewer entries start with when they matter: `now`, `before hosting`, or `someday`.

Resolve inline; never delete a pending entry. Decision-worthy → a one-liner in `decisions.md`, linked from the Resolution, as `**Resolution:** <date> — default recorded: <value>; override anytime (<link>)`. At plan end, `/pod:code` resolves what's left; when the next plan starts, it moves each plan's resolved entries to that plan's `## Queue log`.

---
