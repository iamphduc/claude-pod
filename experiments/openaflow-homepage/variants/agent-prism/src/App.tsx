import { Download, Github, HardDrive, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { features, footer, hero, install, privacy, REPO_URL } from "../../../shared/content";
import { CopyButton } from "./components/agent-prism/CopyButton";
import { Demo } from "./demo/Demo";

type Theme = "light" | "dark";

const osTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const set = document.documentElement.dataset.theme;
    return set === "dark" || set === "light" ? set : osTheme();
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (!document.documentElement.dataset.theme) setTheme(osTheme());
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("openaflow-theme", next);
    } catch {
      /* storage may be off */
    }
    setTheme(next);
  };

  return (
    <button className="btn ghost icon" type="button" onClick={toggle} aria-label={`Switch to ${next} theme`}>
      {theme === "dark" ? <Sun aria-hidden="true" size={16} strokeWidth={1.75} /> : <Moon aria-hidden="true" size={16} strokeWidth={1.75} />}
    </button>
  );
}

export function App() {
  const code = install.steps.find((s) => s.code)?.code ?? "";

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container header-row">
          <a className="brand" href="#top" aria-label={`${hero.name} home`}>
            <img src="/icon-192.png" alt="" width={24} height={24} />
            <span>{hero.name}</span>
          </a>
          <nav aria-label="Site">
            <a className="btn ghost sm" href={REPO_URL}>
              <Github aria-hidden="true" size={16} strokeWidth={1.75} />
              <span className="nav-label">GitHub</span>
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main id="main" className="container">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <img className="app-icon" src="/icon-192.png" alt="" width={64} height={64} />
          <h1 id="hero-title">{hero.name}</h1>
          <p className="tagline">{hero.tagline}</p>
          <p className="lead">{hero.lead}</p>
          <div className="cta">
            <a className="btn primary" href={hero.primaryCta.href}>
              <Download aria-hidden="true" size={16} strokeWidth={1.75} />
              {hero.primaryCta.label}
            </a>
            <a className="btn" href={hero.secondaryCta.href}>
              <Github aria-hidden="true" size={16} strokeWidth={1.75} />
              {hero.secondaryCta.label}
            </a>
          </div>
          <p className="note muted">{hero.note}</p>
        </section>

        <Demo />

        <section className="section" aria-labelledby="features-title">
          <h2 id="features-title" className="sr-only">
            Features
          </h2>
          <ul className="features">
            {features.map((f) => (
              <li key={f.title} className="card">
                <h3>{f.title}</h3>
                <p className="muted">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="section privacy card" aria-labelledby="privacy-title">
          <HardDrive aria-hidden="true" size={20} strokeWidth={1.75} className="privacy-icon" />
          <div>
            <h2 id="privacy-title">{privacy.title}</h2>
            <p className="muted">{privacy.body}</p>
          </div>
        </section>

        <section className="section" aria-labelledby="install-title">
          <h2 id="install-title">{install.title}</h2>
          <ol className="steps">
            {install.steps.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="step-body">
                  <h3>{s.title}</h3>
                  <p className="muted">{s.body}</p>
                  {s.code ? (
                    <div className="code">
                      <pre>
                        <code>{s.code}</code>
                      </pre>
                      <div className="code-copy">
                        <CopyButton content={code} label="install commands" />
                      </div>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-row">
          <p className="muted">{footer.text}</p>
          <ul>
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
