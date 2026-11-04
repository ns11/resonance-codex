// 3.0.0 — the Book of Iovu and the board: the second lore in the menu and its library, the plain door into the
// Resonance Wings, Alexander's chamber (seats, map, Kudo window, lens, ledger), a cell's counsel with the mock,
// the ledger kept in the private collection, a CRETD-D save file placed on the map, a stage set by hand, the figures
// page and a member's plate, the release stamp, and the phone at 390 px. Usage: node checks/iovu_check.js <out>
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp';
let MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
// the counsel's answer, added to the mock here so the mock file stays as it is for the older checks
MOCK = MOCK.replace("if (/ROUGH DRAFT/.test(input))", "if (/You are the COUNSEL/.test(input)) return { stance: 'conditional', ruling: 'The record points to the bank posting first, if the deadline holds <script>window.__xss=9</script>.', reasons: ['Reason one with $\\\\Gamma$.', 'Reason two.', 'Reason three.'], risks: ['A risk.'], asks: ['Who asked for this?', 'What is the date?'], check: ['CHECK the pay band.'], record: 'She asked about the bank posting; the reading was conditional.' };\n    if (/ROUGH DRAFT/.test(input))");
const SAVE = JSON.stringify({ app: 'CRETD-D', format: 1, version: '1.13.0', exported: '2026-10-31T12:00:00.000Z', state: { pipeline: [
  { id: 'a', company: 'Example Co', role: 'Senior DevOps Engineer', stage: 'Applied' },
  { id: 'b', company: 'Sample Agency', role: 'Șef al Secției TIC', stage: 'Interview' },
  { id: 'c', company: 'Nobody Inc', role: 'Nothing', stage: 'Targeted' },
  null, 'junk' ], desk: { items: {} } } });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/_blob|favicon|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 500); };
  const out = {};
  process.on('unhandledRejection', (e) => { out.FAIL = String((e && e.message) || e); out.errs = errs; console.log(JSON.stringify(out, null, 1)); process.exit(1); });
  await page.goto('http://127.0.0.1:8765/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  // the stamp and the lore menu
  out.stamp = await page.evaluate(() => ({ v: (document.querySelector('#codex-stamp .st-v') || {}).textContent, name: (document.querySelector('#codex-stamp .st-name') || {}).textContent, top: window.CODEX_RELEASES.releases[0].v }));
  out.menu = await page.evaluate(() => Array.from(document.querySelectorAll('#lore-menu .lore-item')).map((a) => a.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)));
  // switch to Iovu
  await go('#/lore/iovu', 900);
  out.iovu = await page.evaluate(() => ({ lore: Codex.lore, accent: document.documentElement.dataset.accent, brand: (document.querySelector('.brand span') || {}).textContent, concepts: Codex.concepts().length, tomes: Codex.tomes().map((t) => t.short), figures: Codex.figures().map((f) => f.id), journalTab: (document.querySelector('.nav a[data-route=home]') || {}).hidden }));
  await go('#/library', 700);
  out.uz = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, wings: Array.from(document.querySelectorAll('.wing .wing-name')).map((w) => w.textContent), door: Array.from(document.querySelectorAll('.wing .wing-rooms')).map((w) => w.textContent).slice(-1)[0] }));
  await page.screenshot({ path: OUT + '/iovu-library.png', fullPage: true });
  await go('#/library/door-to-the-wings', 700);
  out.doorPage = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, btn: (document.querySelector('[data-door-lore]') || {}).textContent }));
  await page.click('[data-door-lore]'); await page.waitForTimeout(1200);
  out.passed = await page.evaluate(() => ({ lore: Codex.lore, hash: location.hash, h1: document.querySelector('#codex-main h1').textContent, crumbs: (document.querySelector('.crumbs') || {}).textContent }));
  // the chamber
  out.chamber = await page.evaluate(() => ({
    holder: (document.querySelector('.bcard.fig .bc-name') || {}).textContent,
    seats: (document.querySelector('.seats h2') || {}).textContent,
    cities: document.querySelectorAll('.city').length, satrapies: Array.from(document.querySelectorAll('.satrapy h3')).map((h) => h.textContent.trim()),
    counts: (document.querySelector('.stage-counts') || {}).textContent,
    kudoGaps: document.querySelectorAll('.gap-list li').length, verify: document.querySelectorAll('.verify-list li').length,
    lens: !!document.querySelector('.counsel-lens'), ledger: (document.querySelector('.counsel-box h2') || {}).textContent, cells: Array.from(document.querySelectorAll('.rooms .room .wing-name')).map((x) => x.textContent),
    roughs: document.querySelectorAll('.rough-card').length, lamps: document.querySelectorAll('.lamps').length, importBtn: !!document.querySelector('[data-counsel-import]'),
  }));
  await page.screenshot({ path: OUT + '/iovu-chamber.png', fullPage: true });
  // bring the save file: two cities placed, one not on the map, junk ignored
  await page.setInputFiles('[data-counsel-import]', { name: 'cretd-d-save-2026-10-31.json', mimeType: 'application/json', buffer: Buffer.from(SAVE) });
  await page.waitForTimeout(800);
  out.imported = await page.evaluate(() => { const m = window.__store.get('private/resonance/counsel/map'); return { matched: m && m.imported.matched, unmatched: m && m.imported.unmatched, stages: m && Object.values(m.cities).map((c) => c.stage).sort(), counts: (document.querySelector('.stage-counts') || {}).textContent.replace(/\s+/g, ' ') }; });
  // a stage set by hand on the first city
  const firstCity = await page.evaluate(() => (document.querySelector('.city') || {}).dataset.city);
  await page.selectOption('.city [data-city-stage]', 'taken'); await page.waitForTimeout(500);
  out.hand = await page.evaluate((id) => ({ stage: window.__store.get('private/resonance/counsel/map').cities[id], chip: (document.querySelector('.city .stage') || {}).textContent }), firstCity);
  // the chamber's own counsel (Alexander, in voice)
  await page.fill('form[data-counsel-form] textarea', 'Apply to the ANTA post by 4 November, or spend the week on the two bank postings instead?');
  await page.click('form[data-counsel-form] button[type=submit]'); await page.waitForTimeout(1500);
  out.counsel = await page.evaluate(() => ({ entries: document.querySelectorAll('.ledger-entry').length, stance: (document.querySelector('.ledger-entry .stance') || {}).textContent, ruling: (document.querySelector('.le-ruling') || {}).textContent, xss: window.__xss || null, stored: (window.__store.get('private/resonance/counsel/alexander') || {}).entries.length, prompt: (window.__prompts || []).slice(-1)[0].input.slice(0, 120), hasKudo: /THE KUDO SIDE/.test((window.__prompts || []).slice(-1)[0].input), hasAraki: /THE ARAKI SIDE/.test((window.__prompts || []).slice(-1)[0].input) }));
  // a member's cell: Gates — the record, no voice
  await go('#/library/cell-gates', 700);
  out.gates = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, member: (document.querySelector('.bcard.fig .bc-name') || {}).textContent, lens: (document.querySelector('.counsel-lens h2') || {}).textContent, lamp: !!document.querySelector('.lamps'), map: !!document.querySelector('.citymap'), intro: (document.querySelector('.counsel-lens .fam-intro') || {}).textContent.slice(0, 80) }));
  await page.fill('form[data-counsel-form] textarea', 'Should I track replies in a sheet or in the Pipeline view?');
  await page.click('form[data-counsel-form] button[type=submit]'); await page.waitForTimeout(1500);
  out.gatesCounsel = await page.evaluate(() => ({ entries: document.querySelectorAll('.ledger-entry').length, voiceRule: /NEVER speak as him/.test((window.__prompts || []).slice(-1)[0].input), noKudo: !/THE KUDO SIDE/.test((window.__prompts || []).slice(-1)[0].input), stored: (window.__store.get('private/resonance/counsel/gates') || {}).entries.length }));
  // strike and remove
  await page.click('[data-counsel-strike]'); await page.waitForTimeout(400);
  out.struck = await page.evaluate(() => ({ struck: !!document.querySelector('.ledger-entry.struck'), stored: window.__store.get('private/resonance/counsel/gates').entries[0].struck }));
  await page.click('[data-counsel-arm]'); await page.waitForTimeout(300); await page.click('[data-counsel-del]'); await page.waitForTimeout(400);
  out.removed = await page.evaluate(() => ({ entries: document.querySelectorAll('.ledger-entry').length, stored: window.__store.get('private/resonance/counsel/gates').entries.length }));
  await page.screenshot({ path: OUT + '/iovu-cell-gates.png', fullPage: true });
  // the ledger survives a reload (the mock keeps its store in the page, so we re-read the chamber's ledger instead)
  await go('#/library/chamber-alexander', 700);
  out.persist = await page.evaluate(() => ({ entries: document.querySelectorAll('.ledger-entry').length, firstStage: (document.querySelector('.city .stage') || {}).textContent }));
  // a vacant cell
  await go('#/library/cell-vacant-6', 600);
  out.vacant = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, vacant: !!document.querySelector('.panel.vacant'), form: !!document.querySelector('form[data-counsel-form]') }));
  // figures page and a plate
  await go('#/figures', 700);
  out.figures = await page.evaluate(() => ({ board: (Array.from(document.querySelectorAll('.panel h2')).find((h) => /board/i.test(h.textContent)) || {}).textContent, names: Array.from(document.querySelectorAll('.panel')).filter((p) => /board of the campaign/i.test(p.textContent)).flatMap((p) => Array.from(p.querySelectorAll('.bc-name')).map((x) => x.textContent)) }));
  await go('#/e/musk', 700);
  out.plate = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, kind: (document.querySelector('.fig-head .kind') || {}).textContent, lens: !!document.querySelector('.counsel-lens'), openCell: (document.querySelector('.counsel-lens .cw-actions a') || {}).getAttribute && document.querySelector('.counsel-lens .cw-actions a').getAttribute('href'), toc: Array.from(document.querySelectorAll('.toc button')).map((b) => b.textContent) }));
  // the Iovu bestiary and a tome
  await go('#/lore/iovu', 900); await go('#/lexicon', 700);
  out.bestiary = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, kws: document.querySelectorAll('#codex-main a.kw, #codex-main .bcard').length, fams: Array.from(document.querySelectorAll('#codex-main h2')).map((h) => h.textContent.replace(/\s+/g, ' ').trim()).slice(0, 10) }));
  await go('#/tomes', 600);
  out.tomes = await page.evaluate(() => Array.from(document.querySelectorAll('.tomecard .tc-short')).map((x) => x.textContent));
  await go('#/tome/fournier', 600);
  out.tome = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, chapters: document.querySelectorAll('#codex-main .chap, #codex-main .sec, #codex-main li').length }));
  await page.screenshot({ path: OUT + '/iovu-tome.png', fullPage: true });
  // a viewer, not the owner: the chamber is sealed, the door still opens
  const vctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await vctx.addInitScript(MOCK.replace('isOwner: async () => true', 'isOwner: async () => false'));
  const vp = await vctx.newPage(); const verrs = []; vp.on('pageerror', (e) => verrs.push(e.message));
  await vp.goto('http://127.0.0.1:8765/#/library/chamber-alexander', { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(1200);
  out.viewer = await vp.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, sealed: !!document.querySelector('.sealed-door'), form: !!document.querySelector('form[data-counsel-form]'), map: !!document.querySelector('.citymap') }));
  out.viewerErrs = verrs;
  await vctx.close();
  // the phone
  const pctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await pctx.addInitScript(MOCK);
  const pp = await pctx.newPage(); const perrs = []; pp.on('pageerror', (e) => perrs.push(e.message));
  const phone = {};
  for (const h of ['#/library/chamber-alexander', '#/library/cell-gates', '#/e/alexander']) {
    await pp.goto('http://127.0.0.1:8765/' + h, { waitUntil: 'domcontentloaded' }); await pp.waitForTimeout(1200);
    phone[h] = await pp.evaluate(() => ({ over: document.documentElement.scrollWidth - document.documentElement.clientWidth, small: Array.from(document.querySelectorAll('#codex-main *')).filter((e) => e.children.length === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 11).length, taps: Array.from(document.querySelectorAll('#codex-main button, #codex-main select, #codex-main a.btn')).filter((e) => e.getBoundingClientRect().height && e.getBoundingClientRect().height < 36).length }));
    await pp.screenshot({ path: OUT + '/iovu-phone-' + h.replace(/[^a-z]+/g, '-') + '.png', fullPage: true });
  }
  out.phone = phone; out.phoneErrs = perrs;
  await pctx.close();
  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
