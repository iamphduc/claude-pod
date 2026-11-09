// Lists elements wider than a 390px viewport.
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto("http://localhost:5101/");
  const r = await p.evaluate(() => [...document.querySelectorAll("body *")].filter(e => e.getBoundingClientRect().right > 392).slice(0, 12).map(e => `${e.tagName}.${e.className.toString().slice(0,60)} r=${Math.round(e.getBoundingClientRect().right)}`));
  console.log(r.join("\n") || "none"); await b.close();
})();
