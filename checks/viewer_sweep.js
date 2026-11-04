// 3.0.7 (from PROBA logic 3.0.6): viewer vs keeper over every entry, place, lamp and lore route; a campaign word in a viewer's page is an error. Usage: node checks/viewer_sweep.js [out] [port]
const { chromium } = require('playwright');
const fs = require('fs');
const MOCK = fs.readFileSync(__dirname + '/mock_claude.js', 'utf8');
const VIEWER = MOCK.replace('isOwner: async () => true', 'isOwner: async () => false').replace('canEdit: async () => true', 'canEdit: async () => false');
const PORT = process.argv[3] || '8765';
const CAMP = /CRETD|campaign|signed contract|Alexander the Great|kept off it|vacant (sixth|seventh)|Bill Gates|Gates[’']s|Fable cell|Musk[’']s|Steve Jobs|Elon Musk|Epstein/i;
(async () => {
  const b = await chromium.launch();
  const out = { leaks: [], diff: [], tips: [], errs: [] };
  const run = async (tag, owner) => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(owner ? MOCK : VIEWER);
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => out.errs.push(tag + ' ' + String(e).slice(0, 160)));
    await pg.goto('http://127.0.0.1:' + PORT + '/#/'); await pg.waitForTimeout(1600);
    const reg = await pg.evaluate(() => ({ ids: window.Codex.every().map((e) => [e.id, e.lore, e.kind]), places: window.Codex.packs().flatMap((p) => window.Codex.places(p.id).map((q) => [p.id, q.id])), lores: window.Codex.packs().map((p) => p.id) }));
    const res = {};
    const routes = ['#/', '#/cyclopedia', '#/figures', '#/lexicon', '#/tomes', '#/literature', '#/library', '#/lores', '#/releases', '#/quests', '#/review', '#/dossier', '#/craft', '#/search'];
    for (const [id] of reg.ids) routes.push('#/e/' + id, '#/lamp/' + id);
    for (const [lore, pid] of reg.places) routes.push('#/library/' + pid);
    for (const l of reg.lores) routes.push('#/lore/' + l);
    for (const r of routes) {
      await pg.evaluate((h) => { location.hash = h; }, r); await pg.waitForTimeout(110);
      const o = await pg.evaluate(() => { const m = document.getElementById('codex-main'); return { t: m ? m.innerText : '', h: location.hash, tips: Array.from(document.querySelectorAll('[title],[data-tip]')).map((e) => (e.getAttribute('title') || e.getAttribute('data-tip') || '')).filter(Boolean).join(' | '), links: Array.from(document.querySelectorAll('a[href^="#/"]')).map((a) => a.getAttribute('href')).join(' ') }; });
      res[r] = o;
    }
    // menus
    await ctx.close();
    return { reg, res };
  };
  const K = await run('keeper', true);
  const V = await run('viewer', false);
  //, JSON.stringify({ kreg: K.reg, vreg: V.reg, krouteN: Object.keys(K.res).length, vres: Object.fromEntries(Object.entries(V.res).map(([k, v]) => [k, { h: v.h, n: v.t.length, head: v.t.slice(0, 90).replace(/\n+/g, ' | ') }])) }));
  const hiddenIds = new Set();
  for (const [r, v] of Object.entries(V.res)) {
    if (r === '__menu') continue;
    const hit = (v.t + ' ' + v.tips).match(CAMP) || (r !== '#/releases' ? (v.t + ' ' + v.tips).match(/Iovu/) : null); /* the codename Iovu is the release stamp: it is read in the release log only */
    if (hit) out.leaks.push(r + ' -> ' + v.h + ' :: ' + hit[0] + ' :: ' + v.t.slice(Math.max(0, v.t.search(CAMP) - 40), v.t.search(CAMP) + 80).replace(/\n+/g, ' | '));
    for (const l of (v.links || '').split(' ')) { const m = l.match(/^#\/(e|lamp)\/([a-z0-9-]+)/); if (m) { const k = K.res['#/e/' + m[2]]; const vv = V.res['#/e/' + m[2]]; if (vv && /Not in the codex|Not found/.test(vv.t) && !/Not in the codex|Not found/.test((k || { t: '' }).t)) out.tips.push(r + ' links to hidden ' + l); } }
  }
  // 3.1.1: every note of every release, as a viewer reads the log, must be free of the board's words (a filter by a few names missed the sixth member's note in 3.1.0)
  { const rv = (V.res['#/releases'] || {}).t || ''; const BOARDISH = /\bmembers?\b|\blens\b|\bcells?\b|\bBannon\b|\bdebt\b|trust rule|\bGates\b|\bJobs\b|\bMusk\b|\bFable\b|Epstein|\bstandings\b|\bseries\b|\bboard\b|\bwindows?\b.*\bdates\b|\bagents?\b/i; const bm = rv.match(BOARDISH); if (bm) out.leaks.push('#/releases -> a viewer reads "' + bm[0] + '" :: ' + rv.slice(Math.max(0, rv.search(BOARDISH) - 60), rv.search(BOARDISH) + 80).replace(/\n+/g, ' | ')); if (!/3\.1\.1/.test(rv) && /3\.1\.1/.test(String((K.res['#/releases'] || {}).t))) { /* a release whose notes are all the keeper's prints one line */ if (!/kept by the keeper/.test(rv)) out.leaks.push('#/releases -> the 3.1.1 entry shows neither a harmless note nor the keeper line'); } }
  // routes that exist for the keeper and are missing for the viewer: should be the campaign set only
  for (const [r, k] of Object.entries(K.res)) { if (r === '__menu') continue; const v = V.res[r]; const kv = !/Not in the codex|Not found|No such place|No lamp here/.test(k.t); const vm = /Not in the codex|Not found|No such place|No lamp here|^$/.test(v.t) || v.h !== r; if (kv && vm) out.diff.push(r); }
  const errsOut = out.errs.concat(out.leaks.map((x) => 'LEAK ' + x)).concat(out.tips.map((x) => 'LINK ' + x));
  const expected = { hiddenForViewer: out.diff.length };
  if (out.diff.length < 90) errsOut.push('FEWER hidden routes than expected: ' + out.diff.length);
  console.log(JSON.stringify({ routes: Object.keys(K.res).length, hiddenForViewer: expected.hiddenForViewer, errs: errsOut.slice(0, 40) }, null, 1));
  await b.close(); process.exit(errsOut.length ? 1 : 0);

})();
