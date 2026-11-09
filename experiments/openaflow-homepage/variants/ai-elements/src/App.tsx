import {
  BellIcon,
  DownloadIcon,
  GithubIcon,
  LayersIcon,
  MonitorIcon,
  MoonIcon,
  PlayIcon,
  RepeatIcon,
  SunIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
  CodeBlockHeader,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { Button } from "@/components/ui/button";
import icon from "../../../shared/icon-192.png";
import {
  demo,
  features,
  footer,
  hero,
  install,
  privacy,
} from "../../../shared/content";
import { LiveDemo } from "./demo/LiveDemo";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => currentTheme());

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(currentTheme());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  return (
    <Button
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem("oaf-theme", next);
        } catch {
          /* storage may be off */
        }
        setTheme(next);
      }}
      size="icon"
      title={`Switch to ${next} theme`}
      variant="ghost"
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}

const FEATURE_ICONS = [LayersIcon, BellIcon, PlayIcon, RepeatIcon];

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto w-full max-w-[1120px] px-4 sm:px-8">{children}</div>
);

const h2 = "font-semibold text-[length:var(--size-h2)] tracking-tight";

export function App() {
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-10 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
        href="#main"
      >
        Skip to content
      </a>
      <header className="border-b">
        <Container>
          <div className="flex h-14 items-center justify-between gap-4">
            <a
              className="flex items-center gap-2 rounded-sm font-semibold no-underline"
              href="#top"
            >
              <img alt="" className="size-6 rounded-md" height={24} src={icon} width={24} />
              {hero.name}
            </a>
            <div className="flex items-center gap-1">
              <Button asChild size="icon" variant="ghost">
                <a aria-label="Open AFlow on GitHub" href={hero.secondaryCta.href}>
                  <GithubIcon />
                </a>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </Container>
      </header>

      <main id="main">
        <section className="pt-16 pb-12 sm:pt-24" id="top">
          <Container>
            <div className="max-w-[72ch]">
              <img
                alt=""
                className="mb-6 size-16 rounded-xl"
                height={64}
                src={icon}
                width={64}
              />
              <h1 className="font-semibold text-[length:var(--size-h1)] leading-tight tracking-tight">
                {hero.name}
              </h1>
              <p className="mt-2 font-medium text-[length:var(--size-title)]">
                {hero.tagline}
              </p>
              <p className="mt-4 text-muted-foreground">{hero.lead}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href={hero.primaryCta.href}>
                    <DownloadIcon />
                    {hero.primaryCta.label}
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={hero.secondaryCta.href}>
                    <GithubIcon />
                    {hero.secondaryCta.label}
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-muted-foreground text-sm">{hero.note}</p>
            </div>
          </Container>
        </section>

        <section aria-labelledby="demo-title" className="py-12">
          <Container>
            <div className="mb-8 max-w-[72ch]">
              <h2 className={h2} id="demo-title">
                {demo.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{demo.lead}</p>
            </div>
            <LiveDemo />
          </Container>
        </section>

        <section aria-label="Features" className="py-12">
          <Container>
            <ul className="grid gap-4 sm:grid-cols-2">
              {features.map((f, i) => {
                const Icon = FEATURE_ICONS[i];
                return (
                  <li className="rounded-xl border bg-surface px-6 py-5" key={f.title}>
                    <Icon aria-hidden="true" className="mb-3 size-5 text-muted-foreground" />
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="mt-1 text-muted-foreground text-sm">{f.body}</p>
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>

        <section aria-labelledby="privacy-title" className="py-12">
          <Container>
            <div className="flex gap-4 rounded-xl border px-6 py-5">
              <MonitorIcon aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
              <div>
                <h2 className="font-medium text-[length:var(--size-title)]" id="privacy-title">
                  {privacy.title}
                </h2>
                <p className="mt-1 text-muted-foreground">{privacy.body}</p>
              </div>
            </div>
          </Container>
        </section>

        <section aria-labelledby="install-title" className="py-12">
          <Container>
            <h2 className={h2} id="install-title">
              {install.title}
            </h2>
            <ol className="mt-8 grid max-w-[72ch] gap-8">
              {install.steps.map((s, i) => (
                <li className="grid grid-cols-[32px_minmax(0,1fr)] gap-x-4" key={s.title}>
                  <span
                    aria-hidden="true"
                    className="flex size-8 items-center justify-center rounded-full border font-mono text-sm"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 pt-1">
                    <h3 className="font-medium">{s.title}</h3>
                    <p className="mt-1 text-muted-foreground">{s.body}</p>
                    {s.code && (
                      <CodeBlock
                        className="mt-4 bg-surface [&_pre]:!bg-transparent [&_pre]:text-[length:var(--size-small)]"
                        code={s.code}
                        language="bash"
                      >
                        <CodeBlockHeader className="bg-transparent py-1 pr-1">
                          <CodeBlockTitle>
                            <CodeBlockFilename>Claude Code</CodeBlockFilename>
                          </CodeBlockTitle>
                          <CodeBlockActions className="m-0">
                            <CodeBlockCopyButton
                              aria-label="Copy commands"
                              className="size-8"
                              title="Copy commands"
                            />
                          </CodeBlockActions>
                        </CodeBlockHeader>
                      </CodeBlock>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      </main>

      <footer className="mt-12 border-t py-8">
        <Container>
          <div className="flex flex-col gap-4 text-muted-foreground text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>{footer.text}</p>
            <ul className="flex gap-4">
              {footer.links.map((l) => (
                <li key={l.label}>
                  <a className="rounded-sm underline-offset-4 hover:text-foreground hover:underline" href={l.href}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </footer>
    </>
  );
}
