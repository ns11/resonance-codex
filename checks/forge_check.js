// A forged (verified) crafted doc and a draft doc, injected through the mock db: check how both render.
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push('pageerror ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://127.0.0.1:8765/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.evaluate(async () => {
    const db = await window.claude.use('db');
    const base = { v: 1, name: 'Test dish', teaser: 'A test.', overview: ['One $\\Gamma$.'], steps: [{ text: 'Step.', ref: 'x' }],
      literature: { seminal: [{ authors: 'H. C. Torrey', title: 'Transient Nutations in Nuclear Magnetic Resonance', venue: 'Phys. Rev. 76, 1059', year: 1949, doi: '10.1103/PhysRev.76.1059', field: 'general', fit: 'Fit.', verified: true }], cited: [], latest: [] },
      quiz: [], crafted: { ingredients: ['rabi-oscillation', 'decay-rate'], extras: [], recipe: null, direction: { letter: 'B', title: 'Test' }, depth: 2, at: '2026-10-29T20:00:00Z' } };
    await db.collection('crafted').doc('cr-forged-test-aaaa').set(Object.assign({}, base, { id: 'cr-forged-test-aaaa', name: 'Forged test dish', verified: true, verifiedAt: '2026-10-29',
      textbook: [{ tome: 'sz', num: '6.3', why: 'Where Γ comes from.' }, { book: 'Loudon', where: 'CHECK IN BOOK', why: 'Not confirmed.' }] }));
    await db.collection('crafted').doc('cr-draft-test-bbbb').set(Object.assign({}, base, { id: 'cr-draft-test-bbbb', name: 'Draft test dish', verified: false,
      textbook: [{ tome: 'sz', num: '6.3', why: 'Where Γ comes from.' }, { book: 'Loudon', where: '§2.5', why: 'Claimed.' }] }));
  });
  await page.waitForTimeout(400);
  const read = async (id) => { await page.evaluate((i) => { location.hash = '#/e/' + i; }, id); await page.waitForTimeout(700);
    return page.evaluate(() => ({ title: document.title, badge: (document.querySelector('.crafted-banner .badge') || {}).textContent, forgeBtn: !!document.querySelector('[data-forge]'),
      textbook: Array.from(document.querySelectorAll('.entry-main li')).filter((li) => /Where Γ|Not confirmed|Claimed/.test(li.textContent)).map((li) => li.innerText.replace(/\s+/g, ' ') + (li.querySelector('a[href^="#/tome/"]') ? ' [tome link]' : '')),
      unverified: document.querySelectorAll('.tag-unverified').length, scrollY: window.scrollY })); };
  const out = { forged: await read('cr-forged-test-aaaa'), draft: await read('cr-draft-test-bbbb'), errors: errs };
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
