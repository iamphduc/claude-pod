import { useEffect, useState } from "react";
import {
  Bell,
  Download,
  Eye,
  FastForward,
  Monitor,
  Moon,
  MousePointerClick,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/tool-ui/code-block";
import { RunDemo } from "./demo/RunDemo";
import { demo, features, footer, hero, install, privacy, REPO_URL } from "../../../shared/content";

type ThemeChoice = "system" | "light" | "dark";
const THEME_KEY = "oaf-theme";

function useTheme() {
  const [theme, setTheme] = useState<ThemeChoice>(() => {
    const v = document.documentElement.getAttribute("data-theme");
    return v === "dark" || v === "light" ? v : "system";
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.removeAttribute("data-theme");
      localStorage.removeItem(THEME_KEY);
    } else {
      root.setAttribute("data-theme", theme);
      localStorage.setItem(THEME_KEY, theme);
    }
  }, [theme]);
  return [theme, setTheme] as const;
}

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const THEME_LABEL: Record<ThemeChoice, string> = {
  system: "Theme: system",
  light: "Theme: light",
  dark: "Theme: dark",
};

function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`${THEME_LABEL[theme]}. Switch to ${NEXT[theme]}.`}
      title={THEME_LABEL[theme]}
      className="inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--fg)] hover:bg-[var(--hover)]"
    >
      <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

/** lucide-react 1.x dropped brand icons, so the GitHub mark is inline SVG. */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

const featureIcons = [Eye, Bell, MousePointerClick, FastForward];

const sectionTitle = "text-[length:var(--size-h2)]";
const shell = "mx-auto w-full max-w-[1120px] px-4 sm:px-6";

export function App() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-[var(--bg)] focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur">
        <div className={`${shell} flex h-14 items-center gap-3`}>
          <a href="#top" className="flex items-center gap-2 font-semibold no-underline">
            <img src="/icon-192.png" alt="" width={24} height={24} className="size-6 rounded-[var(--radius-sm)]" />
            {hero.name}
          </a>
          <nav aria-label="Sections" className="ml-auto hidden items-center gap-4 text-[length:var(--size-dense)] sm:flex">
            <a href="#demo" className="no-underline">Demo</a>
            <a href="#features" className="no-underline">Features</a>
            <a href="#get-started" className="no-underline">Get started</a>
          </nav>
          <a
            href={REPO_URL}
            aria-label="Open AFlow on GitHub"
            className="ml-auto inline-flex size-9 items-center justify-center rounded-[var(--radius-sm)] hover:bg-[var(--hover)] sm:ml-0"
          >
            <GitHubIcon className="size-4" />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main id="main">
        {/* Hero */}
        <section id="top" className={`${shell} flex flex-col items-start gap-6 pt-16 pb-12 sm:pt-24`}>
          <img src="/icon-192.png" alt="" width={64} height={64} className="size-16 rounded-[var(--radius-lg)]" />
          <div className="flex flex-col gap-4">
            <h1 className="text-[length:var(--size-h1)]">
              {hero.name}
              <span className="block text-[var(--muted)]">{hero.tagline}</span>
            </h1>
            <p className="max-w-[60ch] text-[1.125rem] text-[var(--muted)]">{hero.lead}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="no-underline hover:text-[var(--primary-fg)]">
              <a href={hero.primaryCta.href}>
                <Download className="size-4" strokeWidth={1.75} aria-hidden="true" />
                {hero.primaryCta.label}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="no-underline">
              <a href={hero.secondaryCta.href}>
                <GitHubIcon className="size-4" />
                {hero.secondaryCta.label}
              </a>
            </Button>
          </div>
          <p className="text-[length:var(--size-dense)] text-[var(--muted)]">{hero.note}</p>
        </section>

        {/* Live demo (tool-ui) */}
        <section id="demo" aria-labelledby="demo-title" className={`${shell} flex flex-col gap-6 py-12`}>
          <div className="flex max-w-[72ch] flex-col gap-2">
            <h2 id="demo-title" className={sectionTitle}>{demo.title}</h2>
            <p className="text-[var(--muted)]">{demo.lead}</p>
          </div>
          <RunDemo />
        </section>

        {/* Features */}
        <section id="features" aria-label="Features" className={`${shell} py-12`}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => {
              const Icon = featureIcons[i];
              return (
                <li key={f.title} className="flex flex-col gap-2 rounded-[var(--radius-lg)] border bg-[var(--surface)] px-6 py-5">
                  <Icon className="size-5 text-[var(--fg)]" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="text-[length:var(--size-title)]">{f.title}</h3>
                  <p className="text-[var(--muted)]">{f.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Privacy */}
        <section aria-labelledby="privacy-title" className={`${shell} py-12`}>
          <div className="flex items-start gap-4 rounded-[var(--radius-lg)] border px-6 py-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h2 id="privacy-title" className="text-[length:var(--size-title)]">{privacy.title}</h2>
              <p className="text-[var(--muted)]">{privacy.body}</p>
            </div>
          </div>
        </section>

        {/* Get started */}
        <section id="get-started" aria-labelledby="install-title" className={`${shell} flex flex-col gap-6 py-12`}>
          <h2 id="install-title" className={sectionTitle}>{install.title}</h2>
          <ol className="flex flex-col gap-6">
            {install.steps.map((s, i) => (
              <li key={s.title} className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-4 gap-y-2">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full border font-mono text-[length:var(--size-small)] text-[var(--muted)]"
                >
                  {i + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-2 pt-1">
                  <h3 className="text-[length:var(--size-title)]">{s.title}</h3>
                  <p className="max-w-[72ch] text-[var(--muted)]">{s.body}</p>
                  {s.code && (
                    <CodeBlock
                      id={`code-block-install-${i + 1}`}
                      code={s.code}
                      language="text"
                      lineNumbers="hidden"
                      filename="Claude Code"
                      className="mt-2 max-w-[72ch] min-w-0"
                    />
                  )}
                  {i === install.steps.length - 1 && (
                    <div className="mt-2">
                      <Button asChild size="lg" className="no-underline hover:text-[var(--primary-fg)]">
                        <a href={hero.primaryCta.href}>
                          <Download className="size-4" strokeWidth={1.75} aria-hidden="true" />
                          {hero.primaryCta.label}
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="mt-12 border-t">
        <div className={`${shell} flex flex-col gap-4 py-8 text-[length:var(--size-dense)] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between`}>
          <p>{footer.text}</p>
          <ul className="flex gap-4">
            {footer.links.map((l) => (
              <li key={l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
