// 3.1.0 — the members engine in the page: the standings and the series in Alexander's chamber, a counsel answer with
// vetoes and an inner note, "I went with this" and "Set aside", Alexander's questions falling as he is followed,
// a hidden pull (Gates), a shown pull (Jobs), Musk's window from the data and an invented date dropped, "What moves him"
// on a plate, a viewer, the phone at 390 px and dark mode. Usage: node checks/engine_check.js <out>
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp';
let MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
// the counsel's answers, added here so the mock file stays as it is for the older checks
function counselAnswer(input) {
  const win = (input.match(/THE WINDOWS \([^)]*\): (\d{4}-\d{2}-\d{2})/) || [])[1] || '2026-12-01';
  const who = (input.match(/NAME: ([^\n(]+)/) || [])[1] || '';
  const inner = { proposals: [{ agent: 'task', line: 'Send it today.', eyes: 'professional' }, { agent: 'wish', line: 'First look past the hall <svg onload="window.__xss=7">.', eyes: 'tyrant' }], moved: ['task', 'wish'], adopted: ['musk'], dilemma: 'He chose the task and let the wish colour the date.' };
  const base = { stance: 'for', ruling: 'Send the ANTA application today <script>window.__xss=8</script>.', reasons: ['One.', 'Two.', 'Three.'], risks: ['A risk.'], asks: ['First question?', 'Second question?', 'Third question?'], check: ['CHECK the hour.'], record: 'She asked; the reading was for.', inner };
  if (/Alexander/.test(who)) return Object.assign({}, base, { pull: { text: 'The far region still holds no city.', shown: true }, inner: Object.assign({}, inner, { vetoed: ['The cautious line: wait a week.', 'The rash line: apply to all ten.'] }) });
  if (/Gates/.test(who)) return Object.assign({}, base, { pull: { text: 'The record shows the pull to measure the gaps first.', shown: false } });
  if (/Jobs/.test(who)) return Object.assign({}, base, { pull: { text: 'The record shows the pull toward what nobody asked for.', shown: true } });
  if (/Epstein/.test(who)) return Object.assign({}, base, { reasons: ['The employer is trustworthy and reliable.', 'The offer is an asset to her and a debt in the employer’s budget.'], risks: ['The record recommends an introduction by the recruiter.', 'The relocation advance is a debt taken in advance.'], pull: { text: 'The pull toward a larger counterparty moved the ruling.', shown: false } });
  if (/Musk/.test(who)) return Object.assign({}, base, { window: { date: window.__invent ? '2026-11-11' : win, text: 'The window closes then, for everyone.' }, pull: { text: 'A hidden wish.', shown: false } });
  return base;
}
MOCK = MOCK.replace("if (/ROUGH DRAFT/.test(input))", 'if (/You are the COUNSEL/.test(input)) return (' + counselAnswer.toString() + ')(input);\n    if (/ROUGH DRAFT/.test(input))');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/_blob|favicon|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 600); };
  const ask = async (text) => { await page.fill('form[data-counsel-form] textarea', text); await page.click('form[data-counsel-form] button[type=submit]'); await page.waitForTimeout(1300); };
  const last = () => page.evaluate(() => (window.__prompts || []).slice(-1)[0]);
  const asksOf = () => page.evaluate(() => { const e = document.querySelector('.ledger-entry'); const h = Array.from(e.querySelectorAll('h4')).find((x) => /would ask/.test(x.textContent)); return h && h.nextElementSibling ? h.nextElementSibling.querySelectorAll('li').length : 0; });
  const out = {};
  process.on('unhandledRejection', (e) => { out.FAIL = String((e && e.message) || e); out.errs = errs.concat(['unhandled: ' + out.FAIL]); console.log(JSON.stringify(out, null, 1)); process.exit(1); });
  const fail = (what) => errs.push('check: ' + what);
  await page.goto('http://127.0.0.1:8765/#/library/chamber-alexander', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  // the chamber: the stamp, the standings, the regions, the far region
  out.stamp = await page.evaluate(() => (document.querySelector('#codex-stamp') || {}).textContent);
  out.chamber = await page.evaluate(() => ({ rows: Array.from(document.querySelectorAll('.standings tbody tr')).map((r) => r.dataset.member), regions: (document.querySelector('.series-counts') || {}).textContent, seriesList: (document.querySelector('.series-list') || {}).textContent, record: !!document.querySelector('.record-block'), far: (document.querySelector('.far-line') || {}).textContent, engine: !!document.querySelector('.counsel-lens .engine-part'), veto: !!document.querySelector('.eng-veto') }));
  if (!/^3\.1\.\d/.test(String(out.stamp).trim())) fail('the stamp does not show 3.1.x');
  if (out.chamber.rows.length !== 6) fail('the standings do not list six members');
  if (!/Beyond 3/.test(out.chamber.regions || '') || !/Serie C 32/.test(out.chamber.regions || '')) fail('the series line is wrong: ' + out.chamber.regions);
  if (!/Beyond.*none taken/.test(out.chamber.seriesList || '') || !/highest rung with no city taken is Beyond/.test(out.chamber.far || '')) fail('the series list or the pothos line is missing');
  if (!/\?/.test(await page.evaluate(() => (document.querySelector('.chip.series') || {}).textContent + [...document.querySelectorAll('.chip.series')].map((x) => x.textContent).join('')))) fail('no unsure mark on any series chip');
  out.netHeader = await page.evaluate(() => Array.from(document.querySelectorAll('.standings thead th')).map((x) => x.textContent).join('|'));
  if (!/Score\|Net\|League/.test(out.netHeader)) fail('the standings have no Net column: ' + out.netHeader);
  if (!out.chamber.engine || !out.chamber.veto) fail('Alexander’s lens has no engine part or no veto');
  await page.screenshot({ path: OUT + '/engine-chamber.png', fullPage: false });
  // Alexander: a ruling with vetoes and an inner note; the tier asked for is "complex"
  await ask('Send the ANTA application today with the CV as it is, or rewrite the CV summary first?');
  const p1 = await last();
  out.alex1 = await page.evaluate(() => { const e = document.querySelector('.ledger-entry'); return { entries: document.querySelectorAll('.ledger-entry').length, pull: (e.querySelector('.le-pull') || {}).textContent, inner: !!e.querySelector('details.le-inner'), vetoed: (e.querySelector('.le-inner') || {}).textContent, xss: window.__xss || null }; });
  out.alex1.asks = await asksOf();
  if (out.alex1.asks !== 3) fail('Alexander should ask three questions at first, asked ' + out.alex1.asks);
  out.alex1.tier = p1.tier; out.alex1.threeQ = /three questions/.test(p1.input); out.alex1.words40 = /at most 40 words/.test(p1.input);
  if (out.alex1.tier !== 'complex') fail('the counsel did not ask for the complex tier');
  if (!out.alex1.inner || !/Struck by the Alex agent/.test(out.alex1.vetoed || '')) fail('Alexander’s inner note has no vetoes');
  if (out.alex1.xss) fail('script ran from an answer');
  // follow it, then ask and follow again: two followed rulings leave him two questions and thirty words
  await page.click('[data-counsel-follow]'); await page.waitForTimeout(500);
  out.followed1 = await page.evaluate(() => ({ chip: (document.querySelector('.ledger-entry .le-mark') || {}).textContent, stored: window.__store.get('private/resonance/counsel/alexander').entries[0].followed, standing: (document.querySelector('.standings tbody tr') || {}).dataset.member, line: (document.querySelector('.eng-followed') || {}).textContent }));
  if (out.followed1.chip !== 'Followed' || !out.followed1.stored || out.followed1.standing !== 'alexander') fail('following a ruling did not show or did not store');
  await ask('Apply to the bank posting this week, or wait for the relaunch?');
  await page.click('.ledger-entry [data-counsel-follow]'); await page.waitForTimeout(500);
  await ask('Take the ministry post interview on the 13th, or ask to move it?');
  const p3 = await last();
  out.alex3 = { twoQ: /two questions/.test(p3.input), words30: /at most 30 words/.test(p3.input), followedListed: /RULINGS THE KEEPER FOLLOWED/.test(p3.input), asksShown: await asksOf() };
  if (out.alex3.asksShown !== 2) fail('after two followed rulings Alexander should ask two questions, asked ' + out.alex3.asksShown);
  if (!out.alex3.twoQ || !out.alex3.words30 || !out.alex3.followedListed) fail('Alexander’s questions did not fall after two followed rulings');
  // Gates: the pull is hidden, the inner note keeps it
  await go('#/library/cell-gates', 800);
  await ask('Should I track replies in a sheet or in the Pipeline view?');
  const pg = await last();
  out.gates = await page.evaluate(() => { const e = document.querySelector('.ledger-entry'); return { pullShown: !!e.querySelector('.le-pull'), kept: (e.querySelector('.le-hidden') || {}).textContent, engine: Array.from(document.querySelectorAll('.engine-agents li b')).map((b) => b.textContent) }; });
  out.gates.recordRule = /NEVER speak as him/.test(pg.input); out.gates.noKudo = !/THE KUDO SIDE/.test(pg.input); out.gates.table = /musk \(Elon Musk\): The next window is/.test(pg.input);
  if (out.gates.pullShown || !/measure the gaps/.test(out.gates.kept || '')) fail('Gates’s hidden pull showed, or the inner note lost it');
  if (!out.gates.recordRule || !out.gates.noKudo || !out.gates.table) fail('Gates’s prompt broke a rule');
  // set aside, then strike: a struck ruling is neither followed nor set aside
  await page.click('.ledger-entry [data-counsel-aside]'); await page.waitForTimeout(400);
  out.aside = await page.evaluate(() => ({ chip: (document.querySelector('.ledger-entry .le-mark') || {}).textContent, stored: !!window.__store.get('private/resonance/counsel/gates').entries[0].aside }));
  await page.click('.ledger-entry [data-counsel-strike]'); await page.waitForTimeout(400);
  out.struck = await page.evaluate(() => { const e = window.__store.get('private/resonance/counsel/gates').entries[0]; return { struck: e.struck, aside: e.aside, followButton: !!document.querySelector('.ledger-entry [data-counsel-follow]') }; });
  if (out.aside.chip !== 'Set aside' || !out.aside.stored || !out.struck.struck || out.struck.aside || out.struck.followButton) fail('set aside or strike did not behave');
  // Jobs: the pull shows
  await go('#/library/cell-jobs', 800);
  await ask('Apply to one posting with full effort, or to five with the same CV?');
  out.jobs = await page.evaluate(() => (document.querySelector('.ledger-entry .le-pull') || {}).textContent);
  if (!/nobody asked for/.test(out.jobs || '')) fail('Jobs’s pull did not show');
  // Musk: a window from the data shows; an invented date is dropped and the note says so
  await go('#/library/cell-musk', 800);
  out.muskCell = await page.evaluate(() => /cot stands on the library floor/.test(document.body.textContent));
  await ask('Finish the AWS course first, or send the two remote applications today?');
  out.musk1 = await page.evaluate(() => ({ window: (document.querySelector('.ledger-entry').querySelector('.le-window') || {}).textContent, pull: !!document.querySelector('.ledger-entry').querySelector('.le-pull') }));
  await page.evaluate(() => { window.__invent = true; });
  await ask('And the ministry post: apply now or next week?');
  out.musk2 = await page.evaluate(() => ({ window: !!document.querySelector('.ledger-entry').querySelector('.le-window'), dropped: (document.querySelector('.ledger-entry').querySelector('.le-dropped') || {}).textContent, stored: window.__store.get('private/resonance/counsel/musk').entries.slice(-1)[0].verdict.window }));
  if (!out.muskCell) fail('the cot is not in Musk’s cell');
  if (!/The window/.test(out.musk1.window || '') || out.musk1.pull) fail('Musk’s window did not show, or his hidden wish showed');
  if (out.musk2.window || !/2026-11-11/.test(out.musk2.dropped || '') || out.musk2.stored) fail('an invented window date was not dropped');
  await page.evaluate(() => document.querySelectorAll('.ledger-entry details.le-inner').forEach((d) => { d.open = true; }));
  const led = await page.$('.ledger'); if (led) await led.screenshot({ path: OUT + '/engine-musk-ledger.png' });
  // the plates: "What moves him" and the followed line
  await go('#/e/alexander', 900);
  out.plate = await page.evaluate(() => ({ engine: !!document.querySelector('.engine-part'), followed: (document.querySelector('.eng-followed') || {}).textContent, eyes: document.querySelectorAll('.eng-eyes .eye-chip').length }));
  if (!out.plate.engine || !/Followed 2 of 3/.test(out.plate.followed || '') || out.plate.eyes !== 2) fail('the plate does not show the engine or the followed line');
  const lens = await page.$('.counsel-lens'); if (lens) await lens.screenshot({ path: OUT + '/engine-alexander-lens.png' });
  // the sixth member: the record block first, the trust rule in code, the standing line, the pull hidden
  await go('#/library/cell-epstein', 900);
  out.epCell = await page.evaluate(() => { const r = document.querySelector('#s-record'); const l = document.querySelector('#s-lens'); return { record: !!r, before: !!(r && l && (r.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING)), text: r ? r.textContent : '', rules: !!document.querySelector('.eng-rules') }; });
  if (!out.epCell.record || !out.epCell.before || !/10 August 2019/.test(out.epCell.text) || !/not an endorsement/.test(out.epCell.text) || !out.epCell.rules) fail('the sixth cell does not open with the record, or does not list its rules');
  await ask('A US company offers a relocation advance with the contract: take it?');
  const pe = await last();
  out.ep = await page.evaluate(() => { const e = document.querySelector('.ledger-entry'); return { reasons: e.querySelectorAll('ol li').length, risks: Array.from(e.querySelectorAll('h4')).filter((h) => /Risks/.test(h.textContent)).map((h) => h.nextElementSibling.querySelectorAll('li').length)[0], dropped: (e.querySelector('.le-dropped') || {}).textContent, notAdvice: !!e.querySelector('.le-notadvice'), pullShown: !!e.querySelector('.le-pull'), kept: (e.querySelector('.le-hidden') || {}).textContent }; });
  if (out.ep.reasons !== 1 || out.ep.risks !== 1 || !/\d+ lines deleted by the trust rule/.test(out.ep.dropped || '')) fail('the trust rule did not delete the two lines it should: ' + JSON.stringify(out.ep));
  if (!out.ep.notAdvice || out.ep.pullShown || !/larger counterparty/.test(out.ep.kept || '')) fail('the sixth member’s standing line or hidden pull is wrong');
  if (!/HARD RULES FOR THIS MEMBER/.test(pe.input) || !/musk \(Elon Musk\)/.test(pe.input)) fail('the sixth member’s prompt lacks the rules or the table');
  await page.screenshot({ path: OUT + '/engine-cell-epstein.png', fullPage: false });
  // a viewer: none of the board is shown, plate or cell; the chamber stays sealed
  const vctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await vctx.addInitScript(MOCK.replace('isOwner: async () => true', 'isOwner: async () => false'));
  const vp = await vctx.newPage(); const verrs = []; vp.on('pageerror', (e) => verrs.push(e.message));
  await vp.goto('http://127.0.0.1:8765/#/e/musk', { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(1400);
  out.viewer = await vp.evaluate(() => ({ engine: !!document.querySelector('.engine-part'), followed: !!document.querySelector('.eng-followed') }));
  for (const h of ['#/e/epstein', '#/library/cell-epstein']) { await vp.goto('http://127.0.0.1:8765/' + h, { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(1200); const tx = await vp.evaluate(() => document.body.innerText); if (/Epstein|debt-and-money|record, first/i.test(tx)) fail('a viewer sees the sixth member at ' + h); }
  await vp.goto('http://127.0.0.1:8765/#/library/chamber-alexander', { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(1400);
  out.viewer.standings = !!(await vp.$('.standings')); out.viewer.sealed = /No such place|not in the library/.test(await vp.evaluate(() => document.body.innerText));
  if (out.viewer.engine || out.viewer.followed || out.viewer.standings || !out.viewer.sealed) fail('a viewer sees too much or too little');
  out.viewerErrs = verrs;
  await vctx.close();
  // the phone, light and dark: no sideways scroll; the standings fold into cards
  const phone = {};
  for (const scheme of ['light', 'dark']) {
    const pctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: scheme });
    await pctx.addInitScript(MOCK);
    const pp = await pctx.newPage(); const perrs = []; pp.on('pageerror', (e) => perrs.push(e.message));
    await pp.goto('http://127.0.0.1:8765/#/library/chamber-alexander', { waitUntil: 'domcontentloaded' }); await pp.waitForTimeout(1500);
    phone[scheme] = await pp.evaluate(() => ({ over: document.documentElement.scrollWidth - document.documentElement.clientWidth, thead: getComputedStyle(document.querySelector('.standings thead')).display, cards: document.querySelectorAll('.standings tbody tr').length }));
    const top = await pp.evaluate(() => { const el = document.querySelector('.standings-wrap'); return el ? el.getBoundingClientRect().top + window.scrollY - 80 : 0; });
    await pp.screenshot({ path: OUT + '/engine-phone-' + scheme + '.png', clip: { x: 0, y: Math.max(0, top), width: 390, height: 900 }, fullPage: true });
    phone[scheme].errs = perrs;
    if (phone[scheme].over > 0 || phone[scheme].thead !== 'none' || phone[scheme].cards !== 6) fail('the phone (' + scheme + ') overflows or the standings do not fold');
    if (perrs.length) errs.push(...perrs.map((x) => 'phone ' + scheme + ': ' + x));
    await pctx.close();
  }
  out.phone = phone;
  out.errs = errs.concat(verrs.map((x) => 'viewer: ' + x));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
