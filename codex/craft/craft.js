/* Resonance Codex — the crafting table (a micro-MVC inside the codex).
   Model:      the recipe book (recipes.js), the bench (your mix), a compatibility graph built from the
               bestiary, and persistence of crafted drafts and new keywords in the artifact db.
   View:       a Pillars-of-Eternity-style window: Known Recipes | Crafting | Messages | bottom bar.
   Controller: picking ingredients, the typed-ingredient check, Consult (directions A–E) and Craft,
               the last three answered live by Claude through the `sample` capability. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  const BOOK = window.CODEX_RECIPES;
  if (!C || !V || !BOOK) return;
  const esc = V.esc;

  /* ================================ MODEL ================================ */
  const Model = {
    bench: { ids: [], extras: [], recipe: null, consult: null, chosen: null, depth: 2 },
    typed: '',
    messages: [],
    busy: null,                 // { what, ctl, chars }
    live: 'pending',            // pending | on | off
    tiers: null,
    db: null,
    crafted: new Map(),         // draft id -> raw doc
    stubs: new Map(),
  };
  let sampleFn = null;
  let graph = null;
  let graphVersion = -1;
  let mountEl = null;
  let args = [];

  function glyph(e) {
    if (V.glyph) return V.glyph(e);
    return e.glyph || e.name.split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }
  const plain = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  /* the recipe book of the active lore (built-in recipes belong to the Resonance lore unless they say otherwise) */
  const recipes = () => BOOK.recipes.filter((r) => (r.lore || C.DEFAULT_LORE) === C.lore);
  const recipe = (id) => recipes().find((r) => r.id === id) || null;
  const level = (id) => (C.get(id) ? C.level(id) : 0);

  function buildGraph() {
    if (graph && graphVersion === C.version) return graph;
    const g = new Map();
    const add = (a, b) => {
      if (!a || !b || a === b || !C.get(a) || !C.get(b)) return;
      if (!g.has(a)) g.set(a, new Set());
      if (!g.has(b)) g.set(b, new Set());
      g.get(a).add(b); g.get(b).add(a);
    };
    const clique = (ids) => { for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) add(ids[i], ids[j]); };
    for (const e of C.all()) {
      for (const r of e.related || []) add(e.id, r);
      for (const f of e.found || []) if (f.tome) add(e.id, C.sectionEntry(f.tome, f.num));
      if (e.crafted && e.crafted.ingredients) { clique(e.crafted.ingredients); for (const i of e.crafted.ingredients) add(e.id, i); }
    }
    for (const r of recipes()) clique(r.requires.map((q) => q.id));
    graph = g; graphVersion = C.version;
    return g;
  }
  function canMix(id) {
    const b = Model.bench.ids;
    if (!b.length) return true;
    if (b.includes(id)) return false;
    const g = buildGraph();
    return b.some((x) => g.has(x) && g.get(x).has(id));
  }
  function reqStatus(r) { return r.requires.map((q) => ({ id: q.id, have: level(q.id), need: q.min, ok: level(q.id) >= q.min })); }
  function recipeReady(r) { return reqStatus(r).every((x) => x.ok); }
  function matchingRecipes() {
    const b = new Set(Model.bench.ids);
    if (!b.size) return [];
    return recipes().filter((r) => r.requires.every((q) => b.has(q.id)));
  }
  function crafted(rid) { const p = C.Store.entry('recipe-' + rid); return !!(p && p.crafted); }

  /* ---------- untrusted text from Claude or the db: escape everything except $…$ math ---------- */
  function safeRich(s, max) {
    if (typeof s !== 'string') return '';
    s = s.slice(0, max || 3000);
    return s.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g)
      .map((p, i) => (i % 2 ? p : esc(p).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')))
      .join('');
  }
  const safePlain = (s, max) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max || 300) : '');
  const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  const slug = (s) => String(s || 'dish').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'dish';

  // only a forged page (doc.verified === true, written by Claude in chat) may carry verified references
  function cleanLit(r, trusted) {
    if (!r || typeof r !== 'object') return null;
    const doi = typeof r.doi === 'string' && /^10\.\d{4,9}\/\S+$/.test(r.doi.trim()) ? r.doi.trim() : '';
    const arxiv = typeof r.arxiv === 'string' && /^(\d{4}\.\d{4,5}|[a-z-]+\/\d{7})(v\d+)?$/.test(r.arxiv.trim()) ? r.arxiv.trim() : '';
    const field = ['QO', 'QC', 'QI', 'general'].includes(r.field) ? r.field : 'general';
    const year = Number.isFinite(Number(r.year)) ? Number(r.year) : '';
    const authors = safePlain(r.authors, 200); const title = safePlain(r.title, 300);
    if (!authors || !title) return null;
    return { field, authors, title, venue: safePlain(r.venue, 200), year, doi, arxiv, fit: safeRich(r.fit, 400), verified: trusted === true && r.verified === true };
  }
  function cleanQuiz(q) {
    if (!q || typeof q !== 'object') return null;
    const options = arr(q.options, 6).map((o) => safeRich(String(o), 300)).filter(Boolean);
    const answer = Number(q.answer);
    if (options.length < 2 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) return null;
    return { q: safeRich(q.q, 500), options, answer, why: safeRich(q.why, 500) };
  }

  /* a crafted draft (db doc) -> a codex entry */
  function toEntry(d) {
    const cr = d.crafted || {};
    const lit = d.literature || {};
    const e = {
      id: d.id, lore: /^[a-z0-9-]+$/.test(String(d.lore || '')) ? d.lore : C.DEFAULT_LORE, kind: 'concept', name: safePlain(d.name, 120) || 'Crafted dish', glyph: safePlain(d.glyph, 4) || '',
      aliases: arr(d.aliases, 8).map((a) => safePlain(a, 80)).filter((a) => a.length > 3),
      integrated: (safePlain(cr.at, 30) || new Date().toISOString()).slice(0, 10),
      teaser: safeRich(d.teaser, 300),
      tip: d.tip ? { text: safeRich(d.tip.text, 500), tex: safePlain(d.tip.tex, 200), ref: safePlain(d.tip.ref, 120) } : null,
      overview: arr(d.overview, 6).map((p) => safeRich(p, 1800)),
      equations: arr(d.equations, 8).map((q) => ({ tex: safePlain(q && q.tex, 400), ref: safePlain(q && q.ref, 160), note: safeRich(q && q.note, 300) })).filter((q) => q.tex),
      steps: arr(d.steps, 10).map((s) => ({ text: safeRich(s && s.text, 600), ref: safePlain(s && s.ref, 120) })).filter((s) => s.text),
      // a forged (verified) page may point at a tome section directly: {tome, num, why}; drafts keep CHECK IN BOOK
      textbook: arr(d.textbook, 6).map((t) => {
        const why = safeRich(t && t.why, 300) + (d.verified === true || (t && t.checked === true) ? '' : ' CHECK IN BOOK.');
        if (t && typeof t.tome === 'string' && C.tome(t.tome) && typeof t.num === 'string' && /^[0-9A-Za-z.]{1,12}$/.test(t.num)) return { tome: t.tome, num: t.num, why };
        return { book: safePlain(t && t.book, 80), where: safePlain(t && t.where, 120), why };
      }),
      research: arr(d.research, 5).map((x) => safeRich(x, 900)),
      deeper: arr(d.deeper, 4).map((x) => safeRich(x, 900)),
      mastery: arr(d.mastery, 3).map((x) => safeRich(x, 600)),
      literature: { seminal: arr(lit.seminal, 3).map((r) => cleanLit(r, d.verified)).filter(Boolean), cited: arr(lit.cited, 3).map((r) => cleanLit(r, d.verified)).filter(Boolean), latest: arr(lit.latest, 3).map((r) => cleanLit(r, d.verified)).filter(Boolean) },
      techs: arr(d.techs, 6).map((x) => safePlain(x, 160)).filter(Boolean),
      startups: arr(d.startups, 6).map((s) => ({ name: safePlain(s && s.name, 80), what: safePlain(s && s.what, 200) })).filter((s) => s.name),
      quiz: arr(d.quiz, 6).map(cleanQuiz).filter(Boolean),
      related: arr(cr.ingredients, 8).filter((i) => typeof i === 'string' && C.get(i)),
      found: [{ session: true, note: 'Crafted at the crafting table on ' + esc((safePlain(cr.at, 30) || '').slice(0, 10)) + '.' }],
      crafted: { ingredients: arr(cr.ingredients, 8).filter((i) => typeof i === 'string'), extras: arr(cr.extras, 6).map((x) => safePlain(x, 120)),
        recipe: safePlain(cr.recipe, 60) || null, direction: cr.direction ? { letter: safePlain(cr.direction.letter, 2), title: safePlain(cr.direction.title, 160) } : null, depth: cr.depth, prebuilt: false },
      facts: arr(d.verifiedFacts, 4).map((f) => ({ text: safePlain(f && f.text, 400), url: f && typeof f.url === 'string' && /^https:\/\//.test(f.url) ? f.url : '' })).filter((f) => f.text),
      verified: d.verified === true,
      verifiedAt: safePlain(d.verifiedAt, 30),
      draft: d.verified !== true,
    };
    return e;
  }
  function toStub(d) {
    return { id: d.id, lore: /^[a-z0-9-]+$/.test(String(d.lore || '')) ? d.lore : C.DEFAULT_LORE, kind: 'concept', name: safePlain(d.name, 100), aliases: arr(d.aliases, 4).map((a) => safePlain(a, 80)).filter((a) => a.length > 3),
      integrated: null, teaser: safeRich(d.teaser, 300), found: [{ session: true, note: 'Suggested at the crafting table' + (d.at ? ' on ' + esc(String(d.at).slice(0, 10)) : '') + '.' }], readNext: [] };
  }

  /* ---------- persistence ---------- */
  function registryChanged() { graph = null; if (V.refresh) V.refresh(); }
  function applyDocs(kind, docs) {
    const map = kind === 'crafted' ? Model.crafted : Model.stubs;
    const seen = new Set();
    for (const snap of docs) {
      const d = snap.data ? snap.data() : snap;
      if (!d || typeof d.id !== 'string' || !/^[a-z0-9-]+$/.test(d.id)) continue;
      seen.add(d.id);
      map.set(d.id, d);
      C.upsert(kind === 'crafted' ? toEntry(d) : toStub(d));
    }
    for (const id of Array.from(map.keys())) if (!seen.has(id)) { map.delete(id); C.remove(id); }
    registryChanged();
  }
  async function connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { Model.live = 'off'; refresh(); return; }
    cl.use('sample').then(async (s) => {
      sampleFn = s || null;
      Model.live = s ? 'on' : 'off';
      if (s && typeof s.limits === 'function') { try { const lim = await s.limits(); Model.tiers = lim && lim.modelTiers ? lim.modelTiers : null; } catch (err) { Model.tiers = null; } }
      refresh();
    }).catch(() => { Model.live = 'off'; refresh(); });
    try { Model.db = await cl.use('db'); } catch (err) { Model.db = null; }
    if (!Model.db) return;
    try {
      Model.db.collection('crafted').onSnapshot((qs) => applyDocs('crafted', qs.docs), () => {});
      Model.db.collection('stubs').onSnapshot((qs) => applyDocs('stubs', qs.docs), () => {});
    } catch (err) { /* collections unavailable in this view */ }
  }
  async function saveDoc(kind, doc) {
    const map = kind === 'crafted' ? Model.crafted : Model.stubs;
    map.set(doc.id, doc);
    C.upsert(kind === 'crafted' ? toEntry(doc) : toStub(doc));
    registryChanged();
    if (!Model.db || !C.Store.canWrite()) return false;
    try { await Model.db.collection(kind).doc(doc.id).set(doc); return true; }
    catch (err) { say('warn', 'Saved for this visit only: the codex database refused the write (' + esc(err && err.code || 'error') + ').'); return false; }
  }

  /* ================================ CLAUDE (sample) ================================ */
  function tier(want) {
    if (!Model.tiers) return want;
    if (Model.tiers.includes(want)) return want;
    return Model.tiers.includes('default') ? 'default' : undefined;
  }
  function context() {
    const p = C.pack();
    return (p && p.context) || 'A study codex. Style required: plain, step-by-step full sentences; page or equation numbers only when you are sure, otherwise the words CHECK IN BOOK.';
  }
  const bookNames = () => { const p = C.pack(); return (p && p.bookNames) || 'the core books | other'; };
  function mixIds() {
    const r = Model.bench.recipe ? recipe(Model.bench.recipe) : null;
    return r ? r.requires.map((q) => q.id).filter((i) => C.get(i)) : Model.bench.ids;
  }
  function mixText() {
    const b = Model.bench;
    const lines = mixIds().map((id) => { const e = C.get(id); return '- ' + id + ': ' + plain(e.name) + ' — ' + plain(e.teaser) + ' [her level: ' + C.LEVELS[level(id)].name + ']'; });
    for (const x of b.extras) lines.push('- extra (typed by her): ' + x.text + (x.verdict ? ' [your earlier verdict: ' + x.verdict + ']' : ''));
    const r = b.recipe ? recipe(b.recipe) : null;
    let s = 'CURRENT MIX:\n' + (lines.join('\n') || '(empty)');
    if (r) s += '\nKNOWN RECIPE SELECTED: ' + r.name + ' (' + r.cat + '). ' + r.flavor + '\nVERIFIED FACTS (rely on them, never contradict them):\n' + r.facts.map((f) => '- ' + f.text + (f.url ? ' <' + f.url + '>' : '')).join('\n');
    return s;
  }
  const unseen = (e) => !!(window.CodexLibrary && window.CodexLibrary.hidden && window.CodexLibrary.hidden(e));
  function shelfText() { return C.all().filter((e) => !unseen(e)).map((e) => e.id + ' = ' + plain(e.name)).join('; '); }

  const ERRORS = {
    not_granted: 'Live crafting is not allowed in this view (permission declined).', sampling_disabled: 'Claude is not available for this account.',
    not_declared: 'This version of the page cannot call Claude.', capability_disabled: 'Live crafting is switched off in this view.', capability_removed: 'Live crafting is switched off in this view.',
    rate_limited: 'Claude is busy or your usage limit is reached. Try again later.', session_expired: 'Sign in again to use live crafting.',
    refused: 'Claude declined this mix. Change the ingredients or the wording.', invalid_json: 'Claude’s answer could not be read. Press the button again, or lower the depth.',
    empty_completion: 'Claude returned nothing. Try again with fewer ingredients.', prompt_too_large: 'The mix is too large. Remove some ingredients.', cancelled: 'Stopped.',
  };
  const PERMANENT = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

  async function ask(what, prompt, wantTier) {
    if (!sampleFn || Model.live !== 'on') { say('warn', 'Live crafting needs the Claude app (this view has no connection to Claude).'); return null; }
    if (Model.busy) return null;
    const ctl = new AbortController();
    Model.busy = { what, ctl, chars: 0, started: false };
    refresh();
    try {
      const opts = { signal: ctl.signal, cache: false, onText: ({ text }) => { if (!Model.busy) return; Model.busy.started = true; Model.busy.chars = text.length; updateBusy(); } };
      const t = tier(wantTier); if (t) opts.modelTier = t;
      return await sampleFn.json(prompt, opts);
    } catch (err) {
      const code = err && err.code;
      say(code === 'cancelled' ? 'info' : 'warn', esc(ERRORS[code] || 'A connection problem interrupted Claude. Try again.'));
      if (PERMANENT.includes(code)) Model.live = 'off';
      return null;
    } finally {
      Model.busy = null;
      refresh();
    }
  }

  async function judgeExtra(text) {
    const prompt = 'You are the crafting master of a research codex styled like the crafting table of Pillars of Eternity. The player mixes ingredients (physics concepts from her bestiary) to craft a new study page.\n\n' +
      context() + '\n\n' + mixText() + '\n\nTHE PLAYER WANTS TO ADD THIS EXTRA INGREDIENT, typed by her: "' + text + '"\n\nBESTIARY (id = name). If the typed ingredient is the same thing as one of these, list its id in maps_to:\n' + shelfText() +
      '\n\nJudge whether adding it makes physical sense with the current mix, and where the crafting would go. Use plain full sentences.\nReply with only JSON: {"verdict":"fits"|"stretch"|"unrelated","maps_to":["bestiary id"],"why":"one or two plain sentences","direction":"one plain sentence: the page this mix would lead to with the new ingredient","new_keyword":{"name":"canonical name","teaser":"one sentence"} or null}';
    const r = await ask('judge', prompt, 'quick');
    if (!r || typeof r !== 'object') return;
    const verdict = ['fits', 'stretch', 'unrelated'].includes(r.verdict) ? r.verdict : 'stretch';
    const maps = arr(r.maps_to, 3).filter((id) => typeof id === 'string' && C.get(id));
    const nk = r.new_keyword && typeof r.new_keyword === 'object' && safePlain(r.new_keyword.name, 80) ? { name: safePlain(r.new_keyword.name, 80), teaser: safePlain(r.new_keyword.teaser, 240) } : null;
    const x = { text, verdict, why: safeRich(r.why, 500), direction: safeRich(r.direction, 400), maps, nk };
    if (maps.length) {
      for (const id of maps) if (!Model.bench.ids.includes(id)) Model.bench.ids.push(id);
      clearConsult();
      say('claude', '<b>' + esc(text) + '</b> is already in your bestiary as ' + maps.map((id) => esc(C.get(id).name)).join(', ') + '; added that instead. ' + V.rich(x.why));
    } else {
      Model.bench.extras.push(x);
      clearConsult();
      say('claude', '<span class="verdict v-' + verdict + '">' + verdict + '</span> <b>' + esc(text) + '</b>: ' + V.rich(x.why) + (x.direction ? ' <i>Direction:</i> ' + V.rich(x.direction) : ''));
    }
    Model.typed = '';
    refresh();
  }

  async function consult() {
    const prompt = 'You are the crafting master of a research codex styled like the crafting table of Pillars of Eternity.\n\n' + context() + '\n\n' + mixText() +
      '\n\nBESTIARY (id = name):\n' + shelfText() +
      '\n\nPropose exactly 5 directions, A to E, for the study page this mix could become. Make them clearly different, for example: the phenomenon and its textbook derivation; an experiment or technology; a link to her thesis results; a quantum-computing angle; an application or start-up angle. For each direction suggest up to 3 ingredients to add: give a bestiary id when one fits, otherwise a new name. Use plain full sentences.\n' +
      'Reply with only JSON: {"options":[{"letter":"A","title":"short title","summary":"two or three plain sentences: what the page would explain","why_you":"one sentence linking it to her thesis or PhD plan","kind":"phenomenon|derivation|technology|thesis link|computing|start-up","add":[{"id":"bestiary id or null","name":"name","why":"short reason"}],"difficulty":1}]}';
    const r = await ask('consult', prompt, 'default');
    if (!r || !Array.isArray(r.options)) { if (r) say('warn', 'Claude’s directions could not be read. Consult again.'); return; }
    const letters = ['A', 'B', 'C', 'D', 'E'];
    const options = r.options.slice(0, 5).map((o, i) => ({
      letter: letters[i], title: safePlain(o && o.title, 120) || 'Direction ' + letters[i], summary: safeRich(o && o.summary, 700), whyYou: safeRich(o && o.why_you, 400),
      kind: safePlain(o && o.kind, 30), difficulty: [1, 2, 3].includes(Number(o && o.difficulty)) ? Number(o.difficulty) : 2,
      add: arr(o && o.add, 3).map((a) => ({ id: a && typeof a.id === 'string' && C.get(a.id) ? a.id : null, name: safePlain(a && a.name, 80), why: safePlain(a && a.why, 160) })).filter((a) => a.id || a.name),
    }));
    Model.bench.consult = { options, at: new Date().toISOString() };
    Model.bench.chosen = null;
    say('claude', 'Five directions are ready below the shelf. Choose one, add any suggested ingredients, then press Craft.');
    refresh();
    const el = mountEl && mountEl.querySelector('.cw-consult');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }

  async function craft() {
    const b = Model.bench;
    const r = b.recipe ? recipe(b.recipe) : null;
    if (r && r.yields && !b.chosen) {
      if (!recipeReady(r)) { say('warn', 'Not all ingredients of ' + esc(r.name) + ' are at the level the recipe needs.'); return; }
      if (C.Store.canWrite()) C.Store.update('recipe-' + r.id, { crafted: new Date().toISOString().slice(0, 10) });
      say('ok', 'Crafted <b>' + esc(r.name) + '</b>: a classic recipe with a pre-built, verified page.');
      location.hash = '#/e/' + r.yields;
      return;
    }
    const opt = b.consult && b.consult.options.find((o) => o.letter === b.chosen);
    if (!opt) { say('warn', 'Consult first and choose a direction (A–E).'); return; }
    const n = b.depth;
    const prompt = 'You write one study page for a research codex styled like the bestiary of Pillars of Eternity.\n\n' + context() + '\n\n' + mixText() +
      '\n\nCHOSEN DIRECTION ' + opt.letter + ': ' + opt.title + ' — ' + plain(opt.summary) +
      '\n\nRules:\n- Plain, step-by-step full sentences. Inline math in $...$, display math in $$...$$, LaTeX inside.\n- Book references: her core books with section numbers only when you are sure; otherwise write CHECK IN BOOK.\n- Literature: seminal = the first paper(s); cited = highly cited work since 2021; latest = the last 12 months; cover quantum optics (QO) and quantum computing or information (QC/QI). Mark every item "verified": false unless it appears in the verified facts. Never invent a DOI or an arXiv number: leave the field empty when unsure.\n- Start-ups: name only companies you are confident exist; they will be checked later.\n- Quiz: 5 questions, 4 options each, concrete numbers where possible; "answer" is the 0-based index of the right option.\n' +
      '- Size: overview ' + (n + 1) + ' paragraphs, ' + (n * 2 + 2) + ' derivation steps, ' + (n === 1 ? 1 : 2) + ' literature items per slot' + (n === 3 ? ', plus deeper and mastery notes' : '') + '.\n\n' +
      'Reply with only JSON: {"name":"page title","glyph":"1-3 characters","aliases":["other names"],"teaser":"one sentence","tip":{"text":"two sentences","tex":"one short LaTeX formula","ref":"source"},' +
      '"overview":["paragraph"],"equations":[{"tex":"LaTeX","ref":"source","note":"one sentence"}],"steps":[{"text":"step","ref":"source or CHECK IN BOOK"}],' +
      '"textbook":[{"book":"' + bookNames() + '","where":"section or chapter, or CHECK IN BOOK","why":"what it derives"}],' +
      '"research":["link to her thesis or PhD plan"],"deeper":["note"],"mastery":["exercise"],' +
      '"literature":{"seminal":[LIT],"cited":[LIT],"latest":[LIT]},"techs":["technology"],"startups":[{"name":"company","what":"what it sells"}],' +
      '"quiz":[{"q":"question","options":["a","b","c","d"],"answer":0,"why":"explanation"}],"new_keywords":[{"name":"keyword","teaser":"one sentence"}]} ' +
      'where LIT = {"authors":"...","title":"...","venue":"journal, volume, pages","year":2021,"doi":"","arxiv":"","field":"QO|QC|QI|general","fit":"one sentence","verified":false}';
    const d = await ask('craft', prompt, 'complex');
    if (!d || typeof d !== 'object' || !safePlain(d.name, 120)) { if (d) say('warn', 'The page could not be read. Press Craft again.'); return; }
    const id = 'cr-' + slug(d.name) + '-' + Math.random().toString(36).slice(2, 6);
    const doc = Object.assign({}, d, {
      v: 1, id, lore: C.lore,
      crafted: { ingredients: mixIds().slice(), extras: b.extras.map((x) => x.text), recipe: b.recipe, direction: { letter: opt.letter, title: opt.title }, depth: n, at: new Date().toISOString() },
      verified: false,
    });
    // facts of a known recipe are verified: keep them on the page as verified literature notes
    if (r) doc.verifiedFacts = r.facts.map((f) => ({ text: f.text, url: f.url }));
    const json = JSON.stringify(doc);
    if (json.length > 200000) { say('warn', 'The page came back too large to store. Lower the depth and craft again.'); return; }
    const saved = await saveDoc('crafted', JSON.parse(json));
    say('ok', 'Crafted <b>' + esc(safePlain(d.name, 120)) + '</b> (direction ' + opt.letter + '). ' + (saved ? 'Saved to your codex as a draft.' : 'Kept for this visit.') + ' Its references are unverified until you press “Forge verified” on the page.');
    for (const k of arr(d.new_keywords, 4)) if (k && safePlain(k.name, 80)) say('claude', 'New keyword spotted: <b>' + esc(safePlain(k.name, 80)) + '</b>. ' + esc(safePlain(k.teaser, 200)));
    Model.bench.consult = null; Model.bench.chosen = null;
    location.hash = '#/e/' + id;
  }

  async function addStub(name, teaser) {
    const id = 'st-' + slug(name);
    if (C.get(id)) return id;
    const doc = { v: 1, id, lore: C.lore, name, aliases: [name], teaser: teaser || '', at: new Date().toISOString() };
    await saveDoc('stubs', doc);
    say('ok', '<b>' + esc(name) + '</b> entered your bestiary as discovered.');
    return id;
  }

  /* ================================ VIEW ================================ */
  function say(kind, html) {
    Model.messages.unshift({ kind, html, t: new Date().toTimeString().slice(0, 5) });
    Model.messages = Model.messages.slice(0, 40);
    const box = mountEl && mountEl.querySelector('.cw-messages');
    if (box) { box.innerHTML = messagesHtml(); V.typesetNow(box); }
  }
  function messagesHtml() {
    if (!Model.messages.length) return '<p class="cw-msg muted">Choose a recipe on the left, or pick a base ingredient on the shelf to start a free craft.</p>';
    return Model.messages.map((m) => '<p class="cw-msg m-' + m.kind + '"><span class="cw-t">' + m.t + '</span> ' + m.html + '</p>').join('');
  }
  function tile(id, opts) {
    const e = C.get(id);
    if (!e) return '';
    const l = level(id);
    const o = opts || {};
    const cls = 'tile' + (o.state ? ' ' + o.state : '') + (l < 2 ? ' tile-fog' : '');
    const inner = '<span class="t-glyph">' + esc(glyph(e)) + '</span>' + V.pips(l) + '<span class="t-name">' + esc(e.name) + '</span>' + (o.need ? '<span class="t-need ' + (o.ok ? 'ok' : 'no') + '">need ' + esc(C.LEVELS[o.need].name) + '</span>' : '');
    if (o.button) return '<button type="button" class="' + cls + '" data-id="' + esc(id) + '" data-act="' + o.button + '"' + (o.disabled ? ' disabled' : '') + ' aria-pressed="' + (o.state === 'in' ? 'true' : 'false') + '">' + inner + '</button>';
    return '<a class="' + cls + '" data-id="' + esc(id) + '" href="#/e/' + esc(id) + '">' + inner + '</a>';
  }

  function recipesHtml() {
    const b = Model.bench;
    const dishes = C.all().filter((e) => e.crafted && !e.crafted.prebuilt);
    let h = '<aside class="cw-recipes"><h2 class="cw-h">Known Recipes</h2>';
    h += '<a class="cw-bench' + (!b.recipe ? ' on' : '') + '" href="#/craft">Workbench · free crafting</a>';
    h += '<details class="cw-cat"' + (dishes.length ? ' open' : '') + '><summary>Your dishes <span>' + dishes.length + '</span></summary><ul>' +
      (dishes.length ? dishes.map((e) => '<li><a class="cw-rec" data-id="' + esc(e.id) + '" href="#/e/' + esc(e.id) + '"><span class="rg" aria-hidden="true">' + esc(glyph(e)) + '</span><span>' + esc(e.name) + '</span>' + (e.verified ? '<span class="cw-done">forged</span>' : '<span class="cw-draft">draft</span>') + '</a></li>').join('') : '<li class="cw-empty">Nothing crafted yet.</li>') + '</ul></details>';
    for (const cat of BOOK.categories) {
      const rs = recipes().filter((r) => r.cat === cat.id);
      const open = b.recipe ? rs.some((r) => r.id === b.recipe) : cat.id === 'classic';
      const nReady = rs.filter(recipeReady).length;
      h += '<details class="cw-cat"' + (open ? ' open' : '') + '><summary>' + esc(cat.name) + ' <span title="' + nReady + ' of ' + rs.length + ' ready"><b>' + nReady + '</b> / ' + rs.length + '</span></summary><p class="cw-cathint">' + esc(cat.hint) + '</p><ul>';
      for (const r of rs) {
        const ready = recipeReady(r);
        const lead = C.get(r.yields) || C.get(r.requires[0] && r.requires[0].id);
        const state = crafted(r.id) ? '<span class="cw-done">crafted</span>' : ready ? '' : '<svg class="ico lock" aria-label="locked"><use href="#i-lock"/></svg>';
        h += '<li><a class="cw-rec' + (ready ? '' : ' locked') + (b.recipe === r.id ? ' on' : '') + '" href="#/craft/r/' + esc(r.id) + '" title="' + (ready ? '' : 'Raise the missing ingredients to the needed level') + '">' +
          '<span class="rg" aria-hidden="true">' + esc(lead ? glyph(lead) : '·') + '</span><span>' + esc(r.name) + '</span>' + state + '</a></li>';
      }
      h += '</ul></details>';
    }
    return h + '</aside>';
  }

  function recipePanel(r) {
    const st = reqStatus(r);
    const ready = st.every((x) => x.ok);
    const cat = BOOK.categories.find((c) => c.id === r.cat);
    const gives = r.yields ? ['A pre-built, verified page', 'Seminal papers and textbook derivation', 'Bestiary sections and a quiz']
      : ['A page written live by Claude for the direction you choose', 'Seminal papers and textbook pointers (to verify)', 'Bestiary sections and a quiz', r.cat === 'startup' ? 'The product, the physics inside it, and your fit' : r.cat === 'idea' ? 'Pitch, risks and a first experiment' : r.cat === 'paper' ? 'What the paper did and how it reaches your thesis' : 'How it works and who builds it'];
    let h = '<div class="cw-recipe"><h3 class="cw-rname">' + esc(r.name) + '</h3>';
    h += '<div class="cw-req"><span class="lbl">Requires:</span><div class="tiles">' + st.map((x) => tile(x.id, { need: x.need, ok: x.ok, state: x.ok ? 'in' : 'dim' })).join('') + '</div></div>';
    h += '<div class="cw-stats"><span class="lbl">Statistics:</span><ul><li>Kind: ' + esc(cat ? cat.name : r.cat) + '</li><li>Status: ' + (r.yields && C.get(r.yields) ? 'crafted · pre-built page' : ready ? 'ready to craft' : 'missing ingredients') + (crafted(r.id) ? ' · crafted before' : '') + '</li>' + gives.map((g) => '<li>' + esc(g) + '</li>').join('') + '</ul></div>';
    const first = r.flavor.charAt(0);
    h += '<p class="cw-flavor blk"><span class="dropcap" aria-hidden="true">' + esc(first) + '</span>' + '<span class="sr-only">' + esc(first) + '</span>' + esc(r.flavor.slice(1)) + '</p>';
    h += '<div class="cw-facts nolink"><span class="lbl">Verified facts</span><ul>' + r.facts.map((f) => '<li class="blk">' + esc(f.text) + (f.url ? ' <a href="' + esc(f.url) + '" target="_blank" rel="noopener">source</a>' : '') + '</li>').join('') + '</ul></div>';
    h += '<p class="cw-actions"><button type="button" class="cw-btn ghost" data-act="load-recipe" data-rid="' + esc(r.id) + '">Put its ingredients on the workbench</button></p></div>';
    h += consultHtml();
    return h;
  }

  function benchPanel() {
    const b = Model.bench;
    let h = '<div class="cw-mix"><h3>Your mix</h3><div class="tiles">';
    h += b.ids.map((id, i) => '<span class="slot">' + tile(id, { state: 'in' }) + '<button type="button" class="slot-x" data-act="remove" data-id="' + esc(id) + '" aria-label="Remove ' + esc(C.get(id).name) + '">×</button>' + (i === 0 ? '<span class="slot-tag">base</span>' : '') + '</span>').join('');
    h += b.extras.map((x, i) => '<span class="slot extra"><span class="tile in extra-tile"><span class="t-glyph">✎</span><span class="verdict v-' + x.verdict + '">' + esc(x.verdict) + '</span><span class="t-name">' + esc(x.text) + '</span></span><button type="button" class="slot-x" data-act="remove-extra" data-i="' + i + '" aria-label="Remove ' + esc(x.text) + '">×</button>' +
      (x.nk ? '<button type="button" class="slot-add" data-act="stub" data-name="' + esc(x.nk.name) + '" data-teaser="' + esc(x.nk.teaser) + '">Add to bestiary</button>' : '') + '</span>').join('');
    if (!b.ids.length && !b.extras.length) h += '<p class="muted small">Empty. Pick a base ingredient on the shelf below.</p>';
    h += '</div>';
    const m = matchingRecipes();
    if (m.length) h += '<p class="cw-match">Your mix contains the known recipe' + (m.length > 1 ? 's' : '') + ' ' + m.map((r) => '<a href="#/craft/r/' + esc(r.id) + '">' + esc(r.name) + '</a>').join(', ') + '.</p>';
    h += '</div>';

    h += '<div class="cw-add"><label for="cw-extra">Add an ingredient that is not in your bestiary</label><div class="row"><input id="cw-extra" type="text" maxlength="120" autocomplete="off" placeholder="For example: Floquet theory, transmon qubit, photonic crystal" value="' + esc(Model.typed) + '">' +
      '<button type="button" class="cw-btn" data-act="ask"' + (Model.live !== 'on' || Model.busy || !(b.ids.length || b.extras.length) ? ' disabled' : '') + '>Ask Claude</button></div>' +
      (Model.live === 'off' ? '<p class="small muted">Live answers need the Claude app; classic recipes still work here.</p>' : (!(b.ids.length || b.extras.length) ? '<p class="small muted">Pick a base ingredient first, so Claude can judge the mix.</p>' : '')) + '</div>';

    // shelf: everything in the bestiary, lit when it can mix with the current mix
    const groups = [4, 3, 2, 1].map((l) => ({ l, ids: (V.bestiaryEntries ? V.bestiaryEntries() : C.all().filter((e) => !unseen(e))).filter((e) => level(e.id) === l).map((e) => e.id) })).filter((g) => g.ids.length);
    h += '<div class="cw-shelf"><h3>Ingredient shelf <span class="muted small">' + (b.ids.length ? 'lit = known to mix with your mix' : 'choose a base ingredient') + '</span></h3>';
    for (const g of groups) {
      h += '<div class="shelf-row"><span class="shelf-lvl">' + V.pips(g.l) + ' ' + esc(C.LEVELS[g.l].name) + '</span><div class="tiles">';
      h += g.ids.map((id) => {
        const inMix = b.ids.includes(id);
        const ok = canMix(id);
        return tile(id, { button: inMix ? 'remove' : 'add', state: inMix ? 'in' : ok ? 'lit' : 'dim', disabled: !inMix && !ok });
      }).join('');
      h += '</div></div>';
    }
    h += '</div>';

    h += consultHtml();
    return h;
  }

  function consultHtml() {
    const b = Model.bench;
    let h = '';
    if (b.consult) {
      h += '<div class="cw-consult"><h3>Consult: where to go from here</h3><div class="opts" role="radiogroup" aria-label="Directions">';
      for (const o of b.consult.options) {
        const id = 'cw-opt-' + o.letter;
        h += '<div class="cw-opt' + (b.chosen === o.letter ? ' on' : '') + '"><input type="radio" name="cw-opt" id="' + id + '" value="' + o.letter + '"' + (b.chosen === o.letter ? ' checked' : '') + '>' +
          '<label for="' + id + '"><span class="opt-letter">' + o.letter + '</span><span class="opt-title">' + esc(o.title) + '</span>' + (o.kind ? '<span class="opt-kind">' + esc(o.kind) + ' · ' + '◆'.repeat(o.difficulty) + '◇'.repeat(3 - o.difficulty) + '</span>' : '') + '</label>' +
          '<p class="blk">' + V.rich(o.summary) + '</p>' + (o.whyYou ? '<p class="opt-why blk">' + V.rich(o.whyYou) + '</p>' : '') +
          (o.add.length ? '<div class="opt-add">' + o.add.map((a) => a.id
            ? '<button type="button" class="chip-btn" data-act="add" data-id="' + esc(a.id) + '"' + (b.ids.includes(a.id) ? ' disabled' : '') + ' title="' + esc(a.why) + '">＋ ' + esc(C.get(a.id).name) + '</button>'
            : '<button type="button" class="chip-btn new" data-act="stub-add" data-name="' + esc(a.name) + '" data-teaser="' + esc(a.why) + '" title="' + esc(a.why) + '">＋ new: ' + esc(a.name) + '</button>').join('') + '</div>' : '') + '</div>';
      }
      h += '</div><p class="small muted">Adding an ingredient changes the mix, so the directions are cleared; consult again before crafting.</p></div>';
    }
    return h;
  }

  function barHtml() {
    const b = Model.bench;
    const r = b.recipe ? recipe(b.recipe) : null;
    const hasMix = b.ids.length || b.extras.length || r;
    const liveOk = Model.live === 'on' && !Model.busy;
    const classicReady = r && r.yields && !b.chosen && recipeReady(r);
    const craftOk = classicReady || (liveOk && !!b.chosen);
    let busy = '';
    if (Model.busy) {
      const label = { judge: 'Claude is judging your ingredient', consult: 'Claude is consulting', craft: 'Claude is crafting the page' }[Model.busy.what];
      busy = '<span class="cw-busy" role="status"><span class="spin" aria-hidden="true"></span>' + label + '… <span class="cw-chars">' + (Model.busy.started ? Model.busy.chars.toLocaleString('en-US') + ' characters' : 'thinking (a permission prompt may appear first)') + '</span></span><button type="button" class="cw-btn ghost" data-act="stop">Stop</button>';
    }
    return '<footer class="cw-bar">' +
      '<div class="cw-depth" role="group" aria-label="Depth"><span class="lbl">Depth</span><button type="button" class="dep" data-act="depth" data-d="-1" aria-label="Less depth">◂</button><span class="dep-n">' + b.depth + '</span><button type="button" class="dep" data-act="depth" data-d="1" aria-label="More depth">▸</button><span class="dep-name">' + ['', 'brief', 'standard', 'deep'][b.depth] + '</span></div>' +
      busy +
      '<div class="cw-buttons"><button type="button" class="cw-btn" data-act="consult"' + (liveOk && hasMix ? '' : ' disabled') + '>Consult</button>' +
      '<button type="button" class="cw-btn" data-act="craft"' + (craftOk ? '' : ' disabled') + ' title="' + (classicReady ? 'Opens the pre-built page' : b.chosen ? 'Writes the page for direction ' + b.chosen : 'Consult and choose a direction first') + '">Craft</button>' +
      '<a class="cw-btn ghost" href="#/">Close</a></div></footer>';
  }

  function viewHtml() {
    const b = Model.bench;
    const r = b.recipe ? recipe(b.recipe) : null;
    return '<nav class="crumbs" aria-label="Breadcrumbs"><a href="#/">' + (V.hasJournal() ? 'Journal' : 'Codex') + '</a><span class="sep" aria-hidden="true">◆</span><span>Crafting</span></nav>' +
      '<section class="craft-window ornate" aria-label="Crafting">' +
      '<header class="cw-title"><h1 class="cw-h1">Crafting</h1><a class="cw-close" href="#/" aria-label="Close the crafting table">×</a></header>' +
      '<div class="cw-body">' + recipesHtml() +
      '<div class="cw-main"><h2 class="cw-h">' + (r ? 'Recipe' : 'Workbench') + '</h2><div class="cw-panel">' + (r ? recipePanel(r) : benchPanel()) + '</div>' +
      '<h2 class="cw-h">Messages</h2><div class="cw-messages" aria-live="polite">' + messagesHtml() + '</div></div></div>' +
      barHtml() + '</section>';
  }

  function updateBusy() {
    const el = mountEl && mountEl.querySelector('.cw-chars');
    if (el && Model.busy) el.textContent = Model.busy.started ? Model.busy.chars.toLocaleString('en-US') + ' characters' : 'thinking…';
  }

  function refresh() {
    if (!mountEl || !mountEl.isConnected || !/^#\/craft(\/|$)/.test(location.hash)) return;
    const active = document.activeElement;
    const focusId = active && mountEl.contains(active) ? active.id : null;
    const y = window.scrollY;
    window.CodexForms.swap(mountEl, viewHtml());
    V.linkify(mountEl.querySelector('.cw-panel'));
    V.typesetNow(mountEl);
    window.scrollTo(0, y);
    if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus({ preventScroll: true }); if (el.type === 'text' && el.value) el.setSelectionRange(el.value.length, el.value.length); } }
  }

  /* ================================ CONTROLLER ================================ */
  function clearConsult() { Model.bench.consult = null; Model.bench.chosen = null; }
  function mount(el, routeArgs) {
    mountEl = el;
    args = routeArgs || [];
    const [mode, id] = args;
    if (mode === 'r' && recipe(id)) { Model.bench.recipe = id; }
    else if (mode === 'with' && C.get(id)) { Model.bench = { ids: [id], extras: [], recipe: null, consult: null, chosen: null, depth: Model.bench.depth }; }
    else { Model.bench.recipe = null; }
    refresh();
    if (mode === 'r' && window.innerWidth < 900) { const m = el.querySelector('.cw-main'); if (m) m.scrollIntoView({ block: 'start' }); }
  }

  document.addEventListener('input', (ev) => { if (ev.target && ev.target.id === 'cw-extra') Model.typed = ev.target.value; });
  document.addEventListener('keydown', (ev) => {
    if (ev.target && ev.target.id === 'cw-extra' && ev.key === 'Enter') { ev.preventDefault(); const btn = mountEl && mountEl.querySelector('[data-act="ask"]'); if (btn && !btn.disabled) btn.click(); }
  });
  document.addEventListener('change', (ev) => {
    if (ev.target && ev.target.name === 'cw-opt') { Model.bench.chosen = ev.target.value; refresh(); }
  });
  document.addEventListener('click', async (ev) => {
    const t = ev.target.closest && ev.target.closest('[data-act]');
    if (!t || !mountEl || !mountEl.contains(t)) return;
    const act = t.dataset.act;
    const b = Model.bench;
    if ((act === 'add' || act === 'stub-add') && b.recipe) {
      const r = recipe(b.recipe);
      const base = r ? r.requires.map((q) => q.id).filter((i) => C.get(i)) : [];
      let id = t.dataset.id;
      if (act === 'stub-add') id = await addStub(t.dataset.name, t.dataset.teaser);
      Model.bench = { ids: base.concat(id && !base.includes(id) ? [id] : []), extras: [], recipe: null, consult: null, chosen: null, depth: b.depth };
      say('info', 'Moved to the workbench with the ingredients of ' + esc(r ? r.name : 'the recipe') + '. Consult again for new directions.');
      location.hash = '#/craft';
      return;
    }
    if (act === 'add') { if (t.dataset.id && C.get(t.dataset.id) && !b.ids.includes(t.dataset.id)) { b.ids.push(t.dataset.id); if (b.consult) say('info', 'Mix changed: consult again for new directions.'); clearConsult(); refresh(); } }
    else if (act === 'remove') { b.ids = b.ids.filter((x) => x !== t.dataset.id); clearConsult(); refresh(); }
    else if (act === 'remove-extra') { b.extras.splice(Number(t.dataset.i), 1); clearConsult(); refresh(); }
    else if (act === 'depth') { b.depth = Math.min(3, Math.max(1, b.depth + Number(t.dataset.d))); refresh(); }
    else if (act === 'load-recipe') { const r = recipe(t.dataset.rid); if (r) { Model.bench = { ids: r.requires.map((q) => q.id).filter((i) => C.get(i)), extras: [], recipe: null, consult: null, chosen: null, depth: b.depth }; Model.bench.fromRecipe = r.id; location.hash = '#/craft'; } }
    else if (act === 'ask') { const text = safePlain(Model.typed, 120); if (text) await judgeExtra(text); }
    else if (act === 'stub') { const id = await addStub(t.dataset.name, t.dataset.teaser); const x = b.extras.find((e) => e.nk && e.nk.name === t.dataset.name); if (x) b.extras.splice(b.extras.indexOf(x), 1); if (!b.ids.includes(id)) b.ids.push(id); clearConsult(); refresh(); }
    else if (act === 'stub-add') { const id = await addStub(t.dataset.name, t.dataset.teaser); if (!b.ids.includes(id)) b.ids.push(id); clearConsult(); say('info', 'Mix changed: consult again for new directions.'); refresh(); }
    else if (act === 'consult') { await consult(); }
    else if (act === 'craft') { await craft(); }
    else if (act === 'stop') { if (Model.busy) Model.busy.ctl.abort(); }
  });

  window.CodexCraft = { mount, refresh, Model, recipe, recipes, recipeReady, addStub };
  connect();
})();
