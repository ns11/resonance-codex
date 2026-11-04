// v7 library end to end (mock runtime): upload a PDF to the Restricted Section, send it, generate the full breakdown,
// the seal and unseal, the Original tab with PDF.js and underlined keywords, a rough in a chamber, the loose stone,
// a new lore drafted from a tome, the lore menu switch, and phone overflow on the new pages.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp';
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const PDF = fs.readFileSync(__dirname + '/fixtures/test_paper.pdf');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(MOCK);
  // the blob route: serve the uploaded PDF as the platform would
  await ctx.route(/\/_blob\/[0-9a-f]{32}$/, (route) => route.fulfill({ status: 200, contentType: 'application/pdf', body: PDF }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 500); };
  const out = {};
  process.on('unhandledRejection', (e) => { out.FAIL = String(e && e.message || e); out.errs = errs; console.log(JSON.stringify(out, null, 1)); process.exit(1); });
  await page.goto('http://127.0.0.1:8765/#/library/restricted-section', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  out.room = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, pick: !!document.querySelector('[data-lib-file]'), role: (document.querySelector('.tag-role') || {}).textContent }));
  // upload
  await page.setInputFiles('[data-lib-file]', { name: 'test_paper.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.waitForTimeout(4000);
  out.afterUpload = await page.evaluate(() => ({ hash: location.hash, h1: (document.querySelector('.doc-window h1') || {}).textContent, pages: (document.querySelector('.doc-value') || {}).textContent, tabs: Array.from(document.querySelectorAll('[data-doc-tab]')).map((b) => b.textContent), badge: (document.querySelector('.doc-head .badge') || {}).textContent,
    priv: [...window.__store.keys()].filter((k) => k.startsWith('private/')), pub: [...window.__store.keys()].filter((k) => k.startsWith('library/')), assets: (window.__assets || []).map((a) => a.type) }));
  const docId = out.afterUpload.hash.split('/').pop();
  // send to Claude
  await page.click('[data-doc-send]'); await page.waitForTimeout(600);
  out.sent = await page.evaluate(() => ({ text: window.__sent, status: (document.querySelector('.doc-head .badge') || {}).textContent }));
  // Claude writes the notes (as the chat would): the private doc gets notes, points, keywords
  await page.evaluate(async (id) => {
    const db = await window.claude.use('db');
    const d = JSON.parse(JSON.stringify(window.__store.get('private/resonance/items/' + id)));
    Object.assign(d, { status: 'notes', authors: 'A. Tester', year: 2026, venue: 'Journal of Tests 1, 1', value: { kind: 'cites', n: 12, src: 'OpenAlex', date: '2026-10-30' }, caption: 'A test paper on two driven emitters.',
      summary: ['The paper drives two emitters with a laser and watches the damped Rabi oscillation. The decay rate sets the damping.', 'The spectrum is a Mollow triplet with collective sidebands.'],
      points: [{ page: 1, eq: '(1)', text: 'The master equation with collective rates.' }, { page: 2, eq: '(2)', text: 'The mixing angle from $\\cot 2\\theta = \\Delta/2\\Omega$.', check: true }],
      keywords: ['rabi-oscillation', 'decay-rate', 'dressed-states', 'mollow-triplet'], keyKeywords: ['rabi-oscillation', 'mollow-triplet'] });
    await db.collection('private/resonance/items').doc(id).set(d);
  }, docId);
  await page.waitForTimeout(500);
  await go('#/library/restricted-section', 400); await go('#/doc/' + docId, 600);
  out.notes = await page.evaluate(() => ({ dropcap: !!document.querySelector('.parchment .dropcap'), points: document.querySelectorAll('.doc-points li').length, chips: document.querySelectorAll('.parchment .chip').length, value: (document.querySelector('.doc-value') || {}).textContent, gen: !!document.querySelector('[data-doc-generate]'), math: document.querySelectorAll('.parchment mjx-container').length }));
  // generate the full breakdown live
  await page.click('[data-doc-generate]'); await page.waitForTimeout(1500);
  out.full = await page.evaluate(() => ({ seal: !!document.querySelector('.seal'), missing: Array.from(document.querySelectorAll('.seal .chip span')).map((s) => s.textContent), unsealBtn: !!document.querySelector('[data-doc-unseal]'), refs: document.querySelectorAll('.parchment .lit').length, newKw: document.querySelectorAll('.parchment .chip-fog, .parchment .chip-known').length, verify: !!document.querySelector('[data-doc-verify]'),
    stub: !!Codex.get('st-spectral-hole'), status: (window.__store.get('private/resonance/items/' + location.hash.split('/').pop()) || {}).fullStatus }));
  await page.screenshot({ path: OUT + '/lib-doc-sealed.png', fullPage: true });
  await page.click('[data-doc-unseal]'); await page.waitForTimeout(500);
  out.unsealed = await page.evaluate(() => ({ steps: document.querySelectorAll('.doc-steps li').length, quiz: document.querySelectorAll('.doc-quiz fieldset').length, seal: !!document.querySelector('.seal') }));
  // quiz on the document
  await page.evaluate(() => { document.querySelectorAll('.doc-quiz fieldset').forEach((fs) => { fs.querySelector('input[value="0"]').checked = true; }); });
  await page.click('.doc-quiz button[type=submit]'); await page.waitForTimeout(400);
  out.quiz = await page.evaluate(() => ({ result: document.querySelector('.doc-quiz .quiz-result').textContent, best: (Codex.Store.entry('doc:' + location.hash.split('/').pop()) || {}).quizBest }));
  // the Original tab: PDF.js from cdnjs, pages drawn, keywords underlined
  await page.click('[data-doc-tab="original"]'); await page.waitForTimeout(6000);
  out.original = await page.evaluate(() => ({ pages: document.querySelectorAll('.pdf-page').length, canvases: document.querySelectorAll('.pdf-page canvas').length, spans: document.querySelectorAll('.pdf-text span').length, kws: Array.from(document.querySelectorAll('.pdf-text a.kw')).map((a) => a.textContent.trim()), note: (document.querySelector('.pdf-note') || {}).textContent }));
  await page.screenshot({ path: OUT + '/lib-original.png', fullPage: true });
  // hover a keyword in the text layer opens a card
  const kw = await page.$('.pdf-text a.kw');
  if (kw) { await kw.hover(); await page.waitForTimeout(500); out.tip = await page.evaluate(() => (document.querySelector('.kw-tip .tip-name') || {}).textContent); }
  // a page chip jumps to the original
  await page.click('[data-doc-tab="breakdown"]'); await page.waitForTimeout(300);
  await page.click('[data-doc-page="2"]'); await page.waitForTimeout(1500);
  out.jump = await page.evaluate(() => ({ tab: document.querySelector('[data-doc-tab].on').textContent, y: window.scrollY > 100 }));
  // roughs: the hall of the known hidden and a monk's chamber
  await go('#/library/araki-hall', 600);
  out.hall = await page.evaluate(() => ({ chambers: document.querySelectorAll('.cloister .room').length, roughs: document.querySelectorAll('.rough-card').length, stone: !!document.querySelector('[data-loose-stone]'), idxKudo: !!document.querySelector('#codex-index a[href="#/library/kudo-hall"]') }));
  await go('#/library/chamber-coudreau', 600);
  out.chamber = await page.evaluate(() => ({ monk: (document.querySelector('.bcard.fig .bc-name') || {}).textContent, wings: Array.from(document.querySelectorAll('.shelf-row h3')).map((h) => h.textContent.trim()), roughs: document.querySelectorAll('.rough-card').length, other: !!document.querySelector('.other-wings') }));
  const btn = await page.$('[data-rough-out]');
  if (btn) { await btn.click(); await page.waitForTimeout(1500); }
  out.rough = await page.evaluate(() => ({ hash: location.hash, h1: (document.querySelector('.doc-window h1') || {}).textContent, badge: (document.querySelector('.doc-head .badge') || {}).textContent, xss: window.__xss || null, caption: (document.querySelector('.doc-caption') || {}).textContent, again: !!document.querySelector('[data-rough-again]'), send: !!document.querySelector('[data-doc-rough-send]'), stored: [...window.__store.keys()].filter((k) => k.includes('rough-')).length }));
  await page.screenshot({ path: OUT + '/lib-rough.png', fullPage: true });
  // the loose stone finds the Kudo hall
  await go('#/library/araki-hall', 500);
  await page.click('[data-loose-stone]'); await page.waitForTimeout(700);
  out.found = await page.evaluate(() => ({ hash: location.hash, h1: document.querySelector('#codex-main h1').textContent, idxKudo: !!document.querySelector('#codex-index a[href="#/library/kudo-hall"]'), progress: Codex.Store.entry('place:kudo-hall') }));
  // a viewer (not the owner): hidden places sealed, secret ones absent, original tab absent, private docs unread
  const vctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await vctx.addInitScript(MOCK.replace("isOwner: async () => true", "isOwner: async () => false").replace("const caps = { db, sample, comments, user, assets };", "const caps = { db, sample, comments, user };"));
  const vp = await vctx.newPage();
  const verrs = []; vp.on('pageerror', (e) => verrs.push(e.message));
  await vp.goto('http://127.0.0.1:8765/#/library', { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(1200);
  out.viewer = await vp.evaluate(() => ({ wings: Array.from(document.querySelectorAll('.wing')).map((w) => w.querySelector('.wing-name').textContent + (w.classList.contains('sealed') ? ' (sealed)' : '')), idx: Array.from(document.querySelectorAll('#codex-index .ci-place .ci-name')).map((n) => n.textContent.trim()).slice(0, 20) }));
  await vp.evaluate(() => { location.hash = '#/library/kudo-hall'; }); await vp.waitForTimeout(500);
  out.viewerSecret = await vp.evaluate(() => document.querySelector('#codex-main h1').textContent);
  await vp.evaluate(() => { location.hash = '#/library/restricted-section'; }); await vp.waitForTimeout(500);
  out.viewerHidden = await vp.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, sealed: !!document.querySelector('.sealed-door') }));
  out.viewerErrs = verrs;
  await vctx.close();
  // new lore: drafted from a tome
  await go('#/lore/new', 600);
  await page.fill('#ln-name', 'Systems Codex'); await page.fill('#ln-subject', 'operating systems'); await page.fill('#ln-prompt', 'Interview drills.');
  await page.check('input[name="accent"][value="lapis"]');
  await page.setInputFiles('#ln-files', { name: 'ostep.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.click('form[data-lore-form] button[type=submit]'); await page.waitForTimeout(5000);
  out.lore = await page.evaluate(() => ({ hash: location.hash, lore: Codex.lore, accent: document.documentElement.dataset.accent, h1: (document.querySelector('#codex-main h1') || {}).textContent, brand: document.querySelector('.brand span').textContent, tomes: Codex.tomes().map((t) => t.short), kws: Codex.all().filter((e) => e.kind === 'concept').length, figs: Codex.figures().map((f) => f.name), lib: (Codex.pack().library || {}).name, draft: !!document.querySelector('.lore-draft'),
    stored: [...window.__store.keys()].filter((k) => k.startsWith('lores/') || k.startsWith('private/systems')), prompts: (window.__prompts || []).length, menu: document.getElementById('lore-menu').innerText.replace(/\n/g, ' | ') }));
  await page.screenshot({ path: OUT + '/lore-new.png', fullPage: true });
  await go('#/library', 500);
  out.loreLib = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, wings: Array.from(document.querySelectorAll('.wing .wing-name')).map((w) => w.textContent) }));
  await go('#/e/ritchie', 500);
  out.loreFig = await page.evaluate(() => ({ h1: document.querySelector('#codex-main h1').textContent, kind: (document.querySelector('.entry-head .kind') || {}).textContent }));
  // switch back through the menu
  await page.click('[data-lore-toggle]'); await page.waitForTimeout(200);
  out.menuOpen = await page.evaluate(() => Array.from(document.querySelectorAll('.lore-item .lore-name')).map((n) => n.textContent.trim()));
  await page.click('[data-lore-pick="resonance"]'); await page.waitForTimeout(700);
  out.back = await page.evaluate(() => ({ lore: Codex.lore, accent: document.documentElement.dataset.accent, h1: (document.querySelector('#codex-main h1') || {}).textContent, kws: Codex.all().filter((e) => e.kind === 'concept').length }));
  out.errs = errs;
  await ctx.close();
  // phone
  const p2ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p2ctx.addInitScript(MOCK);
  const p2 = await p2ctx.newPage();
  const perrs = []; p2.on('pageerror', (e) => perrs.push(e.message));
  const phone = {};
  for (const r of ['#/cyclopedia', '#/figures', '#/library', '#/library/canc-lineas-wing', '#/library/araki-hall', '#/library/chamber-coudreau', '#/e/kudriasov', '#/e/qrate', '#/lores', '#/lore/new']) {
    await p2.goto('http://127.0.0.1:8765/' + r, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(1200);
    phone[r] = await p2.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, wide: Array.from(document.querySelectorAll('#codex-main *')).filter((n) => n.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !n.closest('.mdisp, .pl-tablewrap')).slice(0, 3).map((n) => n.tagName + '.' + n.className) }));
  }
  await p2.goto('http://127.0.0.1:8765/#/library', { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(1200);
  await p2.screenshot({ path: OUT + '/lib-phone.png', fullPage: true });
  out.phone = phone; out.phoneErrs = perrs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
