// 3.1.0 — sample answers, in two steps.
//   node checks/make_prompts.js gen  <dir>   writes <dir>/prompts/<member>-<A|B|X>.txt (the exact text the page sends)
//   node checks/make_prompts.js build <dir>  reads <dir>/answers/<member>-<A|B|X>.json (what the model answered), runs each through
//                                            the page's own code path (buildEntry: sanitizer, trust rule, window check, question limit)
//                                            and writes <dir>/sample-answers.md
const path = require('path'); const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
global.window = global;
global.document = { addEventListener() {}, querySelector() { return null; } };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
require(path.join(ROOT, 'codex/lores/iovu-data.js'));
require(path.join(ROOT, 'codex/lores/iovu-windows.js'));
const D = window.IOVU_DATA; const reg = new Map(); const places = new Map();
window.Codex = { lore: 'resonance', get: (id) => reg.get(id) || null, register: (f) => reg.set(f.id, f),
  reindexPlaces() { const walk = (list) => { for (const p of list || []) { places.set(p.id, p); walk(p.children); } }; walk(window.CODEX_LORES.resonance.library.places); },
  place: (id) => places.get(id) || null, places: () => Array.from(places.values()), pack: () => ({ context: 'CONTEXT', name: 'Resonance Codex', library: {} }) };
window.CodexView = { esc, toast() {}, current() { return null; }, switchLore() {}, askClaude() {}, render() {} };
window.CODEX_LORES = { resonance: { library: { places: [{ id: 'araki-hall', children: [] }] } }, iovu: { families: D.families } };
require(path.join(ROOT, 'codex/lores/iovu-board.js'));
require(path.join(ROOT, 'codex/counsel.js'));
const T = window.CodexCounsel._test;
const DEC = {
  A: 'Send the ANTA application today with my CV as it is, or first rewrite the CV summary for the National Bank post that closes on 5 November?',
  B: 'Study the skill gaps the map shows and send one US application first, or keep applying to more Chișinău postings?',
  X: 'A company offers me a signing bonus and a relocation loan to move abroad. Should I sign the loan agreement as written?',
};
const members = window.CODEX_BOARD.members;
const jobs = [];
for (const id of members) for (const k of (id === 'epstein' ? ['A', 'B', 'X'] : ['A', 'B'])) jobs.push([id, k]);
const [mode, dir] = [process.argv[2], path.resolve(process.argv[3] || '.')];
if (mode === 'gen') {
  fs.mkdirSync(dir + '/prompts', { recursive: true });
  for (const [id, k] of jobs) { const f = reg.get(id); fs.writeFileSync(`${dir}/prompts/${id}-${k}.txt`, T.prompt(f, window.Codex.place(f.place), DEC[k])); }
  console.log(jobs.length + ' prompts in ' + dir + '/prompts');
} else if (mode === 'build') {
  let md = '# Sample answers, Codex 3.1.0\n\nEach answer was written by the model from the exact prompt the page sends, then passed through the page\'s own code (sanitizer, trust rule, window check, question limit). Empty ledgers and empty map, so this is the first-use answer.\n\n';
  const allowed = new Set(T.windows ? T.windows().map((w) => w.date) : []);
  for (const [id, k] of jobs) {
    const f = reg.get(id); const file = `${dir}/answers/${id}-${k}.json`;
    md += `## ${f.name} · decision ${k}\n\n> ${DEC[k]}\n\n`;
    if (!fs.existsSync(file)) { md += '(no answer file)\n\n'; continue; }
    let r; try { r = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { md += '(answer was not valid JSON)\n\n'; continue; }
    const nAsk = f.engine && f.engine.veto ? 3 : 4;
    const e = T.buildEntry(f, r, DEC[k], allowed, nAsk);
    if (!e) { md += '(page would refuse this answer)\n\n'; continue; }
    const v = e.verdict;
    md += `**Stance:** ${v.stance}\n\n**Ruling:** ${v.ruling}\n\n**Reasons**\n\n${v.reasons.map((x) => '- ' + x).join('\n')}\n\n`;
    if (v.risks.length) md += `**Risks**\n\n${v.risks.map((x) => '- ' + x).join('\n')}\n\n`;
    if (v.asks.length) md += `**Would ask**\n\n${v.asks.map((x) => '- ' + x).join('\n')}\n\n`;
    if (v.check.length) md += `**Check**\n\n${v.check.map((x) => '- ' + x).join('\n')}\n\n`;
    if (v.pull) md += `**Pull** (${v.pull.shown ? 'shown' : 'hidden by his tell'}): ${v.pull.text}\n\n`;
    if (v.window) md += `**Window:** ${v.window.date}: ${v.window.text}\n\n`;
    if (v.inner) md += `**Inner note (owner only):** moved ${JSON.stringify(v.inner.moved)}; vetoed ${JSON.stringify(v.inner.vetoed)}; dilemma: ${v.inner.dilemma || '-'}${v.inner.dropped ? '; ' + v.inner.dropped : ''}\n\n`;
    md += `**Ledger line:** ${v.record}\n\n`;
  }
  fs.writeFileSync(dir + '/sample-answers.md', md); console.log('wrote ' + dir + '/sample-answers.md');
}
