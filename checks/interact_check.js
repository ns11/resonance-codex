const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto('http://127.0.0.1:8765/#/e/decay-rate', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.MathJax.startup.promise);
  await page.waitForTimeout(500);
  const lvl = () => page.evaluate(() => document.querySelector('.entry-head [data-level-for]').textContent.trim());
  const out = { start: await lvl() };
  // tick all steps
  const boxes = await page.$$('input[data-step]');
  for (const b of boxes) await b.check();
  await page.waitForTimeout(300);
  out.afterSteps = await lvl();
  out.stepsText = await page.textContent('[data-steps-for]');
  out.deeperOpen = await page.evaluate(() => document.querySelector('[data-gate="deeper"]').dataset.open);
  // answer quiz: wrong first, then right
  const quiz = await page.evaluate(() => Codex.get('decay-rate').quiz.map((q) => q.answer));
  for (let qi = 0; qi < quiz.length; qi++) {
    const wrong = (quiz[qi] + 1) % 4;
    await page.check(`#q-decay-rate-${qi}-${qi < 2 ? wrong : quiz[qi]}`);
  }
  await page.click('form[data-quiz] button[type=submit]');
  await page.waitForTimeout(200);
  out.fail = await page.textContent('.quiz-result');
  out.levelAfterFail = await lvl();
  for (let qi = 0; qi < quiz.length; qi++) await page.check(`#q-decay-rate-${qi}-${quiz[qi]}`);
  await page.click('form[data-quiz] button[type=submit]');
  await page.waitForTimeout(400);
  out.pass = await page.textContent('.quiz-result');
  out.levelAfterPass = await lvl();
  out.masteryOpen = await page.evaluate(() => document.querySelector('[data-gate="mastery"]').dataset.open);
  out.gateMath = await page.evaluate(() => document.querySelector('[data-gate="deeper"]').querySelectorAll('mjx-container').length);
  out.overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  out.whyVisible = await page.evaluate(() => Array.from(document.querySelectorAll('.why')).filter((w) => !w.hidden).length);
  await page.screenshot({ path: OUT + '/phone-quiz.png' });
  // unlock everything for every entry and check overflow of gated content on phone
  const ids = await page.evaluate(() => Codex.all().filter((e) => e.integrated && (e.kind === 'concept' || e.kind === 'section')).map((e) => e.id));
  out.unlocked = {};
  for (const id of ids) {
    await page.evaluate((id) => { const e = Codex.get(id); const steps = {}; e.steps.forEach((_, i) => { steps[i] = true; }); Codex.Store.update(id, { steps, quizPassed: true, quizBest: 1 }); location.hash = '#/e/' + id; }, id);
    await page.waitForTimeout(300);
    await page.evaluate(() => window.MathJax.startup.promise);
    // reveal all quiz explanations as well
    await page.evaluate(() => document.querySelectorAll('.why').forEach((w) => { w.hidden = false; }));
    await page.evaluate(async () => { for (let i = 0; i < 3; i++) { try { await MathJax.typesetPromise(); return; } catch (e) { await new Promise((r) => setTimeout(r, 400)); } } }); /* 3.0.7: a typeset that meets a page the app has just redrawn is tried again */
    await page.waitForTimeout(300);
    out.unlocked[id] = await page.evaluate(() => ({
      level: document.querySelector('.entry-head [data-level-for]').textContent.trim(),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      wide: Array.from(document.querySelectorAll('#codex-main *')).filter((el) => el.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && !el.closest('.mdisp')).slice(0, 3).map((el) => el.tagName + ' ' + (el.textContent || '').slice(0, 50)),
      merr: document.querySelectorAll('mjx-merror').length,
    }));
  }
  // dashboard reflects mastery
  await page.evaluate(() => { location.hash = '#/'; });
  await page.waitForTimeout(300);
  out.dashMastered = await page.evaluate(() => document.querySelector('.levelbox.lvl-4 .lb-n').textContent);
  // search
  await page.fill('#codex-search', 'interaction');
  await page.waitForTimeout(150);
  out.search = await page.evaluate(() => Array.from(document.querySelectorAll('#codex-search-results .hit')).map((h) => h.textContent.trim()).slice(0, 5));
  // request flow without the claude runtime: copy box or clipboard
  await page.evaluate(() => { location.hash = '#/e/interaction-picture'; });
  await page.waitForTimeout(300);
  await page.click('button[data-request]');
  await page.waitForTimeout(300);
  out.copyBox = await page.evaluate(() => { const b = document.getElementById('codex-copybox'); return b && !b.hidden ? b.querySelector('textarea').value : (document.getElementById('codex-toast') || {}).textContent; });
  await page.screenshot({ path: OUT + '/phone-request.png' });
  // tome focus + reveal toggle
  await page.evaluate(() => { location.hash = '#/tome/sz/10.2'; });
  await page.waitForTimeout(300);
  out.focus = await page.evaluate(() => document.querySelector('.sec.focus') && document.querySelector('.sec.focus').textContent.trim().slice(0, 80));
  await page.click('#reveal-toggle');
  await page.waitForTimeout(300);
  out.revealed = await page.evaluate(() => document.querySelector('.sec.focus .st').textContent);
  await page.screenshot({ path: OUT + '/phone-tome-reveal.png' });
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
