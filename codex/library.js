/* Resonance Codex — the library (Cyclopedia › Library).
   One building per lore, with wings and rooms (the lore pack's library tree). Rooms hold documents:
     open   = the front desk: shared with everyone the codex is shared with;
     own    = your own writing: private until you share an item;
     hidden = the back desk (the Altar): only you.
   Documents live in the artifact db. The public record (collection "library") carries the notes and never the file;
   the private record (collection "private/<lore>/items", readable only by the owner) carries the file's asset id,
   so the Original tab opens only for you. A document opens as a Pillars-style book window with two tabs:
   Breakdown (notes in Claude's words, with page and equation numbers) and Original (your PDF, page by page,
   with keywords underlined). */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;
  const Store = C.Store;

  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const MAX_PDF = 20 * 1024 * 1024;
  const MAX_KEY = 5;
  const KINDS = { paper: 'Research paper', notes: 'Lecture notes', proceedings: 'Proceedings', review: 'Review', thesis: 'Thesis', own: 'Your writing', book: 'Book chapter', rough: 'Rough draft', other: 'Document' };
  /* 3.0.5: a place may carry a blurbViewer, the text a reader who is not the keeper sees; the Wings blurb names the unknown hidden half, which no viewer should be told of */
  const blurbOf = (x) => ((!L.owner && x.blurbViewer) ? x.blurbViewer : (x.blurb || ''));
  const ROLE_TEXT = { open: 'front desk · shared', own: 'your own writing', hidden: 'back desk · keeper only' };
  const PLACE_WORD = { library: 'Library', wing: 'Wing', room: 'Room', hall: 'Hall', chamber: 'Chamber', altar: 'Altar', cell: 'Cell' };
  const MAX_ROUGHS = 12;

  const L = {
    db: null, assets: undefined, owner: false, sample: null, live: 'pending',
    pub: new Map(), priv: new Map(),   // id -> doc
    loaded: { pub: false, priv: false },
    busy: new Map(),                    // id -> text
    tab: new Map(),                     // id -> 'breakdown' | 'original'
    pdf: new Map(),                     // asset id -> { doc, pages: Map(n -> text), promise }
    draft: new Map(),                   // id -> generated full breakdown not yet saved (local mode)
    usage: null,
  };
  let root = null;
  let args = [];
  let pdfjsPromise = null;

  /* ------------------------------ helpers ------------------------------ */
  const clean = (s, n) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 300) : '');
  const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  function safeRich(s, max) { // text written by Claude or read from the db: escape everything but $…$ math
    if (typeof s !== 'string') return '';
    s = s.slice(0, max || 4000);
    return s.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g).map((p, i) => (i % 2 ? p : esc(p).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>'))).join('');
  }
  const slug = (s) => String(s || 'doc').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'doc';
  const rid = () => Math.random().toString(36).slice(2, 7);
  const idOk = (s) => typeof s === 'string' && /^[a-z0-9-]+$/.test(s);
  const plain = (s) => String(s || '').replace(/<[^>]*>/g, '');
  const num = (x, d) => (Number.isFinite(Number(x)) ? Number(x) : d);
  const today = () => C.today();
  const privCol = (lore) => 'private/' + (lore || C.lore) + '/items';

  function sanitize(d, trusted) {
    if (!d || !idOk(d.id)) return null;
    const lit = (r) => {
      if (!r || typeof r !== 'object') return null;
      const authors = clean(r.authors, 200); const title = clean(r.title, 300);
      if (!authors && !title) return null;
      const doi = typeof r.doi === 'string' && /^10\.\d{4,9}\/\S+$/.test(r.doi.trim()) ? r.doi.trim() : '';
      const arxiv = typeof r.arxiv === 'string' && /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/.test(r.arxiv.trim()) ? r.arxiv.trim() : '';
      return { authors, title, venue: clean(r.venue, 200), year: num(r.year, ''), doi, arxiv, field: ['QO', 'QC', 'QI', 'general'].includes(r.field) ? r.field : 'general', fit: safeRich(r.fit, 400), verified: trusted && r.verified === true };
    };
    const quiz = (q) => {
      if (!q || typeof q !== 'object') return null;
      const options = arr(q.options, 6).map((o) => safeRich(String(o), 300)).filter(Boolean);
      const answer = Number(q.answer);
      if (options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) return null;
      return { q: safeRich(q.q, 500), options, answer, why: safeRich(q.why, 500) };
    };
    const full = d.full && typeof d.full === 'object' ? {
      steps: arr(d.full.steps, 14).map((s) => ({ text: safeRich(s && s.text, 700), ref: clean(s && s.ref, 120) })).filter((s) => s.text),
      quiz: arr(d.full.quiz, 8).map(quiz).filter(Boolean),
      research: arr(d.full.research, 6).map((x) => safeRich(x, 900)),
      references: arr(d.full.references, 12).map(lit).filter(Boolean),
      newKeywords: arr(d.full.newKeywords || d.full.new_keywords, 8).map((k) => ({ name: clean(k && k.name, 80), teaser: clean(k && k.teaser, 240), page: num(k && k.page, '') })).filter((k) => k.name),
      at: clean(d.full.at, 30),
    } : null;
    const val = d.value && typeof d.value === 'object' ? { kind: ['cites', 'minutes', 'text'].includes(d.value.kind) ? d.value.kind : 'text', n: num(d.value.n, 0), src: clean(d.value.src, 60), date: clean(d.value.date, 12), text: clean(d.value.text, 160) } : null;
    return {
      id: d.id, lore: idOk(d.lore) ? d.lore : C.DEFAULT_LORE, place: clean(d.place, 60), kind: KINDS[d.kind] ? d.kind : 'other',
      title: clean(d.title, 300) || 'Untitled document', authors: clean(d.authors, 300), year: num(d.year, ''), venue: clean(d.venue, 300),
      doi: typeof d.doi === 'string' && /^10\.\d{4,9}\/\S+$/.test(d.doi.trim()) ? d.doi.trim() : '', url: typeof d.url === 'string' && /^https:\/\//.test(d.url) ? d.url.slice(0, 400) : '',
      value: val, caption: safeRich(d.caption, 600),
      summary: arr(d.summary, 10).map((x) => safeRich(x, 2500)).filter(Boolean),
      points: arr(d.points, 60).map((p) => ({ page: num(p && p.page, ''), eq: clean(p && p.eq, 20), text: safeRich(p && p.text, 900), check: !!(p && p.check) })).filter((p) => p.text),
      text: arr(d.text, 40).map((x) => safeRich(x, 4000)).filter(Boolean),
      keywords: arr(d.keywords, 40).filter(idOk), keyKeywords: arr(d.keyKeywords, MAX_KEY).filter(idOk),
      formulas: arr(d.formulas, 40).map((f) => ({ page: num(f && f.page, ''), eq: clean(f && f.eq, 20), tex: clean(f && f.tex, 500), note: safeRich(f && f.note, 300) })).filter((f) => f.tex),
      full, fullStatus: ['none', 'draft', 'verified'].includes(d.fullStatus) ? d.fullStatus : (full ? 'draft' : 'none'),
      pages: num(d.pages, 0), scanned: d.scanned === true, shared: d.shared === true, status: ['new', 'sent', 'notes', 'ready'].includes(d.status) ? d.status : 'new',
      created: clean(d.created, 30), updated: clean(d.updated, 30), by: clean(d.by, 20),
      asset: d.asset && typeof d.asset === 'object' && /^[0-9a-f]{32}$/.test(String(d.asset.id)) ? { id: d.asset.id, name: clean(d.asset.name, 120), size: num(d.asset.size, 0), type: clean(d.asset.type, 60) } : null,
      pageImages: arr(d.pageImages, 60).filter((x) => /^[0-9a-f]{32}$/.test(String(x))),
      rough: d.rough && typeof d.rough === 'object' ? { a: clean(d.rough.a, 80), b: clean(d.rough.b, 80), via: clean(d.rough.via, 80), at: clean(d.rough.at, 30) } : null,
    };
  }
  /* the document as this viewer may see it: the private record wins for the owner */
  function item(id) {
    const p = L.priv.get(id); const q = L.pub.get(id);
    if (p && q) return Object.assign({}, q, p, { shared: q.shared || p.shared });
    return p || q || null;
  }
  function items() {
    const out = new Map();
    for (const [id, d] of L.pub) if (d.lore === C.lore) out.set(id, item(id));
    for (const [id, d] of L.priv) if (d.lore === C.lore) out.set(id, item(id));
    return Array.from(out.values()).sort((a, b) => (a.created < b.created ? 1 : -1));
  }
  const itemsIn = (placeId) => items().filter((d) => d.place === placeId);
  const roomOf = (d) => C.place(d.place) || null;
  const roomRole = (p) => (p && p.role) || 'open';
  const wingOf = (p) => (p && p.trail.length > 1 ? C.place(p.trail[0]) : null);
  const isSecret = (p) => !!(p && (p.secret || p.trail.some((t) => { const q = C.place(t); return q && q.secret; })));
  const found = (p) => !!(p && Store.entry('place:' + p.id).found);
  /* hidden places open for the owner only; secret places exist only for the owner, and show in the index once found */
  /* 3.0.6: a place marked `campaign` (the board's chamber and its cells) does not exist for anyone but the keeper: a viewer meets "No such place", and it is in no list, label or search */
  const campaignOnly = (p) => !!(p && (p.campaign || (p.trail || []).some((t) => { const q = C.place(t); return q && q.campaign; })));
  const gone = (p) => !L.owner && campaignOnly(p);
  const canSee = (p) => (roomRole(p) !== 'hidden' || L.owner) && (!isSecret(p) || L.owner) && !gone(p);
  /* the name of a place as it is spoken where the reader stands (some places are called differently inside their own halls) */
  function standing() {
    const cur = V.current ? V.current() : null;
    if (!cur) return [];
    if (cur.name === 'library' && cur.args[0]) { const p = C.place(cur.args[0]); return p ? p.trail : []; }
    if (cur.name === 'doc' && cur.args[0]) { const d = item(cur.args[0]); const p = d ? roomOf(d) : null; return p ? p.trail : []; }
    return [];
  }
  function pname(p) {
    if (!p) return '';
    if (p.names) { for (const t of standing()) if (p.names[t]) return p.names[t]; }
    return p.name;
  }
  /* 3.0.1: a secret place (and the monks of its hall) stays out of every list, label and shelf until the owner has found it */
  const hiddenPlace = (p) => !!(p && (gone(p) || (isSecret(p) && !(L.owner && (found(p) || p.trail.some((t) => found(C.place(t))))))));
  function hiddenEntry(e) {
    if (!e) return false;
    if (e.kind === 'place') return hiddenPlace(C.place(e.place));
    if (e.kind === 'figure' && e.kin && e.hall === 'kudo') return hiddenPlace(C.place('kudo-hall'));
    if (e.kind === 'figure' && e.board) return !L.owner; /* 3.0.6: the board of the campaign is the keeper's */
    return false;
  }
  const listed = (p) => canSee(p) && (!isSecret(p) || found(p) || found(C.place(p.trail[0])) || p.trail.some((t) => found(C.place(t))));
  function markFound(p) { if (!p || !L.owner || !Store.canWrite()) return; Store.update('place:' + p.id, { found: true }); }

  /* ------------------------------ persistence ------------------------------ */
  async function connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { L.assets = null; L.live = 'off'; L.ownerKnown = true; L.loaded.pub = L.loaded.priv = true; changed(); return; }
    /* 3.0.7: the runtime bounds use('user') (null after 10 s) but not isOwner(); if the answer has not come in 12 s the codex is drawn for a viewer (the safe side) and is drawn again for the keeper if a late answer says yes */
    const ownerAsk = (async () => { const u = await cl.use('user'); return u ? !!(await u.isOwner()) : false; })();
    const late = new Promise((r) => setTimeout(() => r('late'), 12000));
    const redraw = () => { try { if (V.render) V.render(true); if (window.CodexLores && window.CodexLores.refreshMenu) window.CodexLores.refreshMenu(); if (L.owner && V.restoreLore) V.restoreLore(); } catch (err) { /* the next render will do */ } };
    try { const r = await Promise.race([ownerAsk, late]); L.owner = r === true; if (r === 'late') ownerAsk.then((v) => { if (v === true && !L.owner) { L.owner = true; changed(); redraw(); } }, () => {}); } catch (err) { L.owner = false; }
    L.ownerKnown = true;
    /* 3.0.4: a page that depends on who is looking (the Alexander lens, a hidden monk) is drawn again once the answer is in; 3.0.6: every page is, because the campaign is the keeper's (the Figures board, the lore list, the release log) */
    redraw();
    cl.use('sample').then((s) => { L.sample = s || null; L.live = s ? 'on' : 'off'; changed(); }).catch(() => { L.live = 'off'; });
    cl.use('assets').then((a) => { L.assets = a || null; changed(); }).catch(() => { L.assets = null; changed(); });
    try { L.db = await cl.use('db'); } catch (err) { L.db = null; }
    if (!L.db) { L.loaded.pub = L.loaded.priv = true; changed(); return; }
    try {
      L.db.collection('library').onSnapshot((qs) => {
        L.pub.clear();
        for (const s of qs.docs) { const d = sanitize(s.data ? s.data() : s, true); if (d) L.pub.set(d.id, d); }
        L.loaded.pub = true; changed();
      }, () => { L.loaded.pub = true; changed(); });
    } catch (err) { L.loaded.pub = true; }
    subscribePrivate();
  }
  let privUnsub = null; let privLore = null;
  function subscribePrivate() {
    if (!L.db || !L.owner) { L.loaded.priv = true; changed(); return; }
    if (privLore === C.lore && privUnsub) return;
    if (privUnsub) { try { privUnsub(); } catch (err) { /* gone */ } privUnsub = null; }
    privLore = C.lore;
    L.priv.clear();
    try {
      privUnsub = L.db.collection(privCol(C.lore)).onSnapshot((qs) => {
        L.priv.clear();
        for (const s of qs.docs) { const d = sanitize(s.data ? s.data() : s, true); if (d) L.priv.set(d.id, d); }
        L.loaded.priv = true; changed();
      }, () => { L.loaded.priv = true; changed(); });
    } catch (err) { L.loaded.priv = true; changed(); }
  }
  const strip = (d) => JSON.parse(JSON.stringify(d));
  function publicCopy(d) { const c = strip(d); delete c.asset; delete c.pageImages; return c; }
  async function save(d, where) {
    d.updated = new Date().toISOString();
    const role = roomRole(roomOf(d));
    const toPriv = where !== 'pub';
    const toPub = role === 'open' || d.shared;
    if (toPriv) L.priv.set(d.id, sanitize(d, true));
    if (toPub) L.pub.set(d.id, sanitize(publicCopy(d), true)); else L.pub.delete(d.id);
    changed();
    if (!L.db || !L.owner) { V.toast('Kept for this visit only: the library is written by the owner of the codex.'); return false; }
    try {
      if (toPriv) await L.db.collection(privCol(d.lore)).doc(d.id).set(strip(d));
      if (toPub) await L.db.collection('library').doc(d.id).set(publicCopy(d));
      else if (where !== 'priv-only') { try { await L.db.collection('library').doc(d.id).delete(); } catch (err) { /* was never public */ } }
      return true;
    } catch (err) { V.toast('The document was not saved (' + ((err && err.code) || 'error') + ').'); return false; }
  }
  async function removeItem(d) {
    L.priv.delete(d.id); L.pub.delete(d.id); changed();
    if (!L.db || !L.owner) return;
    try { await L.db.collection(privCol(d.lore)).doc(d.id).delete(); } catch (err) { /* none */ }
    try { await L.db.collection('library').doc(d.id).delete(); } catch (err) { /* none */ }
    if (d.asset && L.assets) { try { await L.assets.delete(d.asset.id); } catch (err) { /* housekeeping later */ } }
    for (const pid of d.pageImages || []) { if (L.assets) { try { await L.assets.delete(pid); } catch (err) { /* later */ } } }
  }
  function changed() {
    if (root && root.isConnected) refresh();
    if (V.current && ['home', 'cyclopedia', 'lexicon', 'entry', 'tomes', 'tome', 'figures', 'literature'].includes(V.current().name)) {
      const idx = document.getElementById('codex-index');
      if (idx && window.CodexView && typeof V.render === 'function' && V.current().name !== 'entry') { /* the index refreshes with the next render */ }
    }
    syncKeywords();
  }
  /* keywords discovered in documents join the bestiary as stubs (dynamic entries), marked with the document */
  const stubIds = new Set();
  function syncKeywords() {
    const seen = new Set();
    for (const d of items()) {
      if (!d.full) continue;
      for (const k of d.full.newKeywords || []) {
        const id = 'st-' + slug(k.name);
        seen.add(id);
        if (C.get(id) && !C.get(id).dynamic) continue;
        C.upsert({ id, kind: 'concept', lore: d.lore, name: k.name, aliases: [], integrated: null, teaser: k.teaser, found: [{ session: true, note: 'Seen in “' + esc(d.title) + '”' + (k.page ? ', p. ' + esc(k.page) : '') + '.' }], readNext: [] });
        stubIds.add(id);
      }
    }
    let dropped = false;
    for (const id of Array.from(stubIds)) if (!seen.has(id)) { if (C.remove(id)) dropped = true; stubIds.delete(id); }
    if (seen.size || dropped) { /* the registry changed: the alias regex is rebuilt on the next linkify */ if (V.refresh && (seen.size !== syncKeywords.last)) { syncKeywords.last = seen.size; } }
  }

  /* ------------------------------ PDF.js ------------------------------ */
  function loadPdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfjsPromise) return pdfjsPromise;
    pdfjsPromise = new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = PDFJS; s.async = true;
      s.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; } catch (err) { /* fake worker */ } res(window.pdfjsLib); };
      s.onerror = () => { pdfjsPromise = null; rej(new Error('pdfjs')); };
      document.head.appendChild(s);
    });
    return pdfjsPromise;
  }
  async function openPdf(assetId, data) {
    if (L.pdf.has(assetId) && L.pdf.get(assetId).doc) return L.pdf.get(assetId);
    const lib = await loadPdfjs();
    const task = data ? lib.getDocument({ data }) : lib.getDocument({ url: '/_blob/' + assetId });
    const doc = await task.promise;
    const rec = { doc, pages: new Map(), n: doc.numPages };
    L.pdf.set(assetId, rec);
    return rec;
  }
  async function pageText(rec, n) {
    if (rec.pages.has(n)) return rec.pages.get(n);
    const page = await rec.doc.getPage(n);
    const tc = await page.getTextContent();
    const items = tc.items.filter((it) => it.str !== undefined);
    const text = items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join('');
    rec.pages.set(n, text);
    return text;
  }
  async function allText(rec, maxChars) {
    let out = '';
    for (let n = 1; n <= rec.n; n++) {
      const t = await pageText(rec, n);
      out += '\n\n[page ' + n + ']\n' + t;
      if (out.length > maxChars) { out = out.slice(0, maxChars) + '\n[cut here]'; break; }
    }
    return out;
  }
  /* a page: canvas plus a text layer whose words are underlined when they are keywords */
  async function renderPage(rec, n, holder, width) {
    const page = await rec.doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2.2, Math.max(0.6, width / base.width));
    const vp = page.getViewport({ scale });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vp.width * dpr); canvas.height = Math.round(vp.height * dpr);
    canvas.style.width = Math.round(vp.width) + 'px'; canvas.style.height = Math.round(vp.height) + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    holder.innerHTML = '';
    holder.style.width = Math.round(vp.width) + 'px'; holder.style.height = Math.round(vp.height) + 'px';
    holder.appendChild(canvas);
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    const tc = await page.getTextContent();
    const layer = document.createElement('div');
    layer.className = 'pdf-text blk';
    layer.setAttribute('aria-label', 'Text of page ' + n);
    const lib = window.pdfjsLib;
    let count = 0;
    for (const it of tc.items) {
      if (!it.str || !it.str.trim()) continue;
      const tx = lib.Util.transform(vp.transform, it.transform);
      const fontH = Math.hypot(tx[2], tx[3]);
      const angle = Math.atan2(tx[1], tx[0]);
      const span = document.createElement('span');
      span.textContent = it.str;
      span.style.left = tx[4].toFixed(1) + 'px';
      span.style.top = (tx[5] - fontH).toFixed(1) + 'px';
      span.style.fontSize = fontH.toFixed(2) + 'px';
      span.style.fontFamily = /bold/i.test(it.fontName || '') ? 'sans-serif' : 'serif';
      if (angle) span.style.transform = 'rotate(' + angle + 'rad)';
      span.dataset.w = (it.width * scale).toFixed(1);
      layer.appendChild(span);
      count++;
    }
    holder.appendChild(layer);
    // stretch each run of text to the width the PDF gives it, so the underline sits under the printed word
    for (const span of layer.children) {
      const want = Number(span.dataset.w); const have = span.getBoundingClientRect().width;
      if (want > 0 && have > 0 && Math.abs(want - have) > 1) span.style.transform = (span.style.transform ? span.style.transform + ' ' : '') + 'scaleX(' + (want / have).toFixed(3) + ')';
    }
    V.linkify(layer);
    const kws = layer.querySelectorAll('a.kw').length;
    return { words: count, keywords: kws, hasText: count > 3 };
  }

  /* ------------------------------ Claude: the full breakdown ------------------------------ */
  const ERR = { not_granted: 'Not allowed in this view (permission declined).', rate_limited: 'Claude is busy or your usage limit is reached. Try again later.', refused: 'Claude declined this document.', invalid_json: 'Claude’s answer could not be read. Press the button again.', prompt_too_large: 'The document is too long for one call; the notes alone were used.', cancelled: 'Stopped.' };
  async function generateFull(d, btn) {
    if (!L.sample || L.live !== 'on') { V.toast('Generating needs the Claude app: this view has no connection to Claude.'); return; }
    if (L.busy.has(d.id)) return;
    L.busy.set(d.id, 'Reading the document…'); refresh();
    let text = '';
    try {
      if (d.asset && !d.scanned) {
        const rec = await openPdf(d.asset.id);
        text = await allText(rec, 140000);
      }
    } catch (err) { text = ''; }
    const shelf = C.all().filter((e) => e.kind === 'concept' || e.kind === 'section').map((e) => e.id + ' = ' + plain(e.name)).join('; ');
    const notes = (d.summary || []).map(plain).join('\n') + '\n' + (d.points || []).map((p) => (p.page ? 'p. ' + p.page + ' ' : '') + (p.eq ? 'eq. ' + p.eq + ' ' : '') + plain(p.text)).join('\n');
    const prompt = 'You write the full study breakdown of one document for a research codex styled like the bestiary of Pillars of Eternity.\n\n' + (C.pack().context || '') +
      '\n\nDOCUMENT: “' + plain(d.title) + '”' + (d.authors ? ' by ' + d.authors : '') + (d.year ? ' (' + d.year + ')' : '') + (d.venue ? ', ' + d.venue : '') + '. ' + (d.pages ? d.pages + ' pages. ' : '') +
      '\nREADING NOTES ALREADY WRITTEN (keep consistent with them):\n' + notes +
      (text ? '\n\nTEXT OF THE DOCUMENT (from its PDF; page markers in brackets):\n' + text : '\n\n(The text of the document is not available; work from the notes.)') +
      '\n\nBESTIARY (id = name):\n' + shelf +
      '\n\nRules:\n- Plain, step-by-step full sentences, in your own words; never copy sentences from the document.\n- Give the page number of every step and the equation number when there is one; otherwise write CHECK IN PAPER.\n- Inline math in $...$, display math in $$...$$.\n- Quiz: 5 questions, 4 options each, concrete where possible; "answer" is the 0-based index.\n- References: the works this document builds on and the ones that cite it, if you know them; never invent a DOI or arXiv number, leave the field empty when unsure; mark every item "verified": false.\n- key_keywords: up to 5 bestiary ids the reader must know first.\n- new_keywords: terms used in the document that are not in the bestiary, with the page they first appear on.\n' +
      'Reply with only JSON: {"steps":[{"text":"...","ref":"p. 3, eq. (12) or CHECK IN PAPER"}],"quiz":[{"q":"...","options":["a","b","c","d"],"answer":0,"why":"..."}],"research":["link to her thesis or PhD plan"],"references":[{"authors":"...","title":"...","venue":"...","year":2020,"doi":"","arxiv":"","field":"QO|QC|QI|general","fit":"one sentence","verified":false}],"key_keywords":["bestiary id"],"new_keywords":[{"name":"...","teaser":"one sentence","page":3}]}';
    L.busy.set(d.id, 'Claude is writing the full breakdown…'); refresh();
    try {
      const opts = { cache: false, modelTier: 'complex', onText: ({ text: t }) => { L.busy.set(d.id, 'Claude is writing… ' + t.length + ' characters'); updateBusy(d.id); } };
      const r = await L.sample.json(prompt, opts);
      if (!r || typeof r !== 'object') throw { code: 'invalid_json' };
      const full = { steps: r.steps, quiz: r.quiz, research: r.research, references: r.references, newKeywords: r.new_keywords, at: new Date().toISOString() };
      const key = arr(r.key_keywords, MAX_KEY).filter((k) => idOk(k) && C.get(k));
      const doc = Object.assign({}, strip(d), { full, fullStatus: 'draft' });
      if (key.length) doc.keyKeywords = key;
      const san = sanitize(doc, true);
      if (!san.full || (!san.full.steps.length && !san.full.quiz.length)) throw { code: 'invalid_json' };
      await save(doc);
      V.toast('Full breakdown written as a draft. Send it to Claude to verify.');
    } catch (err) {
      const code = err && err.code;
      V.toast(ERR[code] || 'A connection problem interrupted Claude. Try again.');
      if (code === 'not_granted' || code === 'sampling_disabled' || code === 'capability_disabled') L.live = 'off';
    } finally { L.busy.delete(d.id); refresh(); }
  }
  function updateBusy(id) { const el = root && root.querySelector('[data-busy="' + id + '"]'); if (el) el.textContent = L.busy.get(id) || ''; }

  /* ------------------------------ roughs: drafts at the crossings ------------------------------ */
  const learnable = (e) => e.kind === 'concept' || e.kind === 'section';
  const studied = () => C.all().filter((e) => learnable(e) && C.level(e.id) >= 2);
  const discoveredOnly = () => C.all().filter((e) => e.kind === 'concept' && C.level(e.id) < 2);
  let linkCache = null; let linkVersion = -1;
  function links() {
    if (linkCache && linkVersion === C.version) return linkCache;
    const g = new Map();
    const add = (a, b) => { if (!a || !b || a === b || !C.get(a) || !C.get(b)) return; if (!g.has(a)) g.set(a, new Set()); if (!g.has(b)) g.set(b, new Set()); g.get(a).add(b); g.get(b).add(a); };
    for (const e of C.all()) {
      for (const r of e.related || []) add(e.id, r);
      for (const f of e.found || []) if (f.tome) add(e.id, C.sectionEntry(f.tome, f.num));
      if (e.crafted && e.crafted.ingredients) for (const i of e.crafted.ingredients) add(e.id, i);
    }
    const book = window.CODEX_RECIPES;
    if (book) for (const r of book.recipes || []) { const ids = r.requires.map((q) => q.id); for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) add(ids[i], ids[j]); }
    linkCache = g; linkVersion = C.version;
    return g;
  }
  const linked = (a, b) => { const g = links(); return g.has(a) && g.get(a).has(b); };
  const know = (id) => (V.knowledge ? V.knowledge(id) : 0);
  const roughId = (a, b) => 'rough-' + a.replace(/[^a-z0-9]+/g, '-') + '-x-' + b.replace(/[^a-z0-9]+/g, '-');
  const nameOf = (x) => (x.startsWith('fig:') ? (C.get(x.slice(4)) || {}).name : (C.get(x) || {}).name) || x;
  /* the pairs a place offers: known × known, known × unknown, or a monk's work × yours */
  function roughCandidates(place) {
    const out = []; const seen = new Set();
    const push = (a, b, w, via) => { const id = roughId(a, b); if (seen.has(id)) return; seen.add(id); out.push({ id, a, b, w, via: via || '' }); };
    const S = studied(); const U = discoveredOnly();
    if (place.roughs === 'known') {
      for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) if (linked(S[i].id, S[j].id)) push(S[i].id, S[j].id, know(S[i].id) + know(S[j].id));
    } else if (place.roughs === 'unknown') {
      for (const u of U) {
        let any = false;
        for (const s of S) if (linked(s.id, u.id)) { push(s.id, u.id, know(s.id) + 10); any = true; }
        if (!any) { const fam = V.groupOf ? V.groupOf(u.id) : null; const kin = fam ? S.filter((s) => fam.items.some((x) => x.id === s.id)) : []; for (const s of kin.slice(0, 2)) push(s.id, u.id, know(s.id)); }
      }
    } else if (place.roughs === 'wing') {
      const fams = new Set(place.families || []);
      const famOf = (id) => { const g = V.groupOf ? V.groupOf(id) : null; return g ? g.key : ''; };
      for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) if ((fams.has(famOf(S[i].id)) || fams.has(famOf(S[j].id))) && linked(S[i].id, S[j].id)) push(S[i].id, S[j].id, know(S[i].id) + know(S[j].id) + (fams.has(famOf(S[i].id)) && fams.has(famOf(S[j].id)) ? 15 : 0));
    } else if (place.roughs === 'monk' && place.monk && C.get(place.monk)) {
      const f = C.get(place.monk);
      const pool = f.hall === 'kudo' ? U : S;
      const topics = (f.related || []).filter((m) => C.get(m));
      for (const m of topics) for (const x of pool) if (x.id !== m && (linked(x.id, m) || x.id === m)) push('fig:' + f.id, x.id, know(x.id) + 20, m);
      for (const m of topics) if (pool.some((x) => x.id === m)) push('fig:' + f.id, m, know(m) + 30, m);
      if (!out.length) for (const x of pool.slice().sort((p, q) => know(q.id) - know(p.id)).slice(0, 3)) push('fig:' + f.id, x.id, know(x.id));
    }
    out.sort((p, q) => q.w - p.w);
    return out.slice(0, MAX_ROUGHS);
  }
  function roughTitle(c) { return nameOf(c.a) + ' × ' + nameOf(c.b); }
  function describe(x) {
    if (x.startsWith('fig:')) { const f = C.get(x.slice(4)); return f ? f.name + ': ' + plain(f.teaser || '') + (f.works && f.works.length ? ' Works: ' + f.works.map((w) => w.title + ' (' + (w.venue || '') + (w.year ? ', ' + w.year : '') + ')').join('; ') : '') : x; }
    const e = C.get(x); if (!e) return x;
    return e.name + ' [' + C.LEVELS[C.level(e.id)].name + ']: ' + plain(e.teaser || '') + (e.tip && e.tip.tex ? ' Key formula: $' + e.tip.tex + '$' + (e.tip.ref ? ' (' + e.tip.ref + ')' : '') : '');
  }
  async function roughOut(place, c, btn) {
    if (!L.sample || L.live !== 'on') { V.toast('Roughing out needs the Claude app: this view has no connection to Claude.'); return; }
    if (!L.owner) return;
    if (L.busy.has(c.id)) return;
    L.busy.set(c.id, 'Claude is roughing it out…'); refresh();
    const prompt = 'You write a ROUGH DRAFT for a research codex styled like Pillars of Eternity: a first sketch at the crossing of two things, clearly provisional.\n\n' + (C.pack().context || '') +
      '\n\nA: ' + describe(c.a) + '\nB: ' + describe(c.b) + (c.via && C.get(c.via) ? '\nTHE CROSSING RUNS THROUGH: ' + describe(c.via) : '') +
      '\n\nRules: plain, step-by-step full sentences in your own words; two or three short paragraphs; then three to five leads (a derivation to attempt, a paper to look for, a question to settle), each marked to be checked; never invent page numbers, write CHECK instead; inline math in $...$.' +
      '\nReply with only JSON: {"title":"short title","caption":"one line saying what the crossing is","summary":["paragraph","paragraph"],"points":[{"text":"a lead","check":true}],"keywords":["bestiary id"]}';
    try {
      const r = await L.sample.json(prompt, { cache: false, modelTier: 'default', onText: ({ text }) => { L.busy.set(c.id, 'Claude is roughing it out… ' + text.length + ' characters'); updateBusy(c.id); } });
      if (!r || typeof r !== 'object' || !arr(r.summary, 5).length) throw { code: 'invalid_json' };
      const kws = arr(r.keywords, 12).filter((k) => idOk(k) && C.get(k));
      for (const x of [c.a, c.b, c.via]) if (x && idOk(x) && C.get(x) && !kws.includes(x)) kws.push(x);
      const d = { id: c.id, lore: C.lore, place: place.id, kind: 'rough', title: clean(r.title, 160) || roughTitle(c), authors: 'Claude, live, with ' + (C.pack().short || 'the codex'), year: '', venue: '',
        value: { kind: 'text', text: 'rough draft · ' + today() }, caption: clean(r.caption, 300), summary: arr(r.summary, 5).map((x) => clean(x, 2500)), points: arr(r.points, 6).map((x) => ({ page: '', eq: '', text: clean(x && x.text, 700), check: true })).filter((x) => x.text),
        keywords: kws, keyKeywords: [], full: null, fullStatus: 'none', pages: 0, scanned: false, shared: false, status: 'ready', created: new Date().toISOString(), by: 'claude-live', rough: { a: c.a, b: c.b, via: c.via, at: new Date().toISOString() } };
      await save(d, 'priv-only');
      location.hash = '#/doc/' + d.id;
    } catch (err) {
      const code = err && err.code;
      V.toast(ERR[code] || 'A connection problem interrupted Claude. Try again.');
      if (code === 'not_granted' || code === 'sampling_disabled' || code === 'capability_disabled') L.live = 'off';
    } finally { L.busy.delete(c.id); refresh(); }
  }
  /* a rough asked for from outside the shelf (the empathy lamp): written at the place, then opened */
  async function roughFromOutside(placeId, a, b, via, btn) {
    const place = C.place(placeId);
    if (!place || !C.get(a) || !C.get(b)) return false;
    const c = { id: roughId(a, b), a, b, via: via && C.get(via) ? via : '' };
    if (item(c.id)) { location.hash = '#/doc/' + c.id; return true; }
    await roughOut(place, c, btn);
    return !!item(c.id);
  }
  function roughShelf(place) {
    const have = itemsIn(place.id).filter((d) => d.kind === 'rough');
    const cands = roughCandidates(place).filter((c) => !have.some((d) => d.id === c.id));
    let h = '<section class="panel"><h2>Roughs <span class="h2-n">' + have.length + ' written · ' + cands.length + ' waiting</span></h2>';
    h += '<p class="fam-intro">' + (place.roughs === 'known' ? 'Crossings of what you have studied, taken from the links of the bestiary and the recipe book.' : place.roughs === 'unknown' ? 'What you know crossed with what you have only discovered.' : place.roughs === 'wing' ? 'Crossings of what you have studied in this wing’s families.' : 'The monk’s work crossed with ' + (C.get(place.monk) && C.get(place.monk).hall === 'kudo' ? 'what you have only discovered.' : 'what you have studied.')) + '</p>';
    const candCard = (c) => { const busy = L.busy.get(c.id); return '<div class="book rough-card"><span class="doc-icon" aria-hidden="true"><span>≈</span></span><span class="book-main"><span class="bc-kind">Rough draft · waiting</span><span class="book-title">' + esc(roughTitle(c)) + '</span>' + (c.via && C.get(c.via) ? '<span class="book-by">through ' + esc(nameOf(c.via)) + '</span>' : '') +
      (L.owner ? '<span class="book-value">' + (busy ? '<span class="inbox-busy small"><span class="spin" aria-hidden="true"></span> <span data-busy="' + esc(c.id) + '">' + esc(busy) + '</span></span>' : '<button type="button" class="btn ghost" data-rough-out="' + esc(c.id) + '" data-rough-place="' + esc(place.id) + '"' + (L.live !== 'on' ? ' disabled title="Needs the Claude app"' : '') + '>Rough it out</button>') + '</span>' : '') + '</span></div>'; };
    const gnames = new Map();
    const famKey = (x) => { if (!x || x.startsWith('fig:')) return ''; const g = V.groupOf ? V.groupOf(x) : null; if (g) gnames.set(g.key, g.name); return g ? g.key : ''; };
    const famName = (k) => { const f = (C.pack().families || []).find((x) => x.id === k); return f ? f.name : (gnames.get(k) || k || 'Unplaced'); };
    const all = have.map((d) => ({ kind: 'have', d, fam: d.rough ? (famKey(d.rough.b) || famKey(d.rough.a)) : '' })).concat(cands.map((c) => ({ kind: 'cand', c, fam: famKey(c.b) || famKey(c.a) })));
    const card = (x) => (x.kind === 'have' ? bookCard(x.d) : candCard(x.c));
    const empty = '<p class="muted">Nothing crosses here yet. ' + (place.roughs === 'known' ? 'Study more entries: a rough appears when two studied entries are linked.' : place.roughs === 'unknown' ? 'Discover more keywords.' : place.roughs === 'wing' ? 'Study the entries of this wing’s families.' : 'Study the entries this monk’s work touches.') + '</p>';
    if (!all.length) return h + empty + '</section>';
    const style = place.shelves || 'shelf';
    if (style === 'stack') {
      h += '<div class="stack">' + all.map(card).join('') + '</div>';
    } else if (style === 'rows' || style === 'draftlib') {
      const groups = new Map();
      for (const x of all) { const k = x.fam || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(x); }
      const order = (C.pack().families || []).map((f) => f.id).filter((k) => groups.has(k)).concat(Array.from(groups.keys()).filter((k) => !(C.pack().families || []).some((f) => f.id === k)));
      for (const k of order) {
        h += '<div class="shelf-row"><h3>' + (style === 'rows' ? 'Row · ' : '') + esc(famName(k)) + (style === 'draftlib' ? ' Wing <span class="h2-n">draft</span>' : '') + ' <span class="h2-n">' + groups.get(k).length + '</span></h3><div class="shelf' + (style === 'draftlib' ? ' draft-wing' : '') + '">' + groups.get(k).map(card).join('') + '</div></div>';
      }
      if (style === 'draftlib') {
        const rest = (C.pack().families || []).filter((f) => !groups.has(f.id) && f.id !== 'uncharted' && !f.kind);
        if (rest.length) h += '<div class="shelf-row other-wings"><h3>The Other Wings… <span class="h2-n">' + rest.length + '</span></h3><p class="fogcard"><span class="fogtxt big">????</span><span>' + esc(rest.map((f) => f.name).join(' · ')) + ': nothing crosses them yet.</span></p></div>';
      }
    } else {
      h += '<div class="shelf">' + all.map(card).join('') + '</div>';
    }
    return h + '</section>';
  }

  /* ------------------------------ upload ------------------------------ */
  async function addFile(place, file, btnHolder) {
    if (!L.assets || !L.owner) { V.toast('Adding documents needs edit access to the codex.'); return; }
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) { V.toast('Only PDF files can be shelved here.'); return; }
    if (file.size > MAX_PDF) { V.toast('The file is larger than 20 MB. Compress or split it first.'); return; }
    const tmpId = 'up-' + place.id;
    L.busy.set(tmpId, 'Reading ' + file.name + '…'); refresh();
    let pages = 0; let scanned = false; let title = ''; let authors = '';
    try {
      const buf = await file.arrayBuffer();
      const rec = await openPdf('tmp-' + rid(), new Uint8Array(buf));
      pages = rec.n;
      try { const meta = await rec.doc.getMetadata(); title = clean(meta && meta.info && meta.info.Title, 300); authors = clean(meta && meta.info && meta.info.Author, 300); } catch (err) { /* no metadata */ }
      let words = 0;
      for (let n = 1; n <= Math.min(3, rec.n); n++) words += (await pageText(rec, n)).split(/\s+/).filter(Boolean).length;
      scanned = words < 40;
      if (!title) { const first = (await pageText(rec, 1)).split('\n').map((s) => s.trim()).filter((s) => s.length > 12); title = clean(first[0] || '', 200); }
    } catch (err) { /* the PDF could not be read in the browser; store it anyway */ }
    if (!title) title = clean(file.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '), 200);
    L.busy.set(tmpId, 'Uploading ' + file.name + '…'); refresh();
    let up;
    try { up = await L.assets.upload(file, { type: 'application/pdf' }); }
    catch (err) {
      const code = err && err.code;
      V.toast(code === 'too_large' ? 'The file is too large for the codex.' : code === 'quota_or_state' ? 'The codex has no room for more files.' : code === 'rate_limited' ? 'Too many uploads at once; wait a moment.' : 'The file was not uploaded (' + (code || 'error') + ').');
      L.busy.delete(tmpId); refresh(); return;
    }
    const id = slug(title).slice(0, 30) + '-' + rid();
    const role = roomRole(place);
    const d = { id, lore: C.lore, place: place.id, kind: role === 'own' ? 'own' : role === 'hidden' ? 'paper' : 'notes', title, authors, year: '', venue: '',
      value: null, caption: '', summary: [], points: [], keywords: [], keyKeywords: [], full: null, fullStatus: 'none', pages, scanned, shared: role === 'open', status: 'new',
      created: new Date().toISOString(), updated: '', by: 'owner', asset: { id: up.id, name: clean(file.name, 120), size: file.size, type: 'application/pdf' } };
    L.busy.delete(tmpId);
    await save(d);
    refreshUsage();
    location.hash = '#/doc/' + id;
  }
  async function refreshUsage() {
    if (!L.assets) return;
    try { const r = await L.assets.list(); L.usage = r && r.usage ? r.usage : null; } catch (err) { L.usage = null; }
    const el = root && root.querySelector('[data-usage]'); if (el) el.innerHTML = usageHtml();
  }
  function usageHtml() {
    if (!L.usage || !L.usage.maxBytes) return '';
    const pct = Math.min(100, Math.round((100 * L.usage.bytes) / L.usage.maxBytes));
    const mb = (b) => (b / 1048576).toFixed(b > 10485760 ? 0 : 1) + ' MB';
    return '<span class="lib-usage" title="Storage of the codex"><span class="bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span>' + mb(L.usage.bytes) + ' of ' + mb(L.usage.maxBytes) + ' · ' + L.usage.files + ' files</span>';
  }

  /* ------------------------------ Send to Claude ------------------------------ */
  async function sendBreakdown(d, btn) {
    const room = roomOf(d); const wing = wingOf(room); const lib = C.pack().library;
    const text = 'Break down the document “' + plain(d.title) + '”' + (d.authors ? ' by ' + d.authors : '') + ' for ' + (room ? room.name : 'the library') + (wing ? ' in the ' + wing.name : '') + ' of ' + (lib ? lib.name : 'the library') + ' (lore “' + C.lore + '”). ' +
      'It is stored in the codex: database document ' + privCol(d.lore) + '/' + d.id + (d.asset ? ', asset ' + d.asset.id + ' (' + (d.pages || '?') + ' pages' + (d.scanned ? ', scanned pages without a text layer' : '') + ')' : '') + '. Room role: ' + roomRole(room) + (d.shared ? ' (shared: write the public record library/' + d.id + ' too, without the asset id)' : '') + '. ' +
      'Please write the reading notes with page numbers, pick up to five key keywords, add the Value line and caption, type every formula on scanned pages in LaTeX, and add new keywords to the Bestiary as discovered.';
    const how = await V.askClaude(text, (btn && btn.closest('.doc-window, .panel')) || btn, btn);
    if (how === 'sent') { const doc = strip(d); doc.status = 'sent'; await save(doc); }
  }
  async function sendRough(d, btn) {
    const text = 'Turn the rough draft “' + plain(d.title) + '” (database document ' + privCol(d.lore) + '/' + d.id + ', in ' + C.pack().name + ') into real reading notes: check every claim and lead, add page and equation pointers from the tomes where you are sure (CHECK IN BOOK otherwise), keep it in your own words, and set its kind to notes.';
    const how = await V.askClaude(text, (btn && btn.closest('.doc-window, .panel')) || btn, btn);
    if (how === 'sent') { const doc = strip(d); doc.status = 'sent'; await save(doc, 'priv-only'); }
  }
  async function sendVerify(d, btn) {
    const text = 'Verify the full breakdown of “' + plain(d.title) + '” in ' + C.pack().name + ' (database documents ' + privCol(d.lore) + '/' + d.id + (d.shared ? ' and library/' + d.id : '') + '): check every derivation step against the document, the quiz, the page numbers and the references; correct what is wrong; then set fullStatus to "verified".';
    await V.askClaude(text, (btn && btn.closest('.doc-window, .panel')) || btn, btn);
  }

  /* ------------------------------ views ------------------------------ */
  const crumbRoot = () => [{ href: '#/', label: V.hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }];
  const roleBadge = (p) => '<span class="tag tag-role role-' + esc(roomRole(p)) + '">' + esc(ROLE_TEXT[roomRole(p)] || roomRole(p)) + '</span>';
  function figuresLine(p) {
    const figs = (p.figures || []).map((f) => C.get(f)).filter(Boolean);
    const names = figs.map((f) => f.name).filter((n) => n !== p.name); // a cell that bears its own name is not "named for" itself
    const list = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names.join('');
    return names.length ? '<p class="lib-named">Named for ' + list + (p.year ? ' (' + esc(p.year) + ')' : '') + '.</p>' : '';
  }
  function docIcon(d) {
    const g = d.kind === 'paper' ? '§' : d.kind === 'own' ? '✎' : d.kind === 'thesis' ? 'Θ' : d.kind === 'proceedings' ? '¶' : d.kind === 'review' ? '≡' : d.kind === 'rough' ? '≈' : '¶';
    return '<span class="doc-icon" aria-hidden="true"><span>' + esc(g) + '</span></span>';
  }
  function valueLine(d) {
    const v = d.value;
    if (!v) return d.status === 'new' || d.status === 'sent' ? 'Value: not appraised yet' : 'Value: —';
    if (v.kind === 'cites') return 'Value: ' + Number(v.n).toLocaleString('en-US') + ' citation' + (v.n === 1 ? '' : 's') + (v.src ? ' (' + esc(v.src) + (v.date ? ', ' + esc(v.date) : '') + ')' : '');
    if (v.kind === 'minutes') return 'Value: ' + v.n + ' minute' + (v.n === 1 ? '' : 's') + ' of reading';
    return 'Value: ' + esc(v.text || '—');
  }
  function statusBadge(d) {
    if (d.kind === 'rough') return '<span class="badge badge-warn">rough draft' + (d.status === 'sent' ? ' · sent to Claude' : '') + '</span>';
    if (d.status === 'new') return '<span class="badge badge-warn">waiting: send to Claude</span>';
    if (d.status === 'sent') return '<span class="badge badge-warn">sent to Claude</span>';
    if (d.fullStatus === 'draft') return '<span class="badge badge-warn">full breakdown: draft</span>';
    if (d.fullStatus === 'verified') return '<span class="badge badge-ok">full breakdown verified</span>';
    return '<span class="badge badge-ok">notes ready</span>';
  }
  function bookCard(d) {
    const room = roomOf(d);
    return '<a class="book" href="#/doc/' + esc(d.id) + '">' + docIcon(d) + '<span class="book-main"><span class="bc-kind">' + esc(KINDS[d.kind] || 'Document') + (room ? ' · ' + esc(room.name) : '') + (d.shared && roomRole(room) !== 'open' ? ' · shared' : '') + '</span>' +
      '<span class="book-title">' + esc(d.title) + '</span>' + (d.authors || d.year ? '<span class="book-by">' + esc(d.authors) + (d.year ? ' (' + esc(d.year) + ')' : '') + '</span>' : '') +
      '<span class="book-value">' + valueLine(d) + '</span></span></a>';
  }
  const kids = (p) => (p.children || []).map((c) => C.place(c.id)).filter((c) => c && listed(c));
  const countIn = (p) => itemsIn(p.id).length + (p.children || []).reduce((t, c) => t + countIn(c), 0);
  function wingCard(w) {
    const rooms = kids(w);
    const sealed = roomRole(w) === 'hidden' && !L.owner;
    const n = sealed ? 0 : rooms.reduce((s, r) => s + countIn(r), 0);
    return '<a class="wing' + (sealed ? ' sealed' : '') + '" href="#/library/' + esc(w.id) + '"><span class="wing-kind">' + esc(PLACE_WORD[w.kind] || w.kind) + (w.year ? ' · ' + esc(w.year) : '') + (roomRole(w) === 'hidden' ? ' · keeper only' : '') + '</span><span class="wing-name">' + esc(pname(w)) + '</span><span class="wing-blurb">' + esc(blurbOf(w)) + '</span>' +
      (sealed ? '<span class="wing-rooms">The door is sealed.</span>' : w.door ? '<span class="wing-rooms">A plain door; it opens on another library.</span>' : '<span class="wing-rooms">' + rooms.map((r) => esc(r.name) + (kids(r).length ? ' › ' + kids(r).map((a) => esc(a.name)).join(', ') : '')).join(' · ') + '</span><span class="wing-n">' + n + ' document' + (n === 1 ? '' : 's') + '</span>') + '</a>';
  }
  function viewLibrary() {
    const lib = C.pack().library;
    if (!lib) return V.crumbs(crumbRoot().concat([{ label: 'Library' }])) + '<section class="panel"><h1>No library</h1><p>This lore has no library yet.</p></section>';
    let h = V.crumbs(crumbRoot().concat([{ label: lib.name }]));
    h += '<section class="blk lib-front"><h1>' + esc(lib.name) + '</h1>' + V.ORN + '<p class="lede">' + esc(lib.blurb || '') + '</p><p class="lib-roles">' + ['open', 'own', 'hidden'].map((r) => '<span class="tag tag-role role-' + r + '">' + esc(ROLE_TEXT[r]) + '</span>').join('') + '</p></section>';
    h += '<div class="wings">' + (lib.places || []).map(wingCard).join('') + '</div>';
    if (L.owner) h += '<p class="muted small" data-usage>' + usageHtml() + '</p>';
    return h;
  }
  function viewPlace(pid) {
    const p = C.place(pid);
    if (!p) return V.crumbs(crumbRoot().concat([{ label: 'Not found' }])) + '<section class="panel"><h1>No such place</h1><p>This wing or room is not in the library.</p></section>';
    const lib = C.pack().library;
    const trail = crumbRoot().concat([{ href: '#/library', label: lib.name }]);
    for (const t of p.trail.slice(0, -1)) { const q = C.place(t); if (q) trail.push({ href: '#/library/' + esc(q.id), label: pname(q) }); }
    trail.push({ label: pname(p) });
    if ((isSecret(p) && !L.owner) || gone(p)) return V.crumbs(crumbRoot().concat([{ label: 'Not found' }])) + '<section class="panel"><h1>No such place</h1><p>This wing or room is not in the library.</p></section>';
    if (isSecret(p) && L.owner && !found(p)) markFound(p);
    let h = V.crumbs(trail);
    const kindWord = PLACE_WORD[p.kind] || 'Place';
    h += '<section class="blk"><div class="kind">' + esc(kindWord) + (roomRole(p) === 'hidden' || p.kind !== 'wing' ? ' · ' + roleBadge(p) : '') + (isSecret(p) ? ' <span class="tag tag-role role-secret">on no map</span>' : '') + '</div><h1>' + esc(pname(p)) + '</h1>' + (p.subtitle ? '<p class="subtitle">' + esc(p.subtitle) + '</p>' : '') + V.ORN + '<p class="lede">' + esc(blurbOf(p)) + '</p>' + figuresLine(p) + '</section>';
    if (!canSee(p)) {
      return h + '<section class="panel sealed-door blk"><h2>Sealed</h2><p>The door of ' + esc(/^The /.test(p.name) ? 'the ' + p.name.slice(4) : /^\S+’s /.test(p.name) ? p.name : 'the ' + p.name) + ' is sealed. Only the keeper of this codex enters; what lies beyond is kept where only they can read.</p></section>';
    }
    const childCards = (q) => '<a class="room' + (q.kind === 'chamber' || q.kind === 'altar' ? ' altar' : '') + (q.kind === 'hall' ? ' hall' : '') + '" href="#/library/' + esc(q.id) + '"><span class="bc-kind">' + esc(PLACE_WORD[q.kind] || 'Room') + ' · ' + esc(ROLE_TEXT[roomRole(q)]) + (isSecret(q) ? ' · on no map' : '') + '</span><span class="wing-name">' + esc(pname(q)) + '</span><span class="wing-blurb">' + esc(blurbOf(q)) + '</span><span class="wing-n">' + ((q.counsel || q.vacant) && window.CodexCounsel ? window.CodexCounsel.cardLine(q) : countIn(q) + ' document' + (countIn(q) === 1 ? '' : 's')) + '</span></a>';
    const shown = kids(p);
    if (p.door && window.CodexCounsel) return h + window.CodexCounsel.doorHtml(p);
    if (p.kind === 'wing') {
      h += '<div class="rooms">' + shown.map((r) => childCards(r) + (r.kind === 'room' ? kids(r).map(childCards).join('') : '')).join('') + '</div>';
      return h;
    }
    if (p.kind === 'hall') {
      // the loose stone: the owner finds the secret hall from the known one
      const secretSib = L.owner ? (C.place(p.trail[0]).children || []).map((c) => C.place(c.id)).filter((c) => c && c.secret && !found(c)) : [];
      h += '<section class="panel"><h2>Cloister <span class="h2-n">' + shown.length + ' chambers</span></h2><div class="rooms cloister">' + shown.map(childCards).join('') + '</div>' +
        (secretSib.length ? '<p class="loose-stone"><a href="#/library/' + esc(secretSib[0].id) + '" data-loose-stone="' + esc(secretSib[0].id) + '" title="A draught from behind the shelf">· a draught from behind the shelf ·</a></p>' : '') + '</section>';
      h += roughShelf(p);
      return h;
    }
    if (p.kind === 'chamber' || p.kind === 'cell') {
      const f = p.monk ? C.get(p.monk) : p.supervisor ? C.get(p.supervisor) : null;
      if (f) h += '<section class="panel"><h2>' + (p.kind === 'cell' ? (p.counsel ? 'The member' : 'The monk') : p.supervisor ? 'Supervised by' : p.counsel ? 'Holder of the chamber' : 'The monk') + '</h2><div class="cards">' + figureCardOf(f) + '</div></section>';
      // the board (3.0.0): the chamber of the board shows its seats and cells first, then the map, the window, the lens and the ledger; a cell shows its lens and ledger
      const board = (p.counsel || p.vacant) && window.CodexCounsel;
      if (board) h += window.CodexCounsel.panelHtml(p, 'head');
      if (shown.length) h += '<div class="rooms">' + shown.map(childCards).join('') + '</div>';
      if (board) h += window.CodexCounsel.panelHtml(p, 'body');
      if (window.CodexLamp) h += window.CodexLamp.panelHtml(p);
      if (f && V.mustReadsHtml && (f.books || []).length) h += V.mustReadsHtml(f, true);
      if (!board) h += roughShelf(p);
      return h;
    }
    const list = itemsIn(p.id);
    if (shown.length) h += '<div class="rooms">' + shown.map(childCards).join('') + '</div>';
    if (p.roughs) h += roughShelf(p);
    h += '<section class="panel"><h2>Shelf <span class="h2-n">' + list.length + '</span></h2>';
    if (!L.loaded.pub || (L.owner && !L.loaded.priv)) h += '<p class="muted small">Opening the shelf…</p>';
    else if (!list.length) h += '<p class="muted">Nothing on this shelf yet.' + (L.owner ? ' Add a PDF below, then press “Send to Claude”.' : '') + '</p>';
    else h += '<div class="shelf">' + list.map(bookCard).join('') + '</div>';
    h += '</section>';
    if (L.owner) h += addBox(p);
    return h;
  }
  function figureCardOf(e) {
    return '<a class="bcard fig" href="#/e/' + esc(e.id) + '">' + V.medal(e) + '<span class="bc-main"><span class="bc-kind">' + esc(e.role || 'Figure') + (e.years ? ' · ' + esc(e.years) : '') + '</span><span class="bc-name">' + esc(e.name) + '</span><span class="bc-teaser">' + V.rich(e.teaser || '') + '</span></span></a>';
  }
  function addBox(p) {
    const busy = L.busy.get('up-' + p.id);
    const role = roomRole(p);
    let h = '<section class="panel lib-add blk"><h2>Add a document</h2>';
    if (L.assets === undefined) h += '<p class="muted small">Checking whether files can be added here…</p>';
    else if (!L.assets) h += '<p class="muted small">Adding files needs edit access to the codex. Send the PDF in the chat instead.</p>';
    else {
      h += '<p class="small">' + (role === 'hidden' ? 'A paper laid here is seen by you alone: its pages and its file list are stored where only the owner can read.' : role === 'own' ? 'Your own writing. The item stays private until you share it from its page.' : 'Anything shelved here is readable by everyone you share the codex with; the original file stays yours.') + ' PDF only, up to 20 MB.</p>';
      h += '<div class="inbox-actions"><label class="btn inbox-pick"' + (busy ? ' aria-disabled="true"' : '') + '><input type="file" accept="application/pdf,.pdf" data-lib-file="' + esc(p.id) + '"' + (busy ? ' disabled' : '') + '>Choose a PDF</label></div>';
      h += busy ? '<p class="small inbox-busy"><span class="spin" aria-hidden="true"></span> ' + esc(busy) + '</p>' : '';
      if (role === 'own') h += '<div class="lib-write"><p class="small">Or write here:</p><form data-lib-write="' + esc(p.id) + '" class="q-form"><label for="lw-title">Title</label><input id="lw-title" name="title" maxlength="200" required><label for="lw-text">Text (paragraphs separated by blank lines; $…$ for math)</label><textarea id="lw-text" name="text" rows="8" maxlength="20000" required></textarea><button class="btn" type="submit">Shelve it</button></form></div>';
    }
    return h + '</section>';
  }

  /* the document window: a Pillars-style book with two tabs */
  function tabOf(d) { return L.tab.get(d.id) || 'breakdown'; }
  function sealState(d) {
    const missing = (d.keyKeywords || []).map((k) => C.get(k)).filter(Boolean).filter((e) => C.level(e.id) < 2);
    const un = !!(Store.entry('doc:' + d.id).unsealed);
    return { sealed: missing.length > 0 && !un, missing, unsealed: un };
  }
  function viewDoc(id) {
    const d = item(id);
    const room = d ? roomOf(d) : null;
    if (!d || (room && !canSee(room))) return V.crumbs(crumbRoot().concat([{ href: '#/library', label: 'Library' }, { label: 'Not found' }])) + '<section class="panel"><h1>Not on any shelf</h1><p>' + (L.loaded.pub ? 'This document is not in the library, or it lies where only the keeper may read.' : 'Opening the library…') + '</p></section>';
    const lib = C.pack().library;
    const trail = crumbRoot().concat([{ href: '#/library', label: lib ? lib.name : 'Library' }]);
    if (room) { const w = wingOf(room); if (w) trail.push({ href: '#/library/' + esc(w.id), label: pname(w) }); trail.push({ href: '#/library/' + esc(room.id), label: pname(room) }); }
    trail.push({ label: d.title });
    const tab = tabOf(d);
    const canOriginal = L.owner && !!d.asset;
    let h = V.crumbs(trail);
    h += '<article class="doc-window" data-doc="' + esc(d.id) + '"><div class="cw-title"><span>' + esc(KINDS[d.kind] || 'Document') + '</span><a class="cw-close" href="#/library/' + esc(room ? room.id : '') + '" aria-label="Close">×</a></div>';
    h += '<header class="doc-head">' + docIcon(d) + '<div class="doc-id"><div class="kind">' + (room ? esc(room.name) + ' · ' : '') + roleBadge(room) + ' ' + statusBadge(d) + '</div><h1>' + esc(d.title) + '</h1>' +
      (d.authors || d.venue || d.year ? '<p class="doc-by">' + esc(d.authors) + (d.venue ? (d.authors ? ' · ' : '') + esc(d.venue) : '') + (d.year ? ' (' + esc(d.year) + ')' : '') + '</p>' : '') +
      '<p class="doc-value">' + valueLine(d) + (d.doi ? ' · <a href="https://doi.org/' + esc(d.doi) + '" target="_blank" rel="noopener">DOI</a>' : '') + (d.url ? ' · <a href="' + esc(d.url) + '" target="_blank" rel="noopener">Source</a>' : '') + (d.pages ? ' · ' + d.pages + ' pages' : '') + (d.scanned ? ' · scanned' : '') + '</p></div></header>';
    h += '<nav class="doc-tabs" aria-label="Document tabs"><button type="button" class="' + (tab === 'breakdown' ? 'on' : '') + '" data-doc-tab="breakdown">Breakdown</button>' + (canOriginal ? '<button type="button" class="' + (tab === 'original' ? 'on' : '') + '" data-doc-tab="original">Original</button>' : '') + '</nav>';
    h += '<div class="parchment ornate">' + (tab === 'original' && canOriginal ? originalHtml(d) : breakdownHtml(d)) + '<span class="scroll-orn top" aria-hidden="true"></span><span class="scroll-orn bottom" aria-hidden="true"></span></div>';
    if (L.owner) h += ownerBar(d);
    h += '</article>';
    return h;
  }
  function breakdownHtml(d) {
    let h = '';
    const seal = sealState(d);
    if (d.kind === 'rough' && d.rough) h += '<p class="doc-caption">A rough draft at the crossing of <b>' + esc(nameOf(d.rough.a)) + '</b> and <b>' + esc(nameOf(d.rough.b)) + '</b>' + (d.rough.via && C.get(d.rough.via) ? ', through ' + esc(nameOf(d.rough.via)) : '') + '. Provisional: every lead is marked to be checked.</p>';
    if (d.caption) h += '<p class="doc-caption">' + V.rich(d.caption) + '</p>';
    if (d.summary.length) h += d.summary.map((p, i) => '<p class="blk' + (i === 0 ? ' dropfirst' : '') + '">' + V.rich(p) + '</p>').join('');
    else if (d.text.length) h += d.text.map((p, i) => '<p class="blk' + (i === 0 ? ' dropfirst' : '') + '">' + V.rich(p) + '</p>').join('');
    else h += '<p class="blk dropfirst muted">' + (d.status === 'sent' ? 'Sent to Claude. The reading notes appear here once written.' : L.owner ? 'No notes yet. Press “Send to Claude” below and the reading notes, page numbers and keywords appear here.' : 'No notes yet.') + '</p>';
    if (d.points.length) {
      h += '<h3>Point by point</h3><ol class="doc-points">' + d.points.map((p) => '<li class="blk">' + (p.page ? '<button type="button" class="pchip" data-doc-page="' + esc(p.page) + '" title="Open this page in the original">p. ' + esc(p.page) + '</button>' : '') + (p.eq ? '<span class="pchip eq">eq. ' + esc(p.eq) + '</span>' : '') + (p.check ? '<span class="flag">CHECK IN PAPER</span> ' : '') + V.rich(p.text) + '</li>').join('') + '</ol>';
    }
    if (d.formulas.length) {
      h += '<h3>Formulas typed from the pages</h3><div class="eqs">' + d.formulas.map((f) => '<figure class="eq blk">' + V.texBlock(f.tex) + '<figcaption><span class="ref nolink">' + (f.page ? 'p. ' + esc(f.page) : '') + (f.eq ? ' eq. ' + esc(f.eq) : '') + '</span>' + (f.note ? ' <span class="eqnote">' + V.rich(f.note) + '</span>' : '') + '</figcaption></figure>').join('') + '</div>';
    }
    const kws = (d.keywords || []).filter((k) => C.get(k));
    const keys = (d.keyKeywords || []).filter((k) => C.get(k));
    if (kws.length || keys.length) {
      h += '<h3>Keywords</h3>';
      if (keys.length) h += '<p class="small muted">Key keywords, to know before the derivation: </p><div class="chips">' + keys.map((k) => V.entryChip(k)).join('') + '</div>';
      const rest = kws.filter((k) => !keys.includes(k));
      if (rest.length) h += '<div class="chips" style="margin-top:8px">' + rest.map((k) => V.entryChip(k)).join('') + '</div>';
    }
    if (d.kind === 'rough') return h;
    if (d.full) {
      const f = d.full;
      h += '<h3>Full breakdown ' + (d.fullStatus === 'verified' ? '<span class="badge badge-ok">verified' + (f.at ? ' · ' + esc(f.at.slice(0, 10)) : '') + '</span>' : '<span class="badge badge-warn">draft written live by Claude</span>') + '</h3>';
      if (seal.sealed) {
        h += '<div class="seal blk" data-seal="' + esc(d.id) + '"><span class="fogtxt big">????</span><p>The derivation path and the quiz are sealed until these keywords reach <b>Studied</b>:</p><div class="chips">' + seal.missing.map((e) => V.entryChip(e.id)).join('') + '</div>' +
          (L.owner && Store.canWrite() ? '<button type="button" class="btn ghost" data-doc-unseal="' + esc(d.id) + '">Unseal anyway</button>' : '') + '</div>';
      } else {
        if (seal.unsealed && seal.missing.length) h += '<p class="small muted">Unsealed early; ' + seal.missing.length + ' key keyword' + (seal.missing.length === 1 ? '' : 's') + ' still below Studied.</p>';
        if (f.steps.length) h += '<h4>Derivation path</h4><ol class="steps doc-steps">' + f.steps.map((s) => '<li class="blk">' + V.rich(s.text) + (s.ref ? ' <span class="ref">' + esc(s.ref) + '</span>' : '') + '</li>').join('') + '</ol>';
        if (f.quiz.length) h += quizHtml(d, f.quiz);
      }
      if (f.research.length) h += '<h4>In your research</h4><ul class="prose-list research">' + f.research.map((x) => '<li class="blk">' + V.rich(x) + '</li>').join('') + '</ul>';
      if (f.references.length) h += '<h4>References</h4>' + f.references.map((r) => V.litCard(r, 'related')).join('');
      if (f.newKeywords.length) h += '<h4>New keywords</h4><div class="chips">' + f.newKeywords.map((k) => { const id = 'st-' + slug(k.name); return C.get(id) ? V.entryChip(id) : '<span class="chip chip-fog">' + esc(k.name) + '</span>'; }).join('') + '</div>';
    } else if (L.owner && d.status !== 'new') {
      h += '<h3>Full breakdown</h3><p class="small">Not written yet. The full version adds the derivation path with pages and equations, a quiz, the link to your research and the references.</p>' +
        '<p class="small muted">The derivation and the quiz stay sealed until the key keywords reach Studied.</p>' +
        '<button type="button" class="btn" data-doc-generate="' + esc(d.id) + '"' + (L.busy.has(d.id) || L.live !== 'on' ? ' disabled' : '') + '>Generate full breakdown</button>' +
        (L.busy.has(d.id) ? ' <span class="small inbox-busy"><span class="spin" aria-hidden="true"></span> <span data-busy="' + esc(d.id) + '">' + esc(L.busy.get(d.id)) + '</span></span>' : L.live === 'off' ? ' <span class="small muted">Needs the Claude app.</span>' : '');
    }
    return h;
  }
  function quizHtml(d, quiz) {
    const key = 'doc:' + d.id;
    const p = Store.entry(key);
    let h = '<h4 id="quiz-' + esc(d.id) + '">Quiz</h4><p class="small muted">Pass mark 80%. ' + (p.quizBest == null ? 'Not attempted yet.' : 'Best score ' + Math.round(p.quizBest * 100) + '%' + (p.quizPassed ? ' · passed' : '') + '.') + '</p><form class="quiz doc-quiz" data-doc-quiz="' + esc(d.id) + '">';
    quiz.forEach((q, qi) => {
      h += '<fieldset class="q" data-qi="' + qi + '"><legend><span class="qn">' + (qi + 1) + '.</span> ' + V.rich(q.q) + '</legend>';
      /* 3.0.4: the options are shown in a fixed shuffled order (the answer key stays on the original index) */
      (window.CodexShuffle ? window.CodexShuffle(q.options.length, d.id + ':' + qi) : q.options.map((_, i) => i)).forEach((oi) => { const o = q.options[oi]; const idd = 'dq-' + d.id + '-' + qi + '-' + oi; h += '<label class="opt" for="' + idd + '"><input type="radio" name="dq-' + esc(d.id) + '-' + qi + '" id="' + idd + '" value="' + oi + '"><span>' + V.rich(o) + '</span></label>'; });
      h += '<div class="why" hidden>' + V.rich(q.why || '') + '</div></fieldset>';
    });
    return h + '<div class="quiz-actions"><button type="submit" class="btn">Check answers</button><span class="quiz-result" role="status"></span></div></form>';
  }
  function originalHtml(d) {
    if (d.scanned) return '<p class="small muted">Scanned pages: the browser cannot read their words, so the pages open as pictures. Keywords and formulas are in the Breakdown tab.</p><div class="pdf-pages" data-pdf="' + esc(d.asset.id) + '" data-scanned="1"></div>';
    return '<p class="small muted pdf-note">Your file, page by page. Keywords are underlined where the text layer of the PDF carries them; hover one for its card. Only you see this tab.</p><div class="pdf-pages" data-pdf="' + esc(d.asset.id) + '"></div>';
  }
  function ownerBar(d) {
    const room = roomOf(d); const role = roomRole(room);
    let h = '<div class="cw-bar doc-bar"><div class="small">' + (d.asset ? esc(d.asset.name) + ' · ' + (d.asset.size / 1048576).toFixed(1) + ' MB' : 'Written in the codex') + '</div><div class="cw-buttons">';
    if (d.kind === 'rough') h += '<button type="button" class="cw-btn" data-doc-rough-send="' + esc(d.id) + '">' + (d.status === 'sent' ? 'Sent · send again' : 'Send to Claude for real notes') + '</button>';
    else if (d.status === 'new' || d.status === 'sent') h += '<button type="button" class="cw-btn" data-doc-send="' + esc(d.id) + '">' + (d.status === 'sent' ? 'Send again' : 'Send to Claude') + '</button>';
    if (d.full && d.fullStatus === 'draft') h += '<button type="button" class="cw-btn" data-doc-verify="' + esc(d.id) + '">Send to Claude to verify</button>';
    if (d.kind === 'rough') { const c = { a: d.rough ? d.rough.a : '', b: d.rough ? d.rough.b : '', via: d.rough ? d.rough.via : '', id: d.id }; if (c.a && c.b) h += '<button type="button" class="cw-btn ghost" data-rough-again="' + esc(d.id) + '"' + (L.live !== 'on' ? ' disabled' : '') + '>Rough it out again</button>'; }
    if (role === 'own') h += '<button type="button" class="cw-btn ghost" data-doc-share="' + esc(d.id) + '">' + (d.shared ? 'Make private' : 'Share') + '</button>';
    h += '<button type="button" class="cw-btn ghost" data-doc-del="' + esc(d.id) + '">Remove</button></div></div>';
    return h;
  }

  /* the index (margin): the library tree with its documents */
  function indexHtml(curId, closed) {
    const lib = C.pack().library;
    if (!lib) return '';
    const cur = V.current ? V.current() : null;
    const curDoc = cur && cur.name === 'doc' ? cur.args[0] : null;
    const curPlace = cur && cur.name === 'library' ? cur.args[0] : null;
    const all = items();
    const open = !closed || curDoc || curPlace;
    let h = '<details class="ci-group" data-ci="library"' + (open ? ' open' : '') + '><summary>' + esc(lib.name) + '<span class="ci-n">' + all.length + '</span></summary>';
    h += '<a class="ci-row ci-place' + (curPlace === undefined || (cur && cur.name === 'library' && !curPlace) ? ' on' : '') + '" href="#/library"><span class="ci-g" aria-hidden="true">⌂</span><span class="ci-name">The front</span></a>';
    for (const p of C.places()) {
      if ((isSecret(p) && !listed(p)) || gone(p)) continue;
      if (p.kind === 'wing') { h += '<div class="ci-fam">' + esc(pname(p)) + (roomRole(p) === 'hidden' && !L.owner ? ' · sealed' : '') + '</div>'; continue; }
      const wing = C.place(p.trail[0]);
      if (wing && roomRole(wing) === 'hidden' && !L.owner) continue;
      const sealed = !canSee(p);
      const n = countIn(p);
      const g = p.kind === 'cell' ? '·' : p.kind === 'chamber' ? '◦' : p.kind === 'hall' ? '◇' : p.kind === 'altar' ? '✦' : sealed ? '🔒' : '▭';
      h += '<a class="ci-row ci-place depth-' + Math.min(3, p.depth) + (sealed ? ' fog' : '') + (curPlace === p.id ? ' on' : '') + '" href="#/library/' + esc(p.id) + '"><span class="ci-g" aria-hidden="true">' + g + '</span><span class="ci-name">' + esc(pname(p)) + (n ? ' <span class="ci-n">' + n + '</span>' : '') + '</span></a>';
      if (!sealed && p.kind !== 'chamber' && p.kind !== 'cell') for (const d of itemsIn(p.id).slice(0, 12)) h += '<a class="ci-row ci-doc' + (curDoc === d.id ? ' on' : '') + '" href="#/doc/' + esc(d.id) + '"><span class="ci-g" aria-hidden="true">' + (d.kind === 'rough' ? '≈' : '¶') + '</span><span class="ci-name">' + esc(d.title) + '</span></a>';
    }
    return h + '</details>';
  }
  function summary() {
    const lib = C.pack().library;
    const all = items();
    if (!lib) return { name: 'Library', items: 0, line: 'No library in this lore.' };
    const wings = (lib.places || []).map((w) => pname(w)).join(', ');
    return { name: lib.name, items: all.length, line: (lib.places || []).length + ' wings: ' + wings + '. ' + all.length + ' document' + (all.length === 1 ? '' : 's') + ' on the shelves.' };
  }
  function teaserHtml() {
    const lib = C.pack().library;
    if (!lib) return '';
    const all = items();
    return '<section class="panel lib-teaser"><h2>' + esc(lib.name) + '</h2><p>' + esc(lib.blurb || '') + '</p><p class="small muted">' + all.length + ' document' + (all.length === 1 ? '' : 's') + ' on the shelves' + (L.owner ? '; upload a paper in the Restricted Section and send it to Claude.' : '.') + '</p><a class="req ghost" href="#/library">Enter the library</a></section>';
  }
  /* 3.0.4: a word starts with the query ("ell" no longer finds "cells"); inside a word only for queries of six letters or more */
  function wordHit(hay, q) {
    let i = hay.indexOf(q);
    while (i >= 0) { if (i === 0 || !/[\p{L}\p{N}]/u.test(hay[i - 1])) return true; i = hay.indexOf(q, i + 1); }
    return q.length >= 6 && hay.includes(q);
  }
  function search(q) {
    const out = [];
    for (const d of items()) {
      const room = roomOf(d);
      if (room && !canSee(room)) continue;
      const hay = (d.title + ' ' + d.authors).toLowerCase();
      if (wordHit(hay, q)) out.push({ href: '#/doc/' + d.id, label: d.title, sub: (KINDS[d.kind] || 'Document') + (room ? ' · ' + room.name : ''), fog: false, g: '¶', score: d.title.toLowerCase().startsWith(q) ? 0 : 1 });
    }
    for (const p of C.places()) if (listed(p) && wordHit(p.name.toLowerCase(), q)) out.push({ href: '#/library/' + p.id, label: p.name, sub: 'Library · ' + (PLACE_WORD[p.kind] || p.kind), fog: !canSee(p), g: '⌂', score: 1 });
    return out;
  }

  /* ------------------------------ mount, refresh, events ------------------------------ */
  function mount(el, a) {
    root = el; args = a || [];
    subscribePrivate();
    refresh();
    if (L.owner && L.assets && !L.usage) refreshUsage();
  }
  function refresh() {
    if (!root || !root.isConnected) return;
    const [name, b] = args;
    V.clearMath(root);
    window.CodexForms.swap(root, name === 'doc' ? viewDoc(b) : b ? viewPlace(b) : viewLibrary());
    if (name === 'doc') { const d0 = item(b); const st0 = d0 ? sealState(d0) : null; sealSig = st0 ? (st0.sealed ? 's' : 'o') + st0.missing.map((e) => e.id).join(',') : ''; }
    V.linkify(root, name === 'doc' ? null : undefined);
    V.typesetNow(root);
    const pages = root.querySelector('.pdf-pages');
    if (pages) mountPdf(pages);
  }
  async function mountPdf(holder) {
    const assetId = holder.dataset.pdf;
    const scanned = holder.dataset.scanned === '1';
    holder.innerHTML = '<p class="small muted"><span class="spin" aria-hidden="true"></span> Opening the file…</p>';
    let rec;
    try { rec = await openPdf(assetId); } catch (err) { holder.innerHTML = '<p class="muted">The file could not be opened in this browser (' + esc((err && err.message) || 'error') + ').</p>'; return; }
    if (!holder.isConnected) return;
    holder.innerHTML = '';
    const width = Math.min(820, holder.getBoundingClientRect().width || 700);
    const d = item(root.querySelector('.doc-window').dataset.doc);
    for (let n = 1; n <= rec.n; n++) {
      const fig = document.createElement('figure');
      fig.className = 'pdf-page';
      fig.dataset.page = String(n);
      const box = document.createElement('div'); box.className = 'pdf-box'; box.style.minHeight = '200px';
      const cap = document.createElement('figcaption');
      cap.innerHTML = '<span class="pdf-pn">p. ' + n + '</span>' + (scanned ? '<span class="pdf-cap">' + (d && d.caption ? d.caption : 'Scanned page') + '</span>' : '');
      fig.appendChild(box); fig.appendChild(cap);
      holder.appendChild(fig);
    }
    if (scanned && d) {
      const tags = (d.keywords || []).filter((k) => C.get(k)).map((k) => V.entryChip(k)).join('');
      if (tags) { const row = document.createElement('div'); row.className = 'chips pdf-tags'; row.innerHTML = tags; holder.prepend(row); }
    }
    const io = new IntersectionObserver((list) => {
      for (const en of list) {
        if (!en.isIntersecting) continue;
        const fig = en.target; io.unobserve(fig);
        const n = Number(fig.dataset.page);
        renderPage(rec, n, fig.querySelector('.pdf-box'), width).then((info) => {
          if (scanned) fig.classList.add('is-scan');
          else if (!info.hasText) fig.querySelector('figcaption').insertAdjacentHTML('beforeend', '<span class="pdf-cap muted">no text layer on this page</span>');
        }).catch(() => { fig.querySelector('.pdf-box').innerHTML = '<p class="muted small">Page ' + n + ' could not be drawn.</p>'; });
      }
    }, { rootMargin: '600px 0px' });
    holder.querySelectorAll('.pdf-page').forEach((f) => io.observe(f));
    const want = holder.dataset.goto; if (want) { const f = holder.querySelector('.pdf-page[data-page="' + want + '"]'); if (f) setTimeout(() => f.scrollIntoView({ block: 'start' }), 60); }
  }

  document.addEventListener('change', (ev) => {
    const inp = ev.target;
    if (!inp.matches || !inp.matches('[data-lib-file]')) return;
    const p = C.place(inp.dataset.libFile);
    if (!p || !inp.files || !inp.files.length) return;
    addFile(p, inp.files[0]);
  });
  document.addEventListener('submit', async (ev) => {
    const form = ev.target.closest && ev.target.closest('form[data-lib-write]');
    if (form) {
      ev.preventDefault();
      const p = C.place(form.dataset.libWrite); if (!p) return;
      const title = clean(form.title.value, 200); const text = String(form.text.value || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).slice(0, 40);
      if (!title || !text.length) { if (window.CodexForms) window.CodexForms.unsent(form); return; }
      const id = slug(title).slice(0, 30) + '-' + rid();
      const d = { id, lore: C.lore, place: p.id, kind: 'own', title, authors: '', year: '', venue: '', value: { kind: 'minutes', n: Math.max(1, Math.round(text.join(' ').split(/\s+/).length / 200)) }, caption: '', summary: [], points: [], text, keywords: [], keyKeywords: [], full: null, fullStatus: 'none', pages: 0, scanned: false, shared: false, status: 'ready', created: new Date().toISOString(), by: 'owner' };
      await save(d);
      location.hash = '#/doc/' + id;
      return;
    }
    const qf = ev.target.closest && ev.target.closest('form[data-doc-quiz]');
    if (qf) {
      ev.preventDefault();
      const d = item(qf.dataset.docQuiz); if (!d || !d.full) return;
      let right = 0; let answered = 0;
      qf.querySelectorAll('fieldset.q').forEach((fs) => {
        const q = d.full.quiz[Number(fs.dataset.qi)]; const chosen = fs.querySelector('input:checked');
        fs.classList.remove('ok', 'bad'); fs.querySelectorAll('label.opt').forEach((l) => l.classList.remove('is-right', 'is-wrong'));
        if (!chosen) return; answered++;
        const ok = Number(chosen.value) === q.answer; if (ok) right++;
        fs.classList.add(ok ? 'ok' : 'bad'); chosen.closest('label').classList.add(ok ? 'is-right' : 'is-wrong');
        const c = fs.querySelector('input[value="' + q.answer + '"]'); if (c) c.closest('label').classList.add('is-right');
        const why = fs.querySelector('.why'); if (why) why.hidden = false;
      });
      const out = qf.querySelector('.quiz-result');
      if (answered < d.full.quiz.length) { out.textContent = 'Answer every question first (' + answered + ' of ' + d.full.quiz.length + ').'; return; }
      const score = right / d.full.quiz.length;
      out.textContent = right + ' of ' + d.full.quiz.length + ' right (' + Math.round(score * 100) + '%). ' + (score >= C.PASS_MARK ? 'Passed.' : 'Not passed yet.');
      if (Store.canWrite()) Store.recordQuiz('doc:' + d.id, score);
    }
  });
  document.addEventListener('click', async (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-doc-tab], [data-doc-page], [data-doc-unseal], [data-doc-generate], [data-doc-send], [data-doc-verify], [data-doc-share], [data-doc-del], [data-doc-del-yes], [data-doc-del-no], [data-rough-out], [data-rough-again], [data-doc-rough-send], [data-loose-stone]');
    if (!t || !root) return;
    if (t.dataset.looseStone) { markFound(C.place(t.dataset.looseStone)); return; }
    if (t.dataset.roughOut) { const place = C.place(t.dataset.roughPlace); const c = place && roughCandidates(place).find((x) => x.id === t.dataset.roughOut); if (place && c) roughOut(place, c, t); return; }
    if (t.dataset.roughAgain) { const d0 = item(t.dataset.roughAgain); const place = d0 && roomOf(d0); if (d0 && place && d0.rough) roughOut(place, { id: d0.id, a: d0.rough.a, b: d0.rough.b, via: d0.rough.via }, t); return; }
    if (t.dataset.docRoughSend) { const d0 = item(t.dataset.docRoughSend); if (d0) sendRough(d0, t); return; }
    const win = t.closest('.doc-window'); const id = win ? win.dataset.doc : null; const d = id ? item(id) : null;
    if (t.dataset.docTab) { if (d) { L.tab.set(d.id, t.dataset.docTab); refresh(); } return; }
    if (t.dataset.docPage) {
      if (d && L.owner && d.asset) { L.tab.set(d.id, 'original'); refresh(); const pages = root.querySelector('.pdf-pages'); if (pages) pages.dataset.goto = t.dataset.docPage; const f = root.querySelector('.pdf-page[data-page="' + t.dataset.docPage + '"]'); if (f) f.scrollIntoView({ block: 'start' }); }
      else V.toast('The original opens for the owner of the codex.');
      return;
    }
    if (t.dataset.docUnseal) { if (Store.canWrite()) { Store.update('doc:' + t.dataset.docUnseal, { unsealed: true }); refresh(); } return; }
    if (t.dataset.docGenerate) { if (d) generateFull(d, t); return; }
    if (t.dataset.docSend) { if (d) sendBreakdown(d, t); return; }
    if (t.dataset.docVerify) { if (d) sendVerify(d, t); return; }
    if (t.dataset.docShare) { if (d) { const doc = strip(d); doc.shared = !d.shared; await save(doc); V.toast(doc.shared ? 'Shared with everyone the codex is shared with. The file stays yours.' : 'Private again.'); } return; }
    if (t.dataset.docDel) { t.outerHTML = '<span class="q-confirm">Remove this document and its file? <button type="button" class="cw-btn" data-doc-del-yes="' + esc(id) + '">Remove</button> <button type="button" class="cw-btn ghost" data-doc-del-no="1">Keep</button></span>'; return; }
    if (t.dataset.docDelYes) { if (d) { const room = roomOf(d); await removeItem(d); location.hash = '#/library/' + (room ? room.id : ''); } return; }
    if (t.dataset.docDelNo) { refresh(); return; }
  });
  // the owner's private shelf follows the lore
  let lastLore = C.lore;
  setInterval(() => { if (C.lore !== lastLore) { lastLore = C.lore; subscribePrivate(); } }, 800);

  /* progress changed (a step ticked, a quiz passed, a place found): re-render only when the seal would change, so a quiz result stays on screen */
  let sealSig = '';
  function progress() {
    if (!root || !root.isConnected) return;
    const [name, b] = args;
    if (name !== 'doc') { refresh(); return; }
    const d = item(b);
    if (!d) return;
    const st = sealState(d);
    const sig = (st.sealed ? 's' : 'o') + st.missing.map((e) => e.id).join(',');
    if (sig !== sealSig) { sealSig = sig; refresh(); return; }
    const best = root.querySelector('.doc-quiz');
    if (best) { const p = Store.entry('doc:' + d.id); const line = best.previousElementSibling; if (line && line.classList.contains('muted')) line.textContent = 'Pass mark 80%. ' + (p.quizBest == null ? 'Not attempted yet.' : 'Best score ' + Math.round(p.quizBest * 100) + '%' + (p.quizPassed ? ' · passed' : '') + '.'); }
  }
  window.CodexLibrary = { owner: () => !!L.owner, ownerKnown: () => !!L.ownerKnown, mount, refresh, progress, indexHtml, summary, teaserHtml, search, items, item, rough: roughFromOutside, hidden: hiddenEntry, placeHidden: hiddenPlace, _test: { sanitize, sealState } };
  connect();
})();
