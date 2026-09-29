# Handoff Queue

**The human is the ultimate arbiter** — `BLOCKED` entries halt the orchestrator until acknowledged. **One line per entry.**

Format: `` - `[YYYY-MM-DD · TYPE · from → to · sprint: <slug> · slice: <code>]` <body> **Resolution:** pending `` (or `**Resolution:** <YYYY-MM-DD> — <what changed> [optional link to docs/decisions.md#anchor]`).

Entries are **date-keyed and append-only** (newest at the tail) — reference one by its `[date · from → to]` header plus a few words of its body, never by position (a same-day header can repeat; the body disambiguates). `from`/`to` is a **role**, not an agent name — `engineer` / `reviewer` / `orchestrator` / `sprint-planner` / `planner` / `human` — so it stays stable when an agent is renamed. Omit `slice:` for sprint-wide entries, `sprint:` for project-wide ones.

Types: `BLOCKED` halts · `PENDING` defers — someone has to act on it later · `SOLVED` informational, only emitted alongside a `BLOCKED` or `PENDING` to mark a related thing resolved inline. Pure FYI (`NOTE`) never lands here — it goes in the wave PR body. Reviewer entries start with when they matter: `now`, `before hosting`, or `someday`.

Resolve inline (do not delete prematurely); if decision-worthy, write a one-liner to `docs/decisions.md` and link from the Resolution line. At plan end the orchestrator resolves entries that are obsolete (`**Resolution:** <date> — obsolete: <why>`), records a default in `docs/decisions.md` for each choice the human never answered (`**Resolution:** <date> — default recorded: …; override anytime`), and sorts the rest for the human. At sprint end the orchestrator drops the oldest **resolved** entries beyond 100 (by date) — no renumbering; unresolved entries (`Resolution: pending`) are never pruned.

---
