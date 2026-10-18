# Idea: Playwright CLI as a second browser

Status: parked. Build it only when the trigger below shows up.

## The idea

When `agent-browser` can't be installed, offer [Playwright CLI](https://github.com/microsoft/playwright-cli) as a third choice next to the Chrome DevTools MCP. It has named sessions (`-s=`) and runs headless, so each agent gets its own browser, the way `agent-browser` works. The MCP is one browser shared by the whole session.

## Why it's on hold

- `agent-browser` works, and pod already falls back to the DevTools MCP or `browser: none` (`skills/code/SKILL.md`, **Preflight**).
- Each browser type adds a branch to the engineer, reviewer, scout, `/pod:code`, and `/pod:fix` rules.
- Claude in Chrome and the desktop browser pane were ruled out: each is one shared browser signed in as you, which pod chose not to use (`docs/design.md`, **Browser checks**).

## What would make it worth building

- A user can't install `agent-browser`, or it breaks or stops being maintained.
