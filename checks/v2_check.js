// v2 features end to end: review, drill, quests, dossier, page photos, rusty entries; desktop and phone.
const { chromium } = require('playwright');
const fs = require('fs');
const zlib = require('zlib');
const OUT = process.argv[2];
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
function png(w, h) { // a small valid PNG for the upload test
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; for (let x = 0; x < w; x++) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = 200; raw[o + 1] = 180; raw[o + 2] = 140; } }
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(td) : 0); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
(async () => {
  const browser = await chromium.launch();
  const out = {};
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push('pageerror ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/\/_blob\//.test(m.text() + ' ' + ((m.location() || {}).url || ''))) errs.push(m.text()); }); // the mock's photo URLs (/_blob/<id>) only exist on the platform
  const go = async (h) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(500); };
  await page.goto('http://127.0.0.1:8765/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  out.homeTabs = await page.evaluate(() => Array.from(document.querySelectorAll('.jtabs a')).map((a) => a.textContent));
  out.homeReview = await page.evaluate(() => (document.querySelector('.rv-teaser') || {}).innerText);
  // review session: 5 new cards, answer with the keyboard
  await go('#/review');
  out.reviewToday = await page.evaluate(() => document.querySelector('.rv-today').innerText.replace(/\n/g, ' | '));
  await page.click('[data-rv="start"]'); await page.waitForTimeout(400);
  const seen = [];
  for (let k = 0; k < 6; k++) {
    const head = await page.evaluate(() => (document.querySelector('.rv-head span') || {}).textContent);
    if (!head) break;
    seen.push(head);
    await page.keyboard.press(String(1 + (k % 4))); await page.waitForTimeout(120);
    await page.keyboard.press('Enter'); await page.waitForTimeout(200);
    const fb = await page.evaluate(() => (document.querySelector('.rv-why b') || {}).textContent);
    seen.push(fb);
    await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  }
  out.reviewSeen = seen;
  out.reviewDone = await page.evaluate(() => ({ h1: (document.querySelector('#review-root h1') || {}).textContent, items: document.querySelectorAll('.rv-list li').length, cards: Object.keys(Codex.Store.review().cards || {}).length, days: Codex.Store.review().days }));
  await page.screenshot({ path: OUT + '/v2-review-done.png' });
  // drill: 5 questions, harder pace, answer two then finish
  await page.click('[data-rv="home"]'); await page.waitForTimeout(300);
  await page.check('input[name="rv-n"][value="5"]');
  await page.click('[data-rv-form] button[type="submit"]'); await page.waitForTimeout(500);
  out.drillHead = await page.evaluate(() => document.querySelector('.dr-head').innerText.replace(/\n/g, ' | '));
  await page.screenshot({ path: OUT + '/v2-drill.png' });
  await page.keyboard.press('a'); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  await page.keyboard.press('b'); await page.waitForTimeout(150);
  await page.click('[data-rv="finish"]'); await page.waitForTimeout(400);
  out.drillDone = await page.evaluate(() => ({ lede: document.querySelector('#review-root .lede').textContent, items: document.querySelectorAll('.dr-list li').length, drills: (Codex.Store.review().drills || []).length }));
  // quests: create, add objectives, tick one, track, link an entry
  await go('#/quests');
  await page.fill('#q-new-title', 'Settle the Γ convention in (3.48)');
  await page.fill('#q-new-summary', 'Compare (3.48) with Scully (6.3.14) and with Bardetski & Macovei 2024.');
  await page.click('[data-q-new] button[type="submit"]'); await page.waitForTimeout(600);
  out.questHash = await page.evaluate(() => location.hash);
  const qid = out.questHash.split('/').pop();
  for (const t of ['Compare (3.48) with Scully (6.3.14)', 'Check the convention in Bardetski & Macovei 2024', 'Correct (3.48) to $4d^2\\omega^3/(3\\hbar c^3)$']) { await page.fill('[data-q-addobj] input', t); await page.click('[data-q-addobj] button'); await page.waitForTimeout(250); }
  await page.check('[data-q-obj="0"]'); await page.waitForTimeout(250);
  await page.selectOption('[data-q-link] select', 'decay-rate'); await page.click('[data-q-link] button'); await page.waitForTimeout(250);
  out.questDetail = await page.evaluate(() => ({ objs: document.querySelectorAll('.q-objs li').length, done: document.querySelectorAll('.q-objs li.done').length, links: document.querySelectorAll('.q-link').length, tracked: /tracked/.test(document.querySelector('.q-plate .kind').textContent), math: document.querySelectorAll('.q-objs mjx-container').length }));
  out.stored = await page.evaluate((id) => { const d = window.__store.get('quests/' + id); return d ? { title: d.title, objectives: d.objectives.length, done: d.objectives.filter((o) => o.done).length, links: d.links, tracked: d.tracked } : null; }, qid);
  await page.screenshot({ path: OUT + '/v2-quest.png', fullPage: true });
  await go('#/');
  out.homeTracked = await page.evaluate(() => (document.querySelector('.q-tracker') || {}).innerText);
  await go('#/e/decay-rate');
  out.entryQuest = await page.evaluate(() => (document.querySelector('[data-quest-slot] .q-mini') || {}).innerText);
  // dossier
  await go('#/dossier');
  out.dossier = await page.evaluate(() => ({ sections: document.querySelectorAll('#quests-root .panel h2').length, items: document.querySelectorAll('.dos-item').length, math: document.querySelectorAll('.dos-item mjx-container').length }));
  await page.screenshot({ path: OUT + '/v2-dossier.png' });
  // delete the quest with the in-page confirmation
  await go('#/quest/' + qid);
  await page.click('[data-q="delete"]'); await page.waitForTimeout(200);
  await page.click('[data-q="delete-yes"]'); await page.waitForTimeout(500);
  out.afterDelete = await page.evaluate((id) => ({ hash: location.hash, stored: window.__store.has('quests/' + id) }), qid);
  // page photos on a sealed section
  await go('#/tome/sz/6.2');
  await page.waitForTimeout(400);
  out.inboxBefore = await page.evaluate(() => (document.querySelector('.inbox') || {}).innerText);
  await page.setInputFiles('.inbox input[type=file]', [{ name: 'p196.png', mimeType: 'image/png', buffer: png(60, 80) }, { name: 'p197.png', mimeType: 'image/png', buffer: png(60, 80) }]);
  await page.waitForTimeout(1500);
  out.inboxAfter = await page.evaluate(() => ({ thumbs: document.querySelectorAll('.inbox-thumbs li').length, assets: (window.__assets || []).map((a) => a.type), doc: window.__store.get('inbox/sec-sz-6.2') ? window.__store.get('inbox/sec-sz-6.2').photos.length : null }));
  await page.click('[data-inbox-send]'); await page.waitForTimeout(800);
  out.inboxSent = await page.evaluate(() => ({ sent: window.__sent, status: (window.__store.get('inbox/sec-sz-6.2') || {}).status }));
  await page.screenshot({ path: OUT + '/v2-inbox.png' });
  // rusty: an entry last touched long ago
  out.rusty = await page.evaluate(() => { const id = 'secular-approximation'; const e = Codex.get(id); e.integrated = '2026-08-01'; const cards = Codex.Store.review().cards || {}; for (const k of Object.keys(cards)) if (k.startsWith(id + ':')) delete cards[k]; const p = Codex.Store.data.entries[id]; if (p) delete p.at; return { rusty: CodexReview.isRusty(id), days: CodexReview.daysIdle(id) }; });
  await go('#/e/secular-approximation');
  out.rustyGoal = await page.evaluate(() => document.querySelector('.plate-next').textContent);
  out.errs = errs;
  await ctx.close();
  // phone: overflow on the new pages
  const p2ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p2ctx.addInitScript(MOCK);
  const p2 = await p2ctx.newPage();
  const perrs = []; p2.on('pageerror', (e) => perrs.push(e.message));
  const phone = {};
  for (const r of ['#/review', '#/quests', '#/dossier', '#/tome/sz/6.2', '#/e/cr-damped-rabi']) {
    await p2.goto('http://127.0.0.1:8765/' + r, { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(1200);
    phone[r] = await p2.evaluate(() => ({ overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, wide: Array.from(document.querySelectorAll('#codex-main *')).filter((n) => n.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !n.closest('.mdisp, .pl-tablewrap')).slice(0, 3).map((n) => n.tagName + '.' + n.className) }));
  }
  await p2.goto('http://127.0.0.1:8765/#/review', { waitUntil: 'domcontentloaded' }); await p2.waitForTimeout(1200);
  await p2.tap('[data-rv="start"]'); await p2.waitForTimeout(400);
  await p2.screenshot({ path: OUT + '/v2-phone-review.png' });
  out.phone = phone; out.phoneErrs = perrs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
