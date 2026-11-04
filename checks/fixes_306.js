// 3.0.6: the fixes of PROBA run 5 (UI half and logic half). Every failed expectation goes into `errs`.
// Usage: node checks/fixes_306.js [out folder] [port]   (the port serves the tree under test; default 8765)
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const VIEWER = MOCK.replace('isOwner: async () => true', 'isOwner: async () => false').replace('canEdit: async () => true', 'canEdit: async () => false');
const PORT = process.argv[3] || '8765';
const BASE = 'http://127.0.0.1:' + PORT + '/';
(async () => {
  const browser = await chromium.launch();
  const errs = []; const out = {};
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };
  const mk = async (mock, remembered) => {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(mock);
    if (remembered) await ctx.addInitScript((r) => { try { window.localStorage.setItem('codex:lore', r); } catch (e) { /* none */ } }, remembered);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/\/_blob\//.test(m.text()) && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
    const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 700); };
    const text = () => page.evaluate(() => document.getElementById('codex-main').innerText);
    return { ctx, page, go, text };
  };

  // 1. a form that has sent its text is empty again, and a second Enter adds nothing (PROBA run 5, logic M1)
  {
    const { ctx, page, go } = await mk(MOCK);
    await page.goto(BASE + '#/quests', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1800);
    await page.fill('#q-new-title', 'Check the Gamma convention'); await page.click('[data-q-new] button[type=submit]'); await page.waitForTimeout(1500);
    const inp = '[data-q-addobj] input';
    await page.fill(inp, 'Read section 2'); await page.press(inp, 'Enter'); await page.waitForTimeout(1300);
    out.obj1 = await page.evaluate(() => ({ n: document.querySelectorAll('[data-q-obj]').length, v: document.querySelector('[data-q-addobj] input').value }));
    expect(out.obj1.n === 1 && out.obj1.v === '', 'the objective field is empty after Enter (' + JSON.stringify(out.obj1) + ')');
    await page.press(inp, 'Enter'); await page.waitForTimeout(1000);
    out.obj2 = await page.evaluate(() => document.querySelectorAll('[data-q-obj]').length);
    expect(out.obj2 === 1, 'a second Enter adds no second objective (' + out.obj2 + ')');
    // text typed and NOT sent still survives a background write
    await page.fill(inp, 'half written'); await page.evaluate(() => window.CodexView.refresh()); await page.waitForTimeout(600);
    expect(await page.evaluate((s) => document.querySelector(s).value, inp) === 'half written', 'unsent text in the objective field survives a refresh');
    // the lamp prayer box
    await go('#/lamp/ficek', 1500);
    await page.click('[data-lamp="light"]'); await page.waitForTimeout(400);
    await page.fill('form[data-lamp-form] textarea', 'How do I read the cross terms?');
    await page.click('form[data-lamp-form] button[type="submit"]'); await page.waitForTimeout(2500);
    out.lamp = await page.evaluate(() => ({ turns: document.querySelectorAll('.pray-turn').length, box: document.querySelector('form[data-lamp-form] textarea').value }));
    expect(out.lamp.turns >= 2 && out.lamp.box === '', 'the prayer box is empty after the prayer is sent (' + JSON.stringify(out.lamp) + ')');
    await page.fill('form[data-lamp-form] textarea', 'a second prayer, half written'); await page.evaluate(() => window.CodexView.refresh()); await page.waitForTimeout(500);
    expect(await page.evaluate(() => document.querySelector('form[data-lamp-form] textarea').value) === 'a second prayer, half written', 'unsent prayer text survives a refresh');
    await ctx.close();
  }

  // 2. the keeper still sees the whole campaign
  {
    const { ctx, page, go, text } = await mk(MOCK);
    await page.goto(BASE + '#/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
    out.keeperMenu = await page.evaluate(() => document.getElementById('lore-menu').textContent);
    expect(/Iovu/.test(out.keeperMenu), 'the keeper sees the Iovu lore in the lore menu');
    await go('#/figures', 800); const fg = await text();
    expect(/The board of the campaign/.test(fg), 'the keeper sees the board of the campaign on the Figures page');
    await go('#/library/chamber-alexander', 900); const ch = await text();
    expect(/chamber of the board of the campaign/.test(ch) && !/No such place/.test(ch), 'the keeper opens Alexander’s chamber');
    await go('#/e/fable', 800); expect(!/No such|not in this codex/i.test(await text()), 'the keeper opens the Fable cell page');
    await go('#/lamp/gates', 900); expect(!/No lamp here/.test(await text()), 'the keeper opens the lamp of a board cell');
    await go('#/releases', 800); const rl = await text();
    expect(/Iovu is rebuilt from CRETD-D|Book of Iovu/.test(rl), 'the keeper reads the Iovu notes in the release log');
    await go('#/lore/iovu', 1200);
    expect(await page.evaluate(() => window.Codex.lore) === 'iovu', 'the keeper can open the Iovu lore');
    expect(/about a decade of engineering/.test(await page.evaluate(() => JSON.stringify(window.Codex.pack('iovu').context || ''))), 'the Iovu context says "about a decade of engineering"');
    expect(!/fourteen years/.test(await page.evaluate(() => JSON.stringify(window.Codex.pack('iovu').context || ''))), 'no "fourteen years" is left');
    await ctx.close();
  }
  // the keeper whose browser remembers the Iovu lore comes back to it once the answer is in
  {
    const { ctx, page } = await mk(MOCK, 'iovu');
    await page.goto(BASE + '#/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    out.keeperRemembered = await page.evaluate(() => window.Codex.lore);
    expect(out.keeperRemembered === 'iovu', 'a keeper who left in the Iovu lore returns to it (' + out.keeperRemembered + ')');
    await ctx.close();
  }

  // 3. a viewer meets no campaign anywhere
  {
    const { ctx, page, go, text } = await mk(VIEWER);
    await page.goto(BASE + '#/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000);
    const body = () => page.evaluate(() => document.body.innerText);
    const CAMP = /Iovu|CRETD|campaign|signed contract|Alexander the Great|kept off it|vacant (sixth|seventh)|board of|Bill Gates|Gates’s cell|Fable cell|Musk’s/i;
    out.viewerMenu = await page.evaluate(() => document.getElementById('lore-menu').textContent);
    expect(!/Iovu/.test(out.viewerMenu), 'the lore menu of a viewer has no Iovu');
    const seen = {};
    for (const r of ['#/', '#/cyclopedia', '#/figures', '#/lexicon', '#/tomes', '#/literature', '#/library', '#/lores', '#/e/alexander', '#/e/fable', '#/e/gates', '#/e/jobs', '#/e/musk', '#/library/chamber-alexander', '#/lamp/alexander', '#/lamp/gates', '#/lamp/fable', '#/lamp/musk', '#/library/cell-gates', '#/library/cell-vacant-6', '#/library/araki-hall', '#/library/restricted-section', '#/lore/iovu', '#/library/iovu-door']) {
      await go(r, 600);
      const t = await text(); const m = t.match(CAMP);
      seen[r] = m ? m[0] + ' «' + t.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, ' ') + '»' : '';
    }
    out.viewerHits = Object.fromEntries(Object.entries(seen).filter(([, v]) => v));
    expect(!Object.keys(out.viewerHits).length, 'a viewer finds no campaign wording on any route: ' + JSON.stringify(out.viewerHits).slice(0, 600));
    await go('#/figures', 700);
    expect(!/board of the campaign|Member of the board/.test(await text()), 'the Figures page of a viewer has no board');
    await go('#/library/chamber-alexander', 700); expect(/No such place|not in the library/.test(await text()), 'Alexander’s chamber is "No such place" for a viewer');
    await go('#/library/cell-gates', 700); expect(/No such place|not in the library/.test(await text()), 'a cell of the chamber is "No such place" for a viewer');
    await go('#/library/restricted-section', 700); const rs = await text();
    expect(!/Only you come here/.test(rs), 'the restricted section does not say "Only you come here" to a viewer');
    await go('#/lore/iovu', 900); expect(await page.evaluate(() => location.hash) === '#/' && await page.evaluate(() => window.Codex.lore) === 'resonance', '#/lore/iovu sends a viewer to the Resonance home');
    await go('#/releases', 800); const rl = await text();
    expect(/3\.0\.6/.test(rl) && !/Iovu is rebuilt|CRETD|campaign|Alexander|Zandstra|league|seats abroad/i.test(rl), 'the release log of a viewer has the versions but none of the campaign notes');
    for (const q of ['Iovu', 'Alexander', 'Gates', 'campaign', 'Fable', 'Musk']) {
      await page.fill('#codex-search', q); await page.waitForTimeout(350);
      const r = await page.evaluate(() => (document.getElementById('codex-search-results') || {}).innerText || '');
      out['search_' + q] = r.slice(0, 80);
      if (q !== 'Fable') expect(!/Iovu|board|Alexander the Great|Bill Gates|Gates’s cell|Musk|Alexander’s chamber|campaign/i.test(r), 'search "' + q + '" shows a viewer nothing of the campaign (' + r.slice(0, 80).replace(/\s+/g, ' ') + ')');
    }
    await ctx.close();
  }
  // a viewer whose browser remembers the Iovu lore lands in the Resonance home
  {
    const { ctx, page } = await mk(VIEWER, 'iovu');
    await page.goto(BASE + '#/', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2500);
    out.viewerRemembered = await page.evaluate(() => window.Codex.lore);
    expect(out.viewerRemembered === 'resonance', 'a viewer who had the Iovu lore remembered lands in Resonance (' + out.viewerRemembered + ')');
    expect(!/Iovu|city|cities/i.test(await page.evaluate(() => document.getElementById('codex-main').innerText)), 'and sees no Iovu on that page');
    await ctx.close();
  }
  out.errs = errs; console.log(JSON.stringify(out, null, 1).slice(0, 4000));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
