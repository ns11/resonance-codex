/* Resonance Codex — lores: the worlds the engine can load.
   The built-in lore (Resonance, quantum optics) comes from codex/lores/*.js. Other lores are documents in the
   artifact db, collection "lores" (read by everyone, written by the owner): the tomes, the families, the first
   keywords, the library and its namesakes, the look and the context Claude gets. A new lore is drafted in the
   page: the keeper names it, uploads the tomes as PDFs, the browser reads their tables of contents, and Claude
   (through the sample capability) writes the draft, which stays marked "draft" until Claude checks it in the chat.
   The lore menu at the left of the binding switches between them; each lore keeps its own progress. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;
  const Store = C.Store;

  const ORNAMENTS = {
    spectrum: '<path d="M7 13V9.5M15 13V6M23 13V1M31 13V6M39 13V9.5M1 13h44"/>',
    orbits: '<ellipse cx="23" cy="7" rx="20" ry="4.5"/><ellipse cx="23" cy="7" rx="9" ry="6"/><circle cx="23" cy="7" r="1.6"/>',
    braces: '<path d="M4 2c4 0 5 2 5 5s-1 5 4 5c-5 0-4 2-4 5s-1 5-5 5M42 2c-4 0-5 2-5 5s1 5-4 5c5 0 4 2 4 5s1 5 5 5M18 7h10"/>',
    lattice: '<path d="M3 3h40M3 7h40M3 11h40M9 1v12M23 1v12M37 1v12"/>',
    wave: '<path d="M1 7c4-6 7-6 11 0s7 6 11 0 7-6 11 0 7 6 11 0"/>',
    rings: '<circle cx="23" cy="7" r="6"/><circle cx="23" cy="7" r="3"/><path d="M1 7h12M33 7h12"/>',
  };
  function ornament(kind, where) {
    const d = ORNAMENTS[kind] || ORNAMENTS.spectrum;
    const vb = kind === 'braces' || kind === 'lattice' ? '0 0 46 24' : '0 0 46 14';
    return '<svg class="orn' + (where === 'brand' ? ' orn-brand' : '') + '" viewBox="' + vb + '" aria-hidden="true">' + d + '</svg>';
  }

  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const MAX_PDF = 20 * 1024 * 1024;
  const Lo = { db: null, owner: false, assets: null, sample: null, live: 'pending', docs: new Map(), loaded: false, busy: null, form: null, open: false, verifyBusy: false };
  let root = null;
  let args = [];

  const clean = (s, n) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 300) : '');
  const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  const slug = (s, n) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, n || 40);
  const idOk = (s) => typeof s === 'string' && /^[a-z0-9-]+$/.test(s) && s.length <= 40;
  const num = (x, d) => (Number.isFinite(Number(x)) ? Number(x) : d);
  const plain = (s) => String(s || '').replace(/<[^>]*>/g, '');

  /* a lore document from the db (or from Claude) -> a pack the engine accepts; everything escaped at render time */
  function sanitizePack(d) {
    if (!d || !idOk(d.id) || d.id === C.DEFAULT_LORE) return null;
    const tomes = arr(d.tomes, 8).map((t, ti) => {
      const id = idOk(t && t.id) ? t.id : 'tome' + (ti + 1);
      const chapters = arr(t && t.chapters, 60).map((c, ci) => ({
        num: clean(c && c.num, 8) || String(ci + 1), title: clean(c && c.title, 200) || 'Chapter ' + (ci + 1), pages: clean(c && c.pages, 20),
        sections: arr(c && c.sections, 60).map((s) => ({ num: clean(s && s.num, 12), title: clean(s && s.title, 200), page: num(s && s.page, ''), check: clean(s && s.check, 200) })).filter((s) => s.num && s.title),
      })).filter((c) => c.title);
      return { id, short: clean(t && t.short, 60) || 'Tome ' + (ti + 1), title: clean(t && t.title, 200) || 'Untitled', authors: clean(t && t.authors, 200), publisher: clean(t && t.publisher, 120), pages: clean(t && t.pages, 40),
        sectionsMapped: chapters.some((c) => c.sections.length), numbering: 'printed', sources: [], notes: arr(t && t.notes, 4).map((x) => clean(x, 300)), chapters };
    }).filter((t) => t.chapters.length);
    const families = arr(d.families, 12).map((f) => ({ id: idOk(f && f.id) ? f.id : slug(f && f.name) || 'family', name: clean(f && f.name, 60) || 'Family', hint: clean(f && f.hint, 200) })).filter((f) => f.id);
    const famIds = new Set(families.map((f) => f.id));
    const keywords = arr(d.keywords, 200).map((k) => ({ id: idOk(k && k.id) ? k.id : slug(k && k.name), name: clean(k && k.name, 100), teaser: clean(k && k.teaser, 300), family: famIds.has(k && k.family) ? k.family : 'uncharted',
      tome: clean(k && k.tome, 40), num: clean(k && k.num, 12), page: num(k && k.page, '') })).filter((k) => k.id && k.name && k.id !== 'uncharted');
    const familyOf = {}; for (const k of keywords) familyOf[k.id] = k.family;
    const place = (p, depth) => {
      if (!p || typeof p !== 'object' || depth > 4) return null;
      const kind = ['wing', 'room', 'hall', 'chamber', 'altar', 'cell'].includes(p.kind) ? p.kind : depth === 0 ? 'wing' : 'room';
      return { id: idOk(p.id) ? p.id : slug(p.name) || 'place', kind, name: clean(p.name, 80) || 'Place', role: ['open', 'own', 'hidden'].includes(p.role) ? p.role : (kind === 'wing' ? undefined : 'open'),
        year: num(p.year, ''), figures: arr(p.figures, 4).filter(idOk), blurb: clean(p.blurb, 400), secret: p.secret === true, roughs: ['known', 'unknown', 'monk'].includes(p.roughs) ? p.roughs : undefined, monk: idOk(p.monk) ? p.monk : undefined,
        children: arr(p.children, 12).map((c) => place(c, depth + 1)).filter(Boolean) };
    };
    const lib = d.library && typeof d.library === 'object' ? { id: idOk(d.library.id) ? d.library.id : 'library', kind: 'library', name: clean(d.library.name, 80) || 'The Library', blurb: clean(d.library.blurb, 500), places: arr(d.library.places, 8).map((p) => place(p, 0)).filter(Boolean) } : null;
    const figures = arr(d.figures, 40).map((f) => ({ id: idOk(f && f.id) ? f.id : slug(f && f.name), name: clean(f && f.name, 100), aliases: arr(f && f.aliases, 6).map((a) => clean(a, 80)).filter((a) => a.length > 2), years: clean(f && f.years, 60), role: clean(f && f.role, 120), place: clean(f && f.place, 60),
      teaser: clean(f && f.teaser, 300), bio: arr(f && f.bio, 4).map((x) => clean(x, 1500)), why: clean(f && f.why, 600), works: arr(f && f.works, 6).map((w) => ({ year: num(w && w.year, ''), title: clean(w && w.title, 200), venue: clean(w && w.venue, 200), note: clean(w && w.note, 200) })).filter((w) => w.title),
      kin: f && f.kin === true, hall: clean(f && f.hall, 20), related: arr(f && f.related, 8).filter(idOk), links: [] })).filter((f) => f.id && f.name);
    const look = d.look && typeof d.look === 'object' ? { accent: V.ACCENTS.includes(d.look.accent) ? d.look.accent : 'gilt', ornament: ORNAMENTS[d.look.ornament] ? d.look.ornament : 'spectrum' } : { accent: 'gilt', ornament: 'spectrum' };
    const sections = arr(d.sections, 8).filter((x) => ['bestiary', 'figures', 'library', 'literature', 'crafted', 'tomes'].includes(x));
    const journal = d.journal === false ? [] : arr(d.journal, 4).filter((x) => ['overview', 'quests', 'review', 'dossier'].includes(x));
    return {
      id: d.id, name: clean(d.name, 80) || 'Untitled lore', short: clean(d.short, 30) || clean(d.name, 30) || 'Lore', subject: clean(d.subject, 120), tagline: clean(d.tagline, 400), prompt: clean(d.prompt, 600),
      look, tomes, families: families.concat([{ id: 'uncharted', name: 'Uncharted', hint: 'Keywords not placed in a family yet.' }]), familyOf, keywords, figures,
      sections: sections.length ? sections : ['bestiary', 'figures', 'library', 'literature', 'crafted', 'tomes'], journal: d.journal === undefined ? ['overview', 'quests', 'review', 'dossier'] : journal,
      suggested: arr(d.suggested, 8).map((s) => ({ tome: clean(s && s.tome, 40), num: clean(s && s.num, 12), why: clean(s && s.why, 300) })).filter((s) => s.tome && s.num),
      library: lib, context: clean(d.context, 3000), bookNames: tomes.map((t) => t.short).join(' | ') + ' | other', how: arr(d.how, 6).map((x) => esc(clean(x, 400))),
      status: d.status === 'verified' ? 'verified' : 'draft', created: clean(d.created, 30), by: clean(d.by, 30), builtin: false,
    };
  }
  function install(p) {
    if (!C.addPack(p)) return;
    const day = p.created ? p.created.slice(0, 10) : C.today();
    for (const k of p.keywords) C.upsert({ id: p.id + '-' + k.id, kind: 'concept', lore: p.id, name: k.name, aliases: [], integrated: null, teaser: k.teaser, family: k.family,
      found: k.tome ? [{ tome: k.tome, num: k.num, page: k.page, note: 'Named in the drafted lore.' }] : [{ session: true, note: 'Named in the drafted lore.' }], readNext: [] });
    for (const f of p.figures) C.upsert(Object.assign({ kind: 'figure', lore: p.id, integrated: day, steps: [], quiz: [], found: [] }, f, { related: f.related.map((r) => p.id + '-' + r).filter((r) => C.get(r)) }));
    // family map uses the prefixed ids
    const fo = {}; for (const k of p.keywords) fo[p.id + '-' + k.id] = k.family; p.familyOf = fo;
  }
  function uninstall(id, keepPack) {
    for (const e of C.every()) if (e.lore === id && e.dynamic && e.kind !== 'place') C.remove(e.id);
    if (!keepPack) C.removePack(id);
  }

  /* ------------------------------ persistence ------------------------------ */
  async function connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { Lo.loaded = true; Lo.live = 'off'; refreshMenu(); return; }
    try { const u = await cl.use('user'); Lo.owner = u ? !!(await u.isOwner()) : false; } catch (err) { Lo.owner = false; }
    cl.use('sample').then((s) => { Lo.sample = s || null; Lo.live = s ? 'on' : 'off'; refresh(); }).catch(() => { Lo.live = 'off'; });
    cl.use('assets').then((a) => { Lo.assets = a || null; refresh(); }).catch(() => { Lo.assets = null; });
    try { Lo.db = await cl.use('db'); } catch (err) { Lo.db = null; }
    if (!Lo.db) { Lo.loaded = true; refreshMenu(); return; }
    try {
      Lo.db.collection('lores').onSnapshot((qs) => {
        const seen = new Set();
        for (const s of qs.docs) {
          const p = sanitizePack(s.data ? s.data() : s);
          if (!p) continue;
          seen.add(p.id);
          const was = Lo.docs.get(p.id);
          Lo.docs.set(p.id, p);
          if (was) uninstall(p.id, true);
          install(p);
        }
        for (const id of Array.from(Lo.docs.keys())) if (!seen.has(id)) { Lo.docs.delete(id); uninstall(id); }
        Lo.loaded = true;
        // the lore remembered in this browser may be one of these
        const want = V.store('lore');
        if (want && want !== C.lore && Lo.docs.has(want) && (location.hash === '' || location.hash === '#/' || location.hash === '#')) V.switchLore(want);
        if (V.refresh) V.refresh();
        refreshMenu();
      }, () => { Lo.loaded = true; refreshMenu(); });
    } catch (err) { Lo.loaded = true; }
  }
  async function saveLore(doc) {
    const p = sanitizePack(doc);
    if (!p) return false;
    Lo.docs.set(p.id, p); install(p);
    if (!Lo.db || !Lo.owner) { V.toast('Kept for this visit only: lores are saved by the owner of the codex.'); return false; }
    try { await Lo.db.collection('lores').doc(p.id).set(JSON.parse(JSON.stringify(doc))); return true; }
    catch (err) { V.toast('The lore was not saved (' + ((err && err.code) || 'error') + ').'); return false; }
  }
  async function removeLore(id) {
    const p = Lo.docs.get(id);
    Lo.docs.delete(id); uninstall(id);
    if (Lo.db && Lo.owner) { try { await Lo.db.collection('lores').doc(id).delete(); } catch (err) { /* none */ } }
    if (p && Lo.assets) for (const t of p.tomes) { /* the tome files are listed in private/<lore>/tomes; housekeeping removes them later */ }
    V.switchLore(C.DEFAULT_LORE);
  }

  /* ------------------------------ the lore menu (top bar) ------------------------------ */
  function menuHtml() {
    const cur = C.pack() || { name: 'Codex', short: 'Codex' };
    const list = V.visiblePacks ? V.visiblePacks() : C.packs();
    let h = '<button type="button" class="lore-btn" aria-haspopup="true" aria-expanded="' + (Lo.open ? 'true' : 'false') + '" data-lore-toggle><span class="lore-cur">' + esc(cur.short || cur.name) + '</span><span class="lore-chev" aria-hidden="true"></span></button>';
    h += '<div class="lore-list' + (Lo.open ? ' open' : '') + '" role="menu">';
    for (const p of list) {
      const n = C.every().filter((e) => e.lore === p.id && !e.crafted && (e.kind === 'concept' || e.kind === 'section')).length;
      h += '<a role="menuitem" class="lore-item' + (p.id === C.lore ? ' on' : '') + '" href="#/lore/' + esc(p.id) + '" data-lore-pick="' + esc(p.id) + '"><span class="lore-name">' + esc(p.name) + (p.status === 'draft' ? ' <span class="badge badge-warn">draft</span>' : '') + '</span><span class="lore-sub">' + esc(p.subject || '') + ' · ' + (p.tomes || []).length + ' tome' + ((p.tomes || []).length === 1 ? '' : 's') + ' · ' + n + ' keyword' + (n === 1 ? '' : 's') + '</span></a>';
    }
    h += '<a role="menuitem" class="lore-item lore-new" href="#/lores"><span class="lore-name">All lores…</span></a>';
    if (Lo.owner) h += '<a role="menuitem" class="lore-item lore-new" href="#/lore/new"><span class="lore-name">+ Begin a new lore</span><span class="lore-sub">from tomes you upload</span></a>';
    return h + '</div>';
  }
  function refreshMenu() {
    const el = document.getElementById('lore-menu');
    if (el) el.innerHTML = menuHtml();
  }
  document.addEventListener('click', (ev) => {
    const tg = ev.target.closest && ev.target.closest('[data-lore-toggle]');
    if (tg) { Lo.open = !Lo.open; refreshMenu(); return; }
    const pick = ev.target.closest && ev.target.closest('[data-lore-pick]');
    if (pick) { ev.preventDefault(); Lo.open = false; V.switchLore(pick.dataset.lorePick); refreshMenu(); return; }
    if (Lo.open && !(ev.target.closest && ev.target.closest('#lore-menu'))) { Lo.open = false; refreshMenu(); }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && Lo.open) { Lo.open = false; refreshMenu(); } });
  /* 3.0.3: the menu closes when the view changes, as the index sheet does */
  window.addEventListener('hashchange', () => { if (Lo.open) { Lo.open = false; refreshMenu(); } });

  /* ------------------------------ views ------------------------------ */
  function verifyButton() {
    if (!Lo.owner) return '';
    return '<button type="button" class="req" data-lore-verify="' + esc(C.lore) + '">Send to Claude to verify</button>';
  }
  /* 3.0.1: a tagline that is cut ends at a word with an ellipsis */
  const clipText = (x, n) => { x = String(x); if (x.length <= n) return x; const cut = x.slice(0, n - 1); const sp = cut.lastIndexOf(' '); return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:.\-–—]+$/, '') + '…'; };
  function viewList() {
    let h = V.crumbs([{ href: '#/', label: 'Codex' }, { label: 'Lores' }]);
    h += '<section class="blk"><h1>Lores</h1>' + V.ORN + '<p class="lede">The worlds this engine can load. Each lore keeps its own tomes, bestiary, library, quests and progress; the same codex holds them all.</p></section><div class="cards">';
    for (const p of (V.visiblePacks ? V.visiblePacks() : C.packs())) {
      const n = C.every().filter((e) => e.lore === p.id && !e.crafted && (e.kind === 'concept' || e.kind === 'section')).length;
      h += '<a class="bcard lore-card' + (p.id === C.lore ? ' on' : '') + '" href="#/lore/' + esc(p.id) + '" data-lore-pick="' + esc(p.id) + '"><span class="medal" aria-hidden="true">' + esc((p.short || p.name || '?').slice(0, 2)) + '</span><span class="bc-main"><span class="bc-kind">' + esc(p.subject || 'lore') + (p.status === 'draft' ? ' · draft' : '') + (p.id === C.lore ? ' · open now' : '') + '</span><span class="bc-name">' + esc(p.name) + '</span><span class="bc-teaser">' + esc(clipText(p.tagline || '', 160)) + '</span><span class="bc-lvl">' + (p.tomes || []).length + ' tomes · ' + n + ' keywords' + (p.library ? ' · ' + esc(p.library.name) : '') + '</span></span></a>';
    }
    h += '</div>';
    if (Lo.owner) h += '<section class="panel"><h2>Begin a new lore</h2><p>Name it, say what it is for, upload the tomes as PDFs, and Claude drafts the world in the page: tome maps with fog of war, the first keywords and their families, the library and its namesakes. The draft stays marked until Claude checks it in the chat.</p><a class="req" href="#/lore/new">Begin a new lore</a></section>';
    return h;
  }
  const ACC_NAMES = { gilt: 'Gilt', verdigris: 'Verdigris', lapis: 'Lapis', rubric: 'Rubric', violet: 'Violet', copper: 'Copper', slate: 'Slate' };
  function viewNew() {
    const f = Lo.form || (Lo.form = { name: '', short: '', subject: '', prompt: '', accent: 'lapis', ornament: 'orbits', journal: true, files: [] });
    let h = V.crumbs([{ href: '#/', label: 'Codex' }, { href: '#/lores', label: 'Lores' }, { label: 'New lore' }]);
    h += '<section class="blk"><h1>Begin a new lore</h1>' + V.ORN + '<p class="lede">The engine stays; the world changes. Give the lore a name and a purpose, choose its look, and upload its tomes.</p></section>';
    if (!Lo.owner) return h + '<section class="panel"><p>Only the owner of the codex begins a lore.</p></section>';
    if (Lo.busy) return h + '<section class="panel"><h2>Drafting</h2><p class="inbox-busy"><span class="spin" aria-hidden="true"></span> <span data-lore-busy>' + esc(Lo.busy) + '</span></p><p class="small muted">Claude reads the tables of contents and writes the draft; this takes a minute or two.</p></section>';
    h += '<section class="panel"><form class="q-form lore-form" data-lore-form>' +
      '<label for="ln-name">Name of the lore</label><input id="ln-name" name="name" maxlength="80" required placeholder="for example: Systems Codex" value="' + esc(f.name) + '">' +
      '<label for="ln-subject">Subject, in a few words</label><input id="ln-subject" name="subject" maxlength="120" required placeholder="for example: operating systems and distributed systems" value="' + esc(f.subject) + '">' +
      '<label for="ln-prompt">What it is for (one or two sentences for Claude)</label><textarea id="ln-prompt" name="prompt" rows="3" maxlength="600" placeholder="for example: I am preparing for systems interviews; the codex should drill me on the mechanisms behind each concept.">' + esc(f.prompt) + '</textarea>' +
      '<fieldset><legend>Accent</legend>' + V.ACCENTS.map((a) => '<label class="rv-pick swatch sw-' + a + '"><input type="radio" name="accent" value="' + a + '"' + (f.accent === a ? ' checked' : '') + '><span class="sw" aria-hidden="true"></span>' + esc(ACC_NAMES[a] || a) + '</label>').join('') + '</fieldset>' +
      '<fieldset><legend>Ornament</legend>' + Object.keys(ORNAMENTS).map((o) => '<label class="rv-pick orn-pick"><input type="radio" name="ornament" value="' + o + '"' + (f.ornament === o ? ' checked' : '') + '>' + ornament(o) + esc(o) + '</label>').join('') + '</fieldset>' +
      '<fieldset><legend>Journal</legend><label class="rv-pick"><input type="checkbox" name="journal"' + (f.journal ? ' checked' : '') + '> This lore keeps a Journal (quests, review, dossier)</label></fieldset>' +
      '<label for="ln-files">Tomes (PDF, up to 20 MB each, up to 6)</label><input id="ln-files" type="file" name="files" accept="application/pdf,.pdf" multiple' + (Lo.assets ? '' : ' disabled') + '>' +
      (Lo.assets === null ? '<p class="small muted">Uploading tomes needs edit access; without files Claude drafts from the name and subject alone.</p>' : '') +
      '<p class="small muted">The browser reads each tome’s table of contents; the files themselves stay where only you can read them.</p>' +
      '<button class="btn" type="submit"' + (Lo.live !== 'on' ? ' disabled title="Needs the Claude app"' : '') + '>Draft the lore</button>' + (Lo.live === 'off' ? ' <span class="small muted">Drafting needs the Claude app.</span>' : '') + '</form></section>';
    return h;
  }
  function mount(el, a) { root = el; args = a || []; refresh(); }
  function refresh() {
    if (!root || !root.isConnected) return;
    const [b] = args;
    V.clearMath(root);
    window.CodexForms.swap(root, b === 'new' ? viewNew() : viewList());
    V.typesetNow(root);
  }

  /* ------------------------------ drafting ------------------------------ */
  let pdfjsPromise = null;
  function loadPdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfjsPromise) return pdfjsPromise;
    pdfjsPromise = new Promise((res, rej) => { const s = document.createElement('script'); s.src = PDFJS; s.async = true; s.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; } catch (err) { /* fake worker */ } res(window.pdfjsLib); }; s.onerror = () => { pdfjsPromise = null; rej(new Error('pdfjs')); }; document.head.appendChild(s); });
    return pdfjsPromise;
  }
  /* the table of contents of a PDF: its outline when it has one, else the text of its first pages */
  async function tocOf(file, maxChars) {
    const lib = await loadPdfjs();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    let title = ''; let authors = '';
    try { const m = await doc.getMetadata(); title = clean(m && m.info && m.info.Title, 200); authors = clean(m && m.info && m.info.Author, 200); } catch (err) { /* none */ }
    const lines = [];
    let outline = null;
    try { outline = await doc.getOutline(); } catch (err) { outline = null; }
    if (outline && outline.length) {
      const walk = async (items, depth) => {
        for (const it of items) {
          if (lines.length > 600) return;
          let page = '';
          try {
            let dest = it.dest;
            if (typeof dest === 'string') dest = await doc.getDestination(dest);
            if (Array.isArray(dest) && dest[0]) page = String((await doc.getPageIndex(dest[0])) + 1);
          } catch (err) { page = ''; }
          lines.push('  '.repeat(depth) + clean(it.title, 160) + (page ? ' … p. ' + page : ''));
          if (depth < 2 && it.items && it.items.length) await walk(it.items, depth + 1);
        }
      };
      await walk(outline, 0);
    } else {
      for (let n = 2; n <= Math.min(12, doc.numPages); n++) {
        const tc = await (await doc.getPage(n)).getTextContent();
        lines.push('[page ' + n + '] ' + tc.items.map((x) => x.str).join(' ').replace(/\s+/g, ' ').slice(0, 2500));
      }
    }
    let text = lines.join('\n');
    if (text.length > maxChars) text = text.slice(0, maxChars) + '\n[cut here]';
    return { title, authors, pages: doc.numPages, text, hasOutline: !!(outline && outline.length) };
  }
  async function draft(form) {
    if (!Lo.sample || Lo.live !== 'on') { V.toast('Drafting needs the Claude app.'); return; }
    const f = Lo.form;
    f.name = clean(form.name.value, 80); f.subject = clean(form.subject.value, 120); f.prompt = clean(form.prompt.value, 600);
    f.accent = form.accent.value; f.ornament = form.ornament.value; f.journal = !!form.journal.checked;
    const files = Array.from((form.files && form.files.files) || []).slice(0, 6);
    if (!f.name || !f.subject) return;
    const id = slug(f.name, 30) || 'lore-' + Math.random().toString(36).slice(2, 6);
    if (C.pack(id)) { V.toast('A lore with this name exists. Choose another name.'); return; }
    Lo.busy = 'Reading the tomes…'; refresh();
    const tomes = [];
    for (const file of files) {
      if (file.size > MAX_PDF) { V.toast(file.name + ' is larger than 20 MB and was skipped.'); continue; }
      try {
        Lo.busy = 'Reading the contents of ' + file.name + '…'; updateBusy();
        const t = await tocOf(file, 24000);
        let assetId = '';
        if (Lo.assets) { try { Lo.busy = 'Storing ' + file.name + '…'; updateBusy(); const up = await Lo.assets.upload(file, { type: 'application/pdf' }); assetId = up.id; } catch (err) { assetId = ''; } }
        tomes.push({ file: file.name, title: t.title || file.name.replace(/\.pdf$/i, ''), authors: t.authors, pages: t.pages, toc: t.text, hasOutline: t.hasOutline, assetId });
      } catch (err) { V.toast(file.name + ' could not be read and was skipped.'); }
    }
    Lo.busy = 'Claude is drafting the lore…'; updateBusy();
    const prompt = 'You design one LORE for a study codex engine styled like the bestiary and cyclopedia of Pillars of Eternity. The engine already exists; you fill its data for a new field.\n\n' +
      'LORE NAME: ' + f.name + '\nSUBJECT: ' + f.subject + (f.prompt ? '\nWHAT IT IS FOR: ' + f.prompt : '') +
      (tomes.length ? '\n\nTOMES (tables of contents read from the PDFs):\n' + tomes.map((t, i) => '--- TOME ' + (i + 1) + ': ' + t.title + (t.authors ? ' by ' + t.authors : '') + ' (' + t.pages + ' pages) ---\n' + t.toc).join('\n\n') : '\n\n(No tomes were uploaded: propose two or three standard textbooks of the field as tomes, with their real chapter titles if you know them, otherwise chapter titles marked CHECK.)') +
      '\n\nWrite, in plain full sentences:\n' +
      '1. tomes: for each tome, its chapters and sections with page numbers from the contents (num like "3.2", page as a number); keep the printed numbering; at most 40 chapters and 40 sections per chapter.\n' +
      '2. families: 4 to 6 families that group the field’s concepts, each with a one-line hint.\n' +
      '3. keywords: 25 to 40 core concepts of the field as keywords, each with a one-sentence teaser, its family, and the tome section where it is first met (tome id, section num, page) when the contents show it.\n' +
      '4. library: a library with a name in the spirit of the games, 3 wings named after founders of the field (with the year of their founding work), each wing holding one room: the first room role "open" (the front desk), the second role "own" (the reader’s own writing), the third role "hidden" (the reader’s real papers).\n' +
      '5. figures: the founders the wings are named for, with years, a two-paragraph bio, why they matter here, and 1 to 3 works; mark anything unsure with CHECK.\n' +
      '6. tagline, context (3 to 5 lines Claude will read in later calls: what the field is, who the reader is, the style: plain step-by-step sentences, page numbers only when sure, otherwise CHECK IN BOOK), how (4 short steps on how this codex grows), suggested (4 sections to read first with why).\n' +
      'Use only lowercase slugs for ids (letters, digits, hyphens). Never invent page numbers: leave page empty when the contents do not show it.\n' +
      'Reply with only JSON: {"name":"...","short":"one or two words","subject":"...","tagline":"...","tomes":[{"id":"slug","short":"Author","title":"...","authors":"...","publisher":"...","chapters":[{"num":"1","title":"...","pages":"1–20","sections":[{"num":"1.1","title":"...","page":3}]}]}],"families":[{"id":"slug","name":"...","hint":"..."}],"keywords":[{"id":"slug","name":"...","teaser":"...","family":"slug","tome":"tome id","num":"1.1","page":3}],"library":{"id":"slug","name":"...","blurb":"...","places":[{"id":"slug","kind":"wing","name":"...","year":1900,"figures":["figure slug"],"blurb":"...","children":[{"id":"slug","kind":"room","name":"...","role":"open","blurb":"..."}]}]},"figures":[{"id":"slug","name":"...","aliases":["surname"],"years":"1900–1980","role":"Namesake of the ... Wing","place":"wing slug","teaser":"...","bio":["...","..."],"why":"...","works":[{"year":1900,"title":"...","venue":"..."}]}],"context":"...","how":["..."],"suggested":[{"tome":"tome id","num":"1.1","why":"..."}]}';
    try {
      const r = await Lo.sample.json(prompt, { cache: false, modelTier: 'complex', onText: ({ text }) => { Lo.busy = 'Claude is drafting the lore… ' + text.length + ' characters'; updateBusy(); } });
      if (!r || typeof r !== 'object') throw { code: 'invalid_json' };
      const doc = Object.assign({}, r, { id, name: f.name, subject: f.subject, prompt: f.prompt, look: { accent: f.accent, ornament: f.ornament }, journal: f.journal ? ['overview', 'quests', 'review', 'dossier'] : [], status: 'draft', created: new Date().toISOString(), by: 'claude-live' });
      // tome ids from the draft are matched to the uploaded files by order
      if (Array.isArray(doc.tomes)) doc.tomes.forEach((t, i) => { if (tomes[i]) { t.file = tomes[i].file; t.pages = t.pages || tomes[i].pages + ' pages'; } });
      const json = JSON.stringify(doc);
      if (json.length > 240000) throw { code: 'too_large' };
      const p = sanitizePack(doc);
      if (!p || !p.keywords.length) throw { code: 'invalid_json' };
      const ok = await saveLore(doc);
      if (Lo.db && Lo.owner) {
        for (let i = 0; i < tomes.length; i++) if (tomes[i].assetId) { try { await Lo.db.collection('private/' + id + '/tomes').doc(p.tomes[i] ? p.tomes[i].id : 'tome' + (i + 1)).set({ id: p.tomes[i] ? p.tomes[i].id : 'tome' + (i + 1), lore: id, asset: { id: tomes[i].assetId, name: tomes[i].file, pages: tomes[i].pages }, created: new Date().toISOString() }); } catch (err) { /* later */ } }
      }
      Lo.busy = null; Lo.form = null;
      V.toast(ok ? 'The lore is drafted. Send it to Claude to verify when you are ready.' : 'The lore is drafted for this visit.');
      V.switchLore(id);
    } catch (err) {
      const code = err && err.code;
      Lo.busy = null;
      V.toast(code === 'too_large' ? 'The draft came back too large; upload fewer tomes.' : code === 'invalid_json' ? 'Claude’s draft could not be read. Try again.' : code === 'rate_limited' ? 'Claude is busy or your usage limit is reached.' : code === 'not_granted' ? 'Not allowed in this view.' : 'A connection problem interrupted Claude. Try again.');
      refresh();
    }
  }
  function updateBusy() { const el = root && root.querySelector('[data-lore-busy]'); if (el) el.textContent = Lo.busy || ''; else refresh(); }
  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest && ev.target.closest('form[data-lore-form]');
    if (!form) return;
    ev.preventDefault();
    draft(form);
  });
  document.addEventListener('click', async (ev) => {
    const vb = ev.target.closest && ev.target.closest('[data-lore-verify]');
    if (vb) {
      const id = vb.dataset.loreVerify; const p = C.pack(id);
      if (!p) return;
      await V.askClaude('Verify the drafted lore “' + plain(p.name) + '” (database document lores/' + id + ', tome files in private/' + id + '/tomes): check the tome maps against the books, the keywords and their families, the figures’ bios and years, the library’s names; correct what is wrong; then set status to "verified".', vb.closest('.hero, .panel') || vb, vb);
      return;
    }
  });

  window.CodexLores = { mount, refresh, refreshMenu, menuHtml, ornament, verifyButton, sanitizePack, _test: { install } };
  connect();
  refreshMenu();
})();
