// Builds codex/lores/iovu-data.js from the CRETD-D data files: a dated snapshot of the campaign the Book of Iovu reads.
// Usage: node gen_iovu_data.js [CRETD-D data dir] [output file]   (defaults: /home/claude/cretd/data/, /home/claude/codex/codex/lores/iovu-data.js)
// 3.0.4: carries league/region per posting, each book's own CHECK IN BOOK warning, merges twin rows by ad URL, measures book coverage over Moldovan postings only.
const fs = require('fs');
global.window = {};
const CR = (process.argv[2] || '/home/claude/cretd/data/').replace(/\/?$/, '/');
const OUT = process.argv[3] || '/home/claude/codex/codex/lores/iovu-data.js';
for (const f of ['doctrines.js', 'books.js', 'coverage.js', 'theatre.js', 'version.js']) require(CR + f);
const W = global.window;
const slug = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-+|-+$/g, '');
const normUrl = (u) => String(u || '').trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
const FAM = { py: 'python', pyweb: 'python', php: 'php', phpfw: 'php', go: 'python', jvm: 'python', js: 'python', k8s: 'k8s', ctr: 'k8s', helm: 'k8s', gitops: 'k8s', iac: 'k8s', cicd: 'k8s', obs: 'k8s', cloud: 'k8s', rel: 'k8s', dist: 'python', mq: 'python', db: 'python', api: 'python', data: 'mlops', mlops: 'mlops', llm: 'mlops', appsec: 'appsec', ir: 'appsec', grc: 'command', ot: 'appsec', linux: 'k8s', lead: 'lead', arch: 'lead', code: 'php', dr: 'k8s', cost: 'k8s', dom: 'uncharted' };
// each book carries its own CHECK IN BOOK warning from CRETD-D (b.verify); the generic line is only the fallback
const tomes = W.BOOKS.map((b) => ({
  id: b.id, short: b.author.split(' and ')[0].split(' ').slice(-1)[0], title: b.title, authors: b.author, publisher: [b.pub, b.ed, b.year].filter(Boolean).join(', '), pages: '',
  sectionsMapped: false, numbering: 'printed', sources: [], notes: [b.verify || 'Chapter list written from knowledge of this edition, not from a copy in hand: CHECK IN BOOK.', b.why].filter(Boolean),
  doctrine: b.doctrine,
  chapters: b.chapters.map((c) => ({ num: String(c.n), title: c.t, pages: '', blurb: c.b, sections: [] })),
}));
const families = W.DOCTRINES.map((d) => ({ id: d.id, name: d.name, hint: d.slogan || d.thesis || '', code: d.code, medal: d.medal, book: d.book })).concat([{ id: 'uncharted', name: 'Uncharted', hint: 'Skill terms not placed under a doctrine yet.' }]);
const keywords = W.COVERAGE.terms.map((t) => ({ id: t.k, name: t.label, re: t.re, books: t.books, family: FAM[t.k] || 'uncharted', suggest: W.COVERAGE.suggest[t.k] || null }));

// --- book coverage, the same method as CRETD-D's app.js famOf/coverOf ---
const C = W.COVERAGE;
const terms = C.terms.map((t) => Object.assign({}, t, { rx: new RegExp(t.re, 'i') }));
function famOf(v) {
  const r = v.role || '', txt = (v.title || '') + ' ' + (v.stack || '');
  let id = 'ops';
  if (/^head_|^cto$/.test(r)) id = 'lead';
  else if (/^soc$|^sec_arch$/.test(r)) id = 'sec';
  else if (/^ml_/.test(r) || /data (engineer|scientist)/i.test(v.title || '')) id = 'ml';
  else if (/^architect$|^infra_arch$/.test(r)) id = 'arch';
  else if (/^backend/.test(r)) id = /kubernetes automation|platform engineering/i.test(v.title || '') ? 'ops' : (/\bphp\b/i.test(txt) ? 'php' : 'py');
  return C.families.find((f) => f.id === id);
}
function coverOf(v) {
  const txt = (v.title || '') + ' :: ' + (v.stack || '');
  const fam = famOf(v), found = terms.filter((t) => t.rx.test(txt));
  const hit = found.filter((t) => t.books.some((b) => fam.books.includes(b)));
  const gaps = found.filter((t) => !t.books.some((b) => fam.books.includes(b))).map((t) => t.label);
  return { family: fam.id, found: found.length, hit: hit.length, pct: found.length ? Math.round(100 * hit.length / found.length) : null, thin: found.length <= C.thin, gaps };
}

const seen = new Set();
const uid = (s) => { let id = slug(s) || 'city'; let n = 2; while (seen.has(id)) id = slug(s) + '-' + n++; seen.add(id); return id; };
const geo = (v) => ({ region: v.region || 'MD', foreign: (v.region || 'MD') !== 'MD', league: v.league || '', lw: v.lw || '', rgw: v.rgw || '' });
const priv = W.THEATRE.vacancies.map((v) => Object.assign({
  id: uid(v.company + ' ' + v.title), kind: 'private', company: v.company, title: v.title, posted: v.posted || '', url: v.url || '', li: v.li || '', pay: v.salary || '', est: v.est || 0, mode: v.mode || '', stack: v.stack || '', fit: v.fit || '',
  role: v.role || '', doctrines: v.doctrines || [], security: !!v.security, closed: v.closed || '', src: v.src || '',
}, geo(v)));
// a state post that is also on the private board is one city: matched by ad URL first, then by slug of institution+position
const cities = priv.slice();
const merged = [];
for (const p of W.THEATRE.state) {
  const key = slug(p.inst + ' ' + p.pos), nu = normUrl(p.url);
  const twin = cities.find((c) => (nu && normUrl(c.url) === nu) || (nu && c.li && normUrl(c.li) === nu) || c.id === key);
  if (twin) {
    twin.deadline = p.deadline || ''; twin.state = true; if (!twin.pay) twin.pay = p.pay || '';
    if (!twin.league && p.league) { twin.league = p.league; twin.lw = p.lw || ''; }
    if (/closed/i.test(p.deadline || '') && !twin.closed) twin.closed = p.deadline;
    merged.push(twin.company + ' / ' + twin.title); continue;
  }
  cities.push(Object.assign({
    id: uid(p.inst + ' ' + p.pos), kind: 'state', company: p.inst, title: p.pos, posted: '', url: p.url || '', li: '', pay: p.pay || '', est: 0, mode: 'Onsite, Chișinău', stack: p.req || '', fit: '', role: 'command', doctrines: ['command'], security: !!p.security, closed: /closed/i.test(p.deadline || '') ? p.deadline : '', deadline: p.deadline || '', src: 'cariere', state: true,
  }, geo(p)));
}
// an ad dated long before the research that no list refreshed is flagged, not hidden: the user decides
const asOfYear = (String(W.THEATRE.asOf || '').match(/\d{4}/) || [''])[0];
cities.forEach((c) => {
  if (!c.closed && c.kind === 'private' && c.posted && asOfYear && /\b(Jan|Feb|Mar|Apr)\w*\s+\d{4}|\d{1,2}\s+(Jan|Feb|Mar|Apr)\w*\s+\d{4}/.test(c.posted) && !/refreshed/i.test(c.posted)) c.stale = 'Ad dated ' + c.posted + '; not seen refreshed. Confirm it is still open before counting it.';
});
// coverage: Moldovan open postings only (foreign leadership ads are marked and left out, as CRETD-D's Books table does)
cities.forEach((c) => {
  if (c.kind !== 'private') return;
  if (c.foreign) { c.cov = null; return; }
  c.cov = coverOf(c);
});
const live = cities.filter((c) => c.kind === 'private' && !c.closed && !c.foreign);
const measured = live.filter((c) => c.cov && c.cov.pct != null);
const coverage = {
  method: 'Same as CRETD-D ' + W.VERSION.v + ' app.js: two whole books per job family, measured per open Moldovan posting from its title and stack.',
  moldovanOpen: live.length, measured: measured.length,
  avgPct: measured.length ? Math.round(10 * measured.reduce((a, c) => a + c.cov.pct, 0) / measured.length) / 10 : 0,
  at80: measured.filter((c) => c.cov.pct >= 80).length,
  foreignExcluded: cities.filter((c) => c.foreign).length,
  staleCounted: live.filter((c) => c.stale).map((c) => c.company + ' / ' + c.title),
};
const byLeague = {}, byRegion = {};
cities.forEach((c) => { const l = c.league || '(none)'; byLeague[l] = (byLeague[l] || 0) + 1; byRegion[c.region] = (byRegion[c.region] || 0) + 1; });
const out = {
  asOf: W.THEATRE.asOf || '', source: 'CRETD-D ' + W.VERSION.v + ' (' + W.VERSION.date + ')', generated: new Date().toISOString().slice(0, 10),
  tomes, families, keywords, covFamilies: W.COVERAGE.families, thin: W.COVERAGE.thin, cities, coverage,
  verify: [
    'HG 760/2010 — the current text of the regulation on filling civil-service posts by competition (points 39–40 and 23 are cited from an older reading).',
    'Labour Code art. 258(1) — whether the owner–administrator of an SRL counts as a cumul for a civil servant.',
    'ASC director competition 2024 — the criteria of the 28 Dec 2023 announcement (the press says only “experience in cybersecurity”).',
    'US visa fees — the MRV $185/$205 and the $250 visa integrity fee as currently collected.',
  ],
  // counts are taken from the merged city list, not from the two source arrays
  campaign: { objective: 'A signed contract by 31 December 2026. January 2027 is the outer limit.', dday: '2026-12-01', outer: '2027-01-31', states: cities.filter((c) => c.state).length, vacancies: cities.filter((c) => c.kind === 'private').length, stateRowsInSource: W.THEATRE.state.length, vacancyRowsInSource: W.THEATRE.vacancies.length, mergedTwins: merged.length },
};
fs.writeFileSync(OUT, '/* The Book of Iovu — the campaign as the codex reads it: a dated snapshot of CRETD-D ' + W.VERSION.v + ' (books, doctrines, skill terms, the cities).\n   Generated ' + out.generated + ' by codex-build/gen_iovu_data.js from the CRETD-D data files; regenerate after a CRETD-D sweep, do not edit by hand. */\nwindow.IOVU_DATA = ' + JSON.stringify(out, null, 1) + ';\n');
console.log('tomes', tomes.length, 'families', families.length, 'keywords', keywords.length, 'cities', cities.length, 'bytes', fs.statSync(OUT).size);
console.log('kinds', cities.reduce((m, c) => (m[c.kind] = (m[c.kind] || 0) + 1, m), {}), 'state-flagged', out.campaign.states, 'merged', merged);
console.log('byLeague', byLeague, 'byRegion', byRegion);
console.log('coverage', JSON.stringify(coverage));
console.log('stale', cities.filter((c) => c.stale).map((c) => c.id));
