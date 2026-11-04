/* Resonance Codex — the empathy lamp.
   A lamp stands by every monk's cell and by each of the Giants named in a chamber. The keeper lights it, assumes
   the monk — writes in the first person as he would, from inside his context — and prays. The lamp is the codex's
   record of the monk (it never speaks as him): with every prayer it measures the sync (how far she drifted from
   the record and how to come closer), answers her question from the record, and names the gaps in her codex it
   sees, with lettered options to close them (add to the bestiary, study, craft, rough out, read, ask Claude, or
   spec a new mmvc — a new top-level section of the codex). Every session is kept whole in the hidden part of the
   codex (private/<lore>/syncs/<monk>/sessions/<id>) and summarised on an index document the lamp reads before
   answering, so it remembers the previous syncs. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;

  const KINDS = ['bestiary', 'study', 'craft', 'rough', 'read', 'ask', 'mmvc'];
  const KIND_WORD = { bestiary: 'Add to the bestiary', study: 'Study', craft: 'Craft', rough: 'Rough it out', read: 'Read', ask: 'Ask Claude', mmvc: 'New section' };
  const LETTERS = 'ABCDEFGHIJKL';
  const MAX_TURNS = 80;
  const ERR = { not_granted: 'The lamp is not allowed in this view (permission declined).', sampling_disabled: 'Claude is not available for this account.', not_declared: 'This version of the page cannot call Claude.', capability_disabled: 'The lamp is switched off in this view.', capability_removed: 'The lamp is switched off in this view.',
    rate_limited: 'Claude is busy or your usage limit is reached. Pray again later.', session_expired: 'Sign in again to light the lamp.', refused: 'Claude declined this prayer. Reword it.', invalid_json: 'The lamp’s answer could not be read. Pray again.', empty_completion: 'The lamp returned nothing. Pray again.', prompt_too_large: 'Too much goes with this prayer; snuff the lamp and light it again.', cancelled: 'Stopped.' };
  const PERMANENT = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

  const S = {
    db: null, owner: false, sample: null, live: 'pending', tiers: null, connected: false,
    index: new Map(),          // monk id -> index document of this lore
    indexLore: null, indexUnsub: null, loaded: false,
    sessions: new Map(),       // session id -> full session document (read or written here)
    open: null,                // { monk, s } the lit lamp
    busy: null,                // { monk, chars, ctl }
    draft: '',
  };
  let root = null;
  let args = [];
  let readyResolve = null;
  const ready = new Promise((res) => { readyResolve = res; });

  /* ------------------------------ helpers ------------------------------ */
  const clean = (s, n) => (typeof s === 'string' ? s.replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, n || 300) : '');
  const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  const idOk = (s) => typeof s === 'string' && /^[a-z0-9-]+$/.test(s);
  const num = (x, d) => (Number.isFinite(Number(x)) ? Number(x) : d);
  const str = (x, n) => clean(typeof x === 'number' ? String(x) : x, n);
  const pct = (x) => { const v = parseFloat(String(x)); return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.round(v))) : 0; };
  const plain = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\*\*/g, '');
  const rid = () => Math.random().toString(36).slice(2, 7);
  function safeRich(s, max) { // text written by Claude or by the keeper: escape everything but $…$ math
    if (typeof s !== 'string') return '';
    s = s.slice(0, max || 4000);
    return s.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g).map((p, i) => (i % 2 ? p : esc(p).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>'))).join('');
  }
  const rich = (s, max) => V.rich(safeRich(s, max));
  const strip = (d) => JSON.parse(JSON.stringify(d));
  const colIndex = (lore) => 'private/' + (lore || C.lore) + '/syncs';
  const colSessions = (lore, monk) => colIndex(lore) + '/' + monk + '/sessions';
  function when(iso) { return iso ? iso.slice(0, 10) + (iso.length > 15 ? ' ' + iso.slice(11, 16) : '') : ''; }
  const flameWord = (r) => (r == null ? 'unlit' : r < 35 ? 'guttering' : r < 60 ? 'steady' : r < 85 ? 'bright' : 'locked');
  function tierWanted() { const t = V.store('lamp-tier'); return ['quick', 'default', 'complex'].includes(t) ? t : 'default'; }
  function tier(want) { if (!S.tiers) return want; if (S.tiers.includes(want)) return want; return S.tiers.includes('default') ? 'default' : undefined; }

  /* ------------------------------ where the lamps stand ------------------------------ */
  function lampsOf(place) {
    if (!place) return [];
    if (place.kind === 'cell' && place.monk && C.get(place.monk)) return C.get(place.monk).noLamp ? [] : [place.monk]; /* 3.1.1: a record-only member (the sixth, section 12) has no lamp: the lamp has no trust rule */
    if (place.kind === 'chamber' && !place.monk) return (place.figures || []).filter((f) => C.get(f));
    return [];
  }
  function lampPlace(fid) {
    for (const p of C.places()) if (lampsOf(p).includes(fid)) return p;
    return null;
  }
  const hasLamp = (fid) => !!lampPlace(fid);
  function placeTrail(p) { return p.trail.map((t) => (C.place(t) || {}).name || t).join(' › '); }

  /* ------------------------------ sanitizing ------------------------------ */
  function optOf(o) {
    if (!o || typeof o !== 'object' || !KINDS.includes(o.kind)) return null;
    const p = o.payload && typeof o.payload === 'object' ? o.payload : {};
    let payload = null;
    if (o.kind === 'bestiary') { const name = clean(p.name, 80); if (!name) return null; payload = { name, teaser: clean(p.teaser, 240) }; }
    else if (o.kind === 'study') { if (!idOk(p.id) || !C.get(p.id)) return null; payload = { id: p.id }; }
    else if (o.kind === 'craft') { const ids = arr(p.ids, 6).filter((x) => idOk(x) && C.get(x)); const recipe = idOk(p.recipe) ? p.recipe : ''; if (!ids.length && !recipe) return null; payload = { ids, recipe, name: clean(p.name, 120) }; }
    else if (o.kind === 'rough') { if (!idOk(p.a) || !idOk(p.b) || !C.get(p.a) || !C.get(p.b) || p.a === p.b) return null; payload = { a: p.a, b: p.b, via: idOk(p.via) && C.get(p.via) ? p.via : '' }; }
    else if (o.kind === 'read') { payload = { figure: idOk(p.figure) ? p.figure : '', book: str(p.book, 160), chapter: str(p.chapter, 20), title: clean(p.title, 200) }; if (!payload.book && !payload.title) return null; }
    else if (o.kind === 'ask') { const text = clean(p.text, 800); if (!text) return null; payload = { text }; }
    else if (o.kind === 'mmvc') { const name = clean(p.name, 80); if (!name) return null; payload = { name, what: clean(p.what, 600), why: clean(p.why, 400) }; }
    return { letter: /^[A-Z]$/.test(String(o.letter || '')) ? o.letter : '', kind: o.kind, label: clean(o.label, 120) || KIND_WORD[o.kind], why: clean(o.why, 300), payload };
  }
  function gapOf(g) {
    if (!g || typeof g !== 'object') return null;
    const options = arr(g.options, 6).map(optOf).filter(Boolean);
    const text = clean(g.gap, 400);
    if (!text && !options.length) return null;
    return { gap: text, options };
  }
  /* letters run A, B, C … across the gaps of one answer, whatever Claude wrote */
  function letterGaps(gaps) {
    let i = 0;
    for (const g of gaps) for (const o of g.options) { o.letter = LETTERS[i] || ''; i++; }
    return gaps.map((g) => ({ gap: g.gap, options: g.options.filter((o) => o.letter) })).filter((g) => g.gap || g.options.length);
  }
  function turnOf(t) {
    if (!t || typeof t !== 'object') return null;
    const role = t.role === 'lamp' ? 'lamp' : 'you';
    const o = { role, at: clean(t.at, 30), text: role === 'you' ? clean(t.text, 6000) : '' };
    if (role === 'you' && !o.text) return null;
    if (role === 'lamp') {
      o.ratio = pct(t.ratio);
      o.answer = (typeof t.answer === 'string' ? [t.answer] : arr(t.answer, 10)).map((x) => clean(x, 3000)).filter(Boolean);
      o.drift = arr(t.drift, 6).map((x) => (x && typeof x === 'object' ? { said: clean(x.said, 300), record: clean(x.record, 700), fix: clean(x.fix, 400) } : typeof x === 'string' ? { said: '', record: clean(x, 700), fix: '' } : null)).filter((x) => x && (x.said || x.record || x.fix));
      o.hint = clean(t.hint, 400);
      o.record = clean(t.record, 300);
      o.gaps = letterGaps(arr(t.gaps, 4).map(gapOf).filter(Boolean));
      o.taken = arr(t.taken, 12).map((x) => clean(x, 1)).filter((x) => /^[A-Z]$/.test(x));
      if (!o.answer.length) o.answer = ['(The lamp gave no answer.)'];
    }
    return o;
  }
  function sanitizeSession(d) {
    if (!d || typeof d !== 'object' || !idOk(d.id) || !idOk(d.monk)) return null;
    return { v: 1, id: d.id, monk: d.monk, lore: idOk(d.lore) ? d.lore : C.DEFAULT_LORE, at: clean(d.at, 30), ended: clean(d.ended, 30), ratio: pct(d.ratio), summary: clean(d.summary, 400), turns: arr(d.turns, MAX_TURNS).map(turnOf).filter(Boolean) };
  }
  function sanitizeIndex(d) {
    if (!d || typeof d !== 'object' || !idOk(d.monk)) return null;
    const ses = (s) => (s && typeof s === 'object' && idOk(s.id) ? { id: s.id, at: clean(s.at, 30), ended: !!s.ended, turns: num(s.turns, 0), ratio: pct(s.ratio), summary: clean(s.summary, 400), drifts: arr(s.drifts, 8).map((x) => clean(x, 220)).filter(Boolean), taken: arr(s.taken, 12).map((x) => clean(x, 140)).filter(Boolean) } : null);
    return { v: 1, monk: d.monk, lore: idOk(d.lore) ? d.lore : C.DEFAULT_LORE, ratio: pct(d.ratio), prayers: num(d.prayers, 0), sessions: arr(d.sessions, 60).map(ses).filter(Boolean), updated: clean(d.updated, 30) };
  }

  /* ------------------------------ persistence ------------------------------ */
  async function connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { S.live = 'off'; S.connected = true; S.loaded = true; readyResolve(); changed(); return; }
    try { const u = await cl.use('user'); S.owner = u ? !!(await u.isOwner()) : false; } catch (err) { S.owner = false; }
    cl.use('sample').then(async (s) => {
      S.sample = s || null; S.live = s ? 'on' : 'off';
      if (s && typeof s.limits === 'function') { try { const lim = await s.limits(); S.tiers = lim && lim.modelTiers ? lim.modelTiers : null; } catch (err) { S.tiers = null; } }
      changed();
    }).catch(() => { S.live = 'off'; changed(); });
    try { S.db = await cl.use('db'); } catch (err) { S.db = null; }
    S.connected = true;
    readyResolve();
    subscribeIndex();
  }
  function subscribeIndex() {
    if (!S.connected) return;
    if (!S.db || !S.owner) { S.loaded = true; changed(); return; }
    if (S.indexLore === C.lore && S.indexUnsub) return;
    if (S.indexUnsub) { try { S.indexUnsub(); } catch (err) { /* gone */ } S.indexUnsub = null; }
    S.indexLore = C.lore; S.index.clear(); S.loaded = false;
    try {
      S.indexUnsub = S.db.collection(colIndex(C.lore)).onSnapshot((qs) => {
        S.index.clear();
        for (const snap of qs.docs) { const d = sanitizeIndex(snap.data ? snap.data() : snap); if (d) S.index.set(d.monk, d); }
        S.loaded = true; changed();
      }, () => { S.loaded = true; changed(); });
    } catch (err) { S.loaded = true; changed(); }
  }
  async function loadSession(monk, sid) {
    if (S.sessions.has(sid)) return S.sessions.get(sid);
    await ready;
    if (!S.db || !S.owner || !idOk(sid) || !idOk(monk)) return null;
    try {
      const snap = await S.db.collection(colSessions(C.lore, monk)).doc(sid).get();
      const d = snap && snap.exists ? sanitizeSession(snap.data()) : null;
      if (d) S.sessions.set(sid, d);
      return d;
    } catch (err) { return null; }
  }
  const sessionRatio = (s) => { const xs = s.turns.filter((t) => t.role === 'lamp').map((t) => t.ratio); return xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0; };
  function indexEntry(s) {
    const lamps = s.turns.filter((t) => t.role === 'lamp');
    const drifts = []; const taken = [];
    for (const t of lamps) {
      for (const d of t.drift) if (drifts.length < 8 && (d.said || d.record)) drifts.push((d.said ? d.said.slice(0, 80) : '—') + ' → ' + (d.record || d.fix).slice(0, 120));
      for (const L of t.taken) { const o = t.gaps.flatMap((g) => g.options).find((x) => x.letter === L); if (o && taken.length < 12) taken.push(L + ' · ' + KIND_WORD[o.kind] + ' · ' + o.label); }
    }
    return { id: s.id, at: s.at, ended: !!s.ended, turns: lamps.length, ratio: s.ratio, summary: s.summary, drifts: drifts.slice(-8), taken };
  }
  async function saveSession(s) {
    s.ratio = sessionRatio(s);
    S.sessions.set(s.id, s);
    let ix = S.index.get(s.monk) || { v: 1, monk: s.monk, lore: s.lore, ratio: 0, prayers: 0, sessions: [], updated: '' };
    ix = strip(ix);
    const entry = indexEntry(s);
    const i = ix.sessions.findIndex((x) => x.id === s.id);
    if (i >= 0) ix.sessions[i] = entry; else ix.sessions.push(entry);
    ix.sessions = ix.sessions.slice(-60);
    ix.ratio = s.ratio; ix.prayers = ix.sessions.reduce((n, x) => n + x.turns, 0); ix.updated = new Date().toISOString();
    S.index.set(s.monk, ix);
    if (!S.db || !S.owner) { V.toast('Kept for this visit only: the lamp writes for the keeper of the codex.'); return false; }
    try {
      await S.db.collection(colSessions(s.lore, s.monk)).doc(s.id).set(strip(s));
      await S.db.collection(colIndex(s.lore)).doc(s.monk).set(ix);
      return true;
    } catch (err) { V.toast('The prayer was not saved (' + ((err && err.code) || 'error') + ').'); return false; }
  }

  /* ------------------------------ what goes with a prayer ------------------------------ */
  function monkRecord(f) {
    const lines = [];
    lines.push('NAME: ' + plain(f.name) + (f.years ? ' (' + plain(f.years) + ')' : ''));
    if (f.role) lines.push('ROLE IN THE CODEX: ' + plain(f.role));
    const pl = lampPlace(f.id); if (pl) lines.push('WHERE THE LAMP STANDS: ' + placeTrail(pl));
    if (f.teaser) lines.push('IN SHORT: ' + plain(f.teaser));
    for (const b of f.bio || []) lines.push('LIFE AND WORK: ' + plain(b));
    if (f.why) lines.push('WHY HE IS IN THIS CODEX: ' + plain(f.why));
    for (const w of f.works || []) lines.push('WORK: ' + [w.year, w.title, w.venue, w.note].filter(Boolean).map(plain).join(' · '));
    for (const b of f.books || []) {
      const t = b.tome ? C.tome(b.tome) : null;
      lines.push('BOOK id=' + b.id + ': ' + plain(t ? t.title : b.title) + (b.with ? ' (with ' + plain(b.with) + ')' : '') + (b.year ? ', ' + b.year : '') + (b.why ? ' — ' + plain(b.why) : '') + (t ? ' [a tome of this codex; its sections are integrated one by one]' : '') + (b.check ? ' [' + plain(b.check) + ']' : ''));
      for (const c of (t ? t.chapters : (b.chapters || [])).slice(0, 40)) lines.push('  CHAPTER ' + plain(c.num) + ': ' + plain(c.title) + (c.blurb ? ' — ' + plain(c.blurb) : '') + (c.lights && c.lights.length ? ' [illuminates: ' + c.lights.filter((x) => C.get(x)).map((x) => plain(C.get(x).name)).join(', ') + ']' : ''));
    }
    const rel = (f.related || []).filter((x) => C.get(x));
    if (rel.length) lines.push('ENTRIES OF THE BESTIARY HIS WORK TOUCHES: ' + rel.map((x) => plain(C.get(x).name) + ' [her level: ' + C.LEVELS[C.level(x)].name + ']').join('; '));
    if (f.kinOf && f.kinOf.length) lines.push('KIN OF THE NAME: ' + f.kinOf.map((k) => C.get(k)).filter(Boolean).map((k) => plain(k.name)).join(', '));
    return lines.join('\n');
  }
  function keeperState() {
    const learn = C.all().filter((e) => e.kind === 'concept' || e.kind === 'section');
    let s = 'HER BESTIARY (id = name), by her level:\n';
    for (let n = C.LEVELS.length - 1; n >= 0; n--) { const xs = learn.filter((e) => C.level(e.id) === n).map((e) => e.id + ' = ' + plain(e.name)); if (xs.length) s += C.LEVELS[n].name.toUpperCase() + ': ' + xs.join('; ') + '\n'; }
    const CC = window.CodexCraft;
    if (CC && CC.recipes) { const rs = CC.recipes(); if (rs.length) s += 'RECIPES OF THE CRAFTING TABLE (id = name [state]): ' + rs.map((r) => r.id + ' = ' + plain(r.name) + ' [' + (r.yields && C.get(r.yields) ? 'crafted (classic)' : CC.recipeReady(r) ? 'ready' : 'locked') + ']').join('; ') + '\n'; }
    const crafted = C.all().filter((e) => e.crafted);
    if (crafted.length) s += 'CRAFTED PAGES: ' + crafted.map((e) => e.id + ' = ' + plain(e.name)).join('; ') + '\n';
    const lib = window.CodexLibrary;
    if (lib && lib.items) { const docs = lib.items().slice(0, 40); if (docs.length) s += 'DOCUMENTS IN HER LIBRARY: ' + docs.map((d) => plain(d.title) + (d.kind === 'rough' ? ' (rough draft)' : '')).join('; ') + '\n'; }
    const secs = (C.pack().sections || []);
    s += 'THE SECTIONS (mmvcs) OF THE CODEX NOW: ' + (V.hasJournal() ? 'Journal · ' : '') + 'Cyclopedia (' + (secs.length ? secs.join(', ') : 'bestiary, crafted, tomes') + ', figures, library, literature) · Crafting.\n';
    return s;
  }
  function memoryText(monk, cur) {
    const ix = S.index.get(monk);
    const past = ix ? ix.sessions.filter((s) => !cur || s.id !== cur.id).slice(-8) : [];
    if (!past.length) return 'PREVIOUS SYNCS: none. This is the first time she lights this lamp.';
    return 'PREVIOUS SYNCS AT THIS LAMP (oldest first; remember them, and say in one clause when a past drift is now corrected or repeated):\n' +
      past.map((s) => '- ' + s.at.slice(0, 10) + ' · ' + s.turns + ' prayers · sync ' + s.ratio + '%: ' + (s.summary || '(no record line)') + (s.drifts.length ? ' Drifts then: ' + s.drifts.join(' | ') : '') + (s.taken.length ? ' Options taken then: ' + s.taken.join(', ') : '')).join('\n');
  }
  function transcriptText(s) {
    const turns = s.turns.slice(-12);
    if (!turns.length) return 'THIS SESSION SO FAR: nothing yet; this is her first prayer at the lit lamp.';
    return 'THIS SESSION SO FAR (oldest first):\n' + turns.map((t) => (t.role === 'you' ? 'SHE, AS THE MONK: ' + t.text.slice(0, 1500) :
      'THE LAMP (sync ' + t.ratio + '%): ' + t.answer.join(' ').slice(0, 1200) + (t.drift.length ? ' DRIFT NAMED: ' + t.drift.map((d) => d.said + ' → ' + d.record).join(' | ').slice(0, 600) : '') +
      (t.gaps.length ? ' OPTIONS OFFERED: ' + t.gaps.map((g) => g.options.map((o) => o.letter + ' ' + o.kind + ' ' + o.label).join(', ')).join('; ') + (t.taken.length ? ' TAKEN: ' + t.taken.join(', ') : ' (none taken)') : ''))).join('\n');
  }
  function prompt(f, s, text) {
    return 'You are the EMPATHY LAMP of a research codex styled like Pillars of Eternity. The keeper of the codex has lit the lamp that stands by the place of a monk — ' + (f.board ? 'a member of the board of her campaign, a figure whose public record the codex keeps' : 'a real scientist of her field') + ' — and now PRAYS: she writes in the first person AS THE MONK, trying to assume his context, his questions and his way of working, the way a pilot syncs with a machine. You are the lamp: the codex’s record of the monk. You never speak as the monk and never put words in his mouth; you speak as the record, to her, in the second person.\n\n' +
      (C.pack().context || '') + '\n\n' +
      'THE MONK’S RECORD (all you may rely on about him; where it is silent, say CHECK and invent nothing):\n' + monkRecord(f) + '\n\n' +
      keeperState() + '\n' + memoryText(f.id, s) + '\n\n' + transcriptText(s) + '\n\n' +
      'HER PRAYER NOW, written as the monk:\n"""\n' + text + '\n"""\n\n' +
      'Do three things.\n' +
      '1. SYNC. Judge how well what she wrote fits the record of the monk: his lineage and collaborators, the problems he works on, his methods and vocabulary, what his books and papers say, what he would and would not claim. Give a sync ratio from 0 to 100 (100: the record could have written it; about 50: right field but wrong emphasis, or a claim he never made; below 30: another monk’s suit, or she spoke as herself rather than as him). Name every drift precisely: what she said, what the record says instead, and the shortest step that brings her closer. Silence of the record is neither drift nor sync: say CHECK. If she wrote as herself (a question put to the monk rather than from inside him), say so gently, count it as drift from the suit, and answer anyway.\n' +
      '2. ANSWER. Answer her question, or carry her line of thought on, as the record of the monk would have it: plain, step-by-step full sentences in your own words; never reproduce sentences from his books or papers, point to a chapter or a paper by title instead; page or equation numbers only when sure, otherwise CHECK IN BOOK; inline math in $...$.\n' +
      '3. GAPS. Look for gaps in HER codex that this exchange reveals: a concept she needs that is not in her bestiary; an entry she has not studied; two entries worth crafting together; a crossing to rough out at this lamp; a chapter of a must-read to read; a question only her chat with Claude can settle; or a missing part of the codex itself (a new mmvc: a new top-level section beside Journal, Cyclopedia and Crafting, only when the gap is a kind of thing the codex cannot hold yet). Offer options lettered A, B, C … continuing across the gaps (never two with the same letter, never one she already took in this session), each of one kind: bestiary (payload {name, teaser}), study (payload {id}: an id from her bestiary), craft (payload {ids: [bestiary ids], recipe: a recipe id or "", name}), rough (payload {a, b, via}: bestiary ids), read (payload {figure, book: a book id from the record, chapter: its chapter number, title}), ask (payload {text: the question for Claude}), mmvc (payload {name, what: what the section would hold and do, why}). Two to five options in all; none when nothing is missing.\n' +
      'Also write one line for the sync record: what she tried and where she stands, in the third person.\n' +
      'Reply with only JSON: {"ratio": 0, "drift": [{"said": "…", "record": "…", "fix": "…"}], "hint": "one sentence: the next step to sync closer", "answer": ["paragraph", "paragraph"], "gaps": [{"gap": "one sentence", "options": [{"letter": "A", "kind": "bestiary|study|craft|rough|read|ask|mmvc", "label": "short label", "why": "one sentence", "payload": {}}]}], "record": "one line"}';
  }

  /* ------------------------------ the lamp in use ------------------------------ */
  async function light(monk) {
    if (!S.owner) { V.toast('The lamp answers only the keeper of this codex.'); return; }
    if (S.open && S.open.monk === monk) return;
    const ix = S.index.get(monk);
    const unended = ix ? ix.sessions.filter((x) => !x.ended).slice(-1)[0] : null;
    let s = unended ? await loadSession(monk, unended.id) : null;
    if (!s) s = { v: 1, id: 'p' + Date.now().toString(36) + rid(), monk, lore: C.lore, at: new Date().toISOString(), ended: '', ratio: 0, summary: '', turns: [] };
    S.open = { monk, s }; S.draft = '';
    render();
    const ta = root && root.querySelector('#pray-text'); if (ta) ta.focus();
  }
  async function snuff() {
    const o = S.open; if (!o) return;
    const s = o.s;
    S.open = null;
    if (s.turns.some((t) => t.role === 'lamp')) { s.ended = new Date().toISOString(); await saveSession(s); }
    render();
  }
  /* 3.0.1: an answer must be an object (not an array) with some text in `answer`; anything else is rejected like a string */
  function hasAnswerText(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return false;
    const a = r.answer;
    if (typeof a === 'string') return a.trim().length > 0;
    return Array.isArray(a) && a.some((x) => typeof x === 'string' && x.trim().length > 0);
  }
  /* 3.0.1: a session document may not pass the platform's 256 KiB limit, so the session is capped by bytes, not only by turns */
  const MAX_BYTES = 200 * 1024;
  const sessionBytes = (s) => { try { const j = JSON.stringify(s); return typeof TextEncoder === 'function' ? new TextEncoder().encode(j).length : j.length * 3; } catch (e) { return 0; } };
  async function pray(text) {
    const o = S.open; if (!o) return;
    const f = C.get(o.monk); if (!f) return;
    if (!S.sample || S.live !== 'on') { V.toast('The lamp needs the Claude app: this view has no connection to Claude.'); return; }
    if (S.busy) return;
    const s = o.s;
    if (s.turns.length >= MAX_TURNS - 1 || sessionBytes(s) >= MAX_BYTES) { V.toast('This prayer is long enough: snuff the lamp and light it again.'); return; }
    s.turns.push({ role: 'you', at: new Date().toISOString(), text });
    S.busy = { monk: o.monk, chars: 0, ctl: new AbortController() };
    S.draft = '';
    render();
    let r = null;
    try {
      const opts = { cache: false, signal: S.busy.ctl.signal, onText: ({ text: t }) => { if (S.busy) { S.busy.chars = t.length; updateBusy(); } } };
      const t = tier(tierWanted()); if (t) opts.modelTier = t;
      r = await S.sample.json(prompt(f, s, text), opts);
    } catch (err) {
      const code = err && err.code;
      V.toast(ERR[code] || 'A connection problem interrupted the lamp. Pray again.');
      if (PERMANENT.includes(code)) S.live = 'off';
      s.turns.pop(); S.draft = text; S.busy = null; render(); return;
    }
    S.busy = null;
    const lamp = hasAnswerText(r) ? turnOf(Object.assign({}, r, { role: 'lamp', at: new Date().toISOString(), taken: [] })) : null;
    if (!lamp) { V.toast(ERR.invalid_json); s.turns.pop(); S.draft = text; render(); return; }
    s.turns.push(lamp);
    s.summary = lamp.record || s.summary;
    await saveSession(s);
    render();
    const last = root && root.querySelector('.pray-turn.lamp:last-of-type');
    if (last) last.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  function updateBusy() { const el = root && root.querySelector('[data-lamp-busy]'); if (el && S.busy) el.textContent = 'The lamp is reading… ' + S.busy.chars + ' characters'; }

  /* the options: each one acts in the codex, and the letter is recorded as taken */
  async function addStub(name, teaser) {
    const CC = window.CodexCraft;
    if (CC && typeof CC.addStub === 'function') return CC.addStub(name, teaser);
    const id = 'st-' + String(name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
    if (!C.get(id)) C.upsert({ id, kind: 'concept', lore: C.lore, name, aliases: [name], integrated: null, teaser: teaser || '', found: [{ session: true, note: 'Named at an empathy lamp.' }], readNext: [], dynamic: true });
    return id;
  }
  function readHref(f, p) {
    const books = f.books || [];
    const book = books.find((b) => b.id === p.book) || books.find((b) => p.title && String(b.title || (b.tome && C.tome(b.tome) ? C.tome(b.tome).title : '')).toLowerCase().includes(p.title.toLowerCase().slice(0, 24)));
    if (book && book.tome && C.tome(book.tome)) return '#/tome/' + book.tome;
    if (book && p.chapter) { const id = 'ch-' + book.id + '-' + String(p.chapter).toLowerCase().replace(/[^a-z0-9]+/g, '-'); if (C.get(id)) return '#/e/' + id; }
    return '#/e/' + f.id;
  }
  async function take(sid, ti, letter, btn) {
    const s = S.open && S.open.s.id === sid ? S.open.s : S.sessions.get(sid);
    if (!s) return;
    const t = s.turns[ti]; if (!t || t.role !== 'lamp') return;
    const o = t.gaps.flatMap((g) => g.options).find((x) => x.letter === letter); if (!o) return;
    const f = C.get(s.monk); if (!f) return;
    const anchor = btn.closest('.pray-turn') || btn;
    let done = false;
    if (o.kind === 'bestiary') { const id = await addStub(o.payload.name, o.payload.teaser); if (id) { V.toast('“' + o.payload.name + '” entered your bestiary as discovered.'); done = true; } }
    else if (o.kind === 'study') { location.hash = '#/e/' + o.payload.id; done = true; }
    else if (o.kind === 'craft') {
      const CC = window.CodexCraft;
      if (o.payload.recipe && CC && CC.recipe && CC.recipe(o.payload.recipe)) { location.hash = '#/craft/r/' + o.payload.recipe; done = true; }
      else if (CC && CC.Model && o.payload.ids.length) { CC.Model.bench = { ids: o.payload.ids.slice(), extras: [], recipe: null, consult: null, chosen: null, depth: (CC.Model.bench && CC.Model.bench.depth) || 2 }; location.hash = '#/craft'; done = true; }
      else V.toast('The crafting table is not open in this view.');
    }
    else if (o.kind === 'rough') { const lib = window.CodexLibrary; const place = lampPlace(s.monk); if (lib && lib.rough && place) done = await lib.rough(place.id, o.payload.a, o.payload.b, o.payload.via, btn); else V.toast('Roughs need the library.'); }
    else if (o.kind === 'read') { location.hash = readHref(f, o.payload); done = true; }
    else if (o.kind === 'ask') { const how = await V.askClaude(o.payload.text + ' (asked at ' + f.name + '’s empathy lamp in ' + (C.pack().name || 'the codex') + ', lore “' + C.lore + '”)', anchor, btn); done = how !== 'failed'; }
    else if (o.kind === 'mmvc') {
      const text = 'Build a new section (mmvc) of ' + (C.pack().name || 'the codex') + ' (lore “' + C.lore + '”) called “' + o.payload.name + '”. What it holds and does: ' + o.payload.what + (o.payload.why ? ' Why: ' + o.payload.why : '') + ' It came up at ' + f.name + '’s empathy lamp' + (t.record ? ' (' + t.record + ')' : '') + '.';
      const how = await V.askClaude(text, anchor, btn); done = how !== 'failed';
    }
    if (done && !t.taken.includes(letter)) { t.taken.push(letter); await saveSession(s); render(); }
  }

  /* ------------------------------ views ------------------------------ */
  function flameSvg(ratio, lit) {
    return '<svg class="flame f-' + flameWord(ratio) + (lit ? ' burning' : '') + '" viewBox="0 0 34 34" aria-hidden="true"><path class="fl-fire" d="M17 5c-3.2 4.2-5.4 6.6-5.4 10.2a5.4 5.4 0 0 0 10.8 0C22.4 11.6 20.2 9.2 17 5z"/><path class="fl-body" d="M6.5 22h21l-2.4 5.2H8.9z"/><path class="fl-body" d="M12 27.2h10v2.3H12z"/></svg>';
  }
  function syncChip(ratio, n, lit0) {
    const w = flameWord(ratio);
    return '<span class="sync-chip f-' + w + '" title="Sync ratio"><span class="sync-bar" aria-hidden="true"><span style="width:' + (ratio == null ? 0 : ratio) + '%"></span></span>Sync ' + (ratio == null ? '—' : ratio + '%') + ' · ' + (ratio == null && n === 0 && lit0 ? 'waiting for the first prayer' : w) + (n ? ' · ' + n + ' prayer' + (n === 1 ? '' : 's') : '') + '</span>';
  }
  function figureCard(e) {
    return '<a class="bcard fig" href="#/e/' + esc(e.id) + '">' + V.medal(e) + '<span class="bc-main"><span class="bc-kind">' + esc(e.role || 'Figure') + (e.years ? ' · ' + esc(e.years) : '') + '</span><span class="bc-name">' + esc(e.name) + '</span><span class="bc-teaser">' + V.rich(e.teaser || '') + '</span></span></a>';
  }
  function lampCard(fid) {
    const f = C.get(fid); const ix = S.index.get(fid); const lit = !!(S.open && S.open.monk === fid);
    const n = ix ? ix.prayers : 0; const ratio = ix && ix.sessions.length ? ix.ratio : null;
    return '<a class="lamp-card' + (lit ? ' burning' : '') + '" href="#/lamp/' + esc(fid) + '">' + flameSvg(ratio, lit) + '<span class="lamp-main"><span class="bc-kind">Empathy lamp' + (lit ? ' · burning' : '') + '</span><span class="lamp-name">' + esc(f.name) + '</span><span class="lamp-sync">' + (ratio != null ? 'Sync ' + ratio + '% · ' + flameWord(ratio) + ' · ' + n + ' prayer' + (n === 1 ? '' : 's') : 'Never lit') + '</span></span><span class="ware-verb">' + (lit ? 'Return to it' : ratio != null ? 'Light it again' : 'Light it') + ' ›</span></a>';
  }
  /* the panel on a cell or a chamber page */
  function panelHtml(place) {
    const ids = lampsOf(place);
    if (!ids.length || !S.owner) return '';
    return '<section class="panel lamps blk"><h2>' + (ids.length === 1 ? 'The empathy lamp' : 'Empathy lamps <span class="h2-n">' + ids.length + '</span>') + '</h2><p class="fam-intro">' + (ids.length === 1 ? 'Light it, assume the monk, and pray: the lamp keeps you in sync with his record and answers from it.' : 'One lamp for each of the figures this chamber keeps. Light one, assume the monk, and pray.') + '</p><div class="lamps-list">' + ids.map(lampCard).join('') + '</div></section>';
  }
  /* the line on a figure's page */
  function figureLine(f) {
    const p = lampPlace(f.id);
    if (!p || !S.owner) return '';
    const ix = S.index.get(f.id); const ratio = ix && ix.sessions.length ? ix.ratio : null;
    return '<a class="chip chip-known lamp-chip" href="#/lamp/' + esc(f.id) + '">' + flameSvg(ratio, !!(S.open && S.open.monk === f.id)) + '<span>Empathy lamp · ' + (ratio != null ? 'sync ' + ratio + '%' : 'never lit') + '</span></a>';
  }
  function lightBox(f) {
    const ix = S.index.get(f.id); const unended = ix ? ix.sessions.filter((x) => !x.ended).slice(-1)[0] : null;
    return '<section class="panel lamp-box blk"><h2>Unlit</h2><p>' + (unended ? 'The lamp still burns from ' + esc(when(unended.at)) + ': ' + unended.turns + ' prayer' + (unended.turns === 1 ? '' : 's') + ', sync ' + unended.ratio + '%. Light it to continue that prayer.' : 'Dark. Light it, and write your first prayer as ' + esc(f.name) + '.') + '</p>' +
      (S.live === 'off' ? '<p class="muted small">Praying needs the Claude app: this view has no connection to Claude.</p>' : '') +
      '<p class="cw-actions"><button type="button" class="btn" data-lamp="light" data-lamp-monk="' + esc(f.id) + '">Light the lamp</button></p></section>';
  }
  function optionHtml(s, ti, o, taken) {
    return '<button type="button" class="gap-opt' + (taken ? ' taken' : '') + '" data-lamp="take" data-lamp-session="' + esc(s.id) + '" data-lamp-turn="' + ti + '" data-lamp-letter="' + esc(o.letter) + '"><span class="opt-letter">' + esc(o.letter) + '</span><span class="opt-main"><span class="opt-kind">' + esc(KIND_WORD[o.kind]) + (taken ? ' · taken' : '') + '</span><span class="opt-label">' + esc(o.label) + '</span>' + (o.why ? '<span class="opt-why">' + rich(o.why) + '</span>' : '') + '</span></button>';
  }
  function turnHtml(s, t, i, f) {
    if (t.role === 'you') return '<article class="pray-turn you blk"><span class="pray-who">' + V.medal(f) + '<span>You, as ' + esc(f.name) + '</span></span><div class="pray-text pre">' + rich(t.text, 6000) + '</div></article>';
    let h = '<article class="pray-turn lamp blk" data-lamp-turn="' + i + '"><div class="pray-top"><span class="pray-who">' + flameSvg(t.ratio, true) + '<span>The lamp</span></span>' + syncChip(t.ratio) + '</div>';
    if (t.drift.length) h += '<div class="drift"><h3>Where you drifted</h3><ul>' + t.drift.map((d) => '<li>' + (d.said ? '<span class="d-said">You said</span> ' + rich(d.said) + ' ' : '') + (d.record ? '<span class="d-rec">The record</span> ' + rich(d.record) + ' ' : '') + (d.fix ? '<span class="d-fix">Closer</span> ' + rich(d.fix) : '') + '</li>').join('') + '</ul></div>';
    else h += '<p class="drift-none">No drift named: the suit fits.</p>';
    if (t.hint) h += '<p class="sync-hint">' + rich(t.hint) + '</p>';
    h += '<div class="pray-text">' + t.answer.map((p) => '<p>' + rich(p) + '</p>').join('') + '</div>';
    if (t.gaps.length) h += '<div class="gaps"><h3>Gaps the lamp sees</h3>' + t.gaps.map((g) => '<div class="gap">' + (g.gap ? '<p class="gap-text">' + rich(g.gap) + '</p>' : '') + (g.options.length ? '<div class="gap-opts">' + g.options.map((o) => optionHtml(s, i, o, t.taken.includes(o.letter))).join('') + '</div>' : '') + '</div>').join('') + '</div>';
    if (t.record) h += '<p class="pray-record"><span class="d-said">Record</span> ' + rich(t.record) + '</p>';
    return h + '</article>';
  }
  function composer(f) {
    const tierNow = tierWanted();
    return '<form class="pray-form" data-lamp-form="1"><label for="pray-text">Pray, as ' + esc(f.name) + '</label><textarea id="pray-text" name="text" rows="4" maxlength="6000" placeholder="Write in the first person, as the monk would, from inside his context…" required' + (S.busy ? ' disabled' : '') + '>' + esc(S.draft || '') + '</textarea>' +
      '<div class="pray-actions"><label class="pray-flame">Flame <select name="tier" data-lamp-tier>' + [['quick', 'dim · quick'], ['default', 'steady'], ['complex', 'bright · deepest']].map(([v, l]) => '<option value="' + v + '"' + (v === tierNow ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      (S.busy ? '<button type="button" class="btn ghost" data-lamp="stop">Stop</button>' : '<button class="btn" type="submit"' + (S.live !== 'on' ? ' disabled title="Needs the Claude app"' : '') + '>Pray</button>') + '<button type="button" class="btn ghost" data-lamp="snuff">Snuff the lamp</button></div>' +
      '<p class="muted small">Each prayer spends your own Claude usage; the bright flame costs the most. ' + esc(f.name) + '’s record, your bestiary, the recipes and the past syncs go with every prayer.</p></form>';
  }
  function prayerHtml(s, old) {
    const f = C.get(s.monk);
    const n = s.turns.filter((t) => t.role === 'lamp').length;
    let h = '<section class="panel prayer blk" data-lamp-session="' + esc(s.id) + '"><div class="prayer-head"><h2>' + (old ? 'An old prayer · ' + esc(when(s.at)) : (n ? 'The lamp burns' : 'The lamp is lit')) + '</h2>' + syncChip(n ? s.ratio : null, n, !old) + '</div>';
    if (!s.turns.length) h += '<p class="muted">The flame is new. Write your first prayer below, as ' + esc(f.name) + ' would.</p>';
    h += '<div class="prayer-turns">' + s.turns.map((t, i) => turnHtml(s, t, i, f)).join('') + '</div>';
    if (S.busy && S.busy.monk === s.monk && !old) h += '<p class="small inbox-busy"><span class="spin" aria-hidden="true"></span> <span data-lamp-busy>The lamp is reading… ' + S.busy.chars + ' characters</span></p>';
    h += old ? '<p class="cw-actions"><a class="btn ghost" href="#/lamp/' + esc(s.monk) + '">Back to the lamp</a></p>' : composer(f);
    return h + '</section>';
  }
  function recordHtml(monk, sid) {
    const ix = S.index.get(monk);
    let h = '<section class="panel sync-record blk" id="s-record"><h2>Sync record' + (ix && ix.sessions.length ? ' <span class="h2-n">' + ix.sessions.length + '</span>' : '') + '</h2>';
    if (!S.loaded) return h + '<p class="muted small"><span class="spin" aria-hidden="true"></span> Reading the record…</p></section>';
    if (!ix || !ix.sessions.length) return h + '<p class="muted">No prayer recorded yet. The lamp remembers every session: its sync, its drifts and what you took from it.</p></section>';
    h += '<p class="fam-intro">Every prayer at this lamp, oldest first. Open one to read it again; the lamp reads these before answering.</p><ol class="sync-list">';
    ix.sessions.forEach((s, i) => {
      h += '<li class="blk' + (s.id === sid ? ' on' : '') + (!s.ended ? ' open' : '') + '"><a href="#/lamp/' + esc(monk) + '/' + esc(s.id) + '"><span class="sync-n">' + (i + 1) + '</span><span class="sync-main"><span class="sync-line">' + (s.summary ? rich(s.summary) : 'No record line.') + '</span><span class="sync-meta">' + esc(when(s.at)) + ' · ' + s.turns + ' prayer' + (s.turns === 1 ? '' : 's') + (s.ended ? '' : ' · still burning') + (s.taken.length ? ' · taken: ' + esc(s.taken.join('; ')) : '') + '</span>' + (s.drifts.length ? '<span class="sync-drifts">' + s.drifts.map((x) => rich(x, 220)).join(' · ') + '</span>' : '') + '</span>' + syncChip(s.ratio) + '</a></li>';
    });
    return h + '</ol></section>';
  }
  function viewLamp(monk, sid) {
    const f = monk && C.get(monk); const place = f ? lampPlace(monk) : null;
    const lib = C.pack().library;
    const crumbs0 = [{ href: '#/', label: V.hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }, { href: '#/library', label: (lib && lib.name) || 'Library' }];
    /* 3.0.6: a lamp stands in a place; where the place is not for this reader (the board's cells, the secret hall), no lamp stands */
    const veiled = !!(f && window.CodexLibrary && ((window.CodexLibrary.hidden && window.CodexLibrary.hidden(f)) || (place && window.CodexLibrary.placeHidden && window.CodexLibrary.placeHidden(place))));
    if (!f || !place || veiled) return V.crumbs(crumbs0.concat([{ label: 'No lamp' }])) + '<section class="panel"><h1>No lamp here</h1><p>No empathy lamp stands for this name.</p></section>';
    const trail = crumbs0.concat(place.trail.map((t) => ({ href: '#/library/' + esc(t), label: (C.place(t) || {}).name || t })), [{ label: f.name + '’s lamp' }]);
    let h = V.crumbs(trail);
    h += '<section class="blk"><div class="kind">Empathy lamp · ' + esc(place.name) + '</div><h1>' + esc(f.name) + '’s lamp</h1>' + V.ORN + '<p class="lede">Light the lamp, assume the monk, and pray: write in the first person as ' + esc(f.name) + ' would, from inside his context. The lamp is the codex’s record of him. It measures how far you drifted from that record and how to come closer, answers from it, and names the gaps in your codex it sees, with lettered options to close them.</p></section>';
    if (!S.owner) return h + '<section class="panel sealed-door blk"><h2>Sealed</h2><p>The lamp answers only the keeper of this codex.</p></section>';
    h += '<section class="panel"><h2>The monk</h2><div class="cards">' + figureCard(f) + '</div></section>';
    const lit = S.open && S.open.monk === monk;
    if (sid) { const s = S.sessions.get(sid); h += s ? prayerHtml(s, true) : S.missing === sid ? '<section class="panel"><h2>No such prayer</h2><p>This prayer is not in the record. <a href="#/lamp/' + esc(monk) + '">Back to the lamp</a>.</p></section>' : '<section class="panel"><p class="muted small"><span class="spin" aria-hidden="true"></span> Opening the old prayer…</p></section>'; }
    else if (lit) h += prayerHtml(S.open.s, false);
    else h += lightBox(f);
    h += recordHtml(monk, sid);
    return h;
  }

  /* ------------------------------ mount, refresh, events ------------------------------ */
  function mount(el, a) {
    root = el; args = a || [];
    subscribeIndex();
    const [monk, sid] = args;
    if (sid && monk && !S.sessions.has(sid)) loadSession(monk, sid).then((s) => { if (!s) S.missing = sid; render(); });
    render();
  }
  function render() {
    if (!root || !root.isConnected) return;
    const [monk, sid] = args;
    const ta0 = root.querySelector('#pray-text'); const hadFocus = ta0 && document.activeElement === ta0;
    const y = window.scrollY;
    V.clearMath(root);
    const kept = window.CodexForms.swap(root, viewLamp(monk, sid));
    V.linkify(root);
    V.typesetNow(root);
    window.scrollTo(0, y);
    if (hadFocus && !kept) { const ta = root.querySelector('#pray-text'); if (ta) { ta.focus({ preventScroll: true }); ta.setSelectionRange(ta.value.length, ta.value.length); } }
  }
  function changed() {
    if (root && root.isConnected) render();
    const cur = V.current ? V.current() : null;
    if (cur && cur.name === 'library' && window.CodexLibrary) window.CodexLibrary.refresh();
    else if (cur && cur.name === 'entry' && cur.args[0] && C.get(cur.args[0]) && C.get(cur.args[0]).kind === 'figure' && hasLamp(cur.args[0]) && V.render) V.render(true);
  }
  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest && ev.target.closest('form[data-lamp-form]');
    if (!form) return;
    ev.preventDefault();
    const text = clean(form.text.value, 6000);
    if (!text) return;
    pray(text);
  });
  document.addEventListener('input', (ev) => { if (ev.target && ev.target.id === 'pray-text') S.draft = ev.target.value; });
  document.addEventListener('change', (ev) => { if (ev.target && ev.target.matches && ev.target.matches('[data-lamp-tier]')) V.store('lamp-tier', ev.target.value); });
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-lamp]');
    if (!t) return;
    const act = t.dataset.lamp;
    if (act === 'light') light(t.dataset.lampMonk);
    else if (act === 'snuff') snuff();
    else if (act === 'stop') { if (S.busy) S.busy.ctl.abort(); }
    else if (act === 'take') take(t.dataset.lampSession, Number(t.dataset.lampTurn), t.dataset.lampLetter, t);
  });
  // the record follows the lore
  let lastLore = C.lore;
  setInterval(() => { if (C.lore !== lastLore) { lastLore = C.lore; S.open = null; subscribeIndex(); } }, 800);

  window.CodexLamp = { mount, render, panelHtml, figureLine, hasLamp, lampPlace, lampsOf, state: () => S, _test: { turnOf, sanitizeSession, sanitizeIndex, optOf, hasAnswerText, sessionBytes, MAX_BYTES } };
  connect();
})();
