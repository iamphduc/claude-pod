# Contributing to pod

How to change pod itself: what belongs in its rule files, how to check a change, and how a merge becomes a release. For using pod, see the [README](README.md).

## Editing the rules

The files in `agents/` and `skills/` are read by agents on every run, so each line costs tokens and takes the agent's attention. Only keep three kinds of lines:

- **Guardrails** that prevent real damage or keep you in control. For example: never touch `main`, never force-push, stay inside your own files, you decide what merges, tests come first, and keep secrets out.
- **Contracts**: the exact formats agents pass to each other (dispatch fields, hand-backs, queue entries, the status board, PR titles).
- **The goal and the reason** for each role, in a sentence or two.

Put each rule on the right side: a **skill** is a command you type, and an **agent** is a worker it sends out. See "Where rules live" in [`docs/design.md`](docs/design.md).

Leave out everything else: fixes for one project's bug, commands the model already knows, step-by-step procedures, stories from past runs, and rules repeated from another file. When a test run finds a problem, fix it with a general check, not a new bullet that names the bug.

Why:

- Anthropic, [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): assume Claude is already smart, and add only what it doesn't know.
- Anthropic, [Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices): newer models follow short instructions *with a reason* better than long lists of ALWAYS/NEVER rules.
- ETH Zurich, "Evaluating AGENTS.md" ([summary](https://developer.upsun.com/posts/ai/agents-md-less-is-more)): instruction files for coding agents gave little or negative gain while adding over 20% cost.


## Checking a change

Run these from the repo root before you open a PR. CI runs the first two on every PR.

```
claude plugin validate . && claude plugin validate ./pod-flow
cd pod-flow && claude plugin test .
```

Before a release, also run the eval cases in `evals/`. They run real Claude on small scratch repos (`/pod:init` on an empty and an old-layout repo, `/pod:idea` and its board, the research page, queue entries mid-plan and at plan end, the reviewer dispatch from `/pod:code` and `/pod:fix`, the `run app` reply to a hand-back, autopilot's `pod-staging` PR, new and reused, the overview `/pod:plan` shows before any code, and `/pod:teach` on a whole system and on one feature) and check the files it writes, the dispatch it sends, or its answer. A reviewer dispatch and Bash aren't allowed to run, so no reviewer or app starts: those cases check only the dispatch text or the start command in the answer. They use your Claude login, so they aren't in CI:

```
claude plugin eval . --scaffold --allow-tools Write Edit --ablation none --runs 1
```

The cases grant no shell, so they run on native Windows too. Longer flows (`/pod:ship`, `/pod:code`, autopilot) still need a manual run in a throwaway repo.

To typecheck pod-flow, load it in a session once so Claude Code writes its types (`claude --plugin-dir ./pod-flow`), then run `npx tsc --noEmit -p .` from `pod-flow/`.

The rule files in `agents/` and `skills/` have no tests. To try a rule change, run pod on a scratch repo with `claude --plugin-dir /path/to/claude-pod`.

## Releasing

Each merge to `main` that changes what a plugin ships is a release. pod ships `skills/`, `agents/`, and its `plugin.json`; pod-flow ships `pod-flow/hooks/` (not the tests), `pod-flow/types/`, and its `plugin.json`. In such a PR, bump that plugin's version in its `plugin.json` and add a section to `CHANGELOG.md` headed with each version it releases, such as `## pod 0.4.1 · pod-flow 0.2.1 — <date>`. CI fails the PR without them. The merge then creates the tag (`vX.Y.Z` for pod, `pod-flow-vX.Y.Z` for pod-flow) and the GitHub release, with that section as its notes. To check a branch before you push:

```
node .github/scripts/release.mjs check origin/main
```
