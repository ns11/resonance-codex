// v7 smoke: every route renders without errors; the index, the library tree and the figures are present.
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://127.0.0.1:8765/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const routes = ['#/', '#/cyclopedia', '#/figures', '#/lexicon', '#/tomes', '#/literature', '#/library', '#/library/canc-lineas-wing', '#/library/central-stacks', '#/library/chamber-a', '#/library/cell-keitel', '#/library/engwithan-wing', '#/library/chamber-of-gates',
    '#/library/araki-kudo-wing', '#/library/araki-hall', '#/library/chamber-coudreau', '#/library/kudo-hall', '#/library/chamber-kudritzki', '#/e/scully', '#/e/kudriasov', '#/e/qrate', '#/e/place-resonance-canc-lineas-wing', '#/e/decay-rate', '#/lamp/ficek', '#/lamp/dicke', '#/lamp/nobody', '#/lamp/ficek/no-such-prayer', '#/lores', '#/lore/new', '#/craft', '#/review', '#/quests', '#/dossier'];
  const out = {};
  for (const r of routes) {
    await page.evaluate((h) => { location.hash = h; }, r);
    await page.waitForTimeout(450);
    out[r] = await page.evaluate(() => ({ h1: (document.querySelector('#codex-main h1') || {}).textContent, len: document.getElementById('codex-main').innerText.length, hash: location.hash,
      idx: document.getElementById('codex-index').querySelectorAll('.ci-row').length, nav: Array.from(document.querySelectorAll('.nav a')).filter((a) => !a.hidden).map((a) => a.textContent.trim() + (a.classList.contains('on') ? '*' : '')).join(' '), title: document.title }));
  }
  out.menu = await page.evaluate(() => document.getElementById('lore-menu').innerText.replace(/\n/g, ' | '));
  out.places = await page.evaluate(() => Codex.places().length);
  out.figures = await page.evaluate(() => Codex.figures().length);
  out.kw = await page.evaluate(() => { location.hash = '#/e/decay-rate'; return null; });
  await page.waitForTimeout(400);
  out.kwlinks = await page.evaluate(() => Array.from(document.querySelectorAll('#codex-main a.kw')).slice(0, 40).map((a) => a.textContent + ':' + a.className.replace('kw ', '')).join(', '));
  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
