/* Resonance Codex — research quests and the dossier (Journal › Quests, Journal › Dossier).
   Quests live in the artifact db, collection "quests", one document per quest:
   { id, title, kind: 'main'|'side', status: 'active'|'done', tracked, summary,
     objectives: [{ id, text, done, doneAt }], links: [entry ids], refs: [{ text, url }], created, updated }
   Only the owner writes (db rule: read view, write owner). The tracked quest shows on the Journal, like the quest tracker. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;

  const Q = { list: [], loaded: false, db: null, owner: false, busy: false };
  let root = null;
  let args = [];
  let confirmDelete = null;

  const slug = (s) => String(s || 'quest').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 36) || 'quest';
  const rid = () => Math.random().toString(36).slice(2, 6);
  const clean = (s, n) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n || 300) : '');
  function sanitize(d) {
    if (!d || typeof d.id !== 'string' || !/^[a-z0-9-]+$/.test(d.id)) return null;
    return {
      id: d.id, lore: /^[a-z0-9-]+$/.test(String(d.lore || '')) ? d.lore : C.DEFAULT_LORE, title: clean(d.title, 160) || 'Untitled quest', kind: d.kind === 'side' ? 'side' : 'main', status: d.status === 'done' ? 'done' : 'active', tracked: d.tracked === true,
      summary: clean(d.summary, 1200),
      objectives: (Array.isArray(d.objectives) ? d.objectives : []).slice(0, 30).map((o, i) => ({ id: clean(o && o.id, 20) || 'o' + i, text: clean(o && o.text, 400), done: !!(o && o.done), doneAt: clean(o && o.doneAt, 10) })).filter((o) => o.text),
      links: (Array.isArray(d.links) ? d.links : []).filter((x) => typeof x === 'string' && /^[a-z0-9-]+$/.test(x)).slice(0, 12),
      refs: (Array.isArray(d.refs) ? d.refs : []).slice(0, 8).map((r) => ({ text: clean(r && r.text, 300), url: r && typeof r.url === 'string' && /^https:\/\//.test(r.url) ? r.url : '' })).filter((r) => r.text),
      created: clean(d.created, 30), updated: clean(d.updated, 30),
    };
  }
  const byOrder = (a, b) => (a.status === b.status ? (a.kind === b.kind ? (a.created < b.created ? -1 : 1) : a.kind === 'main' ? -1 : 1) : a.status === 'active' ? -1 : 1);
  /* the quests of the active lore */
  const mine = () => Q.list.filter((q) => q.lore === C.lore);
  const get = (id) => Q.list.find((q) => q.id === id) || null;
  const tracked = () => mine().find((q) => q.tracked && q.status === 'active') || null;
  const progress = (q) => { const n = q.objectives.length; const d = q.objectives.filter((o) => o.done).length; return { n, d }; };
  const nextObjective = (q) => q.objectives.find((o) => !o.done) || null;

  /* ------------------------------ persistence ------------------------------ */
  async function connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { Q.loaded = true; changed(); return; }
    try { const u = await cl.use('user'); Q.owner = u ? !!(await u.isOwner()) : false; } catch (err) { Q.owner = false; }
    try { Q.db = await cl.use('db'); } catch (err) { Q.db = null; }
    if (!Q.db) { Q.loaded = true; changed(); return; }
    try {
      Q.db.collection('quests').onSnapshot((qs) => {
        Q.list = qs.docs.map((s) => sanitize(s.data ? s.data() : s)).filter(Boolean).sort(byOrder);
        Q.loaded = true;
        changed();
      }, () => { Q.loaded = true; changed(); });
    } catch (err) { Q.loaded = true; changed(); }
  }
  async function save(q) {
    q.updated = new Date().toISOString();
    const i = Q.list.findIndex((x) => x.id === q.id);
    if (i >= 0) Q.list[i] = q; else Q.list.push(q);
    Q.list.sort(byOrder);
    changed();
    if (!Q.db || !Q.owner) { V.toast('Kept for this visit only: quests are saved by the owner of the codex.'); return false; }
    try { await Q.db.collection('quests').doc(q.id).set(JSON.parse(JSON.stringify(q))); return true; }
    catch (err) { V.toast('The quest was not saved (' + ((err && err.code) || 'error') + '). Try again.'); return false; }
  }
  async function remove(id) {
    Q.list = Q.list.filter((q) => q.id !== id);
    changed();
    if (Q.db && Q.owner) { try { await Q.db.collection('quests').doc(id).delete(); } catch (err) { V.toast('The quest was not deleted (' + ((err && err.code) || 'error') + ').'); } }
  }
  function changed() {
    if (root && root.isConnected) refresh();
    if (V.refreshQuestSlots) V.refreshQuestSlots();
  }

  /* ------------------------------ views ------------------------------ */
  function tabs(which) { return V.journalTabs ? V.journalTabs(which) : ''; }
  function pipsOf(q) { const p = progress(q); let h = '<span class="pips q-pips" aria-label="' + p.d + ' of ' + p.n + ' objectives done">'; for (let i = 0; i < p.n; i++) h += '<i class="' + (i < p.d ? 'on' : '') + '"></i>'; return h + '</span>'; }
  function qcard(q) {
    const p = progress(q); const nx = nextObjective(q);
    return '<a class="qcard' + (q.status === 'done' ? ' done' : '') + (q.tracked ? ' tracked' : '') + '" href="#/quest/' + esc(q.id) + '"><span class="q-kind">' + (q.kind === 'main' ? 'Main quest' : 'Side quest') + (q.tracked ? ' · tracked' : '') + (q.status === 'done' ? ' · complete' : '') + '</span><span class="q-title">' + esc(q.title) + '</span>' +
      (nx ? '<span class="q-next">' + V.rich(esc(nx.text)) + '</span>' : q.status === 'done' ? '<span class="q-next">Every objective done.</span>' : '') + '<span class="q-prog">' + pipsOf(q) + p.d + ' of ' + p.n + '</span></a>';
  }
  function trackedHtml() {
    const q = tracked();
    if (!Q.loaded) return '';
    if (!q) return mine().some((x) => x.status === 'active') ? '<section class="panel q-tracker"><h2>Tracked quest</h2><p class="muted">No quest is tracked. Open one in <a href="#/quests">Quests</a> and press Track.</p></section>' : '';
    const p = progress(q); const nx = nextObjective(q);
    return '<section class="panel q-tracker ornate"><h2>Tracked quest <span class="h2-n">' + p.d + ' of ' + p.n + '</span></h2><a class="q-title" href="#/quest/' + esc(q.id) + '">' + esc(q.title) + '</a>' +
      (nx ? '<p class="q-next"><span class="q-arrow" aria-hidden="true"></span>' + V.rich(esc(nx.text)) + '</p>' : '<p class="q-next">Every objective is done: mark the quest complete.</p>') + pipsOf(q) + '</section>';
  }
  function entrySlot(id) {
    const qs = mine().filter((q) => q.links.includes(id));
    if (!qs.length) return '';
    return '<section class="panel"><h2>Quests</h2><ul class="plain q-mini">' + qs.map((q) => '<li><a href="#/quest/' + esc(q.id) + '">' + esc(q.title) + '</a> <span class="muted small">' + (q.status === 'done' ? 'complete' : progress(q).d + ' of ' + progress(q).n) + '</span></li>').join('') + '</ul></section>';
  }
  function listHtml() {
    let h = tabs('quests') + '<section class="blk"><h1>Quests</h1>' + V.ORN + '<p class="lede">Your research tasks, as a quest log: the thesis checks, the derivations to redo, the sections to read. Tick objectives as you finish them; the tracked quest shows on the Journal.</p></section>';
    if (!Q.loaded) return h + '<p class="muted">Opening the quest log…</p>';
    h += trackedHtml();
    const active = mine().filter((q) => q.status === 'active');
    for (const kind of ['main', 'side']) {
      const qs = active.filter((q) => q.kind === kind);
      h += '<section class="panel"><h2>' + (kind === 'main' ? 'Main quests' : 'Side quests') + ' <span class="h2-n">' + qs.length + '</span></h2>' + (qs.length ? '<div class="qcards">' + qs.map(qcard).join('') + '</div>' : '<p class="muted">None yet.</p>') + '</section>';
    }
    const done = mine().filter((q) => q.status === 'done');
    if (done.length) h += '<details class="panel q-done"><summary><h2>Completed <span class="h2-n">' + done.length + '</span></h2></summary><div class="qcards">' + done.map(qcard).join('') + '</div></details>';
    if (Q.owner) {
      h += '<section class="panel"><h2>New quest</h2><form class="q-form" data-q-new><label for="q-new-title">Title</label><input id="q-new-title" name="title" type="text" maxlength="160" required placeholder="For example: Check the Γ convention in Bardetski & Macovei 2024">' +
        '<label for="q-new-summary">What it is about</label><textarea id="q-new-summary" name="summary" rows="2" maxlength="1200"></textarea>' +
        '<fieldset><legend>Kind</legend><label class="rv-pick"><input type="radio" name="kind" value="main" checked> Main quest</label><label class="rv-pick"><input type="radio" name="kind" value="side"> Side quest</label></fieldset>' +
        '<button type="submit" class="btn">Add the quest</button></form></section>';
    } else h += '<p class="muted small">Only the owner of the codex can add or change quests.</p>';
    return h;
  }
  function detailHtml(id) {
    const q = get(id);
    let h = tabs('quests');
    if (!Q.loaded) return h + '<p class="muted">Opening the quest log…</p>';
    if (!q) return h + '<section class="panel"><h1>Quest not found</h1><p>It may have been deleted. <a href="#/quests">Back to the quest log</a>.</p></section>';
    const p = progress(q);
    const ro = !Q.owner;
    h += '<nav class="crumbs" aria-label="Breadcrumbs"><a href="#/">Journal</a><span class="sep" aria-hidden="true">◆</span><a href="#/quests">Quests</a><span class="sep" aria-hidden="true">◆</span><span>' + esc(q.title) + '</span></nav>';
    h += '<header class="panel q-plate ornate blk"><div class="kind">' + (q.kind === 'main' ? 'Main quest' : 'Side quest') + ' · ' + (q.status === 'done' ? 'complete' : 'active') + (q.tracked ? ' · tracked' : '') + '</div><h1>' + esc(q.title) + '</h1>' + (q.summary ? '<p class="lede">' + V.rich(esc(q.summary)) + '</p>' : '') +
      '<div class="q-prog">' + pipsOf(q) + p.d + ' of ' + p.n + ' objectives done</div>' +
      (ro ? '' : '<div class="q-actions">' + (q.status === 'active' ? '<button type="button" class="btn' + (q.tracked ? ' ghost' : '') + '" data-q="track">' + (q.tracked ? 'Stop tracking' : 'Track this quest') + '</button><button type="button" class="btn ghost" data-q="complete">Mark complete</button>' : '<button type="button" class="btn ghost" data-q="reopen">Reopen</button>') +
        (confirmDelete === q.id ? '<span class="q-confirm">Delete this quest for good? <button type="button" class="btn" data-q="delete-yes">Delete</button><button type="button" class="btn ghost" data-q="delete-no">Keep it</button></span>' : '<button type="button" class="btn ghost q-del" data-q="delete">Delete</button>') + '</div>') + '</header>';
    h += '<section class="panel"><h2>Objectives</h2><ol class="q-objs">';
    q.objectives.forEach((o, i) => {
      const cid = 'q-o-' + q.id + '-' + i;
      h += '<li class="' + (o.done ? 'done' : '') + '"><input type="checkbox" id="' + cid + '" data-q-obj="' + i + '"' + (o.done ? ' checked' : '') + (ro ? ' disabled' : '') + '><div><label for="' + cid + '">' + V.rich(esc(o.text)) + '</label>' + (o.doneAt ? '<span class="q-when">done ' + esc(o.doneAt) + '</span>' : '') + '</div>' + (ro ? '' : '<button type="button" class="q-x" data-q-delobj="' + i + '" aria-label="Remove this objective">×</button>') + '</li>';
    });
    h += '</ol>' + (q.objectives.length ? '' : '<p class="muted">No objectives yet.</p>') + (ro ? '' : '<form class="q-inline" data-q-addobj><label class="sr-only" for="q-add-' + q.id + '">New objective</label><input id="q-add-' + q.id + '" name="text" type="text" maxlength="400" placeholder="Add an objective"><button type="submit" class="btn ghost">Add</button></form>') + '</section>';
    const links = q.links.filter((x) => C.get(x));
    const options = C.all().filter((e) => !q.links.includes(e.id) && !(window.CodexLibrary && window.CodexLibrary.hidden && window.CodexLibrary.hidden(e))).sort((a, b) => a.name.localeCompare(b.name));
    h += '<section class="panel"><h2>Linked entries</h2>' + (links.length ? '<div class="chips">' + links.map((x) => { const e = C.get(x); return '<span class="q-link"><a class="chip" data-id="' + esc(x) + '" href="#/e/' + esc(x) + '">' + V.pips(C.level(x)) + '<span>' + esc(e.name) + '</span></a>' + (ro ? '' : '<button type="button" class="q-x" data-q-unlink="' + esc(x) + '" aria-label="Unlink ' + esc(e.name) + '">×</button>') + '</span>'; }).join('') + '</div>' : '<p class="muted">No entries linked yet.</p>') +
      (ro ? '' : '<form class="q-inline" data-q-link><label class="sr-only" for="q-link-' + q.id + '">Link an entry</label><select id="q-link-' + q.id + '" name="entry"><option value="">Link an entry…</option>' + options.map((e) => '<option value="' + esc(e.id) + '">' + esc(e.name) + '</option>').join('') + '</select><button type="submit" class="btn ghost">Link</button></form>') + '</section>';
    if (q.refs.length) h += '<section class="panel"><h2>References</h2><ul class="prose-list">' + q.refs.map((r) => '<li class="blk">' + esc(r.text) + (r.url ? ' <a href="' + esc(r.url) + '" target="_blank" rel="noopener">source</a>' : '') + '</li>').join('') + '</ul></section>';
    return h;
  }

  /* the dossier: what the codex says about your own research, gathered for statements and interviews */
  function dossierData() {
    const fams = [];
    const seen = new Set();
    for (const e of C.all()) {
      if (!e.integrated) continue;
      // 3.0.1: figures, places, companies and book chapters are read, not studied; and an entry with neither a key formula nor a thesis link has nothing to say here
      if (e.kind !== 'concept' && e.kind !== 'section') continue;
      if (!(e.tip && e.tip.tex) && !(e.research || []).length) continue;
      const g = V.groupOf ? V.groupOf(e.id) : null;
      const key = g ? g.key : 'other';
      if (!seen.has(key)) { seen.add(key); fams.push({ key, name: g ? g.name : 'Other', items: [] }); }
      fams.find((f) => f.key === key).items.push(e);
    }
    return fams;
  }
  const plain = (s) => String(s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
  function dossierText() {
    const lines = ['Research dossier — ' + ((C.pack() || {}).name || 'Codex'), 'Compiled ' + C.today() + '.', ''];
    for (const f of dossierData()) {
      lines.push('## ' + f.name);
      for (const e of f.items) {
        lines.push('', '### ' + e.name + ' (' + C.LEVELS[C.level(e.id)].name + ')');
        if (e.tip && e.tip.tex) lines.push('Key formula: $' + e.tip.tex + '$' + (e.tip.ref ? ' (' + plain(e.tip.ref) + ')' : ''));
        for (const r of e.research || []) lines.push('- ' + plain(r));
      }
      lines.push('');
    }
    if (mine().length) {
      lines.push('## Quests');
      for (const q of mine()) {
        lines.push('', '### ' + q.title + ' (' + (q.status === 'done' ? 'complete' : 'active') + ')');
        if (q.summary) lines.push(q.summary);
        for (const o of q.objectives) lines.push('- [' + (o.done ? 'x' : ' ') + '] ' + o.text);
      }
    }
    return lines.join('\n');
  }
  function dossierHtml() {
    let h = tabs('dossier') + '<section class="blk"><h1>Dossier</h1>' + V.ORN + '<p class="lede">What the codex says about your own research, in one place: each studied entry’s key formula and its links to your thesis and PhD plan, and your quests. Entries with neither, and the figures, places and book chapters, are left out. Use it for research statements and interviews.</p>' +
      '<div class="q-actions"><button type="button" class="btn" data-q="copy-dossier">Copy as text</button><button type="button" class="btn ghost" data-q="doc-dossier">Ask Claude to make it a Doc</button></div></section>';
    for (const f of dossierData()) {
      h += '<section class="panel prose"><h2>' + esc(f.name) + '</h2>';
      for (const e of f.items) {
        h += '<article class="dos-item blk"><h3><a href="#/e/' + esc(e.id) + '" data-id="' + esc(e.id) + '">' + esc(e.name) + '</a> <span class="lvl">' + V.pips(C.level(e.id)) + esc(C.LEVELS[C.level(e.id)].name) + '</span></h3>' +
          (e.tip && e.tip.tex ? V.texBlock(e.tip.tex) : '') + ((e.research || []).length ? '<ul class="prose-list research">' + e.research.map((r) => '<li class="blk">' + V.rich(r) + '</li>').join('') + '</ul>' : '<p class="muted small">No thesis links written for this entry yet.</p>') + '</article>';
      }
      h += '</section>';
    }
    if (mine().length) h += '<section class="panel"><h2>Quests</h2><div class="qcards">' + mine().map(qcard).join('') + '</div></section>';
    return h;
  }
  function viewHtml() {
    const [mode, id] = args;
    if (mode === 'dossier') return dossierHtml();
    if (mode === 'quest') return detailHtml(id);
    return listHtml();
  }
  function refresh() {
    if (!root || !root.isConnected) return;
    const y = window.scrollY;
    const active = document.activeElement; const fid = active && root.contains(active) ? active.id : null;
    if (V.clearMath) V.clearMath(root);
    window.CodexForms.swap(root, viewHtml());
    if (args[0] === 'dossier') V.linkify(root);
    V.typesetNow(root);
    window.scrollTo(0, y);
    if (fid) { const el = document.getElementById(fid); if (el) el.focus({ preventScroll: true }); }
  }

  /* ------------------------------ controller ------------------------------ */
  document.addEventListener('submit', (ev) => {
    const f = ev.target;
    if (!root || !root.contains(f)) return;
    if (f.matches('[data-q-new]')) {
      ev.preventDefault();
      const d = new FormData(f);
      const title = clean(d.get('title'), 160);
      if (!title) return;
      const q = { id: 'q-' + slug(title) + '-' + rid(), lore: C.lore, title, kind: d.get('kind') === 'side' ? 'side' : 'main', status: 'active', tracked: !tracked(), summary: clean(d.get('summary'), 1200), objectives: [], links: [], refs: [], created: new Date().toISOString(), updated: '' };
      save(q).then(() => { location.hash = '#/quest/' + q.id; });
    } else if (f.matches('[data-q-addobj]')) {
      ev.preventDefault();
      const q = get(args[1]); const text = clean(new FormData(f).get('text'), 400);
      if (!q || !text) { if (window.CodexForms) window.CodexForms.unsent(f); return; }
      q.objectives = q.objectives.concat([{ id: 'o' + rid(), text, done: false, doneAt: '' }]);
      save(q).then(() => { const i = root.querySelector('[data-q-addobj] input'); if (i) i.focus(); });
    } else if (f.matches('[data-q-link]')) {
      ev.preventDefault();
      const q = get(args[1]); const id = String(new FormData(f).get('entry') || '');
      if (!q || !id || !C.get(id) || q.links.includes(id)) return;
      q.links = q.links.concat([id]);
      save(q);
    }
  });
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (!root || !root.contains(t) || !t.matches('[data-q-obj]')) return;
    const q = get(args[1]); if (!q || !Q.owner) return;
    const i = Number(t.dataset.qObj);
    const o = Object.assign({}, q.objectives[i]);
    o.done = t.checked; o.doneAt = t.checked ? C.today() : '';
    q.objectives = q.objectives.map((x, k) => (k === i ? o : x));
    save(q);
  });
  document.addEventListener('click', async (ev) => {
    if (!root || !root.contains(ev.target)) return;
    const b = ev.target.closest('[data-q], [data-q-delobj], [data-q-unlink]');
    if (!b) return;
    if (b.dataset.q === 'copy-dossier') {
      const text = dossierText();
      try { await navigator.clipboard.writeText(text); V.toast('Dossier copied as text (' + text.length.toLocaleString('en-US') + ' characters).'); }
      catch (err) { V.toast('Copying was refused here. Select the page text instead.'); }
      return;
    }
    if (b.dataset.q === 'doc-dossier') {
      V.askClaude('Please turn the Dossier of ' + ((C.pack() || {}).name || 'the codex') + ' (lore “' + C.lore + '”) into a Claude Doc titled “Research dossier”: for each integrated entry its key formula and its links to my thesis and PhD plan, then my quests with their objectives. The source is the codex itself (entry modules and the database collection “quests”).', b.closest('.blk') || b, b);
      return;
    }
    const q = get(args[1]); if (!q) return;
    if (b.dataset.qDelobj != null) { const i = Number(b.dataset.qDelobj); q.objectives = q.objectives.filter((_, k) => k !== i); save(q); return; }
    if (b.dataset.qUnlink) { q.links = q.links.filter((x) => x !== b.dataset.qUnlink); save(q); return; }
    const act = b.dataset.q;
    if (act === 'track') {
      const was = q.tracked;
      for (const other of mine()) if (other.tracked && other.id !== q.id) { other.tracked = false; await save(other); }
      q.tracked = !was; save(q);
    } else if (act === 'complete') { q.status = 'done'; q.tracked = false; save(q); }
    else if (act === 'reopen') { q.status = 'active'; save(q); }
    else if (act === 'delete') { confirmDelete = q.id; refresh(); }
    else if (act === 'delete-no') { confirmDelete = null; refresh(); }
    else if (act === 'delete-yes') { confirmDelete = null; await remove(q.id); location.hash = '#/quests'; }
  });

  function mount(el, routeArgs) { root = el; args = routeArgs || []; confirmDelete = null; refresh(); }
  window.CodexQuests = { mount, trackedHtml, entrySlot, list: () => mine().slice(), loaded: () => Q.loaded };
  connect();
})();
