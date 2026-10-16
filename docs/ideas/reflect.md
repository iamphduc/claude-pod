# Idea: `/pod:reflect` to learn from past runs

Status: parked. Build it only when the trigger below shows up.

## The idea

After a run, a command reads its transcripts and proposes changes to pod's own rules, inspired by pstack's `/reflect` and `/automate-me` ([flaviocopes.com/pstack](https://flaviocopes.com/pstack)):

- Several reviewers read the transcript and each proposes rule changes.
- A final pass sorts the proposals into **accepted**, **rejected**, and **backlog**, with reasons.
- Nothing changes until the human approves. The approval step keeps one odd run from becoming a permanent rule.

## Why it's on hold

- **`docs/design.md` already sets the trigger:** "No coding-standards file or `/retro` yet … Revisit when one project runs several plans and the same review findings keep coming back." That hasn't happened yet.
- **The manual version works.** Each run so far was reviewed by reading its transcripts, and the fixes went into `docs/design.md` under "What the Nth run changed." This works well at the current pace of a few runs.
- **Rule files should stay short.** A tool that proposes rules after every run pushes toward more rules. The README's "Editing pod's rules" section asks for the opposite.

## What would make it worth building

- The same review finding shows up across several plans in one project.
- Reading transcripts by hand takes too long. For example, runs get longer, or several projects run pod at once.

## Sketch, if built

- `/pod:reflect [plan-slug]` reads the plan's paper trail (sprint summaries, the queue, review comments) first, and transcripts only where the paper trail points to a problem.
- Each proposal names the evidence (a file, a PR comment, or a transcript line) and the rule file it would change, worded as a guardrail, contract, or goal, per "Editing pod's rules."
- The output is a list for the human. Approved changes go through a normal PR.
