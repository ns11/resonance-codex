// PROBA UI pass: desktop 1440 and phone 390, light and dark; overflow, tiny text, small tap targets, contrast; print; text dumps.
// Usage: node checks/proba/ui_check.js [port] [out folder]   (default port 8765; restored after PROBA run 1)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, '..', 'mock_claude.js'), 'utf8');
const PORT = process.argv[2] || '8765';
const OUT = process.argv[3] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const ROUTES = ['#/', '#/cyclopedia', '#/figures', '#/lexicon', '#/tomes', '#/tome/sz/6.3', '#/literature', '#/library', '#/library/chamber-a', '#/library/cell-ficek', '#/library/kudo-hall',
  '#/e/decay-rate', '#/e/mixing-angle', '#/e/scully', '#/e/qrate', '#/e/place-resonance-canc-lineas-wing', '#/craft', '#/craft/r/r-damped-rabi', '#/review', '#/quests', '#/dossier', '#/lores', '#/lamp/ficek', '#/releases'];
const PROBE = `(() => {
  const vw = document.documentElement.clientWidth;
  const lum = (c) => { const m = c.match(/[\\d.]+/g); if (!m) return null; const [r, g, b] = m.slice(0, 3).map(Number); const a = m[3] !== undefined ? Number(m[3]) : 1; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return { L: 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a, rgb: [r, g, b] }; };
  const bgOf = (el) => { let e = el; while (e && e !== document.documentElement) { const bg = getComputedStyle(e).backgroundColor; const l = lum(bg); if (l && l.a > 0.95) return bg; e = e.parentElement; } return getComputedStyle(document.body).backgroundColor; };
  const ratio = (fg, bg) => { const a = lum(fg), b = lum(bg); if (!a || !b) return null; const hi = Math.max(a.L, b.L), lo = Math.min(a.L, b.L); return (hi + 0.05) / (lo + 0.05); };
  const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
  const wide = [], small = [], taps = [], low = [];
  const all = document.querySelectorAll('body *');
  let n = 0;
  for (const el of all) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && !el.closest('mjx-container, .mdisp, pre, svg')) wide.push((el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '')) + ' +' + Math.round(r.right - vw));
    const cs = getComputedStyle(el);
    const hasText = Array.from(el.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim());
    if (hasText) {
      n++;
      const fs = parseFloat(cs.fontSize);
      if (fs < 11) small.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] + ' ' + fs + 'px');
      const rt = ratio(cs.color, bgOf(el));
      const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700);
      if (rt !== null && rt < (large ? 3 : 4.5) && n < 4000) low.push({ sel: el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0], text: el.textContent.trim().slice(0, 40), ratio: Math.round(rt * 100) / 100, fs, color: cs.color, bg: bgOf(el) });
    }
    if ((el.matches('a, button, [role=button], input, select, textarea, label.opt, summary')) && vw < 500) { if (r.width < 24 || r.height < 24) taps.push(el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0] + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' "' + el.textContent.trim().slice(0, 20) + '"'); }
  }
  const lowMap = {}; for (const l of low) { const k = l.sel + '|' + l.color + '|' + l.bg; if (!lowMap[k]) lowMap[k] = Object.assign({ n: 0 }, l); lowMap[k].n++; }
  return { vw, overflow: document.documentElement.scrollWidth - vw, wide: wide.slice(0, 12), small: [...new Set(small)].slice(0, 12), taps: [...new Set(taps)].slice(0, 15), low: Object.values(lowMap).sort((a, b) => a.ratio - b.ratio).slice(0, 12), textN: n };
})()`;
(async () => {
  const browser = await chromium.launch();
  const out = { routes: {}, errs: [] };
  const texts = {};
  for (const [tag, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext(Object.assign({ viewport: { width: vp.width, height: vp.height }, colorScheme: scheme }, vp.isMobile ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}));
      await ctx.addInitScript(MOCK);
      const page = await ctx.newPage();
      page.on('pageerror', (e) => out.errs.push(tag + ':' + scheme + ' pageerror ' + e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/_blob/.test(m.text())) out.errs.push(tag + ':' + scheme + ' ' + m.text()); });
      await page.goto('http://127.0.0.1:' + PORT + '/#/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      for (const r of ROUTES) {
        await page.evaluate((h) => { location.hash = h; }, r);
        await page.waitForTimeout(r === '#/' ? 300 : 700);
        if (r === '#/lamp/ficek') { const b = await page.$('[data-lamp="light"]'); if (b) { await b.click(); await page.waitForTimeout(300); const ta = await page.$('#pray-text'); if (ta) { await page.fill('#pray-text', 'As Ficek: I take the two atoms to decay independently and ask how the spectrum changes.'); await page.click('form[data-lamp-form] button[type="submit"]'); await page.waitForTimeout(900); } } }
        const key = tag + ':' + scheme + ':' + r;
        out.routes[key] = await page.evaluate(PROBE);
        const file = path.join(OUT, tag + '-' + scheme + '-' + r.replace(/[^a-z0-9]+/gi, '_') + '.png');
        await page.screenshot({ path: file, fullPage: false });
        out.routes[key].shot = file;
        if (tag === 'desk' && scheme === 'light') texts[r] = await page.evaluate(() => document.getElementById('codex-main').innerText);
      }
      // print: an entry page as a PDF without backgrounds (the browser default) and with them
      if (tag === 'desk') {
        await page.evaluate(() => { location.hash = '#/e/decay-rate'; }); await page.waitForTimeout(700);
        await page.emulateMedia({ media: 'print', colorScheme: scheme });
        await page.pdf({ path: path.join(OUT, 'print-' + scheme + '-decay-rate-nobg.pdf'), printBackground: false, format: 'A4' });
        await page.pdf({ path: path.join(OUT, 'print-' + scheme + '-decay-rate-bg.pdf'), printBackground: true, format: 'A4' });
        out['print:' + scheme] = await page.evaluate(() => ({ bodyBg: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color, navShown: !!document.querySelector('.nav') && getComputedStyle(document.querySelector('.nav')).display !== 'none', indexShown: !!document.getElementById('codex-index') && getComputedStyle(document.getElementById('codex-index')).display !== 'none', mainWidth: document.getElementById('codex-main').getBoundingClientRect().width }));
        await page.emulateMedia({ media: 'screen', colorScheme: scheme });
      }
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(OUT, 'ui_texts.json'), JSON.stringify(texts, null, 1));
  fs.writeFileSync(path.join(OUT, 'ui_check.json'), JSON.stringify(out, null, 1));
  // summary
  for (const [k, v] of Object.entries(out.routes)) {
    const flags = [];
    if (v.overflow > 0) flags.push('overflow ' + v.overflow);
    if (v.wide.length) flags.push('wide ' + v.wide.join(', '));
    if (v.small.length) flags.push('small ' + v.small.join(', '));
    if (v.taps.length) flags.push('taps ' + v.taps.length + ': ' + v.taps.slice(0, 4).join(' | '));
    if (v.low.length) flags.push('low-contrast ' + v.low.slice(0, 4).map((l) => l.sel + ' ' + l.ratio + ' (' + l.n + ') "' + l.text.slice(0, 18) + '"').join(' | '));
    console.log(k + ' :: ' + (flags.length ? flags.join(' || ') : 'ok'));
  }
  console.log('print', JSON.stringify(out['print:light']), JSON.stringify(out['print:dark']));
  console.log('errs', JSON.stringify(out.errs));
  await browser.close();
})();
