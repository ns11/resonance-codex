const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
(async () => {
  const browser = await chromium.launch();
  const out = {};
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push('pageerror ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('dialog', (d) => { errs.push('dialog ' + d.message()); d.dismiss(); });
  await page.goto('http://127.0.0.1:8765/#/craft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  out.recipeCount = await page.locator('.cw-rec').count();
  out.lockedCount = await page.locator('.cw-rec.locked').count();
  out.title = await page.title();
  await page.screenshot({ path: OUT + '/craft-bench-empty.png' });
  // classic recipe
  await page.click('a.cw-rec[href="#/craft/r/r-damped-rabi"]'); await page.waitForTimeout(400);
  out.recipePanel = await page.evaluate(() => ({ name: document.querySelector('.cw-rname').textContent, req: document.querySelectorAll('.cw-req .tile').length, dropcap: document.querySelector('.dropcap').textContent, craftEnabled: !document.querySelector('[data-act="craft"]').disabled }));
  await page.screenshot({ path: OUT + '/craft-recipe.png' });
  await page.click('[data-act="craft"]'); await page.waitForTimeout(600);
  out.afterClassic = await page.evaluate(() => ({ hash: location.hash, banner: (document.querySelector('.crafted-banner') || {}).innerText, flag: JSON.stringify(Codex.Store.entry('recipe-r-damped-rabi')) }));
  // free crafting from an entry
  await page.evaluate(() => { location.hash = '#/craft/with/rabi-oscillation'; }); await page.waitForTimeout(500);
  out.shelf = await page.evaluate(() => ({ lit: Array.from(document.querySelectorAll('.cw-shelf .tile.lit')).map((t) => t.dataset.id), dim: document.querySelectorAll('.cw-shelf .tile.dim').length, inMix: Array.from(document.querySelectorAll('.cw-mix .tile.in')).map((t) => t.dataset.id) }));
  await page.click('.cw-shelf button.tile[data-id="decay-rate"]'); await page.waitForTimeout(300);
  out.match = await page.evaluate(() => (document.querySelector('.cw-match') || {}).textContent);
  await page.fill('#cw-extra', 'Floquet theory'); await page.click('[data-act="ask"]'); await page.waitForTimeout(900);
  out.extra = await page.evaluate(() => ({ extras: Array.from(document.querySelectorAll('.extra-tile')).map((t) => t.innerText.replace(/\n/g, ' ')), msg: document.querySelector('.cw-messages').innerText.slice(0, 220), stubBtn: !!document.querySelector('[data-act="stub"]') }));
  await page.click('[data-act="consult"]'); await page.waitForTimeout(300);
  out.busyShown = await page.evaluate(() => !!document.querySelector('.cw-busy'));
  await page.waitForTimeout(900);
  out.consult = await page.evaluate(() => ({ options: document.querySelectorAll('.cw-opt').length, craftDisabled: document.querySelector('[data-act="craft"]').disabled }));
  await page.screenshot({ path: OUT + '/craft-consult.png', fullPage: true });
  await page.check('#cw-opt-B'); await page.waitForTimeout(200);
  out.chosen = await page.evaluate(() => ({ craftDisabled: document.querySelector('[data-act="craft"]').disabled, on: document.querySelector('.cw-opt.on label').innerText }));
  await page.click('[data-act="craft"]'); await page.waitForTimeout(1300);
  out.crafted = await page.evaluate(() => ({ scrollY: window.scrollY, hash: location.hash, name: (document.querySelector('.entry-head h1') || {}).textContent, banner: (document.querySelector('.crafted-banner') || {}).innerText, xss: window.__xss || 0, escapedText: document.querySelector('.entry-main').innerText.includes('<script>'), unverified: document.querySelectorAll('.tag-unverified').length, badDoi: document.querySelectorAll('a[href*="not-a-doi"]').length, quiz: document.querySelectorAll('.quiz fieldset').length, stored: Array.from(window.__store.keys()), tiers: (window.__prompts || []).map((p) => p.tier) }));
  await page.screenshot({ path: OUT + '/craft-draft-page.png' });
  // forge
  await page.click('[data-forge]'); await page.waitForTimeout(400);
  out.forge = await page.evaluate(() => window.__sent || null);
  // the new dish in the recipe book and the lexicon
  await page.evaluate(() => { location.hash = '#/craft'; }); await page.waitForTimeout(400);
  out.yourDishes = await page.evaluate(() => Array.from(document.querySelectorAll('.cw-cat')[0].querySelectorAll('.cw-rec')).map((a) => a.innerText));
  await page.evaluate(() => { location.hash = '#/'; }); await page.waitForTimeout(300);
  out.dashboard = await page.evaluate(() => (document.querySelector('.craft-teaser') || {}).innerText);
  // hover card on a shelf tile
  await page.evaluate(() => { location.hash = '#/craft/with/mixing-angle'; }); await page.waitForTimeout(400);
  await page.hover('.cw-shelf button.tile[data-id="bloch-sphere"]'); await page.waitForTimeout(500);
  out.tileCard = await page.evaluate(() => (document.querySelector('.kw-tip .tip-name') || {}).textContent || null);
  out.errors = errs;
  await ctx.close();
  // phone, light, no claude runtime (live off)
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', hasTouch: true, isMobile: true });
  const p2 = await ctx2.newPage();
  const errs2 = []; p2.on('pageerror', (e) => errs2.push(e.message));
  await p2.goto('http://127.0.0.1:8765/#/craft/with/decay-rate', { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(600);
  out.phone = await p2.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, consultDisabled: document.querySelector('[data-act="consult"]').disabled, note: (document.querySelector('.cw-add .small') || {}).textContent }));
  await p2.screenshot({ path: OUT + '/craft-phone.png', fullPage: false });
  await p2.evaluate(() => { location.hash = '#/craft/r/r-dressed-axis'; }); await p2.waitForTimeout(400);
  await p2.screenshot({ path: OUT + '/craft-phone-recipe.png', fullPage: false });
  out.phoneErrors = errs2;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
