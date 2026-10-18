# Idea: notice when the brief has drifted from the code

Status: parked. Build it only when the trigger below shows up.

## The idea

The scout stamps `pod-docs/codebase-structure.md` with `Mapped at: <sha>`. On `/pod:init` (or at the start of `/pod:plan`), pod runs `git diff --name-status <sha>..HEAD` and offers to re-map only when the change is structural: a top-level folder added or removed, a package manifest changed, or CI config changed. Then the scout re-maps only the sections that change touched. A cheaper extra check: every path the brief names must still exist.

## Why it's on hold

- **A second `/pod:init` already skips the scout** when the brief is filled (`skills/init/SKILL.md`, **Map the project**), so "don't run it again" is covered.
- **Most drift comes from pod's own plans**, and the orchestrator now fixes the brief at plan end (`skills/code/SKILL.md`, **Plan complete** step 5).
- **A SHA tells you files changed, not that the brief is wrong.** No source gives a clear "drifted" line, so a check would raise false alarms.

## What would make it worth building

- A queue note or review finding shows an agent went wrong because the brief missed a change made outside pod.

## Sources

- [agentpatterns.ai — Stale AI configuration artifacts](https://agentpatterns.ai/patterns/anti-patterns/stale-ai-configuration-artifacts/)
- [GSD — Brownfield projects](https://mintlify.wiki/gsd-build/get-shit-done/guides/brownfield-projects)
