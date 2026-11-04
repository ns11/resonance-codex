const { chromium } = require('playwright');
const OUT = process.argv[2];
const routes = ['#/', '#/tomes', '#/tome/sz', '#/tome/sz/6.2', '#/lexicon', '#/literature', '#/e/sz-6-3', '#/e/decay-rate', '#/e/stimulated-spontaneous', '#/e/rabi-oscillation', '#/e/dressed-states', '#/e/mixing-angle', '#/e/secular-approximation', '#/e/interaction-picture', '#/tome/ct'];
(async () => {
  const browser = await chromium.launch();
  const report = [];
  for (const [vw, vh, tag] of [[1280, 900, 'desk'], [390, 844, 'phone']]) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, colorScheme: scheme, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errs = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
      page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
      await page.goto('http://127.0.0.1:8765/' + routes[0], { waitUntil: 'networkidle' });
      for (const r of routes) {
        await page.evaluate((h) => { location.hash = h; }, r);
        await page.waitForTimeout(250);
        await page.waitForFunction(() => !window.MathJax || !window.MathJax.startup || window.MathJax.startup.promise, null, { timeout: 5000 }).catch(() => {});
        await page.evaluate(() => window.MathJax && window.MathJax.startup && window.MathJax.startup.promise).catch(() => {});
        await page.waitForTimeout(400);
        const info = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          math: document.querySelectorAll('mjx-container').length,
          rawTex: (document.getElementById('codex-main').innerText.match(/\\\(|\\\[/g) || []).length,
          mjxErr: document.querySelectorAll('mjx-merror, [data-mjx-error]').length,
          known: document.querySelectorAll('a.kw-known').length,
          fog: document.querySelectorAll('a.kw-fog').length,
          title: document.title,
          wide: Array.from(document.querySelectorAll('#codex-main *')).filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !el.closest('.mdisp, .nav')).slice(0, 3).map((el) => el.tagName + '.' + el.className + ' ' + (el.textContent || '').slice(0, 40)),
        }));
        report.push({ tag, scheme, r, ...info });
        if ((scheme === 'light' && ['#/', '#/e/sz-6-3', '#/e/decay-rate', '#/tome/sz/6.2', '#/e/interaction-picture', '#/literature'].includes(r)) || (scheme === 'dark' && ['#/', '#/e/mixing-angle'].includes(r))) {
          await page.screenshot({ path: `${OUT}/${tag}-${scheme}-${r.replace(/[#/]+/g, '_')}.png`, fullPage: tag === 'phone' ? false : false });
        }
      }
      report.push({ tag, scheme, errors: errs.slice(0, 12) });
      await ctx.close();
    }
  }
  console.log(JSON.stringify(report, null, 0).replace(/\},\{/g, '},\n{'));
  await browser.close();
})();
