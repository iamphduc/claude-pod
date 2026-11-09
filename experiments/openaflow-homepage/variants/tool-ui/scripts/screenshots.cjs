// node scripts/screenshots.cjs  (needs `npx vite preview --port 5102` running)
const { chromium } = require("playwright");
const path = require("path");
const OUT = path.resolve(__dirname, "../../../screenshots");
const URL = "http://localhost:5102/";
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    for (const scheme of ["light", "dark"]) {
      const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: scheme });
      const page = await ctx.newPage();
      page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`${name}-${scheme} ${m.type()}: ${m.text()}`); });
      page.on("pageerror", (e) => errors.push(`${name}-${scheme} pageerror: ${e.message}`));
      await page.goto(URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(10500); // let the replay finish
      if (process.env.ANSWER) {
        await page.getByRole("button", { name: "Mock the API" }).click();
        await page.waitForTimeout(600);
      }
      const file = path.join(OUT, `tool-ui-${name}-${scheme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
      await ctx.close();
    }
  }
  await browser.close();
  console.log(errors.length ? errors.join("\n") : "no console errors");
})();
