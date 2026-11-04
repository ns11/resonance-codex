// PROBA save/restore: act, reload, and see what comes back (the mock's database kept in localStorage, plus the page's own localStorage).
// Usage: node checks/proba/restore_check.js [port]   (default port 8765; restored after PROBA run 1)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = fs.readFileSync(path.join(__dirname, '..', 'mock_claude.js'), 'utf8');
// the same mock, with its database kept in localStorage under "__mock", so that it survives a reload
const MOCK = BASE
  .replace('const store = new Map(); const listeners = [];', "const store = new Map((() => { try { return JSON.parse(localStorage.getItem('__mock') || '[]'); } catch (e) { return []; } })()); const listeners = []; const persist = () => { try { localStorage.setItem('__mock', JSON.stringify([...store.entries()])); } catch (e) { /* storage refused */ } };")
  .split('setTimeout(notify, 0);').join('persist(); setTimeout(notify, 0);');
if (MOCK === BASE || !MOCK.includes('persist();')) throw new Error('mock_claude.js changed: the persistence patch did not apply');
const PORT = process.argv[2] || '8765';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/_blob/.test(m.text())) errs.push(m.text()); });
  const go = async (h, ms) => { await page.evaluate((x) => { location.hash = x; }, h); await page.waitForTimeout(ms || 600); };
  await page.goto('http://127.0.0.1:' + PORT + '/#/e/decay-rate', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const out = { errs };
  // 1. tick three derivation steps and pass the quiz
  const boxes = await page.$$('input[data-step]');
  for (const b of boxes.slice(0, 3)) await b.check();
  await page.waitForTimeout(300);
  const quiz = await page.evaluate(() => Codex.get('decay-rate').quiz.map((q) => q.answer));
  for (let qi = 0; qi < quiz.length; qi++) await page.check(`#q-decay-rate-${qi}-${quiz[qi]}`);
  await page.click('form[data-quiz] button[type=submit]');
  await page.waitForTimeout(500);
  out.before = await page.evaluate(() => ({ steps: Codex.stepsDone('decay-rate'), level: Codex.level('decay-rate'), quiz: document.querySelector('.quiz-result').textContent }));
  // 2. a new quest
  await go('#/quests');
  await page.fill('#q-new-title', 'PROBA restore quest');
  await page.click('form[data-q-new] button[type=submit]');
  await page.waitForTimeout(600);
  out.questBefore = await page.evaluate(() => document.getElementById('codex-main').innerText.includes('PROBA restore quest'));
  // 3. the lamp: bright flame, light, pray once, leave it burning
  await go('#/lamp/ficek');
  await page.click('[data-lamp="light"]'); await page.waitForTimeout(300);
  await page.selectOption('[data-lamp-tier]', 'complex');
  await page.fill('#pray-text', 'As Ficek: a prayer that must survive a reload.');
  await page.click('form[data-lamp-form] button[type="submit"]'); await page.waitForTimeout(900);
  out.lampBefore = await page.evaluate(() => ({ turns: document.querySelectorAll('.pray-turn').length, tier: document.querySelector('[data-lamp-tier]').value }));
  // 4. read a crafted ware
  await go('#/e/cr-damped-rabi', 800);
  out.readBefore = await page.evaluate(() => localStorage.getItem('codex:read:cr-damped-rabi'));
  // 5. wait for the write queue to flush, then reload
  await page.waitForTimeout(3500);
  out.storeKeys = await page.evaluate(() => JSON.parse(localStorage.getItem('__mock') || '[]').map((x) => x[0]));
  await page.goto('http://127.0.0.1:' + PORT + '/#/e/decay-rate', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  out.after = await page.evaluate(() => ({ steps: Codex.stepsDone('decay-rate'), level: Codex.level('decay-rate'), ticked: document.querySelectorAll('input[data-step]:checked').length, quizText: (document.querySelector('[data-quiz-best]') || {}).textContent }));
  await go('#/quests', 900);
  out.questAfter = await page.evaluate(() => document.getElementById('codex-main').innerText.includes('PROBA restore quest'));
  await go('#/lamp/ficek', 1200);
  out.lampAfter = await page.evaluate(() => ({ burning: !!document.querySelector('form[data-lamp-form]'), turns: document.querySelectorAll('.pray-turn').length, tier: (document.querySelector('[data-lamp-tier]') || {}).value, head: (document.querySelector('.prayer-head') || {}).innerText }));
  if (!out.lampAfter.burning) { const b = await page.$('[data-lamp="light"]'); if (b) { await b.click(); await page.waitForTimeout(600); out.lampAfterLight = await page.evaluate(() => ({ turns: document.querySelectorAll('.pray-turn').length, tier: (document.querySelector('[data-lamp-tier]') || {}).value })); } }
  await go('#/', 800);
  out.homeAfter = await page.evaluate(() => ({ crier: (document.querySelector('.bark') || document.querySelector('.crier') || {}).innerText, read: localStorage.getItem('codex:read:cr-damped-rabi'), studied: (document.getElementById('codex-main').innerText.match(/(\d+)\s*Studied|Studied\s*\n?\s*(\d+)/) || [])[0] }));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})();
