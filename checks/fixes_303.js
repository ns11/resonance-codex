// 3.0.3: the Medium and Low fixes of PROBA run 2 that the page can show. Every failed expectation goes into `errs`.
// Usage: node checks/fixes_303.js [out folder] [port]   (the port serves the tree under test; default 8765)
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const outdir = process.argv[2] || '';
const PORT = process.argv[3] || '8765';
const BASE = 'http://127.0.0.1:' + PORT + '/';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = []; const out = {};
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/\/_blob\//.test(m.text()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 600); };
  const text = () => page.evaluate(() => document.body.innerText);
  await page.goto(BASE + '#/cyclopedia', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. the Bestiary card: the four levels add up to the count; the lede counts the cards shown
  out.bestiary = await page.evaluate(() => {
    const c = Array.from(document.querySelectorAll('.cyc-card')).find((a) => /Bestiary/.test(a.innerText));
    const n = Number(c.querySelector('.cyc-n').textContent);
    const lv = Array.from(c.querySelectorAll('.cyc-levels b')).map((b) => Number(b.textContent));
    const lede = document.querySelector('.lede').textContent; const cards = document.querySelectorAll('.cyc-card').length;
    return { n, lv, sum: lv.reduce((a, b) => a + b, 0), lede, cards };
  });
  expect(out.bestiary.sum === out.bestiary.n, 'Bestiary card: levels ' + out.bestiary.lv.join('+') + ' = ' + out.bestiary.sum + ' equal the count ' + out.bestiary.n);
  expect(new RegExp(' in ' + out.bestiary.cards + ' sections').test(out.bestiary.lede), 'Cyclopedia lede counts the ' + out.bestiary.cards + ' cards shown (got "' + out.bestiary.lede + '")');

  // 2. the lore menu closes when the view changes
  await go('#/e/mixing-angle', 700);
  await page.click('#lore-menu button'); await page.waitForTimeout(250);
  const before = await page.evaluate(() => !!document.querySelector('.lore-list.open'));
  await go('#/e/rabi-oscillation', 700);
  const after = await page.evaluate(() => !!document.querySelector('.lore-list.open'));
  expect(before && !after, 'lore menu opens, then closes on a hash change (before ' + before + ', after ' + after + ')');

  // 3. search
  const search = async (q) => { await page.fill('#codex-search', ''); await page.fill('#codex-search', q); await page.waitForTimeout(350); return page.evaluate(() => Array.from(document.querySelectorAll('#codex-search-results a')).map((a) => ({ label: a.querySelector('.hit-t span').textContent, href: a.getAttribute('href') }))); };
  out.searchGamma = await search('Γ');
  expect(out.searchGamma.length > 0, 'search: one Greek letter (Γ) finds entries');
  const rabi = await search('rabi'); out.searchRabi = rabi.map((h) => h.label);
  expect(!rabi.some((h) => /measurab/i.test(h.label)), 'search: "rabi" no longer hits inside "measurability"');
  const cham = await search('chamber'); const hrefs = cham.map((h) => h.href);
  expect(new Set(hrefs).size === hrefs.length, 'search: "chamber" lists each place once (' + hrefs.length + ' hits, ' + new Set(hrefs).size + ' distinct)');
  const rec = await search('damped'); out.searchDamped = rec.map((h) => h.label + ' ' + h.href);
  expect(rec.some((h) => /#\/craft\/r\//.test(h.href)), 'search: a recipe is found by name ("damped")');
  await page.fill('#codex-search', ''); await page.keyboard.press('Escape');

  // 4. deadlines count whole calendar days in Chișinău time (the clock is fixed at 1 Nov 2026, 19:00 UTC)
  await page.clock.setFixedTime(new Date('2026-11-01T19:00:00Z'));
  await go('#/library/chamber-alexander', 1200);
  out.dead = await page.evaluate(() => Array.from(document.querySelectorAll('.city-meta span')).map((s) => s.textContent).filter((t) => /Deadline \d+ \w+ 2026/.test(t) && /d left|today|passed/.test(t)).slice(0, 12));
  const dl = (re) => (out.dead.find((t) => re.test(t)) || '');
  const d5 = dl(/Deadline 5 Nov 2026/); const d4 = dl(/Deadline 4 Nov 2026/); const d3 = dl(/Deadline 3 Nov 2026/);
  if (d5) expect(/ 4 d left/.test(d5), 'deadline "5 Nov 2026" on 1 Nov reads 4 d left (got "' + d5 + '")');
  if (d4) expect(/ 3 d left/.test(d4), 'deadline "4 Nov 2026, 16:30" on 1 Nov reads 3 d left (got "' + d4 + '")');
  if (d3) expect(/ 2 d left/.test(d3), 'deadline "3 Nov 2026, 17:00" on 1 Nov reads 2 d left (got "' + d3 + '")');
  expect(!!(d5 || d4 || d3), 'deadline check found at least one of 3, 4, 5 Nov in the map');
  expect(!/Deadline no IT post/.test(await text()), 'the map no longer calls "no IT post as of …" a deadline');

  // 5. the lamp's header after lighting and before the first prayer
  await go('#/lamp/ficek', 900);
  const lit = await page.$('[data-lamp="light"]'); if (lit) { await lit.click(); await page.waitForTimeout(500); }
  out.lamp = await page.evaluate(() => { const h = document.querySelector('.prayer-head'); return h ? h.innerText.replace(/\s+/g, ' ') : null; });
  expect(out.lamp && !(/burns/.test(out.lamp) && /unlit/.test(out.lamp)), 'lamp header does not say "burns" and "unlit" together (got "' + out.lamp + '")');

  // 6. button contrast in the light theme, and the figures' words
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await go('#/e/decay-rate', 800);
  out.btn = await page.evaluate(() => {
    const lum = (c) => { const m = c.match(/\d+(\.\d+)?/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const els = Array.from(document.querySelectorAll('.btn:not(.ghost), a.req:not(.ghost)')).filter((e) => e.offsetParent);
    return els.slice(0, 6).map((e) => { const s = getComputedStyle(e); const a = lum(s.backgroundColor); const b = lum(s.color); return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100; });
  });
  expect(out.btn.length > 0 && out.btn.every((r) => r >= 4.5), 'light theme: filled buttons have at least 4.5:1 contrast (' + out.btn.join(', ') + ')');
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

  // 7. words
  await go('#/e/alexander', 800);
  let t = await text();
  expect(/Hyphasis/.test(t) && !/Hydaspes in 326, where his army refused/.test(t), 'Alexander: the army refused at the Hyphasis');
  await go('#/library/cell-tanas', 800);
  t = await text();
  expect(/with Z\. Ficek/.test(t) && !/with R\. Tanaś/.test(t), 'Tanaś’s cell lists the review "with Z. Ficek"');
  await go('#/e/secular-approximation', 800);
  t = await text();
  expect(!/PROBA|derived in/i.test(t.replace(/derived in the dressed basis/gi, '')), 'secular-approximation: no process words');
  expect(/ρ_ES|rho_ES|ρES/.test(t) || /cross terms/i.test(t), 'secular-approximation: the cross-terms note is present');
  await go('#/releases', 800);
  expect(!/PROBA/.test(await text()), 'the release log never says PROBA');
  await go('#/craft', 900);
  expect(!/Terra Incognito/.test(await text()), 'crafting page says Terra Incognita, not Incognito');
  await go('#/lore/iovu', 1200);
  await go('#/cyclopedia', 900);
  t = await text();
  expect(!/CRETD-D CRETD-D/.test(t), 'Iovu cyclopedia has no doubled CRETD-D');
  await page.evaluate(() => { location.hash = '#/lore/resonance'; }); await page.waitForTimeout(1200);

  // 8. the drills: the correct option is not the longest in most questions
  await go('#/', 600);
  out.drills = await page.evaluate(() => {
    let tot = 0; let strict = 0; let ties = 0; let thin = 0;
    for (const e of window.Codex.all()) for (const q of (e.quiz || [])) { tot++; const L = q.options.map((o) => o.length); const mx = Math.max(...L); if (L[q.answer] === mx) { ties++; if (L.filter((x) => x === mx).length === 1) strict++; } if (!q.why || q.why.length < 25) thin++; }
    return { tot, strict, ties, thin };
  });
  expect(out.drills.tot >= 60, 'drills: 60 questions or more are present (' + out.drills.tot + ')');
  expect(out.drills.ties / out.drills.tot <= 0.4, 'drills: the correct option is the longest (ties included) in at most 40% of the questions (' + out.drills.ties + ' of ' + out.drills.tot + ')');
  expect(out.drills.thin === 0, 'drills: every question has an explanation of at least 25 characters (' + out.drills.thin + ' thin)');

  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
