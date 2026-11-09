import { useEffect, useState } from "react";
import { hero, features, privacy, install, footer, REPO_URL } from "../../../shared/content";
import { Button } from "./affectui/button-clean";
import { GridBackground } from "./affectui/grid-background";
import { TextReveal } from "./affectui/text-reveal";
import { Icon, type IconName } from "./icons";
import { Demo } from "./Demo";

type Mode = "system" | "light" | "dark";
const NEXT: Record<Mode, Mode> = { system: "light", light: "dark", dark: "system" };
const MODE_ICON: Record<Mode, IconName> = { system: "monitor", light: "sun", dark: "moon" };
const MODE_WORD: Record<Mode, string> = { system: "System", light: "Light", dark: "Dark" };

function readMode(): Mode {
  const v = document.documentElement.getAttribute("data-theme");
  return v === "light" || v === "dark" ? v : "system";
}

function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(readMode);
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    try {
      if (mode === "system") localStorage.removeItem("oaf-theme");
      else localStorage.setItem("oaf-theme", mode);
    } catch {
      /* storage off: the choice lasts for this visit */
    }
  }, [mode]);
  const label = `Theme: ${MODE_WORD[mode]}. Switch to ${MODE_WORD[NEXT[mode]]}`;
  return (
    <Button variant="ghost" size="sm" icon={<Icon name={MODE_ICON[mode]} />} aria-label={label} title={label} onClick={() => setMode(NEXT[mode])} />
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      /* clipboard blocked: the text stays selectable */
    }
  };
  return (
    <div className="code">
      <pre>
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        icon={<Icon name={copied ? "check" : "copy"} />}
        aria-label={copied ? "Copied" : "Copy commands"}
        title={copied ? "Copied" : "Copy commands"}
        onClick={copy}
      />
      <span className="sr-only" role="status">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}

const FEATURE_ICONS: IconName[] = ["board", "bell", "pointer", "forward"];

export function App() {
  return (
    <div className="oaf">
      <header className="site-head">
        <div className="wrap">
          <a className="brand" href="#top">
            <img src="/icon-192.png" alt="" width={24} height={24} />
            {hero.name}
          </a>
          <nav aria-label="Main">
            <a className="navlink hide-sm" href="#start">
              {install.title}
            </a>
            <a className="navlink" href={REPO_URL}>
              GitHub
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label={hero.name}>
          <GridBackground size={48} speed={6} color="var(--border)" fade={65}>
            <div className="wrap hero-inner">
              <img className="hero-icon" src="/icon-192.png" alt="" width={72} height={72} />
              <p className="hero-name">{hero.name}</p>
              <TextReveal as="h1" text={hero.tagline} stagger={60} />
              <p className="hero-lead">{hero.lead}</p>
              <div className="hero-ctas">
                <a className="lbtn lbtn--primary" href={hero.primaryCta.href}>
                  <Icon name="download" />
                  {hero.primaryCta.label}
                </a>
                <a className="lbtn" href={hero.secondaryCta.href}>
                  <Icon name="github" />
                  {hero.secondaryCta.label}
                </a>
              </div>
              <p className="hero-note">{hero.note}</p>
            </div>
          </GridBackground>
        </section>

        <Demo />

        <section className="section" aria-label="Features">
          <div className="wrap">
            <ul className="features" role="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {features.map((f, i) => (
                <li key={f.title} className="feature">
                  <span className="feature-icon">
                    <Icon name={FEATURE_ICONS[i]} size={20} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" aria-labelledby="privacy-title">
          <div className="wrap">
            <div className="privacy">
              <Icon name="lock" size={20} />
              <div>
                <h2 id="privacy-title">{privacy.title}</h2>
                <p>{privacy.body}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="start" aria-labelledby="start-title">
          <div className="wrap">
            <div className="section-head">
              <h2 id="start-title">{install.title}</h2>
            </div>
            <ol className="steps">
              {install.steps.map((s, i) => (
                <li key={s.title} className="step">
                  <span className="step-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                    {s.code && <CodeBlock code={s.code} />}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap">
          <p>
            <img src="/icon-192.png" alt="" width={20} height={20} />
            {footer.text}
          </p>
          <nav aria-label="Footer">
            <ul>
              {footer.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
