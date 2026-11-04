// 3.1.1: the fixes of PROBA 3.1.0 (UI half): the release log for a viewer, no lamp at the sixth cell, phone targets and hover-card contrast.
// Every failed expectation goes into `errs`. Usage: node checks/fixes_311.js [out folder] [port]   (default port 8765; run it on a 3.1.0 tree as a negative control: it fails there)
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const VIEWER = MOCK.replace('isOwner: async () => true', 'isOwner: async () => false').replace('canEdit: async () => true', 'canEdit: async () => false');
const PORT = process.argv[3] || '8765'; const BASE = 'http://127.0.0.1:' + PORT + '/';
(async () => {
  const browser = await chromium.launch(); const errs = []; const out = {};
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };
  const mk = async (mock, vp) => { const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, vp || {})); await ctx.addInitScript(mock); const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push('pageerror ' + e.message)); const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 800); }; return { ctx, page, go }; };
  const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

  // 1. the release log as a viewer: none of the board's words, the harmless 3.1.1 note present; as the keeper: every note of 3.1.0 and 3.1.1
  {
    const v = await mk(VIEWER); await v.page.goto(BASE + '#/releases', { waitUntil: 'domcontentloaded' }); await v.page.waitForTimeout(1800);
    const vt = await v.page.evaluate(() => document.getElementById('codex-main').innerText);
    const BOARDISH = /\bmembers?\b|\blens\b|\bcells?\b|\bBannon\b|\bdebt\b|trust rule|\bGates\b|\bJobs\b|\bMusk\b|\bFable\b|Epstein|\bstandings\b|\bseries\b|\bboard\b|\bagents?\b/i;
    out.viewerLog = { board: (vt.match(BOARDISH) || [null])[0], has311: /3\.1\.1/.test(vt), hover: /hover card has a 24 px/.test(vt), sixth: /sixth member|Bannon|trust rule/.test(vt) };
    expect(!out.viewerLog.board, 'a viewer reads a board word in the release log: ' + out.viewerLog.board);
    expect(!out.viewerLog.sixth, 'a viewer reads the sixth member note');
    expect(out.viewerLog.has311 && out.viewerLog.hover, 'the harmless 3.1.1 note is shown to a viewer');
    await v.ctx.close();
    const k = await mk(MOCK); await k.page.goto(BASE + '#/releases', { waitUntil: 'domcontentloaded' }); await k.page.waitForTimeout(1800);
    const kt = await k.page.evaluate(() => document.getElementById('codex-main').innerText);
    out.keeperLog = { sixth: /sixth member takes the sixth cell/.test(kt), n311: /no empathy lamp/.test(kt), stand: /standings are 24 px/.test(kt) };
    expect(out.keeperLog.sixth && out.keeperLog.n311 && out.keeperLog.stand, 'the keeper reads the 3.1.0 sixth-member note and the 3.1.1 notes');
    await k.ctx.close();
  }

  // 2. no lamp at the sixth cell; the other cells keep theirs
  {
    const { ctx, page, go } = await mk(MOCK); await page.goto(BASE + '#/library/cell-epstein', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1800);
    const cellTxt = () => page.evaluate(() => document.getElementById('codex-main').innerText);
    out.epsteinCell = /Empathy lamp/i.test(await cellTxt());
    expect(!out.epsteinCell, 'the sixth cell shows an empathy lamp card');
    await go('#/lamp/epstein', 900); out.epsteinLamp = await cellTxt();
    expect(/No lamp here/.test(out.epsteinLamp), 'the lamp route of the sixth member says no lamp: ' + out.epsteinLamp.slice(0, 80));
    await go('#/e/epstein', 900); out.epsteinPlate = await page.evaluate(() => !!document.querySelector('a[href^="#/lamp/epstein"]'));
    expect(!out.epsteinPlate, 'the plate of the sixth member links to a lamp');
    await go('#/library/cell-gates', 900); out.gatesCell = /Empathy lamp/i.test(await cellTxt());
    expect(out.gatesCell, 'the Gates cell lost its lamp');
    out.hasLamp = await page.evaluate(() => ({ epstein: window.CodexLamp.hasLamp('epstein'), gates: window.CodexLamp.hasLamp('gates') }));
    expect(!out.hasLamp.epstein && out.hasLamp.gates, 'hasLamp: ' + JSON.stringify(out.hasLamp));
    await ctx.close();
  }

  // 3. phone: the standings names are 24 px high; the hover card's open link is 24 px high and its text reads at 4.5:1
  {
    const { ctx, page, go } = await mk(MOCK, { viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '#/library/chamber-alexander', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1800);
    out.stLinks = await page.evaluate(() => Array.from(document.querySelectorAll('.standings td a')).map((a) => Math.round(a.getBoundingClientRect().height)));
    expect(out.stLinks.length === 6 && out.stLinks.every((h) => h >= 24), 'standings links under 24 px: ' + JSON.stringify(out.stLinks));
    await go('#/e/decay-rate', 900);
    const a = await page.$('#codex-main a[data-id]'); if (a) { await a.hover(); await page.waitForTimeout(700); }
    out.tip = await page.evaluate(() => { const t = document.querySelector('.kw-tip.show'); if (!t) return null; const cs = (s) => { const e = t.querySelector(s); return e ? getComputedStyle(e).color : null; }; return { bg: getComputedStyle(t).backgroundColor, kind: cs('.tip-kind'), hint: cs('.tip-hint'), openH: (t.querySelector('.tip-open') || { getBoundingClientRect: () => ({ height: 0 }) }).getBoundingClientRect().height }; });
    expect(!!out.tip, 'a hover card opened');
    if (out.tip) { expect(out.tip.openH >= 24, 'the open link of the hover card is ' + out.tip.openH + ' px'); for (const k of ['kind', 'hint']) if (out.tip[k]) expect(ratio(out.tip[k], out.tip.bg) >= 4.5, 'tip-' + k + ' contrast ' + ratio(out.tip[k], out.tip.bg).toFixed(2)); }
    await ctx.close();
  }
  out.errs = errs; console.log(JSON.stringify(out, null, 1)); await browser.close(); process.exit(errs.length ? 1 : 0);
})();
