# Open AFlow homepage: one page, four agent UI libraries

We build the same homepage for [Open AFlow](https://github.com/alvionlabs/openaflow) four times.
Each build uses a different agent UI library for the live demo. Then we compare the time each one
took, what went wrong, and the result. The human judges the UI at the end.

| Variant | Library | Source (registries are blocked here, so copy from these) | Preview port |
|---|---|---|---|
| `variants/agent-prism` | AgentPrism (Evil Martians) | `/home/user/vendor/agent-prism` + npm `@evilmartians/agent-prism-*` | 5101 |
| `variants/tool-ui` | tool-ui (assistant-ui) | `/home/user/vendor/tool-ui/apps/www/components/tool-ui` | 5102 |
| `variants/ai-elements` | AI Elements (Vercel) | `/home/user/vendor/ai-elements/packages/elements` | 5103 |
| `variants/affectui` | affectUI (free items) | `/home/user/vendor/affectui` | 5104 |

## What the page must hold

Use the copy in `shared/content.ts` word for word, and the run in `shared/run.ts`. Don't invent other features.

1. **Hero:** name, tagline, lead, Download and GitHub buttons, note. The app icon is `shared/icon-192.png`.
2. **Live demo:** the library's part. Show the fake pod run so a visitor gets the product at a glance:
   - the run: the orchestrator, sprint planner and three engineers with status, time, tokens and cost
   - their tool calls (one failed, one still running)
   - the three decisions, each with its two quick answers (clicking one should confirm and fold it away, without any backend)
   Map `run.ts` into the library's own data shape. Use the library's components for as much of
   this as they cover. Hand-roll only what the library has no piece for, and write down what you hand-rolled.
   A light replay (statuses changing over a few seconds) is a plus, not required.
3. **Features:** the four features.
4. **Privacy:** the "runs on your computer only" note.
5. **Get started:** the three install steps, with the code block copyable.
6. **Footer.**

## Look

- Open AFlow's own tokens are in `shared/tokens.css` (Geist font, calm black and white, status colours used only for dots).
  The page should feel like part of Open AFlow, not like the library's default demo. Where the library has its own theme,
  map it onto these tokens as far as is reasonable, and note how hard that was.
- Light and dark both work. Follow the OS by default; a `data-theme="dark"` / `"light"` attribute on `<html>` overrides it.
  Add a small theme toggle in the header.
- Rules from Open AFlow's DESIGN.md: spacing in multiples of 4 px; SVG icons, never text glyphs like `+` or `↑` as icons;
  the status dot comes first in a fixed-width column; figures (tokens, minutes, cost) are inline text or tags after the title.
- Responsive down to 390 px wide. Keyboard reachable, visible focus, real buttons and links, respects `prefers-reduced-motion`.

## Stack

- Vite + React 19 + TypeScript, `npm` (not pnpm), in your own folder with its own `package.json`. Nothing shared between variants except `../../shared`.
- Import the shared files by relative path (`../../shared/content`). Set `server.fs.allow` in the Vite config so dev works.
- Add only what the library really needs (for example Tailwind v4 and shadcn base pieces if the library requires them). That cost is part of the test.
- npm works. The shadcn registries (`affectui.com`, `tool-ui.com`, `ai-sdk.dev`, `ui.shadcn.com`) and other web hosts are blocked by the network policy: copy the files from `/home/user/vendor/...` instead, as a user would with copy and paste. Don't try other hosts.

## Done means

- `npm run build` and `npx tsc --noEmit` pass.
- `npx vite preview --port <your port> --strictPort` serves it with no console errors.
- Screenshots with the pre-installed Playwright (`require('playwright')`, `chromium.launch()`, don't install it) into
  `../../screenshots/<variant>-{desktop,mobile}-{light,dark}.png`: desktop 1440×900, mobile 390×844, `fullPage: true`, `deviceScaleFactor: 2`.
  Look at them yourself and fix what looks broken before you stop.
- Don't commit, push, or touch other variants' folders.

## What to record (this matters as much as the page)

**`timing.tsv`** in your folder. Log each phase as you go with real clock times (`date -u +%FT%TZ`):

```
phase	start	end	note
research	...	...	reading the library's source and docs
setup	...	...	scaffold, deps, Tailwind/shadcn base, theming
demo	...	...	the live demo with the library
page	...	...	the other sections
verify	...	...	build, typecheck, screenshots, fixes
```

**`NOTES.md`** in your folder, with these headings:

- `## Summary`: three lines.
- `## What the library covered`: which parts of the demo used library components, and which you hand-rolled, and why.
- `## Pros`
- `## Cons`
- `## Friction log`: each problem you hit, what fixed it, and about how many minutes it cost.
- `## Theming`: how hard it was to make it look like Open AFlow.
- `## Dependencies added`: list them, and any peer requirements (React 19, Tailwind v4, Radix, etc.).
- `## Fit for Open AFlow`: score 1–5 and why. Would you pick it for the real product's homepage? For the app itself?

Be honest and specific. "Easy to use" is useless. "ApprovalCard has no way to show two custom labels, so I wrapped it" is useful.
