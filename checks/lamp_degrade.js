// The lamp's error cases (back since 3.0.1): what happens when Claude answers badly.
// A bad answer must be rejected like a string: a toast, the prayer text back in the box, nothing saved, nothing counted.
// Also: a good answer is clamped and clipped, and a session that has grown past 200 KB takes no new prayer.
// Any failed expectation goes into `errs`, which run_all.js treats as a failure.
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };
  await page.goto('http://127.0.0.1:8765/#/lamp/ficek', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await page.click('[data-lamp="light"]');
  await page.waitForTimeout(300);

  // swap what sample.json returns for the next prayer
  const answerWith = (spec) => page.evaluate((sp) => {
    return window.claude.use('sample').then((sample) => {
      sample.json = async () => {
        if (sp.throw) throw sp.throw;
        if (sp.kind === 'big') return { ratio: 150, answer: ['x'.repeat(50000)], drift: [], gaps: [], record: 'r' };
        return sp.value;
      };
    });
  }, spec);
  const state = () => page.evaluate(() => ({
    lampTurns: document.querySelectorAll('.pray-turn.lamp').length,
    stored: (window.CodexLamp.state().open && window.CodexLamp.state().open.s.turns.length) || 0,
    box: (document.querySelector('#pray-text') || {}).value || '',
    toast: (document.getElementById('codex-toast') || {}).textContent || '',
    emptyText: /The lamp gave no answer/.test(document.body.innerText),
  }));
  const pray = async (text) => {
    await page.fill('#pray-text', text);
    await page.click('form[data-lamp-form] button[type="submit"]');
    await page.waitForTimeout(700);
  };
  const out = { cases: {} };
  const bad = {
    string: { value: 'not json at all' },
    null: { value: null },
    array: { value: [{ answer: ['an array of answers'] }] },
    numberAnswer: { value: { ratio: 50, answer: 42, gaps: [] } },
    noText: { value: { ratio: 50, answer: [], gaps: [] } },
    blankText: { value: { ratio: 50, answer: ['   '], gaps: [] } },
    objectAnswer: { value: { ratio: 50, answer: { text: 'x' }, gaps: [] } },
    rateLimited: { throw: { code: 'rate_limited', message: 'slow down' } },
    invalidJson: { throw: { code: 'invalid_json', message: 'bad' } },
    plainError: { throw: new Error('boom') },
  };
  for (const [name, spec] of Object.entries(bad)) {
    await answerWith(spec);
    const before = await state();
    const prayer = 'As Ficek: a test prayer for the case ' + name + '.';
    await pray(prayer);
    const after = await state();
    out.cases[name] = { before: before.stored, after: after.stored, lampTurns: after.lampTurns, box: after.box.slice(0, 40), toast: after.toast.slice(0, 60) };
    expect(after.stored === before.stored, name + ': a bad answer must leave nothing saved (turns ' + before.stored + ' → ' + after.stored + ')');
    expect(after.lampTurns === 0, name + ': no lamp turn may be drawn');
    expect(!after.emptyText, name + ': "(The lamp gave no answer.)" must never be shown');
    expect(after.box === prayer, name + ': the prayer text must come back into the box');
    expect(after.toast.length > 0, name + ': a toast must say what happened');
  }

  // a good answer, with a ratio out of range and a 50 000-character paragraph
  await answerWith({ kind: 'big' });
  await pray('As Ficek: a good prayer with a very long answer.');
  const good = await page.evaluate(() => {
    const t = window.CodexLamp.state().open.s.turns.filter((x) => x.role === 'lamp').pop();
    return t ? { ratio: t.ratio, len: t.answer.join('').length } : null;
  });
  out.good = good;
  expect(good && good.ratio === 100, 'ratio 150 must be clamped to 100');
  expect(good && good.len <= 3000, 'a 50 000-character answer must be clipped to 3000 characters');

  // the size cap: grow the open session past 200 KB, then pray
  const capped = await page.evaluate(async () => {
    const T = window.CodexLamp._test; const s = window.CodexLamp.state().open.s;
    const calls = (window.__calls = 0);
    const sample = await window.claude.use('sample');
    sample.json = async () => { window.__calls++; return { ratio: 50, answer: ['ok'], gaps: [] }; };
    const turnsBefore = s.turns.length;
    while (T.sessionBytes(s) < T.MAX_BYTES + 1000) s.turns.push({ role: 'you', at: '2026-11-01T00:00:00Z', text: 'y'.repeat(6000) });
    return { turnsBefore, bytes: T.sessionBytes(s), max: T.MAX_BYTES, turnsNow: s.turns.length, calls };
  });
  out.capSetup = capped;
  if (capped.turnsNow >= 79) out.note = 'the turn cap would also have stopped this session; the byte cap is checked by hasAnswerText/sessionBytes below';
  await page.evaluate(() => { window.CodexLamp.render && window.CodexLamp.render(); });
  await page.waitForTimeout(200);
  await pray('As Ficek: one more prayer after the cap.');
  const afterCap = await page.evaluate(() => ({ calls: window.__calls, toast: (document.getElementById('codex-toast') || {}).textContent || '' }));
  out.afterCap = afterCap;
  expect(afterCap.calls === 0, 'a session past 200 KB must not send a new prayer');
  expect(/long enough/i.test(afterCap.toast), 'the "long enough" toast must show past the byte cap');

  // the unit helper
  out.unit = await page.evaluate(() => {
    const h = window.CodexLamp._test.hasAnswerText;
    return { object: h({ answer: ['a'] }), string: h({ answer: 'a' }), array: h([{ answer: 'a' }]), number: h({ answer: 3 }), empty: h({ answer: [] }), blank: h({ answer: [' '] }), nul: h(null) };
  });
  expect(out.unit.object && out.unit.string && !out.unit.array && !out.unit.number && !out.unit.empty && !out.unit.blank && !out.unit.nul, 'hasAnswerText must accept only an object with some answer text');

  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
