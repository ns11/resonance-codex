// Phone: open the index sheet, check it, close it with Escape and with a link.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, colorScheme: 'dark' });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://127.0.0.1:8765/#/e/mixing-angle', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1300);
  const out = {};
  out.btnVisible = await page.isVisible('[data-index-open]');
  await page.tap('[data-index-open]'); await page.waitForTimeout(300);
  out.open = await page.evaluate(() => ({ open: document.getElementById('codex-index').classList.contains('open'), rows: document.querySelectorAll('#codex-index .ci-row').length, onRow: (document.querySelector('#codex-index .ci-row.on') || {}).textContent, overflowLocked: document.documentElement.style.overflow }));
  await page.screenshot({ path: OUT + '/phone-index-open.png' });
  await page.tap('#codex-index a.ci-row[href="#/e/decay-rate"]'); await page.waitForTimeout(700);
  out.afterLink = await page.evaluate(() => ({ hash: location.hash, open: document.getElementById('codex-index').classList.contains('open'), overflow: document.documentElement.style.overflow }));
  await page.tap('[data-index-open]'); await page.waitForTimeout(200);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  out.afterEsc = await page.evaluate(() => document.getElementById('codex-index').classList.contains('open'));
  out.pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
