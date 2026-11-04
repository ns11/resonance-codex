/* Resonance Codex — hover cards, in the manner of the Pillars of Eternity glossary tooltips.
   Hover (or keyboard-focus) any link that carries data-id: a card opens with the entry's name, level,
   a short description with its own underlined keywords, and the key formula. Hovering a keyword inside
   a card opens a second card on top of it, and so on. On touch screens the first tap opens the card and
   a second tap on the same word opens the entry. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;

  const SHOW_DELAY = 140;   // ms before a card opens from the page
  const NESTED_DELAY = 220; // ms before a card opens from inside another card
  const HIDE_DELAY = 280;   // grace period to move the pointer from a word into its card
  const MAX_DEPTH = 5;

  const stack = [];          // open cards, index = depth: { link, el, id }
  const bodyCache = new Map(); // entry id -> typeset body HTML
  let showTimer = null;
  let trimTimer = null;
  let pointerType = 'mouse';
  let refocusing = false;

  const linkOf = (node) => (node && node.closest ? node.closest('a[data-id], button[data-id]') : null);
  const cardOf = (node) => (node && node.closest ? node.closest('.kw-tip') : null);
  const depthOf = (node) => { const c = cardOf(node); return c ? Number(c.dataset.depth) : -1; };

  function closeFrom(d) {
    while (stack.length > d) {
      const s = stack.pop();
      s.el.remove();
      s.link.removeAttribute('aria-describedby');
      s.link.classList.remove('kw-active');
    }
  }
  function closeAll() { clearTimeout(showTimer); clearTimeout(trimTimer); closeFrom(0); }
  function scheduleTrim(d) {
    clearTimeout(trimTimer);
    if (stack.length > d) trimTimer = setTimeout(() => closeFrom(d), HIDE_DELAY);
  }

  const pg = (p) => (/[–-]/.test(String(p)) ? 'pp. ' : 'p. ') + p;
  function foundText(f) {
    if (f.thesis) return 'your thesis' + (f.page ? ', ' + pg(f.page) : '');
    if (f.session) return 'our sessions';
    const t = C.tome(f.tome);
    return (t ? t.short : f.tome) + ' ' + (String(f.num).startsWith('ch:') ? 'ch. ' + f.num.slice(3) : '§' + f.num) + (f.page ? ', ' + pg(f.page) : '');
  }

  const isRead = (e) => e.kind === 'figure' || e.kind === 'place' || e.kind === 'company' || e.kind === 'chapter';
  function headHtml(e) {
    const l = C.level(e.id);
    if (isRead(e)) {
      const sub = e.kind === 'figure' ? (e.role || '') : e.kind === 'place' ? (e.figures || []).map((f) => C.get(f)).filter(Boolean).map((f) => 'named for ' + f.name).join(', ') : e.kind === 'chapter' ? ((C.get(e.figure) || {}).name || '') : (e.sells || '');
      return '<div class="tip-head">' + (V.medal ? V.medal(e) : '') + '<div class="tip-kind">' + V.sourceLine(e) + '</div><div class="tip-name">' + V.esc(e.kind === 'chapter' ? e.title : e.name) + '</div>' +
        (sub ? '<div class="tip-level"><span>' + V.esc(sub) + '</span></div>' : '') + '</div>';
    }
    let progress = '';
    if (e.integrated) {
      const p = C.Store.entry(e.id);
      const bits = [];
      if (V.knowledge) bits.push(V.knowledge(e.id) + '% known');
      if (e.steps.length) bits.push(C.stepsDone(e.id) + '/' + e.steps.length + ' steps');
      if (p.quizBest != null) bits.push('quiz ' + Math.round(p.quizBest * 100) + '%');
      if (bits.length) progress = '<span class="tip-prog">' + bits.join(' · ') + '</span>';
    }
    const kind = e.kind === 'section' || e.crafted ? V.sourceLine(e) : (e.integrated ? 'Concept' : 'Concept · discovered');
    return '<div class="tip-head">' + (V.medal ? V.medal(e) : '') + '<div class="tip-kind">' + kind + '</div><div class="tip-name">' + V.esc(e.name) + '</div>' +
      '<div class="tip-level">' + V.pips(l) + '<span>' + V.esc(C.LEVELS[l].name) + '</span>' + progress + '</div></div>';
  }
  function bodyHtml(e) {
    const tip = e.tip || {};
    if (e.kind === 'figure') {
      let h = '<p class="blk">' + V.rich(e.teaser || '') + '</p>';
      const w = (e.works || [])[0];
      if (w) h += '<p class="tip-found">' + V.esc(w.year ? w.year + ' · ' : '') + V.esc(w.title) + (w.venue ? ', ' + V.esc(w.venue) : '') + '</p>';
      return h;
    }
    if (e.kind === 'place') {
      const kids = C.places().filter((p) => p.trail.length === 2 && p.trail[0] === e.place).map((p) => p.name);
      return '<p class="blk">' + V.rich(e.teaser || '') + '</p>' + (kids.length ? '<p class="tip-found">Holds: ' + V.esc(kids.join(', ')) + '.</p>' : '');
    }
    if (e.kind === 'company') {
      return '<p class="blk">' + V.rich(e.teaser || '') + '</p>' + ((e.crew || []).length ? '<p class="tip-found">' + V.esc((e.crew || []).map((c) => c.name + (c.role ? ' (' + c.role.split(';')[0] + ')' : '')).join(', ')) + '.</p>' : '');
    }
    if (e.kind === 'chapter') {
      const lights = (e.lights || []).filter((x) => C.get(x));
      return '<p class="blk">' + V.rich(e.blurb || '') + '</p>' + (lights.length ? '<p class="tip-found">Illuminates:</p><div class="chips tip-chips">' + lights.map((x) => V.entryChip(x)).join('') + '</div>' : '<p class="tip-found">Nothing in the bestiary yet.</p>');
    }
    let h = '<p class="blk">' + V.rich(tip.text || e.teaser || '') + '</p>';
    if (e.integrated && tip.tex) {
      h += '<div class="tip-eq">' + V.texBlock(tip.tex) + (tip.ref ? '<div class="tip-ref">' + V.esc(tip.ref) + '</div>' : '') + '</div>';
    }
    if (!e.integrated) {
      h += '<p class="tip-fog"><span class="fogtxt">????</span> Not integrated yet.</p>';
      if (e.found && e.found.length) h += '<p class="tip-found">Seen in ' + V.esc(e.found.map(foundText).join('; ')) + '.</p>';
    }
    return h;
  }
  function footHtml(e) {
    const touch = pointerType === 'touch' || pointerType === 'pen';
    const href = e.kind === 'place' ? '#/library/' + encodeURIComponent(e.place) : '#/e/' + V.esc(e.id);
    const label = e.kind === 'place' ? 'Enter' : e.kind === 'figure' ? 'Open the figure' : e.kind === 'company' ? 'Open the company' : e.kind === 'chapter' ? 'Open the chapter' : e.integrated ? 'Open entry' : 'Open, and ask to integrate';
    return '<div class="tip-foot"><a class="tip-open" href="' + href + '">' + label + '</a>' +
      '<span class="tip-hint">' + (touch ? 'Tap the word again to open' : 'Click the word to open') + '</span></div>';
  }

  function place(el, link, at, d) {
    const rects = Array.from(link.getClientRects());
    if (!rects.length) return false;
    let r = rects[0];
    if (at && rects.length > 1) r = rects.find((q) => at.y >= q.top - 2 && at.y <= q.bottom + 2) || r;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const w = Math.min(360, vw - 32);
    el.style.width = w + 'px';
    const h = el.offsetHeight;
    // a card opened from inside another card goes beside its parent when there is room, as in the game
    if (d > 0 && stack[d - 1]) {
      const pr = stack[d - 1].el.getBoundingClientRect();
      let side = null;
      if (pr.right + 10 + w <= vw - 8) side = pr.right + 10;
      else if (pr.left - 10 - w >= 8) side = pr.left - 10 - w;
      if (side !== null) {
        const sideTop = Math.min(Math.max(8, r.top - 24), vh - 8 - h);
        el.style.left = Math.round(side) + 'px';
        el.style.top = Math.round(Math.max(8, sideTop)) + 'px';
        return true;
      }
    }
    const left = Math.min(Math.max(16, r.left - 10), vw - 16 - w);
    let top = r.bottom + 8;
    if (top + h > vh - 8) {
      const above = r.top - 8 - h;
      top = above >= 8 ? above : Math.max(8, vh - 8 - h);
    }
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
    return true;
  }

  async function open(link, d, at) {
    const id = link.dataset.id;
    const e = C.get(id);
    if (!e || d >= MAX_DEPTH || !link.isConnected) return;
    if (stack[d] && stack[d].link === link) { closeFrom(d + 1); return; }
    closeFrom(d);
    const el = document.createElement('div');
    el.className = 'kw-tip ornate';
    el.id = 'kw-tip-' + d;
    el.dataset.depth = String(d);
    el.setAttribute('role', 'tooltip');
    el.style.visibility = 'hidden';
    el.innerHTML = headHtml(e) + '<div class="tip-body"></div>' + footHtml(e);
    document.body.appendChild(el);
    stack[d] = { link, el, id };
    link.setAttribute('aria-describedby', el.id);
    link.classList.add('kw-active');
    const body = el.querySelector('.tip-body');
    if (bodyCache.has(id)) {
      body.innerHTML = bodyCache.get(id);
    } else {
      body.innerHTML = bodyHtml(e);
      V.linkify(body, id);
      await V.typesetNow(body);
      if (window.MathJax && window.MathJax.startup && body.querySelector('mjx-container')) bodyCache.set(id, body.innerHTML);
      else if (!body.querySelector('.m')) bodyCache.set(id, body.innerHTML);
    }
    if (!el.isConnected || (stack[d] !== undefined && stack[d].el !== el)) return;
    if (!place(el, link, at, d)) { closeFrom(d); return; }
    el.style.visibility = '';
    el.classList.add('show');
  }

  /* pointer: hover opens, leaving closes after a grace period */
  document.addEventListener('pointerdown', (ev) => {
    pointerType = ev.pointerType || 'mouse';
    if (!cardOf(ev.target) && !linkOf(ev.target)) closeAll();
  }, true);

  document.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse') pointerType = 'mouse'; }, { passive: true });

  document.addEventListener('mouseover', (ev) => {
    if (pointerType === 'touch' || pointerType === 'pen') return;
    const link = linkOf(ev.target);
    const k = depthOf(ev.target);
    clearTimeout(trimTimer);
    if (link && C.get(link.dataset.id)) {
      const d = k + 1;
      clearTimeout(showTimer);
      if (stack[d] && stack[d].link === link) { scheduleTrim(d + 1); return; }
      const at = { x: ev.clientX, y: ev.clientY };
      showTimer = setTimeout(() => open(link, d, at), d === 0 ? SHOW_DELAY : NESTED_DELAY);
      return;
    }
    clearTimeout(showTimer);
    scheduleTrim(k >= 0 ? k + 1 : 0);
  });
  document.addEventListener('mouseleave', () => { if (pointerType === 'mouse') { clearTimeout(showTimer); scheduleTrim(0); } });

  /* touch: first tap opens the card, a second tap on the same word follows the link */
  document.addEventListener('click', (ev) => {
    const link = linkOf(ev.target);
    if (!link || !C.get(link.dataset.id)) return;
    if (pointerType !== 'touch' && pointerType !== 'pen') { closeAll(); return; }
    if (link.tagName === 'BUTTON') { closeAll(); return; } // ingredient tiles act on the first tap
    const d = depthOf(link) + 1;
    if (stack[d] && stack[d].link === link) { closeAll(); return; }
    ev.preventDefault();
    clearTimeout(showTimer);
    open(link, d, { x: ev.clientX, y: ev.clientY });
  }, true);

  /* keyboard: focusing a word opens its card; Escape closes */
  document.addEventListener('focusin', (ev) => {
    const link = linkOf(ev.target);
    if (refocusing || !link || !C.get(link.dataset.id)) return;
    let keyboard = true;
    try { keyboard = link.matches(':focus-visible'); } catch (err) { keyboard = true; }
    if (!keyboard) return;
    clearTimeout(showTimer);
    open(link, depthOf(link) + 1, null);
  });
  document.addEventListener('focusout', (ev) => {
    const to = ev.relatedTarget;
    if (to && (cardOf(to) || linkOf(to))) return;
    if (pointerType === 'mouse' && document.querySelector('.kw-tip:hover, a[data-id]:hover, button[data-id]:hover')) return;
    scheduleTrim(0);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || !stack.length) return;
    const first = stack[0].link;
    closeAll();
    if (first && first.isConnected) { refocusing = true; first.focus({ preventScroll: true }); refocusing = false; }
  });

  /* the card is pinned to a spot on the screen, so close it when the page moves */
  window.addEventListener('scroll', () => { if (stack.length) closeAll(); }, { passive: true });
  window.addEventListener('resize', closeAll);
  window.addEventListener('hashchange', closeAll);

  window.CodexTooltip = { closeAll, open, reset() { bodyCache.clear(); closeAll(); } };
})();
