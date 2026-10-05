# Idea: read-only `/how` and `/why` questions

Status: parked. Build it only when the trigger below shows up.

## The idea

Two read-only commands, from pstack ([flaviocopes.com/pstack](https://flaviocopes.com/pstack)):

- **`/how <question>`** explains how the current code works: the concepts, the runtime flow, the files involved, and the sharp edges. For a large area, it splits the reading across two to four agents and merges what they find.
- **`/why <question>`** explains why the code has its shape, from evidence: git history and PRs first, then tickets, docs, and chat through MCP connectors. It keeps facts apart from guesses, and says so when a search comes back empty.

## Why it's on hold

- **Claude Code already answers "how" questions.** Asking in plain chat reads the code and explains it. A pod command would add little beyond that.
- **`/why` is only strong with outside sources.** pstack's value comes from searching tickets, team chat, and design docs. Most pod projects only have git history and PRs, which plain chat can already read.
- **pod's job is building.** The scout's brief and `docs/decisions.md` already cover the "understand before you change" step that pod's agents need.

## What would make it worth building

- Engineers or the sprint-planner keep getting an area wrong because they misread how it works or why it's built that way, and the brief doesn't help.
- Projects start connecting issue trackers or docs through MCP, so `/why` has real evidence to search.

## Sketch, if built

- One skill per command, each running a read-only agent (Read, Grep, Glob, and Bash for `git log` and `gh`). Neither one edits code.
- `/why` reports each claim with its source, and lists the sources it searched with no result.
- The sprint-planner could run `/how` on an unfamiliar area before it drafts a contract.
