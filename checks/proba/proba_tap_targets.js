const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync('/home/claude/codex307/checks/mock_claude.js', 'utf8');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await ctx.addInitScript(MOCK); const pg = await ctx.newPage();
 await pg.goto('http://127.0.0.1:8787/#/'); await pg.waitForTimeout(1500);
 for (const r of ['#/', '#/tome/sz/6.3', '#/e/decay-rate', '#/review', '#/quests', '#/e/scully']) { await pg.evaluate((h) => { location.hash = h; }, r); await pg.waitForTimeout(800);
  const out = await pg.evaluate(() => { const res = []; for (const el of document.querySelectorAll('a, button, input, select, textarea, summary')) { const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue; if (r.width < 24 || r.height < 24) { const par = el.closest('label'); const pr = par ? par.getBoundingClientRect() : null; res.push(el.tagName.toLowerCase() + (el.type ? '[' + el.type + ']' : '') + '.' + (el.className || '').toString().split(' ')[0] + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + (pr ? ' label ' + Math.round(pr.width) + 'x' + Math.round(pr.height) : '') + ' "' + (el.textContent || el.value || el.name || '').trim().slice(0, 20) + '"' + ' pad:' + cs.padding); } } return res.slice(0, 14); });
  console.log(r); out.forEach((o) => console.log('   ', o)); }
 await b.close(); })();
