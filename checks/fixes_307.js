// 3.0.7: the fixes of PROBA run 6 logic half (L1 to L3) and the UI Lows. Every failed expectation goes into `errs`.
// Usage: node checks/fixes_307.js [out folder] [port]   (the port serves the tree under test; default 8765)
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const VIEWER = MOCK.replace('isOwner: async () => true', 'isOwner: async () => false').replace('canEdit: async () => true', 'canEdit: async () => false');
const withUser = (code) => MOCK + `
;(() => { const cl = window.claude; const real = cl.use.bind(cl); cl.use = async (n) => { if (n !== 'user') return real(n); const u = await real('user'); ${code} }; })();`;
const PORT = process.argv[3] || '8765';
const BASE = 'http://127.0.0.1:' + PORT + '/';
(async () => {
  const browser = await chromium.launch();
  const errs = []; const out = {};
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };
  const mk = async (mock, vp) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 } }, vp || {}));
    await ctx.addInitScript(mock);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
    const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 700); };
    const text = () => page.evaluate(() => document.getElementById('codex-main').innerText);
    return { ctx, page, go, text };
  };

  // L1: a rejected submit keeps the typed text through a background rebuild
  {
    const { ctx, page, go } = await mk(MOCK);
    await page.goto(BASE + '#/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1500);
    const places = await page.evaluate(() => window.Codex.packs().flatMap((p) => window.Codex.places(p.id).map((q) => q.id)));
    let found = null;
    for (const pid of places) { await go('#/library/' + pid, 250); if (await page.$('#lw-title')) { found = pid; break; } }
    expect(!!found, 'a place with the write form exists');
    if (found) {
      await page.fill('#lw-title', '   '); await page.fill('#lw-text', 'A long paragraph I typed.\n\nSecond.');
      await page.evaluate(() => document.querySelector('form[data-lib-write] button[type=submit]').click()); await page.waitForTimeout(300);
      await page.evaluate((p) => window.Codex.Store.update('place:' + p, { found: true }), found); await page.waitForTimeout(1200);
      out.l1 = await page.evaluate(() => ({ t: (document.getElementById('lw-text') || {}).value, ti: (document.getElementById('lw-title') || {}).value }));
      expect(out.l1.t && out.l1.t.startsWith('A long paragraph'), 'L1: the text of a rejected submit survives a rebuild (' + JSON.stringify(out.l1) + ')');
      // and a real submit still clears the form (M1 of 3.0.5 stays fixed)
      await page.fill('#lw-title', 'My note'); await page.click('form[data-lib-write] button[type=submit]'); await page.waitForTimeout(1200);
      out.l1ok = await page.evaluate(() => location.hash);
      expect(/#\/doc\//.test(out.l1ok), 'L1: a good submit still opens the document (' + out.l1ok + ')');
    }
    await ctx.close();
  }

  // L2: the release log for a viewer and for the keeper
  {
    const v = await mk(VIEWER); await v.page.goto(BASE + '#/releases', { waitUntil: 'domcontentloaded' }); await v.page.waitForTimeout(1800);
    const vt = await v.text();
    expect(!/cells are kept|stand vacant/.test(vt), 'L2: a viewer does not read about the board\'s cells');
    expect(/The notes of this release are kept by the keeper/.test(vt), 'L2: an entry with only keeper notes says so (3.0.0)');
    expect(!/Iovu lore|CRETD|Zandstra|campaign files/.test(vt.replace(/\bIovu\b(?=\s*\n)/g, '')), 'L2: no campaign note for a viewer');
    expect(/Typed text is no longer lost/.test(vt), 'L2: the 3.0.7 notes for a viewer are shown');
    await v.ctx.close();
    const k = await mk(MOCK); await k.page.goto(BASE + '#/releases', { waitUntil: 'domcontentloaded' }); await k.page.waitForTimeout(1800);
    const kt = await k.text();
    expect(/Four cells are kept, two stand vacant/.test(kt) && /campaign files are still sent/.test(kt) && !/kept by the keeper\./.test(kt), 'L2: the keeper reads every note');
    await k.ctx.close();
  }

  // L3: the owner answer is slow, or never comes
  {
    const s = await mk(withUser('await new Promise((r) => setTimeout(r, 3000)); return u;'));
    await s.page.goto(BASE + '#/e/iovu-py', { waitUntil: 'domcontentloaded' }); await s.page.waitForTimeout(1200);
    const early = await s.text();
    expect(/Opening the codex/.test(early) && !/Not found|Not in the codex/.test(early), 'L3: a keeper deep link says Opening while the answer is slow (' + early.slice(0, 60).replace(/\n/g, ' ') + ')');
    await s.page.waitForTimeout(3500);
    expect(!/Opening the codex|Not in the codex/.test(await s.text()), 'L3: ... and shows the page when the answer comes');
    await s.ctx.close();
    const h = await mk(withUser('return new Promise(() => {});'));
    await h.page.goto(BASE + '#/lore/iovu', { waitUntil: 'domcontentloaded' }); await h.page.waitForTimeout(1500);
    expect(/Opening the codex/.test(await h.text()), 'L3: while waiting, the lore link says Opening');
    await h.page.waitForTimeout(12500);
    out.hang = await h.page.evaluate(() => ({ hash: location.hash, known: window.CodexLibrary.ownerKnown(), owner: window.CodexLibrary.owner() }));
    expect(out.hang.known && !out.hang.owner && out.hang.hash === '#/', 'L3: an owner answer that never comes ends as a viewer on the home page (' + JSON.stringify(out.hang) + ')');
    await h.ctx.close();
    const late = await mk(withUser('return Object.assign({}, u, { isOwner: async () => { await new Promise((r) => setTimeout(r, 14000)); return true; } });'));
    await late.page.goto(BASE + '#/e/iovu-py', { waitUntil: 'domcontentloaded' }); await late.page.waitForTimeout(13500);
    expect(/Not in the codex/.test(await late.text()), 'L3: after 12 s the codex is drawn for a viewer');
    await late.page.waitForTimeout(3500);
    out.late = await late.page.evaluate(() => window.CodexLibrary.owner());
    expect(out.late === true && !/Not in the codex/.test(await late.text()), 'L3: a late "yes" brings the keeper view back (' + out.late + ')');
    await late.ctx.close();
    const vw = await mk(VIEWER);
    await vw.page.goto(BASE + '#/e/gates', { waitUntil: 'domcontentloaded' }); await vw.page.waitForTimeout(1800);
    expect(/Not in the codex/.test(await vw.text()), 'L3: a viewer still meets Not in the codex on a campaign page');
    await vw.ctx.close();
  }

  // UI Lows: phone touch targets and two contrasts
  {
    const p = await mk(MOCK, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await p.page.goto(BASE + '#/', { waitUntil: 'domcontentloaded' }); await p.page.waitForTimeout(1500);
    const small = {};
    for (const r of ['#/', '#/tome/sz/6.3', '#/e/decay-rate', '#/review', '#/e/scully', '#/e/qrate', '#/craft/r/r-damped-rabi']) {
      await p.go(r, 700);
      small[r] = await p.page.evaluate(() => [...document.querySelectorAll('#codex-main a')].filter((a) => { const q = a.getBoundingClientRect(); return q.width > 0 && q.height > 0 && q.height < 23.5 && getComputedStyle(a).display !== 'inline'; }).map((a) => (a.textContent || '').trim().slice(0, 20)));
      const inline = await p.page.evaluate(() => [...document.querySelectorAll('#codex-main .rowlink a, #codex-main a.where, #codex-main .src-links a, #codex-main .crew-name a, #codex-main li.blk > a')].filter((a) => a.getBoundingClientRect().height < 23.5).length);
      expect(inline === 0, 'UI: the listed small links on ' + r + ' are 24 px high (' + inline + ' are not)');
    }
    out.small = small;
    const ov = await p.page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(ov <= 0, 'UI: no horizontal overflow on the phone (' + ov + ')');
    await p.ctx.close();
    for (const scheme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 }, colorScheme: scheme }); await ctx.addInitScript(MOCK);
      const pg = await ctx.newPage(); await pg.goto(BASE + '#/', { waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1200);
      out['contrast_' + scheme] = await pg.evaluate(() => {
        const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number).slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]; };
        const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b)) return b; } return 'rgb(255,255,255)'; };
        const main = document.getElementById('codex-main'); const r = {};
        for (const [name, html] of [['role-secret', '<span class="role-secret">on no map</span>'], ['rg-locked', '<div class="cw-rec locked"><span class="rg">x</span></div>']]) {
          const box = document.createElement('div'); box.innerHTML = html; main.appendChild(box);
          const el = box.querySelector('.role-secret, .rg'); const f = lum(getComputedStyle(el).color); const b = lum(bgOf(el));
          r[name] = Math.round(((Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05)) * 100) / 100; box.remove();
        }
        return r;
      });
      for (const [k, v] of Object.entries(out['contrast_' + scheme])) expect(v >= 4.5, 'UI: ' + k + ' contrast ' + v + ' in ' + scheme + ' is at least 4.5');
      await ctx.close();
    }
  }
  console.log(JSON.stringify({ out, errs }, null, 1));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
