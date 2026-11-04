/* Resonance Codex — review and timed drills (Journal › Review).
   Cards: one per quiz question of an integrated entry, key "entryId:questionIndex".
   Spaced review (Leitner): a right answer moves a card to the next box (1, 3, 7, 14, 30 days); a wrong one sends it to box 1.
   An entry turns Rusty when nothing on it was touched for RUST_DAYS days.
   Drill pace: the GRE Physics Test has about 70 five-choice questions in 2 hours (ETS, checked 2026-10-29),
   about 103 s each; the harder pace gives one third less time. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;
  const Store = C.Store;
  const RUST_DAYS = 21;
  const SESSION = 8;
  const NEW_PER_DAY = 5;
  const GRE = { questions: 70, minutes: 120, url: 'https://www.ets.org/gre/test-takers/subject-tests/about/content-structure.html', checked: '2026-10-29' };
  const REAL_PACE = Math.round((GRE.minutes * 60) / GRE.questions); // 103 s
  const HARD_PACE = Math.round((REAL_PACE * 2) / 3); // 69 s
  const BOX_NAMES = ['New', '1 day', '3 days', '1 week', '2 weeks', '1 month'];

  /* ------------------------------ model ------------------------------ */
  const M = { mode: 'home', items: [], i: 0, chosen: null, checked: false, results: [], drill: null, size: SESSION, form: { n: 10, fam: 'all', pace: 'hard' } };
  let root = null;
  let timer = 0;

  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(arr, key) {
    const a = arr.slice(); const rnd = seeded(key);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function allCards() {
    const out = [];
    for (const e of C.all()) if (e.integrated && e.quiz && e.quiz.length) e.quiz.forEach((q, qi) => out.push({ key: e.id + ':' + qi, e, q, qi }));
    return out;
  }
  const cardState = (key) => ((Store.review().cards || {})[key]) || null;
  function lastTouch(e) {
    let last = e.integrated || null;
    const p = Store.entry(e.id);
    for (const d of [p.at, p.quizPassedAt]) if (d && (!last || d > last)) last = d;
    const cards = Store.review().cards || {};
    for (const k in cards) if (k.startsWith(e.id + ':') && cards[k].seen && (!last || cards[k].seen > last)) last = cards[k].seen;
    return last;
  }
  function isRusty(id) {
    const e = C.get(id);
    if (!e || !e.integrated || C.level(id) < 2) return false;
    const last = lastTouch(e);
    return !!last && C.daysBetween(String(last).slice(0, 10), C.today()) > RUST_DAYS;
  }
  function daysIdle(id) { const e = C.get(id); const last = e && lastTouch(e); return last ? C.daysBetween(String(last).slice(0, 10), C.today()) : 0; }
  function todayQueue(size) {
    const day = C.today();
    const cards = allCards();
    const due = cards.filter((c) => { const s = cardState(c.key); return s && s.due && s.due <= day; })
      .sort((a, b) => (cardState(a.key).due < cardState(b.key).due ? -1 : cardState(a.key).due > cardState(b.key).due ? 1 : cardState(a.key).b - cardState(b.key).b));
    const answeredToday = (Store.review().days || {})[day] || 0;
    const newSeenToday = Object.values(Store.review().cards || {}).filter((s) => s.seen === day && s.ok + s.miss === 1).length;
    const fresh = shuffle(cards.filter((c) => !cardState(c.key)), 'new:' + day)
      .sort((a, b) => (isRusty(b.e.id) ? 1 : 0) - (isRusty(a.e.id) ? 1 : 0));
    const newRoom = Math.max(0, Math.min(NEW_PER_DAY - newSeenToday, size - due.length));
    return { due: due.slice(0, size), fresh: fresh.slice(0, newRoom), answeredToday };
  }
  function streak() {
    const days = Store.review().days || {};
    let n = 0; let d = C.today();
    if (!days[d]) d = C.addDays(d, -1);
    while (days[d]) { n++; d = C.addDays(d, -1); }
    return n;
  }
  function boxes() {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const c of allCards()) { const s = cardState(c.key); counts[s ? s.b : 0]++; }
    return counts;
  }
  function families() {
    const seen = new Map();
    for (const c of allCards()) { const g = V.groupOf ? V.groupOf(c.e.id) : null; if (g && !seen.has(g.key)) seen.set(g.key, g.name); }
    return Array.from(seen, ([key, name]) => ({ key, name }));
  }

  /* ------------------------------ view ------------------------------ */
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function tabs() { return V.journalTabs ? V.journalTabs('review') : ''; }
  function homeHtml() {
    const q = todayQueue(M.size);
    const n = q.due.length + q.fresh.length;
    const b = boxes();
    const total = b.reduce((a, x) => a + x, 0);
    const rusty = C.all().filter((e) => isRusty(e.id));
    const st = streak();
    let h = tabs() + '<section class="blk"><h1>Review</h1>' + V.ORN + '<p class="lede">A few questions a day keep the bestiary sharp. They come from your entry quizzes. A right answer sends the card further away (1, 3, 7, 14, then 30 days); a wrong one brings it back tomorrow.</p></section>';
    h += '<div class="cols2"><section class="panel rv-today"><h2>Today</h2>';
    if (!total) h += '<p>No quiz questions yet: integrate an entry first.</p>';
    else if (n) h += '<p class="rv-count"><b>' + n + '</b> question' + (n === 1 ? '' : 's') + ' ready: ' + q.due.length + ' due again, ' + q.fresh.length + ' new.</p><button type="button" class="btn" data-rv="start">Start today’s review</button>';
    else h += '<p class="rv-count">Nothing is due. ' + (q.answeredToday ? 'You answered ' + q.answeredToday + ' today.' : '') + ' The next cards return on their day.</p><button type="button" class="btn ghost" data-rv="extra">Practise 5 more anyway</button>';
    h += '<p class="muted small">' + (st ? 'Reviewed ' + st + ' day' + (st === 1 ? '' : 's') + ' in a row.' : 'No review streak yet.') + (q.answeredToday ? ' Answered today: ' + q.answeredToday + '.' : '') + '</p></section>';
    h += '<section class="panel"><h2>Cards by interval</h2><div class="rv-boxes">' + b.map((x, i) => '<div class="rv-box' + (i === 0 ? ' new' : '') + '"><span class="rv-bn">' + x + '</span><span class="rv-bl">' + BOX_NAMES[i] + '</span></div>').join('') + '</div><p class="muted small">' + total + ' cards from ' + new Set(allCards().map((c) => c.e.id)).size + ' entries. New cards enter at most ' + NEW_PER_DAY + ' a day.</p></section></div>';
    const fams = families();
    h += '<section class="panel"><h2>Timed drill</h2><p>Questions under a clock, the way an exam feels. The GRE Physics Test gives about ' + GRE.questions + ' five-choice questions in ' + GRE.minutes / 60 + ' hours, so about ' + REAL_PACE + ' seconds each (<a href="' + GRE.url + '" target="_blank" rel="noopener">ETS</a>, checked ' + GRE.checked + '). The harder pace gives one third less: ' + HARD_PACE + ' seconds. Drill questions come from your codex quizzes, not from the GRE, and they count as reviews.</p>' +
      '<form class="rv-form" data-rv-form><fieldset><legend>Questions</legend>' + [5, 10, 20].map((k) => '<label class="rv-pick"><input type="radio" name="rv-n" value="' + k + '"' + (M.form.n === k ? ' checked' : '') + '> ' + k + '</label>').join('') + '</fieldset>' +
      '<fieldset><legend>Pace</legend><label class="rv-pick"><input type="radio" name="rv-pace" value="hard"' + (M.form.pace === 'hard' ? ' checked' : '') + '> One third less time (' + HARD_PACE + ' s)</label><label class="rv-pick"><input type="radio" name="rv-pace" value="real"' + (M.form.pace === 'real' ? ' checked' : '') + '> Real test pace (' + REAL_PACE + ' s)</label></fieldset>' +
      '<fieldset><legend>From</legend><select name="rv-fam" aria-label="Which family the questions come from"><option value="all">All families</option>' + fams.map((f) => '<option value="' + esc(f.key) + '"' + (M.form.fam === f.key ? ' selected' : '') + '>' + esc(f.name) + '</option>').join('') + '</select></fieldset>' +
      '<button type="submit" class="btn"' + (total ? '' : ' disabled') + '>Start the drill</button></form>';
    const drills = (Store.review().drills || []).slice().reverse();
    if (drills.length) h += '<div class="pl-tablewrap"><table class="rv-table"><thead><tr><th scope="col">Date</th><th scope="col">Score</th><th scope="col">Time used</th><th scope="col">Pace</th></tr></thead><tbody>' + drills.slice(0, 8).map((d) => '<tr><td>' + esc(d.at) + '</td><td>' + d.right + ' of ' + d.n + ' (' + Math.round((100 * d.right) / d.n) + '%)</td><td>' + fmtTime(d.secs) + ' of ' + fmtTime(d.n * d.pace) + '</td><td>' + d.pace + ' s</td></tr>').join('') + '</tbody></table></div>';
    h += '</section>';
    h += '<section class="panel"><h2>Rusty entries</h2>' + (rusty.length ? '<p class="muted small">Not touched for more than ' + RUST_DAYS + ' days. Their questions come first.</p><div class="chips">' + rusty.map((e) => '<a class="chip" data-id="' + esc(e.id) + '" href="#/e/' + esc(e.id) + '">' + esc(e.name) + ' <span class="muted small">' + daysIdle(e.id) + ' days</span></a>').join('') + '</div>' : '<p class="muted">Nothing is rusty: every entry was worked on in the last ' + RUST_DAYS + ' days.</p>') + '</section>';
    return h;
  }
  function optionOrder(item) { return shuffle(item.q.options.map((_, i) => i), item.key + ':' + C.today()); }
  function cardHtml(item, opts) {
    const e = item.e; const l = C.level(e.id);
    const order = optionOrder(item);
    const letters = 'ABCDEFG';
    let h = '<article class="rv-card ornate"><div class="rv-src">' + (V.medal ? V.medal(e, 'sm') : '') + '<a href="#/e/' + esc(e.id) + '" data-id="' + esc(e.id) + '">' + esc(e.name) + '</a><span class="lvl">' + V.pips(l) + esc(C.LEVELS[l].name) + '</span>' + (isRusty(e.id) ? '<span class="tag tag-rust">rusty</span>' : '') + '</div>';
    h += '<div class="rv-q blk">' + V.rich(item.q.q) + '</div><div class="rv-opts" role="radiogroup" aria-label="Answers">';
    order.forEach((oi, k) => {
      let cls = 'rv-opt';
      if (opts.chosen === oi) cls += ' on';
      if (opts.reveal) { if (oi === item.q.answer) cls += ' right'; else if (opts.chosen === oi) cls += ' wrong'; }
      h += '<button type="button" class="' + cls + '" role="radio" aria-checked="' + (opts.chosen === oi ? 'true' : 'false') + '" data-rv-opt="' + oi + '"' + (opts.reveal ? ' disabled' : '') + '><span class="rv-letter">' + letters[k] + '</span><span class="rv-otext">' + V.rich(item.q.options[oi]) + '</span></button>';
    });
    h += '</div>';
    if (opts.reveal) h += '<div class="rv-why ' + (opts.chosen === item.q.answer ? 'ok' : 'bad') + '"><b>' + (opts.chosen === item.q.answer ? 'Right.' : opts.chosen == null ? 'Not answered.' : 'Not quite.') + '</b> ' + V.rich(item.q.why || '') + '</div>';
    return h + '</article>';
  }
  function sessionHtml() {
    const item = M.items[M.i];
    const pct = Math.round((100 * M.i) / M.items.length);
    let h = tabs() + '<div class="rv-head"><span>Question ' + (M.i + 1) + ' of ' + M.items.length + '</span><span class="bar rv-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></span><button type="button" class="btn ghost" data-rv="end">End review</button></div>';
    h += cardHtml(item, { chosen: M.chosen, reveal: M.checked });
    h += '<div class="rv-actions">' + (M.checked ? '<button type="button" class="btn" data-rv="next">' + (M.i + 1 < M.items.length ? 'Next question' : 'See the results') + '</button>' : '<button type="button" class="btn" data-rv="check"' + (M.chosen == null ? ' disabled' : '') + '>Check</button>') + '<span class="muted small rv-keys">Keys: A–D or 1–4 choose, Enter checks and moves on.</span></div>';
    return h;
  }
  function doneHtml() {
    const right = M.results.filter((r) => r.ok).length;
    let h = tabs() + '<section class="blk"><h1>Review done</h1>' + V.ORN + '<p class="lede">' + right + ' of ' + M.results.length + ' right. Right answers return later; the others come back tomorrow.</p></section><section class="panel"><h2>Your answers</h2><ul class="rv-list">';
    for (const r of M.results) {
      const s = cardState(r.item.key);
      h += '<li class="' + (r.ok ? 'ok' : 'bad') + '"><span class="rv-mark" aria-hidden="true">' + (r.ok ? '◆' : '◇') + '</span><span><a href="#/e/' + esc(r.item.e.id) + '">' + esc(r.item.e.name) + '</a>: ' + V.rich(r.item.q.q) + ' <span class="muted small">' + (r.ok ? 'Right' : 'Wrong') + (s ? ' · back on ' + esc(s.due) : '') + '</span></span></li>';
    }
    return h + '</ul><p><button type="button" class="btn" data-rv="home">Back to Review</button></p></section>';
  }
  function drillHtml() {
    const d = M.drill;
    const item = d.items[d.i];
    const left = Math.max(0, (d.deadline - Date.now()) / 1000);
    let h = tabs() + '<div class="rv-head dr-head"><span class="dr-clock" data-dr-clock>' + fmtTime(left) + '</span><span class="bar rv-bar dr-time" aria-hidden="true"><span data-dr-fill style="width:' + Math.round((100 * left) / d.total) + '%"></span></span><span>Question ' + (d.i + 1) + ' of ' + d.items.length + '</span><button type="button" class="btn ghost" data-rv="finish">Finish now</button></div>';
    h += cardHtml(item, { chosen: d.answers[d.i], reveal: false });
    h += '<div class="rv-actions"><button type="button" class="btn ghost" data-rv="prev"' + (d.i ? '' : ' disabled') + '>Previous</button><button type="button" class="btn" data-rv="dnext">' + (d.i + 1 < d.items.length ? 'Next' : 'Finish') + '</button><span class="muted small rv-keys">No feedback until the end, as in the test. Keys: A–D or 1–4, Enter for next.</span></div>';
    return h;
  }
  function drillDoneHtml() {
    const d = M.drill;
    const right = d.items.filter((it, i) => d.answers[i] === it.q.answer).length;
    const used = Math.min(d.total, (d.ended - d.started) / 1000);
    let h = tabs() + '<section class="blk"><h1>Drill result</h1>' + V.ORN + '<p class="lede">' + right + ' of ' + d.items.length + ' right (' + Math.round((100 * right) / d.items.length) + '%) in ' + fmtTime(used) + ' of ' + fmtTime(d.total) + (d.timedOut ? '. Time ran out.' : '.') + ' Pace ' + d.pace + ' s a question.</p></section><section class="panel"><h2>Question by question</h2><ol class="dr-list">';
    d.items.forEach((it, i) => {
      const a = d.answers[i]; const ok = a === it.q.answer;
      h += '<li class="' + (ok ? 'ok' : 'bad') + '"><div class="blk">' + V.rich(it.q.q) + ' <span class="muted small">(' + esc(it.e.name) + ')</span></div><div class="small">' + (a == null ? 'Not answered.' : 'Your answer: ' + V.rich(it.q.options[a]) + (ok ? ' · right' : ' · wrong')) + (ok ? '' : ' Right answer: ' + V.rich(it.q.options[it.q.answer]) + '.') + '</div>' + (ok ? '' : '<div class="rv-why bad small">' + V.rich(it.q.why || '') + '</div>') + '</li>';
    });
    return h + '</ol><p><button type="button" class="btn" data-rv="home">Back to Review</button></p></section>';
  }
  function viewHtml() {
    if (M.mode === 'session' && M.items.length) return sessionHtml();
    if (M.mode === 'done') return doneHtml();
    if (M.mode === 'drill' && M.drill) return drillHtml();
    if (M.mode === 'drill-done' && M.drill) return drillDoneHtml();
    return homeHtml();
  }
  function refresh(focusSel) {
    if (!root || !root.isConnected) return;
    if (V.clearMath) V.clearMath(root);
    window.CodexForms.swap(root, viewHtml());
    V.typesetNow(root);
    const f = focusSel && root.querySelector(focusSel);
    if (f) f.focus({ preventScroll: true });
  }

  /* ------------------------------ controller ------------------------------ */
  function startSession(extra) {
    const q = todayQueue(extra ? 5 : M.size);
    let items = q.due.concat(q.fresh);
    if (extra || !items.length) items = shuffle(allCards(), 'extra:' + Date.now()).slice(0, 5);
    M.items = items; M.i = 0; M.chosen = null; M.checked = false; M.results = []; M.mode = 'session';
    refresh('.rv-opt'); window.scrollTo(0, 0);
  }
  function check() {
    if (M.chosen == null || M.checked) return;
    const item = M.items[M.i];
    const ok = M.chosen === item.q.answer;
    M.checked = true;
    M.results.push({ item, ok });
    Store.answerCard(item.key, ok);
    refresh('[data-rv="next"]');
  }
  function next() {
    if (M.i + 1 < M.items.length) { M.i++; M.chosen = null; M.checked = false; refresh('.rv-opt'); }
    else { M.mode = 'done'; refresh(); }
    window.scrollTo(0, 0);
  }
  function startDrill(form) {
    const n = Number(form.n); const pace = form.pace === 'real' ? REAL_PACE : HARD_PACE;
    let pool = allCards();
    if (form.fam !== 'all' && V.groupOf) pool = pool.filter((c) => { const g = V.groupOf(c.e.id); return g && g.key === form.fam; });
    const items = shuffle(pool, 'drill:' + Date.now()).slice(0, n);
    if (!items.length) { V.toast('No questions in that family yet.'); return; }
    const total = items.length * pace;
    M.drill = { items, i: 0, answers: new Array(items.length).fill(null), pace, total, started: Date.now(), deadline: Date.now() + total * 1000, ended: 0, timedOut: false };
    M.mode = 'drill';
    refresh('.rv-opt'); window.scrollTo(0, 0);
    clearInterval(timer);
    timer = setInterval(tick, 250);
  }
  function tick() {
    const d = M.drill;
    if (!d || M.mode !== 'drill') { clearInterval(timer); return; }
    const left = (d.deadline - Date.now()) / 1000;
    if (left <= 0) { d.timedOut = true; finishDrill(); return; }
    if (!root || !root.isConnected) return; // the drill keeps time while you look at an entry
    const c = root.querySelector('[data-dr-clock]'); if (c) c.textContent = fmtTime(left);
    const f = root.querySelector('[data-dr-fill]'); if (f) f.style.width = Math.round((100 * left) / d.total) + '%';
    const head = root.querySelector('.dr-head'); if (head) head.classList.toggle('late', left < Math.min(60, d.total * 0.15));
  }
  function finishDrill() {
    const d = M.drill;
    if (!d || M.mode !== 'drill') return;
    clearInterval(timer);
    d.ended = Date.now();
    d.items.forEach((it, i) => Store.answerCard(it.key, d.answers[i] === it.q.answer));
    const right = d.items.filter((it, i) => d.answers[i] === it.q.answer).length;
    Store.logDrill({ at: C.today(), n: d.items.length, right, secs: Math.round(Math.min(d.total, (d.ended - d.started) / 1000)), pace: d.pace });
    M.mode = 'drill-done';
    refresh(); window.scrollTo(0, 0);
  }
  function choose(oi) {
    if (M.mode === 'session' && !M.checked) { M.chosen = oi; refresh('.rv-opt.on'); }
    else if (M.mode === 'drill' && M.drill) { M.drill.answers[M.drill.i] = oi; refresh('.rv-opt.on'); }
  }

  document.addEventListener('click', (ev) => {
    if (!root || !root.contains(ev.target)) return;
    const opt = ev.target.closest('[data-rv-opt]');
    if (opt && !opt.disabled) { choose(Number(opt.dataset.rvOpt)); return; }
    const b = ev.target.closest('[data-rv]');
    if (!b) return;
    const act = b.dataset.rv;
    if (act === 'start') startSession(false);
    else if (act === 'extra') startSession(true);
    else if (act === 'check') check();
    else if (act === 'next') next();
    else if (act === 'end') { M.mode = M.results.length ? 'done' : 'home'; refresh(); }
    else if (act === 'home') { M.mode = 'home'; refresh(); }
    else if (act === 'prev' && M.drill) { M.drill.i = Math.max(0, M.drill.i - 1); refresh('.rv-opt'); }
    else if (act === 'dnext' && M.drill) { if (M.drill.i + 1 < M.drill.items.length) { M.drill.i++; refresh('.rv-opt'); window.scrollTo(0, 0); } else finishDrill(); }
    else if (act === 'finish') finishDrill();
  });
  document.addEventListener('submit', (ev) => {
    const f = ev.target.closest && ev.target.closest('[data-rv-form]');
    if (!f) return;
    ev.preventDefault();
    const data = new FormData(f);
    M.form = { n: Number(data.get('rv-n')) || 10, pace: data.get('rv-pace') || 'hard', fam: data.get('rv-fam') || 'all' };
    startDrill(M.form);
  });
  document.addEventListener('keydown', (ev) => {
    if (!root || !root.isConnected || !(M.mode === 'session' || M.mode === 'drill')) return;
    const t = ev.target;
    if (ev.metaKey || ev.ctrlKey || ev.altKey || (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    const k = ev.key.toLowerCase();
    const idx = '1234abcd'.indexOf(k);
    if (idx >= 0) {
      const pos = idx % 4;
      const btns = root.querySelectorAll('.rv-opt');
      if (btns[pos] && !btns[pos].disabled) { ev.preventDefault(); btns[pos].click(); }
      return;
    }
    if (ev.key === 'Enter' && (!(t && t.tagName === 'BUTTON') || t.classList.contains('rv-opt'))) {
      ev.preventDefault();
      if (M.mode === 'session') { if (M.checked) next(); else check(); }
      else root.querySelector('[data-rv="dnext"]').click();
    }
  });

  function mount(el) {
    root = el;
    if (M.mode === 'drill' && M.drill && Date.now() >= M.drill.deadline) { M.drill.timedOut = true; finishDrill(); return; }
    refresh();
  }
  window.CodexReview = { mount, isRusty, daysIdle, todayCount: () => { const q = todayQueue(SESSION); return q.due.length + q.fresh.length; }, refresh: () => { if (M.mode === 'home') refresh(); } };
})();
