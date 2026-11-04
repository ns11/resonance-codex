// wares counter: one created ware + one recommended crafting on top, the rest behind the stock toggle
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
  await page.goto('http://127.0.0.1:8765/#/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const readCounter = () => page.evaluate(() => {
    const s = document.getElementById('s-wares');
    if (!s) return null;
    const cards = (sel) => Array.from(s.querySelectorAll(sel)).map((a) => ({ cls: a.className, tag: (a.querySelector('.ware-tag') || {}).textContent || '', cat: a.querySelector('.ware-cat').textContent, name: a.querySelector('.ware-name').textContent, status: a.querySelector('.ware-status').textContent, verb: a.querySelector('.ware-verb').textContent, flavor: (a.querySelector('.ware-flavor') || {}).textContent || '', href: a.getAttribute('href') }));
    return { n: s.querySelector('.h2-n').textContent, intro: s.querySelector('.fam-intro').textContent, top: cards(':scope > .wares-list > .ware'), summary: (s.querySelector('.wares-locked > summary') || {}).textContent || '', stock: cards('.wares-locked .ware') };
  });
  const out = { errs };
  // every learnable entry that has wares: the counter must hold at most one created and at most one recommended, no duplicates with the stock
  const ids = await page.evaluate(() => Codex.all().filter((e) => e.kind === 'concept' || e.kind === 'section').map((e) => e.id));
  let checked = 0; const bad = [];
  for (const id of ids) {
    await page.evaluate((h) => { location.hash = h; }, '#/e/' + id);
    await page.waitForTimeout(120);
    const c = await readCounter();
    if (!c) continue;
    checked++;
    const created = c.top.filter((w) => w.tag === 'Created ware');
    const rec = c.top.filter((w) => w.tag === 'Recommended crafting');
    const all = c.top.concat(c.stock);
    const hrefs = new Set(all.map((w) => w.href));
    if (c.top.length > 2 || created.length > 1 || rec.length > 1 || c.top.length + c.stock.length !== Number(c.n) || hrefs.size !== all.length) bad.push({ id, c });
    if (created.some((w) => !/done/.test(w.cls))) bad.push({ id, why: 'created not done', c });
    if (rec.some((w) => /done/.test(w.cls) || !/ad/.test(w.cls))) bad.push({ id, why: 'recommended wrong class', c });
    // the created one must be unread when any unread crafted exists in the stock; the recommended must be ready when any ready exists in the stock
    if (created.length && /read$/.test(created[0].status) && !/unread$/.test(created[0].status) && c.stock.some((w) => /unread$/.test(w.status))) bad.push({ id, why: 'read created shown while an unread one waits', c });
    if (rec.length && /^locked/.test(rec[0].status) && c.stock.some((w) => w.status === 'ready to craft')) bad.push({ id, why: 'locked recommended while a ready one waits', c });
    if (c.stock.some((w) => w.tag)) bad.push({ id, why: 'tag in stock', c });
  }
  out.checked = checked; out.bad = bad.slice(0, 5); out.nbad = bad.length;
  // decay-rate in detail, before and after reading the created ware
  await page.evaluate((h) => { location.hash = h; }, '#/e/decay-rate');
  await page.waitForTimeout(300);
  out.decay = await readCounter();
  if (out.decay && out.decay.top[0]) {
    const href = out.decay.top[0].href;
    await page.evaluate((h) => { location.hash = h; }, href);
    await page.waitForTimeout(300);
    await page.evaluate((h) => { location.hash = h; }, '#/e/decay-rate');
    await page.waitForTimeout(300);
    out.decayAfterRead = await readCounter();
  }
  if (outdir) {
    await page.evaluate(() => { const s = document.getElementById('s-wares'); if (s) s.scrollIntoView(); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: outdir + '/wares_counter.png' });
    const phone = await ctx.newPage();
    await phone.setViewportSize({ width: 390, height: 844 });
    await phone.goto('http://127.0.0.1:8765/#/e/decay-rate', { waitUntil: 'domcontentloaded' });
    await phone.waitForTimeout(1500);
    await phone.evaluate(() => { const s = document.getElementById('s-wares'); if (s) s.scrollIntoView(); });
    await phone.waitForTimeout(200);
    await phone.screenshot({ path: outdir + '/wares_counter_phone.png' });
  }
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
