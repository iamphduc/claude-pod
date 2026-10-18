# Idea: replay real inputs, and check performance numbers

Status: parked. Build it only when the trigger below shows up.

## The idea

- **Real-input fixtures (golden files):** for parsers, importers, and report output, run the code on a scrubbed set of real inputs and compare the output with an approved copy.
- **Performance:** check timing only when a success criterion names a number.

## Why it's on hold

- Engineers already check through the surface a change lives on (the real command, a real request, or the page) and read saved data back after a reload (`agents/engineer.md`, **Ship**; `features.md` **Proof**).
- A criterion with a number already becomes a `[test]` criterion. Always-on timing checks are noisy on shared machines and erode trust in the checks.
- Golden files decay into "accept whatever the program printed last" without a real review of each change.

## What would make it worth building

- A run ships a parser or import bug that a fixture built from real data would have caught.
- A run ships a slowdown a user noticed, and no criterion named a number.

## Sources

- [qaskills — Approval testing and golden masters](https://qaskills.sh/blog/approval-testing-golden-master-guide)
- [Claude Code — Best practices](https://code.claude.com/docs/en/best-practices)
