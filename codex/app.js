/* Resonance Codex — controller and views.
   Model: Codex registry + Store (core.js), tomes (tomes.js), entry modules (entries/*.js).
   Views: one function per route, returning HTML; dynamic parts refresh in place when progress changes. */
(function () {
  'use strict';
  const C = window.Codex;
  const Store = C.Store;
  const app = document.getElementById('codex-main');
  const statusEl = document.getElementById('codex-status');

  /* ---------------- small helpers ---------------- */
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ESC[ch]);
  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Content strings are HTML written in the entry modules; $…$ is inline math, $$…$$ display math.
  function rich(s) {
    if (s == null) return '';
    let out = String(s);
    out = out.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => '<span class="m mdisp">\\[' + esc(tex) + '\\]</span>');
    // inline math keeps the punctuation that follows it on the same line
    out = out.replace(/\$([^$\n]+?)\$([.,;:!?)\]]*)/g, (_, tex, punct) => (punct ? '<span class="mnw">' : '') + '<span class="m">\\(' + esc(tex) + '\\)</span>' + (punct ? punct + '</span>' : ''));
    return out;
  }
  const texBlock = (tex) => '<div class="m mdisp">\\[' + esc(tex) + '\\]</div>';

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem('codex:' + key);
      window.localStorage.setItem('codex:' + key, val);
    } catch (err) { /* storage can be unavailable; the page works without it */ }
    return null;
  }

  let toastTimer = null;
  function toast(msg) {
    let t = document.getElementById('codex-toast');
    if (!t) { t = document.createElement('div'); t.id = 'codex-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
  }

  window.addEventListener('hashchange', () => { const t = document.getElementById('codex-toast'); if (t) { t.classList.remove('show'); clearTimeout(toastTimer); } }); /* 3.0.4: a toast does not follow you to the next page */

  const FIELD = { QO: 'Quantum optics', QC: 'Quantum computing', QI: 'Quantum information', general: 'General' };
  const SLOT = { seminal: 'Seminal', cited: 'Highly cited since 2021', latest: 'Latest (last 12 months)', milestones: 'Milestones', data: 'Data', related: 'Related' };
  const SLOT_ORDER = ['seminal', 'cited', 'latest', 'milestones', 'data', 'related'];

  /* ---------------- fog of war for section titles ---------------- */
  const reveal = () => store('reveal') === '1';
  function sectionLabel(tomeId, num) {
    const f = C.findSection(tomeId, num);
    const t = C.tome(tomeId);
    const short = t ? t.short : tomeId;
    const isCh = num.startsWith('ch:');
    const shownNum = isCh ? 'ch. ' + num.slice(3) : '§' + num;
    const entryId = C.sectionEntry(tomeId, num);
    const known = !!entryId || reveal();
    let title = '????';
    let page = '';
    if (f) {
      title = f.section ? f.section.title : f.chapter.title;
      page = f.section ? f.section.page : (f.chapter.pages || '');
    }
    const showTitle = isCh || known; // chapter titles are public on the tome page anyway
    return {
      short, shownNum, entryId, page: page ? String(page) : '',
      title: showTitle ? title : '????',
      fog: !showTitle,
      href: entryId ? '#/e/' + entryId : '#/tome/' + tomeId + '/' + encodeURIComponent(num),
      check: f && f.section && f.section.check ? f.section.check : '',
    };
  }

  /* ---------------- keyword underlining ---------------- */
  let aliasRe = null;
  const aliasMap = new Map();
  function buildAliases() {
    const names = [];
    for (const e of C.all()) {
      if (e.nolink) continue; // chapters and other entries that must never be underlined by name
      for (const n of [e.name].concat(e.aliases || [])) {
        const key = n.toLowerCase();
        if (!aliasMap.has(key)) { aliasMap.set(key, e.id); names.push(n); }
      }
    }
    names.sort((a, b) => b.length - a.length);
    aliasRe = new RegExp('(^|[^\\p{L}\\p{N}_])(' + names.map(escRe).join('|') + ')(?![\\p{L}\\p{N}_])', 'giu');
  }
  function makeLink(id, word) {
    const e = C.get(id);
    const lvl = C.level(id);
    const a = document.createElement('a');
    a.href = e && e.kind === 'place' ? '#/library/' + encodeURIComponent(e.place) : '#/e/' + id;
    a.textContent = word;
    a.className = 'kw ' + (lvl >= 2 ? 'kw-known' : 'kw-fog') + (e && (e.kind === 'figure' || e.kind === 'place' || e.kind === 'company') ? ' kw-' + e.kind : '');
    if (e) a.dataset.id = id; // the hover card (tooltip.js) replaces the browser's title text
    return a;
  }
  const NO_LINK = 'a, button, code, .m, h1, h2, h3, .nolink, .quiz, .lit, input, label.opt, mjx-container, select, textarea, summary .num';
  function linkify(root, selfId) {
    if (!root) return;
    if (!aliasRe) buildAliases();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = n.parentElement;
        if (!p || p.closest(NO_LINK)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const seen = new WeakMap();
    for (const node of nodes) {
      const text = node.nodeValue;
      const block = node.parentElement.closest('p, li, dd, td, .blk') || root;
      let used = seen.get(block);
      if (!used) { used = new Set(); seen.set(block, used); }
      aliasRe.lastIndex = 0;
      let m; let last = 0; let frag = null;
      while ((m = aliasRe.exec(text))) {
        const word = m[2];
        const start = m.index + m[1].length;
        const id = aliasMap.get(word.toLowerCase());
        if (!id || id === selfId || used.has(id)) continue;
        used.add(id);
        if (!frag) frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(text.slice(last, start)));
        frag.appendChild(makeLink(id, word));
        last = start + word.length;
      }
      if (frag) {
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    }
  }

  /* ---------------- math typesetting ---------------- */
  let typesetChain = Promise.resolve();
  function typesetNow(el) {
    const MJ = window.MathJax;
    if (!el || !MJ || typeof MJ.typesetPromise !== 'function') return Promise.resolve(); // MathJax calls back when ready
    const p = typesetChain.then(() => (el.isConnected ? MJ.typesetPromise([el]) : null)); // a view replaced meanwhile is skipped
    typesetChain = p.catch((err) => console.warn('MathJax:', err));
    return typesetChain;
  }
  function typeset(el) { typesetNow(el); }
  window.__codexTypeset = () => typeset(app);

  /* ---------------- shared bits of view ---------------- */
  function pips(level) {
    let h = '<span class="pips" aria-hidden="true">';
    for (let i = 1; i <= 4; i++) h += '<i class="' + (level >= i ? 'on' : '') + '"></i>';
    return h + '</span>';
  }
  /* glyphs: the "portrait" of each entry, drawn in a medallion */
  const GLYPHS = { 'rabi-oscillation': 'Ω', 'decay-rate': 'Γ', 'dressed-states': '±', 'mixing-angle': 'θ', 'secular-approximation': '≈',
    'stimulated-spontaneous': 'n+1', 'sz-6-3': '§', 'bloch-sphere': 'σ', 'density-matrix': 'ρ', 'master-equation': 'ℒ', 'dipole-dipole': 'δ',
    'superradiance': 'N²', 'subradiance': '∅', 'mollow-triplet': '⫴', 'dicke-states': 'J', 'antibunching': 'g²', 'purcell': 'Q/V',
    'lamb-shift': 'Δω', 'interaction-picture': 'Ĥ', 'rwa': '≃', 'born-markov': 'δ(t)', 'mode-continuum': '∫k', 'g1-correlation': 'G¹',
    'photon-wavefunction': 'ψγ', 'causality': 'Θ', 'qrt': '⟨⟩τ', 'quantum-jumps': '↯', 'elastic-scattering': 'δ(ν)',
    'light-shift': 'Ω²/Δ', 'autler-townes': '⫶', 'jaynes-cummings': 'JC', 'coherent-state': '|α⟩' };
  function glyph(e) {
    if (!e) return '?';
    if (e.glyph) return e.glyph;
    if (GLYPHS[e.id]) return GLYPHS[e.id];
    if (e.kind === 'chapter') return String(e.chapter || '¶');
    return e.name.split(/\s+/).filter((w) => /^[A-Za-zΑ-ω]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
  }
  function medal(e, extra) {
    const l = C.level(e.id);
    const g = glyph(e);
    const size = g.length > 3 ? ' style="font-size:calc(var(--s) * .26)"' : g.length > 2 ? ' style="font-size:calc(var(--s) * .31)"' : '';
    return '<span class="medal' + (l < 2 ? ' fog' : '') + (extra ? ' ' + extra : '') + '" aria-hidden="true"' + size + '>' + esc(g) + '</span>';
  }

  /* knowledge, as in the bestiary: integrating gives 25%, the derivation steps up to 50% more, the quiz the last 25% */
  function knowledge(id) {
    const e = C.get(id);
    if (!e || !e.integrated) return 0;
    const p = Store.entry(id);
    const steps = e.steps.length ? C.stepsDone(id) / e.steps.length : 0;
    const quiz = e.quiz.length ? (p.quizPassed ? 1 : Math.min(1, (p.quizBest || 0) / C.PASS_MARK)) : 0;
    return Math.round(25 + 50 * steps + 25 * (C.level(id) >= 3 ? quiz : 0));
  }
  function kbarInner(id) {
    const k = knowledge(id);
    const l = C.level(id);
    const marks = [{ at: 25, n: 2 }, { at: 75, n: 3 }, { at: 100, n: 4 }];
    return '<div class="kbar-top"><span>Knowledge</span><b>' + k + '%</b></div>' +
      '<div class="kbar-track"><span class="kbar-fill" style="width:' + k + '%"></span>' + marks.map((m) => '<i class="' + (l >= m.n ? 'on' : '') + '" style="left:' + m.at + '%"></i>').join('') + '</div>' +
      '<div class="kbar-marks">' + marks.map((m) => '<span class="' + (l >= m.n ? 'on' : '') + '" style="left:' + m.at + '%">' + esc(C.LEVELS[m.n].name) + '</span>').join('') + '</div>';
  }
  function kbarHtml(id) {
    return '<div class="kbar" data-kbar-for="' + esc(id) + '" role="img" aria-label="Knowledge ' + knowledge(id) + '%, ' + esc(C.LEVELS[C.level(id)].name) + '">' + kbarInner(id) + '</div>';
  }

  /* the next objective on an entry, like the current step of a quest */
  function nextGoal(id) {
    const e = C.get(id);
    const l = C.level(id);
    if (!e) return '';
    if (!isLearnable(e)) return e.kind === 'figure' ? 'A figure: read, not learnt. Their name opens this card wherever it appears.' : e.kind === 'company' ? 'A company: read, not learnt. Its name opens this card wherever it appears.' : e.kind === 'chapter' ? 'A chapter of a must-read: it illuminates the entries listed below.' : '';
    if (l < 2) return 'Next: ask Claude to integrate this entry.';
    if (window.CodexReview && window.CodexReview.isRusty(id)) return 'Rusty: nothing on this entry was touched for ' + window.CodexReview.daysIdle(id) + ' days. Answer its questions in Journal › Review to polish it.';
    if (l === 2) {
      const left = e.steps.length - C.stepsDone(id);
      if (!e.steps.length) return 'Studied. This entry has no derivation path yet.';
      return 'Next: tick ' + (left === 1 ? 'the last derivation step' : 'the ' + left + ' remaining derivation steps') + ' to reach Derived and open the deeper notes.';
    }
    if (l === 3) return e.quiz.length ? 'Next: pass the quiz (' + Math.round(C.PASS_MARK * 100) + '% or more) to reach Mastered and open the mastery notes.' : 'Derived. This entry has no quiz yet.';
    return 'Mastered. Every note on this entry is open.';
  }

  /* families: how the bestiary groups its entries, as the game groups creatures by type; they come from the lore pack */
  const pack = () => C.pack() || { families: [], familyOf: {}, sections: [], journal: [], tomes: [], name: 'Codex' };
  const FAMILIES = () => pack().families || [];
  function familyOf(e) {
    if (e.crafted) return 'crafted';
    if (e.kind === 'section') return 'tome';
    if (e.kind === 'figure') return 'figure';
    if (e.kind === 'place') return 'place';
    if (e.kind === 'chapter') return 'chapter';
    return e.family || (pack().familyOf || {})[e.id] || 'uncharted';
  }
  /* the creatures of the bestiary: concepts, sections and crafted pages (figures and places have their own sections) */
  const isBeast = (e) => e.kind !== 'figure' && e.kind !== 'place' && e.kind !== 'chapter';
  const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  /* the cyclopedia's groups, in reading order; prev/next and the index both use it */
  function groups() {
    const all = C.all().filter((e) => !unseen(e)); /* 3.0.1: secret monks stay out of the margin index too */
    const out = [];
    for (const f of FAMILIES()) {
      const items = all.filter((e) => familyOf(e) === f.id).sort(byName);
      if (items.length) out.push({ key: f.id, section: 'bestiary', name: f.name, hint: f.hint, items });
    }
    const stray = all.filter((e) => isBeast(e) && !e.crafted && e.kind !== 'section' && !FAMILIES().some((f) => f.id === familyOf(e))).sort(byName);
    if (stray.length) out.push({ key: 'uncharted', section: 'bestiary', name: 'Uncharted', hint: 'Keywords not placed in a family yet.', items: stray });
    const figs = all.filter((e) => e.kind === 'figure').sort((a, b) => ((a.kin ? 1 : 0) - (b.kin ? 1 : 0)) || byName(a, b));
    if (figs.length) out.push({ key: 'figures', section: 'figures', name: 'Figures', hint: C.lore === 'resonance' ? 'The people the wings and the Altar are named for.' : 'The people this codex names.', items: figs });
    const crafted = all.filter((e) => e.crafted).sort((a, b) => (a.crafted.prebuilt === b.crafted.prebuilt ? byName(a, b) : a.crafted.prebuilt ? -1 : 1));
    if (crafted.length) out.push({ key: 'crafted', section: 'crafted', name: 'Crafted', hint: 'Classic recipes and your own dishes.', items: crafted });
    for (const t of C.tomes()) {
      const items = all.filter((e) => e.kind === 'section' && e.source && e.source.tome === t.id);
      if (items.length) out.push({ key: 'tome-' + t.id, section: 'tomes', name: t.short, hint: t.title, items });
    }
    return out;
  }
  function groupOf(id) { return groups().find((g) => g.items.some((e) => e.id === id)) || null; }

  /* ---------------- the cyclopedia index (left margin; a sheet on small screens) ---------------- */
  const SECTION_NAMES = { bestiary: 'Bestiary', figures: 'Figures', library: 'Library', literature: 'Literature', crafted: 'Crafted', tomes: 'Tomes' };
  function sectionName(sec) { if (sec === 'library') { const p = pack(); return p.library && p.library.name ? p.library.name : 'Library'; } return SECTION_NAMES[sec] || sec; }
  function sectionsOf() { const s = pack().sections; return Array.isArray(s) && s.length ? s : ['bestiary', 'crafted', 'tomes']; }
  function closedGroups() { try { return new Set(JSON.parse(store('index-closed') || '[]')); } catch (err) { return new Set(); } }
  function indexHtml(curId) {
    const closed = closedGroups();
    const gs = groups();
    let h = '<div class="ci-head"><a href="#/cyclopedia">Cyclopedia</a><button type="button" class="ci-close" data-index-close>Close</button></div>';
    for (const sec of sectionsOf()) {
      if (sec === 'library') {
        if (window.CodexLibrary) h += window.CodexLibrary.indexHtml(curId, closed.has('library'));
        continue;
      }
      if (sec === 'literature') {
        const n = allLiterature().length;
        if (n) h += '<a class="ci-solo' + (current.name === 'literature' ? ' on' : '') + '" href="#/literature">' + esc(sectionName(sec)) + '<span class="ci-n">' + n + '</span></a>';
        continue;
      }
      const mine = gs.filter((g) => g.section === sec);
      if (!mine.length) continue;
      const n = sec === 'tomes' ? C.tomes().length : sec === 'bestiary' ? bestiaryTally().n : mine.reduce((s, g) => s + g.items.length, 0); /* 3.0.4: Tomes counts the books, as the Cyclopedia card does; 3.0.5: the Bestiary heading is the one tally (36), as on the card */
      const open = !closed.has(sec) || mine.some((g) => g.items.some((e) => e.id === curId));
      h += '<details class="ci-group" data-ci="' + sec + '"' + (open ? ' open' : '') + '><summary>' + esc(sectionName(sec)) + '<span class="ci-n">' + n + '</span></summary>';
      for (const g of mine) {
        if (sec === 'bestiary' || sec === 'tomes') h += '<div class="ci-fam">' + esc(g.name) + (sec === 'tomes' ? ' <span class="ci-n">' + g.items.length + (g.items.length === 1 ? ' section' : ' sections') + '</span>' : '') + '</div>';
        for (const e of g.items) {
          const l = C.level(e.id);
          const rust = isBeast(e) && window.CodexReview && window.CodexReview.isRusty(e.id);
          const lvlText = e.kind === 'figure' ? (e.board ? 'member of the board' : e.kin ? 'kin of the name' : 'figure') : C.LEVELS[l].name;
          h += '<a class="ci-row l' + l + (l < 2 ? ' fog' : '') + (rust ? ' rust' : '') + (e.kin ? ' kin' : '') + (e.id === curId ? ' on' : '') + '" href="#/e/' + esc(e.id) + '"' + (e.id === curId ? ' aria-current="page"' : '') + '>' +
            '<span class="ci-g" aria-hidden="true">' + esc(glyph(e)) + '</span><span class="ci-name">' + esc(e.name) + '<span class="sr-only">, ' + esc(lvlText) + (rust ? ', rusty' : '') + '</span></span></a>';
        }
      }
      h += '</details>';
    }
    const beasts = bestiaryEntries();
    const known = beasts.filter((e) => C.level(e.id) >= 2).length;
    h += '<p class="ci-foot">' + known + ' of ' + beasts.length + ' entries (bestiary, crafted pages, tome sections and companies) studied or better.' + (C.tomes().length ? ' Sections you have not reached stay sealed in the <a href="#/tomes">tomes</a>.' : '') + '</p>';
    return h;
  }
  const indexEl = document.getElementById('codex-index');
  const shellEl = document.getElementById('codex-shell');
  function renderIndex(curId) {
    if (!indexEl) return;
    const sc = indexEl.scrollTop;
    indexEl.innerHTML = indexHtml(curId);
    indexEl.scrollTop = sc;
    const on = indexEl.querySelector('.ci-row.on');
    if (on && window.innerWidth >= 1100) {
      const r = on.getBoundingClientRect(); const box = indexEl.getBoundingClientRect();
      if (r.top < box.top + 40 || r.bottom > box.bottom - 20) on.scrollIntoView({ block: 'center' });
    }
  }
  function openIndex(on) {
    if (!indexEl) return;
    indexEl.classList.toggle('open', on);
    document.documentElement.style.overflow = on ? 'hidden' : '';
    if (on) { const b = indexEl.querySelector('[data-index-close]'); if (b) b.focus({ preventScroll: true }); }
  }
  if (indexEl) {
    indexEl.addEventListener('toggle', (ev) => {
      const d = ev.target.closest && ev.target.closest('details[data-ci]');
      if (!d) return;
      const closed = closedGroups();
      if (d.open) closed.delete(d.dataset.ci); else closed.add(d.dataset.ci);
      store('index-closed', JSON.stringify(Array.from(closed)));
    }, true);
    indexEl.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-index-close]')) { openIndex(false); return; }
      if (ev.target.closest('a') && indexEl.classList.contains('open')) openIndex(false);
    });
  }
  /* the Journal's tabs, as in the game's journal window */
  function journalTabs(active) {
    const want = Array.isArray(pack().journal) ? pack().journal : [];
    const tabs = [['overview', '#/', 'Overview'], ['quests', '#/quests', 'Quests'], ['review', '#/review', 'Review'], ['dossier', '#/dossier', 'Dossier']].filter((t) => want.includes(t[0]));
    if (!tabs.length) return '';
    const due = window.CodexReview ? window.CodexReview.todayCount() : 0;
    return '<nav class="jtabs" aria-label="Journal">' + tabs.map((t) => '<a href="' + t[1] + '"' + (t[0] === active ? ' class="on" aria-current="page"' : '') + '>' + t[2] + (t[0] === 'review' && due ? '<span class="nav-badge jt-badge" aria-label="' + due + ' questions ready">' + due + '</span>' : '') + '</a>').join('') + '</nav>';
  }
  function questSlot(key) {
    const Q = window.CodexQuests;
    if (!Q) return '';
    if (key === 'tracked') return Q.trackedHtml();
    if (key.startsWith('entry:')) return Q.entrySlot(key.slice(6));
    return '';
  }
  function refreshQuestSlots() {
    document.querySelectorAll('[data-quest-slot]').forEach((el) => { el.innerHTML = questSlot(el.dataset.questSlot); linkify(el); });
  }
  function crumbs(parts) {
    const sep = '<span class="sep" aria-hidden="true">◆</span>';
    return '<nav class="crumbs" aria-label="Breadcrumbs">' + parts.map((p) => (p.href ? '<a href="' + p.href + '">' + esc(p.label) + '</a>' : '<span>' + esc(p.label) + '</span>')).join(sep) +
      '<button type="button" class="ci-toggle" data-index-open><svg class="ico" aria-hidden="true"><use href="#i-index"/></svg>Index</button></nav>';
  }

  /* the spectral-line ornament: five lines, like the spectrum in your thesis */
  const ORN = '<svg class="orn" viewBox="0 0 46 14" aria-hidden="true"><path d="M7 13V9.5M15 13V6M23 13V1M31 13V6M39 13V9.5M1 13h44"/></svg>';
  function bcard(e) {
    const l = C.level(e.id);
    return '<a class="bcard' + (l < 2 ? ' fog' : '') + '" href="#/e/' + esc(e.id) + '">' + medal(e) + '<span class="bc-main"><span class="bc-kind">' + sourceLine(e) + '</span><span class="bc-name">' + esc(e.name) + '</span>' +
      '<span class="bc-teaser">' + rich(e.teaser || '') + '</span><span class="bc-lvl">' + pips(l) + esc(C.LEVELS[l].name) + (l >= 2 ? ' · ' + knowledge(e.id) + '%' : '') + '</span>' +
      (l >= 2 ? '<span class="kmini" aria-hidden="true"><span style="width:' + knowledge(e.id) + '%"></span></span>' : '') + '</span></a>';
  }
  function foundShort(f) {
    if (f.thesis) return 'Your thesis' + (f.page ? ', ' + pageLabel(f.page) : '');
    if (f.session) return 'Our sessions';
    const L = sectionLabel(f.tome, f.num);
    return esc(L.short) + ' ' + esc(L.shownNum) + (f.page ? ', ' + pageLabel(f.page) : '');
  }

  function levelBadge(id) {
    const l = C.level(id);
    return '<span class="lvl lvl-' + l + '" data-level-for="' + esc(id) + '">' + pips(l) + '<span class="lvl-name">' + esc(C.LEVELS[l].name) + '</span></span>';
  }
  function entryChip(id) {
    const e = C.get(id);
    if (!e) return '';
    const l = C.level(id);
    return '<a class="chip ' + (l >= 2 ? 'chip-known' : 'chip-fog') + '" data-id="' + esc(id) + '" href="#/e/' + esc(id) + '">' + pips(l) + '<span>' + esc(e.name) + '</span></a>';
  }
  function sourceLine(e) {
    if (e.kind === 'section' && e.source) {
      const t = C.tome(e.source.tome);
      return esc(t ? t.short : e.source.tome) + ' §' + esc(e.source.num) + (e.source.pages ? ' · pp. ' + esc(e.source.pages) : '');
    }
    if (e.crafted) return e.crafted.prebuilt ? 'Crafted · classic recipe' : e.verified ? 'Crafted · forged' : 'Crafted · draft';
    if (e.kind === 'figure') return (e.board ? 'Member of the board' : e.kin ? 'Kin of the name' : 'Figure') + (e.years ? ' · ' + esc(e.years) : '');
    if (e.kind === 'place') return ({ library: 'Library', wing: 'Wing', room: 'Room', altar: 'Altar', hall: 'Hall' }[e.placeKind] || 'Place') + (e.role ? ' · ' + ({ open: 'front desk', own: 'your own writing', hidden: 'keeper only' }[e.role] || e.role) : '');
    if (e.kind === 'company') { const f = FAMILIES().find((x) => x.id === familyOf(e)); return (f ? esc(f.name) : 'Company') + (e.founded ? ' · founded ' + esc(e.founded) : '') + (e.hq ? ' · ' + esc(e.hq) : ''); }
    if (e.kind === 'chapter') return 'Chapter ' + esc(e.chapter) + ' · ' + esc(e.bookTitle || '');
    return e.integrated ? 'Concept' : 'Concept · discovered';
  }
  const pageLabel = (p) => (/[–-]/.test(String(p)) ? 'pp. ' : 'p. ') + esc(p);
  function foundItem(f) {
    if (f.thesis) return '<li><span class="where">Your thesis' + (f.page ? ', ' + pageLabel(f.page) : '') + '</span> ' + rich(f.note || '') + '</li>';
    if (f.session) return '<li><span class="where">Our sessions</span> ' + rich(f.note || '') + '</li>';
    const L = sectionLabel(f.tome, f.num);
    return '<li><a class="where" href="' + L.href + '"' + (L.entryId ? ' data-id="' + esc(L.entryId) + '"' : '') + '>' + esc(L.short) + ' ' + esc(L.shownNum) + (f.page ? ', ' + pageLabel(f.page) : '') + '</a> ' + rich(f.note || '') + '</li>';
  }
  function readNextItem(r) {
    const L = sectionLabel(r.tome, r.num);
    const title = L.fog ? '<span class="fogtxt">????</span>' : esc(L.title);
    return '<li class="blk"><a href="' + L.href + '" class="rn"' + (L.entryId ? ' data-id="' + esc(L.entryId) + '"' : '') + '><span class="rn-num">' + esc(L.short) + ' ' + esc(L.shownNum) + (L.page ? ' · p. ' + esc(L.page) : '') + '</span><span class="rn-title">' + title + '</span></a><span class="rn-why">' + rich(r.why || '') + '</span></li>';
  }

  function litCard(r, slot, fromId) {
    const links = [];
    if (r.doi) links.push('<a href="https://doi.org/' + esc(r.doi) + '" target="_blank" rel="noopener">DOI</a>');
    if (r.arxiv) links.push('<a href="https://arxiv.org/abs/' + esc(r.arxiv) + '" target="_blank" rel="noopener">arXiv:' + esc(r.arxiv) + '</a>');
    if (r.url) links.push('<a href="' + esc(r.url) + '" target="_blank" rel="noopener">Source</a>');
    const cites = r.cites ? '<span class="cites">Cited by ' + esc(r.cites.n.toLocaleString('en-US')) + ' <span class="src">(' + esc(r.cites.src) + ', ' + esc(r.cites.date) + ')</span></span>' : '';
    const date = r.date ? '<span class="cites">First posted ' + esc(r.date) + '</span>' : '';
    const from = fromId ? '<a class="from" href="#/e/' + esc(fromId) + '">' + esc(C.get(fromId).name) + '</a>' : '';
    return '<article class="lit" data-field="' + esc(r.field) + '" data-slot="' + esc(slot) + '">' +
      '<div class="lit-tags"><span class="tag tag-' + esc(r.field) + '">' + esc(FIELD[r.field] || r.field) + '</span><span class="tag tag-slot">' + esc(SLOT[slot]) + '</span>' + (r.verified === false ? '<span class="tag tag-unverified">unverified</span>' : '') + from + '</div>' +
      '<div class="lit-ref"><span class="au">' + esc(r.authors) + '</span> (' + esc(r.year) + '). <span class="ti">' + esc(r.title) + '</span>. <span class="ve">' + esc(r.venue) + '</span>.</div>' +
      '<div class="lit-meta">' + cites + date + (links.length ? '<span class="links">' + links.join(' · ') + '</span>' : '') + '</div>' +
      (r.fit ? '<p class="fit">' + rich(r.fit) + '</p>' : '') +
      '</article>';
  }

  /* ---------------- views ---------------- */
  const SUGGESTED = () => (pack().suggested || []).filter((r) => C.tome(r.tome));
  /* entries you can study: concepts (crafted ones included) and sections; figures, places and companies are read, not learnt */
  const isLearnable = (e) => e.kind === 'concept' || e.kind === 'section';
  /* 3.0.4: one Bestiary tally for every page. The Bestiary is every entry the Bestiary page lists: the families, the crafted pages, the tome sections and the companies, each counted once. */
  function bestiaryEntries() {
    const seen = new Set(); const out = [];
    for (const g of groups()) if (g.section === 'bestiary' || g.section === 'crafted' || g.section === 'tomes') for (const e of g.items) if (!seen.has(e.id)) { seen.add(e.id); out.push(e); }
    return out;
  }
  function bestiaryTally() {
    const es = bestiaryEntries(); const lv = [0, 0, 0, 0, 0];
    es.forEach((e) => { lv[C.level(e.id)]++; });
    return { n: es.length, lv, crafted: es.filter((e) => e.crafted).length, sections: es.filter((e) => e.kind === 'section').length, companies: es.filter((e) => e.kind === 'company').length };
  }
  function levelCounts() { return bestiaryTally().lv; }
  function hasJournal() { const j = pack().journal; return Array.isArray(j) && j.length > 0; }

  function tomeStats(t) {
    let total = 0; let done = 0;
    if (t.sectionsMapped) {
      for (const c of t.chapters) for (const s of c.sections) if (C.isTopSection(s.num)) { total++; if (C.sectionEntry(t.id, s.num)) done++; }
    } else {
      for (const c of t.chapters) if (c.num) { total++; if (C.sectionEntry(t.id, 'ch:' + c.num)) done++; }
    }
    return { total, done, unit: t.sectionsMapped ? 'sections' : 'chapters' };
  }

  function heroHtml() {
    const p = pack();
    const draft = p.status === 'draft' ? '<p class="lore-draft"><span class="badge badge-warn">Draft lore</span> Drafted by Claude in the page from the tomes you uploaded; not checked yet. ' + (window.CodexLores ? window.CodexLores.verifyButton() : '') + '</p>' : '';
    return '<section class="hero blk"><h1>' + esc(p.name || 'Codex') + '</h1>' + ORN + '<p class="lede">' + rich(p.tagline || '') .replace(/\?\?\?\?/g, '<span class="fogtxt">????</span>') + '</p>' + draft + '</section>';
  }
  function viewHome() {
    if (!hasJournal()) return viewCyclopedia();
    const counts = levelCounts();
    const integrated = C.all().filter((e) => e.integrated && isLearnable(e)).sort((a, b) => (a.integrated < b.integrated ? 1 : -1));
    const discovered = C.concepts().filter((e) => !e.integrated);
    let h = journalTabs('overview') + heroHtml() + barkHtml(null);

    h += '<div data-quest-slot="tracked">' + questSlot('tracked') + '</div>';
    if (window.CodexReview && (pack().journal || []).includes('review')) {
      const due = window.CodexReview.todayCount();
      h += '<section class="panel rv-teaser"><h2>Review</h2><p>' + (due ? due + ' question' + (due === 1 ? '' : 's') + ' ready today from your entry quizzes.' : 'Nothing due today. The next cards return on their day.') + '</p><a class="req' + (due ? '' : ' ghost') + '" href="#/review">' + (due ? 'Start today’s review' : 'Open Review') + '</a></section>';
    }
    if (C.tomes().length) {
      h += '<section class="panel"><h2>Expedition log</h2><div class="tomes">';
      for (const t of C.tomes()) {
        const s = tomeStats(t);
        const pct = s.total ? Math.max(s.done ? 2 : 0, Math.round((100 * s.done) / s.total)) : 0;
        h += '<a class="tomecard" href="#/tome/' + esc(t.id) + '"><span class="tc-short">' + esc(t.short) + '</span><span class="tc-title">' + esc(t.title) + '</span>' +
          '<span class="bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span><span class="tc-count">' + s.done + ' of ' + s.total + ' ' + s.unit + ' integrated' + (t.sectionsMapped ? '' : ' · sections not mapped yet') + '</span></a>';
      }
      h += '</div></section>';
    }

    h += '<section class="panel"><h2>Bestiary</h2><div class="levels">';
    for (let l = 4; l >= 1; l--) {
      h += '<a class="levelbox lvl-' + l + '" href="#/lexicon">' + pips(l) + '<span class="lb-n">' + counts[l] + '</span><span class="lb-name">' + esc(C.LEVELS[l].name) + '</span></a>';
    }
    h += '</div><p class="muted small">Discovered: seen, not integrated yet. Studied: integrated. Derived: every step of the derivation path ticked. Mastered: derived, and the quiz passed.</p></section>';

    if (window.CodexLibrary) h += window.CodexLibrary.teaserHtml();

    h += '<div class="cols2"><section class="panel"><h2>Recently integrated</h2><ul class="plain">';
    for (const e of integrated.slice(0, 8)) {
      h += '<li class="rowlink">' + medal(e, 'sm') + '<span class="rl-main"><a data-id="' + esc(e.id) + '" href="#/e/' + esc(e.id) + '">' + esc(e.name) + '</a><span class="muted">' + sourceLine(e) + ' · ' + esc(e.integrated) + '</span></span>' + levelBadge(e.id) + '</li>';
    }
    if (!integrated.length) h += '<li class="muted small">Nothing integrated yet. Open a sealed section of a tome and send its pages to Claude.</li>';
    h += '</ul></section>';
    h += '<section class="panel"><h2>Discovered, waiting</h2><p class="muted small">Seen in an integrated section, in your thesis or in our sessions. Open one and ask Claude to integrate it.</p><div class="chips">';
    for (const e of discovered) h += entryChip(e.id);
    if (!discovered.length) h += '<span class="muted small">No keywords waiting.</span>';
    h += '</div></section></div>';

    if (window.CodexCraft && window.CODEX_RECIPES) {
      const rs = window.CodexCraft.recipes ? window.CodexCraft.recipes() : window.CODEX_RECIPES.recipes;
      const ready = rs.filter((r) => window.CodexCraft.recipeReady(r)).length;
      const dishes = C.all().filter((e) => e.crafted && !e.crafted.prebuilt).length;
      h += '<section class="panel craft-teaser"><h2>Crafting table</h2><p>Mix entries from your bestiary into new pages. ' + ready + ' of ' + rs.length + ' known recipes are ready to craft; you have crafted ' + dishes + ' dish' + (dishes === 1 ? '' : 'es') + ' of your own.</p><a class="req" href="#/craft">Open the crafting table</a></section>';
    }
    const sug = SUGGESTED();
    if (sug.length) {
      h += '<section class="panel"><h2>Suggested next</h2><ul class="readnext">';
      for (const r of sug) h += readNextItem(r);
      h += '</ul></section>';
    }
    const how = pack().how || [];
    if (how.length) h += '<section class="panel how blk"><h2>How the codex grows</h2><ol>' + how.map((x) => '<li>' + x + '</li>').join('') + '</ol></section>';
    return h;
  }

  /* the Cyclopedia: the sibling of the Journal; its sections come from the lore */
  function viewCyclopedia() {
    const p = pack();
    const counts = levelCounts();
    const beasts = C.all().filter(isBeast);
    let h = (hasJournal() ? crumbs([{ href: '#/', label: 'Journal' }, { label: 'Cyclopedia' }]) : '') + (hasJournal() ? '' : heroHtml().replace('<h1>', '<p class="hero-name">').replace('</h1>', '</p>'));
    h += '<section class="blk"><h1>Cyclopedia</h1>' + ORN + '<p class="lede">Everything the ' + esc(p.short || p.name || 'codex') + ' lore knows, in @@N@@ sections. The index in the margin opens every entry.</p></section>' + barkHtml(null) + '<div class="cyc-grid">';
    for (const sec of sectionsOf()) {
      let body = ''; let href = '#/'; let n = 0; let name = sectionName(sec);
      if (sec === 'bestiary') {
        /* 3.0.4: the card, the Bestiary page and the Journal panel read one tally (bestiaryTally) */
        href = '#/lexicon'; const bt = bestiaryTally(); n = bt.n; const bl = bt.lv;
        body = '<div class="cyc-levels">' + [4, 3, 2, 1].map((l) => '<span>' + pips(l) + esc(C.LEVELS[l].name) + ' <b>' + bl[l] + '</b></span>').join('') + '</div><p class="small muted">Counts the families, ' + bt.crafted + ' crafted ' + (bt.crafted === 1 ? 'page' : 'pages') + ', ' + bt.sections + ' tome ' + (bt.sections === 1 ? 'section' : 'sections') + ' and ' + bt.companies + (bt.companies === 1 ? ' company' : ' companies') + '. ' + (FAMILIES().length ? FAMILIES().map((f) => esc(f.name)).join(' · ') : 'No families yet.') + '</p>';
      } else if (sec === 'figures') {
        href = '#/figures'; const figs = shownFigures(); n = figs.length;
        body = '<p class="small muted">' + (figs.length ? figs.filter((f) => !f.kin).map((f) => esc(f.name)).join(' · ') + (figs.some((f) => f.kin) ? ' · and the kin of the name' : '') : 'No figures yet.') + '</p>';
      } else if (sec === 'library') {
        if (!window.CodexLibrary) continue;
        const L = window.CodexLibrary.summary(); href = '#/library'; n = L.items; name = L.name;
        body = '<p class="small muted">' + esc(L.line) + '</p>';
      } else if (sec === 'literature') {
        href = '#/literature'; n = allLiterature().length;
        body = '<p class="small muted">Every reference in the codex, with the entry it belongs to.</p>';
      } else if (sec === 'crafted') {
        href = '#/lexicon'; const cr = C.all().filter((e) => e.crafted); n = cr.length;
        body = '<p class="small muted">' + cr.filter((e) => e.crafted.prebuilt).length + ' classic recipes · ' + cr.filter((e) => !e.crafted.prebuilt).length + ' of your own dishes.</p>';
      } else if (sec === 'tomes') {
        href = '#/tomes'; n = C.tomes().length;
        body = '<p class="small muted">' + (C.tomes().map((t) => esc(t.short)).join(' · ') || 'No tomes in this lore yet.') + '</p>';
      } else continue;
      h += '<a class="cyc-card" href="' + href + '"><span class="cyc-head"><span class="cyc-name">' + esc(name) + '</span><span class="cyc-n">' + n + '</span></span>' + body + '</a>';
    }
    h = h.replace('@@N@@', String((h.match(/class="cyc-card"/g) || []).length));
    h += '</div>';
    if (!hasJournal() && window.CodexCraft && window.CODEX_RECIPES) h += '<section class="panel craft-teaser"><h2>Crafting table</h2><p>Mix entries from the bestiary into new pages.</p><a class="req" href="#/craft">Open the crafting table</a></section>';
    return h;
  }

  /* 3.0.1: figures and places whose hall is still secret are not listed */
  const unseen = (e) => !!(window.CodexLibrary && window.CodexLibrary.hidden && window.CodexLibrary.hidden(e));
  const placeUnseen = (pl) => !!(pl && window.CodexLibrary && window.CodexLibrary.placeHidden && window.CodexLibrary.placeHidden(pl));
  const shownFigures = () => C.figures().filter((f) => !unseen(f));
  function viewFigures() {
    const figs = shownFigures();
    let h = crumbs([{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }, { label: 'Figures' }]);
    h += '<section class="blk"><h1>Figures</h1>' + ORN + '<p class="lede">' + (C.lore === 'resonance' ? 'The people the wings and the Altar are named for, and the kin of the name.' : 'The people this codex is built around.') + ' Their names are underlined wherever they appear; hover one for the short bio.</p></section>';
    const main = figs.filter((f) => !f.kin && !f.board); const kin = figs.filter((f) => f.kin); const board = figs.filter((f) => f.board).sort((a, b) => (a.seat || 99) - (b.seat || 99));
    if (main.length) h += '<section class="panel"><h2>Namesakes <span class="h2-n">' + main.length + '</span></h2><div class="cards">' + main.map(figureCard).join('') + '</div></section>';
    if (board.length) h += '<section class="panel"><h2>The board of the campaign <span class="h2-n">' + board.length + ' of 7 seats</span></h2><p class="fam-intro">The lenses of the Book of Iovu. They sit in Alexander’s chamber off the Araki Hall; each keeps a cell with a ledger. The codex never speaks as a living member: a cell carries the public record, and every verdict is the record’s reading.</p><div class="cards">' + board.map(figureCard).join('') + '</div></section>';
    if (kin.length) h += '<section class="panel"><h2>Kin of the name <span class="h2-n">' + kin.length + '</span></h2><p class="fam-intro">Everyone in or near the field whose surname sounds like the Altar’s: Kudr, Cud, Koud and the rest.</p><div class="cards">' + kin.map(figureCard).join('') + '</div></section>';
    if (!figs.length) h += '<p class="muted">No figures in this lore yet.</p>';
    return h;
  }
  function figureCard(e) {
    const pl = e.place && !placeUnseen(C.place(e.place)) ? C.place(e.place) : null;
    return '<a class="bcard fig" href="#/e/' + esc(e.id) + '">' + medal(e) + '<span class="bc-main"><span class="bc-kind">' + esc(e.board ? 'Member of the board' : e.kin ? 'Kin of the name' : 'Figure') + (e.years ? ' · ' + esc(e.years) : '') + '</span><span class="bc-name">' + esc(e.name) + '</span>' +
      '<span class="bc-teaser">' + rich(e.teaser || '') + '</span>' + (pl ? '<span class="bc-lvl">' + esc(pl.name) + '</span>' : '') + '</span></a>';
  }

  /* 3.0.5: a tome card shows the note whole up to 280 characters, then stops at a sentence end; a note that carries CHECK IN BOOK is never cut, because that is the part the reader needs */
  function tomeNote(n) {
    if (n.length <= 280 || /CHECK IN BOOK/.test(n)) return n;
    const cut = n.slice(0, 280); const dot = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
    return dot > 120 ? cut.slice(0, dot + 1) : cut.slice(0, 277).replace(/\s+\S*$/, '') + '…';
  }
  function viewTomes() {
    let h = crumbs([{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }, { label: 'Tomes' }]);
    h += '<section class="blk"><h1>Tomes</h1>' + ORN + '<p class="lede">The books the codex maps. Sections you have not integrated appear as <span class="fogtxt">????</span>.</p></section><div class="tomes big">';
    for (const t of C.tomes()) {
      const s = tomeStats(t);
      const pct = s.total ? Math.max(s.done ? 2 : 0, Math.round((100 * s.done) / s.total)) : 0;
      h += '<a class="tomecard" href="#/tome/' + t.id + '"><span class="tc-short">' + esc(t.short) + '</span><span class="tc-title">' + esc(t.title) + '</span><span class="tc-count">' + esc(t.authors) + ' · ' + esc(t.publisher) + '</span>' +
        '<span class="bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span><span class="tc-count">' + s.done + ' of ' + s.total + ' ' + s.unit + ' integrated</span>' + (t.notes && t.notes[0] ? '<span class="tc-note">' + esc(tomeNote(t.notes[0])) + '</span>' : '') + '</a>';
    }
    return h + '</div>';
  }

  function viewTome(tomeId, focusNum) {
    const t = C.tome(tomeId);
    if (!t) return viewMissing();
    const rv = reveal();
    let h = crumbs([{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/tomes', label: 'Tomes' }, { label: t.short }]);
    h += '<section class="blk"><h1>' + esc(t.title) + '</h1><p class="muted">' + [t.authors, t.publisher, t.pages].filter(Boolean).map(esc).join(' · ') + '</p>';
    for (const n of t.notes || []) h += '<p class="note">' + rich(n) + '</p>';
    h += '<label class="toggle"><input type="checkbox" id="reveal-toggle"' + (rv ? ' checked' : '') + '> Show the titles of unexplored sections</label></section>';
    h += '<div class="chapters">';
    for (const c of t.chapters) {
      const chKey = c.num ? 'ch:' + c.num : null;
      const chEntry = chKey ? C.sectionEntry(t.id, chKey) : null;
      const secs = c.sections || [];
      const nDone = secs.filter((s) => C.sectionEntry(t.id, s.num)).length + (chEntry ? 1 : 0);
      const open = focusNum && (focusNum === chKey || secs.some((s) => s.num === focusNum)) || (!focusNum && nDone > 0);
      h += '<details class="chapter"' + (open ? ' open' : '') + '><summary><span class="num">' + esc(c.num || '·') + '</span><span class="ch-title">' + esc(c.title) + '</span><span class="ch-meta">' + (c.pages ? 'pp. ' + esc(c.pages) : '') + (nDone ? ' · ' + nDone + ' integrated' : '') + '</span></summary>';
      if (chEntry) h += '<div class="sec sec-known"><a href="#/e/' + esc(chEntry) + '">Chapter entry</a> ' + levelBadge(chEntry) + '</div>';
      if (!secs.length) {
        h += '<div class="sec sec-fog' + (focusNum === chKey ? ' focus' : '') + '" data-sec="' + esc(chKey || '') + '"><span class="muted small">Sections not mapped yet. They appear here as you integrate them.</span>' + (chKey && !chEntry ? requestButton('section', t.id, chKey) : '') + '</div>';
      }
      for (const s of secs) {
        const id = C.sectionEntry(t.id, s.num);
        const depth = (s.num.match(/\./g) || []).length;
        const cls = 'sec depth-' + depth + (id ? ' sec-known' : ' sec-fog') + (focusNum === s.num ? ' focus' : '');
        const check = s.check ? '<span class="flag" title="' + esc('CHECK IN BOOK: ' + s.check) + '">CHECK IN BOOK</span>' : '';
        const lead = '<span class="lead" aria-hidden="true"></span>';
        if (id) {
          h += '<div class="' + cls + '" data-sec="' + esc(s.num) + '"><a class="secrow" data-id="' + esc(id) + '" href="#/e/' + esc(id) + '"><span class="num">' + esc(s.num) + '</span><span class="st">' + esc(s.title) + '</span>' + lead + '<span class="pg">' + esc(s.page) + '</span></a>' + levelBadge(id) + check + '</div>';
        } else {
          const title = rv ? '<span class="st st-dim">' + esc(s.title) + '</span>' : '<span class="st"><span class="fogtxt">????</span></span>';
          h += '<div class="' + cls + '" data-sec="' + esc(s.num) + '"><a class="secrow" href="#/tome/' + esc(t.id) + '/' + encodeURIComponent(s.num) + '"><span class="num">' + esc(s.num) + '</span>' + title + lead + '<span class="pg">' + esc(s.page) + '</span></a>' + (rv ? check : '') +
            (focusNum === s.num ? '<div class="sec-req"><span class="muted small">Not integrated yet. Add photos of these pages here, or send them in the chat.</span>' + requestButton('section', t.id, s.num) +
              (window.CodexInbox ? window.CodexInbox.slotHtml({ kind: 'section', tome: t.id, num: s.num, label: t.short + ' §' + s.num + (rv || id ? ' “' + s.title + '”' : '') + ' (p. ' + s.page + ')' }) : '') + '</div>' : '') + '</div>';
        }
      }
      h += '</details>';
    }
    h += '</div><p class="muted small src-links">Sources: ' + (t.sources || []).map((u, i) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + (i + 1) + '</a>').join(' ') + '</p>';
    return h;
  }

  function viewLexicon() {
    const counts = levelCounts();
    const gs = groups().filter((g) => g.section === 'bestiary' || g.section === 'crafted' || g.section === 'tomes');
    if (bstFilter.fam !== 'all' && !gs.some((g) => g.key === bstFilter.fam)) bstFilter.fam = 'all';
    let h = crumbs([{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }, { label: 'Bestiary' }]);
    h += barkHtml(null) + '<section class="blk"><h1>Bestiary</h1>' + ORN + '<p class="lede">Every concept and section in the codex, grouped by family, and the companies that sell what the field found. Knowledge grows as you integrate an entry, derive it on paper and pass its quiz.</p>' +
      '<p class="bst-sum">' + [4, 3, 2, 1].map((l) => '<span class="lvl">' + pips(l) + esc(C.LEVELS[l].name) + ' <b>' + counts[l] + '</b></span>').join('') + '</p></section>';
    h += '<div class="filters" role="group" aria-label="Show a family"><button class="fbtn' + (bstFilter.fam === 'all' ? ' on' : '') + '" data-bst-fam="all">All families</button>' +
      gs.map((g) => '<button class="fbtn' + (bstFilter.fam === g.key ? ' on' : '') + '" data-bst-fam="' + esc(g.key) + '">' + esc(g.name) + '</button>').join('') + '</div>';
    h += '<div class="filters" role="group" aria-label="Show a level">' + [['all', 'All levels'], ['known', 'Studied and above'], ['fog', 'Discovered only']].map((x) => '<button class="fbtn' + (bstFilter.lvl === x[0] ? ' on' : '') + '" data-bst-lvl="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
    let shown = 0; const shownIds = new Set();
    for (const g of gs) {
      if (bstFilter.fam !== 'all' && g.key !== bstFilter.fam) continue;
      const items = g.items.filter((e) => (bstFilter.fam !== 'all' || !shownIds.has(e.id)) && (bstFilter.lvl === 'all' || (bstFilter.lvl === 'known' ? C.level(e.id) >= 2 : C.level(e.id) < 2)));
      if (!items.length) continue;
      items.forEach((e) => shownIds.add(e.id));
      shown += items.length;
      h += '<section class="panel"><h2>' + esc(g.name) + ' <span class="h2-n">' + items.length + '</span></h2><p class="fam-intro">' + esc(g.hint) + '</p><div class="cards">';
      for (const e of items) h += e.kind === 'company' ? companyCard(e) : bcard(e);
      h += '</div></section>';
    }
    if (!shown) h += '<p class="muted">Nothing in this family at this level yet.</p>';
    return h;
  }
  function crewTitle(e) { const f = FAMILIES().find((x) => x.id === familyOf(e)); return (f && f.crew) || 'Founders'; }
  function companyCard(e) {
    return '<a class="bcard comp" href="#/e/' + esc(e.id) + '">' + medal(e) + '<span class="bc-main"><span class="bc-kind">' + esc(sourceLine(e)) + '</span><span class="bc-name">' + esc(e.name) + '</span>' +
      '<span class="bc-teaser">' + rich(e.teaser || '') + '</span><span class="bc-lvl">' + esc(crewTitle(e)) + ': ' + esc((e.crew || []).map((c) => c.name).join(', ') || 'CHECK') + '</span></span></a>';
  }

  function allLiterature() {
    const out = [];
    for (const e of C.all()) {
      if (!e.literature) continue;
      for (const slot of SLOT_ORDER) for (const r of e.literature[slot] || []) out.push({ r, slot, from: e.id });
    }
    /* 3.0.1: one paper is listed once, however many entries cite it (first listing wins; the field tag is the first one) */
    const seen = new Set(); const uniq = [];
    for (const x of out) {
      const key = String(x.r.doi || x.r.arxiv || x.r.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (key && seen.has(key)) continue;
      if (key) seen.add(key);
      uniq.push(x);
    }
    allLiterature.listings = out.length;
    return uniq;
  }
  const litFilter = { slot: 'all', field: 'all' };
  const bstFilter = { fam: 'all', lvl: 'all' };
  function viewLiterature() {
    const items = allLiterature();
    let h = crumbs([{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }, { label: 'Literature' }]);
    h += '<section class="blk"><h1>Literature</h1>' + ORN + '<p class="lede">Every reference in the codex, with the entry it belongs to. Counts are snapshots from the source named on each card.</p></section>';
    h += '<div class="filters" role="group" aria-label="Filter by slot">';
    for (const s of ['all'].concat(SLOT_ORDER)) h += '<button class="fbtn' + (litFilter.slot === s ? ' on' : '') + '" data-filter-slot="' + s + '">' + (s === 'all' ? 'All slots' : esc(SLOT[s])) + '</button>';
    h += '</div><div class="filters" role="group" aria-label="Filter by field">';
    for (const f of ['all', 'QO', 'QCI', 'general']) h += '<button class="fbtn' + (litFilter.field === f ? ' on' : '') + '" data-filter-field="' + f + '">' + (f === 'all' ? 'All fields' : f === 'QCI' ? 'Quantum computing and information' : esc(FIELD[f])) + '</button>';
    h += '</div><div class="litlist">';
    const shown = items.filter((x) => (litFilter.slot === 'all' || x.slot === litFilter.slot) &&
      (litFilter.field === 'all' || (litFilter.field === 'QCI' ? (x.r.field === 'QC' || x.r.field === 'QI') : x.r.field === litFilter.field)));
    for (const x of shown) h += litCard(x.r, x.slot, x.from);
    if (!shown.length) h += '<p class="muted">Nothing matches these filters.</p>';
    return h + '</div><p class="muted small">' + shown.length + ' of ' + items.length + ' distinct papers (' + (allLiterature.listings || items.length) + ' listings across the entries).</p>';
  }

  function requestButton(kind, a, b) {
    // kind 'entry' (a = entry id) or 'section' (a = tome id, b = section number)
    return '<button class="req" data-request="' + esc(kind) + '" data-a="' + esc(a) + '" data-b="' + esc(b || '') + '">Ask Claude to integrate</button>';
  }

  function gateHtml(e, which) {
    const l = C.level(e.id);
    if (which === 'deeper') {
      if (l >= 3) return '<ul class="prose-list">' + (e.deeper || []).map((d) => '<li class="blk">' + rich(d) + '</li>').join('') + '</ul>';
      return '<div class="fogcard"><span class="fogtxt big">????</span><span>Tick every step of the derivation path to reveal this.</span></div>';
    }
    if (l >= 4) return '<ul class="prose-list">' + (e.mastery || []).map((d) => '<li class="blk">' + rich(d) + '</li>').join('') + '</ul>';
    return '<div class="fogcard"><span class="fogtxt big">????</span><span>Reach Mastered (every step ticked and the quiz passed) to reveal this.</span></div>';
  }

  function seeded(str) { // small deterministic PRNG for a stable option order
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  window.CodexShuffle = (n, key) => shuffled(n, key);
  function shuffled(n, key) {
    const idx = Array.from({ length: n }, (_, i) => i);
    const rnd = seeded(key);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }

  function quizHtml(e) {
    if (!e.quiz.length) return '';
    const p = Store.entry(e.id);
    let h = '<section class="panel quiz" id="quiz-' + esc(e.id) + '"><h2>Mastery quiz</h2><p class="muted small">Pass mark ' + Math.round(C.PASS_MARK * 100) + '%. <span data-quiz-best="' + esc(e.id) + '">' + quizBestText(p) + '</span></p><form data-quiz="' + esc(e.id) + '">';
    e.quiz.forEach((q, qi) => {
      const order = shuffled(q.options.length, e.id + ':' + qi);
      h += '<fieldset class="q" data-qi="' + qi + '"><legend><span class="qn">' + (qi + 1) + '.</span> ' + rich(q.q) + '</legend>';
      order.forEach((oi) => {
        const id = 'q-' + e.id + '-' + qi + '-' + oi;
        h += '<label class="opt" for="' + id + '"><input type="radio" name="q-' + esc(e.id) + '-' + qi + '" id="' + id + '" value="' + oi + '"><span>' + rich(q.options[oi]) + '</span></label>';
      });
      h += '<div class="why" hidden>' + rich(q.why || '') + '</div></fieldset>';
    });
    h += '<div class="quiz-actions"><button type="submit" class="btn">Check answers</button><button type="button" class="btn ghost" data-quiz-reset="' + esc(e.id) + '">Clear</button><span class="quiz-result" role="status"></span></div></form></section>';
    return h;
  }
  function quizBestText(p) {
    if (p.quizBest == null) return 'Not attempted yet.';
    return 'Best score ' + Math.round(p.quizBest * 100) + '%' + (p.quizPassed ? ' · passed' + (p.quizPassedAt ? ' on ' + p.quizPassedAt : '') : '') + '.';
  }

  /* a figure's plate: portrait medallion, years, bio, works, the place named for them */
  function viewFigure(e) {
    const pl = e.place && !placeUnseen(C.place(e.place)) ? C.place(e.place) : null;
    const toc = [];
    const panel = (key, label, title, body, cls) => { toc.push({ key, label }); return '<section class="panel' + (cls ? ' ' + cls : '') + '" id="s-' + key + '"><h2>' + title + '</h2>' + body + '</section>'; };
    let main = '<header class="entry-head ornate blk fig-head" data-anchor="head">' + medal(e) +
      '<div class="plate-id"><div class="kind">' + sourceLine(e) + '</div><h1>' + esc(e.name) + '</h1>' + (e.role ? '<p class="subtitle">' + esc(e.role) + '</p>' : '') + '<p class="lede">' + rich(e.teaser || '') + '</p></div>' +
      '<div class="plate-k"><div class="head-meta">' + (pl ? '<a class="chip chip-known" href="#/library/' + esc(pl.id) + '"><span>' + esc(pl.name) + '</span></a>' : '') + (window.CodexLamp ? window.CodexLamp.figureLine(e) : '') + (e.years ? '<span class="muted">' + esc(e.years) + '</span>' : '') + '</div></div></header>';
    if (e.bio && e.bio.length) main += panel('bio', 'Life and work', 'Life and work', e.bio.map((x) => '<p>' + rich(x) + '</p>').join(''), 'prose');
    if (e.why) main += panel('why', 'In this codex', 'In this codex', '<p>' + rich(e.why) + '</p>', 'prose research');
    const ownerView = !!(window.CodexLibrary && window.CodexLibrary.owner && window.CodexLibrary.owner());
    if (e.lens && window.CodexCounsel && (!e.ownerOnly || ownerView)) { toc.push({ key: 'lens', label: 'The lens' }); main += window.CodexCounsel.lensPanel(e, false); }
    if (e.books && e.books.length) { toc.push({ key: 'books', label: 'Must reads' }); main += mustReadsHtml(e); }
    if (e.works && e.works.length) main += panel('works', 'Works', 'Works', '<ul class="readnext">' + e.works.map((w) => '<li class="blk"><span class="rn"><span class="rn-num">' + esc(w.year || '') + '</span><span class="rn-title">' + esc(w.title) + '</span></span><span class="rn-why">' + esc(w.venue || '') + (w.note ? ' · ' + rich(w.note) : '') + '</span></li>').join('') + '</ul>', 'prose');
    if (e.kinOf && e.kinOf.length) {
      const kin = e.kinOf.map((k) => C.get(k)).filter((k) => k && !unseen(k));
      if (kin.length) main += panel('kin', 'Kin of the name', 'Kin of the name <span class="h2-n">' + kin.length + '</span>', '<p class="fam-intro">Everyone in or near the field whose surname sounds like this one. Hover a name for the short bio.</p><div class="cards">' + kin.map(figureCard).join('') + '</div>');
    }
    if (e.links && e.links.length) main += panel('links', 'Sources', 'Sources', '<ul class="prose-list">' + e.links.map((x) => '<li class="blk"><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.text) + '</a></li>').join('') + '</ul>', 'prose');
    let side = '';
    if (toc.length > 2) side += '<section class="panel side-toc"><h2>On this page</h2><ul class="toc">' + toc.map((t) => '<li><button type="button" data-jump="s-' + t.key + '">' + esc(t.label) + '</button></li>').join('') + '</ul></section>';
    if (e.related && e.related.length) side += '<section class="panel"><h2>Related</h2><div class="chips">' + e.related.filter((r) => C.get(r)).map(entryChip).join('') + '</div></section>';
    const figs = shownFigures();
    const i = figs.findIndex((x) => x.id === e.id);
    if (figs.length > 1) {
      const prev = figs[i - 1]; const next = figs[i + 1];
      main += '<nav class="pn" aria-label="Figures">' + (prev ? '<a class="prev" href="#/e/' + esc(prev.id) + '"><span class="pn-dir">‹ Previous · Figures</span><span class="pn-name">' + esc(prev.name) + '</span></a>' : '') + (next ? '<a class="next" href="#/e/' + esc(next.id) + '"><span class="pn-dir">Figures · Next ›</span><span class="pn-name">' + esc(next.name) + '</span></a>' : '') + '</nav>';
    }
    const trail = [{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }, { href: '#/figures', label: 'Figures' }, { label: e.name }];
    return crumbs(trail) + '<div class="entry"><div class="entry-main">' + main + '</div><aside class="entry-side">' + side + '</aside></div>';
  }
  /* must reads: the books a figure wrote; a tome-backed book shows the tome's chapters and what is integrated, the others list their chapters as hoverable entries */
  function mustReadsHtml(f, open) {
    const books = (f && f.books) || [];
    if (!books.length) return '';
    let h = '<section class="panel must-reads" id="s-books"><h2>Must reads <span class="h2-n">' + books.length + '</span></h2><p class="fam-intro">Open a book for its chapters; hover a chapter for what it says and which entries of the bestiary it can illuminate.</p>';
    books.forEach((b, i) => {
      const t = b.tome ? C.tome(b.tome) : null;
      const title = t ? t.title : b.title;
      const meta = [b.with ? 'with ' + b.with : '', b.year ? String(b.year) : '', t ? t.publisher : (b.publisher || '')].filter(Boolean).join(' · ');
      const n = t ? t.chapters.length : (b.chapters || []).length;
      h += '<details class="book-entry"' + (open || (i === 0 && books.length === 1) ? ' open' : '') + '><summary><div class="book-sum"><span class="doc-icon" aria-hidden="true"><span>' + (t ? '§' : b.review ? '≡' : '¶') + '</span></span><span class="book-main"><span class="bc-kind">' + (t ? 'Tome of this codex' : b.review ? 'Review' : 'Book') + (meta ? ' · ' + esc(meta) : '') + '</span><span class="book-title">' + esc(title) + '</span>' + (b.why ? '<span class="book-by">' + esc(b.why) + '</span>' : '') + '<span class="book-value">' + (n ? n + ' chapter' + (n === 1 ? '' : 's') + (b.check ? ' · ' + esc(b.check) : '') : esc(b.check || 'no chapter list yet')) + '</span></span></div></summary>';
      if (t) {
        h += '<ol class="chapters-list">';
        for (const c of t.chapters) {
          const secs = (c.sections || []).filter((s) => C.isTopSection(s.num));
          const done = secs.filter((s) => C.sectionEntry(t.id, s.num)).length;
          const first = secs[0];
          const href = first ? '#/tome/' + esc(t.id) + '/' + encodeURIComponent(first.num) : '#/tome/' + esc(t.id);
          h += '<li class="blk"><a class="ch-row" href="' + href + '"><span class="ch-num">' + esc(c.num || '·') + '</span><span class="ch-title">' + esc(c.title) + '</span><span class="ch-lights">' + (secs.length ? done + ' of ' + secs.length + ' sections integrated' : (C.sectionEntry(t.id, 'ch:' + c.num) ? 'integrated' : 'sealed')) + '</span></a></li>';
        }
        h += '</ol><p class="muted small">The whole map is under <a href="#/tome/' + esc(t.id) + '">Tomes</a>.</p>';
      } else if ((b.chapters || []).length) {
        h += '<ol class="chapters-list">';
        for (const c of b.chapters) {
          const id = 'ch-' + b.id + '-' + String(c.num).toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const lights = (c.lights || []).filter((x) => C.get(x));
          const lit = lights.filter((x) => C.level(x) >= 2).length;
          h += '<li class="blk"><a class="ch-row" data-id="' + esc(id) + '" href="#/e/' + esc(id) + '"><span class="ch-num">' + esc(c.num) + '</span><span class="ch-title">' + esc(c.title) + '</span><span class="ch-lights">' + (lights.length ? 'illuminates ' + lights.length + ' · ' + lit + ' studied' : 'nothing in the bestiary yet') + '</span></a></li>';
        }
        h += '</ol>';
      } else h += '<p class="muted small chapters-empty">No chapter list recorded yet; ask Claude to add it.</p>';
      h += '</details>';
    });
    return h + '</section>';
  }
  /* a chapter's plate */
  function viewChapter(e) {
    const f = C.get(e.figure);
    const book = f && (f.books || []).find((b) => b.id === e.book);
    const lights = (e.lights || []).filter((x) => C.get(x));
    const sib = C.all().filter((x) => x.kind === 'chapter' && x.book === e.book);
    const i = sib.findIndex((x) => x.id === e.id);
    let main = '<header class="entry-head ornate blk" data-anchor="head">' + medal(e) + '<div class="plate-id"><div class="kind">' + sourceLine(e) + '</div><h1>' + esc(e.title) + '</h1>' + (f ? '<p class="subtitle">By ' + esc(f.name) + (book && book.with ? ', with ' + esc(book.with) : '') + (book && book.year ? ' (' + esc(book.year) + ')' : '') + '</p>' : '') + '<p class="lede">' + rich(e.blurb || '') + '</p></div></header>';
    main += '<section class="panel prose"><h2>Illuminates</h2>' + (lights.length ? '<p class="small muted">Entries of the bestiary this chapter can lift, with their present level:</p><div class="chips">' + lights.map(entryChip).join('') + '</div>' : '<p class="muted">Nothing in the bestiary yet.</p>') + '</section>';
    if (sib.length > 1) main += '<nav class="pn" aria-label="Chapters">' + (sib[i - 1] ? '<a class="prev" href="#/e/' + esc(sib[i - 1].id) + '"><span class="pn-dir">‹ Previous chapter</span><span class="pn-name">' + esc(sib[i - 1].title) + '</span></a>' : '') + (sib[i + 1] ? '<a class="next" href="#/e/' + esc(sib[i + 1].id) + '"><span class="pn-dir">Next chapter ›</span><span class="pn-name">' + esc(sib[i + 1].title) + '</span></a>' : '') + '</nav>';
    let side = '';
    if (f) side += '<section class="panel"><h2>The book</h2><p class="small">' + esc(e.bookTitle || '') + '</p><a class="req ghost" href="#/e/' + esc(f.id) + '">' + esc(f.name) + '’s must reads</a></section>';
    const trail = [{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/cyclopedia', label: 'Cyclopedia' }, { href: '#/figures', label: 'Figures' }];
    if (f) trail.push({ href: '#/e/' + esc(f.id), label: f.name });
    trail.push({ label: 'Chapter ' + e.chapter });
    return crumbs(trail) + '<div class="entry"><div class="entry-main">' + main + '</div><aside class="entry-side">' + side + '</aside></div>';
  }
  /* a company's plate: the ship, its captains and what it sells */
  function viewCompany(e) {
    const toc = [];
    const panel = (key, label, title, body, cls) => { toc.push({ key, label }); return '<section class="panel' + (cls ? ' ' + cls : '') + '" id="s-' + key + '"><h2>' + title + '</h2>' + body + '</section>'; };
    const stats = [];
    if (e.founded) stats.push(['Founded', esc(e.founded)]);
    if (e.hq) stats.push(['Harbour', esc(e.hq)]);
    if (e.origin) stats.push(['Out of', esc(e.origin)]);
    if (e.sells) stats.push(['Sells', esc(e.sells)]);
    let main = '<header class="entry-head ornate blk" data-anchor="head">' + medal(e) +
      '<div class="plate-id"><div class="kind">' + sourceLine(e) + '</div><h1>' + esc(e.name) + '</h1><p class="lede">' + rich(e.teaser || '') + '</p></div>' +
      '<div class="plate-k"><div class="head-meta">' + (e.techs || []).map((t) => '<span class="tag">' + esc(t) + '</span>').join('') + '</div></div>' +
      (stats.length ? '<dl class="plate-stats">' + stats.map((s) => '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>').join('') + '</dl>' : '') + '</header>';
    if (e.overview && e.overview.length) main += panel('overview', 'Overview', 'Overview', e.overview.map((x) => '<p>' + rich(x) + '</p>').join(''), 'prose');
    if (e.crew && e.crew.length) main += panel('crew', crewTitle(e), esc(crewTitle(e)), '<ul class="crew">' + e.crew.map((c) => '<li class="blk"><span class="crew-name">' + (c.figure && C.get(c.figure) ? '<a data-id="' + esc(c.figure) + '" href="#/e/' + esc(c.figure) + '">' + esc(c.name) + '</a>' : esc(c.name)) + '</span>' + (c.role ? '<span class="crew-role">' + esc(c.role) + '</span>' : '') + (c.bio ? '<span class="crew-bio">' + rich(c.bio) + '</span>' : '') + '</li>').join('') + '</ul>', 'prose');
    if (e.milestones && e.milestones.length) main += panel('log', 'Ship’s log', 'Ship’s log', '<ul class="readnext">' + e.milestones.map((m) => '<li class="blk"><span class="rn"><span class="rn-num">' + esc(m.year) + '</span><span class="rn-title">' + rich(m.text) + '</span></span></li>').join('') + '</ul>', 'prose');
    if (e.found && e.found.length) main += panel('found', 'Where it appears', 'Where it appears', '<ul class="found">' + e.found.map(foundItem).join('') + '</ul>', 'prose');
    if (e.links && e.links.length) main += panel('links', 'Sources', 'Sources <span class="tag tag-unverified">to verify</span>', '<ul class="prose-list">' + e.links.map((x) => '<li class="blk"><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.text) + '</a></li>').join('') + '</ul>', 'prose');
    let side = '';
    if (toc.length > 2) side += '<section class="panel side-toc"><h2>On this page</h2><ul class="toc">' + toc.map((t) => '<li><button type="button" data-jump="s-' + t.key + '">' + esc(t.label) + '</button></li>').join('') + '</ul></section>';
    if (e.related && e.related.length) side += '<section class="panel"><h2>Related</h2><div class="chips">' + e.related.filter((r) => C.get(r)).map(entryChip).join('') + '</div></section>';
    side += '<section class="panel"><h2>Crafting</h2><p class="small">Use this company as an ingredient.</p><a class="req ghost" href="#/craft/with/' + esc(e.id) + '">Take to the crafting table</a></section>';
    const g = groupOf(e.id);
    const trail = [{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { href: '#/lexicon', label: 'Bestiary' }];
    if (g) trail.push({ label: g.name });
    trail.push({ label: e.name });
    return crumbs(trail) + '<div class="entry"><div class="entry-main">' + main + '</div><aside class="entry-side">' + side + '</aside></div>';
  }

  function viewEntry(id) {
    const e = C.get(id);
    if (!e || unseen(e)) return viewMissing(); /* 3.0.4: a hidden monk does not open by URL either */
    if (e.kind === 'figure') return viewFigure(e);
    if (e.kind === 'company') return viewCompany(e);
    if (e.kind === 'chapter') return viewChapter(e);
    if (e.kind === 'place') { setTimeout(() => { location.replace('#/library/' + encodeURIComponent(e.place)); }, 0); return '<p class="muted">Opening the library…</p>'; }
    const l = C.level(id);
    const p = Store.entry(id);
    const g = groupOf(id);
    const toc = [];
    const panel = (key, label, title, body, cls, attrs) => {
      toc.push({ key, label });
      return '<section class="panel' + (cls ? ' ' + cls : '') + '" id="s-' + key + '"' + (attrs || '') + '><h2>' + title + '</h2>' + body + '</section>';
    };

    /* the plate: medallion, name, knowledge, key formula and the stat block */
    const fam = e.kind === 'section' || e.crafted || !g ? '' : ' · ' + esc(g.name);
    const firstSeen = (e.found || [])[0];
    const stats = [];
    if (firstSeen) stats.push(['First seen', foundShort(firstSeen)]);
    if (e.integrated) stats.push([e.crafted ? 'Crafted' : 'Integrated', esc(e.integrated)]);
    if (e.integrated && e.steps.length) stats.push(['Derivation', '<span data-steps-for="' + esc(id) + '">' + C.stepsDone(id) + ' of ' + e.steps.length + ' done</span>']);
    if (e.integrated && e.quiz.length) stats.push(['Quiz', '<span data-quiz-best="' + esc(id) + '">' + quizBestText(p) + '</span>']);
    const nLit = e.literature ? SLOT_ORDER.reduce((s, k) => s + (e.literature[k] || []).length, 0) : 0;
    if (nLit) stats.push(['Literature', nLit + ' reference' + (nLit === 1 ? '' : 's')]);
    if (!e.integrated) stats.push(['Status', 'Not integrated yet']);
    let main = '<header class="entry-head ornate blk" data-anchor="head">' + medal(e) +
      '<div class="plate-id"><div class="kind">' + sourceLine(e) + fam + '</div><h1>' + esc(e.name) + '</h1>' +
      (e.fullTitle && e.fullTitle !== e.name ? '<p class="subtitle">' + esc(e.fullTitle) + '</p>' : '') +
      '<p class="lede">' + rich(e.teaser || '') + '</p></div>' +
      '<div class="plate-k">' + (e.integrated ? kbarHtml(id) : '') + '<div class="head-meta">' + levelBadge(id) + '</div><p class="plate-next" data-next-for="' + esc(id) + '">' + esc(nextGoal(id)) + '</p></div>' +
      (e.integrated && e.tip && e.tip.tex ? '<div class="plate-sig"><span class="lbl">Key formula</span>' + texBlock(e.tip.tex) + (e.tip.ref ? '<span class="ref nolink">' + esc(e.tip.ref) + '</span>' : '') + '</div>' : '') +
      (stats.length ? '<dl class="plate-stats">' + stats.map((s) => '<div><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>').join('') + '</dl>' : '') +
      '</header>';
    if (e.crafted) main += craftedBanner(e);
    const wares = waresHtml(id);
    if (wares) { toc.push({ key: 'wares', label: 'Wares with this ingredient' }); main += wares; }

    if (!e.integrated) {
      main += panel('found', 'Discovered', 'Discovered', '<ul class="found">' + (e.found || []).map(foundItem).join('') + '</ul>');
      for (const title of ['Overview', 'Derivation path', 'In your research', 'Literature']) {
        main += '<section class="panel"><h2>' + title + '</h2><div class="fogcard"><span class="fogtxt big">????</span><span>Not integrated yet.</span></div></section>';
      }
      main += panel('request', 'Integrate it', 'Integrate it', '<p>Integration writes this entry in full: a plain-words explanation with page references, the derivation path, the link to your thesis, the literature slots and a quiz.</p>' + requestButton('entry', e.id) +
        (window.CodexInbox ? window.CodexInbox.slotHtml({ kind: 'entry', id: e.id, label: 'the keyword “' + e.name + '” (codex id ' + e.id + ')' }) : '<p class="muted small">If you are reading a section that covers it, send Claude photos of those pages in the chat.</p>'), 'blk', ' data-anchor="request"');
    } else {
      main += panel('overview', 'Overview', 'Overview', (e.overview || []).map((x) => '<p>' + rich(x) + '</p>').join(''), 'prose');
      if (window.CodexPlates && window.CodexPlates.has(id)) {
        for (const kind of window.CodexPlates.kinds(id)) {
          main += panel('plate-' + kind, 'Live plate: ' + window.CodexPlates.title(kind), 'Live plate <span class="h2-n">' + esc(window.CodexPlates.title(kind)) + '</span>', '<div class="plate-mount" data-plate="' + esc(kind) + '" data-entry="' + esc(id) + '"></div>', 'plate-live');
        }
      }
      if (e.textbook && e.textbook.length) main += panel('textbook', 'Textbook derivation', 'Textbook derivation', '<p class="muted small">Where the books derive it. A section number that is not confirmed carries CHECK IN BOOK.</p><ul class="readnext">' + e.textbook.map(textbookItem).join('') + '</ul>', 'prose');
      if (e.kind === 'section' && e.pages && e.pages.length) {
        main += panel('pages', 'Page by page', 'Page by page', '<ol class="pages">' + e.pages.map((x) => '<li class="blk"><span class="pchip">p. ' + esc(x.page) + '</span>' + rich(x.text) + '</li>').join('') + '</ol>', 'prose');
      }
      if (e.found && e.found.length) main += panel('found', 'Where it appears', 'Where it appears', '<ul class="found">' + e.found.map(foundItem).join('') + '</ul>', 'prose');
      if (e.conventions && e.conventions.length) main += panel('conventions', 'Conventions', 'Conventions', '<ul class="prose-list">' + e.conventions.map((x) => '<li class="blk">' + rich(x) + '</li>').join('') + '</ul>', 'prose');
      if (e.equations && e.equations.length) {
        main += panel('equations', 'Key equations', 'Key equations', '<div class="eqs">' + e.equations.map((q) => '<figure class="eq blk">' + texBlock(q.tex) + '<figcaption><span class="ref nolink">' + esc(q.ref || '') + '</span>' + (q.note ? ' <span class="eqnote">' + rich(q.note) + '</span>' : '') + '</figcaption></figure>').join('') + '</div>');
      }
      if (e.steps.length) {
        const done = C.stepsDone(id);
        let st = '<p class="muted small">Tick a step once you have done it on paper.</p><ol class="steps">';
        e.steps.forEach((s, i) => {
          const sid = 'step-' + id + '-' + i;
          st += '<li class="blk"><input type="checkbox" id="' + sid + '" data-step="' + esc(id) + '" data-i="' + i + '"' + (p.steps && p.steps[i] ? ' checked' : '') + (Store.canWrite() ? '' : ' disabled') + '><label for="' + sid + '">' + rich(s.text) + (s.ref ? ' <span class="ref">' + esc(s.ref) + '</span>' : '') + '</label></li>';
        });
        main += panel('steps', 'Derivation path', 'Derivation path <span data-steps-for="' + esc(id) + '">' + done + ' of ' + e.steps.length + ' done</span>', st + '</ol>', 'prose');
      }
      if (e.research && e.research.length) main += panel('research', 'In your research', 'In your research', '<ul class="prose-list">' + e.research.map((x) => '<li class="blk">' + rich(x) + '</li>').join('') + '</ul>', 'prose research');
      if (e.flags && e.flags.length) main += panel('flags', 'CHECK IN BOOK', 'CHECK IN BOOK', '<ul class="prose-list">' + e.flags.map((f) => '<li class="blk"><span class="flag">' + esc(f.ref) + '</span> ' + rich(f.text) + '</li>').join('') + '</ul>', 'prose flags');
      if (e.facts && e.facts.length) main += panel('facts', 'Verified facts', 'Verified facts from the recipe', '<ul class="prose-list">' + e.facts.map((f) => '<li class="blk">' + esc(f.text) + (f.url ? ' <a href="' + esc(f.url) + '" target="_blank" rel="noopener">source</a>' : '') + '</li>').join('') + '</ul>', 'prose');
      if ((e.techs && e.techs.length) || (e.startups && e.startups.length)) {
        main += panel('uses', 'Who uses it', 'Who uses it <span class="tag tag-unverified">to verify</span>',
          (e.techs && e.techs.length ? '<h3>Techs</h3><ul class="prose-list">' + e.techs.map((x) => '<li class="blk">' + esc(x) + '</li>').join('') + '</ul>' : '') +
          (e.startups && e.startups.length ? '<h3>Start-ups</h3><ul class="prose-list">' + e.startups.map((x) => '<li class="blk"><b>' + esc(x.name) + '</b>' + (x.what ? ': ' + esc(x.what) : '') + '</li>').join('') + '</ul>' : ''), 'prose');
      }
      if (e.literature) {
        let lit = '';
        for (const slot of SLOT_ORDER) {
          const rs = e.literature[slot] || [];
          if (rs.length) lit += '<h3>' + esc(SLOT[slot]) + '</h3>' + rs.map((r) => litCard(r, slot)).join('');
        }
        if (lit) main += panel('literature', 'Literature', 'Literature', lit);
      }
      if ((e.deeper || []).length) main += panel('deeper', 'Deeper', 'Deeper', '<div data-gate="deeper" data-id="' + esc(id) + '" data-open="' + (l >= 3 ? 1 : 0) + '">' + gateHtml(e, 'deeper') + '</div>', 'prose');
      if ((e.mastery || []).length) main += panel('mastery', 'Mastery notes', 'Mastery notes', '<div data-gate="mastery" data-id="' + esc(id) + '" data-open="' + (l >= 4 ? 1 : 0) + '">' + gateHtml(e, 'mastery') + '</div>', 'prose');
      if (e.quiz.length) { toc.push({ key: 'quiz', label: 'Mastery quiz' }); main += quizHtml(e); }
    }

    /* previous and next in the same family, like turning the page */
    if (g && g.items.length > 1) {
      const i = g.items.findIndex((x) => x.id === id);
      const prev = g.items[i - 1]; const next = g.items[i + 1];
      main += '<nav class="pn" aria-label="' + esc(g.name) + '">' +
        (prev ? '<a class="prev" href="#/e/' + esc(prev.id) + '"><span class="pn-dir">‹ Previous · ' + esc(g.name) + '</span><span class="pn-name">' + esc(prev.name) + '</span></a>' : '') +
        (next ? '<a class="next" href="#/e/' + esc(next.id) + '"><span class="pn-dir">' + esc(g.name) + ' · Next ›</span><span class="pn-name">' + esc(next.name) + '</span></a>' : '') + '</nav>';
    }

    let side = '';
    if (toc.length > 2) side += '<section class="panel side-toc"><h2>On this page</h2><ul class="toc">' + toc.map((t) => '<li><button type="button" data-jump="' + (t.key === 'quiz' ? 'quiz-' + esc(id) : 's-' + t.key) + '">' + esc(t.label) + '</button></li>').join('') + '</ul></section>';
    side += '<div data-quest-slot="entry:' + esc(id) + '">' + questSlot('entry:' + id) + '</div>';
    if (e.readNext && e.readNext.length) side += '<section class="panel"><h2>Read next</h2><ul class="readnext">' + e.readNext.map(readNextItem).join('') + '</ul></section>';
    if (e.related && e.related.length) side += '<section class="panel"><h2>Related</h2><div class="chips">' + e.related.filter((r) => C.get(r)).map(entryChip).join('') + '</div></section>';
    side += '<section class="panel"><h2>Crafting</h2><p class="small">Use this entry as an ingredient.</p><a class="req ghost" href="#/craft/with/' + esc(id) + '">Take to the crafting table</a></section>';
    if (e.integrated) side += '<section class="panel blk" data-anchor="ask"><h2>Questions</h2><p class="small">Leave a question on this entry; it opens the comment box here.</p><button class="req ghost" data-ask="' + esc(id) + '">Ask a question</button></section>';

    const trail = [{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }];
    if (e.kind === 'section' && e.source) {
      const t = C.tome(e.source.tome);
      trail.push({ href: '#/tomes', label: 'Tomes' }, { href: '#/tome/' + encodeURIComponent(e.source.tome), label: t ? t.short : e.source.tome });
    } else {
      trail.push({ href: '#/lexicon', label: 'Bestiary' });
      if (g) trail.push({ label: g.name });
    }
    trail.push({ label: e.name });
    if (e.crafted) store('read:' + id, '1');
    return crumbs(trail) + barkHtml(id) + '<div class="entry"><div class="entry-main">' + main + '</div><aside class="entry-side">' + side + '</aside></div>';
  }

  /* the merchant's notice on an entry: every recipe and crafted page this entry is an ingredient of, with what to do about each */
  const wasRead = (id) => store('read:' + id) === '1';
  /* every recipe and crafted page, or only those with one ingredient; each with what to do about it */
  function wares(id) {
    const CC = window.CodexCraft; const BOOK = window.CODEX_RECIPES;
    if (!CC || !BOOK) return [];
    const cats = Object.fromEntries((BOOK.categories || []).map((c) => [c.id, c.name]));
    const items = [];
    for (const r of (CC.recipes ? CC.recipes() : BOOK.recipes)) {
      if (id && !r.requires.some((q) => q.id === id)) continue;
      const ready = CC.recipeReady(r);
      const made = r.yields && C.get(r.yields);
      const dish = C.all().find((x) => x.crafted && !x.crafted.prebuilt && x.crafted.recipe === r.id);
      const page = made ? r.yields : dish ? dish.id : null;
      const read = page ? wasRead(page) : false;
      const others = r.requires.filter((q) => q.id !== id && C.get(q.id)).map((q) => C.get(q.id).name);
      const missing = r.requires.filter((q) => C.get(q.id) && C.level(q.id) < q.min).map((q) => C.get(q.id).name + ' at ' + C.LEVELS[q.min].name);
      let status; let href; let verb; let rank;
      if (made) { status = read ? 'classic recipe · read' : 'classic recipe · pre-built page, unread'; href = '#/e/' + r.yields; verb = read ? 'Read again' : 'Read it'; rank = read ? 3 : 0; }
      else if (dish) { status = (dish.verified ? 'crafted · forged' : 'crafted · draft, not forged yet') + (read ? ' · read' : ' · unread'); href = '#/e/' + dish.id; verb = read ? 'Read again' : 'Read it'; rank = read ? 3 : 0; }
      else if (ready) { status = 'ready to craft'; href = '#/craft/r/' + r.id; verb = 'Craft it'; rank = 1; }
      else { status = 'locked · needs ' + missing.join(', '); href = '#/craft/r/' + r.id; verb = 'See the recipe'; rank = 2; }
      items.push({ id: r.id, name: r.name, cat: cats[r.cat] || r.cat, others, status, href, verb, flavor: r.flavor || '', locked: !ready && !made && !dish, done: !!page, read, rank });
    }
    for (const x of C.all()) {
      if (!x.crafted || !x.crafted.ingredients) continue;
      if (id && !x.crafted.ingredients.includes(id)) continue;
      if (items.some((i) => i.href === '#/e/' + x.id)) continue;
      const read = wasRead(x.id);
      items.push({ id: x.id, name: x.name, cat: x.crafted.prebuilt ? 'Classic crafts' : 'Your dishes', others: x.crafted.ingredients.filter((i) => i !== id && C.get(i)).map((i) => C.get(i).name), status: (x.verified ? 'crafted · forged' : 'crafted · draft') + (read ? ' · read' : ' · unread'), href: '#/e/' + x.id, verb: read ? 'Read again' : 'Read it', flavor: x.teaser || '', locked: false, done: true, read, rank: read ? 3 : 0 });
    }
    return items;
  }
  function waresHtml(id) {
    const items = wares(id);
    if (!items.length) return '';
    // a card; tag = the counter label ("Created ware" / "Recommended crafting"), ad = the recipe advert look
    const card = (w, tag, ad) => '<a class="ware' + (w.locked ? ' locked' : '') + (w.done ? ' done' : '') + (ad ? ' ad' : '') + '" href="' + esc(w.href) + '"><span class="ware-cat">' + (tag ? '<b class="ware-tag">' + esc(tag) + '</b> · ' : '') + esc(w.cat) + '</span><span class="ware-name">' + esc(w.name) + '</span>' +
      (w.others.length ? '<span class="ware-with">with ' + esc(w.others.join(' + ')) + '</span>' : '') + (ad && w.flavor ? '<span class="ware-flavor">' + esc(w.flavor) + '</span>' : '') +
      '<span class="ware-status">' + esc(w.status) + '</span><span class="ware-verb">' + esc(w.verb) + ' ›</span></a>';
    // on the counter: one created ware (a crafted page, unread before read) and one recommended crafting (a recipe not yet crafted, ready before locked); the rest of the stock behind a toggle
    items.sort((a, b) => a.rank - b.rank);
    const created = items.find((w) => w.done) || null;
    const recommended = items.find((w) => !w.done) || null;
    const rest = items.filter((w) => w !== created && w !== recommended);
    const nLocked = rest.filter((w) => w.locked).length;
    let h = '<section class="panel wares blk" id="s-wares"><h2>Wares with this ingredient <span class="h2-n">' + items.length + '</span></h2><p class="fam-intro">What the crafting table makes of it. One ware already made, to read before you move on; one crafting recommended next.</p>';
    h += '<div class="wares-list">' + (created ? card(created, 'Created ware', false) : '') + (recommended ? card(recommended, 'Recommended crafting', true) : '') + '</div>';
    if (rest.length) h += '<details class="wares-locked"><summary>' + rest.length + ' more ware' + (rest.length === 1 ? '' : 's') + (nLocked ? ' · ' + nLocked + ' locked' : '') + ' · show the whole stock</summary><div class="wares-list">' + rest.map((w) => card(w, '', false)).join('') + '</div></details>';
    return h + '</section>';
  }
  /* the crier: one ware called out per page access, the unread and the ready first; "another" draws again, "hush" silences it for the day */
  let lastBark = null;
  function barkHtml(id) {
    if (store('bark-hush') === C.today()) return '';
    const mine = wares(id).filter((w) => w.id !== id && w.href !== location.hash);
    const items = mine.length ? mine : wares(null).filter((w) => w.id !== id && w.href !== location.hash);
    if (!items.length) return '';
    const best = Math.min.apply(null, items.map((w) => w.rank));
    const pool0 = items.filter((w) => w.rank === best && w.id !== lastBark);
    const pool = pool0.length ? pool0 : items;
    const w = pool[Math.floor(Math.random() * pool.length)];
    lastBark = w.id;
    const line = w.rank === 0 ? '<b>' + esc(w.name) + '</b> is crafted and still unread' + (w.others.length && id ? ', with ' + esc(w.others.join(' + ')) : '') + '.' :
      w.rank === 1 ? '<b>' + esc(w.name) + '</b> is ready to craft' + (w.others.length && id ? ', with ' + esc(w.others.join(' + ')) : '') + '.' :
      w.rank === 2 ? '<b>' + esc(w.name) + '</b> waits: ' + esc(w.status.replace(/^locked · /, '')) + '.' : '<b>' + esc(w.name) + '</b>, read once; worth a second look.';
    return '<aside class="bark blk" role="complementary" aria-label="The crier"><span class="bark-who">The crier</span><span class="bark-line">' + line + '</span><a class="bark-go" href="' + esc(w.href) + '">' + esc(w.verb) + ' ›</a><span class="bark-tools"><button type="button" class="bark-btn" data-bark="another" data-bark-id="' + esc(id || '') + '">another</button><button type="button" class="bark-btn" data-bark="hush" title="No more barks today">hush</button></span></aside>';
  }
  function craftedBanner(e) {
    const cr = e.crafted;
    const chips = (cr.ingredients || []).filter((i) => C.get(i)).map(entryChip).join('') + (cr.extras || []).map((x) => '<span class="chip chip-extra">✎ ' + esc(x) + '</span>').join('');
    let status;
    if (cr.prebuilt) status = '<span class="badge badge-ok">Classic recipe · pre-built and verified</span>';
    else if (e.verified) status = '<span class="badge badge-ok">Forged: verified by Claude' + (e.verifiedAt ? ' on ' + esc(e.verifiedAt) : '') + '</span>';
    else status = '<span class="badge badge-warn">Draft written live by Claude · references unverified</span> <button class="req" data-forge="' + esc(e.id) + '">Forge verified</button>';
    return '<section class="panel crafted-banner blk" data-anchor="forge"><h2>Crafted</h2><p class="small muted">From these ingredients:</p><div class="chips">' + chips + '</div>' +
      (cr.direction ? '<p class="small">Direction ' + esc(cr.direction.letter) + ': ' + esc(cr.direction.title) + '</p>' : '') + '<p>' + status + '</p>' +
      (!cr.prebuilt && !e.verified ? '<p class="small muted">Forge sends this draft to Claude, who checks every paper, textbook pointer and company, corrects the page in your codex and marks it verified.</p>' : '') + '</section>';
  }
  function textbookItem(t) {
    if (t.tome && C.tome(t.tome)) return readNextItem({ tome: t.tome, num: t.num, why: t.why });
    return '<li class="blk"><span class="rn-num">' + esc(t.book || '') + (t.where ? ' · ' + esc(t.where) : '') + '</span><span class="rn-why">' + rich(t.why || '') + '</span></li>';
  }
  function viewMissing() {
    return crumbs([{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { label: 'Not found' }]) + '<section class="panel"><h1>Not in the codex</h1><p>This page does not exist (yet). <a href="#/">Back to the start</a>.</p></section>';
  }

  /* ---------------- release log and version stamp (2.3.0) ---------------- */
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function relDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : String(iso || '');
  }
  function releaseData() {
    const R = window.CODEX_RELEASES;
    return R && Array.isArray(R.releases) && R.releases.length ? R : null;
  }
  /* 3.0.6: the campaign is the keeper's. A viewer sees no Iovu lore, no board and no chamber, and the release log leaves out the notes about them. */
  const keeper = () => !!(window.CodexLibrary && window.CodexLibrary.owner && window.CodexLibrary.owner());
  const ownerKnown = () => !!(window.CodexLibrary && window.CodexLibrary.ownerKnown && window.CodexLibrary.ownerKnown());
  function pendingHidden(a, b) {
    const lib = window.CodexLibrary; if (!b || !lib) return false;
    try {
      if (a === 'e' || a === 'lamp') { const e = C.get(b); if (!e) return false; const tp = C.pack(e.lore); return !!((tp && tp.keeperOnly) || (lib.hidden && lib.hidden(e))); }
      if (a === 'library') { const p = C.place(b); return !!(p && lib.placeHidden && lib.placeHidden(p)); }
    } catch (err) { /* fall through */ }
    return false;
  }
  const visiblePacks = () => C.packs().filter((p) => !p.keeperOnly || keeper());
  const KEEPER_NOTE = /Iovu|CRETD|campaign|\bcities\b|\bcity\b|postings|seats abroad|league|Zandstra|Alexander|\bthe board\b|board of the|\bboard member|\bmembers? of the board|\bcells?\b|stand vacant|Epstein|\bsixth member|\btrust\b|debt-and-money|\bmembers engine|\bthe lens\b|\bmoney is somebody/i; /* 3.1.1: broadened, a note that speaks of a member, a cell, the lens or the trust rule is the keeper's */
  const notesFor = (r) => (r.notes || []).filter((n) => keeper() || !KEEPER_NOTE.test(String(n)));
  function viewReleases() {
    const R = releaseData();
    let h = crumbs([{ href: '#/', label: hasJournal() ? 'Journal' : 'Codex' }, { label: 'Release log' }]);
    h += '<section class="blk"><h1>Release log</h1>' + ORN + '<p class="lede">Every release of the codex, newest first. A patch fixes or refreshes, a minor adds one new capability, and a major changes the engine underneath.</p></section>';
    if (!R) return h + '<section class="panel"><p>The release log did not load.</p></section>';
    h += '<ol class="rel-list">';
    R.releases.forEach((r, i) => {
      h += '<li class="rel' + (i === 0 ? ' now' : '') + '"><div class="rel-head"><span class="rel-v">' + esc(r.v) + '</span>' +
        (r.name ? '<span class="rel-name">' + esc(r.name) + '</span>' : '') +
        (r.kind ? '<span class="rel-kind">' + esc(r.kind) + '</span>' : '') +
        '<span class="rel-date">' + esc(relDate(r.date)) + '</span>' + (i === 0 ? '<span class="rel-cur">current</span>' : '') + '</div>' +
        '<ul class="rel-notes">' + (notesFor(r).map((n) => '<li>' + esc(n) + '</li>').join('') || '<li class="muted">The notes of this release are kept by the keeper.</li>') + '</ul></li>'; /* 3.0.7: an entry whose notes are all the keeper\'s says so */
    });
    h += '</ol>';
    if (Array.isArray(R.before) && R.before.length) {
      h += '<section class="blk rel-before"><h2>Before the stamp</h2><p class="muted">Until 31 October 2026 the codex was counted by publish, Version 1 to 12. This is the same history in version numbers.</p><dl class="rel-hist">' +
        R.before.map((b) => '<dt><span class="rel-v">' + esc(b.v) + '</span><span class="rel-date">' + esc(b.when) + '</span></dt><dd>' + esc(b.text) + '</dd>').join('') + '</dl></section>';
    }
    return h;
  }
  /* the stamp after the brand and the footer line both show the newest release */
  function renderStamp() {
    const R = releaseData();
    const r = R ? R.releases[0] : null;
    const s = document.getElementById('codex-stamp');
    if (s) {
      if (r) {
        s.innerHTML = '<span class="st-v">' + esc(r.v) + '</span>' + (r.name ? '<span class="st-name">&nbsp;' + esc(r.name) + '</span>' : '') + '<span class="st-date">&nbsp;·&nbsp;' + esc(relDate(r.date)) + '</span>';
        s.setAttribute('aria-label', 'Version ' + r.v + (r.name ? ' ' + r.name : '') + ', ' + relDate(r.date) + '. Open the release log');
        s.hidden = false;
      } else s.hidden = true;
    }
    const f = document.getElementById('codex-ver');
    if (f) f.innerHTML = r ? '<a href="#/releases">Version ' + esc(r.v) + (r.name ? ' ' + esc(r.name) : '') + ' · ' + esc(relDate(r.date)) + ' · Release log</a>' : '';
  }

  /* ---------------- router ---------------- */
  function parseRoute() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    const parts = h.split('/').map((x) => decodeURIComponent(x));
    return parts;
  }
  let current = { name: 'home', args: [] };
  function clearMath(el) {
    const MJ = window.MathJax;
    if (MJ && typeof MJ.typesetClear === 'function') { try { MJ.typesetClear([el]); } catch (err) { /* nothing to clear */ } }
  }
  /* 3.0.2: a refresh that rebuilds the page (a late database snapshot, a craft or counsel update) must not wipe a quiz the reader has answered:
     the answers, the marks, the explanations and the result line are put back into the rebuilt form */
  /* 3.0.4: one keeper for everything the reader has typed or answered, used by every place that rebuilds its own root
     (the page render, the library, the lamp, quests, review, the lores list). A field is kept only if it differs from the
     value the page itself wrote (so fresh data is never overridden), and only when the same route is rebuilt. */
  const FORM_SKIP = /^(file|button|submit|reset|hidden|range|image)$/;
  /* 3.0.6: what a form has just SENT must not come back. A submit writes to the database, the write rebuilds the page, and the keeper (which restores after the mount since 3.0.5) used to put the sent text back into the field: the quest objective field still held the objective after Enter (a second Enter added it twice) and the lamp box still held the prayer (a second press sent it again). A submit records the value of each field of the form; a field whose value is still that value within 15 seconds is left to the page. */
  const FORM_SENT = new WeakMap();
  document.addEventListener('submit', (ev) => {
    const f = ev.target;
    if (!f || !f.querySelectorAll) return;
    const sent = {};
    f.querySelectorAll('input[id], textarea[id], select[id]').forEach((el) => { sent[el.id] = (el.type === 'checkbox' || el.type === 'radio') ? String(el.checked) : el.value; });
    FORM_SENT.set(f, { at: Date.now(), vals: sent });
  }, true);
  /* 3.0.7: a handler that turns a submit down (a title of only spaces, a missing quest) calls this, so the typed text is kept by the next rebuild */
  function unsent(form) { if (form) FORM_SENT.delete(form); }
  function justSent(el) {
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') return false; /* only typed text: a quiz is checked by a submit and its ticks must stay */
    const f = el.form || el.closest('form'); const rec = f && FORM_SENT.get(f);
    if (!rec || (f.matches && f.matches('[data-quiz], [data-doc-quiz]')) || Date.now() - rec.at > 15000 || !(el.id in rec.vals)) return false;
    return rec.vals[el.id] === el.value;
  }
  function formsCapture(scope) {
    scope = scope || document;
    const out = { fields: {}, quizzes: {}, focus: null };
    scope.querySelectorAll('input[id], textarea[id], select[id]').forEach((el) => {
      if (FORM_SKIP.test(el.type) || /^pl-/.test(el.id) || el.readOnly) return;
      if (justSent(el)) return;
      if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked !== el.defaultChecked) out.fields[el.id] = { c: el.checked }; }
      else if (el.tagName === 'SELECT') { if (el.selectedIndex >= 0 && !el.options[el.selectedIndex].defaultSelected) out.fields[el.id] = { v: el.value }; }
      else if (el.value !== el.defaultValue) out.fields[el.id] = { v: el.value };
    });
    scope.querySelectorAll('form[data-quiz], form[data-doc-quiz]').forEach((f) => {
      const key = f.dataset.quiz || f.dataset.docQuiz;
      const st = { sets: [], opts: [], result: '' };
      f.querySelectorAll('fieldset.q').forEach((fs) => { st.sets.push([fs.classList.contains('ok'), fs.classList.contains('bad'), !!(fs.querySelector('.why') && !fs.querySelector('.why').hidden)]); });
      f.querySelectorAll('label.opt').forEach((l) => { st.opts.push([l.classList.contains('is-right'), l.classList.contains('is-wrong')]); });
      const r = f.querySelector('.quiz-result'); st.result = r ? r.textContent : '';
      if (f.querySelector('input:checked') || st.result) out.quizzes[key] = st;
    });
    const a = document.activeElement;
    if (a && a.id && scope.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) out.focus = { id: a.id, s: typeof a.selectionStart === 'number' ? a.selectionStart : null, e: typeof a.selectionEnd === 'number' ? a.selectionEnd : null };
    return out;
  }
  function formsRestore(scope, saved) {
    if (!saved) return;
    scope = scope || document;
    Object.keys(saved.fields).forEach((id) => {
      const el = scope.querySelector('[id="' + id.replace(/"/g, '') + '"]'); if (!el) return;
      const f = saved.fields[id];
      if ('c' in f) el.checked = f.c; else el.value = f.v;
    });
    Object.keys(saved.quizzes).forEach((key) => {
      const f = scope.querySelector('form[data-quiz="' + key + '"], form[data-doc-quiz="' + key + '"]'); if (!f) return;
      const st = saved.quizzes[key];
      const sets = f.querySelectorAll('fieldset.q');
      if (sets.length === st.sets.length) sets.forEach((fs, k) => { fs.classList.toggle('ok', st.sets[k][0]); fs.classList.toggle('bad', st.sets[k][1]); const w = fs.querySelector('.why'); if (w) w.hidden = !st.sets[k][2]; });
      const opts = f.querySelectorAll('label.opt');
      if (opts.length === st.opts.length) opts.forEach((l, k) => { l.classList.toggle('is-right', st.opts[k][0]); l.classList.toggle('is-wrong', st.opts[k][1]); });
      const r = f.querySelector('.quiz-result'); if (r) r.textContent = st.result;
    });
    if (saved.focus) { const el = scope.querySelector('[id="' + saved.focus.id.replace(/"/g, '') + '"]'); if (el && document.activeElement !== el) { try { el.focus({ preventScroll: true }); if (saved.focus.s != null && el.setSelectionRange) el.setSelectionRange(saved.focus.s, saved.focus.e); } catch (err) { /* a control that cannot hold a selection */ } } }
  }
  /* rebuild a root's HTML and keep what was typed there, when the route is the same as at the last rebuild */
  function formsSwap(root, html) {
    const key = location.hash;
    const keep = root.__formsKey === key && root.firstChild ? formsCapture(root) : null;
    root.innerHTML = html;
    root.__formsKey = key;
    if (keep) formsRestore(root, keep);
    return !!keep;
  }
  window.CodexForms = { capture: formsCapture, restore: formsRestore, swap: formsSwap, unsent };
  function captureQuizzes() { return formsCapture(document); }
  function restoreQuizzes(saved) { formsRestore(document, saved); }
  function render(keepScroll) {
    const y = window.scrollY;
    const savedQuizzes = keepScroll ? captureQuizzes() : null;
    const parts = parseRoute();
    let html; let selfId = null;
    const [a, b, c] = parts;
    const journalRoutes = ['review', 'quests', 'quest', 'dossier'];
    /* 3.0.6: the Iovu lore is the keeper's: until the answer is in, nothing of it is drawn; for a viewer it is not there (a link, the remembered lore and the URL all come back to the Resonance home) */
    const cpk = C.pack();
    if (cpk && cpk.keeperOnly && !keeper()) {
      if (!ownerKnown()) { clearMath(app); app.innerHTML = '<section class="blk"><p class="muted">Opening the codex…</p></section>'; return; }
      C.setLore(C.DEFAULT_LORE, true); applyLook(); location.replace('#/'); return;
    }
    if (a === 'lore' && b && b !== 'new') { const tp = C.pack(b); if (tp && tp.keeperOnly && !keeper()) { if (!ownerKnown()) { clearMath(app); app.innerHTML = '<section class="blk"><p class="muted">Opening the codex…</p></section>'; return; } location.replace('#/'); return; } }
    /* 3.0.7: until the owner answer is in, a page that only the keeper can open (a hidden entry, place or lamp) says "Opening the codex…" and not "Not found"; for a viewer the answer comes in a moment and the page is drawn again */
    if (!ownerKnown() && pendingHidden(a, b)) { clearMath(app); app.innerHTML = '<section class="blk"><p class="muted">Opening the codex…</p></section>'; return; }
    if (a === 'e' && b && C.get(b) && C.get(b).lore !== C.lore) { const tp = C.pack(C.get(b).lore); if (tp && tp.keeperOnly && !keeper()) { current = { name: 'missing', args: [] }; clearMath(app); app.innerHTML = viewMissing(); return; } }
    // an entry of another lore opens that lore first
    if (a === 'e' && b && C.get(b) && C.get(b).lore !== C.lore) C.setLore(C.get(b).lore);
    /* 3.0.4: the library's own name links to its front hall */
    if (a === 'library' && b && C.pack() && C.pack().library && C.pack().library.id === b) { location.replace('#/library'); return; }
    /* 3.0.4: a library link to a place of another lore (the Door to the Wings names the Araki Hall and the board) opens that lore instead of "No such place" */
    if (a === 'library' && b && !C.place(b)) { const other = visiblePacks().find((q) => q.id !== C.lore && q.library && C.place(b, q.id)); if (other && C.setLore(other.id)) { applyLook(); } }
    if (a === 'lore' && b && b !== 'new' && b !== C.lore && C.setLore(b)) { applyLook(); location.replace('#/'); return; }
    if (!a) { current = { name: 'home', args: [] }; html = viewHome(); }
    else if (a === 'cyclopedia') { current = { name: 'cyclopedia', args: [] }; html = viewCyclopedia(); }
    else if (a === 'figures') { current = { name: 'figures', args: [] }; html = viewFigures(); }
    else if (a === 'tomes') { current = { name: 'tomes', args: [] }; html = viewTomes(); }
    else if (a === 'tome') { current = { name: 'tome', args: [b, c] }; html = viewTome(b, c); }
    else if (a === 'lexicon') { current = { name: 'lexicon', args: [] }; html = viewLexicon(); }
    else if (a === 'literature') { current = { name: 'literature', args: [] }; html = viewLiterature(); }
    else if (a === 'e') { current = { name: 'entry', args: [b] }; html = viewEntry(b); selfId = b; }
    else if (a === 'library' || a === 'doc') { current = { name: a, args: [b, c] }; html = '<div id="library-root"></div>'; }
    else if (a === 'lamp') { current = { name: 'lamp', args: [b, c] }; html = '<div id="lamp-root"></div>'; }
    else if (a === 'lore' || a === 'lores') { current = { name: 'lores', args: [b] }; html = '<div id="lores-root"></div>'; }
    else if (a === 'craft') { current = { name: 'craft', args: [b, c] }; html = '<div id="craft-root"></div>'; }
    else if (a === 'releases') { current = { name: 'releases', args: [] }; html = viewReleases(); }
    else if (journalRoutes.includes(a) && hasJournal() && (pack().journal || []).includes(a === 'quest' ? 'quests' : a)) { current = { name: a, args: [b] }; html = a === 'review' ? '<div id="review-root"></div>' : '<div id="quests-root"></div>'; }
    else { current = { name: 'missing', args: [] }; html = viewMissing(); }
    const box = document.getElementById('codex-copybox');
    if (box) box.hidden = true;
    clearMath(app);
    app.innerHTML = html;
    if (current.name === 'craft') {
      if (window.CodexCraft) window.CodexCraft.mount(document.getElementById('craft-root'), [b, c]);
      else app.innerHTML = viewMissing();
    } else if (current.name === 'review') {
      if (window.CodexReview) window.CodexReview.mount(document.getElementById('review-root'));
      else app.innerHTML = viewMissing();
    } else if (current.name === 'quests' || current.name === 'quest' || current.name === 'dossier') {
      if (window.CodexQuests) window.CodexQuests.mount(document.getElementById('quests-root'), [current.name, b]);
      else app.innerHTML = viewMissing();
    } else if (current.name === 'library' || current.name === 'doc') {
      if (window.CodexLibrary) window.CodexLibrary.mount(document.getElementById('library-root'), [current.name, b, c]);
      else app.innerHTML = viewMissing();
    } else if (current.name === 'lamp') {
      if (window.CodexLamp) window.CodexLamp.mount(document.getElementById('lamp-root'), [b, c]);
      else app.innerHTML = viewMissing();
    } else if (current.name === 'lores') {
      if (window.CodexLores) window.CodexLores.mount(document.getElementById('lores-root'), [b]);
      else app.innerHTML = viewMissing();
    }
    /* 3.0.5: put back what was typed or answered AFTER the view has mounted: the quest, review and crafting forms are built by their own mount, so restoring right after innerHTML found nothing to restore into (a progress save wiped the New quest form) */
    if (savedQuizzes) restoreQuizzes(savedQuizzes);
    const cycRoutes = ['cyclopedia', 'figures', 'tomes', 'tome', 'lexicon', 'literature', 'entry', 'library', 'doc', 'lamp'];
    document.querySelectorAll('.nav a').forEach((n) => {
      const r = n.dataset.route;
      const on = (r === 'home' && (current.name === 'home' || journalRoutes.includes(current.name))) || (r === 'cyclopedia' && cycRoutes.includes(current.name)) || (r === 'craft' && current.name === 'craft');
      n.classList.toggle('on', on);
      if (on) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
      if (r === 'home') n.hidden = !hasJournal();
    });
    const noIndex = current.name === 'craft' || current.name === 'lores' || current.name === 'releases';
    if (shellEl) shellEl.classList.toggle('no-index', noIndex);
    openIndex(false);
    if (!noIndex) renderIndex(selfId);
    updateCraftBadge();
    if (window.CodexLores) window.CodexLores.refreshMenu();
    if (!['craft', 'review', 'quests', 'quest', 'dossier', 'library', 'doc', 'lores', 'lamp', 'releases'].includes(current.name)) { linkify(app, selfId); typeset(app); }
    if (window.CodexPlates) window.CodexPlates.mountAll(app);
    setupSpy();
    if (keepScroll) {
      window.scrollTo(0, y);
    } else if (current.name === 'tome' && c) {
      const el = app.querySelector('.sec.focus');
      if (el) el.scrollIntoView({ block: 'center' });
    } else {
      window.scrollTo(0, 0);
    }
    const e = selfId && C.get(selfId);
    const titles = { craft: 'Crafting', cyclopedia: 'Cyclopedia', figures: 'Figures', lexicon: 'Bestiary', tomes: 'Tomes', literature: 'Literature', review: 'Review', quests: 'Quests', quest: 'Quest', dossier: 'Dossier', library: 'Library', doc: 'Document', lores: 'Lores', lamp: 'Empathy lamp', releases: 'Release log' };
    const pn = pack().name || 'Codex';
    document.title = e ? e.name + ' · ' + pn : titles[current.name] ? titles[current.name] + ' · ' + pn : pn;
  }

  /* highlight the section being read in the on-this-page list */
  let spy = null;
  function setupSpy() {
    if (spy) { spy.disconnect(); spy = null; }
    const btns = Array.from(app.querySelectorAll('.toc [data-jump]'));
    if (!btns.length || !('IntersectionObserver' in window)) return;
    const visible = new Set();
    spy = new IntersectionObserver((list) => {
      for (const en of list) { if (en.isIntersecting) visible.add(en.target.id); else visible.delete(en.target.id); }
      const cur = btns.find((b) => visible.has(b.dataset.jump));
      if (cur) btns.forEach((b) => { b.classList.toggle('on', b === cur); if (b === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }, { rootMargin: '-90px 0px -55% 0px' });
    for (const b of btns) { const el = document.getElementById(b.dataset.jump); if (el) spy.observe(el); }
  }

  /* the number on the Crafting tab: recipes that became ready since you last opened the table (Deadfire shows a count on its crafting button) */
  function updateCraftBadge() {
    const el = document.getElementById('craft-badge');
    if (!el || !window.CodexCraft || !window.CODEX_RECIPES) return;
    const ready = window.CODEX_RECIPES.recipes.filter((r) => window.CodexCraft.recipeReady(r)).map((r) => r.id);
    let seen;
    try { seen = new Set(JSON.parse(store('recipes-seen') || '[]')); } catch (err) { seen = new Set(); }
    if (current.name === 'craft') {
      let changed = false;
      for (const id of ready) if (!seen.has(id)) { seen.add(id); changed = true; }
      if (changed) store('recipes-seen', JSON.stringify(Array.from(seen)));
    }
    const fresh = ready.filter((id) => !seen.has(id)).length;
    el.hidden = !fresh;
    el.textContent = fresh ? String(fresh) : '';
    el.setAttribute('aria-label', fresh + ' new recipe' + (fresh === 1 ? '' : 's') + ' ready');
  }

  /* refresh the parts that depend on progress, without losing quiz selections or scroll */
  function refreshDynamic() {
    document.querySelectorAll('[data-level-for]').forEach((el) => {
      const l = C.level(el.dataset.levelFor);
      el.className = 'lvl lvl-' + l;
      el.innerHTML = pips(l) + '<span class="lvl-name">' + esc(C.LEVELS[l].name) + '</span>';
    });
    document.querySelectorAll('[data-steps-for]').forEach((el) => {
      const id = el.dataset.stepsFor; const e = C.get(id);
      el.textContent = C.stepsDone(id) + ' of ' + e.steps.length + ' done';
    });
    document.querySelectorAll('[data-quiz-best]').forEach((el) => { el.textContent = quizBestText(Store.entry(el.dataset.quizBest)); });
    document.querySelectorAll('input[data-step]').forEach((el) => {
      const p = Store.entry(el.dataset.step);
      el.checked = !!(p.steps && p.steps[el.dataset.i]);
      el.disabled = !Store.canWrite();
    });
    document.querySelectorAll('[data-rung]').forEach((el) => el.classList.toggle('on', C.level(el.dataset.id) >= Number(el.dataset.rung)));
    document.querySelectorAll('[data-next-for]').forEach((el) => { el.textContent = nextGoal(el.dataset.nextFor); });
    document.querySelectorAll('[data-kbar-for]').forEach((el) => {
      const id = el.dataset.kbarFor;
      el.innerHTML = kbarInner(id);
      el.setAttribute('aria-label', 'Knowledge ' + knowledge(id) + '%, ' + C.LEVELS[C.level(id)].name);
    });
    document.querySelectorAll('[data-gate]').forEach((el) => {
      const e = C.get(el.dataset.id); const l = C.level(e.id);
      const open = el.dataset.gate === 'deeper' ? l >= 3 : l >= 4;
      if (String(open ? 1 : 0) !== el.dataset.open) {
        el.dataset.open = open ? 1 : 0;
        el.innerHTML = gateHtml(e, el.dataset.gate);
        linkify(el, e.id);
        typeset(el);
      }
    });
  }

  function updateStatus() {
    const s = Store.status;
    const text = { starting: 'Starting…', connecting: 'Connecting…', synced: 'Progress saved', local: 'Progress is kept only while this page is open', readonly: 'Read-only: progress is not saved in this view', unsaved: 'Last change not saved' }[s] || '';
    statusEl.innerHTML = '<span>' + esc(text) + '</span>';
    statusEl.title = text;
    statusEl.dataset.state = s;
  }

  /* ---------------- events ---------------- */
  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.matches('input[data-step]')) {
      if (!Store.canWrite()) { t.checked = !t.checked; return; }
      Store.toggleStep(t.dataset.step, Number(t.dataset.i), t.checked);
    } else if (t.id === 'reveal-toggle') {
      store('reveal', t.checked ? '1' : '0');
      render(true);
    }
  });

  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest('form[data-quiz]');
    if (!form) return;
    ev.preventDefault();
    const id = form.dataset.quiz; const e = C.get(id);
    let right = 0; let answered = 0;
    form.querySelectorAll('fieldset.q').forEach((fs) => {
      const qi = Number(fs.dataset.qi); const q = e.quiz[qi];
      const chosen = fs.querySelector('input:checked');
      fs.classList.remove('ok', 'bad');
      fs.querySelectorAll('label.opt').forEach((lab) => lab.classList.remove('is-right', 'is-wrong'));
      if (!chosen) return;
      answered++;
      const ok = Number(chosen.value) === q.answer;
      if (ok) right++;
      fs.classList.add(ok ? 'ok' : 'bad');
      chosen.closest('label').classList.add(ok ? 'is-right' : 'is-wrong');
      const correct = fs.querySelector('input[value="' + q.answer + '"]');
      if (correct) correct.closest('label').classList.add('is-right');
      const why = fs.querySelector('.why'); if (why) why.hidden = false;
    });
    const out = form.querySelector('.quiz-result');
    if (answered < e.quiz.length) { out.textContent = 'Answer every question first (' + answered + ' of ' + e.quiz.length + ').'; return; }
    const score = right / e.quiz.length;
    const pass = score >= C.PASS_MARK;
    out.textContent = right + ' of ' + e.quiz.length + ' right (' + Math.round(score * 100) + '%). ' + (pass ? 'Passed.' : 'Not passed yet: read the explanations and try again.') + (Store.canWrite() ? '' : ' (Not saved in this view.)');
    if (Store.canWrite()) Store.recordQuiz(id, score);
  });

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-index-open]')) { openIndex(true); return; }
    const jump = ev.target.closest('[data-jump]');
    if (jump) {
      const el = document.getElementById(jump.dataset.jump);
      if (el) { el.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); const h = el.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
      return;
    }
    const reset = ev.target.closest('[data-quiz-reset]');
    if (reset) {
      const form = reset.closest('form');
      form.reset();
      form.querySelectorAll('fieldset.q').forEach((fs) => { fs.classList.remove('ok', 'bad'); const w = fs.querySelector('.why'); if (w) w.hidden = true; });
      form.querySelectorAll('label.opt').forEach((lab) => lab.classList.remove('is-right', 'is-wrong'));
      form.querySelector('.quiz-result').textContent = '';
      return;
    }
    const bf = ev.target.closest('[data-bst-fam], [data-bst-lvl]');
    if (bf) {
      if (bf.dataset.bstFam) bstFilter.fam = bf.dataset.bstFam;
      if (bf.dataset.bstLvl) bstFilter.lvl = bf.dataset.bstLvl;
      render(true);
      return;
    }
    const fb = ev.target.closest('[data-filter-slot], [data-filter-field]');
    if (fb) {
      if (fb.dataset.filterSlot) litFilter.slot = fb.dataset.filterSlot;
      if (fb.dataset.filterField) litFilter.field = fb.dataset.filterField;
      clearMath(app); app.innerHTML = viewLiterature(); linkify(app); typeset(app);
      return;
    }
    const req = ev.target.closest('[data-request]');
    if (req) { requestIntegration(req); return; }
    const ask = ev.target.closest('[data-ask]');
    if (ask) { askQuestion(ask); return; }
    const bark = ev.target.closest('[data-bark]');
    if (bark) {
      const box = bark.closest('.bark');
      if (bark.dataset.bark === 'hush') { store('bark-hush', C.today()); if (box) box.remove(); toast('The crier is quiet until tomorrow.'); return; }
      const h = barkHtml(bark.dataset.barkId || null);
      if (box) { if (h) { box.outerHTML = h; linkify(app.querySelector('.bark')); } else box.remove(); }
      return;
    }
    const forge = ev.target.closest('[data-forge]');
    if (forge) {
      const e = C.get(forge.dataset.forge);
      if (e) askClaude('Forge verified: the crafted page “' + e.name.replace(/<[^>]*>/g, '') + '” in ' + (pack().name || 'the codex') + ' (database collection “crafted”, document “' + e.id + '”, lore “' + C.lore + '”). Please check every reference, textbook pointer and start-up on it, correct what is wrong, and mark it verified.', forge.closest('[data-anchor]') || forge, forge);
      return;
    }
  });

  window.addEventListener('hashchange', () => render());
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && indexEl && indexEl.classList.contains('open')) { openIndex(false); return; }
    const t = ev.target;
    if (ev.metaKey || ev.ctrlKey || ev.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
    if (ev.key === '/') { const si = document.getElementById('codex-search'); if (si) { ev.preventDefault(); si.focus(); } return; }
    if ((ev.key === '[' || ev.key === ']') && current.name === 'entry') {
      const a = app.querySelector(ev.key === '[' ? '.pn .prev' : '.pn .next');
      if (a) { ev.preventDefault(); location.hash = a.getAttribute('href'); }
    }
  });
  function refreshRegistry() {
    aliasRe = null;
    aliasMap.clear();
    if (window.CodexTooltip && window.CodexTooltip.reset) window.CodexTooltip.reset();
    if (current.name === 'craft') { if (window.CodexCraft) window.CodexCraft.refresh(); }
    else if (current.name === 'library' || current.name === 'doc') { if (window.CodexLibrary) window.CodexLibrary.refresh(); renderIndex(null); }
    else if (current.name === 'lores') { if (window.CodexLores) window.CodexLores.refresh(); }
    else render(true);
  }
  /* switching the lore re-renders everything: the registry, the index, the menu and the look */
  function switchLore(id) {
    if (!C.setLore(id)) return false;
    aliasRe = null; aliasMap.clear();
    if (window.CodexTooltip && window.CodexTooltip.reset) window.CodexTooltip.reset();
    bstFilter.fam = 'all'; bstFilter.lvl = 'all';
    applyLook();
    if (location.hash && location.hash !== '#/' ) location.hash = '#/'; else render();
    return true;
  }
  const ACCENTS = ['gilt', 'verdigris', 'lapis', 'rubric', 'violet', 'copper', 'slate'];
  function applyLook() {
    const look = pack().look || {};
    const acc = ACCENTS.includes(look.accent) ? look.accent : 'gilt';
    document.documentElement.dataset.accent = acc;
    const brand = document.querySelector('.brand span');
    if (brand) brand.textContent = pack().name || 'Codex';
    const orn = document.querySelector('.brand .brand-orn');
    if (orn && window.CodexLores) orn.innerHTML = window.CodexLores.ornament(look.ornament, 'brand');
  }
  window.CodexView = { esc, rich, texBlock, linkify, pips, sourceLine, typesetNow, clearMath, refresh: refreshRegistry, askClaude, toast, glyph, medal, kbarHtml, knowledge, groupOf, ORN, journalTabs, refreshQuestSlots,
    crumbs, entryChip, litCard, levelBadge, pageLabel, switchLore, applyLook, hasJournal, pack, isLearnable, levelCounts, bestiaryEntries, bestiaryTally, ACCENTS, store, mustReadsHtml, current: () => current, render: (keep) => render(keep), keeper, visiblePacks, restoreLore: () => { const want = store('lore'); const wp = want && C.pack(want); if (wp && wp.keeperOnly && want !== C.lore && (location.hash === '' || location.hash === '#/' || location.hash === '#')) switchLore(want); } };

  /* ---------------- requests through the comment system ---------------- */
  let commentsNS; // undefined until claude.use('comments') settles
  let sendState = 'unknown';
  function requestText(btn) {
    if (btn.dataset.request === 'entry') {
      const e = C.get(btn.dataset.a);
      return 'Integrate the keyword “' + e.name + '” (codex id ' + e.id + ') into ' + (pack().name || 'the codex') + ' (lore “' + C.lore + '”).';
    }
    const L = sectionLabel(btn.dataset.a, btn.dataset.b);
    const f = C.findSection(btn.dataset.a, btn.dataset.b);
    const title = f ? (f.section ? f.section.title : f.chapter.title) : '';
    return 'Integrate ' + L.short + ' ' + L.shownNum + (title ? ' “' + title + '”' : '') + (L.page ? ' (p. ' + L.page + ')' : '') + ' into ' + (pack().name || 'the codex') + ' (lore “' + C.lore + '”). I will send photos of the pages in the chat.';
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); toast('Request copied. Paste it in your chat with Claude.'); return true; }
    catch (err) { showCopyBox(text); return false; }
  }
  function showCopyBox(text) {
    let box = document.getElementById('codex-copybox');
    if (!box) {
      box = document.createElement('div'); box.id = 'codex-copybox'; box.className = 'copybox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Copy this request');
      box.innerHTML = '<p>Copy this request and paste it in your chat with Claude:</p><textarea rows="4" readonly></textarea><button class="btn" type="button">Close</button>';
      box.querySelector('button').addEventListener('click', () => { box.hidden = true; });
      document.body.appendChild(box);
    }
    const ta = box.querySelector('textarea'); ta.value = text; box.hidden = false; ta.focus(); ta.select();
  }
  async function requestIntegration(btn) {
    return askClaude(requestText(btn), btn.closest('[data-anchor], .sec, .panel') || btn, btn);
  }
  /* resolves 'sent', 'composer', 'copied' or 'failed', so callers can record what happened */
  async function askClaude(text, target, btn) {
    const ns = commentsNS;
    if (!ns) { await copyText(text); return 'copied'; }
    if (sendState === 'available' && typeof ns.sendToClaude === 'function') {
      if (btn) btn.disabled = true;
      try {
        const anchor = await ns.anchorFor(target);
        await ns.sendToClaude({ anchor, text });
        if (btn) btn.textContent = 'Sent to Claude';
        toast('Sent. Claude replies in the comment thread on this page.');
        return 'sent';
      } catch (err) {
        if (btn) btn.disabled = false;
        const code = err && err.code;
        if (code === 'consent_required') { toast('Not sent: allow comments from this page when asked, then press again.'); return 'failed'; }
        if (code === 'forbidden') { toast('Commenting from the page is off here. The request was copied instead.'); await copyText(text); return 'copied'; }
        if (code === 'rate_limited') { toast('Too many requests at once; try again in a minute.'); return 'failed'; }
        // claude_unavailable and anything else: fall through to the composer or the clipboard
      }
    }
    try {
      const r = await ns.openComposer({ element: target });
      if (r && r.opened) { if (await copyText(text)) toast('Comment box opened and the request copied: paste it, then press Send to Claude.'); return 'composer'; }
    } catch (err) { /* no comment UI in this view */ }
    await copyText(text);
    return 'copied';
  }
  async function askQuestion(btn) {
    const ns = commentsNS;
    const target = btn.closest('[data-anchor]') || btn;
    if (ns) {
      try { const r = await ns.openComposer({ element: document.querySelector('.entry-head') || target }); if (r && r.opened) return; } catch (err) { /* fall back */ }
    }
    toast('Comments are not available in this view. Ask in your chat with Claude.');
  }

  /* ---------------- search ---------------- */
  const searchInput = document.getElementById('codex-search');
  const searchOut = document.getElementById('codex-search-results');
  /* 3.0.3: how a query matches a name: 0 = the name starts with it, 1 = a word of the name starts with it, 2 = inside a word (only for queries of six letters or more) */
  function matchKind(name, q) {
    const n = name.toLowerCase();
    if (n.startsWith(q)) return 0;
    let i = n.indexOf(q);
    while (i >= 0) { if (i === 0 || !/[a-z0-9\u00c0-\u024f\u0370-\u03ff]/.test(n[i - 1])) return 1; i = n.indexOf(q, i + 1); }
    return q.length >= 6 && n.includes(q) ? 2 : -1;
  }
  const plainHtml = (html) => { const t = document.createElement('textarea'); t.innerHTML = String(html).replace(/<[^>]*>/g, ''); return t.value; };
  /* 3.0.4: a few symbols people type that live inside the names as LaTeX words */
  const SYMBOLS = { 'Ω': ['omega', 'rabi frequency'], 'ω': ['omega'], 'ρ': ['density matrix', 'rho'], 'Γ': ['gamma', 'decay rate'], 'γ': ['gamma'], 'θ': ['theta', 'mixing angle'], 'δ': ['delta', 'detuning'], 'Δ': ['detuning'], 'σ': ['sigma'], 'Λ': ['lambda'], 'λ': ['lambda'] };
  function searchIndex(q) {
    const q0 = q.trim();
    q = q0.toLowerCase().replace(/^§\s*/, ''); /* "§6.3" finds the section 6.3 */
    if (q.length < 2 && !/[^\x00-\x7f]/.test(q)) return [];
    const sym = SYMBOLS[q0] || null; /* one letter is enough when it is not plain ASCII (Γ, θ, Ω) */
    if (!q) return [];
    const hits = [];
    for (const e of C.all()) {
      if (unseen(e)) continue;
      const names = [e.name].concat(e.aliases || []);
      let kind = -1;
      for (const n of names) { const k = matchKind(n, q); if (k >= 0 && (kind < 0 || k < kind)) kind = k; }
      if (kind < 0 && sym) for (const n of names) for (const w of sym) { const k = matchKind(n, w); if (k >= 0 && k < 2 && (kind < 0 || k + 1 < kind)) kind = k + 1; }
      if (kind < 0 && q.length === 1 && glyph(e) === q0) kind = 1;
      if (kind < 0) continue;
      const href = e.kind === 'place' ? '#/library/' + encodeURIComponent(e.place) : '#/e/' + e.id;
      const sub = e.kind === 'section' || e.crafted || e.kind === 'figure' || e.kind === 'place' || e.kind === 'company' || e.kind === 'chapter' ? plainHtml(sourceLine(e)) : (e.integrated ? 'Concept · ' + C.LEVELS[C.level(e.id)].name : 'Discovered');
      hits.push({ href, label: e.name, sub, fog: !e.integrated, g: glyph(e), score: kind });
    }
    /* the recipes of the crafting table */
    if (window.CodexCraft && window.CodexCraft.recipes) {
      let rs = []; try { rs = window.CodexCraft.recipes() || []; } catch (err) { rs = []; }
      for (const r of rs) {
        const k = matchKind(r.name || '', q);
        if (k >= 0) hits.push({ href: '#/craft/r/' + encodeURIComponent(r.id), label: r.name, sub: 'Recipe · Crafting table', fog: false, g: '⚗', score: k + 0.5 });
      }
    }
    if (window.CodexLibrary) for (const x of window.CodexLibrary.search(q)) hits.push(x);
    /* the lores themselves: "Iovu" finds the Book of Iovu */
    for (const pk of visiblePacks()) {
      const nm = [pk.name, pk.short].concat(pk.aliases || []).filter(Boolean);
      if (nm.some((n) => matchKind(n, q) >= 0 || (q.length >= 3 && String(n).toLowerCase().split(/\W+/).includes(q)))) hits.push({ href: '#/lore/' + pk.id, label: pk.name, sub: 'Lore' + (pk.id === C.lore ? ' · open now' : ''), fog: false, g: '❦', score: 1.5 });
    }
    for (const t of C.tomes()) for (const c of t.chapters) {
      for (const s of c.sections) {
        if (matchKind(s.title, q) >= 0 || s.num === q) {
          const id = C.sectionEntry(t.id, s.num);
          hits.push({ href: id ? '#/e/' + id : '#/tome/' + t.id + '/' + encodeURIComponent(s.num), label: '§' + s.num + ' ' + s.title, sub: t.short + ' · p. ' + s.page, fog: !id, g: '§', score: 2 });
        }
      }
      if (!c.sections.length && matchKind(c.title, q) >= 0) hits.push({ href: '#/tome/' + t.id + '/' + encodeURIComponent('ch:' + c.num), label: 'Ch. ' + (c.num || '') + ' ' + c.title, sub: t.short, fog: true, g: '¶', score: 3 });
    }
    const seen = new Set();
    return hits.sort((x, y) => x.score - y.score).filter((h) => { const k = h.href; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 12);
  }
  function showSearch() {
    const hits = searchIndex(searchInput.value);
    if (!hits.length) { searchOut.hidden = true; searchOut.innerHTML = ''; return; }
    searchOut.innerHTML = hits.map((h) => '<a href="' + esc(h.href) + '" class="hit' + (h.fog ? ' hit-fog' : '') + '"><span class="hit-g" aria-hidden="true">' + esc(h.g || '·') + '</span><span class="hit-t"><span>' + esc(h.label) + '</span><span class="muted small">' + esc(h.sub) + '</span></span></a>').join('');
    searchOut.hidden = false;
  }
  if (searchInput) {
    searchInput.addEventListener('input', showSearch);
    searchInput.addEventListener('focus', showSearch);
    searchInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { const first = searchOut.querySelector('a'); if (first) { location.hash = first.getAttribute('href'); searchOut.hidden = true; searchInput.blur(); } }
      if (ev.key === 'Escape') { searchOut.hidden = true; searchInput.blur(); }
    });
    document.addEventListener('click', (ev) => { if (!ev.target.closest('.search')) searchOut.hidden = true; });
    window.addEventListener('hashchange', () => { searchOut.hidden = true; }); /* 3.0.4: Back or a link closes the results too */
    searchOut.addEventListener('click', () => { searchOut.hidden = true; searchInput.value = ''; });
  }

  /* ---------------- boot ---------------- */
  const progressSig = () => JSON.stringify([Store.data.entries, Store.data.review || {}]);
  let lastSig = progressSig();
  Store.on(() => {
    updateStatus();
    const sig = progressSig();
    if (sig === lastSig) return; // a status change only
    lastSig = sig;
    if (current.name === 'home' || current.name === 'lexicon' || current.name === 'cyclopedia') render(true);
    else if (current.name === 'craft') { if (window.CodexCraft) window.CodexCraft.refresh(); updateCraftBadge(); }
    else if (current.name === 'review') { if (window.CodexReview) window.CodexReview.refresh(); }
    else if (current.name === 'library' || current.name === 'doc') { if (window.CodexLibrary) window.CodexLibrary.progress(); renderIndex(null); }
    else if (current.name === 'lores') { /* nothing depends on progress there */ }
    else { refreshDynamic(); renderIndex(current.name === 'entry' ? current.args[0] : null); updateCraftBadge(); }
  });
  // the look of the lore remembered in this browser, before the first paint
  applyLook();
  renderStamp();
  // first render once every module (crafting table, hover cards) has loaded
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => render());
  else setTimeout(() => render(), 0);
  updateStatus();
  Store.init();
  const cl = window.claude;
  if (cl && typeof cl.use === 'function') {
    cl.use('user').then(async (u) => {
      if (!u) return;
      try { if (!(await u.isOwner())) Store.markReadOnly(); } catch (err) { /* keep inputs; a refused write decides */ }
    }).catch(() => {});
    cl.use('comments').then(async (ns) => {
      commentsNS = ns || null;
      if (ns && typeof ns.canSendToClaude === 'function') {
        try { sendState = await ns.canSendToClaude(); } catch (err) { sendState = 'off'; }
      }
    }).catch(() => { commentsNS = null; });
  } else {
    commentsNS = null;
  }
})();
