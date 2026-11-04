// 3.0.2: the three High fixes of PROBA run 2. Every failed expectation goes into `errs`.
//  1. the printed entry header: the page is printed to PDF with background graphics OFF, in light and dark, and the first page is rasterised and looked at
//  2. a passed quiz keeps its ticks, marks, explanations and result after the pass is saved and after a later database snapshot rebuilds the page
//  3. the Ficek–Tanaś review lists all eleven sections with the titles of the arXiv version
// Usage: node checks/fixes_302.js [out folder] [port]   (the port serves the tree under test; default 8765)
const { chromium } = require('playwright');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const outdir = process.argv[2] || '';
const PORT = process.argv[3] || '8765';
const BASE = 'http://127.0.0.1:' + PORT + '/';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fixes302-'));

// page 1 of a PDF as grey pixels (pdftoppm -gray, PGM); the share of mid-tone pixels in the top quarter tells a gilt flood from clean print
function raster(pdf) {
  const stem = path.join(tmp, path.basename(pdf, '.pdf'));
  execFileSync('pdftoppm', ['-r', '50', '-f', '1', '-l', '1', '-gray', pdf, stem]);
  const f = fs.readdirSync(tmp).find((n) => n.startsWith(path.basename(stem)) && n.endsWith('.pgm'));
  const buf = fs.readFileSync(path.join(tmp, f));
  // P5 header: "P5\n<w> <h>\n255\n"
  let pos = 0; const tok = [];
  while (tok.length < 4) { while (/\s/.test(String.fromCharCode(buf[pos]))) pos++; let t = ''; while (!/\s/.test(String.fromCharCode(buf[pos]))) t += String.fromCharCode(buf[pos++]); tok.push(t); }
  pos++;
  const w = Number(tok[1]); const h = Number(tok[2]); const px = buf.subarray(pos);
  const top = Math.floor(h * 0.25); let mid = 0; let dark = 0;
  for (let i = 0; i < w * top; i++) { const v = px[i]; if (v < 215 && v > 60) mid++; if (v <= 60) dark++; }
  return { w, h, mid: mid / (w * top), dark: dark / (w * top) };
}

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const out = {};
  const expect = (ok, what) => { if (!ok) errs.push('FAILED: ' + what); };

  // 1. print, background graphics off, both themes
  out.print = {};
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
    await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
    await p.goto(BASE + '#/e/decay-rate', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await p.emulateMedia({ media: 'print' });
    const pdf = path.join(tmp, 'print_' + theme + '.pdf');
    await p.pdf({ path: pdf, printBackground: false, format: 'A4' });
    out.print[theme] = raster(pdf);
    if (outdir) { execFileSync('pdftoppm', ['-r', '70', '-f', '1', '-l', '1', '-png', pdf, path.join(outdir, 'print_' + theme)]); }
    // the frame pseudo-element is gone in print and the title is dark ink on white
    const st = await p.evaluate(() => { const h = document.querySelector('.entry-head'); const b = getComputedStyle(h, '::before'); return { before: b.display, title: getComputedStyle(h.querySelector('h1')).color }; });
    out.print[theme + 'Style'] = st;
    expect(st.before === 'none', 'print ' + theme + ': the .ornate::before frame is display:none (got ' + st.before + ')');
    expect(out.print[theme].mid < 0.12, 'print ' + theme + ': the top quarter of page 1 has no flood of mid-tone pixels (share ' + out.print[theme].mid.toFixed(3) + ')');
    expect(out.print[theme].dark > 0.002, 'print ' + theme + ': page 1 has dark text in the header area (share ' + out.print[theme].dark.toFixed(4) + ')');
    await ctx.close();
  }

  // 2. the quiz after a pass
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
    await p.goto(BASE + '#/e/decay-rate', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const e = window.Codex.get('decay-rate'); e.quiz.forEach((q, qi) => { document.getElementById('q-decay-rate-' + qi + '-' + q.answer).checked = true; }); });
    await p.click('form[data-quiz="decay-rate"] button[type=submit]');
    const snap = () => p.evaluate(() => { const f = document.querySelector('form[data-quiz="decay-rate"]'); return f ? { result: f.querySelector('.quiz-result').textContent, ok: f.querySelectorAll('fieldset.ok').length, why: f.querySelectorAll('.why:not([hidden])').length, checked: f.querySelectorAll('input:checked').length, n: window.Codex.get('decay-rate').quiz.length } : null; });
    out.quiz = [];
    for (const ms of [200, 1000, 2200]) { await p.waitForTimeout(ms === 200 ? 200 : 900); const s = await snap(); out.quiz.push([ms, s]); }
    for (const [ms, s] of out.quiz) {
      expect(s && /Passed/.test(s.result), 'quiz at ' + ms + ' ms still shows the result "Passed"');
      expect(s && s.ok === s.n && s.checked === s.n && s.why === s.n, 'quiz at ' + ms + ' ms keeps ' + (s && s.n) + ' ticks, marks and explanations (got ' + JSON.stringify(s) + ')');
    }
    // a later rebuild of the page (what any database snapshot does) keeps it too
    await p.evaluate(() => window.CodexView.refresh());
    await p.waitForTimeout(300);
    out.quizAfterRefresh = await snap();
    expect(out.quizAfterRefresh && /Passed/.test(out.quizAfterRefresh.result) && out.quizAfterRefresh.checked === out.quizAfterRefresh.n, 'quiz after a forced page rebuild keeps its result and ticks');
    // Clear still clears, and a rebuild after Clear does not bring the answers back
    await p.click('[data-quiz-reset="decay-rate"]');
    await p.evaluate(() => window.CodexView.refresh());
    await p.waitForTimeout(300);
    const cleared = await snap();
    out.quizCleared = cleared;
    expect(cleared && cleared.checked === 0 && cleared.result === '' && cleared.why === 0, 'after Clear and a rebuild the quiz stays empty');
    // moving to another page does not carry answers over
    await p.evaluate(() => { document.getElementById('q-decay-rate-0-' + window.Codex.get('decay-rate').quiz[0].answer).checked = true; location.hash = '#/e/rabi-oscillation'; });
    await p.waitForTimeout(600);
    await p.evaluate(() => { location.hash = '#/e/decay-rate'; });
    await p.waitForTimeout(700);
    const back = await snap();
    expect(back && back.checked === 0, 'a quiz left half-answered on another page is not restored when coming back');
    await ctx.close();
  }

  // 3. Ficek–Tanaś: eleven sections, the arXiv titles
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
    await p.goto(BASE + '#/', { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1500);
    const want = ['Introduction', 'Time evolution of a collective atomic system', 'Entangled atomic states', 'Quantum beats', 'Nonclassical states of light', 'Quantum interference of optical fields', 'Selective excitation of the collective atomic states', 'Detection of the entangled states', 'Two-photon entangled states', 'Mapping of entangled states of light on atoms', 'Conclusions'];
    const got = await p.evaluate(() => { const b = (window.CodexBooks && window.CodexBooks.all && window.CodexBooks.all()) || null; return b ? JSON.stringify(b) : null; });
    out.ficek = {};
    let chapters = null; let check = '';
    if (got) { const list = JSON.parse(got); const f = list.find((x) => x.id === 'ficek-tanas' && x.chapters); chapters = f && f.chapters; check = f ? f.check : ''; }
    if (!chapters) {
      // fall back to the page: the Chamber of Ficek's cell lists the review with its chapters
      await p.evaluate(() => { location.hash = '#/e/ficek'; }); await p.waitForTimeout(900);
      await p.evaluate(() => { document.querySelectorAll('details').forEach((d) => { d.open = true; }); });
      const txt = await p.evaluate(() => document.body.innerText);
      out.ficek.fromPage = true;
      want.forEach((t) => expect(txt.includes(t), 'Ficek–Tanaś: section title "' + t + '" is on the page'));
      ['Collective spontaneous emission', 'Resonance fluorescence of two atoms', 'Nonclassical effects: squeezing and photon antibunching of two atoms'].forEach((t) => expect(!txt.includes(t), 'Ficek–Tanaś: the invented title "' + t + '" is gone'));
      expect(!/sections 5–7 are paraphrased/.test(txt), 'Ficek–Tanaś: the old "sections 5–7 are paraphrased" note is gone');
    } else {
      out.ficek.titles = chapters.map((c) => c.num + ' ' + c.title);
      expect(chapters.length === 11, 'Ficek–Tanaś lists 11 sections (got ' + chapters.length + ')');
      want.forEach((t, i) => expect(chapters[i] && chapters[i].title === t, 'Ficek–Tanaś section ' + (i + 1) + ' is "' + t + '" (got "' + (chapters[i] && chapters[i].title) + '")'));
      expect(/1–11/.test(check) && !/5–7 are paraphrased/.test(check), 'Ficek–Tanaś check note names sections 1–11 (got "' + check + '")');
    }
    await ctx.close();
  }

  out.errs = errs;
  console.log(JSON.stringify(out, null, 1));
  fs.rmSync(tmp, { recursive: true, force: true });
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})();
