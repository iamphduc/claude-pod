// Screenshots of the preview server into ../../screenshots.
const { chromium } = require("playwright");
const path = require("node:path");
const out = path.resolve(__dirname, "../../../screenshots");
const url = process.env.URL || "http://localhost:5101/";
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const [name, w, h] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    for (const scheme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: scheme });
      const page = await ctx.newPage();
      page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${name}-${scheme} ${m.type()}: ${m.text()}`); });
      page.on("pageerror", (e) => errors.push(`${name}-${scheme} pageerror: ${e.message}`));
      await page.goto(url, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) errors.push(`${name}-${scheme} horizontal overflow: ${sw}px`);
      await page.screenshot({ path: `${out}/agent-prism-${name}-${scheme}.png`, fullPage: true });
      await ctx.close();
    }
  }
  await browser.close();
  console.log(errors.length ? errors.join("\n") : "no console errors");
})();
