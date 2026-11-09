# tool-ui variant: notes

## Summary

- The live demo uses tool-ui's ProgressTracker (agents, tool calls), Terminal (the two Bash calls) and ApprovalCard (the three decisions). The install step uses CodeBlock. Only the run header row and the page shell are hand-rolled.
- I used the components standalone, without the assistant-ui runtime. None of the copied files import `@assistant-ui/*`, and the runtime needs a chat model and backend, which this page doesn't have.
- 12.2 min wall clock in `timing.tsv`. `tsc` and the build pass, with no console errors. The main JS chunk is 691 kB min / 207 kB gzip (shiki), plus 340 lazy shiki language chunks.

## What the library covered

| Demo part | Component | How |
|---|---|---|
| Orchestrator, sprint planner, 3 engineers with status | `ProgressTracker` (live view) | Each agent is a step. done → `completed`, running → `in-progress`, blocked → `failed`, not started yet in the replay → `pending`. `elapsedTime` is the run clock. The blocked reason and the current tool show in the step `description`, which the component only shows for in-progress and failed steps. |
| Time, tokens, cost per agent | `ProgressTracker` + **local edit** | Steps only have `label` and `description` (strings). I added an optional `meta` field to the step schema and render it in muted mono after the label (+8 lines). Without that edit, the figures could only go into the label string or the description, which hides on completed steps. |
| Tool calls (1 failed, 1 running) | `ProgressTracker` | One step per tool call: success → completed, error → failed with the error as the description, running → in-progress. tool-ui has **no generic tool-call card** (name + args + result). That is assistant-ui's `ToolFallback`, which lives in the runtime package. |
| Bash output | `Terminal` | The two finished Bash calls: command, stdout / stderr, duration, exit code. run.ts has no exit code and Terminal requires one, so error maps to 1 and success to 0. |
| 3 decisions with 2 quick answers | `ApprovalCard` | `options[0]` → `confirmLabel` (primary), `options[1]` → `cancelLabel`. Clicking either sets `choice`, and the card folds into the library's one-line receipt. |
| Install code, copyable | `CodeBlock` | The copy button works. With `language="text"` the header reads "Plain Text". |
| Run header (repo, plan, stage tag, totals, Replay) | hand-rolled | tool-ui has no run or session summary surface. |
| Status dot | hand-rolled (header only) | tool-ui has no dot. Its step indicators are 24 px icon circles. |

Mapping lives in `src/demo/map.ts`. Every payload goes through the component's own Zod `parseSerializableX` contract.

## Pros

- **No runtime required.** The components are plain React with props, plus a Zod schema per component. They ran standalone with zero assistant-ui code. `shared/toolkit.tsx` is only types and a helper.
- **The status vocabulary fits a pod run.** ProgressTracker has pending, in-progress, completed and failed, with a timer badge and `aria-live="polite"`/`aria-busy`. That is enough for both agents and tool calls, and replaying the run only means changing props.
- **The receipt pattern is a good fit for "click to confirm and fold away".** ApprovalCard swaps to a compact receipt when `choice` is set. No extra code was needed for the fold.
- **Each folder has an `_adapter.tsx`** that names its exact shadcn and `cn` imports, so copying by hand was mechanical.
- **The Zod contracts caught a real bug in my replay.** A negative `elapsedTime` from a rAF timestamp came out as a clear message: `Invalid ProgressTracker payload: elapsedTime: Too small`.
- Terminal and CodeBlock come with copy buttons, collapse and dark/light shiki themes. CodeBlock follows `data-theme` on `<html>` by itself.

## Cons

- **ApprovalCard is built for approve/deny, not for two equal answers:**
  - The receipt always said "Approved" or "Denied". `ApprovalCard` never passes `actionLabel` to `ApprovalCardReceipt`, so clicking "Mock the API" showed "Approved". **Local fix:** pass `confirmLabel` or `cancelLabel` through (1 line).
  - **Escape calls `onCancel`.** For "Open on GitHub" or "Skip the check", Escape would pick that answer. I swallow Escape in a capturing wrapper (`onKeyDownCapture`).
  - The card is `role="dialog"`, which is odd for an inline card, and its title is a hardcoded `<h2>`, which breaks the page outline. **Local edit:** changed it to `<h4>`.
  - Focus drops to `<body>` when the card turns into its receipt. Hand-fixed by moving focus to the "Needs you" heading.
  - The actions stack full-width under a 24 rem container query (`@sm/actions`). In a 22 rem side column, all buttons stacked, so I widened the column to 25 rem.
- **The icon lookup cost 174 kB gzip.** ApprovalCard does `import { icons } from "lucide-react"` to resolve an icon by name, which pulls in all of lucide (main chunk 1,361 kB → 691 kB min, 381 → 207 kB gzip once fixed). **Local edit:** a 3-icon map. Names also changed in lucide 1.x: `message-circle-question` silently returns no icon, and `message-circle-question-mark` works.
- **CodeBlock pulls in all of shiki.** That means 340 language chunks (12 MB `dist`) and a 690 kB main chunk, just to show two lines of plain text.
- **No figures slot anywhere.** Labels are strings, so Open AFlow's "figures as tags after the title" needs a schema edit.
- **Its status looks clash with Open AFlow.** It uses filled black check circles, a spinner and a red X, where Open AFlow uses small dots in a fixed column. Blocked can only show as "failed". There is no needs-you (amber) or idle state.
- **The upstream code doesn't run under Vite 8 / Rolldown.** `ansi-to-react` is CJS, its default import arrives as the module object, and Terminal crashed with React error #130. **Local fix:** unwrap `.default`.
- The in-progress glow uses `hsl(var(--primary)/0.1)`, which does nothing with hex or oklch tokens. That leftover from shadcn v3 is harmless but dead.

## Friction log

| Problem | Fix | Cost |
|---|---|---|
| The registry is blocked. I had to find which shadcn `ui/*` files each component needs. | Read each `_adapter.tsx`. I copied button, collapsible and separator, plus `lib/utils.ts`. | ~2 min |
| I forgot `src/lib/utils.ts`, so tsc failed with 8 "cannot find @/lib/utils" errors. | Copied it. | <1 min |
| Name clash: Open AFlow's `--muted` is a text colour, shadcn's `--muted` is a background. | Mapped `--color-*` straight to Open AFlow vars in `@theme inline`, with no shadcn intermediate vars. | ~2 min |
| Tailwind `dark:` classes in tool-ui need a variant that matches both `data-theme` and the OS. | `@custom-variant dark` block, with a media query plus `:root:not([data-theme=light])`. | ~1 min |
| Terminal crashed with React #130 (ansi-to-react CJS default import under Rolldown). | Unwrapped `.default` in `terminal.tsx`. | ~2 min |
| ProgressTracker schema failed on a negative `elapsedTime` (rAF time before `performance.now()`). | Clamped the replay fraction. Switched `safeParse` → `parse` to see the Zod message. | ~2 min |
| The ApprovalCard receipt showed "Approved" instead of the chosen label. | 1-line edit in the copied source. | ~1 min |
| ApprovalCard actions stacked full-width in the 22 rem column. | Column set to 25 rem (container query `@sm` = 24 rem). | ~1 min |
| The main bundle was 1.36 MB because of the lucide `icons` record. | Measured with and without, then replaced it with a 3-icon map. | ~2 min |
| Focus was lost after answering a decision. | Focus the "Needs you" heading (`tabIndex=-1`). | ~1 min |
| Stderr in Terminal is `whitespace-pre` and ran off the card at 390 px. | CSS override to `pre-wrap`. | <1 min |

## Theming

Moderate, about 6 minutes. The colour mapping was easy because tool-ui only uses shadcn semantic colours (`bg-card`, `text-muted-foreground`, `bg-primary`, `border`). Pointing those at Open AFlow tokens in `@theme inline` got 90% of the way. These things needed CSS overrides (in `src/index.css`, sources untouched):

- Pill buttons: `rounded-full` is hardcoded. I overrode `[data-slot=button]` to 6 px corners with a 2 px focus outline.
- `rounded-2xl` cards: capped `--radius-2xl` at 12 px.
- `shadow-xs` on every card: zeroed, because Open AFlow allows only the menu shadow.
- The shiki `pre` background.

`tokens.css` also defines `--radius-sm/md/lg`, which silently overrides Tailwind's radius scale because it is unlayered. That happened to suit this page. Not fixable by tokens alone: the status indicators (filled black check, spinner, red X), the hardcoded `text-emerald-*`, `text-red-*` and `dark:bg-red-600` classes, and the "Plain Text" label. Both light and dark work, and so do the OS default and the `data-theme` override.

## Dependencies added

- Runtime: `react`/`react-dom` 19.3, `lucide-react` 1.70 (tool-ui pins 0.563; 1.x renamed icons and dropped brand icons, so the GitHub mark is inline SVG), `zod` 4.6, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-collapsible`, `@radix-ui/react-separator`, `ansi-to-react` (Terminal), `shiki` 4.6 (CodeBlock; tool-ui pins 3.x, and it worked unchanged), `@fontsource/geist` and `@fontsource/geist-mono` (Open AFlow's font, not a library need).
- Dev: `vite` 8, `@vitejs/plugin-react`, `typescript` 7 (tsc passes on the copied code), `tailwindcss` 4 + `@tailwindcss/vite`, `tw-animate-css` (for the `animate-in`/`fade-in` classes), `tw-shimmer` (for the `shimmer` class on in-progress labels).
- Peer requirements: React 19 (it uses `use()`), Tailwind v4 (container queries, `@custom-variant`), shadcn base pieces, and Radix.
- Not added: `@assistant-ui/react` or any AI SDK.
- Copied code: 5 tool-ui folders (shared, approval-card, progress-tracker, terminal, code-block), about 3,900 lines including 2,750 lines of shiki theme JSON. 4 small local edits are marked with comments.

## Fit for Open AFlow

**3 / 5.**

- **Homepage: yes, with the edits above.** ProgressTracker and ApprovalCard read well and the replay was cheap. CodeBlock is too heavy for a landing page, though; a plain `<pre>` with a copy button would ship about 690 kB less.
- **The app itself: I'd borrow pieces, not adopt the library.**
  - tool-ui is about rendering one tool's result inside a chat message. Open AFlow is a dashboard of runs, waves and agents.
  - It has no tree or trace view, no generic tool-call card, no status dot, no figures slot, and no needs-you or idle state.
  - ApprovalCard's approve/deny semantics (Escape = cancel, receipt wording) fight Open AFlow's two-equal-answers decisions.
  - What I'd keep: the copy-the-source model, the Zod contracts, and the receipt pattern for answered decisions.
