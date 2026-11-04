// Plates in the browser: they mount, redraw on input, show a crosshair tooltip, and fit desktop and phone.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2];
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
(async () => {
  const browser = await chromium.launch();
  const out = {};
  for (const [tag, vp, scheme] of [['desk', { width: 1440, height: 900 }, 'light'], ['desk', { width: 1440, height: 900 }, 'dark'], ['phone', { width: 390, height: 844 }, 'light']]) {
    const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme, deviceScaleFactor: tag === 'phone' ? 2 : 1 });
    await ctx.addInitScript(MOCK);
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    const res = {};
    for (const id of ['cr-damped-rabi', 'dressed-states', 'cr-dressed-axis', 'decay-rate']) {
      await page.goto('http://127.0.0.1:8765/#/e/' + id, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const info = await page.evaluate(() => Array.from(document.querySelectorAll('.plate-mount')).map((el) => ({ kind: el.dataset.plate, svgs: el.querySelectorAll('svg.pl-svg').length, paths: el.querySelectorAll('path.pl-line').length, read: el.querySelectorAll('.pl-read > div').length, w: el.getBoundingClientRect().width })));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const wide = await page.evaluate(() => Array.from(document.querySelectorAll('.plate-mount *')).filter((n) => n.getBoundingClientRect().right > document.documentElement.clientWidth + 1).slice(0, 3).map((n) => n.tagName + '.' + n.getAttribute('class')));
      res[id] = { info, overflow, wide };
      const first = page.locator('.plate-mount').first();
      await first.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await first.screenshot({ path: `${OUT}/plate-${tag}-${scheme}-${id}.png` });
    }
    // interaction on the damped Rabi plate: move Γ and read the steady state; hover the chart
    await page.goto('http://127.0.0.1:8765/#/e/cr-damped-rabi', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    const before = await page.evaluate(() => document.querySelector('.plate-mount[data-plate="rabi"] .pl-read').innerText);
    await page.evaluate(() => { const i = document.querySelector('.plate-mount[data-plate="rabi"] input[data-pl-k="G"]'); i.value = '12'; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.querySelector('.plate-mount[data-plate="rabi"] .pl-read').innerText);
    const fig = page.locator('.plate-mount[data-plate="rabi"] .pl-fig').first();
    await fig.scrollIntoViewIfNeeded();
    const box = await fig.boundingBox();
    if (tag === 'desk') { await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5); await page.waitForTimeout(200); }
    const tip = await page.evaluate(() => { const t = document.querySelector('.plate-mount[data-plate="rabi"] .pl-tip'); return t && !t.hidden ? t.innerText : null; });
    // magic angle preset on the dressed plate
    await page.goto('http://127.0.0.1:8765/#/e/mixing-angle', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.click('.plate-mount[data-plate="dressed"] [data-pl-preset="magic"]');
    await page.waitForTimeout(300);
    const magic = await page.evaluate(() => document.querySelector('.plate-mount[data-plate="dressed"] .pl-read').innerText);
    // Bloch: play, then check the time moved
    await page.goto('http://127.0.0.1:8765/#/e/cr-lindblad-atom', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const t = document.querySelector('[data-pl-t]'); t.value = '0'; t.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(150);
    await page.click('[data-pl-play]');
    await page.waitForTimeout(900);
    const blochT = await page.evaluate(() => document.querySelector('[data-pl-t]').value);
    out[tag + '-' + scheme] = { res, steadyBefore: before.split('\n').find((l) => /Steady/.test(l)) ? before.match(/Steady state P_e\s*([0-9.]+)/) : null, before: before.replace(/\n/g, ' | ').slice(0, 300), after: after.replace(/\n/g, ' | ').slice(0, 300), tip, magic: magic.replace(/\n/g, ' | ').slice(0, 400), blochT, errs };
    await ctx.close();
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
