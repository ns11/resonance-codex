// 2.3.0: the version stamp, the footer line and the release log (#/releases), at 1440 px and 390 px, light and dark.
// Usage: node checks/releases_check.js <out folder>   (server on 8765, see README)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const MOCK = fs.readFileSync(path.join(__dirname, 'mock_claude.js'), 'utf8');
const URL = 'http://127.0.0.1:8765/';
const fails = [];
const ok = (cond, what) => { if (!cond) fails.push(what); };
(async () => {
  const browser = await chromium.launch();
  for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext(Object.assign({ viewport: vp, colorScheme: scheme }, tag === 'phone' ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}));
      await ctx.addInitScript(MOCK);
      const page = await ctx.newPage();
      const errs = [];
      page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/_blob/.test(m.text())) errs.push(m.text()); });
      await page.goto(URL + '#/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      const k = tag + ':' + scheme;
      const r0 = await page.evaluate(() => window.CODEX_RELEASES && window.CODEX_RELEASES.releases[0]);
      ok(r0 && /^\d+\.\d+\.\d+$/.test(r0.v), k + ' releases.js loads with a SemVer first entry');
      const st = await page.evaluate(() => { const s = document.getElementById('codex-stamp'); if (!s) return null; const r = s.getBoundingClientRect(); const d = s.querySelector('.st-date'); return { hidden: s.hidden, text: s.innerText.replace(/\s+/g, ' ').trim(), href: s.getAttribute('href'), h: r.height, w: r.width, dateShown: !!d && getComputedStyle(d).display !== 'none' }; });
      ok(st && !st.hidden && st.href === '#/releases', k + ' stamp is shown and links to the release log');
      ok(st && st.text.startsWith(r0.v), k + ' stamp starts with the version ' + (r0 && r0.v) + ' (got "' + (st && st.text) + '")');
      ok(st && !/PROBA|MATUR/.test(st.text), k + ' stamp carries no run word');
      if (tag === 'desk') ok(st && st.dateShown && /\d{1,2} [A-Z][a-z]{2} \d{4}/.test(st.text), k + ' stamp shows the date on desktop');
      else ok(st && !st.dateShown && st.h >= 24, k + ' stamp shows only the number on phones and is at least 24 px tall');
      const ver = await page.evaluate(() => (document.getElementById('codex-ver') || {}).innerText || '');
      ok(ver.includes('Version ' + r0.v) && ver.includes('Release log'), k + ' footer line names the version and the log (got "' + ver + '")');
      const overflow0 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      ok(overflow0 <= 0, k + ' no sideways scroll on the Journal (' + overflow0 + ' px)');
      await page.screenshot({ path: path.join(OUT, 'rel-' + tag + '-' + scheme + '-top.png') });
      await page.click('#codex-stamp');
      await page.waitForTimeout(700);
      const idxBtn = await page.evaluate(() => { const b = document.querySelector('#codex-main .ci-toggle'); return !!b && getComputedStyle(b).display !== 'none'; });
      ok(!idxBtn, k + ' no Index button on the log, which has no index');
      const lg = await page.evaluate(() => ({ hash: location.hash, title: document.title, h1: (document.querySelector('#codex-main h1') || {}).textContent, cards: document.querySelectorAll('.rel-list > li').length, now: document.querySelectorAll('.rel-list > li.now').length, cur: (document.querySelector('.rel.now .rel-v') || {}).textContent, hist: document.querySelectorAll('.rel-hist dt').length, noIndex: document.getElementById('codex-shell').classList.contains('no-index'), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      ok(lg.hash === '#/releases' && lg.h1 === 'Release log', k + ' the stamp opens the release log');
      ok(lg.cards >= 1 && lg.now === 1 && lg.cur === r0.v, k + ' the log shows the current release first');
      ok(lg.hist === 4, k + ' the log shows the four entries from before the stamp (got ' + lg.hist + ')');
      ok(/^Release log · /.test(lg.title), k + ' page title (got "' + lg.title + '")');
      ok(lg.noIndex, k + ' the cyclopedia index is hidden on the log');
      ok(lg.overflow <= 0, k + ' no sideways scroll on the log (' + lg.overflow + ' px)');
      await page.screenshot({ path: path.join(OUT, 'rel-' + tag + '-' + scheme + '-log.png'), fullPage: true });
      // back to an entry: the stamp stays, the index returns
      await page.evaluate(() => { location.hash = '#/e/decay-rate'; });
      await page.waitForTimeout(700);
      const back = await page.evaluate(() => ({ stamp: !document.getElementById('codex-stamp').hidden, noIndex: document.getElementById('codex-shell').classList.contains('no-index') }));
      ok(back.stamp && !back.noIndex, k + ' after the log, an entry page has the stamp and the index again');
      ok(!errs.length, k + ' no console errors: ' + errs.join(' | '));
      await ctx.close();
    }
  }
  await browser.close();
  console.log(fails.length ? 'FAIL\n- ' + fails.join('\n- ') : 'releases_check: all passed');
  process.exit(fails.length ? 1 : 0);
})();
