// Clicks a decision, toggles the theme, runs the replay, checks keyboard and errors.
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const errs = []; p.on("console", m => { if (["error","warning"].includes(m.type())) errs.push(m.text()); }); p.on("pageerror", e => errs.push(e.message));
  await p.goto("http://localhost:5101/");
  await p.getByRole("button", { name: "Merge", exact: true }).click();
  console.log("confirm:", await p.locator(".decision-confirm").innerText());
  await p.waitForTimeout(1800);
  console.log("phases:", await p.locator(".decision").evaluateAll(l => l.map(e => e.dataset.phase)));
  console.log("count tag:", await p.locator(".decisions .panel-head .tag").innerText());
  await p.getByRole("button", { name: /Switch to dark/ }).click();
  console.log("theme:", await p.evaluate(() => document.documentElement.dataset.theme + " " + getComputedStyle(document.body).backgroundColor));
  await p.getByRole("button", { name: "Replay" }).click();
  await p.waitForTimeout(2000);
  console.log("mid replay rows:", await p.locator('[role="treeitem"]').count(), "decisions:", await p.locator(".decision").count());
  await p.screenshot({ path: "/home/user/claude-pod/experiments/openaflow-homepage/variants/agent-prism/scripts/.replay-mid.png" });
  await p.waitForTimeout(4800);
  console.log("end rows:", await p.locator('[role="treeitem"]').count(), "decisions:", await p.locator(".decision").count());
  await p.locator('[role="treeitem"]').nth(1).focus(); await p.keyboard.press("Enter");
  console.log("details title:", await p.locator(".ap-details span.tracking-wide").first().innerText());
  for (let i = 0; i < 4; i++) await p.keyboard.press("Tab");
  console.log("focused:", await p.evaluate(() => document.activeElement.outerHTML.slice(0, 90)));
  console.log(errs.length ? errs.join("\n") : "no console errors"); await b.close();
})();
