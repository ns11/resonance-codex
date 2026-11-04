const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const out = {};
  // ---------- desktop, mouse ----------
  for (const scheme of ['dark', 'light']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('http://127.0.0.1:8765/#/e/secular-approximation', { waitUntil: 'networkidle' });
    await page.evaluate(() => window.MathJax.startup.promise); await page.waitForTimeout(400);
    const link = await page.$('section.prose a.kw[data-id="decay-rate"]');
    await link.scrollIntoViewIfNeeded(); await page.waitForTimeout(100);
    await link.hover(); await page.waitForTimeout(700);
    const card = await page.evaluate(() => { const t = document.querySelector('.kw-tip'); if (!t) return null; const r = t.getBoundingClientRect(); return { name: t.querySelector('.tip-name').textContent, level: t.querySelector('.tip-level').textContent, math: t.querySelectorAll('mjx-container').length, nested: Array.from(t.querySelectorAll('a[data-id]')).map((a) => a.textContent + '→' + a.dataset.id), inView: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, visible: getComputedStyle(t).visibility, opacity: getComputedStyle(t).opacity }; });
    out[scheme + ':card'] = card;
    await page.screenshot({ path: `${OUT}/tip-${scheme}-1.png` });
    // move into the card and hover a nested keyword
    const nested = await page.$('.kw-tip a[data-id="superradiance"]');
    if (nested) {
      const box = await nested.boundingBox();
      const tipBox = await (await page.$('.kw-tip')).boundingBox();
      await page.mouse.move(tipBox.x + 20, tipBox.y + 20, { steps: 6 });
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
      await page.waitForTimeout(800);
      out[scheme + ':stack'] = await page.evaluate(() => Array.from(document.querySelectorAll('.kw-tip')).map((t) => t.dataset.depth + ':' + t.querySelector('.tip-name').textContent));
      await page.screenshot({ path: `${OUT}/tip-${scheme}-2.png` });
      // back into card 0 body: nested card should close, card 0 stays
      await page.mouse.move(tipBox.x + 30, tipBox.y + tipBox.height - 12, { steps: 4 });
      await page.waitForTimeout(700);
      out[scheme + ':afterBack'] = await page.evaluate(() => Array.from(document.querySelectorAll('.kw-tip')).map((t) => t.dataset.depth));
    }
    // leave everything
    await page.mouse.move(5, 880, { steps: 5 }); await page.waitForTimeout(700);
    out[scheme + ':afterLeave'] = await page.evaluate(() => document.querySelectorAll('.kw-tip').length);
    // the native title tooltip is gone
    out[scheme + ':titles'] = await page.evaluate(() => document.querySelectorAll('a.kw[title]').length);
    // a discovered keyword card
    await page.evaluate(() => { location.hash = '#/e/sz-6-3'; }); await page.waitForTimeout(500);
    const fog = await page.$('section.prose a.kw-fog');
    await fog.scrollIntoViewIfNeeded(); await fog.hover(); await page.waitForTimeout(600);
    out[scheme + ':fogCard'] = await page.evaluate(() => { const t = document.querySelector('.kw-tip'); return t && t.innerText.replace(/\n+/g, ' | ').slice(0, 260); });
    await page.screenshot({ path: `${OUT}/tip-${scheme}-fog.png` });
    // Escape closes
    await page.keyboard.press('Escape'); await page.waitForTimeout(150);
    out[scheme + ':afterEsc'] = await page.evaluate(() => document.querySelectorAll('.kw-tip').length);
    // click navigates on desktop
    const kl = await page.$('section.prose a.kw-known');
    if (kl) { const id = await kl.getAttribute('data-id'); await kl.click(); await page.waitForTimeout(300); out[scheme + ':clickNav'] = (await page.evaluate(() => location.hash)) === '#/e/' + id; }
    out[scheme + ':errors'] = errs;
    await ctx.close();
  }
  // ---------- phone, touch ----------
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/#/e/decay-rate', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.MathJax.startup.promise); await page.waitForTimeout(400);
  const l = await page.$('section.prose a.kw[data-id="master-equation"]');
  await l.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await l.tap(); await page.waitForTimeout(600);
  out['touch:firstTap'] = await page.evaluate(() => ({ hash: location.hash, cards: document.querySelectorAll('.kw-tip').length, hint: (document.querySelector('.tip-hint') || {}).textContent, inView: (() => { const t = document.querySelector('.kw-tip'); if (!t) return null; const r = t.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })() }));
  await page.screenshot({ path: `${OUT}/tip-phone.png` });
  await l.tap(); await page.waitForTimeout(500);
  out['touch:secondTap'] = await page.evaluate(() => ({ hash: location.hash, cards: document.querySelectorAll('.kw-tip').length }));
  // tap outside closes
  await page.evaluate(() => { location.hash = '#/e/decay-rate'; }); await page.waitForTimeout(500);
  const l2 = await page.$('section.prose a.kw');
  await l2.scrollIntoViewIfNeeded(); await page.waitForTimeout(200); await l2.tap(); await page.waitForTimeout(500);
  await page.touchscreen.tap(195, 120); await page.waitForTimeout(300);
  out['touch:tapOutside'] = await page.evaluate(() => document.querySelectorAll('.kw-tip').length);
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
