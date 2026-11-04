// the empathy lamp: lamps on cells and the Giants' chambers, a prayer with sync, drift, options that act, the record kept and reopened
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const outdir = process.argv[2] || '';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 400); };
  const text = (sel) => page.evaluate((s) => { const el = document.querySelector(s); return el ? el.innerText : null; }, sel);
  await page.goto('http://127.0.0.1:8765/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const out = { errs };
  // 1–3: where the lamps stand
  await go('#/library/cell-ficek');
  out.cell = await page.evaluate(() => ({ panel: !!document.querySelector('.lamps'), cards: Array.from(document.querySelectorAll('.lamp-card')).map((a) => a.getAttribute('href') + ' | ' + a.innerText.replace(/\n/g, ' · ')) }));
  await go('#/library/chamber-a');
  out.chamberA = await page.evaluate(() => Array.from(document.querySelectorAll('.lamp-card')).map((a) => a.getAttribute('href')));
  await go('#/library/chamber-coudreau');
  out.monkChamber = await page.evaluate(() => document.querySelectorAll('.lamp-card').length);
  await go('#/library/kudo-hall');
  out.hall = await page.evaluate(() => document.querySelectorAll('.lamp-card').length);
  // 4: the figure page
  await go('#/e/ficek');
  out.figureChip = await text('.head-meta .lamp-chip');
  // 5: light and pray
  await go('#/lamp/ficek');
  out.unlit = await text('.lamp-box');
  await page.click('[data-lamp="light"]');
  await page.waitForTimeout(300);
  out.lit = { composer: !!(await page.$('form[data-lamp-form]')), head: await text('.prayer-head') };
  await page.fill('#pray-text', 'As Ficek: I take the two atoms to decay independently, each with its own Γ, and ask how the fluorescence spectrum changes.');
  await page.click('form[data-lamp-form] button[type="submit"]');
  await page.waitForTimeout(900);
  out.turn1 = await page.evaluate(() => {
    const t = document.querySelector('.pray-turn.lamp');
    if (!t) return null;
    return { chip: t.querySelector('.sync-chip').innerText, drift: Array.from(t.querySelectorAll('.drift li')).map((li) => li.innerText.slice(0, 80)), hint: (t.querySelector('.sync-hint') || {}).innerText, answerHtml: t.querySelector('.pray-text').innerHTML.slice(0, 200),
      options: Array.from(t.querySelectorAll('.gap-opt')).map((b) => b.dataset.lampLetter + ':' + b.querySelector('.opt-kind').innerText + ':' + b.querySelector('.opt-label').innerText), record: (t.querySelector('.pray-record') || {}).innerText, xss: window.__xss || null, you: document.querySelector('.pray-turn.you .pray-text').innerText.slice(0, 40) };
  });
  out.prompt1 = await page.evaluate(() => { const p = (window.__prompts || []).filter((x) => /EMPATHY LAMP/.test(x.input)).pop(); return p ? { tier: p.tier, len: p.input.length, hasRecord: /NAME: Zbigniew Ficek/.test(p.input), hasBook: /BOOK id=ficek-swain/.test(p.input), hasBestiary: /HER BESTIARY/.test(p.input), hasRecipes: /RECIPES OF THE CRAFTING TABLE/.test(p.input), firstTime: /PREVIOUS SYNCS: none/.test(p.input), prayer: /HER PRAYER NOW/.test(p.input) } : null; });
  // 6: A adds to the bestiary
  await page.click('.gap-opt[data-lamp-letter="A"]');
  await page.waitForTimeout(400);
  out.optA = await page.evaluate(() => ({ stub: !!Codex.get('st-collective-lamb-shift'), name: (Codex.get('st-collective-lamb-shift') || {}).name, taken: document.querySelector('.gap-opt[data-lamp-letter="A"]').classList.contains('taken') }));
  // 7: B goes to the workbench with the ingredients; back to the lamp, still burning; pray again
  await page.click('.gap-opt[data-lamp-letter="B"]');
  await page.waitForTimeout(500);
  out.optB = await page.evaluate(() => ({ hash: location.hash, bench: window.CodexCraft.Model.bench.ids.slice() }));
  await go('#/lamp/ficek', 500);
  out.back = { stillLit: !!(await page.$('form[data-lamp-form]')), turns: await page.evaluate(() => document.querySelectorAll('.pray-turn').length) };
  await page.fill('#pray-text', 'As Ficek, again: the pair shares γ₁₂; I ask about the antisymmetric state.');
  await page.click('form[data-lamp-form] button[type="submit"]');
  await page.waitForTimeout(900);
  out.turn2 = await page.evaluate(() => ({ chips: Array.from(document.querySelectorAll('.pray-turn.lamp .sync-chip')).map((c) => c.innerText), head: document.querySelector('.prayer-head .sync-chip').innerText, noDrift: !!document.querySelectorAll('.pray-turn.lamp')[1].querySelector('.drift-none') }));
  out.prompt2 = await page.evaluate(() => { const p = (window.__prompts || []).filter((x) => /EMPATHY LAMP/.test(x.input)).pop(); return p ? { sofar: /THIS SESSION SO FAR/.test(p.input), taken: /TAKEN: A, B/.test(p.input), offered: /OPTIONS OFFERED: A bestiary/.test(p.input) } : null; });
  // 8–12: the other kinds of option, on the first turn
  const first = '.pray-turn.lamp[data-lamp-turn="1"] ';
  await page.click(first + '.gap-opt[data-lamp-letter="C"]');
  await page.waitForTimeout(400);
  out.optC = await page.evaluate(() => location.hash);
  await go('#/lamp/ficek', 400);
  await page.click(first + '.gap-opt[data-lamp-letter="D"]');
  await page.waitForTimeout(400);
  out.optD = await page.evaluate(() => (window.__sent || '').slice(0, 120));
  await page.click(first + '.gap-opt[data-lamp-letter="E"]');
  await page.waitForTimeout(400);
  out.optE = await page.evaluate(() => (window.__sent || '').slice(0, 160));
  await page.click(first + '.gap-opt[data-lamp-letter="F"]');
  await page.waitForTimeout(400);
  out.optF = await page.evaluate(() => location.hash);
  await go('#/lamp/ficek', 400);
  await page.click(first + '.gap-opt[data-lamp-letter="G"]');
  await page.waitForTimeout(1200);
  out.optG = await page.evaluate(() => ({ hash: location.hash, doc: !!window.CodexLibrary.item('rough-decay-rate-x-rabi-oscillation'), place: (window.CodexLibrary.item('rough-decay-rate-x-rabi-oscillation') || {}).place }));
  await go('#/lamp/ficek', 400);
  out.takenNow = await page.evaluate(() => Array.from(document.querySelectorAll('.pray-turn.lamp[data-lamp-turn="1"] .gap-opt.taken')).map((b) => b.dataset.lampLetter).join(''));
  if (outdir) { await page.screenshot({ path: outdir + '/lamp_prayer.png', fullPage: false }); }
  // 13: snuff; the record
  await page.click('[data-lamp="snuff"]');
  await page.waitForTimeout(500);
  out.afterSnuff = await page.evaluate(() => ({ composer: !!document.querySelector('form[data-lamp-form]'), unlit: !!document.querySelector('.lamp-box'), record: Array.from(document.querySelectorAll('.sync-list li')).map((li) => li.innerText.replace(/\n/g, ' · ')),
    store: [...window.__store.keys()].filter((k) => k.startsWith('private/resonance/syncs')), index: window.__store.get('private/resonance/syncs/ficek') }));
  // 14: away and back; light again starts a new prayer
  await go('#/cyclopedia', 300);
  await go('#/lamp/ficek', 500);
  out.again = { sessions: await page.evaluate(() => document.querySelectorAll('.sync-list li').length), unlit: await text('.lamp-box') };
  await page.click('[data-lamp="light"]');
  await page.waitForTimeout(300);
  out.fresh = await text('.prayer .muted');
  // 15: reopen the old prayer
  const sid = out.afterSnuff.index && out.afterSnuff.index.sessions[0].id;
  await go('#/lamp/ficek/' + sid, 600);
  out.old = await page.evaluate(() => ({ head: (document.querySelector('.prayer-head h2') || {}).innerText, lampTurns: document.querySelectorAll('.pray-turn.lamp').length, back: !!document.querySelector('a[href="#/lamp/ficek"]'), composer: !!document.querySelector('form[data-lamp-form]') }));
  // the cell shows the ratio now
  await go('#/library/cell-ficek', 400);
  out.cellAfter = await text('.lamp-card .lamp-sync');
  // the unit sanitizers
  out.unit = await page.evaluate(() => { const T = window.CodexLamp._test; return { badTurn: T.turnOf({ role: 'lamp', ratio: 'abc', answer: 'one string', gaps: [{ gap: 'g', options: [{ kind: 'study', payload: { id: 'decay-rate' } }, { kind: 'rough', payload: { a: 'decay-rate', b: 'decay-rate' } }] }] }), badSession: T.sanitizeSession({ id: 'x y', monk: 'ficek' }) }; });
  if (outdir) {
    await go('#/lamp/ficek', 400);
    const phone = await ctx.newPage();
    await phone.setViewportSize({ width: 390, height: 844 });
    await phone.goto('http://127.0.0.1:8765/#/lamp/ficek', { waitUntil: 'domcontentloaded' });
    await phone.waitForTimeout(1500);
    await phone.click('[data-lamp="light"]');
    await phone.waitForTimeout(300);
    await phone.fill('#pray-text', 'As Ficek: a short prayer on the phone.');
    await phone.click('form[data-lamp-form] button[type="submit"]');
    await phone.waitForTimeout(900);
    await phone.screenshot({ path: outdir + '/lamp_phone.png', fullPage: false });
    await phone.evaluate(() => { const g = document.querySelector('.gaps'); if (g) g.scrollIntoView(); });
    await phone.waitForTimeout(200);
    await phone.screenshot({ path: outdir + '/lamp_phone_gaps.png', fullPage: false });
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
