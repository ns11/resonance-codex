// Evidence screenshots for the findings of PROBA run 1 (30 Oct 2026, on Version 12). Change the targets for the next run.
// Usage: node checks/proba/extra_shots.js [port] [out folder]   (default port 8765; restored after PROBA run 1)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, '..', 'mock_claude.js'), 'utf8');
const PORT = process.argv[2] || '8765';
const OUT = process.argv[3] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:' + PORT + '/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 700); };
  const shot = async (name, sel) => { if (sel) { const el = await page.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(200); await el.screenshot({ path: path.join(OUT, 'x-' + name + '.png') }); return; } } await page.screenshot({ path: path.join(OUT, 'x-' + name + '.png') }); };
  await go('#/e/secular-approximation'); await shot('secular', '#s-research');
  await go('#/e/antibunching'); await shot('antibunching', '#codex-main .head, #codex-main h1');
  await go('#/library/cipher-stacks'); await shot('cipher-stacks', '#codex-main');
  await go('#/figures'); await shot('figures-top');
  // scroll to Cohen-Tannoudji's and Tanaś's cards
  await page.evaluate(() => { const el = Array.from(document.querySelectorAll('#codex-main a, #codex-main .bc')).find((a) => /Cohen-Tannoudji/.test(a.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300); await shot('figures-cct');
  await page.evaluate(() => { const el = Array.from(document.querySelectorAll('#codex-main a, #codex-main .bc')).find((a) => /Tanaś/.test(a.textContent)); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300); await shot('figures-tanas');
  await go('#/e/scully'); await page.evaluate(() => { const el = Array.from(document.querySelectorAll('#codex-main *')).find((a) => /quantum theory of the laser/.test(a.textContent) && a.children.length === 0); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300); await shot('scully-works');
  await go('#/e/cudreasov'); await shot('cudreasov');
  await go('#/e/haroche'); await page.evaluate(() => { const el = Array.from(document.querySelectorAll('#codex-main *')).find((a) => /Strange superpositions/.test(a.textContent) && a.children.length === 0); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300); await shot('haroche-book');
  await go('#/e/ficek'); await page.evaluate(() => { const el = Array.from(document.querySelectorAll('#codex-main *')).find((a) => /Two-atom systems: the master equation/.test(a.textContent) && a.children.length === 0); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300); await shot('ficek-review');
  await go('#/e/koudinov'); await shot('koudinov');
  await go('#/e/kudryashov-na'); await shot('kudryashov-na');
  await go('#/craft'); await page.evaluate(() => { const el = Array.from(document.querySelectorAll('#codex-main *')).find((a) => /The Kudo Hall/.test(a.textContent) && a.children.length === 0); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300); await shot('craft-kudo-leak');
  await go('#/dossier'); await page.evaluate(() => { window.scrollTo(0, 1800); }); await page.waitForTimeout(300); await shot('dossier-chapters');
  await go('#/library/kudo-hall'); await page.evaluate(() => { window.scrollTo(0, 500); }); await page.waitForTimeout(300); await shot('kudo-hall-blurbs');
  await go('#/cyclopedia'); await shot('cyclopedia-counts');
  await go('#/literature'); await shot('literature-top');
  await go('#/craft/r/r-damped-rabi'); await shot('recipe-status');
  await go('#/lores'); await shot('lores-card', '#codex-main');
  // the lamp with an array answer
  await go('#/lamp/ficek'); await page.click('[data-lamp="light"]'); await page.waitForTimeout(300);
  await page.evaluate(async () => { const s = await window.claude.use('sample'); s.json = async () => [1, 2, 3]; });
  await page.fill('#pray-text', 'As Ficek: a prayer answered with an array.'); await page.click('form[data-lamp-form] button[type="submit"]'); await page.waitForTimeout(800);
  await shot('lamp-array', '.prayer');
  await ctx.close();
  // phone: quest checkboxes and small targets, light contrast on an entry
  const p = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: 'light' });
  await p.addInitScript(MOCK);
  const pg = await p.newPage();
  await pg.goto('http://127.0.0.1:' + PORT + '/#/tome/sz/6.3', { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { const el = document.querySelector('input[type=checkbox]'); if (el) el.scrollIntoView({ block: 'center' }); }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, 'x-phone-checkbox.png') });
  await pg.goto('http://127.0.0.1:' + PORT + '/#/e/decay-rate', { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { const el = document.querySelector('.lbl'); if (el) el.scrollIntoView({ block: 'center' }); }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, 'x-phone-labels.png') });
  await browser.close();
  console.log('done');
})();
