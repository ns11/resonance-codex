// 3.0.1: the fixes of PROBA run 1 that the page can show. Every failed expectation goes into `errs`.
// Facts (deaths, titles, authors), the secret Kudo Hall, the dossier, the recipe status, the counts, the print pass, the contrast, the taglines.
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const outdir = process.argv[2] || '';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/\/_blob\//.test(m.text()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 500); };
  const body = () => page.evaluate(() => document.body.innerText);
  await page.goto('http://127.0.0.1:8765/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const out = {};

  // 1. facts in the data
  out.facts = await page.evaluate(() => {
    const g = (id) => window.Codex.get(id) || {};
    const works = (id) => (g(id).works || []).map((w) => w.title + ' | ' + w.venue + ' | ' + w.note + ' | ' + w.year);
    return {
      cohen: [g('cohen-tannoudji').years, /died in Paris on 22 October 2026, aged 93/.test((g('cohen-tannoudji').bio || []).join(' '))],
      tanas: [g('tanas').years, /died on 22 October 2026, aged 80/.test((g('tanas').bio || []).join(' ')), /\bis\b|\bhas\b.*Poznań/.test('') ],
      scully: works('scully')[1],
      cudreasov: [g('cudreasov').teaser, works('cudreasov')[0]],
      koudinov: works('koudinov')[0], coudreau: works('coudreau')[0], kudlinski: works('kudlinski')[0], yua: works('kudryavtsev-yua')[0],
      kna: [g('kudryashov-na').teaser, works('kudryashov-na').slice(0, 2)], kudritzki: g('kudritzki').teaser,
      ksi: (g('kudryashov-si').bio || [''])[0].slice(0, 260),
      lehmberg: (g('lehmberg').bio || [''])[0].slice(0, 40), agarwal: (g('agarwal').bio || [''])[0].slice(0, 40), ficek: (g('ficek').bio || [''])[0].slice(0, 40),
      feynman: g('feynman').teaser, glauber: g('glauber').teaser, zoller: /emeritus professor there since 2020/.test((g('zoller').bio || []).join(' ')),
      antibunching: (g('antibunching') || {}).teaser,
    };
  });
  const F = out.facts;
  expect(F.cohen[0] === '1933–2026' && F.cohen[1], 'Cohen-Tannoudji: years 1933–2026 and the death in the bio');
  expect(/died 22 October 2026/.test(F.tanas[0]) && F.tanas[1], 'Tanaś: death date in years and bio');
  expect(/Quantum Theory of an Optical Maser\. I\. General Theory/.test(F.scully) && /208–226/.test(F.scully), 'Scully–Lamb: title and pages');
  expect(/Bardetski/.test(F.cudreasov[1]) && /Macovei/.test(F.cudreasov[1]) && /“Two Dipole-Dipole Interacting Emitters in a Moderately Strong Laser Field”/.test(F.cudreasov[0]), 'own paper: three authors and the exact title');
  expect(/Physical Review B 68, 085315/.test(F.koudinov), 'Koudinov: PRB 68, 085315');
  expect(/36, 93–98/.test(F.coudreau) && /\| 1996$/.test(F.coudreau), 'Coudreau: 1996, EPL 36, 93–98');
  expect(/33, 2407/.test(F.kudlinski) && !/others/.test(F.kudlinski), 'Kudlinski: Optics Letters 33, 2407 with Mussot only');
  expect(/16, 514/.test(F.yua) && /S\. A\. Aseyev/.test(F.yua), 'Yu. A. Kudryavtsev: page 514 and S. A. Aseyev');
  expect(/most cited bearer of the name/.test(F.kna[0]) && /698/.test(F.kna[1][0]) && /614/.test(F.kna[1][1]), 'N. A. Kudryashov: one claim with the database and date, two top works');
  expect(!/most cited/.test(F.kudritzki) && /657/.test(F.kudritzki), 'Kudritzki: no doubled claim');
  expect(!/Journal of Applied Physics/.test(F.ksi) && /41 of 172/.test(F.ksi), 'S. I. Kudryashov: the venue claim is the counted one');
  expect(!/American|Indian-American|Polish-Australian/.test(F.lehmberg + F.agarwal + F.ficek), 'no unsourced nationalities');
  expect(/May 1981/.test(F.feynman) && !/mentor/.test(F.glauber) && F.zoller, 'Feynman 1981, Glauber not mentor, Zoller emeritus');
  expect(/g⁽²⁾\(0\) < g⁽²⁾\(τ\)/.test(F.antibunching || ''), 'antibunching teaser states the correct condition');
  out.books = await page.evaluate(() => {
    const t = (id) => (window.Codex.get(id) || {}).name;
    return { h: t('ch-exploring-2') || t('ch-exploring-the-quantum-2'), ft: ['ch-ficek-tanas-2', 'ch-ficek-tanas-3', 'ch-ficek-tanas-4'].map(t), ag: ['ch-agarwal-15', 'ch-agarwal-18'].map(t) };
  });
  out.libraryText = await page.evaluate(() => { const walk = (l, f) => { for (const p of l || []) { f(p); walk(p.children, f); } }; let bad = []; walk(window.CODEX_LORES.resonance.library.places, (p) => { if (/Abydon/.test(p.blurb || '')) bad.push(p.id); if (/rough drafts where .*crosses/.test(p.blurb || '') && /MEPhI, Moscow/.test(p.blurb || '')) bad.push(p.id); }); return bad; });
  expect(out.libraryText.length === 0, 'library text: no "Abydon", no pasted teasers in chamber blurbs: ' + out.libraryText.join(','));

  // 2. the secret Kudo Hall stays hidden until it is found
  await go('#/figures');
  let txt = await body();
  out.figuresBefore = { kudo: /Kudo Hall/.test(txt), far: ['Kudritzki', 'Kudrolli', 'Kudrnovský', 'Kudrynskyi', 'Kazue Kudo', 'Nikolay A. Kudryashov'].filter((n) => txt.includes(n)) };
  expect(!out.figuresBefore.kudo && out.figuresBefore.far.length === 0, 'Figures: no Kudo Hall label and no far monks before the hall is found: ' + JSON.stringify(out.figuresBefore));
  await go('#/craft');
  txt = await body();
  out.craftBefore = ['Kudritzki’s chamber', 'Kudrolli’s chamber', 'Kudo Hall', 'Kudrnovský’s chamber'].filter((n) => txt.includes(n));
  expect(out.craftBefore.length === 0, 'Crafting shelf: no secret chambers before the hall is found: ' + out.craftBefore.join(','));
  await go('#/dossier');
  txt = await body();
  out.dossier = { empties: (txt.match(/No thesis links written/g) || []).length, items: await page.evaluate(() => document.querySelectorAll('.dos-item').length), secret: /Kudo Hall|Kudritzki/.test(txt) };
  expect(out.dossier.empties === 0 && out.dossier.items > 0 && out.dossier.items < 30 && !out.dossier.secret, 'Dossier: only entries with thesis links or a formula, no secret places: ' + JSON.stringify(out.dossier));
  await go('#/cyclopedia');
  out.searchBefore = await page.evaluate(() => { const r = window.CodexView.search ? window.CodexView.search('Kudritzki') : null; return r; });
  // find the hall through the loose stone, then the secret things show
  await go('#/library/araki-hall', 700);
  const stone = await page.$('[data-loose-stone]');
  expect(!!stone, 'the loose stone is on the Araki Hall page');
  if (stone) { await stone.click(); await page.waitForTimeout(700); }
  await go('#/figures', 700);
  txt = await body();
  out.figuresAfter = ['Kudritzki', 'Kudrolli', 'Kazue Kudo'].filter((n) => txt.includes(n));
  expect(out.figuresAfter.length === 3, 'Figures: the far monks appear once the hall is found: ' + out.figuresAfter.join(','));

  // 3. a classic recipe whose page exists
  await go('#/craft/r/r-damped-rabi', 600);
  txt = await body();
  out.recipe = /Status: crafted · pre-built page/.test(txt);
  expect(out.recipe && !/Status: ready to craft/.test(txt), 'classic recipe says "crafted · pre-built page"');

  // 4. counts
  await go('#/cyclopedia', 600);
  out.counts = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.cyc-card')).find((a) => /Bestiary/.test(a.innerText));
    /* 3.0.4: the card counts the Bestiary page: the families, the crafted pages and the tome sections, each once */
    const rows = new Set(); Array.from(document.querySelectorAll('.ci-group[data-ci="bestiary"] .ci-row, .ci-group[data-ci="crafted"] .ci-row, .ci-group[data-ci="tomes"] .ci-row')).forEach((r) => rows.add(r.getAttribute('href')));
    return { card: card && card.querySelector('.cyc-n').innerText.trim(), index: String(rows.size) };
  });
  expect(out.counts.card && out.counts.card === out.counts.index, 'Bestiary count agrees between the Cyclopedia and the index: ' + JSON.stringify(out.counts));
  await go('#/literature', 600);
  out.lit = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.litlist .lit')).map((l) => (l.querySelector('h3, .lit-title, strong') || l).innerText.trim().toLowerCase().slice(0, 60));
    return { cards: titles.length, unique: new Set(titles).size, foot: (document.querySelector('.litlist + p') || {}).innerText };
  });
  expect(out.lit.cards === out.lit.unique && /distinct papers/.test(out.lit.foot || ''), 'Literature lists each paper once and says what it counts: ' + JSON.stringify(out.lit));
  await go('#/lores', 600);
  out.lores = await page.evaluate(() => Array.from(document.querySelectorAll('.lore-card')).map((c) => ({ tag: (c.querySelector('.bc-teaser') || {}).innerText, n: (c.querySelector('.bc-lvl') || {}).innerText })));
  expect(out.lores.every((l) => !l.tag || l.tag.length <= 161), 'lore taglines are clipped');

  // 5. contrast of the muted ink on the surfaces it sits on (light and dark)
  const lum = (rgb) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  out.contrast = {};
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.evaluate((s) => { document.documentElement.setAttribute('data-theme', s); }, scheme);
    await page.waitForTimeout(200);
    const c = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const parse = (v) => { const el = document.createElement('i'); el.style.color = v.trim(); document.body.appendChild(el); const m = getComputedStyle(el).color.match(/[\d.]+/g).map(Number); el.remove(); return m.slice(0, 3); };
      return { ink3: parse(cs.getPropertyValue('--ink-3')), surfaces: ['--bg', '--surface', '--sunk', '--raise'].map((k) => parse(cs.getPropertyValue(k))) };
    });
    out.contrast[scheme] = c.surfaces.map((s) => Math.round(ratio(c.ink3, s) * 100) / 100);
    expect(out.contrast[scheme].every((r) => r >= 4.5), 'muted ink >= 4.5:1 in ' + scheme + ': ' + out.contrast[scheme].join(', '));
  }
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

  // 6. print: no navigation, no light text on white, in both themes
  out.print = {};
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme, media: 'print' });
    await page.evaluate((s) => { document.documentElement.setAttribute('data-theme', s); }, scheme);
    await go('#/e/rabi-oscillation', 700);
    out.print[scheme] = await page.evaluate(() => {
      const vis = (sel) => { const el = document.querySelector(sel); return !!el && getComputedStyle(el).display !== 'none'; };
      const h = document.querySelector('.entry-head');
      const cols = h ? Array.from(h.querySelectorAll('h1, .lede, .kind, .subtitle')).map((e) => getComputedStyle(e).color) : [];
      const bg = h ? getComputedStyle(h).backgroundColor : '';
      return { nav: vis('.nav'), search: vis('.search'), top: vis('header.top'), index: vis('#codex-index'), bark: vis('.bark'), cols, bg };
    });
    const p = out.print[scheme];
    expect(!p.nav && !p.search && !p.top && !p.index && !p.bark, 'print (' + scheme + '): navigation, search, crier and index are hidden');
    const dark = (c) => { const m = c.match(/[\d.]+/g).map(Number); return m[0] + m[1] + m[2] < 330; };
    expect(p.cols.length > 0 && p.cols.every(dark), 'print (' + scheme + '): the header text is dark: ' + p.cols.join(' '));
  }
  await page.emulateMedia({ media: 'screen', colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

  // 7. phone: hit areas
  await page.setViewportSize({ width: 390, height: 844 });
  await go('#/e/decay-rate', 800);
  out.phone = await page.evaluate(() => Array.from(document.querySelectorAll('input[type="checkbox"]')).slice(0, 12).map((i) => { const r = i.getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }));
  expect(out.phone.length > 0 && out.phone.every((s) => s >= 24), 'phone: checkboxes exist and are at least 24 px: ' + out.phone.join(','));
  if (outdir) { await go('#/dossier', 600); await page.screenshot({ path: outdir + '/fixes_dossier_phone.png' }); }

  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
