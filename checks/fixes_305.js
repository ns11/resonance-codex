// 3.0.5: the fixes of PROBA run 4 (UI half and logic half). Every failed expectation goes into `errs`.
// Usage: node checks/fixes_305.js [out folder] [port]   (the port serves the tree under test; default 8765)
const { chromium } = require('playwright');
const fs = require('fs');
const { spawnSync } = require('child_process');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
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
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 700); };
  const text = () => page.evaluate(() => document.getElementById('codex-main').innerText);
  await page.goto(BASE + '#/quests', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);

  // 1. the New quest form keeps its text when the page is rebuilt in the background (PROBA run 4, UI 1 and logic L4)
  await page.fill('#q-new-title', 'My new quest'); await page.fill('#q-new-summary', 'Half written summary'); await page.focus('#q-new-summary');
  const quest = () => page.evaluate(() => [(document.getElementById('q-new-title') || {}).value, (document.getElementById('q-new-summary') || {}).value, document.activeElement && document.activeElement.id]);
  await page.evaluate(() => window.CodexView.refresh());              // the registry path: render(true) mounts the view again
  await page.waitForTimeout(500);
  out.q1 = await quest(); expect(out.q1[0] === 'My new quest' && out.q1[1] === 'Half written summary', 'the quest form keeps its text after a registry refresh (' + JSON.stringify(out.q1) + ')');
  expect(out.q1[2] === 'q-new-summary', 'the quest form keeps its focus after a registry refresh (' + out.q1[2] + ')');
  for (const [col, id] of [['quests', 'zz'], ['lores', 'zz'], ['crafted', 'zz'], ['progress', 'state'], ['private/resonance/items', 'zz']]) {
    await page.evaluate(async ([c, i]) => { const db = await window.claude.use('db'); await db.collection(c).doc(i).set({ t: Date.now(), title: 'x', status: 'notes' }).catch(() => {}); }, [col, id]);
    await page.waitForTimeout(600);
    const q = await quest(); expect(q[0] === 'My new quest' && q[1] === 'Half written summary', 'the quest form keeps its text after a write to ' + col + ' (' + JSON.stringify(q) + ')');
  }
  await go('#/cyclopedia', 500); await go('#/quests', 700);
  out.qLeave = await quest(); expect(!out.qLeave[0] && !out.qLeave[1], 'the quest form is empty again after leaving the page (drafts are forgotten)');
  // the crafting table's extra-instruction box
  await go('#/craft', 900);
  await page.fill('#cw-extra', 'extra words'); await page.evaluate(() => window.CodexView.refresh()); await page.waitForTimeout(500);
  expect(await page.evaluate(() => (document.getElementById('cw-extra') || {}).value) === 'extra words', 'the crafting table keeps its extra-instruction text after a registry refresh');

  // 2. a tome card never cuts a CHECK IN BOOK warning (UI 2)
  await go('#/tomes', 800);
  out.notes = await page.evaluate(() => Array.from(document.querySelectorAll('.tomecard')).map((a) => ({ id: a.getAttribute('href'), note: (a.querySelector('.tc-note') || {}).textContent || '' })));
  const full = await page.evaluate(() => window.CodexView && window.Codex ? Codex.tomes().map((t) => ({ id: '#/tome/' + t.id, note: (t.notes || [])[0] || '' })) : []);
  for (const t of full) {
    const shown = (out.notes.find((n) => n.id === t.id) || {}).note;
    if (/CHECK IN BOOK/.test(t.note)) expect(shown === t.note, 'tome card ' + t.id + ' shows its whole note with the warning (got "' + (shown || '').slice(-50) + '")');
    else if (t.note.length <= 280) expect(shown === t.note, 'tome card ' + t.id + ' shows a short note whole');
    else expect(shown && !/[^.;]…$/.test(shown) || shown.length < 285, 'tome card ' + t.id + ' ends at a sentence or a short word cut');
  }
  expect(out.notes.some((n) => /CHECK IN BOOK/.test(n.note)), 'at least one tome card carries CHECK IN BOOK (the Breuer card)');

  // 3. the margin Bestiary heading, the card and the footer read one tally (logic L3)
  await go('#/cyclopedia', 800);
  out.tally = await page.evaluate(() => {
    const t = window.CodexView.bestiaryTally();
    const head = Array.from(document.querySelectorAll('details.ci-group > summary')).find((s) => /^Bestiary/.test(s.textContent));
    const card = Array.from(document.querySelectorAll('#codex-main a, #codex-main .card')).find((a) => /^Bestiary\d/.test(a.textContent.replace(/\s+/g, '')));
    return { n: t.n, head: head ? Number((head.querySelector('.ci-n') || {}).textContent) : null, card: card ? Number((card.textContent.replace(/\s+/g, '').match(/^Bestiary(\d+)/) || [])[1]) : null, foot: (document.body.innerText.match(/of (\d+) entries/) || [])[1] };
  });
  expect(out.tally.head === out.tally.n && out.tally.card === out.tally.n && Number(out.tally.foot) === out.tally.n, 'margin heading, card and footer all read ' + out.tally.n + ' (' + JSON.stringify(out.tally) + ')');

  // 4. the chamber map: region chips explain themselves, the abroad line is not repeated, deadline colours match the words (UI 4, UI 5, logic L11)
  await go('#/library/chamber-alexander', 1300);
  await page.evaluate(() => document.querySelectorAll('details.satrapy').forEach((d) => { d.open = true; })); await page.waitForTimeout(300);
  out.map = await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('.city .chip.region'));
    const intro = Array.from(document.querySelectorAll('details.satrapy')).pop();
    const due = Array.from(document.querySelectorAll('.city-meta span')).map((s) => ({ t: s.textContent.trim(), c: s.className })).filter((x) => /\d+ d left|today/.test(x.t));
    return { chips: chips.length, untitled: chips.filter((c) => !/Germany|United States|Australia|Romania/.test(c.title)).length, intro: intro ? intro.innerText : '', repeated: Array.from(document.querySelectorAll('.city')).filter((c) => /Abroad: not counted/.test(c.innerText)).length, due };
  });
  expect(out.map.chips > 0 && out.map.untitled === 0, 'every region chip has a title that names its region (' + out.map.untitled + ' of ' + out.map.chips + ' do not)');
  expect(/DE\+: Germany/.test(out.map.intro) && /AU\/UK: Australia/.test(out.map.intro) && /RO\/BG: Romania/.test(out.map.intro), 'the Seats abroad intro prints what the chips mean');
  expect(out.map.repeated === 0, 'no card repeats "Abroad: not counted" (' + out.map.repeated + ' do)');
  for (const x of out.map.due) {
    const n = x.t.includes('today') ? 0 : Number((x.t.match(/(\d+) d left/) || [])[1]);
    const want = n < 2 ? 'due-burn' : n < 7 ? 'due-near' : '';
    expect(x.c.split(' ').includes(want) || (!want && !/due-/.test(x.c)), 'deadline "' + x.t + '" is coloured "' + x.c + '", expected "' + want + '"');
  }
  out.dueN = out.map.due.length;

  // 5. wording: the sealed back desk is "keeper only" for a viewer, and nowhere says "only you" (UI 3)
  const vctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await vctx.addInitScript(MOCK.replace('isOwner: async () => true', 'isOwner: async () => false'));
  const vp = await vctx.newPage();
  await vp.goto(BASE + '#/library/restricted-section', { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(1500); /* 3.0.6: the chamber is no place for a viewer; the restricted section is the sealed back desk */
  out.viewer = await vp.evaluate(() => document.getElementById('codex-main').innerText);
  expect(!/only you/i.test(out.viewer) && /keeper only/i.test(out.viewer), 'viewer: the sealed back desk says "keeper only", not "only you"');
  await vp.evaluate(() => { location.hash = '#/library'; }); await vp.waitForTimeout(800);
  expect(!/only you/i.test(await vp.evaluate(() => document.getElementById('codex-main').innerText)), 'viewer: the library front page does not say "only you"');
  expect(!/Kudo/i.test(await vp.evaluate(() => document.getElementById('codex-main').innerText)), 'viewer: the library front page names no Kudo half (the Wings blurb)');
  await vctx.close();
  await go('#/library/restricted-section', 800);
  expect(!/Altar/.test(await text()), 'the Restricted Section page does not send you to "the Altar"');
  await go('#/library', 800);
  expect(!/on the Altar/.test(await text()), 'the library teaser does not send you to the Altar');

  // 6. drills (logic L1, L6, L8) and the decay-rate wording (L7)
  const drills = await page.evaluate(() => {
    const out = {}; const g = (id) => window.Codex && Codex.get(id);
    const q = (id, i) => { const e = g(id); return e && e.quiz && e.quiz[i]; };
    const strip = (o) => (typeof o === 'string' ? o : String(o));
    out.sec = q('secular-approximation', 2); out.therm = Codex.get('stimulated-spontaneous').quiz.find((x) => /thermal photon number/.test(x.q));
    out.dress = Codex.get('dressed-states').quiz.find((x) => /fractions of excited state/.test(x.q));
    out.trans = Codex.get('decay-rate').quiz.find((x) => /transmon/.test(x.q));
    out.sz = Codex.get('sz-6-3').quiz.map((x) => x.q);
    out.dr = Codex.get('decay-rate'); out.drText = JSON.stringify(out.dr.research || out.dr);
    return { sec: out.sec && { q: out.sec.q, o: out.sec.options.map(strip), a: out.sec.answer }, therm: out.therm && out.therm.options.map(strip), dress: out.dress && out.dress.options.map(strip), trans: out.trans && { q: out.trans.q, o: out.trans.options.map(strip) }, sz: out.sz, drText: JSON.stringify(Codex.get('decay-rate')) };
  });
  expect(drills.sec && /secular step itself/.test(drills.sec.q), '#45 asks what the secular step itself drops (' + (drills.sec && drills.sec.q) + ')');
  if (drills.sec) { const lens = drills.sec.o.map((o) => o.length); expect(lens[drills.sec.a] !== Math.min(...lens) || lens.filter((l) => l === Math.min(...lens)).length > 1, '#45: the key is not the only shortest option (' + lens.join('/') + ')'); }
  expect(drills.therm && drills.therm.some((o) => /0\.6,/.test(o)) && drills.therm.some((o) => /5\\times10\^\{-5\}/.test(o)) && !drills.therm.some((o) => /0\.1,|6\\times10\^\{-6\}/.test(o)), '#51: the distractors carry the right photon numbers (0.6 and 5e-5)');
  expect(drills.dress && !drills.dress.some((o) => /^About/.test(o)), '#26: no option starts with "About"');
  expect(drills.trans && !/\\Gamma_1\/2\\pi|Γ₁\/2π/.test(drills.trans.q), '#23: the stem does not name the division by 2π');
  expect(drills.sz && !drills.sz.some((x) => /one lifetime/.test(x)) && drills.sz.some((x) => /transition frequency doubles/.test(x)), '#58 is the new Γ ∝ ω³ question, not a copy of #55');
  expect(drills.drText && !/depends mainly on/.test(drills.drText) && /not a function of/.test(drills.drText), 'decay-rate: the deviation is no longer said to depend on δ/Ω alone');

  // 7. the release log and the stamp
  await go('#/releases', 700);
  const rel = await text();
  expect(/3\.0\.5/.test(rel) && /38 of them/.test(rel), 'the release log has 3.0.5 and the corrected league count');
  expect(/3\.\d\.\d Iovu/.test(await page.evaluate(() => document.body.innerText)), 'the stamp reads 3.x.y Iovu');

  // 8. the physics check runs without a folder argument
  const pm = spawnSync('node', [__dirname + '/plates_math.js'], { encoding: 'utf8', timeout: 120000 });
  expect(pm.status === 0, 'plates_math.js runs without the folder argument (status ' + pm.status + ' ' + (pm.stderr || '').slice(0, 120) + ')');

  out.viewer = out.viewer.length + ' chars'; out.map = { chips: out.map.chips, dueN: out.map.due.length }; out.notes = out.notes.length + ' cards'; out.errs = errs; console.log(JSON.stringify(out, null, 1).slice(0, 3000)); await browser.close(); process.exit(errs.length ? 1 : 0);
})();
