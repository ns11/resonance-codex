/* Resonance Codex — model layer.
   Lore packs (one world each: tomes, families, library, look), the entry registry (one module per entry under
   codex/entries/, plus entries that arrive from the db), level rules, and the progress store (claude db
   capability, one document per lore, with an in-memory fallback). */
(function () {
  'use strict';

  const entries = new Map();
  const order = [];

  const LEVELS = [
    { n: 0, key: 'sealed', name: 'Sealed', hint: 'Not yet integrated into the codex.' },
    { n: 1, key: 'discovered', name: 'Discovered', hint: 'Seen in an integrated section or in our sessions; not yet integrated.' },
    { n: 2, key: 'studied', name: 'Studied', hint: 'Integrated after you studied the source.' },
    { n: 3, key: 'derived', name: 'Derived', hint: 'You ticked every step of the derivation path.' },
    { n: 4, key: 'mastered', name: 'Mastered', hint: 'Derived, and the mastery quiz passed.' },
  ];

  const PASS_MARK = 0.8;
  /* local calendar dates as YYYY-MM-DD (reviews are scheduled in days) */
  function today() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(day, n) { const [y, m, d] = day.split('-').map(Number); const t = new Date(y, m - 1, d + n); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  function daysBetween(a, b) { const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number); return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000); }
  const BOX_DAYS = [0, 1, 3, 7, 14, 30]; // Leitner boxes 1..5: days until the card returns

  function sectionKey(lore, tome, num) { return lore + '|' + tome + ':' + num; }
  const sectionIndex = new Map();
  function local(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem('codex:' + key);
      window.localStorage.setItem('codex:' + key, val);
    } catch (err) { /* storage can be unavailable */ }
    return null;
  }

  /* ---------------- lore packs ---------------- */
  const DEFAULT_LORE = 'resonance';
  const packs = new Map();           // id -> pack (static from codex/lores/*.js, dynamic from the db)
  const placeEntries = new Map();    // lore -> [place entry ids registered for it]
  function flattenPlaces(lib) {
    const out = [];
    const walk = (p, trail) => {
      const t = trail.concat([p.id]);
      out.push(Object.assign({ trail: t, depth: trail.length }, p));
      for (const c of p.children || []) walk(c, t);
    };
    for (const p of (lib && lib.places) || []) walk(p, []);
    return out;
  }
  function registerPlaces(pack) {
    if (!pack || !pack.library || placeEntries.has(pack.id)) return;
    const ids = [];
    for (const p of flattenPlaces(pack.library)) {
      const id = 'place-' + pack.id + '-' + p.id;
      const e = { id, kind: 'place', lore: pack.id, name: p.name, aliases: (p.aliases || []).slice(), integrated: '2026-10-30', steps: [], quiz: [], found: [],
        place: p.id, placeKind: p.kind, role: p.role || '', figures: p.figures || [], teaser: p.blurb || '', names: p.names || null, dynamic: !pack.builtin };
      if (!entries.has(id)) { entries.set(id, e); order.push(id); ids.push(id); }
    }
    const lib = pack.library;
    const lid = 'place-' + pack.id + '-' + lib.id;
    if (!entries.has(lid)) { entries.set(lid, { id: lid, kind: 'place', lore: pack.id, name: lib.name, aliases: (lib.aliases || []).slice(), integrated: '2026-10-30', steps: [], quiz: [], found: [], place: lib.id, placeKind: 'library', role: '', figures: [], teaser: lib.blurb || '', dynamic: !pack.builtin }); order.push(lid); ids.push(lid); }
    placeEntries.set(pack.id, ids);
  }

  const Codex = {
    LEVELS,
    PASS_MARK,
    BOX_DAYS,
    today,
    addDays,
    daysBetween,
    DEFAULT_LORE,
    lore: DEFAULT_LORE,
    /* every pack the engine knows, built-in first */
    packs() {
      const stat = Object.values(window.CODEX_LORES || {});
      for (const p of stat) if (!packs.has(p.id)) { packs.set(p.id, p); registerPlaces(p); }
      return Array.from(packs.values());
    },
    pack(id) { this.packs(); return packs.get(id || this.lore) || null; },
    addPack(p) {
      if (!p || !p.id || !/^[a-z0-9-]+$/.test(p.id)) return false;
      const was = packs.get(p.id);
      if (was && was.builtin) return false;
      packs.set(p.id, p);
      // places of a dynamic pack can change between drafts: drop the old ones
      for (const id of placeEntries.get(p.id) || []) { entries.delete(id); const i = order.indexOf(id); if (i >= 0) order.splice(i, 1); }
      placeEntries.delete(p.id);
      registerPlaces(p);
      this.version++;
      return true;
    },
    /* a pack's library tree changed (cells added for new monks, a drafted lore revised): register its places again */
    reindexPlaces(id) {
      const p = packs.get(id);
      if (!p) return false;
      for (const eid of placeEntries.get(id) || []) { entries.delete(eid); const i = order.indexOf(eid); if (i >= 0) order.splice(i, 1); }
      placeEntries.delete(id);
      registerPlaces(p);
      this.version++;
      return true;
    },
    removePack(id) {
      const p = packs.get(id);
      if (!p || p.builtin) return false;
      packs.delete(id);
      for (const eid of placeEntries.get(id) || []) { entries.delete(eid); const i = order.indexOf(eid); if (i >= 0) order.splice(i, 1); }
      placeEntries.delete(id);
      if (this.lore === id) this.setLore(DEFAULT_LORE);
      this.version++;
      return true;
    },
    setLore(id, forget) {
      if (!packs.has(id)) this.packs();
      if (!packs.has(id)) return false;
      if (this.lore === id) return true;
      this.lore = id;
      if (!forget) local('lore', id); /* 3.0.6: a lore the page leaves only because the answer "who is looking" is not in (or is no) is not forgotten by the keeper */
      this.version++;
      Store.attach(id);
      return true;
    },
    places(loreId) { const p = this.pack(loreId); return p && p.library ? flattenPlaces(p.library) : []; },
    place(pid, loreId) { return this.places(loreId).find((p) => p.id === pid) || null; },
    placeEntryId(pid, loreId) { return 'place-' + (loreId || this.lore) + '-' + pid; },
    register(e) {
      if (!e || !e.id || !/^[a-z0-9-]+$/.test(e.id)) throw new Error('Codex.register: bad id ' + (e && e.id));
      if (entries.has(e.id)) throw new Error('Codex.register: duplicate id ' + e.id);
      e.lore = e.lore || DEFAULT_LORE;
      e.aliases = e.aliases || [];
      e.steps = e.steps || [];
      e.quiz = e.quiz || [];
      e.related = e.related || [];
      e.readNext = e.readNext || [];
      e.found = e.found || [];
      entries.set(e.id, e);
      order.push(e.id);
      if (e.kind === 'section' && e.source) sectionIndex.set(sectionKey(e.lore, e.source.tome, e.source.num), e.id);
    },
    /* Entries that arrive at run time (crafted drafts, new discovered keywords from the db, library keywords) replace any
       earlier version with the same id; static modules keep using register(). */
    upsert(e) {
      if (!e || !e.id || !/^[a-z0-9-]+$/.test(e.id)) return false;
      if (entries.has(e.id) && !entries.get(e.id).dynamic) return false; // never overwrite a written module
      e.dynamic = true;
      e.lore = e.lore || DEFAULT_LORE;
      e.aliases = e.aliases || []; e.steps = e.steps || []; e.quiz = e.quiz || [];
      e.related = e.related || []; e.readNext = e.readNext || []; e.found = e.found || [];
      if (!entries.has(e.id)) order.push(e.id);
      entries.set(e.id, e);
      if (e.kind === 'section' && e.source) sectionIndex.set(sectionKey(e.lore, e.source.tome, e.source.num), e.id);
      this.version++;
      return true;
    },
    remove(id) {
      const e = entries.get(id);
      if (!e || !e.dynamic) return false;
      entries.delete(id);
      const i = order.indexOf(id);
      if (i >= 0) order.splice(i, 1);
      if (e.kind === 'section' && e.source) sectionIndex.delete(sectionKey(e.lore, e.source.tome, e.source.num));
      this.version++;
      return true;
    },
    version: 0,
    get(id) { return entries.get(id); },
    /* entries of the active lore; every() is the whole registry */
    all() { const l = this.lore; return order.map((id) => entries.get(id)).filter((e) => e.lore === l); },
    every() { return order.map((id) => entries.get(id)); },
    concepts() { return this.all().filter((e) => e.kind === 'concept'); },
    sections() { return this.all().filter((e) => e.kind === 'section'); },
    figures() { return this.all().filter((e) => e.kind === 'figure'); },
    sectionEntry(tome, num) { return sectionIndex.get(sectionKey(this.lore, tome, num)) || null; },
    tomes() { const p = this.pack(); return (p && p.tomes) || []; },
    tome(id) { return this.tomes().find((t) => t.id === id) || null; },
    findSection(tomeId, num) {
      const t = this.tome(tomeId);
      if (!t) return null;
      for (const c of t.chapters) {
        if (num === 'ch:' + c.num) return { tome: t, chapter: c, section: null };
        for (const s of c.sections || []) if (s.num === num) return { tome: t, chapter: c, section: s };
      }
      return null;
    },
    isTopSection(num) { return /^\d+\.(\d+|[A-Z])$/.test(num); },

    /* Level rules (Bestiary-style):
       0 sealed: a book section not yet integrated (not an entry)
       1 discovered: an entry without integrated content
       2 studied: integrated content
       3 derived: every derivation step ticked
       4 mastered: derived and the quiz passed */
    level(id) {
      const e = entries.get(id);
      if (!e) return 0;
      if (!e.integrated) return 1;
      const p = Store.entry(id);
      const n = e.steps.length;
      let ticked = 0;
      for (let i = 0; i < n; i++) if (p.steps && p.steps[i]) ticked++;
      if (n === 0 || ticked < n) return 2;
      return p.quizPassed ? 4 : 3;
    },
    stepsDone(id) {
      const e = entries.get(id);
      if (!e) return 0;
      const p = Store.entry(id);
      let ticked = 0;
      for (let i = 0; i < e.steps.length; i++) if (p.steps && p.steps[i]) ticked++;
      return ticked;
    },
  };

  /* ---------------- progress store (one document per lore) ---------------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  const blank = () => ({ v: 1, entries: {}, review: {} });

  const Store = {
    data: blank(),
    status: 'starting', // starting | connecting | synced | local | readonly | unsaved
    listeners: new Set(),
    db: null,
    ref: null,
    unsub: null,
    lore: DEFAULT_LORE,
    cache: new Map(),   // lore -> data kept in memory (local mode, and while switching)
    timer: null,
    writing: false,
    dirty: false,
    readonlyUser: false,

    entry(id) { return this.data.entries[id] || {}; },
    on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    emit() { for (const fn of this.listeners) { try { fn(); } catch (err) { console.error(err); } } },
    setStatus(s) { if (this.status !== s) { this.status = s; this.emit(); } },
    canWrite() { return this.status !== 'readonly'; },
    markReadOnly() { this.readonlyUser = true; this.setStatus('readonly'); },
    retries: 0,
    docId(lore) { return lore === DEFAULT_LORE ? 'state' : lore; },

    async init() {
      const c = window.claude;
      if (!c || typeof c.use !== 'function') { this.setStatus('local'); return; }
      this.setStatus('connecting');
      let db = null;
      try { db = await c.use('db'); } catch (err) { db = null; }
      if (!db) { this.setStatus('local'); return; }
      this.db = db;
      this.attach(Codex.lore, true);
    },
    /* point the store at the progress document of a lore */
    attach(lore, first) {
      if (!first) {
        if (this.timer) { clearTimeout(this.timer); this.timer = null; this.flush(); }
        this.cache.set(this.lore, this.data);
      }
      if (this.unsub) { try { this.unsub(); } catch (err) { /* already gone */ } this.unsub = null; }
      this.lore = lore;
      this.data = this.cache.get(lore) || blank();
      if (!this.db) { this.setStatus(this.readonlyUser ? 'readonly' : 'local'); this.emit(); return; }
      try { this.ref = this.db.doc('progress/' + this.docId(lore)); } catch (err) { this.ref = null; this.setStatus('local'); this.emit(); return; }
      this.unsub = this.ref.onSnapshot((snap) => {
        if (this.timer || this.writing) return; // keep local edits that are not written yet
        if (snap.exists) {
          const d = snap.data() || {};
          this.data = { v: 1, entries: clone(d.entries || {}), review: clone(d.review || {}) };
        }
        if (this.status !== 'readonly') this.setStatus('synced');
        this.emit();
      }, () => { this.setStatus('local'); });
      this.emit();
    },

    update(id, patch) {
      if (!this.canWrite()) return;
      const cur = Object.assign({}, this.data.entries[id] || {});
      Object.assign(cur, patch, { at: today() }); // last time you worked on it: an entry turns rusty without it
      this.data.entries[id] = cur;
      this.emit();
      this.schedule();
    },
    toggleStep(id, i, on) {
      const cur = this.entry(id);
      const steps = Object.assign({}, cur.steps || {});
      if (on) steps[i] = true; else delete steps[i];
      this.update(id, { steps });
    },
    recordQuiz(id, score) {
      const cur = this.entry(id);
      const best = Math.max(cur.quizBest || 0, score);
      const passed = !!cur.quizPassed || score >= PASS_MARK;
      const patch = { quizBest: best, quizPassed: passed, quizLast: score };
      if (score >= PASS_MARK && !cur.quizPassed) patch.quizPassedAt = new Date().toISOString().slice(0, 10);
      this.update(id, patch);
    },

    /* spaced review: one card per quiz question, key "entryId:questionIndex" */
    review() { if (!this.data.review) this.data.review = {}; return this.data.review; },
    answerCard(key, ok) {
      if (!this.canWrite()) return;
      const r = this.review();
      const cards = Object.assign({}, r.cards || {});
      const c = Object.assign({ b: 0, ok: 0, miss: 0 }, cards[key]);
      const day = today();
      if (ok) { c.b = Math.min(5, (c.b || 0) + 1); c.ok++; } else { c.b = 1; c.miss++; }
      c.seen = day;
      c.due = addDays(day, BOX_DAYS[c.b]);
      cards[key] = c;
      const days = Object.assign({}, r.days || {});
      days[day] = (days[day] || 0) + 1;
      const keep = Object.keys(days).sort().slice(-90);
      r.cards = cards;
      r.days = Object.fromEntries(keep.map((k) => [k, days[k]]));
      this.emit();
      this.schedule();
    },
    logDrill(rec) {
      if (!this.canWrite()) return;
      const r = this.review();
      r.drills = (r.drills || []).concat([rec]).slice(-20);
      this.emit();
      this.schedule();
    },

    schedule() {
      if (!this.ref) return; // local mode: memory only
      clearTimeout(this.timer);
      this.timer = setTimeout(() => { this.timer = null; this.flush(); }, 600);
    },
    async flush() {
      if (!this.ref) return;
      if (this.writing) { this.dirty = true; return; }
      this.writing = true;
      const ref = this.ref; const data = this.data;
      try {
        do {
          this.dirty = false;
          await ref.set({ v: 1, lore: this.lore, entries: clone(data.entries), review: clone(data.review || {}), updatedAt: new Date().toISOString() });
        } while (this.dirty && this.ref === ref);
        this.retries = 0;
        if (this.ref === ref) this.setStatus('synced');
      } catch (err) {
        const code = err && err.code;
        if (code === 'invalid_argument') this.setStatus('readonly');
        else if ((code === 'unavailable' || !code) && this.retries < 1) {
          this.retries++; // one retry after a short randomized delay, as the db contract asks
          setTimeout(() => this.flush(), 1500 + Math.random() * 1000);
        } else { this.retries = 0; this.setStatus('unsaved'); console.warn('Codex progress not saved:', err); }
      } finally {
        this.writing = false;
      }
    },
  };

  Codex.Store = Store;
  window.Codex = Codex;
  // the lore last opened in this browser, if its pack exists
  const remembered = local('lore');
  Codex.packs();
  if (remembered && packs.has(remembered)) { Codex.lore = remembered; Store.lore = remembered; }
})();
