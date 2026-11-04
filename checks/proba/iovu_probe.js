// PROBA UI pass on 3.0.4: targeted probes of the Iovu surfaces. Owner and viewer, desktop and phone, light and dark.
// Usage: node checks/proba/iovu_probe.js [port] [out folder]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const MOCK = fs.readFileSync(path.join(__dirname, '..', 'mock_claude.js'), 'utf8');
const VIEWER = MOCK.replace('isOwner: async () => true', 'isOwner: async () => false');
const PORT = process.argv[2] || '8765';
const OUT = process.argv[3] || path.join(__dirname, 'out');
fs.mkdirSync(OUT, { recursive: true });
const R = {};
const CONTRAST = `(sel) => {
  const lum = (c) => { const m = c.match(/[\\d.]+/g); const [r, g, b] = m.slice(0, 3).map(Number); const a = m[3] !== undefined ? Number(m[3]) : 1; const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return { L: 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b), a }; };
  const bgOf = (el) => { let e = el; while (e) { const bg = getComputedStyle(e).backgroundColor; if (lum(bg).a > 0.95) return bg; e = e.parentElement; } return 'rgb(255,255,255)'; };
  return Array.from(document.querySelectorAll(sel)).slice(0, 400).filter((el) => el.getBoundingClientRect().width > 0).map((el) => { const cs = getComputedStyle(el); const a = lum(cs.color), b = lum(bgOf(el)); const hi = Math.max(a.L, b.L), lo = Math.min(a.L, b.L); return { t: el.textContent.trim().slice(0, 30), fs: parseFloat(cs.fontSize), cr: +((hi + 0.05) / (lo + 0.05)).toFixed(2), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }; });
}`;
(async () => {
  const browser = await chromium.launch();
  const mk = async (label, o) => {
    const ctx = await browser.newContext(Object.assign({ deviceScaleFactor: 1 }, o.ctx));
    await ctx.addInitScript(o.owner === false ? VIEWER : MOCK);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
    await page.goto('http://127.0.0.1:' + PORT + '/#/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 800); };
    const shot = async (name, sel) => { const f = path.join(OUT, label + '-' + name + '.png'); if (sel) { const el = await page.$(sel); if (el) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await el.screenshot({ path: f }); return; } } await page.screenshot({ path: f }); };
    return { ctx, page, go, shot, errs };
  };
  const dims = [
    ['d-light', { ctx: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' } }],
    ['d-dark', { ctx: { viewport: { width: 1440, height: 900 }, colorScheme: 'dark' } }],
    ['p-light', { ctx: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' } }],
    ['p-dark', { ctx: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' } }],
  ];
  for (const [label, o] of dims) {
    const s = await mk('own-' + label, o);
    const { page, go, shot } = s;
    const r = R['own-' + label] = {};
    await page.evaluate(() => CodexView.switchLore('iovu')); await page.waitForTimeout(600);
    await go('#/', 800); await shot('iovu-home');
    r.homeH1 = await page.evaluate(() => Array.from(document.querySelectorAll('h1')).map((h) => h.textContent.trim().slice(0, 40)));
    await go('#/library/chamber-alexander', 1200); await shot('map');
    r.map = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, groups: Array.from(document.querySelectorAll('details.satrapy h3')).map((h) => h.innerText.replace(/\s+/g, ' ').trim()), cityN: document.querySelectorAll('.city').length }));
    // open every group so the abroad cards are measurable
    await page.evaluate(() => document.querySelectorAll('details.satrapy').forEach((d) => { d.open = true; })); await page.waitForTimeout(300);
    r.chips = await page.evaluate(`(${CONTRAST})('.city .chip')`);
    r.lw = await page.evaluate(`(${CONTRAST})('.city-lw')`);
    r.cov = await page.evaluate(`(${CONTRAST})('.cov-line')`);
    r.cityOverflow = await page.evaluate(() => Array.from(document.querySelectorAll('.city')).filter((c) => c.scrollWidth > c.clientWidth + 1).length);
    r.mapOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await page.evaluate(() => { const g = Array.from(document.querySelectorAll('details.satrapy')).pop(); if (g) g.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(250); await shot('map-abroad');
    await go('#/tomes', 800); await shot('tomes');
    r.tomes = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, cards: document.querySelectorAll('.tomecard').length }));
    r.tcNote = await page.evaluate(`(${CONTRAST})('.tc-note')`);
    r.tcClip = await page.evaluate(() => Array.from(document.querySelectorAll('.tomecard')).filter((c) => c.scrollHeight > c.clientHeight + 2 || c.scrollWidth > c.clientWidth + 1).length);
    await go('#/craft', 800); await shot('craft');
    r.craftH1 = await page.evaluate(() => document.querySelectorAll('h1').length);
    r.cwBtn = await page.evaluate(`(${CONTRAST})('.cw-btn')`);
    r.status = await page.evaluate(`(${CONTRAST})('.status')`);
    await go('#/cyclopedia', 800); await shot('cyclopedia');
    r.cycH1 = await page.evaluate(() => document.querySelectorAll('h1').length);
    await go('#/figures', 800); await shot('figures');
    r.figures = await page.evaluate(() => ({ h1: (document.querySelector('h1') || {}).textContent, lead: (document.querySelector('#codex-main p') || {}).textContent }));
    await go('#/dossier', 800); await shot('dossier');
    r.dossierLinks = await page.evaluate(() => Array.from(document.querySelectorAll('#codex-main a')).map((a) => { const b = a.getBoundingClientRect(); return { h: Math.round(b.height), w: Math.round(b.width) }; }).filter((x) => x.h > 0).reduce((m, x) => ({ min: Math.min(m.min, x.h), n: m.n + 1, under24: m.under24 + (x.h < 24 ? 1 : 0), under44: m.under44 + (x.h < 44 ? 1 : 0) }), { min: 999, n: 0, under24: 0, under44: 0 }));
    // search
    r.search = {};
    for (const q of ['§6.3', 'Ω', 'ρ', 'Iovu', 'vacant']) {
      await go('#/', 400);
      await page.fill('#codex-search', q); await page.waitForTimeout(350);
      r.search[q] = await page.evaluate(() => { const box = document.getElementById('codex-search-results'); return { hidden: box.hidden, n: box.querySelectorAll('a').length, first: (box.querySelector('a') || {}).textContent ? box.querySelector('a').textContent.trim().slice(0, 60) : null, w: Math.round(box.getBoundingClientRect().width), right: Math.round(box.getBoundingClientRect().right) }; });
      if (q === 'Iovu' || q === 'Ω') await shot('search-' + q.replace(/\W/g, 'x'));
    }
    await page.fill('#codex-search', 'rabi'); await page.waitForTimeout(300);
    await page.evaluate(() => { location.hash = '#/cyclopedia'; }); await page.waitForTimeout(400);
    r.searchClosesOnNav = await page.evaluate(() => document.getElementById('codex-search-results').hidden);
    r.errs = s.errs;
    await s.ctx.close();
  }

  // print on desktop owner
  {
    const s = await mk('own-print', { ctx: { viewport: { width: 1440, height: 900 }, colorScheme: 'light' } });
    const { page, go } = s;
    R.print = {};
    for (const h of ['#/craft', '#/tomes', '#/e/decay-rate', '#/dossier']) {
      await go(h, 900);
      await page.emulateMedia({ media: 'print' });
      R.print[h] = await page.evaluate(() => ({ btnVisible: Array.from(document.querySelectorAll('button, .cw-bar, .stage-pick, .fbtn, #codex-toast')).filter((e) => { const b = e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && b.width > 0; }).map((e) => e.tagName + '.' + (e.className || '').toString().split(' ')[0]).slice(0, 8), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
      await page.pdf({ path: path.join(OUT, 'print' + h.replace(/\W+/g, '_') + '.pdf'), format: 'A4' });
      await page.emulateMedia({ media: 'screen' });
    }
    // toast clears on navigation
    await go('#/craft', 600);
    await page.evaluate(() => { if (window.CodexToast) window.CodexToast('probe toast'); else if (window.Codex && Codex.toast) Codex.toast('probe toast'); });
    await page.waitForTimeout(200);
    R.toastBefore = await page.evaluate(() => { const t = document.getElementById('codex-toast'); return t ? { text: t.textContent.trim(), shown: !t.hidden && getComputedStyle(t).opacity !== '0' } : null; });
    await go('#/cyclopedia', 500);
    R.toastAfter = await page.evaluate(() => { const t = document.getElementById('codex-toast'); return t ? { text: t.textContent.trim(), shown: !t.hidden && getComputedStyle(t).opacity !== '0' } : null; });
    await s.ctx.close();
  }

  // viewer (non-owner): the secret hall, the Alexander lens
  for (const [label, o] of [['d-light', dims[0][1]], ['p-light', dims[2][1]]]) {
    const s = await mk('view-' + label, Object.assign({ owner: false }, o));
    const { page, go, shot } = s;
    const r = R['view-' + label] = {};
    await go('#/library', 1000); await shot('library');
    r.library = await page.evaluate(() => ({ text: document.getElementById('codex-main').innerText.slice(0, 1500), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, owner: window.CodexLibrary && CodexLibrary.owner && String(CodexLibrary.owner()) }));
    await go('#/library/chamber-alexander', 1000); await shot('chamber-alexander');
    r.chamber = await page.evaluate(() => (document.querySelector('h1') || {}).textContent + ' | ' + document.getElementById('codex-main').innerText.slice(0, 300).replace(/\s+/g, ' '));
    await go('#/figures', 900); await shot('figures');
    r.figures = await page.evaluate(() => ({ lens: /weighs/i.test(document.getElementById('codex-main').innerText), alexander: /Alexander/.test(document.getElementById('codex-main').innerText) }));
    r.errs = s.errs;
    await s.ctx.close();
  }
  fs.writeFileSync(path.join(OUT, 'iovu_probe.json'), JSON.stringify(R, null, 1));
  await browser.close();
  console.log('done');
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
