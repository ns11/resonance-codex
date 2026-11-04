/* Resonance Codex — the counsel of the board (3.0.0).
   The board of the campaign sits in Alexander's chamber off the Araki Hall; each member keeps a cell. A cell carries the
   member's LENS (what the record weighs and ignores, the rule, the questions) and a LEDGER: every decision the keeper put
   to the cell and the record's reading of it. The codex never speaks AS a living member: the verdict is written as the
   record's reading, in Claude's words (the lamp's rule). Alexander and the Fable cell speak in voice.
   Alexander's chamber also holds the MAP of the campaign — every posting a city, taken or not — and the window on the
   Kudo Hall: the unknown side, the skill gaps of the open cities and the facts still to verify. Stages on the map come
   from a CRETD-D save file the keeper brings, or are set by hand.
   Storage: private/<lore>/counsel/<monk> (one ledger per member) and private/<lore>/counsel/map; owner only; in memory
   when the page has no database. The Door to the Wings in the House of Uz is rendered here too.
   3.1.0 — the members engine. A member is a set of agents (task, wish, eyes and his own; data in iovu-board.js). One
   call per decision: the agents propose, the eyes label each proposal professional or tyrant, the member resolves, and
   his tell decides whether the pull shows. Alexander's Alex agent vetoes; Musk's window agent dates every decision from
   the codex's own windows (a date that is not in the data is dropped). Every answer keeps an owner-only inner note.
   The keeper marks the rulings she went with; the chamber shows the standings. Design: claude/codex-members-engine.md.
   Rebuilt on 3.0.7 with the answers of 1 Nov 2026 (section 11): the far side of the map is a ladder of series (Beyond, Serie A upper,
   Serie A lower, Serie B, Serie C), placed by rule until CRETD-D carries a `series` field; Musk's windows include a dated copy of CRETD-D's US job
   track; the standings show Net; no member is named on another member's page. And the sixth member (section 12): a record-first cell with a trust
   rule that the sanitizer enforces in code. */
(function () {
  'use strict';
  const C = window.Codex;
  const V = window.CodexView;
  if (!C || !V) return;
  const esc = V.esc;
  const D = window.IOVU_DATA || { cities: [], keywords: [], covFamilies: [], verify: [], campaign: {}, tomes: [] };

  const MAX_LEDGER = 40;
  const SOFT_BYTES = 200 * 1024; // a ledger stays well under the 256 KiB limit of one document
  /* the ladder of series (section 11), top first. Not CRETD-D's leagues (A1, A2, B, I), which measure the scope of the role only;
     a series also depends on the country, the company and the visa. The members' leagues, their alliances, come in a later release. */
  const SERIES = [
    { id: 'beyond', name: 'Beyond', hint: 'The dream: Head of IT in the US or the UK, and anything above it.' },
    { id: 'a-upper', name: 'Serie A, upper league', hint: 'A full-time engineering job in the US or the UK with visa help, and every US or UK role above it up to Head of IT; a German CTO of 400 or more; a minister or the like in Moldova; a CEO in Moldova or Germany.' },
    { id: 'a-lower', name: 'Serie A, lower league', hint: 'Remote engineering for a US, UK or Australian employer; a German CTO under 400; Head of IT in Australia; a co-founder in Moldova or Western Europe.' },
    { id: 'b', name: 'Serie B', hint: 'Head of IT, Head of Engineering or CTO in Moldova; on-site engineering in Western Europe with visa help.' },
    { id: 'c', name: 'Serie C', hint: 'Engineer and specialist roles in Moldova.' },
  ];
  const EYES = { professional: 'Professional', tyrant: 'Tyrant' };
  const STAGES = [
    { id: 'unseen', name: 'Unseen', hint: 'Not approached.' },
    { id: 'scouted', name: 'Scouted', hint: 'Targeted; nothing sent yet.' },
    { id: 'besieged', name: 'Besieged', hint: 'Applied; waiting.' },
    { id: 'parley', name: 'Parley', hint: 'Screen or interview.' },
    { id: 'terms', name: 'Terms', hint: 'An offer on the table.' },
    { id: 'taken', name: 'Taken', hint: 'Signed.' },
    { id: 'razed', name: 'Razed', hint: 'Declined, or the posting closed.' },
  ];
  const STAGE_OF = { Targeted: 'scouted', Applied: 'besieged', Screen: 'parley', Interview: 'parley', Offer: 'terms', Signed: 'taken', Declined: 'razed' };
  const STANCES = { for: 'For', against: 'Against', conditional: 'Conditional', unclear: 'Unclear' };
  const ERR = { not_granted: 'The counsel is not allowed in this view (permission declined).', sampling_disabled: 'Claude is not available for this account.', not_declared: 'This version of the page cannot call Claude.', capability_disabled: 'The counsel is switched off for this artifact.', rate_limited: 'Claude is busy or your usage limit is reached. Ask again later.', session_expired: 'Sign in again to ask the board.', refused: 'Claude declined this decision. Reword it.', invalid_json: 'The record’s answer could not be read. Ask again.', prompt_too_large: 'The decision is too long for one call. Shorten it.' };
  const PERMANENT = ['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'];

  const S = { db: null, owner: false, sample: null, live: 'pending', tiers: null, docs: new Map(), unsub: null, lore: null, loaded: false, busy: null, draft: new Map(), armed: null, local: false };
  const BOARD_LORE = (window.CODEX_BOARD && window.CODEX_BOARD.lore) || 'resonance';
  const col = () => 'private/' + BOARD_LORE + '/counsel'; // the chamber stands in the Resonance Wings whatever lore is open

  /* ------------------------------ helpers ------------------------------ */
  const clean = (s, n) => (typeof s === 'string' ? s.replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, n || 300) : '');
  const arr = (a, n) => (Array.isArray(a) ? a.slice(0, n) : []);
  const plain = (s) => String(s || '').replace(/<[^>]*>/g, '');
  const rid = () => Math.random().toString(36).slice(2, 7);
  const when = (iso) => (iso ? iso.slice(0, 10) + (iso.length > 15 ? ' ' + iso.slice(11, 16) : '') : '');
  const idOk = (s) => typeof s === 'string' && /^[a-z0-9-]+$/.test(s) && s.length <= 60;
  function rich(s, max) { // Claude's words or the keeper's: escape everything but $…$ math and **bold**
    if (typeof s !== 'string') return '';
    s = s.slice(0, max || 4000);
    return s.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g).map((p, i) => (i % 2 ? esc(p) : esc(p).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>'))).join('');
  }
  const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-+|-+$/g, '');
  const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  /* "27 Nov 2026, 17:00", "extended to 20 Nov 2026, 16:00", "5 Nov 2026" → a time in Chișinău (UTC+2 after 25 Oct 2026) */
  /* 3.0.6: Chișinău time is UTC+2 in winter and UTC+3 in summer (from the last Sunday of March); the offset is read from the time zone database, with +2 h if the browser has none */
  function chiOffset(ms) {
    try {
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Chisinau', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(ms));
      const g = (t) => Number(parts.find((x) => x.type === t).value);
      const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
      const off = asUtc - Math.floor(ms / 1000) * 1000;
      return Number.isFinite(off) ? off : 7200000;
    } catch (err) { return 7200000; }
  }
  const dayNo = (ms) => Math.floor((ms + chiOffset(ms)) / 86400000);
  function dueOf(text) {
    if (/^\s*(open|none|no |nothing)|refreshed|not yet|watch for/i.test(String(text || ''))) return null; // "open, refreshed 27 Oct", "no IT post as of 31 Oct": not a deadline
    const m = String(text || '').match(/(\d{1,2}) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* (\d{4})(?:,? (\d{1,2}):(\d{2}))?/i);
    if (!m) return null;
    if (/closed|passed/i.test(text)) return { closed: true };
    const hh = m[4] ? Number(m[4]) : 23; const mm = m[5] ? Number(m[5]) : 59;
    const wall = Date.UTC(Number(m[3]), MONTHS[m[2].slice(0, 3).toLowerCase()], Number(m[1]), hh, mm);
    return { closed: false, ms: wall - chiOffset(wall - 7200000) }; /* the wall-clock time in Chișinău, as a moment */
  }
  const phone = () => { try { return window.matchMedia('(max-width: 640px)').matches; } catch (err) { return false; } };
  const isoDay = (ms) => new Date(ms + 2 * 3600000).toISOString().slice(0, 10); // the calendar day in Chișinău (UTC+2)
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const prettyDay = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? Number(m[3]) + ' ' + MON[Number(m[2]) - 1] + ' ' + m[1] : String(iso || ''); };
  function bytesOf(o) { const s = JSON.stringify(o); try { return new TextEncoder().encode(s).length; } catch (err) { return s.length * 3; } }
  function tier(want) { if (!S.tiers) return want; if (S.tiers.includes(want)) return want; return S.tiers.includes('default') ? 'default' : undefined; }

  /* ------------------------------ sanitizing ------------------------------ */
  const agentId = (s) => (typeof s === 'string' && /^[a-z][a-z0-9-]{0,23}$/.test(s) ? s : '');
  function sanitizeInner(n) { // the owner-only note of what moved an answer (3.1.0)
    if (!n || typeof n !== 'object' || Array.isArray(n)) return null;
    const out = {
      proposals: arr(n.proposals, 6).filter((p) => p && typeof p === 'object').map((p) => ({ agent: agentId(p.agent) || 'agent', line: clean(p.line, 200), eyes: p.eyes === 'tyrant' ? 'tyrant' : 'professional' })).filter((p) => p.line),
      moved: arr(n.moved, 6).map(agentId).filter(Boolean),
      vetoed: arr(n.vetoed, 6).map((x) => clean(x, 200)).filter(Boolean),
      adopted: arr(n.adopted, 5).map(agentId).filter(Boolean),
      dilemma: clean(n.dilemma, 300),
      dropped: clean(n.dropped, 200),
    };
    return out.proposals.length || out.moved.length || out.vetoed.length || out.adopted.length || out.dilemma || out.dropped ? out : null;
  }
  function sanitizePull(p) {
    if (typeof p === 'string') { const t = clean(p, 300); return t ? { text: t, shown: true } : null; }
    if (!p || typeof p !== 'object') return null;
    const text = clean(p.text, 300);
    return text ? { text, shown: p.shown === true } : null;
  }
  function sanitizeWindow(w) {
    if (!w || typeof w !== 'object' || typeof w.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(w.date)) return null;
    return { date: w.date, text: clean(w.text, 200) };
  }
  const mark = (m) => (m && typeof m === 'object' && typeof m.at === 'string' && m.at ? { at: clean(m.at, 30) } : null);
  function sanitizeEntry(e) {
    if (!e || typeof e !== 'object' || !idOk(e.id)) return null;
    const v = e.verdict && typeof e.verdict === 'object' ? e.verdict : {};
    const struck = e.struck === true;
    let followed = struck ? null : mark(e.followed); let aside = struck ? null : mark(e.aside);
    if (followed && aside) { if (aside.at > followed.at) followed = null; else aside = null; } // the two exclude each other; the later one stands
    return { id: e.id, at: clean(e.at, 30), decision: clean(e.decision, 2000), voice: e.voice === 'voice' ? 'voice' : 'record', model: clean(e.model, 40), struck, followed, aside,
      verdict: { stance: STANCES[v.stance] ? v.stance : 'unclear', ruling: clean(v.ruling, 400), reasons: arr(v.reasons, 6).map((x) => clean(x, 500)).filter(Boolean), risks: arr(v.risks, 4).map((x) => clean(x, 400)).filter(Boolean), asks: arr(v.asks, 4).map((x) => clean(x, 300)).filter(Boolean), check: arr(v.check, 6).map((x) => clean(x, 300)).filter(Boolean), record: clean(v.record, 300),
        pull: sanitizePull(v.pull), window: sanitizeWindow(v.window), inner: sanitizeInner(v.inner) } };
  }
  function sanitizeLedger(d) {
    if (!d || typeof d !== 'object' || !idOk(d.monk)) return null;
    return { v: 1, monk: d.monk, entries: arr(d.entries, MAX_LEDGER).map(sanitizeEntry).filter(Boolean) };
  }
  /* keep a ledger under 40 entries and under SOFT_BYTES: struck entries go first, then the oldest the keeper did not
     follow, and only then the oldest followed one */
  function trimLedger(L) {
    const keep = L.entries.slice();
    const over = () => keep.length > MAX_LEDGER || bytesOf({ v: 1, monk: L.monk, entries: keep }) > SOFT_BYTES;
    while (keep.length && over()) {
      let i = keep.findIndex((e) => e.struck);
      if (i < 0) i = keep.findIndex((e) => !e.followed);
      if (i < 0) i = 0;
      keep.splice(i, 1);
    }
    L.entries = keep;
    return L;
  }
  function sanitizeMap(d) {
    const cities = {};
    if (d && d.cities && typeof d.cities === 'object' && !Array.isArray(d.cities)) {
      for (const k of Object.keys(d.cities).slice(0, 400)) { const c = d.cities[k]; if (!idOk(k) || !c || typeof c !== 'object') continue; const st = STAGES.find((s) => s.id === c.stage); if (!st) continue; cities[k] = { stage: st.id, at: clean(c.at, 30), note: clean(c.note, 200), by: c.by === 'import' ? 'import' : 'hand' }; }
    }
    const imp = d && d.imported && typeof d.imported === 'object' ? { at: clean(d.imported.at, 30), file: clean(d.imported.file, 120), version: clean(d.imported.version, 20), exported: clean(d.imported.exported, 30), matched: Number(d.imported.matched) || 0, unmatched: arr(d.imported.unmatched, 20).map((x) => clean(x, 120)) } : null;
    return { v: 1, cities, imported: imp };
  }

  /* ------------------------------ persistence ------------------------------ */
  async function connect() {
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') { S.live = 'off'; S.local = true; S.loaded = true; return; }
    try { const u = await cl.use('user'); S.owner = u ? !!(await u.isOwner()) : false; } catch (err) { S.owner = false; }
    cl.use('sample').then(async (s) => { S.sample = s || null; S.live = s ? 'on' : 'off'; try { const lim = s && s.limits ? await s.limits() : null; S.tiers = lim && Array.isArray(lim.modelTiers) ? lim.modelTiers : null; } catch (err) { S.tiers = null; } refreshView(); }).catch(() => { S.live = 'off'; refreshView(); });
    try { S.db = await cl.use('db'); } catch (err) { S.db = null; }
    if (!S.db) { S.local = true; S.loaded = true; refreshView(); return; }
    subscribe(BOARD_LORE);
  }
  function subscribe(lore) {
    if (!S.db || !S.owner) { S.loaded = true; refreshView(); return; }
    if (S.unsub) { try { S.unsub(); } catch (err) { /* gone */ } S.unsub = null; }
    S.lore = lore; S.docs = new Map();
    try {
      S.unsub = S.db.collection(col()).onSnapshot((qs) => {
        if (S.busy) return; // keep what is being written
        const next = new Map();
        for (const snap of qs.docs) { const raw = snap.data ? snap.data() : snap; const id = snap.id || (raw && raw.monk); if (id === 'map') next.set('map', sanitizeMap(raw)); else { const l = sanitizeLedger(Object.assign({ monk: id }, raw || {})); if (l) next.set(l.monk, l); } }
        S.docs = next; S.loaded = true; refreshView();
      }, () => { S.local = true; S.loaded = true; refreshView(); });
    } catch (err) { S.local = true; S.loaded = true; }
  }
  function ledger(monk) { return S.docs.get(monk) || { v: 1, monk, entries: [] }; }
  function mapDoc() { return S.docs.get('map') || { v: 1, cities: {}, imported: null }; }
  async function write(id, doc) {
    S.docs.set(id, doc);
    if (!S.db || !S.owner) { if (!S.local) S.local = true; return false; }
    try { await S.db.collection(col()).doc(id).set(JSON.parse(JSON.stringify(doc))); return true; }
    catch (err) { V.toast('Not saved (' + ((err && err.code) || 'error') + '); kept for this visit.'); return false; }
  }

  /* ------------------------------ the cities ------------------------------ */
  function famOf(c) {
    const r = c.role || ''; const txt = (c.title || '') + ' ' + (c.stack || '');
    let id = 'ops';
    if (/^head_|^cto$/.test(r)) id = 'lead';
    else if (/^soc$|^sec_arch$/.test(r) || c.security) id = 'sec';
    else if (/^ml_/.test(r) || /data (engineer|scientist)/i.test(c.title || '')) id = 'ml';
    else if (/^architect$|^infra_arch$/.test(r)) id = 'arch';
    else if (/^backend/.test(r)) id = /kubernetes automation|platform engineering/i.test(c.title || '') ? 'ops' : (/\bphp\b/i.test(txt) ? 'php' : 'py');
    else if (c.kind === 'state' || r === 'command') id = 'lead';
    return (D.covFamilies || []).find((f) => f.id === id) || { id, name: id, books: [] };
  }
  let termCache = null;
  function terms() { if (!termCache) termCache = (D.keywords || []).map((k) => { let rx = null; try { rx = new RegExp(k.re, 'i'); } catch (err) { rx = null; } return Object.assign({ rx }, k); }).filter((k) => k.rx); return termCache; }
  function coverOf(c) {
    const txt = (c.title || '') + ' :: ' + (c.stack || '');
    const fam = famOf(c); const found = terms().filter((t) => t.rx.test(txt));
    const hit = found.filter((t) => (t.books || []).some((b) => fam.books.includes(b)));
    const gaps = found.filter((t) => !(t.books || []).some((b) => fam.books.includes(b)));
    return { fam, found: found.length, hit: hit.length, pct: found.length ? Math.round((100 * hit.length) / found.length) : null, thin: found.length <= (D.thin || 2), gaps };
  }
  /* 3.0.4: CRETD-D's leagues and regions, and the rule that a seat abroad is shown but not counted in the shelf coverage */
  const LEAGUES = { A1: 'Seria A1 · upper tier', A2: 'Seria A2', B: 'Seria B', I: 'Individual' };
  const REGIONS = { MD: 'Moldova', DEP: 'DE+', US: 'US', AUUK: 'AU/UK', ROBG: 'RO/BG' };
  /* 3.0.5: what each region chip stands for; a tooltip alone is no use on a phone, so the Seats abroad intro prints the same words */
  const REGION_WORDS = { DEP: 'DE+: Germany and the wider European group, as CRETD-D groups them', US: 'US: the United States', AUUK: 'AU/UK: Australia and the United Kingdom', ROBG: 'RO/BG: Romania and Bulgaria' };
  const isAbroad = (c) => !!c.foreign;
  function stageOf(c) {
    const m = mapDoc().cities[c.id];
    if (m) return m.stage;
    return c.closed ? 'razed' : 'unseen';
  }
  function cityDue(c) { return dueOf(c.deadline || (c.kind === 'state' ? '' : '')); }
  function cities() { return (D.cities || []).slice(); }
  function famName(c) { const d = c.doctrines && c.doctrines[0]; const f = (window.CODEX_LORES && window.CODEX_LORES.iovu && window.CODEX_LORES.iovu.families || []).find((x) => x.id === d); return f ? f.name : 'Unplaced'; }
  function counts() {
    const n = {}; for (const s of STAGES) n[s.id] = 0;
    for (const c of cities()) n[stageOf(c)]++;
    return n;
  }
  function open() { return cities().filter((c) => !['taken', 'razed'].includes(stageOf(c))); }
  /* 3.0.5: whole calendar days in Chișinău time (UTC+2 after 25 Oct 2026) between now and a moment: one count for the words, the colour and the seven-day banner */
  function calDays(ms) { return dayNo(ms) - dayNo(Date.now()); }
  function soon(days) { const now = Date.now(); /* 3.0.4: whole calendar days in Chișinău time, as the cards count them */ return open().map((c) => ({ c, d: cityDue(c) })).filter((x) => x.d && !x.d.closed && x.d.ms > now && dayNo(x.d.ms) - dayNo(now) <= days).sort((a, b) => a.d.ms - b.d.ms); }
  function gapTable() {
    const g = new Map();
    for (const c of open().filter((x) => !isAbroad(x))) { /* seats abroad are not measured against the two shelf books */ const cov = coverOf(c); for (const t of cov.gaps) { if (!g.has(t.id)) g.set(t.id, { t, n: 0 }); g.get(t.id).n++; } }
    return Array.from(g.values()).sort((a, b) => b.n - a.n);
  }
  /* The series of a posting (section 11). A `series` field from CRETD-D wins. Until then it is placed by rule from the title, the level
     of the role, the employer's country, whether the seat is in that country, the company size where the league note states it, and the
     mode line. `unsure` marks a placement where a fact the ladder needs (the company size, visa help, the seat) is missing. */
  const sizeOf = (c) => {
    const t = String(c.lw || ''); let m; const rx = /\b(under|below|less than|far below)?\s*(\d[\d,]*)[- ](staff|person|employees)\b(?!\s*(benchmark|floor))/gi;
    while ((m = rx.exec(t))) { const n = Number(m[2].replace(/,/g, '')); if (n >= 20) return m[1] ? n - 1 : n; }
    return null;
  };
  const levelOf = (c) => {
    const t = String(c.title || ''); const r = c.role || '';
    if (/funcții vacante/i.test(t)) return 'none';
    if (r === 'cto' || /\b(CTO|CIO|Chief Technology|Chief Information)\b|Head of IT\b|IT-?Leiter|Leiter IT|Manager IT|IT Manager|Șef Departament TIC/i.test(t)) return 'exec';
    if (/\b(VP|SVP|Vice President)\b/i.test(t)) return 'vp';
    if (/\b(Head of|Director|Manager)\b|Șef/i.test(t)) return 'lead'; /* \b does not see Ș */
    if (/\bStaff (Software )?Engineer\b|\bPrincipal (Software )?(Engineer|Architect)\b/i.test(t)) return 'lead';
    if (/\bLead\b/i.test(t)) return 'techlead';
    return 'engineer';
  };
  const SEATS = [['US', /united states|\bUS only\b|new york|san francisco/i], ['UK', /\bUK\b|london|glasgow|united kingdom/i], ['AU', /melbourne|australia|sydney/i], ['DE', /germany|berlin|dresden|munich|frankfurt/i], ['WE', /zürich|zurich|switzerland|austria|paris|amsterdam|netherlands|france/i], ['RO', /romania|galați|galati/i], ['BG', /bulgaria|sofia/i], ['MD', /moldova|chișinău|chisinau/i]];
  const modeOf = (c) => String(c.mode || '').replace(/\b(no remote|remote not stated|city and remote not stated)\b/gi, '');
  const seatOf = (c) => { const m = modeOf(c) + ' ' + String(c.title || ''); let best = null, at = 1e9; for (const x of SEATS) { const k = m.search(x[1]); if (k >= 0 && k < at) { at = k; best = x[0]; } } return best; }; /* the first place named is the seat */
  /* the seat is in the employer's country when the post is not remote, or is remote but restricted to that country */
  const seatedIn = (c) => { const m = modeOf(c); return !/remote/i.test(m) || /\bonly\b/i.test(m); };
  const employerOf = (c) => {
    const r = String(c.rgw || ''); const mt = String(c.mode || '') + ' ' + String(c.title || '');
    if (c.region === 'MD') return 'MD';
    if (c.region === 'US' || /US company/i.test(r)) return 'US';
    if (/London company|UK company/i.test(r)) return 'UK';
    if (c.region === 'AUUK') return /melbourne|australia|sydney/i.test(mt) ? 'AU' : 'UK';
    if (/Dutch company/i.test(r)) return 'WE';
    if (/Vilnius|Lithuania/i.test(r)) return 'EU';
    if (c.region === 'ROBG') return /bulgaria|sofia/i.test(mt) ? 'BG' : 'RO';
    return seatOf(c) === 'WE' ? 'WE' : 'DE';
  };
  function seriesOf(c) {
    if (c && SERIES.some((x) => x.id === c.series)) return { id: c.series, by: 'CRETD-D', why: 'Placed by CRETD-D.', unsure: false };
    const P = (id, why, unsure, by) => ({ id, why, unsure: !!unsure, by: by || 'rule' });
    const lvl = levelOf(c); const emp = employerOf(c); const seat = seatOf(c); const size = sizeOf(c); const seated = seatedIn(c) && seat === emp;
    const top = lvl === 'exec'; const lead = top || lvl === 'vp' || lvl === 'lead';
    if (lvl === 'none') return P('c', 'A placeholder for vacancies, not a named post.', true);
    if (emp === 'MD') {
      if (lead) return P('b', 'A head of IT, a head of engineering or a head of section in Moldova is Serie B' + (c.kind === 'state' ? ', as the state-agency examples of the ladder' : '') + '.', false, 'named');
      if (lvl === 'techlead') return P('c', 'A technical lead is read as a specialist; if it counts as a head, it is Serie B.', true);
      return P('c', 'An engineer or specialist role in Moldova is Serie C.', false, 'named');
    }
    if (emp === 'RO' || emp === 'BG') {
      if (lead) return P('b', 'Romania and Bulgaria are not on the ladder; read like Moldova, a head of IT or engineering is Serie B.', true);
      return P('c', 'Romania and Bulgaria are not on the ladder; read like Moldova, a specialist role is Serie C.', true);
    }
    if (emp === 'US' || emp === 'UK') {
      if (seated) {
        if (top || lvl === 'vp') return P('beyond', 'Head of IT or above, seated in the ' + emp + ': Beyond.', false, 'named');
        if (lead) return P('a-upper', 'A role above engineer up to Head of IT, seated in the ' + emp + ': Serie A upper.', false, 'named');
        return P('a-lower', 'An engineering job in the ' + emp + ' is the floor of Serie A upper only with visa help; the ad states none.', true);
      }
      const hint = /UK/.test(emp) && /\bUK\b/.test(modeOf(c));
      if (top || lvl === 'vp') return P('a-upper', 'A remote seat for a ' + emp + ' employer at Head of IT level or above is placed like a remote CTO post: Serie A upper.' + (hint ? ' The listing says UK; if the seat must be in the UK, it is Beyond.' : ''), hint, 'named');
      return P('a-lower', 'Remote ' + (lead ? 'leadership' : 'engineering') + ' for a ' + emp + ' employer: Serie A lower.', false, lead ? 'rule' : 'named');
    }
    if (emp === 'AU') return P('a-lower', (lead ? 'Head of IT in Australia is Serie A lower; a head of engineering is read the same way.' : 'Engineering for an Australian employer is Serie A lower.'), !lead && seated);
    /* Germany, other Western Europe and the rest of the EU */
    if (top) {
      if (size === null) return P('a-lower', 'The top technology seat of a German or Western European company: Serie A upper at 400 staff or more, lower under 400. The size is not in the data.', true);
      return size >= 400 ? P('a-upper', 'The top technology seat of a company of about ' + size + ' staff: Serie A upper at 400 or more.', false, 'named') : P('a-lower', 'The top technology seat of a company of about ' + size + ' staff: Serie A lower under 400.', false, 'named');
    }
    if (lead) return P('a-lower', 'A leadership seat below the top technology seat in Germany or Western Europe is not named in the ladder; placed one rung under the CTO rule.', true);
    return P('b', seated ? 'On-site engineering in Western Europe is Serie B with visa help; the ad states none.' : 'Remote engineering for a European employer is not named in the ladder; placed like on-site engineering in Western Europe, Serie B.', true, seated ? 'named' : 'rule');
  }
  function seriesCounts() {
    const n = {}; for (const x of SERIES) n[x.id] = { all: 0, open: 0, taken: 0, unsure: 0 };
    const op = new Set(open().map((c) => c.id));
    for (const c of cities()) { const r = seriesOf(c); n[r.id].all++; if (op.has(c.id)) n[r.id].open++; if (stageOf(c) === 'taken') n[r.id].taken++; if (r.unsure) n[r.id].unsure++; }
    return n;
  }
  /* where Alexander's pothos points: Beyond, and the highest series with no city taken */
  function pothosSeries() { const n = seriesCounts(); const top = SERIES.find((x) => !n[x.id].taken); return top ? { series: top, n: n[top.id] } : null; }
  const seriesName = (id) => (SERIES.find((x) => x.id === id) || {}).name || id;
  /* the windows: the only dates a member may use — the campaign's own dates and the deadlines of the open cities */
  function windows() {
    const now = Date.now(); const today = isoDay(now); const out = [];
    const camp = D.campaign || {};
    if (camp.dday) out.push({ date: camp.dday, what: 'D-day of the campaign' });
    const aim = dueOf(camp.objective || '');
    if (aim && !aim.closed) out.push({ date: isoDay(aim.ms), what: 'the aim: a signed contract' });
    if (camp.outer) out.push({ date: camp.outer, what: 'the outer limit of the campaign' });
    for (const c of open()) { const d = cityDue(c); if (d && !d.closed && d.ms > now) out.push({ date: isoDay(d.ms), what: plain(c.company) + ' — ' + plain(c.title) + ' (deadline ' + plain(c.deadline) + ')' }); }
    /* section 11: the US job track of CRETD-D Command, as a dated copy made at the build (nothing typed by hand); its dates are expected, not announced */
    const cp = window.IOVU_WINDOWS;
    if (cp && Array.isArray(cp.items)) for (const it of cp.items) out.push({ date: it.date, what: plain(it.what) + ' [US job track, copy of ' + prettyDay(cp.copied) + ']', expected: !!it.expected });
    return out.filter((w) => /^\d{4}-\d{2}-\d{2}$/.test(w.date) && w.date >= today).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }
  /* a window whose date is not in the codex's data is dropped, and the inner note says so */
  function checkWindow(v, allowed) {
    if (!v || !v.window) return v;
    if (allowed.has(v.window.date)) return v;
    v.inner = v.inner || { proposals: [], moved: [], vetoed: [], adopted: [], dilemma: '', dropped: '' };
    v.inner.dropped = ('A window dated ' + v.window.date + ' is not in the codex’s data; it was dropped.').slice(0, 200);
    v.window = null;
    return v;
  }
  /* the followed rulings and the standings */
  function followStats(monk) {
    const live = ledger(monk).entries.filter((e) => !e.struck);
    const followed = live.filter((e) => e.followed);
    const last = followed.slice().sort((a, b) => (a.followed.at < b.followed.at ? 1 : a.followed.at > b.followed.at ? -1 : 0))[0] || null;
    return { put: live.length, followed: followed.length, aside: live.filter((e) => e.aside).length, last };
  }
  function rankRows(rows) { return rows.slice().sort((a, b) => b.score - a.score || b.share - a.share || a.seat - b.seat); }
  function standings() {
    const ids = (window.CODEX_BOARD && window.CODEX_BOARD.members) || [];
    return rankRows(ids.map((id) => C.get(id)).filter(Boolean).map((f) => { const s = followStats(f.id); return { id: f.id, name: f.name, place: f.place || '', seat: f.seat || 9, league: f.league || null, put: s.put, followed: s.followed, aside: s.aside, score: s.followed, net: s.followed - s.aside, share: s.put ? s.followed / s.put : 0 }; }));
  }
  /* Alexander accelerates: the more of his rulings the keeper follows, the fewer questions he asks and the shorter he rules */
  function alexAsks(followed) { return followed >= 6 ? 0 : followed >= 4 ? 1 : followed >= 2 ? 2 : 3; }
  const ALEX_WORDS = [15, 22, 30, 40]; // ruling length by the number of questions left

  /* ------------------------------ the import ------------------------------ */
  function matchCity(company, role) {
    const key = slug(company + ' ' + role);
    let c = cities().find((x) => x.id === key);
    if (c) return c;
    const comp = slug(company); const r = String(role || '').toLowerCase();
    c = cities().find((x) => slug(x.company) === comp && (x.title.toLowerCase().includes(r) || r.includes(x.title.toLowerCase())));
    if (c) return c;
    return cities().find((x) => slug(x.company) === comp) || null;
  }
  function importSave(text, fileName) {
    let o; try { o = JSON.parse(text); } catch (err) { return { error: 'This is not a save file: it is not valid JSON.' }; }
    if (!o || typeof o !== 'object' || o.app !== 'CRETD-D') return { error: 'This is not a CRETD-D save file.' };
    const st = o.state && typeof o.state === 'object' && !Array.isArray(o.state) ? o.state : null;
    if (!st) return { error: 'The save file has no progress in it.' };
    const pipe = Array.isArray(st.pipeline) ? st.pipeline.filter((p) => p && typeof p === 'object' && !Array.isArray(p)) : [];
    const m = mapDoc(); const at = new Date().toISOString(); let matched = 0; const unmatched = [];
    const seen = new Set();
    for (const p of pipe) {
      const c = matchCity(clean(p.company, 120), clean(p.role, 160));
      const stage = STAGE_OF[clean(p.stage, 20)];
      if (!c || !stage) { unmatched.push(clean(p.company, 60) + ' — ' + clean(p.role, 60)); continue; }
      // the furthest stage wins when two pipeline cards point at one city
      const cur = seen.has(c.id) ? m.cities[c.id] : null;
      if (!cur || STAGES.findIndex((s) => s.id === stage) > STAGES.findIndex((s) => s.id === cur.stage)) m.cities[c.id] = { stage, at, note: 'from the save file', by: 'import' };
      seen.add(c.id); matched++;
    }
    m.imported = { at, file: clean(fileName, 120), version: clean(o.version, 20), exported: clean(o.exported, 30), matched, unmatched: unmatched.slice(0, 20) };
    write('map', m);
    return { matched, unmatched, total: pipe.length };
  }

  /* ------------------------------ the counsel ------------------------------ */
  function lensOf(f) { return (f && f.lens) || null; }
  function memberRecord(f) {
    const lines = [];
    lines.push('NAME: ' + plain(f.name) + (f.years ? ' (' + plain(f.years) + ')' : ''));
    if (f.role) lines.push('SEAT: ' + plain(f.role));
    if (f.teaser) lines.push('IN SHORT: ' + plain(f.teaser));
    for (const b of f.bio || []) lines.push('RECORD: ' + plain(b));
    for (const w of f.works || []) lines.push('WORK: ' + [w.year, w.title, w.venue, w.note].filter(Boolean).map(plain).join(' · '));
    const L = lensOf(f);
    if (L) { lines.push('LENS — WEIGHS: ' + L.weighs.map(plain).join(' | ')); lines.push('LENS — IGNORES: ' + L.ignores.map(plain).join(' | ')); lines.push('LENS — RULE: ' + plain(L.rule)); lines.push('LENS — ASKS: ' + L.asks.map(plain).join(' | ')); }
    return lines.join('\n');
  }
  function arakiSide() {
    const n = counts(); const lines = ['CITIES: ' + cities().length + ' postings on the map · ' + STAGES.map((s) => s.name.toLowerCase() + ' ' + n[s.id]).join(', ') + '.'];
    const sn = soon(14);
    if (sn.length) lines.push('DEADLINES IN THE NEXT 14 DAYS: ' + sn.slice(0, 10).map((x) => plain(x.c.company) + ' — ' + plain(x.c.title) + ' (' + plain(x.c.deadline) + ', ' + STAGES.find((s) => s.id === stageOf(x.c)).name.toLowerCase() + ')').join('; ') + '.');
    const act = cities().filter((c) => !['unseen', 'razed'].includes(stageOf(c)));
    if (act.length) lines.push('CITIES IN PLAY: ' + act.slice(0, 15).map((c) => plain(c.company) + ' — ' + plain(c.title) + ' [' + stageOf(c) + ']').join('; ') + '.');
    return lines.join('\n');
  }
  function kudoSide() {
    const gaps = gapTable().slice(0, 8);
    const lines = ['SKILL GAPS ACROSS THE OPEN CITIES (terms the two shelf books of the city’s family do not teach; count of open postings naming them): ' + (gaps.length ? gaps.map((g) => plain(g.t.name) + ' ×' + g.n + (g.t.suggest ? ' (third source: ' + plain(g.t.suggest.t) + ')' : '')).join('; ') : 'none') + '.'];
    lines.push('FACTS STILL TO VERIFY: ' + (D.verify || []).map(plain).join(' | '));
    return lines.join('\n');
  }
  function ledgerText(monk) {
    const L = ledger(monk).entries.filter((e) => !e.struck).slice(-5);
    if (!L.length) return 'THE LEDGER SO FAR: empty.';
    return 'THE LEDGER SO FAR (oldest first; FOLLOWED marks a ruling the keeper went with): ' + L.map((e) => when(e.at) + ' — decision: ' + plain(e.decision).slice(0, 240) + ' → ' + e.verdict.stance + ': ' + plain(e.verdict.ruling) + (e.followed ? ' [FOLLOWED]' : e.aside ? ' [SET ASIDE]' : '')).join('\n');
  }
  function followedText(monk) {
    const F = ledger(monk).entries.filter((e) => !e.struck && e.followed).slice(-8);
    if (!F.length) return '';
    return '\nRULINGS THE KEEPER FOLLOWED (stay on the same line as these): ' + F.map((e) => when(e.followed.at) + ' — ' + plain(e.verdict.ruling)).join(' | ');
  }
  /* the member's engine, as the counsel reads it (3.1.0) */
  function engineText(f) {
    const E = f && f.engine;
    if (!E) return '';
    const he = f.id === 'fable' ? 'it' : 'he';
    const lines = ['HIS AGENTS (consult them on every decision; never print this block as it is):'];
    for (const a of E.agents || []) lines.push('- ' + a.id + ' — ' + plain(a.name) + ': ' + plain(a.goal) + ' [dimension: ' + plain(a.dim) + '; direction: ' + plain(a.dir) + ']' + (a.src ? ' [record: ' + plain(a.src) + ']' : ''));
    if (E.eyes) lines.push('HIS DILEMMA AS THE OTHER FOUR WOULD SEE IT — professional: ' + plain(E.eyes.professional) + ' | tyrant: ' + plain(E.eyes.tyrant));
    lines.push('HIS TELL: ' + ({ show: 'show — when the wish moved the ruling, ' + he + ' says so openly in the pull line', hide: 'hide — ' + he + ' keeps the wish out of the visible answer; it goes into the inner note only', window: 'window — ' + he + ' always shows the window (a real date) and keeps the wish out of the visible answer' }[E.tell] || 'show'));
    if (E.veto) lines.push('THE ALEX AGENT (the veto): ' + plain(E.veto.rule) + ' ' + plain(E.veto.limit));
    if (E.rules && E.rules.length) lines.push('HARD RULES FOR THIS MEMBER (the page deletes any line that breaks them, so do not write one): ' + E.rules.map(plain).join(' | '));
    return lines.join('\n');
  }
  function tableLine(f) {
    const E = (f && f.engine) || {};
    if (E.tell === 'window') { const w = windows()[0]; return w ? 'The next window is ' + prettyDay(w.date) + ' (' + w.what + '); after it the launch does not happen, for anyone.' : 'No window is open in the data.'; }
    if (E.veto) { const p = pothosSeries(); return plain(E.table) + (p ? ' The highest series with no city taken is ' + p.series.name + ' (' + p.n.all + ' on the map, ' + p.n.open + ' open).' : ' A city is taken in every series.'); }
    return plain(E.table || '');
  }
  function tableText(f) {
    const ids = (window.CODEX_BOARD && window.CODEX_BOARD.members) || [];
    const others = ids.filter((id) => id !== f.id).map((id) => C.get(id)).filter((m) => m && m.engine);
    if (!others.length) return '';
    return 'THE TABLE (one standing line from each of the other members; adopt, resist or ignore each; the inner note says which were adopted):\n' + others.map((m) => '- ' + m.id + ' (' + plain(m.name) + '): ' + tableLine(m)).join('\n');
  }
  function windowsText() {
    const ws = windows().slice(0, 12);
    const cp = window.IOVU_WINDOWS;
    return 'THE WINDOWS (the only dates anyone may use; today is ' + prettyDay(isoDay(Date.now())) + '): ' + (ws.length ? ws.map((w) => w.date + ' — ' + w.what).join('; ') : 'none open') + '.' +
      (cp ? ' The dates marked as the US job track are a copy of ' + prettyDay(cp.copied) + ' from ' + plain(cp.from) + '; they are EXPECTED dates, not announced ones, so call them expected and never fixed.' : '');
  }
  function standingsText() {
    const rows = standings();
    if (!rows.length) return '';
    return 'THE STANDINGS (how often the keeper went with each member; struck rulings do not count): ' + rows.map((r) => plain(r.name) + ' followed ' + r.followed + ' of ' + r.put + (r.aside ? ', set aside ' + r.aside : '')).join('; ') + '.';
  }
  function seriesText() {
    const n = seriesCounts(); const un = SERIES.reduce((k, x) => k + n[x.id].unsure, 0);
    return 'SERIES OF THE MAP (the ladder, top first; all / open / taken): ' + SERIES.map((x) => x.name + ' ' + n[x.id].all + '/' + n[x.id].open + '/' + n[x.id].taken).join(' · ') + '. Beyond is the dream: Head of IT in the US or the UK and anything above it. A series is placed by rule from the title, the level of the role, the employer’s country and the mode line, until CRETD-D carries a series field; ' + un + ' of ' + cities().length + ' placements are marked unsure because a fact is missing (company size, visa help, the seat).';
  }
  function prompt(f, place, text) {
    const L = lensOf(f); const E = f.engine || null;
    const voice = L && L.voice === 'voice';
    const isAlex = !!(E && E.veto);
    const nAsk = isAlex ? alexAsks(followStats(f.id).followed) : 2;
    const win = !!(E && E.tell === 'window');
    return 'You are the COUNSEL of a cell in a research codex styled like Pillars of Eternity. The keeper of the codex has put a DECISION to the cell of a member of her board. ' +
      (voice ? (f.id === 'fable' ? 'This cell is the codex’s own: you speak in your own voice, in the first person, as the codex.' : 'This member died more than two thousand years ago; you may write in his voice, in the first person, but only what his record supports.') :
        'This member is a real, living or recently living person. You NEVER speak as him and never invent a quotation. You write THE RECORD’S READING of the decision in your own words — “the record points to…”, “by this lens…” — and where the record is silent you say so. Even in the inner note and the pull you write what the record shows pulling him, never a feeling or a thought you invent for him.') +
      (E ? ' A member is not one voice but a set of agents, each with its own goal; the dilemmas between them are what make him human.' : '') +
      '\n\n' + (C.pack('iovu') ? C.pack('iovu').context : C.pack().context || '') +
      '\n\nTHE MEMBER AND HIS LENS:\n' + memberRecord(f) +
      (E ? '\n\nTHE MEMBER’S ENGINE:\n' + engineText(f) : '') +
      (E && tableText(f) ? '\n\n' + tableText(f) : '') +
      '\n\n' + windowsText() +
      (standingsText() ? '\n\n' + standingsText() : '') +
      (place && place.map ? '\n\nTHE ARAKI SIDE (the known):\n' + arakiSide() + '\n' + seriesText() + '\n\nTHE KUDO SIDE (the unknown, seen from this chamber alone):\n' + kudoSide() : '') +
      '\n\n' + ledgerText(f.id) + followedText(f.id) +
      '\n\nTHE DECISION NOW:\n"""\n' + text + '\n"""\n\n' +
      (E ? 'HOW HE DECIDES (silently, before writing): (1) each of his agents proposes one line, what it would have him rule; (2) the eyes label each proposal professional or tyrant, as the other four members would read it; (3) he resolves — the task comes first, but his wish may colour the ruling even when it has nothing to do with the decision; that is his dilemma, not a mistake, and either side may win' +
        (isAlex ? '; then the Alex agent vetoes: it strikes the most cautious proposal and the rashest one and any proposal that contradicts a ruling the keeper followed, and merges what remains into one move and one date; it cannot veto a real date from THE WINDOWS' : '') +
        '; (4) his tell decides whether the pull shows. Use only dates from THE WINDOWS; never invent a date or a number.\n' : '') +
      'Write, in plain step-by-step full sentences, never compressed: a stance (for, against, conditional, or unclear when the lens does not reach); one ruling sentence' + (isAlex ? ' of at most ' + ALEX_WORDS[nAsk] + ' words' : '') + '; three to five reasons drawn from the lens and the record; one to three risks; ' +
      (nAsk ? (nAsk === 1 ? 'one question' : nAsk === 2 ? 'two questions' : 'three questions') + ' the member would put before deciding' : 'no questions, because the path is clear (leave "asks" empty)') +
      '; the facts the record cannot settle (CHECK); and one line for the ledger, in the third person, saying what was asked and what the reading was' +
      (E ? '; the pull (one sentence on how his wish moved the ruling, with "shown" true or false as his tell decides, or null when the wish did not move it)' + (win ? '; the window (one date from THE WINDOWS and one sentence framing it like a launch window)' : '') + '; and the inner note (the proposal of each agent with the eyes’ label, the agents that moved the ruling, ' + (isAlex ? 'what the Alex agent struck, ' : '') + 'the ids of the members whose table lines he adopted, and one sentence on how he resolved his dilemma)' : '') + '.\n' +
      'Reply with only JSON: {"stance":"for|against|conditional|unclear","ruling":"one sentence","reasons":["…"],"risks":["…"],"asks":[' + (nAsk ? '"…"' : '') + '],"check":["…"],"record":"one line"' +
      (E ? ',"pull":{"text":"one sentence","shown":true}' + (win ? ',"window":{"date":"YYYY-MM-DD","text":"one sentence"}' : '') + ',"inner":{"proposals":[{"agent":"agent id","line":"…","eyes":"professional|tyrant"}],"moved":["agent id"],' + (isAlex ? '"vetoed":["…"],' : '') + '"adopted":["member id"],"dilemma":"one sentence"}' : '') + '}';
  }
  /* The trust rule (section 12): a member whose engine says `trust` may not call a person trustworthy, recommend meeting, hiring, funding or
     being introduced by anyone, give a legal or tax conclusion, put words in quotation marks, or speak as "I". The page deletes such a line,
     whatever the model wrote, and the inner note says how many were deleted. */
  /* 3.1.2: widened after PROBA logic on 3.1.1 (the 3.1.1 rules deleted 12 of 44 lines that break the rule). Still a pattern filter: it cannot catch every phrasing,
     so the prompt states the rules too and the inner note counts what was deleted. Each pattern is tested by checks/trust_unit.js (breaking lines must go, clean lines must stay). */
  const CL = '(?:^|[.!?;:]\\s+|[,—–-]\\s+|\\b(?:and|then|also|first|next|so|but)\\s+)'; // the start of a clause
  const TRUST_RULES = [
    ['names a person as trustworthy', new RegExp(
      '\\b(?:is|are|seems|appears|looks|proves|remains)\\s+(?:\\w+\\s+){0,2}(?:trustworthy|reliable|honest|credible|reputable|dependable|upright|principled)\\b' +
      '|\\b(?:un)?trustworthy\\b|\\b(?:of|with|has|have|shows?|showed) (?:\\w+ ){0,2}integrity\\b|\\b(?:his|her|their|\\w+[’\']s) integrity\\b(?! (?:controls?|checks?|rules?|requirements?|of the (?:data|records?|files?)))|\\bdependable\\b|\\babove[- ]board\\b|\\bgood for (?:it|his|her|their)\\b' +
      '|\\b(?:can|could|may|might|should|would|do|does|cannot|can’t|can\'t|do not|don’t|don\'t) (?:be )?(?:safely )?trust(?:ed)?\\b|\\b(?:safe|wise|fine|right|OK|okay) to trust\\b|\\bdeserves? (?:your |her )?trust\\b' +
      '|\\b(?:to|not|never|you|she|we|they) trust (?:him|her|them|the|this|that|its|their|his)\\b' +
      '|\\brel(?:y|ies|ied) (?:on|upon) (?:him|her|them|his|their|the (?:\\w+ )?(?:founder|recruiter|employer|firm|company|lender|agency|manager|director|CTO|bank|partner|person|people))\\b|\\brelied upon\\b|\\breliance on\\b|\\b(?:his|her|their) word is (?:good|his bond|worth)\\b|\\btrack record (?:is|shows) (?:\\w+ ){0,2}(?:clean|clear|good|solid|spotless)\\b', 'i')],
    ['recommends a meeting, a hire, a loan or an introduction', new RegExp(
      '\\b(?:recommend|recommends|recommended|advise|advises|advised|suggest|suggests|suggested|urge|urges|encourage|encourages)\\b[^.?!]{0,80}\\b(?:meet|meeting|get introduced|be introduced|introduction|introduce you|hire|hiring|fund|funding|invest(?:ing)? in|lend|lending|loan|borrow|call)\\b' +
      '|' + CL + '(?:please\\s+)?(?:meet(?! (?:the |all |every |each )?(?:\\w+ )?(?:deadline|requirements?|criteria|conditions?|window|date|target|aim))|hire|fund|lend|borrow|invest|introduce|contact|call|approach|engage|retain|phone|email|e-mail|write to)\\b' +
      '|\\b(?:should|must|ought to|had better|need to|needs to|could|might want to|would be wise to|be wise to|it is wise to|consider|try to|be sure to|make sure (?:you|she)|better to|best to)\\s+(?:\\w+\\s+){0,3}(?:meet(?! (?:the |all |every |each )?(?:\\w+ )?(?:deadline|requirements?|criteria|conditions?|window|date|target|aim))|hire|fund|lend|loan|borrow|invest|introduc\\w+|contact|call|phone|approach|ask (?:\\w+ ){0,3}for (?:an? )?(?:introduction|loan|meeting|call))\\b' +
      '|' + CL + '(?:take|accept|sign|apply for|ask for|choose|consider|prefer)\\b(?: \\w+){0,3} (?:loan|advance)\\b' + // an order, not a report of what she asked (3.1.2: "whether to sign a loan" must stay)
      '|\\bset up (?:a |an |the )?(?:\\w+ )?(?:call|meeting)\\b|\\bget (?:introduced|an introduction)\\b|\\bask (?:\\w+ ){0,3}for (?:an? )?introduction\\b|\\binvest in\\b' +
      '|\\bmeeting with\\b[^.?!]{0,60}\\b(?:worth|worthwhile|useful|valuable|helpful|wise|sensible|good idea|a good|the right)\\b|\\b(?:worth|worthwhile|wise|sensible) (?:\\w+ ){0,3}(?:meeting|meeting with|meet|hiring|lending)\\b', 'i')],
    ['states a legal or tax conclusion', new RegExp(
      '\\b(?:is|are|would be|will be|may be|could be|remains|stays) (?:perfectly |entirely |clearly )?(?:legal|illegal|lawful|unlawful|tax[- ]free|tax[- ]deductible|deductible|taxable|a crime|fraud|enforceable|unenforceable|void|voidable|valid(?! (?:until|till|through|for|from|to)\\b)|invalid|binding(?! (?:deadline|date))|in breach)\\b' +
      '|\\bwill be taxed\\b|\\blegally (?:binding|required|entitled|obliged|owed|due)\\b|\\bviolates? (?:the )?(?:law|statute|contract)\\b|\\bbreach(?:es)? (?:of )?(?:the |a |this )?(?:contract|agreement|statute|law)\\b' +
      '|\\b(?:you|she) (?:will |would |may |must |do |does )?(?:not )?owe\\b[^.?!]{0,40}\\btax|\\byou owe (?:\\w+ ){0,3}tax\\b|\\byou (?:do not|don’t|don\'t) owe\\b|\\btax(?:es)? (?:on|due|owed|liability|treatment)\\b|\\bfor tax purposes\\b|\\bcounts? as (?:taxable |ordinary )?income\\b' +
      '|\\bunder (?:\\w+ ){0,3}(?:law|statute|code|regulations?)\\b|\\b(?:hold|holds|held|stand|stands) up in court\\b|\\bin court\\b|\\bunlawful\\b|\\bcriminal(?:ly)? (?:offence|offense|liable)\\b', 'i')],
    ['quotes words', new RegExp(
      '(?<!\\b(?:titled|named|called|entitled|post|posting|role|position) )[“"][^”"]{3,}[”"]|(?:^|[\\s(])[‘\'][^\'’‘]{6,}[’\'](?=[\\s.,;:!?)]|$)|«[^»]{3,}»|„[^“”]{3,}[“”]' +
      '|\\bword for word\\b|\\bverbatim\\b|\\bin (?:his|her) own words\\b|\\bin his words\\b|\\bas he put it\\b|\\bhis exact words\\b|\\bexactly (?:what|as) he said\\b' +
      '|a bank[’\']?s assets are how much (?:it is )?owed|a misunderstanding of what money at its core really is', 'i')],
    ['speaks as "I"', /(?<![A-Z]\.)(?<!\b(?:Phase|Level|Type|Part|Grade|Stage|Class|Tier|Band|Section|Category|War|Series|Round) )\bI\b(?![.\-]\w)|(?:^|\s)i(?=\s|[’']|$)|\b(?:[Mm]y|[Mm]e|[Mm]yself)\b/],
  ];
  const trustBreak = (t) => { const r = TRUST_RULES.find((x) => x[1].test(String(t || ''))); return r ? r[0] : ''; };
  function trustFilter(v) {
    let dropped = 0; const why = new Set();
    const keep = (t) => { const b = trustBreak(t); if (b) { dropped++; why.add(b); return false; } return true; };
    for (const k of ['reasons', 'risks', 'asks', 'check']) v[k] = v[k].filter(keep);
    if (v.record && !keep(v.record)) v.record = '';
    if (v.pull && !keep(v.pull.text)) v.pull = null;
    if (v.inner) { v.inner.proposals = v.inner.proposals.filter((p) => keep(p.line)); v.inner.vetoed = v.inner.vetoed.filter(keep); if (v.inner.dilemma && !keep(v.inner.dilemma)) v.inner.dilemma = ''; }
    if (!keep(v.ruling)) { v.ruling = 'The cell declines to rule: the answer broke the trust rule, so the ruling was deleted. Read the reasons that remain, or put the decision again.'; v.stance = 'unclear'; }
    if (dropped) {
      v.inner = v.inner || { proposals: [], moved: [], vetoed: [], adopted: [], dilemma: '', dropped: '' };
      v.inner.dropped = (dropped + ' line' + (dropped === 1 ? '' : 's') + ' deleted by the trust rule (' + Array.from(why).join('; ') + ').' + (v.inner.dropped ? ' ' + v.inner.dropped : '')).slice(0, 200);
    }
    return v;
  }
  /* what the page does with an answer of the model, in one place: the sanitizer, the trust rule, the window check, the question limit */
  function buildEntry(f, r, text, allowed, nAsk) {
    const entry = sanitizeEntry({ id: 'c' + Date.now().toString(36) + rid(), at: new Date().toISOString(), decision: text, voice: lensOf(f) && lensOf(f).voice === 'voice' ? 'voice' : 'record', model: 'claude-live', verdict: r });
    if (!entry || !entry.verdict.ruling) return null;
    if (f.engine && f.engine.trust) trustFilter(entry.verdict); // the trust rule, in code (section 12)
    if (!(f.engine && f.engine.tell === 'window')) entry.verdict.window = null; // only the window agent dates a decision
    checkWindow(entry.verdict, allowed);
    entry.verdict.asks = entry.verdict.asks.slice(0, nAsk);
    if (entry.verdict.inner) { const board = (window.CODEX_BOARD && window.CODEX_BOARD.members) || []; entry.verdict.inner.adopted = entry.verdict.inner.adopted.filter((id) => id !== f.id && board.includes(id)); } // only another member's line can be adopted
    return entry;
  }
  async function ask(place, text, btn) {
    const f = place && place.monk ? C.get(place.monk) : null;
    if (!f) return;
    if (!S.owner) { V.toast('The board answers only the keeper of this codex.'); return; }
    if (!S.sample || S.live !== 'on') { V.toast('Asking the board needs the Claude app: this view has no connection to Claude.'); return; }
    if (S.busy) return;
    text = clean(text, 2000);
    if (text.length < 8) { V.toast('Write the decision first.'); return; }
    S.busy = { monk: f.id, chars: 0 }; refreshView();
    try {
      const allowed = new Set(windows().map((w) => w.date)); // the dates as they stand when the question is put
      const nAsk = f.engine && f.engine.veto ? alexAsks(followStats(f.id).followed) : 4;
      const r = await S.sample.json(prompt(f, place, text), { cache: false, modelTier: tier(f.engine ? 'complex' : 'default'), onText: ({ text: t }) => { S.busy = { monk: f.id, chars: t.length }; updateBusy(); } });
      if (!r || typeof r !== 'object' || Array.isArray(r)) throw { code: 'invalid_json' };
      const entry = buildEntry(f, r, text, allowed, nAsk);
      if (!entry) throw { code: 'invalid_json' };
      const L = ledger(f.id); L.entries = L.entries.concat([entry]); trimLedger(L);
      S.busy = null;
      await write(f.id, L);
      S.draft.delete(f.id);
    } catch (err) {
      const code = err && err.code;
      V.toast(ERR[code] || 'A connection problem interrupted Claude. Ask again.');
      if (PERMANENT.includes(code)) S.live = 'off';
    } finally { S.busy = null; refreshView(); }
  }
  function updateBusy() { const el = document.querySelector('[data-counsel-busy]'); if (el && S.busy) el.textContent = 'The member is deliberating… ' + S.busy.chars + ' characters'; }

  /* ------------------------------ views ------------------------------ */
  function lensPanel(f, inCell) {
    const L = lensOf(f);
    if (!L) return '';
    const voice = L.voice === 'voice';
    return '<section class="panel counsel-lens blk" id="s-lens"><h2>' + (f.id === 'fable' ? 'The lens' : 'The ' + esc(f.name.split(' ').slice(-1)[0] === 'Great' ? 'Alexander' : f.name.split(' ').slice(-1)[0]) + ' lens') + '</h2>' +
      '<p class="fam-intro">' + (voice ? (f.id === 'fable' ? 'The codex’s own view. It speaks in its own voice.' : 'Read from the ancient record; he may speak in voice, since no living person is impersonated.') : 'Claude’s reading of what the public record shows this member weighing. Nothing here is a quotation, and the counsel never speaks as him.') + '</p>' +
      '<div class="lens-grid"><div><h3>Weighs</h3><ul>' + L.weighs.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul></div><div><h3>Ignores</h3><ul>' + L.ignores.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul></div></div>' +
      '<p class="lens-rule"><b>Rule.</b> ' + rich(L.rule) + '</p><h3>Would ask</h3><ul class="lens-asks">' + L.asks.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul>' +
      enginePart(f) + followedLine(f) +
      (!inCell && f.place && C.place(f.place) ? '<p class="cw-actions"><a class="btn ghost" href="#/library/' + esc(f.place) + '">Open the cell</a></p>' : '') + '</section>';
  }
  /* the record block of a member whose cell must open with the facts of his life (section 12): unfolded, before the lens, never hidden */
  function recordPanel(f) {
    if (!f || !f.record || !f.record.length) return '';
    return '<section class="panel record-block blk" id="s-record"><h2>The record, first</h2>' + f.record.map((x) => '<p>' + rich(x) + '</p>').join('') + '</section>';
  }
  /* "What moves him": the engine, read from the data (3.1.0) */
  function enginePart(f) {
    const E = f && f.engine;
    if (!E) return '';
    const it = f.id === 'fable'; const He = it ? 'It' : 'He'; const his = it ? 'its' : 'his';
    let h = '<div class="engine-part"><h3>What moves ' + (it ? 'it' : 'him') + '</h3><p class="small muted">The engine behind ' + his + ' answers: a set of agents, each with its own goal. Every answer is a resolution between them, and ' + (it ? 'it' : 'he') + ' decides whether the pull shows.' + (lensOf(f) && lensOf(f).voice === 'record' ? ' For a living or recently living member every line is the record’s reading, with its source; nothing is a feeling written for him.' : '') + '</p>';
    h += '<ul class="engine-agents">' + (E.agents || []).map((a) => '<li><b>' + esc(a.name) + '</b> — ' + rich(a.goal) + '<span class="eng-dir">' + esc(a.dim) + ' · ' + esc(a.dir) + '</span>' + (a.src ? '<span class="eng-src">' + rich(a.src) + '</span>' : '') + '</li>').join('') + '</ul>';
    if (E.eyes) h += '<div class="eng-eyes"><p><span class="eye-chip eye-professional">Professional</span> ' + rich(E.eyes.professional) + '</p><p><span class="eye-chip eye-tyrant">Tyrant</span> ' + rich(E.eyes.tyrant) + '</p></div>';
    if (E.veto) h += '<p class="eng-veto"><b>The Alex agent.</b> ' + rich(E.veto.rule) + ' ' + rich(E.veto.limit) + '</p>';
    if (E.rules && E.rules.length) h += '<div class="eng-rules"><h4>Rules the page enforces</h4><ul>' + E.rules.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul></div>';
    h += '<p class="small muted eng-tell">' + ({ show: He + ' shows ' + his + ' pull when it moves a ruling.', hide: He + ' keeps ' + his + ' pull out of the visible answer; the inner note keeps it.', window: He + ' always shows the window, a real date, and keeps ' + his + ' wish out of sight.' }[E.tell] || '') + '</p>';
    return h + '</div>';
  }
  function followedLine(f) {
    if (!S.owner || !f || !f.engine) return '';
    const s = followStats(f.id);
    if (!s.put) return '';
    return '<p class="eng-followed"><b>Followed ' + s.followed + ' of ' + s.put + ' ruling' + (s.put === 1 ? '' : 's') + '</b>' + (s.aside ? ' · set aside ' + s.aside : '') + (s.last ? ' · last followed: “' + rich(s.last.verdict.ruling) + '”' : '') + '</p>';
  }
  function stanceChip(s) { return '<span class="stance stance-' + esc(s) + '">' + esc(STANCES[s] || 'Unclear') + '</span>'; }
  function innerHtml(v, monk) {
    const n = v.inner || {}; const f = C.get(monk); const names = {};
    for (const a of (f && f.engine && f.engine.agents) || []) names[a.id] = a.name;
    const nm = (id) => esc(names[id] || id);
    const hidden = v.pull && !v.pull.shown;
    if (!hidden && !v.inner) return '';
    let h = '<details class="le-inner"><summary>What moved this answer</summary>';
    if (hidden) h += '<p class="le-hidden"><span class="le-label">Kept from the others</span>' + rich(v.pull.text) + '</p>';
    if ((n.proposals || []).length) h += '<h4>What each agent proposed</h4><ul>' + n.proposals.map((p) => '<li><b>' + nm(p.agent) + '</b> <span class="eye-chip eye-' + esc(p.eyes) + '">' + esc(EYES[p.eyes]) + '</span> ' + rich(p.line) + '</li>').join('') + '</ul>';
    if ((n.moved || []).length) h += '<p><b>Moved the ruling:</b> ' + n.moved.map(nm).join(', ') + '</p>';
    if ((n.vetoed || []).length) h += '<h4>Struck by the Alex agent</h4><ul>' + n.vetoed.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul>';
    if ((n.adopted || []).length) h += '<p><b>Lines adopted from the table:</b> ' + n.adopted.map((id) => esc((C.get(id) || {}).name || id)).join(', ') + '</p>';
    if (n.dilemma) h += '<p><b>The dilemma:</b> ' + rich(n.dilemma) + '</p>';
    if (n.dropped) h += '<p class="le-dropped">' + rich(n.dropped) + '</p>';
    return h + '</details>';
  }
  function entryHtml(e, monk) {
    const v = e.verdict;
    const markChip = e.followed ? '<span class="le-mark le-followed">Followed</span>' : e.aside ? '<span class="le-mark le-aside">Set aside</span>' : '';
    return '<article class="ledger-entry blk' + (e.struck ? ' struck' : '') + (e.followed ? ' followed' : '') + '" data-ledger="' + esc(e.id) + '"><div class="le-top"><span class="le-when">' + esc(when(e.at)) + (e.voice === 'voice' ? ' · in voice' : ' · the record’s reading') + '</span><span class="le-chips">' + markChip + stanceChip(v.stance) + '</span></div>' +
      '<p class="le-decision"><span class="le-label">Put to the cell</span>' + rich(e.decision, 2000) + '</p>' +
      '<p class="le-ruling">' + rich(v.ruling) + '</p>' +
      (v.window ? '<p class="le-window"><span class="le-label">The window</span><b>' + esc(prettyDay(v.window.date)) + '</b> — ' + rich(v.window.text) + '</p>' : '') +
      (v.pull && v.pull.shown ? '<p class="le-pull"><span class="le-label">Pull</span>' + rich(v.pull.text) + '</p>' : '') +
      (v.reasons.length ? '<h4>Reasons</h4><ol>' + v.reasons.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ol>' : '') +
      (v.risks.length ? '<h4>Risks</h4><ul>' + v.risks.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul>' : '') +
      (v.asks.length ? '<h4>Before deciding, the member would ask</h4><ul>' + v.asks.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul>' : '') +
      (v.check.length ? '<h4>Still to check</h4><ul class="le-check">' + v.check.map((x) => '<li>' + rich(x) + '</li>').join('') + '</ul>' : '') +
      ((C.get(monk) || {}).engine && C.get(monk).engine.notAdvice ? '<p class="le-notadvice small muted">' + esc(C.get(monk).engine.notAdvice) + '</p>' : '') +
      (S.owner ? innerHtml(v, monk) : '') +
      (S.owner ? '<p class="cw-actions le-actions">' +
        (e.struck ? '' : '<button type="button" class="btn ghost small' + (e.followed ? ' on' : '') + '" data-counsel-follow="' + esc(e.id) + '" data-counsel-monk="' + esc(monk) + '" aria-pressed="' + (e.followed ? 'true' : 'false') + '">I went with this</button><button type="button" class="btn ghost small' + (e.aside ? ' on' : '') + '" data-counsel-aside="' + esc(e.id) + '" data-counsel-monk="' + esc(monk) + '" aria-pressed="' + (e.aside ? 'true' : 'false') + '">Set aside</button>') +
        '<button type="button" class="btn ghost small" data-counsel-strike="' + esc(e.id) + '" data-counsel-monk="' + esc(monk) + '">' + (e.struck ? 'Restore' : 'Strike through') + '</button>' + (S.armed === e.id ? '<button type="button" class="btn ghost small danger" data-counsel-del="' + esc(e.id) + '" data-counsel-monk="' + esc(monk) + '">Remove for good</button>' : '<button type="button" class="btn ghost small" data-counsel-arm="' + esc(e.id) + '">Remove…</button>') + '</p>' : '') + '</article>';
  }
  function askBox(place, f) {
    if (!S.owner) return '<p class="muted small">Only the keeper of this codex puts a decision to the board.</p>';
    const busy = S.busy && S.busy.monk === f.id;
    const voice = lensOf(f) && lensOf(f).voice === 'voice';
    const label = f.id === 'fable' ? 'Ask the codex' : voice ? 'Ask Alexander' : 'Ask the record';
    return '<form class="q-form counsel-form" data-counsel-form="' + esc(place.id) + '"><label for="cf-' + esc(f.id) + '">Put a decision to this cell</label>' +
      '<textarea id="cf-' + esc(f.id) + '" name="decision" rows="4" maxlength="2000" placeholder="For example: apply to the ANTA post by 4 November, or spend the week on the two bank postings instead?"' + (busy ? ' disabled' : '') + '>' + esc(S.draft.get(f.id) || '') + '</textarea>' +
      (busy ? '<p class="small inbox-busy"><span class="spin" aria-hidden="true"></span> <span data-counsel-busy>The member is deliberating…</span></p>' :
        '<p class="cw-actions"><button class="btn" type="submit"' + (S.live !== 'on' ? ' disabled title="Needs the Claude app"' : '') + '>' + esc(label) + '</button>' + (S.live === 'off' ? ' <button type="button" class="btn ghost" data-counsel-chat="' + esc(place.id) + '">Ask in the chat instead</button> <span class="small muted">This view has no connection to Claude.</span>' : '') + '</p>') +
      (S.local ? '<p class="small muted">No database in this view: the ledger is kept for this visit only.</p>' : '') + '</form>';
  }
  function ledgerPanel(place, f) {
    const L = ledger(f.id).entries.slice().reverse();
    const fs = followStats(f.id);
    let h = '<section class="panel counsel-box blk" id="s-counsel"><h2>Counsel <span class="h2-n">' + L.length + ' in the ledger' + (fs.followed ? ' · ' + fs.followed + ' followed' : '') + '</span></h2>';
    h += '<p class="fam-intro">' + (f.id === 'fable' ? 'Put a decision to the codex and it answers in its own voice; the ledger keeps what it recommended.' : lensOf(f) && lensOf(f).voice === 'voice' ? 'Put a decision to the chamber; Alexander answers from both halls, and the ledger keeps his ruling.' : 'Put a decision to the cell; the record’s reading comes back as a stance, a ruling, reasons, risks and the questions the member would ask. The ledger keeps every one.') + '</p>';
    h += askBox(place, f);
    if (!S.loaded && S.owner && !S.local) h += '<p class="muted small">Opening the ledger…</p>';
    else if (!L.length) h += '<p class="muted">The ledger is empty. Nothing has been put to this cell yet.</p>';
    else h += '<div class="ledger">' + L.map((e) => entryHtml(e, f.id)).join('') + '</div>';
    return h + '</section>';
  }
  /* the league chip, the region chip for a seat abroad, and CRETD-D's one-line reasons (lw: why this league; rgw: how the seat reaches Moldova) */
  function leagueLine(c) {
    const chips = [];
    if (LEAGUES[c.league]) chips.push('<span class="chip league league-' + esc(String(c.league).toLowerCase()) + '" title="' + esc(c.lw || LEAGUES[c.league]) + '">' + esc(LEAGUES[c.league]) + '</span>');
    const sr = seriesOf(c);
    chips.push('<span class="chip series series-' + esc(sr.id) + '" title="' + esc(sr.why + (sr.unsure ? ' (unsure)' : '')) + '">' + esc(seriesName(sr.id)) + (sr.unsure ? ' ?' : '') + '</span>');
    if (isAbroad(c)) chips.push('<span class="chip region" title="' + esc(REGION_WORDS[c.region] || 'A seat outside Moldova') + '">' + esc(REGIONS[c.region] || c.region || 'Abroad') + '</span>');
    return (chips.length ? '<p class="city-chips">' + chips.join(' ') + '</p>' : '') + (c.lw ? '<p class="city-lw small muted">' + esc(c.lw) + '</p>' : '') + (c.rgw ? '<p class="city-lw small muted">' + esc(c.rgw) + '</p>' : '');
  }
  function cityCard(c) {
    const st = stageOf(c); const d = cityDue(c); const cov = coverOf(c);
    const dueText = d ? (d.closed ? 'closed' : (() => { if (d.ms < Date.now()) return 'passed'; /* 3.0.3: whole calendar days in Chișinău time (UTC+2), so 3 Nov, 4 Nov and 5 Nov read 2, 3 and 4 days */ const days = calDays(d.ms); return days === 0 ? 'today' : days + ' d left'; })()) : '';
    const dueCls = d && !d.closed ? (() => { if (d.ms < Date.now()) return 'due-past'; const days = calDays(d.ms); return days < 2 ? 'due-burn' : days < 7 ? 'due-near' : ''; /* 3.0.5: the colour counts the same calendar days as the words */ })() : '';
    return '<article class="city stage-' + esc(st) + '" data-city="' + esc(c.id) + '"><div class="city-top"><span class="city-kind">' + esc(c.kind === 'state' ? 'State post' : 'Posting') + (c.security ? ' · security' : '') + (c.src === 'linkedin' ? ' · LinkedIn' : '') + '</span><span class="stage stage-' + esc(st) + '">' + esc(STAGES.find((s) => s.id === st).name) + '</span></div>' +
      '<h4 class="city-name">' + esc(c.company) + '</h4><p class="city-title">' + esc(c.title) + '</p>' + leagueLine(c) +
      '<p class="city-meta">' + (c.deadline ? '<span class="' + dueCls + '">' + (d ? 'Deadline ' : 'Note: ') + esc(c.deadline) + (dueText ? ' · ' + dueText : '') + '</span>' : c.posted ? '<span>' + (/undated/i.test(c.posted) ? 'Undated' : 'Posted ' + esc(c.posted)) + '</span>' : '') + (c.pay ? '<span>' + esc(c.pay) + '</span>' : c.est ? '<span>est. ' + esc(Number(c.est).toLocaleString('en-US')) + ' MDL</span>' : '') + (c.mode ? '<span>' + esc(c.mode) + '</span>' : '') + '</p>' +
            (!isAbroad(c) && cov.found ? '<p class="city-cov' + (cov.thin ? ' thin' : '') + '" title="' + esc(cov.fam.name) + ': ' + cov.hit + ' of ' + cov.found + ' skill terms on the two shelf books' + (cov.gaps.length ? '. Gaps: ' + cov.gaps.map((g) => g.name).join(', ') : '') + '">' + cov.hit + ' of ' + cov.found + ' term' + (cov.found === 1 ? '' : 's') + ' on the shelf' + (cov.thin ? ' · thin' : '') + '</p>' : '') +
      '<p class="city-actions">' + (c.url ? '<a class="btn ghost small" href="' + esc(c.url) + '" target="_blank" rel="noopener">Open the ad ↗</a>' : '') + (S.owner ? '<select class="stage-pick" data-city-stage="' + esc(c.id) + '" aria-label="Stage of ' + esc(c.company) + '">' + STAGES.map((s) => '<option value="' + s.id + '"' + (s.id === st ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select>' : '') + '</p></article>';
  }
  function mapPanel(place) {
    const n = counts(); const all = cities(); const m = mapDoc();
    let h = '<section class="panel citymap blk" id="s-map"><h2>The map of the campaign <span class="h2-n">' + all.length + ' cities</span></h2>';
    h += '<p class="fam-intro">Every posting of CRETD-D is a city, taken or not. Stages come from the CRETD-D save file you bring here, or are set by hand on each card. Snapshot of the postings: ' + esc(D.source || '') + (D.asOf ? ', researched ' + esc(D.asOf) : '') + '.</p>';
    h += '<div class="stage-counts">' + STAGES.map((s) => '<span class="stage stage-' + s.id + '" title="' + esc(s.hint) + '">' + esc(s.name) + ' <b>' + n[s.id] + '</b></span>').join('') + '</div>';
    const sc = seriesCounts(); const unsureAll = SERIES.reduce((k, x) => k + sc[x.id].unsure, 0);
    h += '<p class="series-counts"><b>Series:</b> ' + SERIES.map((x) => '<span title="' + esc(x.hint) + '">' + esc(x.name) + ' ' + sc[x.id].all + (sc[x.id].all ? ' <span class="muted">(' + sc[x.id].open + ' open' + (sc[x.id].taken ? ', ' + sc[x.id].taken + ' taken' : '') + ')</span>' : '') + '</span>').join(' · ') + '. <span class="muted">' + unsureAll + ' placement' + (unsureAll === 1 ? ' is' : 's are') + ' unsure (a company size, visa help or the seat is missing); a “?” on a card marks one.</span></p>';
    const sn = soon(7);
    if (sn.length) h += '<p class="map-soon"><b>Deadlines within seven days:</b> ' + sn.map((x) => esc(x.c.company) + ' (' + esc(x.c.deadline) + ')').join(' · ') + '.</p>';
    if (S.owner) {
      h += '<div class="map-import"><label class="btn ghost inbox-pick"><input type="file" accept="application/json,.json" data-counsel-import>Bring the CRETD-D save file</label>' +
        (m.imported ? '<span class="small muted">Last brought ' + esc(when(m.imported.at)) + (m.imported.version ? ' · CRETD-D ' + esc(m.imported.version) : '') + ' · ' + m.imported.matched + ' matched' + (m.imported.unmatched.length ? ' · ' + m.imported.unmatched.length + ' not on the map: ' + esc(m.imported.unmatched.join('; ')) : '') + '</span>' : '<span class="small muted">Export it from CRETD-D’s Situation Room, then choose it here; the Pipeline stages become the stages of the cities.</span>') + '</div>';
    }
    const groups = new Map();
    const ABROAD = 'Seats abroad';
    for (const c of all) { const k = isAbroad(c) ? ABROAD : famName(c); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(c); }
    /* 3.0.4: the Moldovan doctrines first (largest first), the seats abroad after them */
    const order = Array.from(groups.keys()).sort((a, b) => (a === ABROAD) - (b === ABROAD) || groups.get(b).length - groups.get(a).length);
    for (const k of order) {
      const list = groups.get(k).slice().sort((a, b) => { const da = cityDue(a), db = cityDue(b); const ta = da && !da.closed ? da.ms : Infinity, tb = db && !db.closed ? db.ms : Infinity; return ta - tb; });
      // each doctrine folds: open on a wide screen, closed on the phone so the map stays one screen long
      const inPlay = list.filter((c) => !['unseen', 'razed'].includes(stageOf(c))).length;
      h += '<details class="satrapy"' + (phone() ? '' : ' open') + '><summary><h3>' + esc(k) + ' <span class="h2-n">' + list.length + (inPlay ? ' · ' + inPlay + ' in play' : '') + '</span></h3></summary>' + (k === ABROAD ? '<p class="fam-intro small">Postings outside Moldova: remote seats, seats in other countries and the US corridor. They are not counted in the shelf coverage or in the gaps. Region chips: ' + Object.keys(REGION_WORDS).map((k) => esc(REGION_WORDS[k])).join('; ') + '.</p>' : '') + '<div class="cities">' + list.map(cityCard).join('') + '</div></details>';
    }
    return h + '</section>';
  }
  function kudoPanel(place) {
    const gaps = gapTable();
    let h = '<section class="panel kudo-window blk" id="s-kudo"><h2>The window on the Kudo Hall</h2>';
    h += '<p class="fam-intro">The unknown side, seen from this chamber alone: what the open cities ask for that the two shelf books of their family do not teach, and the facts the campaign still has to verify.</p>';
    if (D.coverage && D.coverage.measured) h += '<p class="small muted cov-line">Measured on the ' + D.coverage.measured + ' open Moldovan postings of the snapshot: the shelf books cover ' + String(D.coverage.avgPct).replace(/\.0$/, '') + '% of their skill terms on average, and ' + D.coverage.at80 + ' reach 80% or more. The ' + D.coverage.foreignExcluded + ' seats abroad are left out, as in CRETD-D.</p>';
    h += '<h3>Gaps across the open cities <span class="h2-n">' + (gaps.length > 12 ? '12 of ' + gaps.length + ' terms shown' : gaps.length + (gaps.length === 1 ? ' term' : ' terms')) + '</span></h3>';
    h += gaps.length ? '<ul class="gap-list">' + gaps.slice(0, 12).map((g) => '<li><b>' + esc(g.t.name) + '</b> <span class="muted">· ' + g.n + ' open posting' + (g.n === 1 ? '' : 's') + '</span>' + (g.t.suggest ? '<span class="gap-src">third source: ' + esc(g.t.suggest.t) + ', ' + esc(g.t.suggest.a) + ' (' + esc(g.t.suggest.p) + ')</span>' : (g.t.books || []).length ? '<span class="gap-src">on your shelf, another family’s book: ' + esc(g.t.books.map((b) => (D.tomes.find((t) => t.id === b) || {}).short || b).join(', ')) + '</span>' : '<span class="gap-src">no source on your shelf yet</span>') + '</li>').join('') + '</ul>' : '<p class="muted">No gaps: every term the open cities name is taught on the shelf.</p>';
    h += '<h3>Still to verify <span class="h2-n">' + (D.verify || []).length + '</span></h3><ul class="verify-list">' + (D.verify || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    const sc = seriesCounts(); const pt = pothosSeries();
    h += '<h3>The series <span class="h2-n">' + SERIES.length + ' rungs</span></h3><ul class="series-list">' + SERIES.map((x) => '<li><b>' + esc(x.name) + '</b> — ' + sc[x.id].all + ' ' + (sc[x.id].all === 1 ? 'city' : 'cities') + ', ' + sc[x.id].open + ' open' + (sc[x.id].taken ? ', ' + sc[x.id].taken + ' taken' : ', none taken') + '<span class="muted"> · ' + esc(x.hint) + '</span></li>').join('') + '</ul>' +
      '<p class="far-line">' + (pt ? 'The highest rung with no city taken is ' + esc(pt.series.name) + '. Beyond and Serie A upper are the other part of the world, and it is where Alexander looks.' : 'A city is taken on every rung.') + '</p>';
    const kudo = C.place(place.window || 'kudo-hall');
    if (kudo && S.owner) h += '<p class="cw-actions"><a class="btn ghost" href="#/library/' + esc(kudo.id) + '">Through the window: the Kudo Hall</a></p>';
    return h + '</section>';
  }
  function seatsPanel(place) {
    const cells = (place.children || []).map((c) => C.place(c.id)).filter(Boolean);
    if (!cells.length) return '';
    return '<section class="panel seats blk"><h2>The board <span class="h2-n">' + (1 + cells.filter((c) => c.monk).length) + ' of 7 seats</span></h2><p class="fam-intro">Alexander holds the chamber; the members keep cells off it.' + (cells.some((c) => c.vacant) ? ' ' + (cells.filter((c) => c.vacant).length === 1 ? 'One cell stands' : cells.filter((c) => c.vacant).length + ' cells stand') + ' vacant for the member' + (cells.filter((c) => c.vacant).length === 1 ? '' : 's') + ' still to be named.' : '') + '</p>' + standingsHtml() + '</section>';
  }
  /* the standings (3.1.0): how often the keeper went with each member; owner only, like the chamber itself */
  function standingsHtml() {
    if (!S.owner) return '';
    const rows = standings();
    if (!rows.length) return '';
    return '<div class="standings-wrap"><h3>Standings</h3><table class="standings"><thead><tr><th>Rank</th><th>Member</th><th>Put to him</th><th>Followed</th><th>Set aside</th><th>Score</th><th>Net</th><th>League</th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr data-member="' + esc(r.id) + '"><td data-l="Rank">' + (i + 1) + '</td><td data-l="Member">' + (r.place ? '<a href="#/library/' + esc(r.place) + '">' + esc(r.name) + '</a>' : esc(r.name)) + '</td><td data-l="Put to him">' + r.put + '</td><td data-l="Followed">' + r.followed + '</td><td data-l="Set aside">' + r.aside + '</td><td data-l="Score"><b>' + r.score + '</b>' + (r.put ? ' <span class="muted">(' + Math.round(100 * r.share) + '%)</span>' : '') + '</td><td data-l="Net">' + (r.net > 0 ? '+' : '') + r.net + '</td><td data-l="League">' + (r.league ? esc(r.league) : '—') + '</td></tr>').join('') +
      '</tbody></table><p class="small muted">The score is the number of rulings you went with; the share breaks a tie, then the seat. Net is the rulings you went with minus those you set aside. Struck rulings do not count. Leagues come in a later release.</p></div>';
  }
  /* part "head" goes above the cells of the chamber (the seats), part "body" below them; no part means both */
  function panelHtml(place, part) {
    if (!place) return '';
    if (place.vacant) return part === 'head' ? '' : '<section class="panel vacant blk"><h2>Vacant</h2><p>' + esc(place.blurb || 'Kept for a member still to be named.') + '</p>' + (S.owner ? '<p class="small muted">Name the member in the chat and the cell is raised in the next release.</p>' : '') + '</section>';
    const f = place.monk ? C.get(place.monk) : null;
    if (!f || !place.counsel) return '';
    let h = '';
    if (part !== 'body' && place.map) h += seatsPanel(place);
    if (part === 'head') return h;
    if (place.map) h += mapPanel(place) + kudoPanel(place);
    h += recordPanel(f) + lensPanel(f, true) + ledgerPanel(place, f);
    return h;
  }
  /* the line under a cell's card in the chamber: the ledger count, or "vacant" */
  function cardLine(place) {
    if (place.vacant) return 'vacant';
    const n = ledger(place.monk).entries.filter((e) => !e.struck).length;
    const k = followStats(place.monk).followed;
    return n + ' in the ledger' + (k ? ' · ' + k + ' followed' : '');
  }
  function doorHtml(place) {
    if (!place || !place.door) return '';
    const target = place.door;
    const pack = C.pack(target.lore);
    const there = pack && pack.library ? (C.places(target.lore).find((p) => p.id === target.place) || null) : null;
    return '<section class="panel door blk"><h2>A plain door</h2><p>' + esc(place.blurb || '') + '</p>' +
      (there ? '<p class="cw-actions"><button type="button" class="btn" data-door-lore="' + esc(target.lore) + '" data-door-place="' + esc(target.place) + '">Pass the door → ' + esc(there.name) + ', ' + esc(pack.name) + '</button></p>' : '<p class="muted small">The door is bricked up: the chamber it opens on is not in this codex.</p>') + '</section>';
  }
  function passDoor(lore, place) {
    if (!C.pack(lore)) return;
    if (C.lore !== lore) V.switchLore(lore);
    setTimeout(() => { location.hash = '#/library/' + place; }, 30);
  }
  function refreshView() {
    const cur = V.current ? V.current() : null;
    if (!cur) return;
    if ((cur.name === 'library' || cur.name === 'doc') && window.CodexLibrary) window.CodexLibrary.refresh();
    else if (cur.name === 'entry' && V.render) V.render(true);
  }

  /* ------------------------------ wiring ------------------------------ */
  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest && ev.target.closest('form[data-counsel-form]');
    if (!form) return;
    ev.preventDefault();
    const place = C.place(form.dataset.counselForm);
    const text = form.decision ? form.decision.value : '';
    if (place && place.monk) S.draft.set(place.monk, text);
    ask(place, text, form.querySelector('button[type=submit]'));
  });
  document.addEventListener('input', (ev) => {
    const ta = ev.target.closest && ev.target.closest('form[data-counsel-form] textarea');
    if (!ta) return;
    const place = C.place(ta.closest('form').dataset.counselForm);
    if (place && place.monk) S.draft.set(place.monk, ta.value);
  });
  document.addEventListener('change', async (ev) => {
    const sel = ev.target.closest && ev.target.closest('[data-city-stage]');
    if (sel) {
      if (!S.owner) return;
      const m = mapDoc(); const st = STAGES.find((s) => s.id === sel.value);
      if (!st) return;
      m.cities[sel.dataset.cityStage] = { stage: st.id, at: new Date().toISOString(), note: '', by: 'hand' };
      await write('map', m); refreshView(); return;
    }
    const file = ev.target.closest && ev.target.closest('input[data-counsel-import]');
    if (file && file.files && file.files[0]) {
      if (!S.owner) return;
      const f = file.files[0];
      if (f.size > 2 * 1024 * 1024) { V.toast('That file is larger than 2 MB; it is not a CRETD-D save.'); return; }
      const text = await f.text();
      const r = importSave(text, f.name);
      V.toast(r.error ? r.error : r.matched + ' of ' + r.total + ' pipeline card' + (r.total === 1 ? '' : 's') + ' placed on the map' + (r.unmatched.length ? '; ' + r.unmatched.length + ' not on the map.' : '.'));
      refreshView();
    }
  });
  document.addEventListener('click', async (ev) => {
    const t = ev.target.closest ? ev.target : null;
    if (!t) return;
    const door = t.closest('[data-door-lore]');
    if (door) { passDoor(door.dataset.doorLore, door.dataset.doorPlace); return; }
    const chat = t.closest('[data-counsel-chat]');
    if (chat) { const place = C.place(chat.dataset.counselChat); const f = place && place.monk ? C.get(place.monk) : null; const text = f ? (S.draft.get(f.id) || '') : ''; await V.askClaude('Put this decision to the ' + (f ? plain(f.name) : 'board') + ' cell of the Resonance Codex (lore “resonance”, ledger private/resonance/counsel/' + (f ? f.id : '') + ') and write the record’s reading into its ledger:\n' + text, chat.closest('.panel') || chat, chat); return; }
    const arm = t.closest('[data-counsel-arm]');
    if (arm) { S.armed = arm.dataset.counselArm; refreshView(); return; }
    const fol = t.closest('[data-counsel-follow]');
    if (fol) { if (!S.owner) return; const L = ledger(fol.dataset.counselMonk); const e = L.entries.find((x) => x.id === fol.dataset.counselFollow); if (e && !e.struck) { e.followed = e.followed ? null : { at: new Date().toISOString() }; if (e.followed) e.aside = null; await write(L.monk, L); } refreshView(); return; }
    const asd = t.closest('[data-counsel-aside]');
    if (asd) { if (!S.owner) return; const L = ledger(asd.dataset.counselMonk); const e = L.entries.find((x) => x.id === asd.dataset.counselAside); if (e && !e.struck) { e.aside = e.aside ? null : { at: new Date().toISOString() }; if (e.aside) e.followed = null; await write(L.monk, L); } refreshView(); return; }
    const strike = t.closest('[data-counsel-strike]');
    if (strike) { const L = ledger(strike.dataset.counselMonk); const e = L.entries.find((x) => x.id === strike.dataset.counselStrike); if (e) { e.struck = !e.struck; if (e.struck) { e.followed = null; e.aside = null; } await write(L.monk, L); } refreshView(); return; }
    const del = t.closest('[data-counsel-del]');
    if (del) { const L = ledger(del.dataset.counselMonk); L.entries = L.entries.filter((x) => x.id !== del.dataset.counselDel); S.armed = null; await write(L.monk, L); refreshView(); return; }
    if (S.armed && !t.closest('.le-actions')) { S.armed = null; }
  });

  window.CodexCounsel = { panelHtml, doorHtml, lensPanel, recordPanel, cardLine, passDoor, state: () => S, _test: { sanitizeEntry, sanitizeLedger, sanitizeMap, importSave, coverOf, famOf, dueOf, stageOf, counts, gapTable, matchCity, prompt,
    buildEntry, sanitizeInner, sanitizePull, sanitizeWindow, trimLedger, bytesOf, seriesOf, seriesCounts, pothosSeries, sizeOf, levelOf, trustFilter, trustBreak, SERIES, windows, checkWindow, followStats, rankRows, standings, alexAsks, engineText, tableText, entryHtml, isoDay } };
  connect();
})();
