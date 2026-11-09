#!/usr/bin/env node
// Measures every variant the same way, so the numbers don't rely on the agents' own reports.
// Usage: node scripts/measure.mjs [variant ...]   (run from experiments/openaflow-homepage)
// Writes results/metrics.json and prints a markdown table.

import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PORTS = { "agent-prism": 5101, "tool-ui": 5102, "ai-elements": 5103, affectui: 5104 };
const variants = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PORTS);
const CHROME = "/opt/pw-browsers/chromium";

const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", maxBuffer: 1 << 28 });
const timed = (cmd, cwd) => {
  const t = performance.now();
  sh(cmd, cwd);
  return +((performance.now() - t) / 1000).toFixed(1);
};
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const kb = (n) => +(n / 1024).toFixed(1);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push({ p, size: s.size });
  }
  return out;
}

function dirSize(dir) {
  try {
    return +sh(`du -sk "${dir}"`).split("\t")[0] * 1024;
  } catch {
    return 0;
  }
}

function srcLines(dir) {
  const files = walk(dir).filter((f) => /\.(tsx?|css)$/.test(f.p));
  const lines = files.reduce((n, f) => n + readFileSync(f.p, "utf8").split("\n").length, 0);
  return { files: files.length, lines };
}

function timingLog(dir) {
  const f = join(dir, "timing.tsv");
  if (!existsSync(f)) return null;
  const phases = {};
  let first = Infinity;
  let last = 0;
  for (const line of readFileSync(f, "utf8").trim().split("\n").slice(1)) {
    const [phase, start, end] = line.split("\t");
    const s = Date.parse(start);
    const e = Date.parse(end);
    if (Number.isNaN(s) || Number.isNaN(e)) continue;
    phases[phase] = (phases[phase] ?? 0) + +((e - s) / 60000).toFixed(1);
    first = Math.min(first, s);
    last = Math.max(last, e);
  }
  return { phases, wallMinutes: +((last - first) / 60000).toFixed(1) };
}

async function lighthouse(port, name) {
  const preview = spawn("npx", ["vite", "preview", "--port", String(port), "--strictPort"], {
    cwd: join(ROOT, "variants", name),
    stdio: "ignore",
  });
  await new Promise((r) => setTimeout(r, 3000));
  const out = join(ROOT, "results", `lighthouse-${name}.json`);
  try {
    sh(
      `npx -y lighthouse@12 http://localhost:${port}/ --quiet --output=json --output-path="${out}" ` +
        `--only-categories=performance,accessibility,best-practices,seo --form-factor=desktop --screenEmulation.disabled ` +
        `--chrome-flags="--headless=new --no-sandbox"`,
      ROOT,
    );
    const r = JSON.parse(readFileSync(out, "utf8"));
    const score = (k) => Math.round(r.categories[k].score * 100);
    return {
      performance: score("performance"),
      accessibility: score("accessibility"),
      bestPractices: score("best-practices"),
      seo: score("seo"),
      lcpMs: Math.round(r.audits["largest-contentful-paint"].numericValue),
      tbtMs: Math.round(r.audits["total-blocking-time"].numericValue),
      cls: +r.audits["cumulative-layout-shift"].numericValue.toFixed(3),
      a11yFails: Object.values(r.audits)
        .filter((a) => a.score === 0 && r.categories.accessibility.auditRefs.some((x) => x.id === a.id))
        .map((a) => a.id),
    };
  } catch (e) {
    return { error: String(e.stderr || e.message).slice(0, 300) };
  } finally {
    preview.kill();
  }
}

process.env.CHROME_PATH = CHROME;
mkdirSync(join(ROOT, "results"), { recursive: true });
const results = {};

for (const name of variants) {
  const dir = join(ROOT, "variants", name);
  if (!existsSync(join(dir, "package.json"))) {
    console.error(`skip ${name}: no package.json`);
    continue;
  }
  console.error(`measuring ${name}...`);
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));

  sh("rm -rf node_modules dist", dir);
  const installSec = timed("npm ci --no-audit --no-fund --loglevel=error", dir);
  const builds = [0, 1, 2].map(() => timed("npm run build", dir));
  const typecheckOk = (() => {
    try {
      sh("npx tsc --noEmit -p .", dir);
      return true;
    } catch {
      return false;
    }
  })();

  const dist = walk(join(dir, "dist"));
  const pick = (re) => dist.filter((f) => re.test(f.p));
  const sum = (fs, gz) => fs.reduce((n, f) => n + (gz ? gzipSync(readFileSync(f.p)).length : f.size), 0);
  const js = pick(/\.js$/);
  const css = pick(/\.css$/);

  results[name] = {
    directDeps: Object.keys(pkg.dependencies ?? {}).length,
    directDevDeps: Object.keys(pkg.devDependencies ?? {}).length,
    installedPackages: +sh("npm ls --all --parseable 2>/dev/null | wc -l || true", dir).trim() - 1,
    nodeModulesMB: +(dirSize(join(dir, "node_modules")) / 1048576).toFixed(1),
    installSec,
    buildSecMedian: median(builds),
    typecheckOk,
    jsKB: kb(sum(js)),
    jsGzKB: kb(sum(js, true)),
    cssKB: kb(sum(css)),
    cssGzKB: kb(sum(css, true)),
    src: srcLines(join(dir, "src")),
    agentTiming: timingLog(dir),
    lighthouse: await lighthouse(PORTS[name], name),
  };
}

const prev = existsSync(join(ROOT, "results", "metrics.json"))
  ? JSON.parse(readFileSync(join(ROOT, "results", "metrics.json"), "utf8"))
  : {};
const all = { ...prev, ...results };
writeFileSync(join(ROOT, "results", "metrics.json"), JSON.stringify(all, null, 2) + "\n");

const rows = [
  ["Agent build time (min, from timing.tsv)", (m) => m.agentTiming?.wallMinutes ?? "–"],
  ["Clean install (s)", (m) => m.installSec],
  ["Build (s, median of 3)", (m) => m.buildSecMedian],
  ["Typecheck passes", (m) => (m.typecheckOk ? "yes" : "no")],
  ["Direct deps / dev deps", (m) => `${m.directDeps} / ${m.directDevDeps}`],
  ["Installed packages", (m) => m.installedPackages],
  ["node_modules (MB)", (m) => m.nodeModulesMB],
  ["JS gzip (KB)", (m) => m.jsGzKB],
  ["CSS gzip (KB)", (m) => m.cssGzKB],
  ["Source files / lines", (m) => `${m.src.files} / ${m.src.lines}`],
  ["Lighthouse perf / a11y / best / SEO", (m) => (m.lighthouse.error ? "error" : `${m.lighthouse.performance} / ${m.lighthouse.accessibility} / ${m.lighthouse.bestPractices} / ${m.lighthouse.seo}`)],
  ["LCP (ms) / TBT (ms) / CLS", (m) => (m.lighthouse.error ? "–" : `${m.lighthouse.lcpMs} / ${m.lighthouse.tbtMs} / ${m.lighthouse.cls}`)],
];
const names = Object.keys(all);
console.log(`| Metric | ${names.join(" | ")} |\n|---|${names.map(() => "---").join("|")}|`);
for (const [label, f] of rows) console.log(`| ${label} | ${names.map((n) => f(all[n])).join(" | ")} |`);
