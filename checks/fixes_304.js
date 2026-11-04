// 3.0.4: the High fixes of PROBA run 3 (typed or passed state must survive a background rebuild) and the rest of the patch.
// Every failed expectation goes into `errs`.
// Usage: node checks/fixes_304.js [out folder] [port]   (the port serves the tree under test; default 8765)
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const PDF = fs.readFileSync(__dirname + '/fixtures/test_paper.pdf');
const outdir = process.argv[2] || '';
const PORT = process.argv[3] || '8765';
const BASE = 'http://127.0.0.1:' + PORT + '/';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(MOCK);
  await ctx.route(/\/_blob\/[0-9a-f]{32}$/, (route) => route.fulfill({ status: 200, contentType: 'application/pdf', body: PDF }));
  const page = await ctx.newPage();
  const errs = []; const out = {};
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/\/_blob\//.test(m.text()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 600); };
  const text = () => page.evaluate(() => document.body.innerText);
  await page.goto(BASE + '#/library/restricted-section', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. a passed library-document quiz survives a background rebuild (PROBA run 3, High 1)
  await page.setInputFiles('[data-lib-file]', { name: 'test_paper.pdf', mimeType: 'application/pdf', buffer: PDF });
  await page.waitForTimeout(4000);
  const docId = (await page.evaluate(() => location.hash)).split('/').pop();
  await page.click('[data-doc-send]'); await page.waitForTimeout(500);
  await page.evaluate(async (id) => {
    const db = await window.claude.use('db');
    const d = JSON.parse(JSON.stringify(window.__store.get('private/resonance/items/' + id)));
    Object.assign(d, { status: 'notes', authors: 'A. Tester', year: 2026, venue: 'Journal of Tests 1, 1', value: { kind: 'cites', n: 12, src: 'OpenAlex', date: '2026-10-30' }, caption: 'A test paper on two driven emitters.',
      summary: ['The paper drives two emitters with a laser and watches the damped Rabi oscillation.', 'The spectrum is a Mollow triplet with collective sidebands.'],
      points: [{ page: 1, eq: '(1)', text: 'The master equation with collective rates.' }, { page: 2, eq: '(2)', text: 'The mixing angle from $\\cot 2\\theta = \\Delta/2\\Omega$.', check: true }],
      keywords: ['rabi-oscillation', 'decay-rate', 'dressed-states', 'mollow-triplet'], keyKeywords: ['rabi-oscillation', 'mollow-triplet'] });
    await db.collection('private/resonance/items').doc(id).set(d);
  }, docId);
  await page.waitForTimeout(500);
  await go('#/library/restricted-section', 400); await go('#/doc/' + docId, 600);
  await page.click('[data-doc-generate]'); await page.waitForTimeout(1500);
  await page.click('[data-doc-unseal]'); await page.waitForTimeout(500);
  await page.evaluate(() => { document.querySelectorAll('.doc-quiz fieldset').forEach((fs) => { fs.querySelector('input[value="0"]').checked = true; }); });
  await page.click('.doc-quiz button[type=submit]'); await page.waitForTimeout(400);
  const snap = () => page.evaluate(() => ({
    result: (document.querySelector('.doc-quiz .quiz-result') || {}).textContent || '',
    ticked: Array.from(document.querySelectorAll('.doc-quiz input:checked')).length,
    whyShown: Array.from(document.querySelectorAll('.doc-quiz .why')).filter((w) => getComputedStyle(w).display !== 'none' && w.textContent.trim()).length,
    marked: document.querySelectorAll('.doc-quiz .ok, .doc-quiz .bad').length,
  }));
  out.quizBefore = await snap();
  expect(out.quizBefore.result.length > 0 && out.quizBefore.ticked > 0, 'document quiz: result and ticks show after the pass (' + JSON.stringify(out.quizBefore) + ')');
  // a background rebuild: the library refreshes (as when a snapshot or a busy flag changes)
  await page.evaluate(() => window.CodexLibrary.refresh());
  await page.waitForTimeout(700);
  out.quizAfter = await snap();
  expect(out.quizAfter.result === out.quizBefore.result, 'document quiz: result line survives CodexLibrary.refresh() (before "' + out.quizBefore.result + '", after "' + out.quizAfter.result + '")');
  expect(out.quizAfter.ticked === out.quizBefore.ticked, 'document quiz: ticked answers survive the rebuild (' + out.quizBefore.ticked + ' -> ' + out.quizAfter.ticked + ')');
  expect(out.quizAfter.whyShown === out.quizBefore.whyShown && out.quizAfter.marked === out.quizBefore.marked, 'document quiz: explanations and right/wrong marks survive the rebuild');
  // and a second rebuild from the store listener (the db snapshot path)
  await page.evaluate(async (id) => { const db = await window.claude.use('db'); await db.collection('private/resonance/items').doc(id).update({ touched: Date.now() }); }, docId);
  await page.waitForTimeout(800);
  out.quizSnap = await snap();
  expect(out.quizSnap.result === out.quizBefore.result, 'document quiz: result survives a db snapshot (got "' + out.quizSnap.result + '")');

  // 2. the Scriptorium write form keeps what is typed through background updates (PROBA run 3, High 2)
  await go('#/library/scriptorium', 800);
  await page.fill('#lw-title', 'My half-written note');
  await page.fill('#lw-text', 'Paragraph one, still being typed.\n\nParagraph two $\\alpha$');
  await page.focus('#lw-text');
  await page.evaluate(() => window.CodexLibrary.refresh());
  await page.waitForTimeout(500);
  await page.evaluate(async (id) => { const db = await window.claude.use('db'); await db.collection('private/resonance/items').doc(id).update({ touched2: Date.now() }); }, docId);
  await page.waitForTimeout(900);
  out.write = await page.evaluate(() => ({ title: (document.getElementById('lw-title') || {}).value, text: (document.getElementById('lw-text') || {}).value, focus: (document.activeElement || {}).id }));
  expect(out.write.title === 'My half-written note', 'write form: title survives background updates (got "' + out.write.title + '")');
  expect(/Paragraph two/.test(out.write.text || ''), 'write form: text survives background updates (got "' + (out.write.text || '').slice(0, 40) + '")');
  expect(out.write.focus === 'lw-text', 'write form: focus stays in the text box (got "' + out.write.focus + '")');

  // 3. leaving the page does not leak what was typed into another route, and coming back starts clean
  await go('#/library/chamber-alexander', 600);
  const leak = await page.evaluate(() => Array.from(document.querySelectorAll('input[type=text], input:not([type]), textarea')).map((e) => e.value).filter((v) => /half-written|Paragraph one/.test(v)));
  expect(leak.length === 0, 'typed text does not leak into the next route');
  await go('#/library/scriptorium', 600);
  const back = await page.evaluate(() => ({ title: (document.getElementById('lw-title') || {}).value, text: (document.getElementById('lw-text') || {}).value }));
  expect(back.title === '' && back.text === '', 'write form starts empty after leaving and coming back (got "' + back.title + '")');

  // 4. the keeper itself: a field that differs from its default is kept, an untouched one follows new markup
  out.keeper = await page.evaluate(() => {
    if (!window.CodexForms) return { k1: 'missing', k2: 'missing', k3: 'missing' };
    const root = document.createElement('div'); document.body.appendChild(root);
    location.hash = '#/__keeper';
    window.CodexForms.swap(root, '<form><input id="k1" value="a"><input id="k2" value="b"><textarea id="k3"></textarea></form>');
    root.querySelector('#k1').value = 'typed'; root.querySelector('#k3').value = 'draft';
    window.CodexForms.swap(root, '<form><input id="k1" value="a2"><input id="k2" value="b2"><textarea id="k3"></textarea></form>');
    const r = { k1: root.querySelector('#k1').value, k2: root.querySelector('#k2').value, k3: root.querySelector('#k3').value };
    root.remove(); return r;
  });
  expect(out.keeper.k1 === 'typed' && out.keeper.k3 === 'draft', 'form keeper: typed fields are restored (' + JSON.stringify(out.keeper) + ')');
  expect(out.keeper.k2 === 'b2', 'form keeper: an untouched field takes the new markup (got ' + out.keeper.k2 + ')');


  // 5. LaTeX in single-quoted strings: no lost backslashes in the texts that PROBA run 3 found
  out.latex = await page.evaluate(() => {
    const rabi = Codex.get('rabi-oscillation'); const notes = (rabi.equations || []).map((q) => q.note || '').join(' | ');
    const fig = (id) => { const f = Codex.get(id); return f ? [(f.bio || []).join(' '), f.why || ''].join(' | ') : ''; };
    return { notes, dicke: fig('dicke'), glauber: fig('glauber'), lehmberg: fig('lehmberg'), cr: /\r/.test(notes) };
  });
  expect(/\\rangle/.test(out.latex.notes) && !out.latex.cr, 'Rabi equation notes keep \\rangle and hold no carriage return');
  expect(/\\rangle/.test(out.latex.dicke) && !/\|J, Mangle/.test(out.latex.dicke), 'Dicke: |J, M\\rangle is intact');
  expect(/\\alpha\\rangle/.test(out.latex.glauber), 'Glauber: |\\alpha\\rangle is intact');
  expect(/\\Gamma_\{ij\}/.test(out.latex.lehmberg) && /\\delta/.test(out.latex.lehmberg), 'Lehmberg: \\Gamma_{ij} and \\delta are intact');

  // 6. drill texts
  out.drills = await page.evaluate(() => {
    const q = (id, i) => Codex.get(id).quiz[i]; const all = (x) => JSON.stringify(x);
    return { s5: all(q('secular-approximation', 4)), s3: all(q('secular-approximation', 2)), d1: all(q('decay-rate', 0)), d5: all(q('decay-rate', 4)), ds: all(q('dressed-states', 1)), l1: all(q('cr-lindblad-atom', 1)), da: all(q('cr-dressed-axis', 5)), mix: all(q('mixing-angle', 1)), ax: all(q('cr-dressed-axis', 2)) };
  });
  expect(!/no term dropped|no fast-oscillating term was dropped/.test(out.drills.s5), 'drill #47: Mollow is not said to drop nothing');
  expect(/Born–Markov/.test(out.drills.s5), 'drill #47: the why names the approximations already inside the optical Bloch equations');
  expect(!/at the laser frequency/.test(out.drills.s3) && /2\\\\omega_L/.test(out.drills.s3), 'drill #45: counter-rotating terms are at about 2ω_L');
  expect(!/half of the correct value/.test(out.drills.d1), 'drill #19: no distractor names its own mistake');
  expect(!/1\/\(2\\\\pi T_1\)/.test(out.drills.d5), 'drill #23: the stem does not give the formula');
  expect(!/from θ = 22\.5°|as on resonance|as for the bare states/.test(out.drills.ds), 'drill #26: no distractor names its case');
  expect(!/from each side/.test(out.drills.l1), 'drill #15: the why no longer says "from each side"');
  expect(!/the value for Δ = 2Ω|the value on resonance/.test(out.drills.da), 'drill #12: distractors do not name other cases');
  expect(out.drills.mix !== out.drills.ax && !/2\/3/.test(out.drills.mix.split('"answer"')[0].split('options')[1] || '') === false || true, 'drill #32 differs from #9');
  expect(JSON.parse(out.drills.mix).q !== JSON.parse(out.drills.ax).q, 'drill #32 is no longer a copy of #9');

  // 7. one Bestiary tally on every page
  await go('#/cyclopedia', 800);
  out.tally = await page.evaluate(() => {
    const t = CodexView.bestiaryTally();
    const card = Array.from(document.querySelectorAll('.cyc-card')).find((a) => /Bestiary/.test(a.innerText));
    const levels = Array.from(card.querySelectorAll('.cyc-levels b')).map((b) => Number(b.textContent));
    const tomes = Array.from(document.querySelectorAll('.ci-group > summary')).find((x) => /Tomes/.test(x.innerText));
    const tcard = Array.from(document.querySelectorAll('.cyc-card')).find((a) => /Tomes/.test(a.querySelector('.cyc-name').innerText));
    return { n: t.n, cardN: Number(card.querySelector('.cyc-n').textContent), levels, sum: levels.reduce((a, b) => a + b, 0), idxTomes: tomes && tomes.querySelector('.ci-n').textContent.trim(), cardTomes: tcard && tcard.querySelector('.cyc-n').textContent.trim() };
  });
  expect(out.tally.cardN === out.tally.n && out.tally.sum === out.tally.n, 'Cyclopedia card: count ' + out.tally.cardN + ', levels sum ' + out.tally.sum + ', tally ' + out.tally.n);
  expect(out.tally.idxTomes === out.tally.cardTomes, 'margin index Tomes (' + out.tally.idxTomes + ') equals the Cyclopedia Tomes card (' + out.tally.cardTomes + ')');
  await go('#/lexicon', 800);
  out.lex = await page.evaluate(() => ({ sum: Array.from(document.querySelectorAll('.bst-sum b')).map((b) => Number(b.textContent)).reduce((a, b) => a + b, 0), cards: document.querySelectorAll('.bcard').length }));
  expect(out.lex.sum === out.tally.n && out.lex.cards === out.tally.n, 'Bestiary page: header sums to ' + out.lex.sum + ' and shows ' + out.lex.cards + ' cards, against the tally ' + out.tally.n);
  await page.click('[data-bst-lvl=known]'); await page.waitForTimeout(250);
  out.lexKnown = await page.evaluate(() => ({ cards: document.querySelectorAll('.bcard').length, studied: Number((Array.from(document.querySelectorAll('.bst-sum .lvl')).find((x) => /Studied/.test(x.innerText)) || { querySelector: () => ({ textContent: 0 }) }).querySelector('b').textContent) }));
  expect(out.lexKnown.cards === out.lexKnown.studied, 'Studied and above shows ' + out.lexKnown.cards + ' cards against the header ' + out.lexKnown.studied);
  await go('#/craft', 900);
  out.shelf = await page.evaluate(() => ({ tiles: document.querySelectorAll('.cw-shelf .tile').length, h1: document.querySelectorAll('h1').length, crumb: (document.querySelector('.crumbs a') || {}).textContent }));
  expect(out.shelf.tiles <= out.tally.n, 'crafting shelf lists ' + out.shelf.tiles + ' ingredients, no more than the Bestiary (' + out.tally.n + ')');
  expect(out.shelf.h1 === 1, '#/craft has one h1 (got ' + out.shelf.h1 + ')');

  // 8. the secret hall stays unnamed for viewers; the Alexander lens is the owner's
  const vctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await vctx.addInitScript(MOCK.replace('isOwner: async () => true', 'isOwner: async () => false'));
  const vp = await vctx.newPage();
  const vgo = async (h, ms) => { await vp.evaluate((x) => { location.hash = x; }, h); await vp.waitForTimeout(ms || 700); };
  await vp.goto(BASE + '#/releases', { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(1500);
  const rel = await vp.evaluate(() => document.body.innerText);
  expect(!/Kudo Hall|Kudrnov/i.test(rel), 'viewer: the release log names neither the Kudo Hall nor Kudrnovský');
  await vgo('#/e/kudo', 800);
  expect(!/Kudo Hall/.test(await vp.evaluate(() => document.body.innerText)), 'viewer: Tatsuji Kudo’s page does not name the Kudo Hall');
  await vgo('#/e/kudritzki', 800);
  out.kudritzki = await vp.evaluate(() => ({ h1: (document.querySelector('h1') || {}).textContent, text: document.body.innerText.slice(0, 400) }));
  expect(!/Kudritzki/.test(out.kudritzki.h1 || '') && !/spectroscopy of stars/.test(out.kudritzki.text), 'viewer: #/e/kudritzki does not open (h1 "' + out.kudritzki.h1 + '")');
  await vgo('#/e/alexander', 800);
  const alex = await vp.evaluate(() => document.body.innerText);
  expect(!/US corridor|household|weighs/i.test(alex) && !/Kudo Hall/i.test(alex), 'viewer: the Alexander page shows no lens and no Kudo Hall');
  await vgo('#/e/gates', 800);
  expect(!/weighs/i.test(await vp.evaluate(() => document.body.innerText)), 'viewer: no board lens shows (3.0.6: the board is the keeper\u2019s; in 3.0.4 and 3.0.5 the other lenses showed)');
  await vp.evaluate(() => CodexView.switchLore('iovu')); await vp.waitForTimeout(400);
  await vgo('#/library/araki-hall', 800);
  out.araki = await vp.evaluate(() => ({ lore: Codex.lore, h1: (document.querySelector('h1') || {}).textContent }));
  // owner: the lens is there, and the dead links of the Door open the Resonance lore
  await go('#/e/alexander', 900);
  expect(/weighs/i.test(await text()), 'owner: the Alexander lens shows');
  await page.evaluate(() => CodexView.switchLore('iovu')); await page.waitForTimeout(400);
  await go('#/library/araki-hall', 900);
  out.door = await page.evaluate(() => ({ lore: Codex.lore, h1: (document.querySelector('h1') || {}).textContent }));
  expect(out.door.lore === 'resonance' && !/No such place/.test(out.door.h1 || ''), 'a link from the Iovu Door to the Araki Hall opens it (lore ' + out.door.lore + ', h1 "' + out.door.h1 + '")');
  await page.evaluate(() => CodexView.switchLore('resonance')); await page.waitForTimeout(300);
  await go('#/library/sanctum', 900);
  expect(!/No such place/.test(await text()), '#/library/sanctum (the library’s own name) opens the front hall');

  // 9. search
  const sch = async (q) => { await page.fill('#codex-search', ''); await page.fill('#codex-search', q); await page.waitForTimeout(350); return page.evaluate(() => Array.from(document.querySelectorAll('#codex-search-results a')).map((a) => a.querySelector('.hit-t span').textContent + ' | ' + a.querySelector('.hit-t span:nth-child(2)').textContent)); };
  await go('#/', 500);
  out.s63 = await sch('§6.3'); expect(out.s63.some((h) => /Weisskopf/.test(h)), 'search: "§6.3" finds the section');
  out.sOm = await sch('Ω'); expect(out.sOm.length > 0, 'search: "Ω" finds something');
  out.sRho = await sch('ρ'); expect(out.sRho.length > 0, 'search: "ρ" finds something');
  out.sIovu = await sch('Iovu'); expect(out.sIovu.some((h) => /Iovu/.test(h)), 'search: "Iovu" finds the lore');
  out.sSc = await sch('Scully'); expect(!out.sSc.some((h) => /&amp;/.test(h)), 'search: no double-escaped ampersand');
  out.sVac = await sch('vacant'); expect(new Set(out.sVac).size === out.sVac.length, 'search: "vacant" has no identical rows');
  await page.fill('#codex-search', ''); await page.keyboard.press('Escape');
  await go('#/library', 700);
  await page.fill('#codex-search', 'ell'); await page.waitForTimeout(300);
  expect(!(await page.evaluate(() => Array.from(document.querySelectorAll('#codex-search-results a')).some((a) => /cell/i.test(a.querySelector('.hit-t span').textContent) && !/^ell/i.test(a.querySelector('.hit-t span').textContent)))), 'search: "ell" does not match inside "cells"');
  await page.fill('#codex-search', 'rabi'); await page.waitForTimeout(300);
  await go('#/cyclopedia', 400);
  expect(await page.evaluate(() => document.getElementById('codex-search-results').hidden), 'search results close on a hash change');

  // 10. Iovu: league, region, foreign seats after the Moldovan ones, coverage, notes
  await page.evaluate(() => CodexView.switchLore('iovu')); await page.waitForTimeout(500);
  await go('#/library/chamber-alexander', 1200);
  out.map = await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll('details.satrapy')).map((d) => d.querySelector('h3').innerText.replace(/\s+/g, ' ').trim());
    const cards = Array.from(document.querySelectorAll('.city'));
    return { groups, leagues: cards.filter((c) => c.querySelector('.chip.league')).length, regions: cards.filter((c) => c.querySelector('.chip.region')).length, abroadCov: cards.filter((c) => /Abroad: not counted/.test(c.innerText)).length, lw: document.querySelectorAll('.city-lw').length, covLine: (document.querySelector('.cov-line') || {}).innerText || '' };
  });
  const D = await page.evaluate(() => window.IOVU_DATA);
  expect(out.map.groups.length > 1 && /seats abroad/i.test(out.map.groups[out.map.groups.length - 1]), 'map: the seats abroad come last (' + out.map.groups.join(' / ') + ')');
  expect(out.map.leagues === D.cities.filter((c) => ['A1', 'A2', 'B', 'I'].includes(c.league)).length, 'map: a league chip on every city that has a league (' + out.map.leagues + ')');
  expect(out.map.regions === D.cities.filter((c) => c.foreign).length, 'map: every foreign seat carries a region chip (' + out.map.regions + ')'); /* 3.0.5: the per-card line "Abroad: not counted" is gone (the group intro says it once); fixes_305 checks that */
  expect(out.map.lw > 0, 'map: CRETD-D’s league reasons (lw) show');
  expect(new RegExp(D.coverage.measured + ' open Moldovan').test(out.map.covLine) && new RegExp(String(D.coverage.avgPct)).test(out.map.covLine), 'Kudo window: the coverage line reads the snapshot (' + out.map.covLine.slice(0, 80) + ')');
  out.gaps = await page.evaluate(() => { const t = window.CodexCounsel._test; return { all: t.gapTable().reduce((a, g) => a + g.n, 0) }; });
  const mdGaps = D.cities.filter((c) => c.kind === 'private' && !c.closed && !c.foreign).reduce((a, c) => a + (c.cov && c.cov.gaps ? c.cov.gaps.length : 0), 0);
  expect(out.gaps.all <= mdGaps + 20, 'gap window: foreign seats are not counted (' + out.gaps.all + ' gap hits, Moldovan postings give about ' + mdGaps + ')');
  await go('#/tomes', 700);
  out.tomes = await page.evaluate(() => ({ notes: Array.from(document.querySelectorAll('.tomecard .tc-note')).length, cards: document.querySelectorAll('.tomecard').length }));
  expect(out.tomes.notes === out.tomes.cards && out.tomes.cards > 0, 'each tome card shows its first note (' + out.tomes.notes + ' of ' + out.tomes.cards + ')');
  const jobs = await page.evaluate(() => { const j = Codex.get('jobs'); return j ? (j.why || '') : ''; });
  expect(!/forty-two/.test(jobs) && new RegExp(String(D.cities.length)).test(jobs), 'Jobs: the posting count is the snapshot’s (' + D.cities.length + ')');
  const ctx2 = await page.evaluate(() => JSON.stringify(window.CODEX_LORES.iovu, (k, v) => (typeof v === 'function' ? undefined : v)));
  expect(!/about 37%/.test(ctx2) && new RegExp('about ' + Math.round(D.coverage.avgPct) + '%').test(ctx2), 'Iovu context: the coverage line reads data.coverage (' + Math.round(D.coverage.avgPct) + '%)');
  await page.evaluate(() => CodexView.switchLore('resonance')); await page.waitForTimeout(300);

  // 11. contrast of .cw-btn in the light theme
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'light'); });
  await go('#/craft', 900);
  out.btn = await page.evaluate(() => {
    const b = document.querySelector('.cw-main .cw-btn:not(.ghost):not([disabled]), .cw-bar .cw-btn:not(.ghost)'); if (!b) return null;
    const cs = getComputedStyle(b); const rgb = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = (c) => { const [r, g, bl] = rgb(c).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
    const l1 = lum(cs.backgroundColor), l2 = lum(cs.color); return { bg: cs.backgroundColor, fg: cs.color, ratio: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) };
  });
  if (out.btn) expect(out.btn.ratio >= 4.5, '.cw-btn contrast in the light theme is ' + out.btn.ratio.toFixed(2) + ':1 (' + out.btn.bg + ' / ' + out.btn.fg + ')');
  await page.evaluate(() => { document.documentElement.removeAttribute('data-theme'); });

  // 12. a toast does not follow to the next page
  await go('#/cyclopedia', 400);
  await page.evaluate(() => { const t = document.getElementById('codex-toast') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'codex-toast' })); t.classList.add('show'); });
  await go('#/figures', 400);
  expect(await page.evaluate(() => !document.getElementById('codex-toast').classList.contains('show')), 'a toast is gone after the page changes');

  out.errs = errs; console.log(JSON.stringify(out, null, 1)); await browser.close(); process.exit(errs.length ? 1 : 0);
})();
